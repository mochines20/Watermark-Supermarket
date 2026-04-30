import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, X, Banknote, Printer } from 'lucide-react';
import { modulesApi } from '../api/modulesApi';
import { format } from 'date-fns';

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [printPROpen, setPrintPROpen] = useState(false);
  const [printPRData, setPrintPRData] = useState<any | null>(null);
  const [printRegisterOpen, setPrintRegisterOpen] = useState(false);

  // Form State
  const [voucherId, setVoucherId] = useState('');
  const [checkNo, setCheckNo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [approvedVouchers, setApprovedVouchers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pData, vData] = await Promise.all([
        modulesApi.getPayments(),
        modulesApi.getVouchers()
      ]);
      setPayments(pData);
      setApprovedVouchers(vData.filter((v: any) => v.status === 'APPROVED'));
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await modulesApi.createPayment({
        voucherId,
        checkNo,
        referenceNo
      });
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error processing payment');
    }
  };

  const handlePrintPR = (payment: any) => {
    setPrintPRData(payment);
    setPrintPROpen(true);
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Disbursements</h1>
          <p className="text-watermark-blue-200 mt-1">Release funds and record check payments</p>
        </div>
        <div className="flex gap-2">
          <PrimaryButton onClick={() => setPrintRegisterOpen(true)} icon={<Printer size={18} />}>
            Print Check Register
          </PrimaryButton>
          {!showForm && (
            <PrimaryButton onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
              Release Payment
            </PrimaryButton>
          )}
        </div>
      </div>

      {showForm ? (
        <GlassCard className="animate-fade-in relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Record New Disbursement</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Approved Voucher</label>
                <select 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10"
                  value={voucherId} onChange={(e) => setVoucherId(e.target.value)} required
                >
                  <option value="" className="text-black">Select Voucher...</option>
                  {approvedVouchers.map(v => (
                    <option key={v.id} value={v.id} className="text-black">
                      {v.voucherNo} - {v.payee} (₱{Number(v.amountFigures).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <GlassInput label="Check Number (if applicable)" value={checkNo} onChange={(e) => setCheckNo(e.target.value)} />
              <GlassInput label="Bank Reference / Trans No." value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} required />
            </div>
            <div className="flex justify-end pt-6 border-t border-white/10">
              <PrimaryButton type="submit">Complete Payment</PrimaryButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3 font-medium">Voucher Ref</th>
                  <th className="pb-3 font-medium">Payee</th>
                  <th className="pb-3 font-medium">Date Disbursed</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Check / Ref</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 group">
                    <td className="py-4 font-medium flex items-center gap-2"><Banknote size={16} className="text-green-400" />{p.voucher?.voucherNo}</td>
                    <td className="py-4">{p.voucher?.payee}</td>
                    <td className="py-4">{format(new Date(p.paymentDate), 'MMM dd, yyyy')}</td>
                    <td className="py-4 font-bold">₱{Number(p.amount).toLocaleString()}</td>
                    <td className="py-4">{p.checkNo || p.referenceNo}</td>
                    <td className="py-4"><StatusBadge status={p.status} /></td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => handlePrintPR(p)}
                        className="text-sm text-watermark-blue-300 hover:text-white px-3 py-1 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Print PR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {printPROpen && printPRData && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={() => setPrintPROpen(false)}></div>
          <div className="relative wm-print-overlay-panel" style={{ maxWidth: '800px' }}>
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print PR</PrimaryButton>
              <button
                onClick={() => setPrintPROpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
              >
                Close
              </button>
            </div>

            <div className="wm-print-doc" style={{ fontSize: '12px' }}>
              <div className="wm-print-header mb-2">
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
                <div className="wm-print-title uppercase text-[18px]">PROVISIONAL RECEIPT</div>
              </div>

              {/* Grid 1: PR No and Date Issued */}
              <div className="grid grid-cols-2 border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-2 border-r border-[#1f4e79] bg-[#eef5fb]">PR No:</div>
                  <div className="p-2 flex-1 font-bold text-red-600">PR-{printPRData.id.substring(0, 8).toUpperCase()}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-2 border-r border-[#1f4e79] bg-[#eef5fb]">Date Issued:</div>
                  <div className="p-2 flex-1">{format(new Date(), 'MMM dd, yyyy')}</div>
                </div>
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-center text-[#1f4e79] uppercase">
                RECEIVED FROM
              </div>

              <div className="border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[160px] font-bold p-2 border-r border-[#1f4e79] bg-[#eef5fb]">Paid to/Payee:</div>
                  <div className="p-2 flex-1 font-bold">{printPRData.voucher?.payee || ''}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[160px] font-bold p-2 border-r border-[#1f4e79] bg-[#eef5fb]">Name:</div>
                  <div className="p-2 flex-1">{printPRData.voucher?.invoice?.supplier?.contactPerson || ''}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[160px] font-bold p-2 border-r border-[#1f4e79] bg-[#eef5fb]">Address:</div>
                  <div className="p-2 flex-1 truncate">{printPRData.voucher?.payeeAddress || printPRData.voucher?.invoice?.supplier?.address || ''}</div>
                </div>
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-center text-[#1f4e79] uppercase">
                PAYMENT DETAILS
              </div>

              <div className="border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-[#1f4e79] p-2 gap-6 items-center">
                  <label className="flex items-center gap-1 cursor-not-allowed"><input type="checkbox" readOnly checked={printPRData.voucher?.modeOfPayment === 'CASH'} className="border-[#1f4e79] accent-[#1f4e79]" /> Cash</label>
                  <label className="flex items-center gap-1 cursor-not-allowed"><input type="checkbox" readOnly checked={printPRData.voucher?.modeOfPayment === 'CHECK'} className="border-[#1f4e79] accent-[#1f4e79]" /> Check</label>
                  <label className="flex items-center gap-1 cursor-not-allowed"><input type="checkbox" readOnly checked={printPRData.voucher?.modeOfPayment === 'ONLINE_TRANSFER'} className="border-[#1f4e79] accent-[#1f4e79]" /> Bank Transfer</label>
                  <label className="flex items-center gap-1 cursor-not-allowed"><input type="checkbox" readOnly checked={false} className="border-[#1f4e79] accent-[#1f4e79]" /> E-Wallet</label>
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 cursor-not-allowed"><input type="checkbox" readOnly checked={false} className="border-[#1f4e79]" /> Others, specify:</label>
                    <div className="border-b border-[#1f4e79] w-[150px]"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-[#1f4e79]">
                  <div className="flex border-r border-[#1f4e79]">
                    <div className="w-[160px] font-bold p-2 border-r border-[#1f4e79] bg-[#eef5fb]">Reference No.</div>
                    <div className="p-2 flex-1">{printPRData.checkNo || printPRData.referenceNo}</div>
                  </div>
                  <div className="flex">
                    <div className="w-[160px] font-bold p-2 border-r border-[#1f4e79] bg-[#eef5fb]">Date of Payment:</div>
                    <div className="p-2 flex-1">{format(new Date(printPRData.paymentDate), 'MMM dd, yyyy')}</div>
                  </div>
                </div>
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-center text-[#1f4e79] uppercase">
                PARTICULARS
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full" style={{ fontSize: '11px' }}>
                <thead>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center">
                    <td className="border-[#1f4e79] border-r border-b p-2 w-[70%]">Description of Payment</td>
                    <td className="border-[#1f4e79] border-b p-2 w-[30%]">Amount (P)</td>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-[#1f4e79]">
                    <td className="border-[#1f4e79] border-r border-b p-2">{printPRData.voucher?.explanation || `Payment for Voucher ${printPRData.voucher?.voucherNo}`}</td>
                    <td className="border-[#1f4e79] border-b p-2 text-right">{Number(printPRData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  {/* Empty rows */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="h-[28px]">
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-b"></td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-[#eef5fb] text-[#1f4e79]">
                    <td className="border-[#1f4e79] border-r p-2 text-right">Total Amount Received</td>
                    <td className="p-2 text-right">{Number(printPRData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-[#1f4e79] uppercase">
                ACKNOWLEDGEMENT
              </div>
              <div className="border-l border-r border-[#1f4e79] p-2 text-[10px] text-[#1f4e79] leading-tight border-b">
                <p>This provisional receipt is issued as an acknowledgment of payment received.</p>
                <p>This is NOT an official receipt and is subject to verification.</p>
                <p>An Official Receipt will be issued upon confirmation and validation of the transaction.</p>
              </div>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79] uppercase">
                APPROVAL SECTION
              </div>
              
              <table className="wm-approval border-l border-r border-b border-[#1f4e79] w-full text-[#1f4e79]">
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }} className="border-r border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[11px]">Received By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic">Signature / Date</div>
                    </td>
                    <td style={{ width: '50%' }} className="p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[11px]">Approved By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[9px] italic">Signature / Date</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79] uppercase">
                SYSTEM / CONTROL SECTION (FOR INTERN USE)
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] text-[#1f4e79]">
                <div className="grid grid-cols-3 border-b border-[#1f4e79]">
                  <div className="border-r border-[#1f4e79] p-2 bg-[#eef5fb]">
                    <div className="font-bold mb-4">Linked Transaction No.:</div>
                    <div className="border-b border-[#1f4e79] text-center">{printPRData.voucher?.voucherNo}</div>
                  </div>
                  <div className="border-r border-[#1f4e79] p-2 bg-[#eef5fb]">
                    <div className="font-bold mb-4">Encoded By.:</div>
                    <div className="border-b border-[#1f4e79] text-center">{printPRData.cashier}</div>
                  </div>
                  <div className="p-2 bg-[#eef5fb]">
                    <div className="font-bold mb-4">Date Encoded.:</div>
                    <div className="border-b border-[#1f4e79] text-center">{format(new Date(printPRData.createdAt), 'MMM dd, yyyy h:mm a')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-[2fr_1fr]">
                  <div className="border-r border-[#1f4e79] p-2 flex items-center gap-4 bg-[#eef5fb]">
                    <span className="font-bold">Status:</span>
                    <label className="flex items-center gap-1 cursor-not-allowed"><input type="checkbox" readOnly checked={printPRData.status === 'PENDING_OR'} className="border-[#1f4e79] accent-[#1f4e79]" /> Pending</label>
                    <label className="flex items-center gap-1 cursor-not-allowed"><input type="checkbox" readOnly checked={false} className="border-[#1f4e79] accent-[#1f4e79]" /> Verified</label>
                    <label className="flex items-center gap-1 cursor-not-allowed"><input type="checkbox" readOnly checked={printPRData.status === 'CLOSED'} className="border-[#1f4e79] accent-[#1f4e79]" /> Replaced by OR</label>
                  </div>
                  <div className="p-2 bg-[#eef5fb]">
                    <span className="font-bold block mb-1">Remarks:</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {printRegisterOpen && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={() => setPrintRegisterOpen(false)}></div>
          <div className="relative wm-print-overlay-panel overflow-x-auto" style={{ width: '100%', maxWidth: '1200px' }}>
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print Register</PrimaryButton>
              <button
                onClick={() => setPrintRegisterOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
              >
                Close
              </button>
            </div>

            <div className="wm-print-doc" style={{ fontSize: '10px' }}>
              <div className="wm-print-header mb-2 flex justify-between items-start">
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
                <div className="wm-print-title uppercase text-[18px]">ACCOUNTS PAYABLE CHECK REGISTER</div>
              </div>

              <div className="border-t border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-l border-r border-[#1f4e79]">
                  <div className="w-[160px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Register Period:</div>
                  <div className="p-1 flex-1">All Time</div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79]">
                  <div className="w-[160px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Bank Name:</div>
                  <div className="p-1 flex-1"></div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79]">
                  <div className="w-[160px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Account Number:</div>
                  <div className="p-1 flex-1"></div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79]">
                  <div className="w-[160px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Prepared Date:</div>
                  <div className="p-1 flex-1">{format(new Date(), 'MMM dd, yyyy')}</div>
                </div>
                <div className="flex border-b border-l border-r border-[#1f4e79]">
                  <div className="w-[160px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Prepared By:</div>
                  <div className="p-1 flex-1"></div>
                </div>
              </div>

              {(() => {
                const checkPayments = payments.filter(p => p.voucher?.modeOfPayment === 'CHECK' || p.checkNo);
                const totalChecksIssued = checkPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                const totalAdjustments = 0;
                return (
                  <>
                    <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-center text-[#1f4e79] uppercase">
                      ACCOUNT SUMMARY
                    </div>
                    <div className="grid grid-cols-4 text-center text-white border-l border-r border-[#1f4e79]">
                      <div className="bg-[#2e75b6] p-1 border-r border-[#1f4e79] font-bold">Beginning Balance</div>
                      <div className="bg-[#2e75b6] p-1 border-r border-[#1f4e79] font-bold">Total Checks Issued</div>
                      <div className="bg-[#2e75b6] p-1 border-r border-[#1f4e79] font-bold">Total Adjustments</div>
                      <div className="bg-[#2e75b6] p-1 font-bold">Ending Balance</div>
                    </div>
                    <div className="grid grid-cols-4 text-center text-[#1f4e79] border-l border-r border-b border-[#1f4e79] h-[32px] items-center">
                      <div className="border-r border-[#1f4e79] h-full flex items-center justify-center p-1 font-bold"></div>
                      <div className="border-r border-[#1f4e79] h-full flex items-center justify-center p-1 font-bold">{Number(totalChecksIssued).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="border-r border-[#1f4e79] h-full flex items-center justify-center p-1 font-bold">{Number(totalAdjustments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="h-full flex items-center justify-center p-1 font-bold"></div>
                    </div>

                    <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-center text-[#1f4e79] uppercase">
                      CHECK ISSUANCE RECORD
                    </div>

                    <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full" style={{ fontSize: '9px' }}>
                      <thead>
                        <tr className="bg-[#2e75b6] text-white font-bold text-center">
                          <td className="border-[#1f4e79] border-r border-b p-1">Date</td>
                          <td className="border-[#1f4e79] border-r border-b p-1">Check No.</td>
                          <td className="border-[#1f4e79] border-r border-b p-1">Voucher No.</td>
                          <td className="border-[#1f4e79] border-r border-b p-1">Payee / Supplier</td>
                          <td className="border-[#1f4e79] border-r border-b p-1">Description</td>
                          <td className="border-[#1f4e79] border-r border-b p-1">AP Code</td>
                          <td className="border-[#1f4e79] border-r border-b p-1">Amount</td>
                          <td className="border-[#1f4e79] border-b p-1">Running Balance</td>
                        </tr>
                      </thead>
                      <tbody>
                        {checkPayments.map((p, idx) => (
                          <tr key={idx} className="text-[#1f4e79] text-center">
                            <td className="border-[#1f4e79] border-r border-b p-1">{format(new Date(p.paymentDate), 'MM-dd-yyyy')}</td>
                            <td className="border-[#1f4e79] border-r border-b p-1">{p.checkNo}</td>
                            <td className="border-[#1f4e79] border-r border-b p-1">{p.voucher?.voucherNo}</td>
                            <td className="border-[#1f4e79] border-r border-b p-1 truncate max-w-[120px]">{p.voucher?.payee}</td>
                            <td className="border-[#1f4e79] border-r border-b p-1 truncate max-w-[150px]">{p.voucher?.explanation || `Payment for ${p.voucher?.voucherNo}`}</td>
                            <td className="border-[#1f4e79] border-r border-b p-1">01-0020</td>
                            <td className="border-[#1f4e79] border-r border-b p-1 text-right">{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="border-[#1f4e79] border-b p-1"></td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 12 - checkPayments.length) }).map((_, i) => (
                          <tr key={`empty-${i}`} className="h-[20px]">
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
                      </tbody>
                    </table>
                  </>
                );
              })()}

              <div className="grid grid-cols-2 border-l border-r border-b border-[#1f4e79] text-[#1f4e79]">
                <div className="border-r border-[#1f4e79]">
                  <div className="bg-[#dce6f1] font-bold p-1 text-center border-b border-[#1f4e79] uppercase">ADDITIONAL DETAILS</div>
                  <div className="h-[60px]"></div>
                </div>
                <div>
                  <div className="bg-[#dce6f1] font-bold p-1 text-center border-b border-[#1f4e79] uppercase">NOTES / REMARKS</div>
                  <div className="h-[60px]"></div>
                </div>
              </div>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79] uppercase">
                APPROVAL SECTION
              </div>
              
              <table className="wm-approval border-l border-r border-b border-[#1f4e79] w-full text-[#1f4e79]">
                <tbody>
                  <tr>
                    <td style={{ width: '33.33%' }} className="border-r border-[#1f4e79] p-2 align-top h-[60px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Prepared By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[80%]">Signature / Date</div>
                    </td>
                    <td style={{ width: '33.33%' }} className="border-r border-[#1f4e79] p-2 align-top h-[60px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Checked by</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[80%]">Signature / Date</div>
                    </td>
                    <td style={{ width: '33.33%' }} className="p-2 align-top h-[60px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Approved by</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[80%]">Signature / Date</div>
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

export default Payments;
