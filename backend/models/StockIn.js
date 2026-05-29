import mongoose from 'mongoose';

const StockInSchema = new mongoose.Schema({
  sparePart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SparePart',
    required: [true, 'Spare part reference is required'],
  },
  stockInQuantity: {
    type: Number,
    required: [true, 'Stock In quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  stockInDate: {
    type: Date,
    required: [true, 'Stock In date is required'],
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('StockIn', StockInSchema);
