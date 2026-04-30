import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, X, Package } from 'lucide-react';
import { modulesApi } from '../api/modulesApi';
import { procurementApi } from '../api/procurement';
import { format } from 'date-fns';

const ReceivingReport = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [printRr, setPrintRr] = useState<any | null>(null);

  // Form State
  const [poId, setPoId] = useState('');
  const [via, setVia] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [pos, setPos] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rrData, poData] = await Promise.all([
        modulesApi.getReceivingReports(),
        procurementApi.getPOs()
      ]);
      setReports(rrData);
      setPos(poData.filter((po: any) => po.status === 'OPEN' || po.status === 'PARTIALLY_RECEIVED'));
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For simplicity in UI, we fetch the PO items and receive them all automatically
      const selectedPo = pos.find(p => p.id === poId);
      if (!selectedPo) return;

      const itemsToReceive = selectedPo.items.map((item: any) => ({
        itemNo: item.itemNo,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.amount
      }));

      await modulesApi.createReceivingReport({
        poId,
        via,
        invoiceNo,
        items: itemsToReceive
      });
      
      setShowForm(false);
      fetchData();
      setPoId('');
      setVia('');
      setInvoiceNo('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating RR');
    }
  };

  const openPrint = async (id: string) => {
    try {
      const rr = await modulesApi.getReceivingReportById(id);
      setPrintRr(rr);
      setPrintOpen(true);
    } catch (error) {
      console.error('Failed to load RR for print:', error);
      alert('Failed to load RR details');
    }
  };

  const closePrint = () => {
    setPrintOpen(false);
    setPrintRr(null);
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Receiving Reports</h1>
          <p className="text-watermark-blue-200 mt-1">Log delivered goods against Purchase Orders</p>
        </div>
        {!showForm && (
          <PrimaryButton onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
            Receive Delivery
          </PrimaryButton>
        )}
      </div>

      {showForm ? (
        <GlassCard className="animate-fade-in relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Log Delivery</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Pending Purchase Order</label>
                <select 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10"
                  value={poId} onChange={(e) => setPoId(e.target.value)} required
                >
                  <option value="" className="text-black">Select PO...</option>
                  {pos.map(po => (
                    <option key={po.id} value={po.id} className="text-black">{po.poNumber}</option>
                  ))}
                </select>
              </div>
              <GlassInput label="Delivered Via" value={via} onChange={(e) => setVia(e.target.value)} required placeholder="e.g. LBC, In-house" />
              <GlassInput label="Supplier Invoice No." value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} required />
            </div>
            <div className="flex justify-end pt-6 border-t border-white/10">
              <PrimaryButton type="submit">Process Receipt</PrimaryButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3 font-medium">RR Number</th>
                  <th className="pb-3 font-medium">Date Received</th>
                  <th className="pb-3 font-medium">PO Ref</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((rr) => (
                  <tr key={rr.id} className="hover:bg-white/5 group">
                    <td className="py-4 font-medium flex items-center gap-2"><Package size={16} className="text-teal-400" />{rr.rrNumber}</td>
                    <td className="py-4">{format(new Date(rr.dateReceived), 'MMM dd, yyyy')}</td>
                    <td className="py-4">{rr.po?.poNumber}</td>
                    <td className="py-4"><StatusBadge status={rr.status} /></td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => openPrint(rr.id)}
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

      {printOpen && printRr && (
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
                <div className="wm-print-title">RECEIVING REPORT</div>
              </div>

              <div className="wm-grid border-t border-[#1f4e79]">
                <div className="wm-field">
                  <div className="wm-field-label">Received From:</div>
                  <div className="wm-field-value">{printRr.po?.supplier?.name || printRr.receivedFrom || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">RR No.:</div>
                  <div className="wm-field-value">{printRr.rrNumber}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Via:</div>
                  <div className="wm-field-value">{printRr.via || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Date Received:</div>
                  <div className="wm-field-value">{formatDate(printRr.dateReceived || printRr.createdAt)}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Supplier ID:</div>
                  <div className="wm-field-value">{printRr.po?.supplier?.vendorCode || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">PO. No.:</div>
                  <div className="wm-field-value">{printRr.po?.poNumber || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">PO Date:</div>
                  <div className="wm-field-value">{formatDate(printRr.poDate)}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Invoice No.:</div>
                  <div className="wm-field-value">{printRr.invoiceNo || ''}</div>
                </div>
                <div className="wm-field border-r-0" style={{ gridColumn: '1 / -1' }}>
                  <div className="wm-field-label" style={{ borderRight: '1px solid #1f4e79' }}>PR No.:</div>
                  <div className="wm-field-value">{printRr.prNumber || ''}</div>
                </div>
              </div>

              <div className="wm-section-title text-center">ITEMS RECEIVED</div>
              <table className="wm-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Item No.</th>
                    <th>Description</th>
                    <th style={{ width: '10%' }}>Quantity</th>
                    <th style={{ width: '18%' }}>Unit Price (PHP)</th>
                    <th style={{ width: '18%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(12, (printRr.items?.length || 0)) }).map((_, idx) => {
                    const item = printRr.items?.[idx];
                    return (
                      <tr key={idx}>
                        <td className="wm-center">{item?.itemNo || ''}</td>
                        <td>{item?.description || ''}</td>
                        <td className="wm-center">{item ? Number(item.quantity).toLocaleString() : ''}</td>
                        <td className="wm-right">{item ? formatMoney(item.unitPrice) : ''}</td>
                        <td className="wm-right">{item ? formatMoney(item.total) : ''}</td>
                      </tr>
                    );
                  })}
                  <tr className="wm-subtotal-row">
                    <td colSpan={4} className="wm-left" style={{ textAlign: 'left', paddingLeft: '8px' }}>TOTAL</td>
                    <td className="wm-right border-l border-[#1f4e79]">
                      {formatMoney(printRr.items?.reduce((sum: number, item: any) => sum + Number(item.total), 0) || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-0 border-x border-[#1f4e79] border-b bg-[#dce6f1] h-[120px] flex items-end justify-center pb-6">
                <div className="w-[300px] border-t border-[#1f4e79] text-center pt-2 text-[#1f4e79] font-bold text-[11px]">
                  RECEIVING PERSONNEL / DATE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivingReport;
