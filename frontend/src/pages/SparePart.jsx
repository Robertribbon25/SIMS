import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { 
  Wrench, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Check, 
  ShieldAlert,
  Coins
} from 'lucide-react';

export default function SparePart() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Insertion form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchParts();
  }, []);

  async function fetchParts() {
    try {
      setLoading(true);
      const res = await api.get('/api/spareparts');
      if (res.data.success) {
        setParts(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch parts failed:', err);
      setError('Could not download spare parts records list.');
    } finally {
      setLoading(false);
    }
  }

  const handleCreatePart = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Field validation
    if (!name.trim()) {
      setFormError('Please enter a unique spare part name.');
      return;
    }
    if (!category.trim()) {
      setFormError('Please select or specify a structural category.');
      return;
    }
    const qtyNum = Number(quantity);
    if (quantity === '' || isNaN(qtyNum) || qtyNum < 0) {
      setFormError('Initial stock level must be a non-negative number.');
      return;
    }
    const priceNum = Number(unitPrice);
    if (unitPrice === '' || isNaN(priceNum) || priceNum < 0) {
      setFormError('Price item must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        quantity: qtyNum,
        unitPrice: priceNum,
      };

      const res = await api.post('/api/spareparts', payload);
      
      if (res.data.success) {
        setFormSuccess(`Successfully added spare part: "${res.data.data.name}"`);
        // Reset insertion fields
        setName('');
        setCategory('');
        setQuantity('');
        setUnitPrice('');
        
        // Refresh items list
        fetchParts();
      } else {
        setFormError(res.data.message || 'Saving transaction error.');
      }
    } catch (err) {
      console.error('Part creation failed:', err);
      const errMsg = err.response?.data?.message || 'Server communication timed out. Try again.';
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Live filter lists
  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          part.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || part.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Calculate distinct categories available for selection and search filter menu
  const uniqueCategories = ['All', ...Array.from(new Set(parts.map(p => p.category)))];
  const formCategories = [
    'Engine Parts',
    'Filters',
    'Braking System',
    'Belts & Chains',
    'Suspension',
    'Transmission',
    'Electrical System',
    'Body Parts',
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Overview */}
        <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950 flex items-center space-x-2">
              <Wrench className="h-6 w-6 text-indigo-700" />
              <span>Catalog Registration Port (Spare Parts)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Inject catalog options and list active stock limits. ⚠️ Examination Policy: Insert & Read operations only.
            </p>
          </div>
          <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-lg px-3 py-1.5 text-xs font-semibold self-start md:self-center">
            🔐 Updates & Deletions prohibited on primary definitions.
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Column Split: Left insertion Form, Right searchable list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Form context */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 flex items-center space-x-2">
              <Plus className="h-4.5 w-4.5 text-indigo-700" />
              <span>Register New Spare Part</span>
            </h3>

            {/* Local success banner */}
            {formSuccess && (
              <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-medium mb-4">
                <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Local error banner */}
            {formError && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs font-medium mb-4">
                <ShieldAlert className="h-4.5 w-4.5 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePart} className="space-y-4">
              {/* Part Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Spare Part Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rear Shock Toyota K100"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                  Select Category
                </label>
                <input
                  list="category-options"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Type or select category..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="category-options">
                  {formCategories.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Grid split: Quantity & Price */}
              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                    Unit Price (FRW)
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

              {/* Real-time evaluation estimate badge */}
              {quantity && unitPrice && !isNaN(Number(quantity)) && !isNaN(Number(unitPrice)) && (
                <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-[11px] text-indigo-950 font-medium">
                  <span className="flex items-center space-x-1">
                    <Coins className="h-4 w-4 text-indigo-700" />
                    <span>Total Evaluation Price:</span>
                  </span>
                  <span className="font-mono text-xs font-bold font-semibold text-indigo-700">
                    {(Number(quantity) * Number(unitPrice)).toLocaleString()} FRW
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white rounded-lg py-2.5 px-4 font-bold text-xs hover:bg-indigo-700 transition-all flex items-center justify-center space-x-1.5"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Upload Part Record</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Searchable List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Filtering Utilities */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter parts catalog..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category selector */}
              <div className="flex items-center space-x-2 text-xs shrink-0 self-start sm:self-center">
                <span className="text-slate-500 font-semibold flex items-center space-x-1">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Category:</span>
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {uniqueCategories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Table container */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-slate-400 text-xs mt-2 font-medium">Fetching parts catalog...</p>
                </div>
              ) : filteredParts.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No spare parts logged matching the current query criteria.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase select-none">
                      <th className="px-6 py-3.5">Spare Part Name</th>
                      <th className="px-6 py-3.5">Category Segment</th>
                      <th className="px-6 py-3.5 text-center">Available Stock</th>
                      <th className="px-6 py-3.5 text-right">Unit Price</th>
                      <th className="px-6 py-3.5 text-right">Valuation (FRW)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParts.map((part) => (
                      <tr key={part._id} className="hover:bg-indigo-50/20 transition-all">
                        <td className="px-6 py-4 font-bold text-slate-900">{part.name}</td>
                        <td className="px-6 py-4 text-slate-600">
                          <span className="px-2 py-1 rounded bg-slate-150 text-slate-700 text-[10px] font-semibold border border-slate-200/40">
                            {part.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded font-bold ${
                            part.quantity < 15 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {part.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600">
                          {Number(part.unitPrice).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                          {Number(part.totalPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination / Total count summary */}
            {!loading && (
              <div className="bg-slate-50/50 border-t border-slate-100 p-4 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Displaying <strong>{filteredParts.length}</strong> of <strong>{parts.length}</strong> parts in registry.</span>
                <span>Cumulative Valuation: <strong className="font-mono text-slate-700">{parts.reduce((sum, p) => sum + p.totalPrice, 0).toLocaleString()} FRW</strong></span>
              </div>
            )}
            
          </div>

        </div>

      </main>
    </div>
  );
}
