import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, X, Search, FileCheck, PackageX } from 'lucide-react';
import { procurementApi } from '../api/procurement';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PurchaseOrder = () => {
  const [pos, setPos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [printPo, setPrintPo] = useState<any | null>(null);

  // Form State
  const [prId, setPrId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // For selection dropdowns (mocked or fetched)
  const [approvedPRs, setApprovedPRs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [posData, prsData, suppliersData] = await Promise.all([
        procurementApi.getPOs(),
        procurementApi.getPRs(),
        procurementApi.getSuppliers()
      ]);
      setPos(posData);
      setApprovedPRs(prsData.filter((pr: any) => pr.status === 'APPROVED'));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await procurementApi.createPO({
        prId,
        supplierId,
        expectedDeliveryDate
      });
      setShowForm(false);
      fetchData();
      setPrId('');
      setSupplierId('');
      setExpectedDeliveryDate('');
      toast.success('Purchase Order generated successfully!');
    } catch (error: any) {
      console.error('Failed to submit PO:', error);
      toast.error(error.response?.data?.error || 'Error creating PO');
    }
  };

  const openPrint = async (id: string) => {
    try {
      const po = await procurementApi.getPOById(id);
      setPrintPo(po);
      setPrintOpen(true);
    } catch (error) {
      console.error('Failed to load PO for print:', error);
      toast.error('Failed to load PO details');
    }
  };

  const closePrint = () => {
    setPrintOpen(false);
    setPrintPo(null);
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

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-white/5 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-white/10 rounded-full animate-pulse"></div>
        </div>
        <GlassCard>
          <div className="space-y-4">
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse"></div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Purchase Orders</h1>
          <p className="text-watermark-blue-200 mt-1">Convert approved requisitions into official orders</p>
        </div>
        {!showForm && (
          <PrimaryButton onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
            Create PO
          </PrimaryButton>
        )}
      </div>

      {showForm ? (
        <GlassCard className="animate-fade-in relative">
          <button 
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 text-white/50 hover:text-white"
          >
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Generate Purchase Order</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Approved PR Reference</label>
                <select 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10 transition-all"
                  value={prId}
                  onChange={(e) => setPrId(e.target.value)}
                  required
                >
                  <option value="" className="text-black">Select an Approved PR...</option>
                  {approvedPRs.map(pr => (
                    <option key={pr.id} value={pr.id} className="text-black">
                      {pr.prNumber} - {pr.requestingDept} (₱{Number(pr.totalCost).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Supplier / Vendor</label>
                <select 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10 transition-all"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                >
                  <option value="" className="text-black">Select Supplier...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id} className="text-black">
                      {sup.name} ({sup.vendorCode})
                    </option>
                  ))}
                </select>
              </div>

              <GlassInput 
                label="Expected Delivery Date" 
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                required
              />

            </div>

            <div className="flex justify-end pt-6 border-t border-white/10">
              <PrimaryButton type="submit">Generate PO</PrimaryButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
              <input 
                type="text" 
                placeholder="Search PO..." 
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10 transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3 font-medium">PO Number</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Expected Delivery</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pos.map((po) => (
                  <tr key={po.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 font-medium flex items-center gap-2">
                      <FileCheck size={16} className="text-teal-400" />
                      {po.poNumber}
                    </td>
                    <td className="py-4 text-white/70">{format(new Date(po.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="py-4">{po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy') : 'TBD'}</td>
                    <td className="py-4 font-medium">₱{Number(po.totalAmount).toLocaleString()}</td>
                    <td className="py-4"><StatusBadge status={po.status} /></td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => openPrint(po.id)}
                        className="text-sm text-watermark-blue-300 hover:text-white px-3 py-1 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
                {pos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center opacity-50">
                        <PackageX size={48} className="mb-4 text-white" />
                        <span className="text-lg font-medium text-white display-font">No Purchase Orders Found</span>
                        <span className="text-sm text-[#A1B6D0] mt-1">Generate a new PO from an approved PR to get started.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {printOpen && printPo && (
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
                      {/* Using a placeholder for logo since we don't have the exact image imported here, we'll import it at the top */}
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
                <div className="wm-print-title">PURCHASE ORDER</div>
              </div>

              <div className="wm-grid border-t border-[#1f4e79]">
                <div className="wm-field">
                  <div className="wm-field-label">Supplier Name (To):</div>
                  <div className="wm-field-value">{printPo.supplier?.name || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">PO No.:</div>
                  <div className="wm-field-value">{printPo.poNumber}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Address:</div>
                  <div className="wm-field-value">{printPo.supplier?.address || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Date:</div>
                  <div className="wm-field-value">{formatDate(printPo.date || printPo.createdAt)}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Contact No.:</div>
                  <div className="wm-field-value">{printPo.supplier?.contactDetails || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">PR No.:</div>
                  <div className="wm-field-value">{printPo.pr?.prNumber || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Contact Person:</div>
                  <div className="wm-field-value">{printPo.supplier?.contactPerson || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">For:</div>
                  <div className="wm-field-value">{printPo.forDepartment || ''}</div>
                </div>
                {/* Email spans across logically, we can put empty on the right */}
                <div className="wm-field">
                  <div className="wm-field-label">Email:</div>
                  <div className="wm-field-value">{printPo.supplier?.email || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label"></div>
                  <div className="wm-field-value"></div>
                </div>
              </div>

              <div className="wm-section-title text-center">ORDER DETAILS</div>
              <table className="wm-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Item No.</th>
                    <th style={{ width: '10%' }}>Qty.</th>
                    <th>Item Description</th>
                    <th style={{ width: '18%' }}>Unit Price (PHP)</th>
                    <th style={{ width: '18%' }}>Amount (PHP)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(12, (printPo.items?.length || 0)) }).map((_, idx) => {
                    const item = printPo.items?.[idx];
                    return (
                      <tr key={idx}>
                        <td className="wm-center">{item?.itemNo || ''}</td>
                        <td className="wm-center">{item ? Number(item.quantity).toLocaleString() : ''}</td>
                        <td>{item?.description || ''}</td>
                        <td className="wm-right">{item ? formatMoney(item.unitPrice) : ''}</td>
                        <td className="wm-right">{item ? formatMoney(item.amount) : ''}</td>
                      </tr>
                    );
                  })}
                  <tr className="wm-subtotal-row">
                    <td colSpan={4} className="wm-right border-none">SUBTOTAL (PHP):</td>
                    <td className="wm-right border-l border-[#1f4e79]">{formatMoney(printPo.subtotal)}</td>
                  </tr>
                  <tr className="wm-subtotal-row">
                    <td colSpan={4} className="wm-right border-none">TAX (VAT) (PHP):</td>
                    <td className="wm-right border-l border-[#1f4e79]">{formatMoney(printPo.taxVat)}</td>
                  </tr>
                  <tr className="wm-subtotal-row">
                    <td colSpan={4} className="wm-right border-none">TOTAL (PHP):</td>
                    <td className="wm-right border-l border-[#1f4e79]">{formatMoney(printPo.total)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="wm-grid border-b-0">
                <div className="wm-field border-b-0">
                  <div className="wm-field-label">Requisitioner:</div>
                  <div className="wm-field-value">{printPo.requisitioner || ''}</div>
                </div>
                <div className="wm-field border-b-0">
                  <div className="wm-field-label">Ship Via:</div>
                  <div className="wm-field-value">{printPo.shipVia || ''}</div>
                </div>
                <div className="wm-field border-b-0">
                  <div className="wm-field-label">F.O.B.:</div>
                  <div className="wm-field-value">{printPo.fob || ''}</div>
                </div>
                <div className="wm-field border-b-0">
                  <div className="wm-field-label">Shipping Terms:</div>
                  <div className="wm-field-value">{printPo.shippingTerms || ''}</div>
                </div>
              </div>

              <div className="wm-section-title text-center border-t border-[#1f4e79]">APPROVAL SECTION</div>
              <table className="wm-approval">
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }}>
                      Prepared By
                      <div className="wm-sign-line">Signature / Date</div>
                    </td>
                    <td style={{ width: '50%' }}>
                      Approved By
                      <div className="wm-sign-line">Signature / Date</div>
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

export default PurchaseOrder;
