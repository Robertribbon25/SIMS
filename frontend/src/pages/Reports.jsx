import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { 
  FileSpreadsheet, 
  Calendar, 
  Search, 
  ArrowUpRight, 
  Coins, 
  ShieldCheck, 
  Award,
  BookOpen
} from 'lucide-react';

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Defaults to today
  const [stockOutReport, setStockOutReport] = useState(null);
  const [stockStatusReport, setStockStatusReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDailyReports();
  }, [selectedDate]); // Auto-refresh reports whenever search date changes!

  async function fetchDailyReports() {
    try {
      setLoading(true);
      setError('');
      
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];

      const [stockOutRes, statusRes] = await Promise.all([
        api.get(`/api/reports/stockout?date=${formattedDate}`),
        api.get(`/api/reports/status?date=${formattedDate}`)
      ]);

      if (stockOutRes.data.success) {
        setStockOutReport(stockOutRes.data);
      }
      if (statusRes.data.success) {
        setStockStatusReport(statusRes.data.data || []);
      }
    } catch (err) {
      console.error('Fetch daily reports error:', err);
      setError('Could not compile audit reports for specified date.');
    } finally {
      setLoading(false);
    }
  }

  // Calculate high-level metrics for standard UI cards
  const totalStockOutValue = stockOutReport?.totalValueOut || 0;
  const totalStockOutQty = stockOutReport?.totalQuantityOut || 0;
  const totalTransactions = stockOutReport?.totalTransactions || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Headers */}
        <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950 flex items-center space-x-2">
              <FileSpreadsheet className="h-6 w-6 text-indigo-700" />
              <span>National Examination Auditing Portal (Reports)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Inspect historical records, daily stock outflow evaluations, and current physical storage levels.
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl shrink-0 self-start md:self-center">
            <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Audit Target Day:</span>
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-indigo-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-indigo-700" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 text-xs font-medium mt-3">Compiling calendar audits...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* High-level Metric Summaries Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              <div className="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Daily Checkout Transactions</p>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{totalTransactions} Logs filed</h3>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Award className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Daily Dissolved Units Quantity</p>
                  <h3 className="text-xl font-extrabold text-rose-700 mt-1">-{totalStockOutQty} units out</h3>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Daily Outflow Sales Value</p>
                  <h3 className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                    {totalStockOutValue.toLocaleString()} FRW
                  </h3>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Coins className="h-5 w-5" />
                </div>
              </div>

            </div>

            {/* Split Panel: Report 1 & Report 2 */}
            <div className="grid grid-cols-1 gap-8">
              
              {/* Report 1: Daily StockOut Report */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 block shrink-0" />
                      <span>REPORT 1: Daily StockOut Detail Audits Ledger</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Individual checkouts registered on <strong>{new Date(selectedDate).toLocaleDateString('en-GB')}</strong>
                    </p>
                  </div>
                  <span className="px-3 py-1 font-mono text-[10px] bg-slate-200 text-slate-700 rounded-lg font-bold">
                    Ref Date: {selectedDate}
                  </span>
                </div>

                <div className="overflow-x-auto text-xs">
                  {!stockOutReport || stockOutReport.data?.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 italic">
                      No stock-out checkouts found for this calendar day.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase select-none text-[10px]">
                          <th className="px-6 py-3">Dispatched Spare Part</th>
                          <th className="px-6 py-3">Part Category</th>
                          <th className="px-6 py-3 text-center">Checkout Quantity</th>
                          <th className="px-6 py-3 text-right">Selling Price Unit</th>
                          <th className="px-6 py-3 text-right">Total Dispatched Valuation (FRW)</th>
                          <th className="px-6 py-3 text-left">Processing Staff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stockOutReport.data.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">
                              {item.sparePart ? (item.sparePart.name || 'DELETED_PART') : 'Spare Part Reference Missing'}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {item.sparePart ? (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-300/40">
                                  {item.sparePart.category}
                                </span>
                              ) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-rose-700">
                              -{item.stockOutQuantity} units
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-slate-500">
                              {Number(item.stockOutUnitPrice).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                              {Number(item.stockOutTotalPrice).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                              {item.user ? item.user.username : 'System Admin'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {stockOutReport && stockOutReport.data?.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Compiled successfully.</span>
                    <span>Daily Sales Total: <strong className="text-rose-700 font-mono text-xs">{totalStockOutValue.toLocaleString()} FRW</strong></span>
                  </div>
                )}
              </div>

              {/* Report 2: Daily Stock Status Report */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block shrink-0" />
                      <span>REPORT 2: Daily Stock Physical Balance Status Audits</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dynamic snapshot: <strong>Stored Quantity</strong> (start of day) minus <strong>Daily StockOuts</strong> yields <strong>Remaining Quantity</strong>
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>VERIFIED</span>
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  {stockStatusReport.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 italic">
                      No part profiles loaded in memory.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase select-none text-[10px]">
                          <th className="px-6 py-3">Catalog Material Name</th>
                          <th className="px-6 py-3">Part Category</th>
                          <th className="px-6 py-3 text-center">Stored Qty (Start of Day)</th>
                          <th className="px-6 py-3 text-center">Daily Dispatches (Stock Out)</th>
                          <th className="px-6 py-3 text-center">Remaining Quantity (In Stock)</th>
                          <th className="px-6 py-3 text-right">Value Asset (FRW)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stockStatusReport.map((row) => (
                          <tr key={row._id} className="hover:bg-indigo-50/10 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{row.name}</td>
                            <td className="px-6 py-4 text-slate-500">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-300/40">
                                {row.category}
                              </span>
                            </td>
                            {/* Stored qty representing start-of-day before today's dispatches */}
                            <td className="px-6 py-4 text-center font-semibold text-slate-700">
                              {row.storedQuantity}
                            </td>
                            {/* Quantity checked out today */}
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                row.stockOutQuantity > 0 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {row.stockOutQuantity > 0 ? `-${row.stockOutQuantity}` : '0'}
                              </span>
                            </td>
                            {/* Live physical remaining stock */}
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded font-bold ${
                                row.remainingQuantity < 15 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {row.remainingQuantity} units
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-800 font-mono">
                              {Number(row.totalPrice).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {stockStatusReport.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 text-right font-medium">
                    Total Assets Inventory Wealth: <strong className="text-slate-700 font-mono text-xs">{stockStatusReport.reduce((sum, r) => sum + r.totalPrice, 0).toLocaleString()} FRW</strong>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
