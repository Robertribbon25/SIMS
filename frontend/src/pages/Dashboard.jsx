import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { 
  Wrench, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Layers, 
  Coins, 
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  Package
} from 'lucide-react';

export default function Dashboard() {
  const [parts, setParts] = useState([]);
  const [stockIns, setStockIns] = useState([]);
  const [stockOuts, setStockOuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboardMetrics() {
      try {
        setLoading(true);
        // Fire parallel API requests smoothly
        const [partsRes, stockInRes, stockOutRes] = await Promise.all([
          api.get('/api/spareparts'),
          api.get('/api/stockin'),
          api.get('/api/stockout')
        ]);

        setParts(partsRes.data.data || []);
        setStockIns(stockInRes.data.data || []);
        setStockOuts(stockOutRes.data.data || []);
      } catch (err) {
        console.error('Fetch dashboard error:', err);
        setError('Could not synchonize live dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardMetrics();
  }, []);

  // Compute stats:
  const totalParts = parts.length;
  // Unique category counts
  const categoriesCount = new Set(parts.map(p => p.category)).size;
  // Sum quantities
  const totalQtyInStock = parts.reduce((sum, p) => sum + Number(p.quantity), 0);
  // Total transaction metrics
  const totalStockInQty = stockIns.reduce((sum, i) => sum + Number(i.stockInQuantity), 0);
  const totalStockOutQty = stockOuts.reduce((sum, o) => sum + Number(o.stockOutQuantity), 0);
  
  // Inventory financial evaluation
  const totalValuation = parts.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);
  const totalSalesValuation = stockOuts.reduce((sum, o) => sum + Number(o.stockOutTotalPrice || 0), 0);

  // Critical Low stock lists (< 15 units)
  const lowStockParts = parts.filter(p => Number(p.quantity) < 15);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 leading-tight">Stock Management Oversight Panel</h1>
            <p className="text-sm text-slate-500 mt-1">
              Rwanda TSS Examination Year 2024-2025. Standby for live inventory ratios.
            </p>
          </div>
          {/* Calendar Indicator */}
          <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-800 px-4 py-2 rounded-lg text-sm font-semibold border border-indigo-100 self-start md:self-center">
            <span>📅 Live Session: {new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-700" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-500 font-medium mt-3 text-sm">Syncing system logs...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Primary Grid Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Part counts */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catalog Items</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalParts}</h3>
                  <p className="text-xs text-slate-400 mt-1">{totalQtyInStock} total units</p>
                </div>
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
                  <Wrench className="h-6 w-6" />
                </div>
              </div>

              {/* Categories counts */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{categoriesCount}</h3>
                  <p className="text-xs text-slate-400 mt-1">Unique active segments</p>
                </div>
                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-700">
                  <Layers className="h-6 w-6" />
                </div>
              </div>

              {/* Stock out dispatches */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispatched Units (Out)</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalStockOutQty}</h3>
                  <p className="text-xs text-slate-400 mt-1">Across {stockOuts.length} transactions</p>
                </div>
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
              </div>

              {/* Valuation totals */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Valuation</p>
                  <h3 className="text-xl font-bold text-slate-900 mt-1.5 font-mono">
                    {totalValuation.toLocaleString()} FRW
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Total physical value</p>
                </div>
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                  <Coins className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Warning Stock Threshold Alert Section */}
            {lowStockParts.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-xl">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <h4 className="font-bold text-sm">Critical Action Required: Low Stock Threshold Limits Crossed!</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1 ml-7">
                  The following catalog items are running below 15 units. Consider scheduling restock orders immediately.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4 ml-7">
                  {lowStockParts.map(part => (
                    <div 
                      key={part._id} 
                      className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="font-medium text-slate-900 pr-2 truncate">
                        {part.name}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold shrink-0">
                        {part.quantity} remaining
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dual Activity split log panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Flow activity overview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Visual transactions stats summary */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5 flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    <span>Inflow vs Outflow Ratios</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 flex items-center space-x-4">
                      <div className="p-3 bg-indigo-600 text-white rounded-full">
                        <ArrowDownLeft className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Cumulative Stock-In Volume</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">{totalStockInQty} Units</p>
                      </div>
                    </div>

                    <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100 flex items-center space-x-4">
                      <div className="p-3 bg-rose-600 text-white rounded-full">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Cumulative Stock-Out Volume</p>
                        <p className="text-xl font-bold text-rose-800 mt-0.5">{totalStockOutQty} Units</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational stats box */}
                  <div className="mt-6 border-t border-slate-100 pt-5 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Catalog Val.</p>
                      <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{totalValuation.toLocaleString()} FRW</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Dispatched Sales</p>
                      <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{totalSalesValuation.toLocaleString()} FRW</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">In Flow Counts</p>
                      <p className="text-sm font-bold text-indigo-700 mt-1">{stockIns.length} Records</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activities Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                      <History className="h-4 w-4 text-slate-600" />
                      <span>Recent Store Operations</span>
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 px-2 py-0.5 rounded-md text-slate-700">
                      Auto-Refresh
                    </span>
                  </div>

                  {/* Stock Out list log snippet */}
                  <div className="p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Latest Stock Out Dispatches (Full CRUD Layer)
                    </h4>
                    {stockOuts.length === 0 ? (
                      <p className="text-slate-400 text-xs italic py-2">No dispatches logged in memory.</p>
                    ) : (
                      <div className="space-y-3">
                        {stockOuts.slice(-4).reverse().map((o, idx) => (
                          <div 
                            key={o._id || idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                          >
                            <div className="truncate pr-4">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {o.sparePart ? (o.sparePart.name || 'Unknown Spare Part') : 'Spare Part Reference Missing'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Dispatched by: <strong className="font-semibold text-slate-500">{o.user?.username || 'Staff'}</strong> on {o.stockOutDate ? new Date(o.stockOutDate).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-rose-700">-{o.stockOutQuantity} Units</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{Number(o.stockOutTotalPrice).toLocaleString()} FRW</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Fast stats categories list */}
              <div className="space-y-6">
                {/* Categories share index details */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                    <Package className="h-4.5 w-4.5 text-indigo-700" />
                    <span>Unique Category Mix</span>
                  </h3>
                  
                  {parts.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-2">No categories present in system inventory.</p>
                  ) : (
                    <div className="space-y-3 divide-y divide-slate-100">
                      {Array.from(new Set(parts.map(p => p.category))).map((cat, idx) => {
                        const count = parts.filter(p => p.category === cat).length;
                        const catQty = parts.filter(p => p.category === cat).reduce((sum, p) => sum + p.quantity, 0);
                        return (
                          <div key={idx} className="flex items-center justify-between pt-3 first:pt-0">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{cat}</p>
                              <p className="text-[10px] text-slate-400">{count} distinct model lines</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {catQty} in stock
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rwanda TSS Certificate footer container */}
                <div className="bg-slate-900 text-indigo-100 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                      Rwanda TSS Examination
                    </h3>
                    <p className="text-sm font-semibold text-white">National Practical Exam 2024-2025</p>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                      Designed to comply with high standards for software modules in mechanical catalog records audits.
                    </p>
                  </div>
                  <div className="mt-5 border-t border-slate-800 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Developer: Staff Gate</span>
                    <span>Status: Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
