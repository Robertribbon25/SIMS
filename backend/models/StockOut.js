import mongoose from 'mongoose';

const StockOutSchema = new mongoose.Schema({
  sparePart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SparePart',
    required: [true, 'Spare part reference is required'],
  },
  stockOutQuantity: {
    type: Number,
    required: [true, 'Stock Out quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  stockOutUnitPrice: {
    type: Number,
    required: [true, 'Stock Out unit price is required'],
  },
  stockOutTotalPrice: {
    type: Number,
    required: [true, 'Stock Out total price is required'],
  },
  stockOutDate: {
    type: Date,
    required: [true, 'Stock Out date is required'],
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
}, {
  timestamps: true,
});

// Calculate total price automatically before save for real MongoDB compatibility
StockOutSchema.pre('save', function(next) {
  this.stockOutTotalPrice = this.stockOutQuantity * this.stockOutUnitPrice;
  next();
});

export default mongoose.model('StockOut', StockOutSchema);
