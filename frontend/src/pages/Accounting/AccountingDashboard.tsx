import { useEffect, useMemo, useState } from 'react';
import { format, isWithinInterval, addDays } from 'date-fns';
import { GlassCard } from '../../components/ui/GlassCard';
import { modulesApi } from '../../api/modulesApi';

const peso = '\u20B1';

const AccountingDashboard = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [aging, setAging] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([modulesApi.getInvoices(), modulesApi.getLedger(), modulesApi.getAging()]).then(([invoiceData, ledgerData, agingData]) => {
      setInvoices(invoiceData);
      setLedger(ledgerData);
      setAging(agingData.buckets || []);
    });
  }, []);

  const summary = useMemo(() => {
    const now = new Date();
    return {
      pendingInvoices: invoices.filter((invoice) => ['PENDING', 'OPEN', 'DRAFT'].includes(invoice.status)).length,
      forApproval: invoices.filter((invoice) => invoice.status === 'OPEN' && invoice.threeWayStatus === 'MATCHED').length,
      upcomingPayments: invoices.filter((invoice) => invoice.status !== 'PAID' && isWithinInterval(new Date(invoice.dueDate), { start: now, end: addDays(now, 7) })).length
    };
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Accounting Dashboard</h1>
        <p className="text-watermark-blue-200 mt-1">Invoice validation, AP aging, and ledger activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard><div className="text-sm text-watermark-blue-200">Pending Invoices</div><div className="text-4xl text-white font-bold mt-3">{summary.pendingInvoices}</div></GlassCard>
        <GlassCard><div className="text-sm text-watermark-blue-200">For Approval</div><div className="text-4xl text-white font-bold mt-3">{summary.forApproval}</div></GlassCard>
        <GlassCard><div className="text-sm text-watermark-blue-200">Upcoming Payments</div><div className="text-4xl text-white font-bold mt-3">{summary.upcomingPayments}</div></GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-4">AP Aging Summary</h2>
          <div className="space-y-3">
            {aging.map((bucket) => (
              <div key={bucket.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <div className="font-semibold text-white">{bucket.label}</div>
                  <div className="text-xs text-watermark-blue-200">{bucket.count} invoice(s)</div>
                </div>
                <div className="font-bold text-white">{peso}{Number(bucket.amount || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ledger.slice(0, 5).map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3">{format(new Date(entry.createdAt), 'MMM dd')}</td>
                    <td className="py-3">{entry.supplier?.name}</td>
                    <td className="py-3">{entry.description}</td>
                    <td className="py-3 text-right">{peso}{Number(entry.balance || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AccountingDashboard;
