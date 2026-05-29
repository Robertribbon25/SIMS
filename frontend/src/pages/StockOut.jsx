import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Edit, 
  Undo, 
  Calendar, 
  Check, 
  AlertTriangle,
  FileSpreadsheet,
  X
} from 'lucide-react';

export default function StockOut() {
  const [parts, setParts] = useState([]);
  const [stockOutLogs, setStockOutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Creation Form states
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal Overlay states
  const [editingLog, setEditingLog] = useState(null); // stores the full log object being updated
  const [editPart, setEditPart] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      setError('');
      const [partsRes, stockOutRes] = await Promise.all([
        api.get('/api/spareparts'),
        api.get('/api/stockout')
      ]);

      if (partsRes.data.success) {
        setParts(partsRes.data.data || []);
      }
      if (stockOutRes.data.success) {
        setStockOutLogs(stockOutRes.data.data || []);
      }
    } catch (err) {
      console.error('Fetch stock out data error:', err);
      setError('Could not synchonize active stock checkout dispatches logs.');
    } finally {
      setLoading(false);
    }
  }

  // Handle unit price autocomplete when spare part selector changes
  const handlePartChange = (partId) => {
    setSelectedPart(partId);
    if (partId) {
      const matchedPart = parts.find(p => p._id === partId);
      if (matchedPart) {
        setUnitPrice(matchedPart.unitPrice); // Auto fill current catalog price
      }
    } else {
      setUnitPrice('');
    }
  };

  const handleStockOutCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Field validating
    if (!selectedPart) {
      setFormError('Please select a target spare part from catalog.');
      return;
    }
    const qtyNum = Number(quantity);
    if (quantity === '' || isNaN(qtyNum) || qtyNum <= 0) {
      setFormError('Quantity to checkout must be greater than 0.');
      return;
    }
    const priceNum = Number(unitPrice);
    if (unitPrice === '' || isNaN(priceNum) || priceNum < 0) {
      setFormError('Unit price must be a non-negative valuation.');
      return;
    }
    if (!date) {
      setFormError('Please select checkout dispatch date.');
      return;
    }

    // Safety: Verify current catalog stock is feasible
    const targetCatalogPart = parts.find(p => p._id === selectedPart);
    if (targetCatalogPart && targetCatalogPart.quantity < qtyNum) {
      setFormError(`Insufficient stock in inventory. Only ${targetCatalogPart.quantity} units are currently inside category store.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sparePart: selectedPart,
        stockOutQuantity: qtyNum,
        stockOutUnitPrice: priceNum,
        stockOutDate: new Date(date).toISOString(),
      };

      const res = await api.post('/api/stockout', payload);
      
      if (res.data.success) {
        setFormSuccess(`Dispatch transaction logged successfully!`);
        setSelectedPart('');
        setQuantity('');
        setUnitPrice('');
        
        fetchInitialData(); // Refresh records list & updated stocks
      } else {
        setFormError(res.data.message || 'Operation saving error.');
      }
    } catch (err) {
      console.error('StockOut Create Error:', err);
      const msg = err.response?.data?.message || 'Server connection timed out.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Launch Edit Modal Overlay
  const startEditing = (log) => {
    setEditingLog(log);
    const partId = log.sparePart ? (log.sparePart._id || log.sparePart) : '';
    setEditPart(partId);
    setEditQty(log.stockOutQuantity);
    setEditPrice(log.stockOutUnitPrice);
    
    // Parse Date format for input value (YYYY-MM-DD)
    const logDate = log.stockOutDate ? new Date(log.stockOutDate).toISOString().split('T')[0] : '';
    setEditDate(logDate);

    setEditError('');
    setEditSuccess('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editPart) {
      setEditError('Please select a reference spare part.');
      return;
    }
    const qtyNum = Number(editQty);
    if (editQty === '' || isNaN(qtyNum) || qtyNum <= 0) {
      setEditError('Quantity must be greater than 0.');
      return;
    }
    const priceNum = Number(editPrice);
    if (editPrice === '' || isNaN(priceNum) || priceNum < 0) {
      setEditError('Price must be a valid non-negative value.');
      return;
    }
    if (!editDate) {
      setEditError('Please select dispatch date.');
      return;
    }

    // Feasibility analysis: Account for old stock checking
    const targetCatalogPart = parts.find(p => p._id === editPart);
    if (targetCatalogPart) {
      // If we are modifying the same part, we check how much extra we want:
      // extraNeeded = newQuantity - oldQuantity
      // If we are changing to a new part, we check if the new part has enough stock for the whole newQty!
      const isSamePart = editingLog.sparePart && (editingLog.sparePart._id || editingLog.sparePart).toString() === editPart.toString();
      const oldQty = Number(editingLog.stockOutQuantity);
      
      if (isSamePart) {
        const extraNeeded = qtyNum - oldQty;
        if (extraNeeded > 0 && targetCatalogPart.quantity < extraNeeded) {
          setEditError(`Insufficient stock. Need ${extraNeeded} more units of "${targetCatalogPart.name}", but only ${targetCatalogPart.quantity} are in stock.`);
          return;
        }
      } else {
        if (targetCatalogPart.quantity < qtyNum) {
          setEditError(`Insufficient stock. The new part "${targetCatalogPart.name}" only has ${targetCatalogPart.quantity} units, but you requested ${qtyNum}.`);
          return;
        }
      }
    }

    setEditSubmitting(true);
    try {
      const payload = {
        sparePart: editPart,
        stockOutQuantity: qtyNum,
        stockOutUnitPrice: priceNum,
        stockOutDate: new Date(editDate).toISOString()
      };

      const res = await api.put(`/api/stockout/${editingLog._id}`, payload);
      
      if (res.data.success) {
        setEditSuccess('Record updated successfully!');
        setTimeout(() => {
          setEditingLog(null); // Close modal
          fetchInitialData();  // Refresh balances & tables
        }, 1200);
      } else {
        setEditError(res.data.message || 'Error updating log.');
      }
    } catch (err) {
      console.error('Update Stock Out failed:', err);
      const msg = err.response?.data?.message || 'Server did not respond.';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete StockOut logs
  const handleDeleteLog = async (id) => {
    if (!window.confirm('Warning: Deleting this Stock Out log will restore dispatched stock levels to their respective parts. Are you sure you wish to delete this record?')) {
      return;
    }

    try {
      const res = await api.delete(`/api/stockout/${id}`);
      if (res.data.success) {
        alert('Stock out record deleted successfully and catalog stock balances restored.');
        fetchInitialData();
      } else {
        alert('Could not delete record: ' + res.data.message);
      }
    } catch (err) {
      console.error('Deletion error:', err);
      alert('Delete opertion failed: ' + (err.response?.data?.message || 'Network Timeout'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Headers */}
        <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950 flex items-center space-x-2">
              <ArrowUpRight className="h-6 w-6 text-indigo-700" />
              <span>Dispatch Logging Registry (Stock Out)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Deduct inventory stocks for items checked out, sold, or distributed. ⚙️ Examination Policy: FULL CRUD operational routines.
            </p>
          </div>
          <div className="bg-indigo-50 text-indigo-850 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-150 self-start md:self-center">
            ⚡ Stock balance is auto-managed & reversed on record deletion.
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Intake Register */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 flex items-center space-x-2">
              <Plus className="h-4.5 w-4.5 text-indigo-700" />
              <span>Log Dispatch (Stock Out)</span>
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

            <form onSubmit={handleStockOutCreate} className="space-y-4">
              {/* Select part */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Select Spare Part
                </label>
                <select
                  required
                  value={selectedPart}
                  onChange={(e) => handlePartChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Click to choose part --</option>
                  {parts.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Available: {p.quantity} units)
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid: Quantity & Individual Sale Price */}
              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                    Quantity Out
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Dispatch Unit Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                    Dispatch Unit Price (FRW)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 5000"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Dispatch Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Total Price estimation card */}
              {quantity && unitPrice && !isNaN(Number(quantity)) && !isNaN(Number(unitPrice)) && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-between text-[11px] text-rose-950 font-medium">
                  <span className="flex items-center space-x-1">
                    <FileSpreadsheet className="h-4 w-4 text-rose-700" />
                    <span>Calculated Total Outflow:</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-rose-700">
                    {(Number(quantity) * Number(unitPrice)).toLocaleString()} FRW
                  </span>
                </div>
              )}

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
                    <span>Filing record...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Confirm Dispatch Outflow</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Historical Table + Edit Actions */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-slate-600" />
                <span>Historical Outflow Dispatches Ledger</span>
              </h3>
              <span className="font-mono text-[10px] bg-rose-100 text-rose-850 px-2.5 py-0.5 rounded-md font-bold">
                {stockOutLogs.length} Records
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-slate-400 text-xs mt-2 font-medium">Recalculating ledger rows...</p>
                </div>
              ) : stockOutLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  No dispatches (Stock Out) have been recorded yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase select-none">
                      <th className="px-6 py-3.5">Dispatched Spare Part</th>
                      <th className="px-4 py-3.5 text-center">Qty Out</th>
                      <th className="px-4 py-3.5 text-right">Unit Price</th>
                      <th className="px-4 py-3.5 text-right">Total Out (FRW)</th>
                      <th className="px-4 py-3.5 text-center flex items-center justify-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Date</span>
                      </th>
                      <th className="px-4 py-3.5 text-left">Staff Officer</th>
                      <th className="px-6 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockOutLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-rose-50/10 transition-all">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {log.sparePart ? (log.sparePart.name || 'DELETED_PART') : 'Spare Part Reference Missing'}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-rose-700">
                          -{log.stockOutQuantity}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-slate-500">
                          {Number(log.stockOutUnitPrice).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-slate-900 font-mono">
                          {Number(log.stockOutTotalPrice).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-slate-500">
                          {log.stockOutDate ? new Date(log.stockOutDate).toLocaleDateString('en-GB') : 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {log.user ? (log.user.username || 'Staff Profile') : 'System Admin'}
                        </td>
                        {/* CRUD Control buttons */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="inline-flex space-x-2">
                            <button
                              onClick={() => startEditing(log)}
                              title="Update Dispatched Entries Details"
                              className="p-1.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-xs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log._id)}
                              title="Delete Record & Restore Inventory Units"
                              className="p-1.5 bg-red-50 border border-red-100 rounded text-red-700 hover:bg-red-600 hover:text-white transition-all shadow-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && stockOutLogs.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 text-right font-medium">
                Total Logs Value Valuation: <strong className="text-rose-700 font-mono text-xs">{stockOutLogs.reduce((sum, l) => sum + Number(l.stockOutTotalPrice), 0).toLocaleString()} FRW</strong>
              </div>
            )}
          </div>

        </div>

        {/* ========================================================= */}
        {/* EDIT OVERLAY MODAL WINDOW (Required full-CRUD compliance) */}
        {/* ========================================================= */}
        {editingLog && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden relative animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-800 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Undo className="h-5 w-5 text-indigo-300" />
                  <h3 className="font-semibold text-sm">Update Dispatched Log Details</h3>
                </div>
                <button
                  onClick={() => setEditingLog(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-indigo-200 hover:text-white focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body Context */}
              <div className="p-6">
                
                {editSuccess && (
                  <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold mb-4 text-left leading-normal">
                    <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                {editError && (
                  <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs font-semibold mb-4 text-left leading-normal">
                    <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {/* Part Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Select Target Spare Part
                    </label>
                    <select
                      required
                      value={editPart}
                      onChange={(e) => setEditPart(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose part --</option>
                      {parts.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} (In stock: {p.quantity} units)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Grid split: Qty & Sale price */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                        Quantity To Dispatch
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 5"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                        Unit Price (FRW)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 1000"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Dispatch Date
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Pricing estimation box */}
                  {editQty && editPrice && !isNaN(Number(editQty)) && !isNaN(Number(editPrice)) && (
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between text-[11px] font-semibold text-indigo-950">
                      <span>Refiling Total Invoice Value:</span>
                      <span className="font-mono text-indigo-700">
                        {(Number(editQty) * Number(editPrice)).toLocaleString()} FRW
                      </span>
                    </div>
                  )}

                  {/* Button options */}
                  <div className="pt-4 flex items-center justify-end space-x-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingLog(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs transition-colors focus:outline-none"
                    >
                      Dismiss Changes
                    </button>
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors flex items-center space-x-1 focus:outline-none"
                    >
                      {editSubmitting ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Patching...</span>
                        </>
                      ) : (
                        <span>Verify & Save</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
