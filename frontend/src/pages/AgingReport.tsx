import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Clock, Printer } from 'lucide-react';
import { modulesApi } from '../api/modulesApi';
import { format, differenceInDays } from 'date-fns';

const AgingReport = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await modulesApi.getInvoices();
      // Only unpaid invoices
      setInvoices(data.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED'));
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAging = (dueDate: string) => {
    const days = differenceInDays(new Date(), new Date(dueDate));
    if (days <= 0) return { label: 'Current', color: 'text-green-400' };
    if (days <= 30) return { label: '1-30 Days Past Due', color: 'text-yellow-400' };
    if (days <= 60) return { label: '31-60 Days Past Due', color: 'text-orange-400' };
    if (days <= 90) return { label: '61-90 Days Past Due', color: 'text-red-400' };
    return { label: 'Over 90 Days', color: 'text-red-600 font-bold' };
  };

  const formatDate = (value: any) => {
    if (!value) return '';
    try {
      return format(new Date(value), 'MMM dd, yyyy');
    } catch {
      return '';
    }
  };

  const formatMoney = (value: any) => `₱${Number(value || 0).toLocaleString()}`;

  const agings = invoices.map(inv => {
    const days = differenceInDays(new Date(), new Date(inv.dueDate));
    let bucket = '';
    if (days <= 30) bucket = '0-30';
    else if (days <= 60) bucket = '31-60';
    else if (days <= 90) bucket = '61-90';
    else bucket = 'over90';
    return { ...inv, bucket, amount: Number(inv.totalAmountDue) };
  });

  const sums = {
    '0-30': agings.filter(i => i.bucket === '0-30').reduce((acc, i) => acc + i.amount, 0),
    '31-60': agings.filter(i => i.bucket === '31-60').reduce((acc, i) => acc + i.amount, 0),
    '61-90': agings.filter(i => i.bucket === '61-90').reduce((acc, i) => acc + i.amount, 0),
    'over90': agings.filter(i => i.bucket === 'over90').reduce((acc, i) => acc + i.amount, 0),
    total: agings.reduce((acc, i) => acc + i.amount, 0)
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Accounts Payable Aging Report</h1>
          <p className="text-watermark-blue-200 mt-1">Track outstanding balances by due date</p>
        </div>
        <PrimaryButton onClick={() => setPrintOpen(true)} icon={<Printer size={18} />}>
          Print Report
        </PrimaryButton>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                <th className="pb-3 font-medium">Supplier</th>
                <th className="pb-3 font-medium">Invoice No</th>
                <th className="pb-3 font-medium">Due Date</th>
                <th className="pb-3 font-medium">Amount Due</th>
                <th className="pb-3 font-medium">Aging Bracket</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((inv) => {
                const aging = calculateAging(inv.dueDate);
                return (
                  <tr key={inv.id} className="hover:bg-white/5 group">
                    <td className="py-4 font-bold">{inv.supplier?.name}</td>
                    <td className="py-4 font-medium flex items-center gap-2"><Clock size={16} className="text-watermark-blue-400" />{inv.invoiceNo}</td>
                    <td className="py-4">{format(new Date(inv.dueDate), 'MMM dd, yyyy')}</td>
                    <td className="py-4 font-bold">₱{Number(inv.totalAmountDue).toLocaleString()}</td>
                    <td className={`py-4 ${aging.color}`}>{aging.label}</td>
                    <td className="py-4"><StatusBadge status={inv.status} /></td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-white/50">No outstanding payables found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {printOpen && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={() => setPrintOpen(false)}></div>
          <div className="relative wm-print-overlay-panel">
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print</PrimaryButton>
              <button
                onClick={() => setPrintOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
              >
                Close
              </button>
            </div>
            <div className="wm-print-doc" style={{ fontSize: '10px' }}>
              <div className="wm-print-header">
                <div>
                  <div className="wm-print-brand">
                    <div className="wm-print-logo">
                      <img src="/src/assets/logo.jpg" alt="Watermark Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="wm-print-company">WATERMARK SUPERMARKET</div>
                      <div className="wm-print-address">
                        Pavilion Global<br />
                        Commerce Ave. cor. Grand Blvd.<br />
                        Alabang, Muntinlupa City 1780
                      </div>
                    </div>
                  </div>
                </div>
                <div className="wm-print-title uppercase">AGING REPORT</div>
              </div>

              <div className="grid grid-cols-2 border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[100px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Report Date:</div>
                  <div className="p-2 flex-1 flex items-center border-r border-[#1f4e79]">{formatDate(new Date())}</div>
                </div>
                <div className="flex border-b border-[#1f4e79] bg-[#eef5fb]">
                  <div className="w-[100px] font-bold p-2 border-r border-[#1f4e79] flex items-center">Report Type:</div>
                  <div className="p-2 flex-1 flex items-center bg-[#fff] font-bold">
                    <span className="border border-[#1f4e79] w-[12px] h-[12px] flex items-center justify-center mr-1 text-[8px]">✓</span> Accounts Payable
                    <span className="border border-[#1f4e79] w-[12px] h-[12px] ml-4 mr-1"></span> Others, specify:
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[100px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">As of Date:</div>
                  <div className="p-2 flex-1 flex items-center border-r border-[#1f4e79]">{formatDate(new Date())}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[100px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Department:</div>
                  <div className="p-2 flex-1 flex items-center bg-[#fff]">Finance</div>
                </div>
              </div>

              <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="w-[100px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Currency:</div>
                <div className="p-2 flex-1 flex items-center bg-[#fff] font-bold">PHP</div>
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b">
                <thead>
                  <tr>
                    <td colSpan={9} className="font-bold border-[#1f4e79] border-t border-b uppercase text-center bg-[#dce6f1] text-[#1f4e79] py-1">
                      AGING SCHEDULE
                    </td>
                  </tr>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center">
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[15%]">Supplier Name</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[11%]">Invoice No.</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[10%]">Invoice Date</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[10%]">0-30 Days</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[10%]">31-60 Days</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[10%]">61-90 Days</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[10%]">Over 90 Days</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[12%]">Total Balance</td>
                    <td className="border-[#1f4e79] border-b py-2 w-[12%]">Remarks</td>
                  </tr>
                </thead>
                <tbody>
                  {agings.map((inv, idx) => (
                    <tr key={idx} className="text-[#1f4e79]">
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 font-bold">{inv.supplier?.name}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-center">{inv.invoiceNo}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-center">{formatDate(inv.invoiceDate || inv.dueDate)}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right">{inv.bucket === '0-30' ? formatMoney(inv.amount) : ''}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right">{inv.bucket === '31-60' ? formatMoney(inv.amount) : ''}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right">{inv.bucket === '61-90' ? formatMoney(inv.amount) : ''}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right">{inv.bucket === 'over90' ? formatMoney(inv.amount) : ''}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right font-bold">{formatMoney(inv.amount)}</td>
                      <td className="border-[#1f4e79] border-b py-2 px-2"></td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 8 - agings.length) }).map((_, emptyIdx) => (
                    <tr key={`empty-${emptyIdx}`} className="h-[28px]">
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-b"></td>
                    </tr>
                  ))}
                  <tr className="bg-[#dce6f1] font-bold text-[#1f4e79]">
                    <td colSpan={3} className="text-center border-none py-2 px-2 border-r border-[#1f4e79]">TOTAL</td>
                    <td className="text-right border-none py-2 px-2 border-r border-[#1f4e79]">{formatMoney(sums['0-30'])}</td>
                    <td className="text-right border-none py-2 px-2 border-r border-[#1f4e79]">{formatMoney(sums['31-60'])}</td>
                    <td className="text-right border-none py-2 px-2 border-r border-[#1f4e79]">{formatMoney(sums['61-90'])}</td>
                    <td className="text-right border-none py-2 px-2 border-r border-[#1f4e79]">{formatMoney(sums['over90'])}</td>
                    <td className="text-right border-none py-2 px-2 border-r border-[#1f4e79]">{formatMoney(sums.total)}</td>
                    <td className="border-none py-2 px-2 border-b border-[#1f4e79]"></td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 text-[#1f4e79]">
                <div className="border-l border-r border-b border-[#1f4e79]">
                  <div className="bg-[#dce6f1] text-center font-bold py-1 border-b border-[#1f4e79]">AGING SUMMARY</div>
                  <div className="flex justify-between px-2 py-1 border-b border-[#1f4e79]">
                    <span>0-30 Days (Current)</span>
                    <span className="w-[120px] flex">PHP <span className="border-b border-[#1f4e79] flex-1 text-right">{formatMoney(sums['0-30'])}</span></span>
                  </div>
                  <div className="flex justify-between px-2 py-1 border-b border-[#1f4e79]">
                    <span>31-60 Days</span>
                    <span className="w-[120px] flex">PHP <span className="border-b border-[#1f4e79] flex-1 text-right">{formatMoney(sums['31-60'])}</span></span>
                  </div>
                  <div className="flex justify-between px-2 py-1 border-b border-[#1f4e79]">
                    <span>61-90 Days:</span>
                    <span className="w-[120px] flex">PHP <span className="border-b border-[#1f4e79] flex-1 text-right">{formatMoney(sums['61-90'])}</span></span>
                  </div>
                  <div className="flex justify-between px-2 py-1 border-b border-[#1f4e79]">
                    <span>Over 90 Days:</span>
                    <span className="w-[120px] flex">PHP <span className="border-b border-[#1f4e79] flex-1 text-right">{formatMoney(sums.over90)}</span></span>
                  </div>
                  <div className="flex justify-between px-2 py-2 font-bold bg-[#eef5fb]">
                    <span>TOTAL PAYABLES: PHP</span>
                    <span className="w-[160px] border-b-2 border-[#1f4e79] text-right">{formatMoney(sums.total)}</span>
                  </div>
                </div>

                <div className="border-r border-b border-[#1f4e79]">
                  <div className="bg-[#dce6f1] text-center font-bold py-1 border-b border-[#1f4e79]">STATUS GUIDE</div>
                  <div className="px-2 py-1.5 border-b border-[#1f4e79]">Current: Not yet due</div>
                  <div className="px-2 py-1.5 border-b border-[#1f4e79]">31-60 Days: Slightly overdue - for follow-up</div>
                  <div className="px-2 py-1.5 border-b border-[#1f4e79]">61-90 Days: Overdue - high priority</div>
                  <div className="px-2 py-[11px]">Over 90 Days: Significantly overdue - immediate action</div>
                </div>
              </div>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1">
                NOTES / REMARKS
              </div>
              <div className="border-l border-r border-[#1f4e79] h-[60px]"></div>

              <div className="border-t border-[#1f4e79] text-center font-bold py-1 bg-[#dce6f1] border-l border-r border-b">
                APPROVAL SECTION
              </div>
              <table className="wm-approval border-l border-r border-[#1f4e79] w-full text-[#1f4e79]">
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }} className="border-r border-b border-[#1f4e79] p-2 align-top h-[60px] relative">
                      <span className="font-bold absolute top-2 left-2">Prepared By</span>
                      <div className="absolute bottom-2 left-2 right-2 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic w-[200px]">Signature / Date</div>
                    </td>
                    <td style={{ width: '50%' }} className="border-b border-[#1f4e79] p-2 align-top h-[60px] relative">
                      <span className="font-bold absolute top-2 left-2">Approved By</span>
                      <div className="absolute bottom-2 left-2 right-2 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic w-[200px]">Signature / Date</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgingReport;
