import SparePart from '../models/SparePart.js';
import StockOut from '../models/StockOut.js';

// Helper to filter dates exactly to a single calendar day in UTC local times
const getStartAndEndOfDay = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  
  return { start, end };
};

// @desc    Get Daily StockOut Report
// @route   GET /api/reports/stockout
// @access  Protected
export const getDailyStockOutReport = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getStartAndEndOfDay(date);

    // Find stockouts in the date range
    const stockOuts = await StockOut.find({
      stockOutDate: { $gte: start, $lte: end },
    })
      .populate('sparePart')
      .populate('user')
      .exec();

    // Calculate report totals
    const totalTransactions = stockOuts.length;
    const totalQuantityOut = stockOuts.reduce((sum, item) => sum + Number(item.stockOutQuantity), 0);
    const totalValueOut = stockOuts.reduce((sum, item) => sum + Number(item.stockOutTotalPrice), 0);

    res.status(200).json({
      success: true,
      queryDate: start.toISOString().split('T')[0],
      totalTransactions,
      totalQuantityOut,
      totalValueOut,
      data: stockOuts,
    });
  } catch (error) {
    console.error('Daily StockOut Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Daily Stock Status Report
// @route   GET /api/reports/status
// @access  Protected
export const getDailyStockStatusReport = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getStartAndEndOfDay(date);

    const spareParts = await SparePart.find().exec();
    const stockOutsToday = await StockOut.find({
      stockOutDate: { $gte: start, $lte: end },
    }).exec();

    const reportData = spareParts.map((part) => {
      // Find and sum stock-outs for this specific part on this day
      const partStockOuts = stockOutsToday.filter(
        (so) => (so.sparePart._id || so.sparePart).toString() === part._id.toString()
      );
      
      const dayStockOutQty = partStockOuts.reduce(
        (sum, item) => sum + Number(item.stockOutQuantity),
        0
      );

      // Math definitions:
      // Stored quantity before checkout today = current physical stock + today's checkout quantity
      // Remaining quantity after today's checkout = current physical stock
      const remainingQty = Number(part.quantity);
      const storedQty = remainingQty + dayStockOutQty;

      return {
        _id: part._id,
        name: part.name,
        category: part.category,
        storedQuantity: storedQty, // stock levels prior to today's dispatches
        stockOutQuantity: dayStockOutQty, // dispatches today
        remainingQuantity: remainingQty, // active live stock levels
        unitPrice: part.unitPrice,
        totalPrice: remainingQty * part.unitPrice,
      };
    });

    res.status(200).json({
      success: true,
      queryDate: start.toISOString().split('T')[0],
      data: reportData,
    });
  } catch (error) {
    console.error('Daily Stock Status Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
