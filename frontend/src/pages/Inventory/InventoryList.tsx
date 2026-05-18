import { useEffect, useMemo, useState } from 'react';
import { History, RefreshCcw, Search, SlidersHorizontal } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { modulesApi } from '../../api/modulesApi';
import type { InventoryItem } from '../../types/inventory';
import StockAdjustmentModal from './StockAdjustmentModal';
import InventoryTransactionHistory from './InventoryTransactionHistory';

const peso = '\u20B1';

const statusClass = (status: string) => {
  if (status === 'CRITICAL') return 'bg-red-500/20 text-red-300 border-red-500/40';
  if (status === 'LOW_STOCK') return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40';
  return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
};

const InventoryList = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await modulesApi.getInventory());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category).filter(Boolean))), [items]);

  const filtered = items.filter((item) => {
    const term = query.toLowerCase();
    const matchesQuery = !term || item.description.toLowerCase().includes(term) || item.itemCode.toLowerCase().includes(term);
    const matchesCategory = !category || item.category === category;
    const matchesStatus = !status || item.stockStatus === status;
    return matchesQuery && matchesCategory && matchesStatus;
  });

  const reset = () => {
    setQuery('');
    setCategory('');
    setStatus('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Inventory</h1>
          <p className="text-watermark-blue-200 mt-1">Item master, stock status, and adjustment history</p>
        </div>
        <PrimaryButton onClick={load} icon={<RefreshCcw size={18} />}>Refresh</PrimaryButton>
      </div>

      <GlassCard>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_auto] gap-3 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by item code or name" className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white">
            <option value="" className="text-black">All Categories</option>
            {categories.map((value) => <option className="text-black" key={value} value={value}>{value}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white">
            <option value="" className="text-black">All Statuses</option>
            <option value="NORMAL" className="text-black">Normal</option>
            <option value="LOW_STOCK" className="text-black">Low Stock</option>
            <option value="CRITICAL" className="text-black">Critical</option>
          </select>
          <button onClick={reset} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 flex items-center justify-center gap-2">
            <SlidersHorizontal size={16} /> Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                <th className="pb-3">Item Code</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">UOM</th>
                <th className="pb-3 text-right">Qty on Hand</th>
                <th className="pb-3 text-right">Unit Cost</th>
                <th className="pb-3 text-right">Reorder Point</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Supplier</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={10} className="py-8 text-center text-white/50">Loading inventory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center text-white/50">No inventory items found.</td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/5">
                  <td className="py-4 font-medium">{item.itemCode}</td>
                  <td className="py-4">{item.description}</td>
                  <td className="py-4">{item.category}</td>
                  <td className="py-4">{item.unit}</td>
                  <td className="py-4 text-right font-semibold">{item.qtyOnHand}</td>
                  <td className="py-4 text-right">{peso}{Number(item.standardCost || 0).toLocaleString()}</td>
                  <td className="py-4 text-right">{item.reorderPoint}</td>
                  <td className="py-4">
                    <span className={`inline-flex border px-2 py-1 rounded-full text-xs font-bold ${statusClass(item.stockStatus)}`}>
                      {item.stockStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4">{item.supplierName || '-'}</td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setHistoryItem(item)} className="px-3 py-1 rounded-lg bg-white/5 text-watermark-blue-200 hover:text-white flex items-center gap-1 text-sm">
                        <History size={14} /> History
                      </button>
                      <button onClick={() => setAdjusting(item)} className="px-3 py-1 rounded-lg bg-watermark-blue-500/20 text-white hover:bg-watermark-blue-500/30 text-sm">
                        Adjust Stock
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {adjusting && <StockAdjustmentModal item={adjusting} onClose={() => setAdjusting(null)} onSaved={() => { setAdjusting(null); load(); }} />}
      {historyItem && <InventoryTransactionHistory item={historyItem} onClose={() => setHistoryItem(null)} />}
    </div>
  );
};

export default InventoryList;
