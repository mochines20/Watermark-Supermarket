import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { modulesApi } from '../api/modulesApi';
import { Layers } from 'lucide-react';

const StockStatus = () => {
  const [stock, setStock] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await modulesApi.getStockStatus();
      setStock(data.stock);
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Status</h1>
        <p className="text-watermark-blue-200 mt-1">Real-time warehouse stock tracking and reorder alerts</p>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl">
          <h3 className="text-red-300 font-bold mb-2">Critical Reorder Alerts</h3>
          <ul className="list-disc pl-5 text-white/90 text-sm">
            {alerts.map(a => (
              <li key={a.id}>{a.item.description} is below reorder point ({a.qtyOnHand} {a.item.unit} remaining)</li>
            ))}
          </ul>
        </div>
      )}

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                <th className="pb-3 font-medium">Item Code</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium">Stock On Hand</th>
                <th className="pb-3 font-medium">Reorder Point</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stock.map((s) => {
                const isLow = s.qtyOnHand <= s.item.reorderPoint;
                return (
                  <tr key={s.id} className="hover:bg-white/5 group">
                    <td className="py-4 font-medium flex items-center gap-2"><Layers size={16} className="text-blue-400" />{s.item.itemCode}</td>
                    <td className="py-4">{s.item.description}</td>
                    <td className={`py-4 font-bold ${isLow ? 'text-red-400' : 'text-green-400'}`}>{s.qtyOnHand} {s.item.unit}</td>
                    <td className="py-4">{s.item.reorderPoint}</td>
                    <td className="py-4"><StatusBadge status={isLow ? 'CRITICAL' : 'OK'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default StockStatus;
