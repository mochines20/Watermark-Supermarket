import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ClipboardList, PackageCheck, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { GlassCard } from '../../components/ui/GlassCard';
import { modulesApi } from '../../api/modulesApi';

const ReceivingDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    modulesApi.getReceivingDashboard().then(setData);
  }, []);

  const widgets = [
    { label: 'Pending Deliveries', value: data?.pendingDeliveries || 0, icon: Truck, path: '/receiving/deliveries' },
    { label: "Today's Receipts", value: data?.todaysReceipts || 0, icon: PackageCheck, path: '/receiving/reports' },
    { label: 'Discrepancies', value: data?.openDiscrepancies || 0, icon: AlertTriangle, path: '/receiving/discrepancies' },
    { label: 'Stock-on-Hand Alerts', value: data?.stockAlerts?.length || 0, icon: ClipboardList, path: '/inventory' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Receiving Dashboard</h1>
        <p className="text-watermark-blue-200 mt-1">Warehouse deliveries, receipts, and stock alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {widgets.map(({ label, value, icon: Icon, path }) => (
          <GlassCard key={label} className="cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(path)}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-watermark-blue-200">{label}</div>
                <div className="text-4xl font-bold text-white mt-3">{value}</div>
              </div>
              <div className="p-3 bg-watermark-blue-500/20 rounded-lg text-watermark-blue-200">
                <Icon size={24} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard className="xl:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4">Recent Receipts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3">RR No.</th>
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data?.recentReceipts || []).map((rr: any) => (
                  <tr key={rr.id}>
                    <td className="py-3 font-medium">{rr.rrNumber}</td>
                    <td className="py-3">{rr.po?.supplier?.name || rr.receivedFrom}</td>
                    <td className="py-3">{format(new Date(rr.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="py-3">{rr.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-4">Stock Alerts</h2>
          <div className="space-y-3">
            {(data?.stockAlerts || []).slice(0, 6).map((item: any) => (
              <button key={item.id} onClick={() => navigate('/inventory')} className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <div className="font-semibold text-white">{item.description}</div>
                <div className="text-xs text-watermark-blue-200">{item.itemCode} - {item.stockStatus}</div>
              </button>
            ))}
            {(!data?.stockAlerts || data.stockAlerts.length === 0) && <div className="text-sm text-white/50">No stock alerts.</div>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ReceivingDashboard;
