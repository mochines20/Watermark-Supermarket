import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, FileCheck2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { modulesApi } from '../../api/modulesApi';
import { useAuth } from '../../context/AuthContext';

const peso = '\u20B1';

const DVReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [voucher, setVoucher] = useState<any>(null);
  const [docsComplete, setDocsComplete] = useState(false);
  const [discount, setDiscount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('CHECK');
  const [checkNo, setCheckNo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [acknowledgedReceipt, setAcknowledgedReceipt] = useState('');
  const [savedPayment, setSavedPayment] = useState<any>(null);

  useEffect(() => {
    if (id) modulesApi.getVoucherById(id).then(setVoucher);
  }, [id]);

  const amount = Number(voucher?.amountFigures || 0);
  const discountAmount = amount * (Number(discount || 0) / 100);
  const netAmount = amount - discountAmount;
  const dvNumberPreview = useMemo(() => `DV-${new Date().getFullYear()}-AUTO`, []);

  const releasePayment = async () => {
    if (!voucher) return;
    
    // Validate document completeness
    if (!docsComplete) {
      alert('Documents are not complete. Please verify all required documents (PO, RR, Invoice, Approved Voucher) before proceeding.');
      return;
    }
    
    try {
      const payment = await modulesApi.createPayment({
        voucherId: voucher.id,
        paymentMode,
        checkNo,
        referenceNo,
        recipientName: recipientName || voucher.payee,
        modeOfReceipt: paymentMode,
        acknowledgedReceipt,
        releasedBy: user?.name
      });
      setSavedPayment(payment);
    } catch (error: any) {
      // If payment fails, return to Accounting
      if (error.response?.data?.error?.includes('Payment processing failed')) {
        alert('Payment processing failed. Returning to Accounting Department for review.');
        // In production, would navigate back to Accounting or show return screen
      } else {
        alert(error.response?.data?.error || 'Error releasing payment');
      }
    }
  };

  if (!voucher) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">DV Review</h1>
        <p className="text-watermark-blue-200 mt-1">Review supporting documents and release payment</p>
      </div>

      <GlassCard>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
          {[
            ['PR Details', voucher.invoice?.po?.prNumber || voucher.invoice?.po?.pr?.prNumber || 'Linked via PO'],
            ['PO Details', voucher.invoice?.po?.poNumber || 'N/A'],
            ['Supplier Invoice', voucher.invoice?.invoiceNo || 'N/A'],
            ['Approved Voucher', voucher.voucherNo]
          ].map(([label, value]) => (
            <div key={label} className="p-4 bg-white/5 rounded-xl">
              <div className="text-watermark-blue-200 text-sm">{label}</div>
              <div className="text-white font-bold mt-2">{value}</div>
            </div>
          ))}
        </div>

        <label className="flex items-center gap-3 text-white mb-6">
          <input type="checkbox" checked={docsComplete} onChange={(e) => setDocsComplete(e.target.checked)} className="accent-watermark-blue-400" />
          Are all documents complete?
        </label>

        {docsComplete && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-xl space-y-4">
              <h2 className="font-bold text-white flex items-center gap-2"><FileCheck2 size={18} /> DV Summary</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-watermark-blue-200">DV Number</div><div className="text-white font-semibold">{savedPayment?.dvNumber || dvNumberPreview}</div>
                <div className="text-watermark-blue-200">Gross Amount</div><div className="text-white font-semibold">{peso}{amount.toLocaleString()}</div>
                <div className="text-watermark-blue-200">Discount %</div><input value={discount} onChange={(e) => setDiscount(e.target.value)} type="number" className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white" />
                <div className="text-watermark-blue-200">Net Amount</div><div className="text-white font-semibold">{peso}{netAmount.toLocaleString()}</div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl space-y-4">
              <h2 className="font-bold text-white">Payment Details</h2>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white">
                <option className="text-black" value="CHECK">Check</option>
                <option className="text-black" value="BANK_TRANSFER">Bank Transfer</option>
                <option className="text-black" value="CASH">Cash</option>
              </select>
              {paymentMode === 'CHECK' && <input placeholder="Check number" value={checkNo} onChange={(e) => setCheckNo(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />}
              {paymentMode === 'BANK_TRANSFER' && <input placeholder="Bank reference" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />}
              {paymentMode === 'CASH' && <input placeholder="Cash release reference" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />}
              <input placeholder="Recipient name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              <input placeholder="Acknowledgement receipt / AR reference" value={acknowledgedReceipt} onChange={(e) => setAcknowledgedReceipt(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              <PrimaryButton onClick={releasePayment}>Release Payment</PrimaryButton>
            </div>
          </div>
        )}

        {savedPayment && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><CheckCircle2 /> Payment logged. Archive will be completed when OR is received and payment is closed.</div>
            <button onClick={() => navigate('/disbursement/payments')} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15">Back to Payments</button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default DVReview;
