import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, X, FileSignature } from 'lucide-react';
import { modulesApi } from '../api/modulesApi';
import { format } from 'date-fns';

const VoucherApproval = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [printVoucher, setPrintVoucher] = useState<any | null>(null);

  // Form State
  const [invoiceId, setInvoiceId] = useState('');
  const [amountWords, setAmountWords] = useState('');
  const [voucherType, setVoucherType] = useState('CHECK');
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vData, iData] = await Promise.all([
        modulesApi.getVouchers(),
        modulesApi.getInvoices()
      ]);
      setVouchers(vData);
      setInvoices(iData.filter((i: any) => i.threeWayStatus === 'MATCHED' && i.status !== 'PAID'));
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await modulesApi.createVoucher({
        invoiceId,
        amountWords,
        voucherType
      });
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error generating voucher');
    }
  };

  const approveVoucher = async (id: string) => {
    try {
      await modulesApi.approveVoucher(id);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error approving voucher');
    }
  };

  const openPrint = async (id: string) => {
    try {
      const voucher = await modulesApi.getVoucherById(id);
      setPrintVoucher(voucher);
      setPrintOpen(true);
    } catch (error) {
      console.error('Failed to load Voucher for print:', error);
      alert('Failed to load Voucher details');
    }
  };

  const closePrint = () => {
    setPrintOpen(false);
    setPrintVoucher(null);
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

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Voucher Approval</h1>
          <p className="text-watermark-blue-200 mt-1">Management review and approval for disbursements</p>
        </div>
        {!showForm && (
          <PrimaryButton onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
            Generate Voucher
          </PrimaryButton>
        )}
      </div>

      {showForm ? (
        <GlassCard className="animate-fade-in relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Prepare Disbursement Voucher</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Matched Invoice</label>
                <select 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10"
                  value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} required
                >
                  <option value="" className="text-black">Select Invoice...</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id} className="text-black">
                      {inv.invoiceNo} - ₱{Number(inv.totalAmountDue).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Voucher Type</label>
                <select 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10"
                  value={voucherType} onChange={(e) => setVoucherType(e.target.value)} required
                >
                  <option value="CHECK" className="text-black">Check Voucher (CV)</option>
                  <option value="CASH_DISBURSEMENT" className="text-black">Cash Disbursement Voucher (CDV)</option>
                </select>
              </div>
              <div className="col-span-2">
                <GlassInput label="Amount in Words" value={amountWords} onChange={(e) => setAmountWords(e.target.value)} required />
              </div>
            </div>
            <div className="flex justify-end pt-6 border-t border-white/10">
              <PrimaryButton type="submit">Submit for Approval</PrimaryButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3 font-medium">Voucher No</th>
                  <th className="pb-3 font-medium">Payee</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 group">
                    <td className="py-4 font-medium flex items-center gap-2"><FileSignature size={16} className="text-purple-400" />{v.voucherNo}</td>
                    <td className="py-4">{v.payee}</td>
                    <td className="py-4">{format(new Date(v.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="py-4 font-bold">₱{Number(v.amountFigures).toLocaleString()}</td>
                    <td className="py-4"><StatusBadge status={v.status} /></td>
                    <td className="py-4 text-right">
                      {v.status === 'PENDING' && (
                        <button onClick={() => approveVoucher(v.id)} className="text-sm text-green-400 hover:text-green-300 font-medium px-3 py-1 bg-green-500/10 rounded-lg mr-2">
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => openPrint(v.id)}
                        className="text-sm text-watermark-blue-300 hover:text-white px-3 py-1 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {printOpen && printVoucher && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={closePrint}></div>
          <div className="relative wm-print-overlay-panel">
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print</PrimaryButton>
              <button
                onClick={closePrint}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
              >
                Close
              </button>
            </div>

            {printVoucher.voucherType === 'CHECK' ? (
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
                  <div className="wm-print-title uppercase">CHECK VOUCHER</div>
                </div>

                <div className="grid grid-cols-2 border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Voucher No.:</div>
                    <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.voucherNo}</div>
                  </div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Date:</div>
                    <div className="p-2 flex-1 text-[11px] flex items-center">{formatDate(printVoucher.createdAt)}</div>
                  </div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Payee:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.payee || ''}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="flex border-r border-[#1f4e79]">
                    <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Amount (PHP):</div>
                    <div className="p-2 flex-1 text-[11px] flex items-center font-bold">{formatMoney(printVoucher.amountFigures)}</div>
                  </div>
                  <div className="flex">
                    <div className="w-[120px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Check / Ref No.:</div>
                    <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.referenceNo || ''}</div>
                  </div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Mode of Payment:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center font-bold">
                    <span className="border border-[#1f4e79] w-[12px] h-[12px] flex items-center justify-center mr-1 text-[8px] bg-[#fff]">
                      {printVoucher.modeOfPayment === 'CASH' ? '✓' : ''}
                    </span> Cash
                    <span className="border border-[#1f4e79] w-[12px] h-[12px] flex items-center justify-center ml-4 mr-1 text-[8px] bg-[#fff]">
                      {printVoucher.modeOfPayment === 'CHECK' ? '✓' : ''}
                    </span> Check
                    <span className="border border-[#1f4e79] w-[12px] h-[12px] flex items-center justify-center ml-4 mr-1 text-[8px] bg-[#fff]">
                      {printVoucher.modeOfPayment === 'ONLINE' ? '✓' : ''}
                    </span> Online Transfer
                  </div>
                </div>

                <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79]">
                  EXPLANATION
                </div>
                <div className="border-l border-r border-b border-[#1f4e79] h-[80px] p-2 text-[11px] text-[#1f4e79]">
                  {printVoucher.explanation}
                </div>

                <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">PO No.:</div>
                    <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.invoice?.po?.poNumber || ''}</div>
                  </div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">RR No.:</div>
                    <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.invoice?.rr?.rrNumber || ''}</div>
                  </div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Invoice No.:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.invoice?.invoiceNo || ''}</div>
                </div>

                <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-left font-bold py-1 px-2 text-[#1f4e79] text-[11px]">
                  PAYMENT BREAKDOWN
                </div>

                <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">G/L Account:</div>
                    <div className="p-2 flex-1 text-[11px] flex items-center">Accounts Payable</div>
                  </div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Account Code:</div>
                    <div className="p-2 flex-1 text-[11px] flex items-center">2010</div>
                  </div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">System Ref:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.invoice?.id || ''}</div>
                </div>

                <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="flex-1 font-bold p-2 text-[11px] border-r border-[#1f4e79] text-right bg-[#fff]">Debit Total (PHP):</div>
                  <div className="w-[200px] p-2 text-[11px] font-bold text-right">{formatMoney(printVoucher.debitTotal)}</div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="flex-1 font-bold p-2 text-[11px] border-r border-[#1f4e79] text-right bg-[#fff]">Credit Total (PHP):</div>
                  <div className="w-[200px] p-2 text-[11px] font-bold text-right">{formatMoney(printVoucher.creditTotal)}</div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                  <div className="flex-1 font-bold p-2 text-[11px] border-r border-[#1f4e79] text-right bg-[#fff]">Unbalanced Amount (PHP):</div>
                  <div className="w-[200px] p-2 text-[11px] font-bold text-right">{formatMoney(Math.abs(Number(printVoucher.debitTotal) - Number(printVoucher.creditTotal)))}</div>
                </div>

                <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79] p-2 text-[11px] items-center bg-[#eef5fb]">
                  <div className="mr-4">System Entry Posted:</div>
                  <span className="border border-[#1f4e79] bg-[#fff] w-[12px] h-[12px] flex items-center justify-center mr-1 text-[8px]">
                    {printVoucher.status === 'APPROVED' ? '✓' : ''}
                  </span> Yes
                  <span className="border border-[#1f4e79] bg-[#fff] w-[12px] h-[12px] flex items-center justify-center ml-4 mr-1 text-[8px]">
                    {printVoucher.status !== 'APPROVED' ? '✓' : ''}
                  </span> No
                </div>

                <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79]">
                  AUTHORIZATION & RECEIPT
                </div>
                
                <table className="wm-approval border-l border-r border-b border-[#1f4e79] w-full text-[#1f4e79]">
                  <tbody>
                    <tr>
                      <td style={{ width: '33.3%' }} className="border-r border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                        <span className="font-bold absolute top-2 left-2 text-[10px]">Authorized By</span>
                        <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic">Signature / Date</div>
                      </td>
                      <td style={{ width: '33.3%' }} className="border-r border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                        <span className="font-bold absolute top-2 left-2 text-[10px]">Received By</span>
                        <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic">Signature / Date</div>
                      </td>
                      <td style={{ width: '33.4%' }} className="p-2 align-top h-[70px] relative bg-[#eef5fb]">
                        <span className="font-bold absolute top-2 left-2 text-[10px]">Date Received</span>
                        <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px]"></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
            <div className="wm-print-doc">
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
                <div className="wm-print-title uppercase">CASH DISBURSEMENT VOUCHER</div>
              </div>

              <div className="grid grid-cols-2 border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Voucher No.:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.voucherNo}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Date:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">{formatDate(printVoucher.createdAt)}</div>
                </div>
              </div>
              <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Payee:</div>
                <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.payee || ''}</div>
              </div>
              <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Address:</div>
                <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.payeeAddress || ''}</div>
              </div>
              <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Amount (Figures):</div>
                <div className="p-2 flex-1 text-[11px] flex items-center font-bold">{formatMoney(printVoucher.amountFigures)}</div>
              </div>
              <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Amount (Words):</div>
                <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.amountWords || ''}</div>
              </div>
              <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Mode of Payment:</div>
                <div className="p-2 flex-1 text-[11px] flex items-center font-bold">
                  <span className="border border-[#1f4e79] w-[12px] h-[12px] flex items-center justify-center mr-1 text-[8px]">
                    {printVoucher.modeOfPayment === 'CASH' ? '✓' : ''}
                  </span> Cash
                  <span className="border border-[#1f4e79] w-[12px] h-[12px] flex items-center justify-center ml-4 mr-1 text-[8px]">
                    {printVoucher.modeOfPayment === 'CHECK' ? '✓' : ''}
                  </span> Check
                  <span className="border border-[#1f4e79] w-[12px] h-[12px] flex items-center justify-center ml-4 mr-1 text-[8px]">
                    {printVoucher.modeOfPayment === 'ONLINE' ? '✓' : ''}
                  </span> Online Transfer
                </div>
              </div>
              <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Check No. / Ref No.:</div>
                <div className="p-2 flex-1 text-[11px] flex items-center">{printVoucher.referenceNo || ''}</div>
              </div>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79]">
                EXPLANATION / PURPOSE
              </div>
              <div className="border-l border-r border-b border-[#1f4e79] h-[80px] p-2 text-[11px] text-[#1f4e79]">
                {printVoucher.explanation}
              </div>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Account Title:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">Accounts Payable</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Account Code:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">2010</div>
                </div>
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full">
                <thead>
                  <tr>
                    <td colSpan={3} className="font-bold border-[#1f4e79] border-t border-b uppercase text-left bg-[#dce6f1] text-[#1f4e79] py-1 px-2 text-[11px]">
                      ACCOUNTING ENTRIES
                    </td>
                  </tr>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center text-[11px]">
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[60%]">Particulars</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[20%]">Debit (PHP)</td>
                    <td className="border-[#1f4e79] border-b py-2 w-[20%]">Credit (PHP)</td>
                  </tr>
                </thead>
                <tbody>
                  {printVoucher.entries?.map((entry: any, idx: number) => (
                    <tr key={idx} className="text-[11px] text-[#1f4e79]">
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-left">{entry.particulars}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right">{entry.debit ? formatMoney(entry.debit) : ''}</td>
                      <td className="border-[#1f4e79] border-b py-2 px-2 text-right">{entry.credit ? formatMoney(entry.credit) : ''}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - (printVoucher.entries?.length || 0)) }).map((_, emptyIdx) => (
                    <tr key={`empty-${emptyIdx}`} className="text-[11px] h-[28px]">
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-b"></td>
                    </tr>
                  ))}
                  <tr className="font-bold text-[11px] text-[#1f4e79]">
                    <td className="text-right border-none py-2 px-2 border-r border-[#1f4e79] bg-[#dce6f1]">TOTAL:</td>
                    <td className="text-right border-none py-2 px-2 border-r border-[#1f4e79] border-b">{formatMoney(printVoucher.debitTotal)}</td>
                    <td className="text-right border-none py-2 px-2 border-b border-[#1f4e79]">{formatMoney(printVoucher.creditTotal)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79]">
                AUTHORIZATION & RECEIPT
              </div>
              
              <table className="wm-approval border-l border-r border-b border-[#1f4e79] w-full text-[#1f4e79]">
                <tbody>
                  <tr>
                    <td style={{ width: '33.3%' }} className="border-r border-b border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Prepared By</span>
                      <div className="absolute bottom-2 left-2 text-[#1f4e79] text-[11px] font-medium">{printVoucher.preparedBy}</div>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic">Signature / Date</div>
                    </td>
                    <td style={{ width: '33.3%' }} className="border-r border-b border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Checked By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic">Signature / Date</div>
                    </td>
                    <td style={{ width: '33.4%' }} className="border-b border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Approved By</span>
                      <div className="absolute bottom-2 left-2 text-[#1f4e79] text-[11px] font-medium">{printVoucher.approvedBy}</div>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic">Signature / Date</div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border-r border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Received By</span>
                      <div className="absolute bottom-2 left-2 right-[20%] border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic">Signature / Date</div>
                    </td>
                    <td className="p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Date Received:</span>
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherApproval;
