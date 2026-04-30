import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ShieldCheck } from 'lucide-react';
import { modulesApi } from '../api/modulesApi';


const ThreeWayMatch = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await modulesApi.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">3-Way Match Verification</h1>
          <p className="text-watermark-blue-200 mt-1">Review system-matched Purchase Orders, Receiving Reports, and Invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="text-center">
          <h3 className="text-white/60 text-sm font-bold uppercase tracking-wider mb-2">Total Invoices</h3>
          <p className="text-4xl font-bold text-white">{invoices.length}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <h3 className="text-green-400/80 text-sm font-bold uppercase tracking-wider mb-2">Matched</h3>
          <p className="text-4xl font-bold text-green-400">{invoices.filter(i => i.threeWayStatus === 'MATCHED').length}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <h3 className="text-red-400/80 text-sm font-bold uppercase tracking-wider mb-2">Exceptions</h3>
          <p className="text-4xl font-bold text-red-400">{invoices.filter(i => i.threeWayStatus === 'EXCEPTION').length}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                <th className="pb-3 font-medium">Invoice No</th>
                <th className="pb-3 font-medium">PO Ref</th>
                <th className="pb-3 font-medium">RR Ref</th>
                <th className="pb-3 font-medium">Supplier</th>
                <th className="pb-3 font-medium">Amount Due</th>
                <th className="pb-3 font-medium">Match Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 group">
                  <td className="py-4 font-medium flex items-center gap-2"><ShieldCheck size={16} className="text-blue-400" />{inv.invoiceNo}</td>
                  <td className="py-4 text-white/80">{inv.po?.poNumber || 'N/A'}</td>
                  <td className="py-4 text-white/80">{inv.rr?.rrNumber || 'N/A'}</td>
                  <td className="py-4">{inv.supplier?.name}</td>
                  <td className="py-4 font-bold">₱{Number(inv.totalAmountDue).toLocaleString()}</td>
                  <td className="py-4"><StatusBadge status={inv.threeWayStatus} /></td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-white/50">No data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default ThreeWayMatch;
