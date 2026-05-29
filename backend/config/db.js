import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), './data');

// Reusable file storage helper for JSON fallback
function readCollection(name) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, `${name.toLowerCase()}s.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeCollection(name, data) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, `${name.toLowerCase()}s.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

let isUsingMock = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SIMS';
  try {
    mongoose.set('strictQuery', false);
    // 2 seconds timeout so we don't block the server starting if Mongo is not running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`✅ MongoDB connected successfully to ${mongoURI}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB connection to "${mongoURI}" failed: ${error.message}`);
    console.warn(`🔄 Falling back to a file-persisted JSON mock database inside the container...`);
    isUsingMock = true;
    setupMockMongoose();
  }
};

export const getDbStatus = () => {
  return {
    isUsingMock,
    mongoURI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SIMS',
  };
};

function setupMockMongoose() {
  mongoose.set('bufferCommands', false);
  
  // Hook the compiler so models are decorated immediately when compiled or loaded
  const originalModel = mongoose.model.bind(mongoose);
  
  mongoose.model = function(name, schema, collection) {
    const Model = originalModel(name, schema, collection);
    overrideModelMethods(Model, name);
    return Model;
  };

  // Also decorate any models that are already registered
  const modelNames = mongoose.modelNames();
  for (const modelName of modelNames) {
    const Model = mongoose.models[modelName];
    overrideModelMethods(Model, modelName);
  }
}

function overrideModelMethods(Model, modelName) {
  const collectionKey = modelName.toLowerCase();
  const generateId = () => new mongoose.Types.ObjectId().toString();

  Model.find = function(query = {}) {
    const execute = () => {
      let items = readCollection(collectionKey);
      
      // Smart and robust filtering supporting regex, operators ($gte, $lte, etc.)
      for (const key in query) {
        const val = query[key];
        if (val === undefined || val === null) continue;
        
        if (typeof val === 'object') {
          if (val.$regex) {
            const regex = typeof val.$regex === 'string' ? new RegExp(val.$regex, 'i') : val.$regex;
            items = items.filter(item => item[key] !== undefined && regex.test(item[key].toString()));
          } else if (val instanceof RegExp) {
            items = items.filter(item => item[key] !== undefined && val.test(item[key].toString()));
          } else {
            // Check for comparison operators ($gte, $lte, $gt, $lt)
            const hasOps = Object.keys(val).some(k => k.startsWith('$'));
            if (hasOps) {
              items = items.filter(item => {
                if (item[key] === undefined) return false;
                
                const itemTime = Date.parse(item[key]);
                const itemVal = isNaN(itemTime) ? item[key] : new Date(item[key]);
                
                let matches = true;
                if (val.$gte !== undefined) {
                  const compVal = val.$gte instanceof Date ? val.$gte : (isNaN(Date.parse(val.$gte)) ? val.$gte : new Date(val.$gte));
                  matches = matches && (itemVal >= compVal);
                }
                if (val.$lte !== undefined) {
                  const compVal = val.$lte instanceof Date ? val.$lte : (isNaN(Date.parse(val.$lte)) ? val.$lte : new Date(val.$lte));
                  matches = matches && (itemVal <= compVal);
                }
                if (val.$gt !== undefined) {
                  const compVal = val.$gt instanceof Date ? val.$gt : (isNaN(Date.parse(val.$gt)) ? val.$gt : new Date(val.$gt));
                  matches = matches && (itemVal > compVal);
                }
                if (val.$lt !== undefined) {
                  const compVal = val.$lt instanceof Date ? val.$lt : (isNaN(Date.parse(val.$lt)) ? val.$lt : new Date(val.$lt));
                  matches = matches && (itemVal < compVal);
                }
                return matches;
              });
            }
          }
        } else {
          // Standard primitive filter
          items = items.filter(item => {
            if (item[key] === undefined) return false;
            return item[key].toString() === val.toString();
          });
        }
      }

      // Populate sparePart
      if (collectionKey === 'stockin' || collectionKey === 'stockout') {
        const parts = readCollection('sparepart');
        items = items.map(item => {
          const partId = item.sparePart ? (item.sparePart._id || item.sparePart) : null;
          const matchedPart = parts.find(p => p._id.toString() === (partId ? partId.toString() : ''));
          return {
            ...item,
            sparePart: matchedPart ? JSON.parse(JSON.stringify(matchedPart)) : item.sparePart,
          };
        });
      }

      // Populate user
      if (collectionKey === 'stockout') {
        const users = readCollection('user');
        items = items.map(item => {
          const userId = item.user ? (item.user._id || item.user) : null;
          const matchedUser = users.find(u => u._id.toString() === (userId ? userId.toString() : ''));
          return {
            ...item,
            user: matchedUser ? { _id: matchedUser._id, username: matchedUser.username, email: matchedUser.email } : item.user,
          };
        });
      }

      return items;
    };

    const queryObj = {
      populate: function() { return this; },
      exec: async function() { return execute(); },
      then: function(resolve, reject) {
        return Promise.resolve(execute()).then(resolve, reject);
      },
      catch: function(reject) {
        return Promise.resolve(execute()).catch(reject);
      },
    };
    return queryObj;
  };

  Model.findOne = async function(query = {}) {
    let items = readCollection(collectionKey);
    for (const key in query) {
      const val = query[key];
      if (val === undefined || val === null) continue;
      
      if (typeof val === 'object') {
        if (val.$regex) {
          const regex = typeof val.$regex === 'string' ? new RegExp(val.$regex, 'i') : val.$regex;
          items = items.filter(item => item[key] !== undefined && regex.test(item[key].toString()));
        } else if (val instanceof RegExp) {
          items = items.filter(item => item[key] !== undefined && val.test(item[key].toString()));
        }
      } else {
        items = items.filter(item => {
          if (item[key] === undefined) return false;
          return item[key].toString() === val.toString();
        });
      }
    }
    return items[0] || null;
  };

  Model.findById = async function(id) {
    if (!id) return null;
    let items = readCollection(collectionKey);
    const item = items.find(i => i._id.toString() === id.toString());
    
    if (item && (collectionKey === 'stockin' || collectionKey === 'stockout')) {
      const parts = readCollection('sparepart');
      const partId = item.sparePart ? (item.sparePart._id || item.sparePart) : null;
      const matchedPart = parts.find(p => p._id.toString() === (partId ? partId.toString() : ''));
      item.sparePart = matchedPart ? JSON.parse(JSON.stringify(matchedPart)) : item.sparePart;
    }

    return item;
  };

  Model.create = async function(doc) {
    let items = readCollection(collectionKey);
    const newDoc = JSON.parse(JSON.stringify(doc));
    if (!newDoc._id) {
      newDoc._id = generateId();
    }
    
    // Auto-calculate totalPrice for SparePart if not present
    if (collectionKey === 'sparepart') {
      newDoc.totalPrice = Number(newDoc.quantity) * Number(newDoc.unitPrice);
    }
    // Auto-calculate stockOutTotalPrice for StockOut
    if (collectionKey === 'stockout') {
      newDoc.stockOutTotalPrice = Number(newDoc.stockOutQuantity) * Number(newDoc.stockOutUnitPrice);
    }

    newDoc.createdAt = new Date().toISOString();
    newDoc.updatedAt = new Date().toISOString();
    items.push(newDoc);
    writeCollection(collectionKey, items);
    
    return newDoc;
  };

  Model.deleteMany = async function() {
    writeCollection(collectionKey, []);
    return { deletedCount: 0 };
  };

  Model.insertMany = async function(arr) {
    let items = readCollection(collectionKey);
    const added = arr.map(doc => {
      const newDoc = JSON.parse(JSON.stringify(doc));
      if (!newDoc._id) {
        newDoc._id = generateId();
      }
      if (collectionKey === 'sparepart' && (!newDoc.totalPrice || newDoc.totalPrice === 0)) {
        newDoc.totalPrice = Number(newDoc.quantity) * Number(newDoc.unitPrice);
      }
      newDoc.createdAt = new Date().toISOString();
      newDoc.updatedAt = new Date().toISOString();
      return newDoc;
    });
    items.push(...added);
    writeCollection(collectionKey, items);
    return added;
  };

  Model.findByIdAndUpdate = async function(id, update, options = {}) {
    if (!id) return null;
    let items = readCollection(collectionKey);
    const index = items.findIndex(i => i._id.toString() === id.toString());
    if (index === -1) return null;
    
    const original = items[index];
    const updateObj = update.$set || update;
    
    if (collectionKey === 'stockout') {
      const qty = Number(updateObj.stockOutQuantity || original.stockOutQuantity);
      const price = Number(updateObj.stockOutUnitPrice || original.stockOutUnitPrice);
      updateObj.stockOutTotalPrice = qty * price;
    }

    const updatedData = { ...original, ...updateObj };
    updatedData.updatedAt = new Date().toISOString();
    items[index] = updatedData;
    writeCollection(collectionKey, items);
    return updatedData;
  };

  Model.findByIdAndDelete = async function(id) {
    if (!id) return null;
    let items = readCollection(collectionKey);
    const index = items.findIndex(i => i._id.toString() === id.toString());
    if (index === -1) return null;
    
    const removed = items.splice(index, 1)[0];
    writeCollection(collectionKey, items);

    return removed;
  };

  // Support prototype.save() for Model instances
  Model.prototype.save = async function() {
    let items = readCollection(collectionKey);
    const doc = this.toObject ? this.toObject() : JSON.parse(JSON.stringify(this));
    if (!doc._id) {
      doc._id = generateId();
    }
    doc.createdAt = new Date().toISOString();
    doc.updatedAt = new Date().toISOString();
    
    const index = items.findIndex(i => i._id.toString() === doc._id.toString());
    if (index !== -1) {
      items[index] = doc;
    } else {
      items.push(doc);
    }
    
    writeCollection(collectionKey, items);
    return doc;
  };
}
