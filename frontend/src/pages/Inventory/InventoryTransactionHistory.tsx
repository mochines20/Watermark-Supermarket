import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { modulesApi } from '../../api/modulesApi';
import type { InventoryItem, InventoryTransaction } from '../../types/inventory';

const InventoryTransactionHistory = ({ item, onClose }: { item: InventoryItem; onClose: () => void }) => {
  const [rows, setRows] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    modulesApi.getInventoryTransactions(item.id)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [item.id]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#071c35] border border-white/10 rounded-xl p-6 shadow-2xl">
        <div className="flex justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Transaction History</h2>
            <p className="text-sm text-watermark-blue-200">{item.itemCode} - {item.description}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={22} /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-white">
            <thead>
              <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                <th className="pb-3">Date</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Previous Qty</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">New Qty</th>
                <th className="pb-3">Variance</th>
                <th className="pb-3">Remarks</th>
                <th className="pb-3">Done By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="py-6 text-center text-white/50">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="py-6 text-center text-white/50">No transactions found.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3">{format(new Date(row.createdAt), 'MMM dd, yyyy HH:mm')}</td>
                  <td className="py-3">{row.transactionType.replace(/_/g, ' ')}</td>
                  <td className="py-3">{row.previousQty}</td>
                  <td className="py-3">{row.quantity}</td>
                  <td className="py-3">{row.newQty}</td>
                  <td className="py-3">{row.variance ?? ''}</td>
                  <td className="py-3">{row.remarks || ''}</td>
                  <td className="py-3">{row.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTransactionHistory;
