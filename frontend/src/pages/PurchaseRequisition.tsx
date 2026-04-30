import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, X, Search, FileText } from 'lucide-react';
import { procurementApi } from '../api/procurement';
import { format } from 'date-fns';
import logoImage from '../assets/logo.jpg';

const PurchaseRequisition = () => {
  const [prs, setPrs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [printPr, setPrintPr] = useState<any | null>(null);

  // Form State
  const [department, setDepartment] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dateNeeded, setDateNeeded] = useState('');
  const [items, setItems] = useState<any[]>([{ itemCode: '', description: '', quantity: 1, unit: 'pcs', unitCost: 0 }]);

  useEffect(() => {
    fetchPRs();
  }, []);

  const fetchPRs = async () => {
    try {
      const data = await procurementApi.getPRs();
      setPrs(data);
    } catch (error) {
      console.error('Failed to fetch PRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setItems([...items, { itemCode: '', description: '', quantity: 1, unit: 'pcs', unitCost: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await procurementApi.createPR({
        requestedBy: 'Store Manager', // Hardcoded for demo until auth context is built
        requestingDept: department,
        purposeOfRequest: purpose,
        dateNeeded: dateNeeded,
        items: items
      });
      setShowForm(false);
      fetchPRs();
      // Reset form
      setDepartment('');
      setPurpose('');
      setDateNeeded('');
      setItems([{ itemCode: '', description: '', quantity: 1, unit: 'pcs', unitCost: 0 }]);
    } catch (error) {
      console.error('Failed to submit PR:', error);
      alert('Error creating PR');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  const openPrint = async (id: string) => {
    try {
      const pr = await procurementApi.getPRById(id);
      setPrintPr(pr);
      setPrintOpen(true);
    } catch (error) {
      console.error('Failed to load PR for print:', error);
      alert('Failed to load PR details');
    }
  };

  const closePrint = () => {
    setPrintOpen(false);
    setPrintPr(null);
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

  return (
    <div className="p-8 space-y-6">
      <div className="no-print space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Purchase Requisitions</h1>
            <p className="text-watermark-blue-200 mt-1">Manage departmental requests for procurement</p>
          </div>
          {!showForm && (
            <PrimaryButton onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
              New Requisition
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
            <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Create New PR</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassInput 
                  label="Requesting Department" 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
                <GlassInput 
                  label="Date Needed" 
                  type="date"
                  value={dateNeeded}
                  onChange={(e) => setDateNeeded(e.target.value)}
                  required
                />
                <GlassInput 
                  label="Purpose of Request" 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </div>

              <div className="mt-8">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                  <h3 className="text-lg text-white font-medium">Items</h3>
                  <button type="button" onClick={addItemRow} className="text-sm text-watermark-blue-300 hover:text-white flex items-center gap-1">
                    <Plus size={16} /> Add Row
                  </button>
                </div>
                
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-end bg-black/10 p-4 rounded-xl border border-white/5">
                      <div className="col-span-2">
                        <GlassInput label="Item Code" value={item.itemCode} onChange={(e) => updateItem(index, 'itemCode', e.target.value)} required />
                      </div>
                      <div className="col-span-4">
                        <GlassInput label="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} required />
                      </div>
                      <div className="col-span-2">
                        <GlassInput label="Qty" type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required />
                      </div>
                      <div className="col-span-2">
                        <GlassInput label="Unit" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} required />
                      </div>
                      <div className="col-span-2">
                        <GlassInput label="Est. Unit Cost" type="number" value={item.unitCost} onChange={(e) => updateItem(index, 'unitCost', e.target.value)} required />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-white/10">
                <PrimaryButton type="submit">Submit Requisition</PrimaryButton>
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
                  placeholder="Search PR..." 
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                    <th className="pb-3 font-medium">PR Number</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Total Cost</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {prs.map((pr) => (
                    <tr key={pr.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 font-medium flex items-center gap-2">
                        <FileText size={16} className="text-watermark-blue-400" />
                        {pr.prNumber}
                      </td>
                      <td className="py-4 text-white/70">{formatDate(pr.datePrepared || pr.createdAt)}</td>
                      <td className="py-4">{pr.requestingDept}</td>
                      <td className="py-4">{formatMoney(pr.totalCost)}</td>
                      <td className="py-4"><StatusBadge status={pr.status} /></td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => openPrint(pr.id)}
                          className="text-sm text-watermark-blue-300 hover:text-white px-3 py-1 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          View / Print
                        </button>
                      </td>
                    </tr>
                  ))}
                  {prs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/50">No purchase requisitions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>

      {printOpen && printPr && (
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
                      <img src={logoImage} alt="Watermark Logo" className="w-full h-full object-cover" />
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
                <div className="wm-print-title">PURCHASE REQUISITION</div>
              </div>

              <div className="wm-print-divider"></div>

              <div className="wm-grid">
                <div className="wm-field">
                  <div className="wm-field-label">Address:</div>
                  <div className="wm-field-value">{printPr.address || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Date Prepared:</div>
                  <div className="wm-field-value">{formatDate(printPr.datePrepared || printPr.createdAt)}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Contact No.:</div>
                  <div className="wm-field-value">{printPr.contactNo || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Date Needed:</div>
                  <div className="wm-field-value">{formatDate(printPr.dateNeeded)}</div>
                </div>
              </div>

              <div className="wm-section-title">PURCHASE REQUISITION DETAILS</div>
              <div className="wm-grid">
                <div className="wm-field">
                  <div className="wm-field-label">PR No.:</div>
                  <div className="wm-field-value">{printPr.prNumber}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Requested By:</div>
                  <div className="wm-field-value">{printPr.requestedBy || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Requesting Dept.:</div>
                  <div className="wm-field-value">{printPr.requestingDept || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Purpose of Request:</div>
                  <div className="wm-field-value">{printPr.purposeOfRequest || ''}</div>
                </div>
              </div>

              <div className="wm-section-title">SUGGESTED SUPPLIER (Optional)</div>
              <div className="wm-grid">
                <div className="wm-field">
                  <div className="wm-field-label">Supplier Name:</div>
                  <div className="wm-field-value">{printPr.suggestedSupplier || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Vendor Code:</div>
                  <div className="wm-field-value">{printPr.vendorCode || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Address:</div>
                  <div className="wm-field-value">{printPr.supplierAddress || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label"></div>
                  <div className="wm-field-value"></div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Contact Person:</div>
                  <div className="wm-field-value">{printPr.contactPerson || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Contact Details:</div>
                  <div className="wm-field-value">{printPr.contactDetails || ''}</div>
                </div>
              </div>

              <div className="wm-section-title">ITEM DETAILS</div>
              <table className="wm-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Item Code</th>
                    <th>Item Description</th>
                    <th style={{ width: '12%' }}>Quantity</th>
                    <th style={{ width: '20%' }}>Unit Cost (PHP)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(12, (printPr.items?.length || 0)) }).map((_, idx) => {
                    const item = printPr.items?.[idx];
                    return (
                      <tr key={idx}>
                        <td>{item?.itemCode || ''}</td>
                        <td>{item?.description || ''}</td>
                        <td className="wm-center">{item ? Number(item.quantity).toLocaleString() : ''}</td>
                        <td className="wm-right">{item ? formatMoney(item.unitCost) : ''}</td>
                      </tr>
                    );
                  })}
                  <tr className="wm-subtotal-row">
                    <td colSpan={3} className="wm-right">TOTAL COST (PHP):</td>
                    <td className="wm-right">{formatMoney(printPr.totalCost)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="wm-section-title">APPROVAL SECTION</div>
              <table className="wm-approval">
                <tbody>
                  <tr>
                    <td>
                      Prepared By
                      <div className="wm-sign-line">Signature / Date</div>
                    </td>
                    <td>
                      Checked By
                      <div className="wm-sign-line">Signature / Date</div>
                    </td>
                    <td>
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

export default PurchaseRequisition;
