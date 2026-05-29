import SparePart from '../models/SparePart.js';

// @desc    Create a spare part
// @route   POST /api/spareparts
// @access  Protected
export const createSparePart = async (req, res) => {
  try {
    const { name, category, quantity, unitPrice } = req.body;

    if (!name || !category || quantity === undefined || unitPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide name, category, quantity and unitPrice' });
    }

    const qty = Number(quantity);
    const price = Number(unitPrice);

    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a valid non-negative number' });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Unit price must be a valid non-negative number' });
    }

    // Check if duplicate name already exists
    const duplicate = await SparePart.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'A spare part with this name already exists' });
    }

    const totalPrice = qty * price;

    const sparePart = await SparePart.create({
      name: name.trim(),
      category: category.trim(),
      quantity: qty,
      unitPrice: price,
      totalPrice,
    });

    res.status(201).json({ success: true, data: sparePart });
  } catch (error) {
    console.error('Create spare part error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all spare parts
// @route   GET /api/spareparts
// @access  Protected
export const getSpareParts = async (req, res) => {
  try {
    const spareParts = await SparePart.find().exec();
    res.status(200).json({ success: true, data: spareParts });
  } catch (error) {
    console.error('Get spare parts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
