import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Barcode, CheckCircle2, Scan } from 'lucide-react';
import { format } from 'date-fns';
import { GlassCard } from '../../components/ui/GlassCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { modulesApi } from '../../api/modulesApi';
import { useAuth } from '../../context/AuthContext';

const GRNEntry = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState(params.get('poId') || '');
  const [step, setStep] = useState(1);
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [saved, setSaved] = useState<any>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanIndex, setScanIndex] = useState<number | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    modulesApi.getDeliveries().then(setDeliveries);
    modulesApi.getInventory().then(setInventoryItems);
  }, []);

  const po = useMemo(() => deliveries.find((row) => row.id === selectedPoId), [deliveries, selectedPoId]);

  useEffect(() => {
    if (!po) return;
    setItems(po.items.map((item: any) => ({
      itemNo: item.itemNo,
      description: item.description,
      unit: item.unit || 'EA',
      orderedQty: Number(item.quantity),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.amount),
      lotNo: '',
      expiryDate: '',
      reason: 'SHORT_DELIVERY',
      actionTaken: '',
      remarks: ''
    })));
  }, [po]);

  const updateItem = (index: number, key: string, value: any) => {
    setItems((prev) => {
      const item = prev[index];
      if (!item) return prev;
      const updatedItem = {
        ...item,
        [key]: value,
        total: key === 'quantity' || key === 'unitPrice'
          ? Number(key === 'quantity' ? value : item.quantity) * Number(key === 'unitPrice' ? value : item.unitPrice)
          : item.total
      };

      return prev.map((row, idx) => idx === index ? updatedItem : row);
    });

    // Auto-divert to discrepancy screen if quantities don't match.
    // The UI already handles this via hasDiscrepancy check.
  };

  const addItem = () => {
    setItems((prev) => [...prev, { itemNo: '', description: '', unit: 'EA', orderedQty: 0, quantity: 0, unitPrice: 0, total: 0, lotNo: '', expiryDate: '', reason: 'WRONG_ITEM', actionTaken: '', remarks: '' }]);
  };

  const openScanModal = (index: number) => {
    setScanIndex(index);
    setScanModalOpen(true);
    setBarcodeInput('');
  };

  const handleBarcodeScan = () => {
    if (scanIndex === null) return;
    
    // Look up item by barcode (item code)
    const foundItem = inventoryItems.find((item) => item.itemCode === barcodeInput);
    
    if (foundItem) {
      updateItem(scanIndex, 'itemNo', foundItem.itemCode);
      updateItem(scanIndex, 'description', foundItem.description);
      updateItem(scanIndex, 'unit', foundItem.unit);
      updateItem(scanIndex, 'unitPrice', foundItem.standardCost);
      setScanModalOpen(false);
      setBarcodeInput('');
    } else {
      alert('Item not found in inventory');
    }
  };

  const discrepancyItems = items
    .filter((item) => Number(item.quantity) !== Number(item.orderedQty))
    .map((item) => ({
      ...item,
      varianceQty: Number(item.quantity) - Number(item.orderedQty),
      descriptionOfIssue: `${item.description} received ${item.quantity} vs ordered ${item.orderedQty}`
    }));

  // Auto-divert to discrepancy step if discrepancies exist
  const hasDiscrepancies = discrepancyItems.length > 0;
  useEffect(() => {
    if (hasDiscrepancies && step === 2) {
      // Optionally auto-scroll to first discrepancy item or show alert
      // For now, the UI already highlights discrepancies in red
    }
  }, [hasDiscrepancies, step]);

  const totals = {
    totalItems: items.length,
    totalQty: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    totalAmount: items.reduce((sum, item) => sum + Number(item.total || 0), 0)
  };

  const save = async () => {
    if (!selectedPoId) {
      alert('Please select a purchase order before saving.');
      return;
    }

    const invalidItem = items.find((item) => !item.itemNo || !item.description || Number(item.quantity) < 0 || Number(item.unitPrice) < 0 || Number(item.total) < 0);
    if (invalidItem) {
      alert('Each item must have an item code, description, and valid quantities/prices. Negative values are not allowed.');
      return;
    }

    try {
      const rr = await modulesApi.createReceivingReport({
        poId: selectedPoId,
        via: referenceNo || 'Direct Delivery',
        invoiceNo: referenceNo,
        receivedBy: user?.name,
        remarks,
        items: items.map((item) => ({
          itemNo: item.itemNo,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          lotNo: item.lotNo,
          expiryDate: item.expiryDate
        })),
        discrepancyItems
      });
      setSaved(rr);
      setStep(4);
    } catch (error: any) {
      console.error('Failed to save receiving report:', error);
      alert(error.response?.data?.error || 'Failed to save receiving report. Please review the item details and try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">GRN Entry</h1>
        <p className="text-watermark-blue-200 mt-1">Receive goods and capture discrepancies</p>
      </div>

      <GlassCard>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((value) => (
            <div key={value} className={`h-2 flex-1 rounded-full ${step >= value ? 'bg-watermark-blue-400' : 'bg-white/10'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Step 1 - GRN Header</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-white/80">Purchase Order
                <select value={selectedPoId} onChange={(e) => setSelectedPoId(e.target.value)} className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white">
                  <option value="" className="text-black">Select PO</option>
                  {deliveries.map((row) => <option className="text-black" key={row.id} value={row.id}>{row.poNumber} - {row.supplier?.name}</option>)}
                </select>
              </label>
              <label className="text-sm text-white/80">Receive Date
                <input value={format(new Date(), 'yyyy-MM-dd')} readOnly className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-white/80">Supplier
                <input value={po ? `${po.supplier?.vendorCode} - ${po.supplier?.name}` : ''} readOnly className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-white/80">Reference No.
                <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-white/80">Received By
                <input value={user?.name || ''} readOnly className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              </label>
              <label className="text-sm text-white/80">Remarks
                <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white" />
              </label>
            </div>
            <div className="flex justify-end"><PrimaryButton disabled={!po} onClick={() => setStep(2)}>Next</PrimaryButton></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Step 2 - Item Receiving</h2>
              <button onClick={addItem} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15">Add Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white min-w-[1100px]">
                <thead>
                  <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                    <th className="pb-3">Item</th><th className="pb-3">Description</th><th className="pb-3">UOM</th><th className="pb-3">Ordered</th><th className="pb-3">Received</th><th className="pb-3">Unit Price</th><th className="pb-3">Lot/Batch</th><th className="pb-3">Expiry</th><th className="pb-3">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item, index) => {
                    const hasDiscrepancy = Number(item.quantity) !== Number(item.orderedQty);
                    return (
                      <tr key={index} className={hasDiscrepancy ? 'bg-red-500/10' : ''}>
                        <td className="py-3"><div className="flex items-center gap-2"><Barcode size={16} /> <input aria-label="Item code" value={item.itemNo} onChange={(e) => updateItem(index, 'itemNo', e.target.value)} className="w-28 bg-black/20 border border-white/10 rounded px-2 py-1 text-white" /><button onClick={() => openScanModal(index)} className="p-1 hover:bg-white/10 rounded" title="Scan Barcode"><Scan size={14} /></button></div></td>
                        <td className="py-3"><input aria-label="Item description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="w-56 bg-black/20 border border-white/10 rounded px-2 py-1 text-white" /></td>
                        <td className="py-3">{item.unit}</td>
                        <td className="py-3">{item.orderedQty}</td>
                        <td className="py-3"><input aria-label="Received quantity" type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="w-24 bg-black/20 border border-white/10 rounded px-2 py-1 text-white" /></td>
                        <td className="py-3"><input aria-label="Unit price" type="number" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} className="w-28 bg-black/20 border border-white/10 rounded px-2 py-1 text-white" /></td>
                        <td className="py-3"><input aria-label="Lot number" value={item.lotNo || ''} onChange={(e) => updateItem(index, 'lotNo', e.target.value)} className="w-28 bg-black/20 border border-white/10 rounded px-2 py-1 text-white" /></td>
                        <td className="py-3"><input aria-label="Expiry date" type="date" value={item.expiryDate || ''} onChange={(e) => updateItem(index, 'expiryDate', e.target.value)} className="w-36 bg-black/20 border border-white/10 rounded px-2 py-1 text-white" /></td>
                        <td className="py-3">
                          {hasDiscrepancy && (
                            <div className="space-y-2">
                              <div className="text-red-200 text-xs">Variance: {Number(item.quantity) - Number(item.orderedQty)}</div>
                              <select aria-label="Discrepancy reason" value={item.reason} onChange={(e) => updateItem(index, 'reason', e.target.value)} className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white">
                                <option className="text-black" value="SHORT_DELIVERY">Short Delivery</option>
                                <option className="text-black" value="OVERAGE">Overage</option>
                                <option className="text-black" value="DAMAGED">Damaged</option>
                                <option className="text-black" value="WRONG_ITEM">Wrong Item</option>
                              </select>
                              <input placeholder="Action taken" aria-label="Action taken" value={item.actionTaken} onChange={(e) => updateItem(index, 'actionTaken', e.target.value)} className="block w-44 bg-black/20 border border-white/10 rounded px-2 py-1 text-white" />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15">Back</button>
              <PrimaryButton onClick={() => setStep(3)}>Review</PrimaryButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Step 3 - Confirm Receipt</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-xl"><div className="text-watermark-blue-200 text-sm">Total Items</div><div className="text-3xl text-white font-bold">{totals.totalItems}</div></div>
              <div className="p-4 bg-white/5 rounded-xl"><div className="text-watermark-blue-200 text-sm">Total Quantity</div><div className="text-3xl text-white font-bold">{totals.totalQty}</div></div>
              <div className="p-4 bg-white/5 rounded-xl"><div className="text-watermark-blue-200 text-sm">Total Amount</div><div className="text-3xl text-white font-bold">{'\u20B1'}{totals.totalAmount.toLocaleString()}</div></div>
            </div>
            {discrepancyItems.length > 0 && <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-xl p-4">{discrepancyItems.length} discrepancy item(s) will be logged automatically.</div>}
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15">Back</button>
              <PrimaryButton onClick={save}>Confirm & Save</PrimaryButton>
            </div>
          </div>
        )}

        {step === 4 && saved && (
          <div className="text-center space-y-6 py-10">
            <CheckCircle2 size={56} className="text-emerald-300 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-white">Receipt Saved</h2>
              <p className="text-watermark-blue-200 mt-1">GRN No. {saved.rrNumber}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 bg-white/5 rounded-xl"><div className="text-watermark-blue-200 text-sm">Date</div><div className="text-white">{format(new Date(saved.createdAt), 'MMM dd, yyyy')}</div></div>
              <div className="p-4 bg-white/5 rounded-xl"><div className="text-watermark-blue-200 text-sm">Supplier</div><div className="text-white">{po?.supplier?.name}</div></div>
              <div className="p-4 bg-white/5 rounded-xl"><div className="text-watermark-blue-200 text-sm">Total Items</div><div className="text-white">{totals.totalItems}</div></div>
              <div className="p-4 bg-white/5 rounded-xl"><div className="text-watermark-blue-200 text-sm">Total Quantity</div><div className="text-white">{totals.totalQty}</div></div>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15">Print</button>
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15">Download</button>
            </div>
          </div>
        )}

        {scanModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Scan Barcode</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/80">Barcode / Item Code</label>
                  <input 
                    value={barcodeInput} 
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
                    placeholder="Enter or scan barcode..."
                    className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setScanModalOpen(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15">Cancel</button>
                  <PrimaryButton onClick={handleBarcodeScan}>Scan</PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default GRNEntry;
