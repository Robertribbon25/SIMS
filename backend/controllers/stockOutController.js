import StockOut from '../models/StockOut.js';
import SparePart from '../models/SparePart.js';

// @desc    Create a Stock Out transaction
// @route   POST /api/stockout
// @access  Protected
export const createStockOut = async (req, res) => {
  try {
    const { sparePart, stockOutQuantity, stockOutUnitPrice, stockOutDate } = req.body;

    if (!sparePart || stockOutQuantity === undefined || stockOutUnitPrice === undefined || !stockOutDate) {
      return res.status(400).json({ success: false, message: 'Please provide sparePart, stockOutQuantity, stockOutUnitPrice and stockOutDate' });
    }

    const qty = Number(stockOutQuantity);
    const unitPrice = Number(stockOutUnitPrice);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Stock Out quantity must be greater than 0' });
    }
    if (isNaN(unitPrice) || unitPrice < 0) {
      return res.status(400).json({ success: false, message: 'Unit price must be a non-negative number' });
    }

    const part = await SparePart.findById(sparePart);
    if (!part) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }

    // Check if enough stock exists
    if (part.quantity < qty) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Only ${part.quantity} remaining in inventory.` });
    }

    // Deduct stock
    part.quantity = Number(part.quantity) - qty;
    part.totalPrice = part.quantity * part.unitPrice;
    await part.save();

    const stockOutTotalPrice = qty * unitPrice;

    const stockOut = await StockOut.create({
      sparePart,
      stockOutQuantity: qty,
      stockOutUnitPrice: unitPrice,
      stockOutTotalPrice,
      stockOutDate: new Date(stockOutDate),
      user: req.user._id,
    });

    res.status(201).json({ success: true, data: stockOut });
  } catch (error) {
    console.error('Create Stock Out error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Stock Out transactions
// @route   GET /api/stockout
// @access  Protected
export const getStockOut = async (req, res) => {
  try {
    const stockOutRecords = await StockOut.find()
      .populate('sparePart')
      .populate('user')
      .exec();
    res.status(200).json({ success: true, data: stockOutRecords });
  } catch (error) {
    console.error('Get Stock Out error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a Stock Out transaction (Full CRUD constraint)
// @route   PUT /api/stockout/:id
// @access  Protected
export const updateStockOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { sparePart, stockOutQuantity, stockOutUnitPrice, stockOutDate } = req.body;

    const oldRecord = await StockOut.findById(id);
    if (!oldRecord) {
      return res.status(404).json({ success: false, message: 'Stock out record not found' });
    }

    let qty = stockOutQuantity !== undefined ? Number(stockOutQuantity) : oldRecord.stockOutQuantity;
    let unitPrice = stockOutUnitPrice !== undefined ? Number(stockOutUnitPrice) : oldRecord.stockOutUnitPrice;
    let date = stockOutDate ? new Date(stockOutDate) : oldRecord.stockOutDate;
    let targetPartId = sparePart || oldRecord.sparePart;

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Stock Out quantity must be greater than 0' });
    }

    // Check if spare part is changing
    const isPartChanged = targetPartId.toString() !== oldRecord.sparePart.toString();

    if (isPartChanged) {
      // 1. Restore stock to the OLD spare part
      const oldPart = await SparePart.findById(oldRecord.sparePart);
      if (oldPart) {
        oldPart.quantity = Number(oldPart.quantity) + Number(oldRecord.stockOutQuantity);
        oldPart.totalPrice = oldPart.quantity * oldPart.unitPrice;
        await oldPart.save();
      }

      // 2. Query and deduct stock from the NEW spare part
      const newPart = await SparePart.findById(targetPartId);
      if (!newPart) {
        return res.status(404).json({ success: false, message: 'New spare part not found' });
      }
      if (newPart.quantity < qty) {
        // Rollback old part stock first
        if (oldPart) {
          oldPart.quantity = Number(oldPart.quantity) - Number(oldRecord.stockOutQuantity);
          oldPart.totalPrice = oldPart.quantity * oldPart.unitPrice;
          await oldPart.save();
        }
        return res.status(400).json({ success: false, message: `Insufficient stock on the new part. Only ${newPart.quantity} units available.` });
      }
      newPart.quantity = Number(newPart.quantity) - qty;
      newPart.totalPrice = newPart.quantity * newPart.unitPrice;
      await newPart.save();
    } else {
      // Same spare part, check quantity differential
      const part = await SparePart.findById(oldRecord.sparePart);
      if (part) {
        const stockDiff = qty - Number(oldRecord.stockOutQuantity);
        if (stockDiff !== 0) {
          if (part.quantity < stockDiff) {
            return res.status(400).json({ success: false, message: `Insufficient stock. Changing quantity requires ${stockDiff} more units, but only ${part.quantity} are in stock.` });
          }
          part.quantity = Number(part.quantity) - stockDiff;
          part.totalPrice = part.quantity * part.unitPrice;
          await part.save();
        }
      }
    }

    const stockOutTotalPrice = qty * unitPrice;

    const updatedRecord = await StockOut.findByIdAndUpdate(
      id,
      {
        sparePart: targetPartId,
        stockOutQuantity: qty,
        stockOutUnitPrice: unitPrice,
        stockOutTotalPrice,
        stockOutDate: date,
        user: req.user._id,
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedRecord });
  } catch (error) {
    console.error('Update Stock Out error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a Stock Out transaction (Full CRUD constraint)
// @route   DELETE /api/stockout/:id
// @access  Protected
export const deleteStockOut = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await StockOut.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Stock out record not found' });
    }

    // Restore stock to the original spare part
    const part = await SparePart.findById(record.sparePart);
    if (part) {
      part.quantity = Number(part.quantity) + Number(record.stockOutQuantity);
      part.totalPrice = part.quantity * part.unitPrice;
      await part.save();
    }

    await StockOut.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Stock out record deleted and stock restored successfully' });
  } catch (error) {
    console.error('Delete Stock Out error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
