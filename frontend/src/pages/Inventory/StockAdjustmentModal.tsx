import { useState } from 'react';
import { X } from 'lucide-react';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { modulesApi } from '../../api/modulesApi';
import { useAuth } from '../../context/AuthContext';
import type { InventoryItem } from '../../types/inventory';

interface Props {
  item: InventoryItem;
  onClose: () => void;
  onSaved: () => void;
}

const StockAdjustmentModal = ({ item, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const [transactionType, setTransactionType] = useState('ADD');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const qty = Number(quantity);
    const cost = unitCost ? Number(unitCost) : undefined;

    if (!Number.isFinite(qty) || qty < 0) {
      setError('Quantity must be a valid positive number.');
      return;
    }
    if (cost !== undefined && (!Number.isFinite(cost) || cost <= 0)) {
      setError('Unit cost must be greater than zero.');
      return;
    }
    if (transactionType === 'DEDUCT' && qty > Number(item.qtyOnHand || 0)) {
      setError('Insufficient stock');
      return;
    }

    setSaving(true);
    try {
      await modulesApi.postInventoryTransaction({
        itemId: item.id,
        transactionType,
        quantity: qty,
        unitCost: cost,
        remarks,
        userId: user?.id || 'SYSTEM'
      });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save stock transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg bg-[#071c35] border border-white/10 rounded-xl p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Adjust Stock</h2>
            <p className="text-sm text-watermark-blue-200">{item.itemCode} - {item.description}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <label className="text-sm text-white/80">
            Transaction Type
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white">
              <option className="text-black" value="ADD">Add</option>
              <option className="text-black" value="DEDUCT">Deduct</option>
              <option className="text-black" value="PHYSICAL_COUNT">Physical Count</option>
            </select>
          </label>
          <label className="text-sm text-white/80">
            Quantity
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0" step="1" className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-white/80">
            Unit Cost
            <input value={unitCost} onChange={(e) => setUnitCost(e.target.value)} type="number" min="0" step="0.01" className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-white/80">
            Remarks
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white min-h-24" />
          </label>
        </div>

        {error && <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/15">Cancel</button>
          <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Transaction'}</PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default StockAdjustmentModal;
