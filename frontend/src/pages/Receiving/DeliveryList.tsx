import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, PackageCheck, Search } from 'lucide-react';
import { format } from 'date-fns';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { modulesApi } from '../../api/modulesApi';

const DeliveryList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState({ poNo: '', supplier: '', dateFrom: '', dateTo: '', status: '' });

  const load = async () => {
    const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    setRows(await modulesApi.getDeliveries(activeFilters));
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key: string, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));
  const reset = () => {
    setFilters({ poNo: '', supplier: '', dateFrom: '', dateTo: '', status: '' });
    modulesApi.getDeliveries().then(setRows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Pending Deliveries</h1>
        <p className="text-watermark-blue-200 mt-1">Open and partially received purchase orders</p>
      </div>

      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
          <input value={filters.poNo} onChange={(e) => update('poNo', e.target.value)} placeholder="PO No." className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
          <input value={filters.supplier} onChange={(e) => update('supplier', e.target.value)} placeholder="Supplier code/name" className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white md:col-span-2" />
          <input value={filters.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} type="date" className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
          <input value={filters.dateTo} onChange={(e) => update('dateTo', e.target.value)} type="date" className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
          <select value={filters.status} onChange={(e) => update('status', e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white">
            <option value="" className="text-black">Any Status</option>
            <option value="OPEN" className="text-black">Open</option>
            <option value="PARTIALLY_RECEIVED" className="text-black">Partially Received</option>
          </select>
        </div>
        <div className="flex gap-2 mb-6">
          <PrimaryButton onClick={load} icon={<Search size={18} />}>Filter</PrimaryButton>
          <button onClick={reset} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15">Reset</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                <th className="pb-3">PO No.</th>
                <th className="pb-3">Supplier</th>
                <th className="pb-3">Delivery Date</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((po) => (
                <tr key={po.id}>
                  <td className="py-4 font-medium">{po.poNumber}</td>
                  <td className="py-4">{po.supplier?.vendorCode} - {po.supplier?.name}</td>
                  <td className="py-4">{format(new Date(po.date), 'MMM dd, yyyy')}</td>
                  <td className="py-4">{po.forDepartment}</td>
                  <td className="py-4">{po.status}</td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/po`)} className="px-3 py-1 rounded-lg bg-white/5 text-watermark-blue-200 hover:text-white flex items-center gap-1 text-sm"><Eye size={14} /> View</button>
                      <button onClick={() => navigate(`/receiving/grn/new?poId=${po.id}`)} className="px-3 py-1 rounded-lg bg-watermark-blue-500/20 text-white hover:bg-watermark-blue-500/30 flex items-center gap-1 text-sm"><PackageCheck size={14} /> Receive</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-white/50">No pending deliveries found.</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default DeliveryList;
