import mongoose from 'mongoose';

const SparePartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Spare part name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    default: 0,
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    default: 0,
  },
}, {
  timestamps: true,
});

// Pre-save hook to calculate total price for real MongoDB compatibility
SparePartSchema.pre('save', function(next) {
  this.totalPrice = this.quantity * this.unitPrice;
  next();
});

export default mongoose.model('SparePart', SparePartSchema);
