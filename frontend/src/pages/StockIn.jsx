import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { 
  ArrowDownLeft, 
  Plus, 
  Calendar, 
  Archive, 
  AlertTriangle,
  Check,
  PackagePlus
} from 'lucide-react';

export default function StockIn() {
  const [parts, setParts] = useState([]);
  const [stockInLogs, setStockInLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setError('');
      const [partsRes, stockInRes] = await Promise.all([
        api.get('/api/spareparts'),
        api.get('/api/stockin')
      ]);

      if (partsRes.data.success) {
        setParts(partsRes.data.data || []);
      }
      if (stockInRes.data.success) {
        setStockInLogs(stockInRes.data.data || []);
      }
    } catch (err) {
      console.error('Fetch stock in data critical error:', err);
      setError('Could not synchonize active stock records list.');
    } finally {
      setLoading(false);
    }
  }

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Field validity
    if (!selectedPart) {
      setFormError('Please select a target spare part from catalog.');
      return;
    }
    const qtyNum = Number(quantity);
    if (quantity === '' || isNaN(qtyNum) || qtyNum <= 0) {
      setFormError('Stock In restocking quantity must be greater than 0.');
      return;
    }
    if (!date) {
      setFormError('Please enter the date of restocking.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sparePart: selectedPart,
        stockInQuantity: qtyNum,
        stockInDate: new Date(date).toISOString(),
      };

      const res = await api.post('/api/stockin', payload);
      
      if (res.data.success) {
        setFormSuccess(`Successfully recorded restocking inflow!`);
        // Reset form inputs except date
        setSelectedPart('');
        setQuantity('');
        
        // Refresh grid lists
        fetchInitialData();
      } else {
        setFormError(res.data.message || 'Restocking operation error.');
      }
    } catch (err) {
      console.error('Stock in creation error:', err);
      const msg = err.response?.data?.message || 'Server connection timed out.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner header Overview */}
        <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950 flex items-center space-x-2">
              <ArrowDownLeft className="h-6 w-6 text-indigo-700" />
              <span>Restocking Logs Registrar (Stock In)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Add new restock logs to increase part quantities. ⚠️ Examination Policy: Insert & Read operations only.
            </p>
          </div>
          <div className="bg-amber-50 text-amber-850 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-150 self-start md:self-center">
            🔒 Stock levels increase dynamically on logging. No deletions allowed.
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Restocking intake form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 flex items-center space-x-2">
              <PackagePlus className="h-4.5 w-4.5 text-indigo-700" />
              <span>Log Standard Stock Inflow</span>
            </h3>

            {formSuccess && (
              <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-medium mb-4">
                <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs font-medium mb-4">
                <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleStockInSubmit} className="space-y-4">
              {/* Spare part reference select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Select Catalog Spare Part
                </label>
                <select
                  required
                  value={selectedPart}
                  onChange={(e) => setSelectedPart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Click to choose part --</option>
                  {parts.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Current: {p.quantity} units in stock)
                    </option>
                  ))}
                </select>
                {parts.length === 0 && !loading && (
                  <p className="text-[10px] text-rose-500 mt-1">
                    ⚠️ You must register parts in "Spare Parts" catalog screen first.
                  </p>
                )}
              </div>

              {/* Quantity restocked */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Restock Inflow Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Recieved date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Log Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || parts.length === 0}
                className="w-full bg-indigo-600 disabled:bg-slate-300 text-white rounded-lg py-2.5 px-4 font-bold text-xs hover:bg-indigo-700 transition-all flex items-center justify-center space-x-1.5"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving log...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Confirm Inflow Log</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Historical logs feed */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Archive className="h-4.5 w-4.5 text-slate-600" />
                <span>Restocking Ledger Activity History</span>
              </h3>
              <span className="font-mono text-[10px] bg-indigo-150 text-indigo-800 px-2 py-0.5 rounded-md font-bold">
                {stockInLogs.length} Records
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-slate-400 text-xs mt-2 font-medium">Fetching restock records...</p>
                </div>
              ) : stockInLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  No restocking (Stock In) records have been written yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase select-none">
                      <th className="px-6 py-3.5">Restocked Product Name</th>
                      <th className="px-6 py-3.5">Product Segment</th>
                      <th className="px-6 py-3.5 text-center">Restocked Quantity</th>
                      <th className="px-6 py-3.5 text-center flex items-center justify-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Receipt Date</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockInLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {log.sparePart ? (log.sparePart.name || 'DELETED_PART') : 'Spare Part Reference Missing'}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {log.sparePart ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200/40">
                              {log.sparePart.category}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-indigo-700">
                          +{log.stockInQuantity} Units
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-slate-500">
                          {log.stockInDate ? new Date(log.stockInDate).toLocaleDateString('en-GB') : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && stockInLogs.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 text-right font-medium">
                Total Restocked Units: <strong className="text-slate-700">{stockInLogs.reduce((sum, l) => sum + Number(l.stockInQuantity), 0)} Units</strong>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
