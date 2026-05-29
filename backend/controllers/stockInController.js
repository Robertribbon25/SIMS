import StockIn from '../models/StockIn.js';
import SparePart from '../models/SparePart.js';

// @desc    Add a Stock In transaction
// @route   POST /api/stockin
// @access  Protected
export const createStockIn = async (req, res) => {
  try {
    const { sparePart, stockInQuantity, stockInDate } = req.body;

    if (!sparePart || stockInQuantity === undefined || !stockInDate) {
      return res.status(400).json({ success: false, message: 'Please provide sparePart, stockInQuantity and stockInDate' });
    }

    const qty = Number(stockInQuantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Stock In quantity must be greater than 0' });
    }

    // Process SparePart stock level adjustment
    const part = await SparePart.findById(sparePart);
    if (!part) {
      return res.status(404).json({ success: false, message: 'Reference spare part not found' });
    }

    // For real MongoDB, adjust the quantities. (For the mock database, db.js handled this, but doing it here guarantees compatibility!)
    part.quantity = Number(part.quantity) + qty;
    part.totalPrice = part.quantity * part.unitPrice;
    await part.save();

    const stockIn = await StockIn.create({
      sparePart,
      stockInQuantity: qty,
      stockInDate: new Date(stockInDate),
    });

    res.status(201).json({ success: true, data: stockIn });
  } catch (error) {
    console.error('Create Stock In error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Stock In transactions
// @route   GET /api/stockin
// @access  Protected
export const getStockIn = async (req, res) => {
  try {
    const stockInRecords = await StockIn.find().populate('sparePart').exec();
    res.status(200).json({ success: true, data: stockInRecords });
  } catch (error) {
    console.error('Get Stock In error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
