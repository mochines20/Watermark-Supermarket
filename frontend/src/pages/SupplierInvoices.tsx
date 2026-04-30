import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, X, Receipt, Printer } from 'lucide-react';
import { modulesApi } from '../api/modulesApi';
import React from 'react';
import { format } from 'date-fns';

const SupplierInvoices = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [printControlOpen, setPrintControlOpen] = useState(false);
  const [printCashReqOpen, setPrintCashReqOpen] = useState(false);
  const [printInvoiceOpen, setPrintInvoiceOpen] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    invoiceNo: '',
    poNumber: '',
    rrNumber: '',
    invoiceDate: '',
    dueDate: '',
    grossAmount: 0,
    netAmount: 0,
    vatAmount: 0,
    totalAmountDue: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await modulesApi.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await modulesApi.createInvoice({
        ...formData,
        items: [] // Simplified for demo
      });
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating Invoice');
    }
  };

  const openPrintInvoice = async (id: string) => {
    try {
      const invoice = await modulesApi.getInvoiceById(id);
      setPrintInvoiceData(invoice);
      setPrintInvoiceOpen(true);
    } catch (error) {
      console.error('Failed to fetch invoice details', error);
      alert('Failed to load invoice details for printing');
    }
  };

  const closePrintInvoice = () => {
    setPrintInvoiceOpen(false);
    setPrintInvoiceData(null);
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

  const openInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED');
  
  const groupedInvoices = openInvoices.reduce((acc, inv) => {
    const supplierId = inv.supplier?.id || 'unknown';
    if (!acc[supplierId]) acc[supplierId] = { supplier: inv.supplier, invoices: [] };
    acc[supplierId].invoices.push(inv);
    return acc;
  }, {} as Record<string, { supplier: any, invoices: any[] }>);

  const grandTotal = openInvoices.reduce((sum, inv) => sum + Number(inv.totalAmountDue), 0);

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Supplier Invoices</h1>
          <p className="text-watermark-blue-200 mt-1">Accounts Payable Entry & 3-Way Matching</p>
        </div>
        <div className="flex gap-2">
          <PrimaryButton onClick={() => setPrintCashReqOpen(true)} icon={<Printer size={18} />}>
            Print Cash Requirement
          </PrimaryButton>
          <PrimaryButton onClick={() => setPrintControlOpen(true)} icon={<Printer size={18} />}>
            Print Control Report
          </PrimaryButton>
          <PrimaryButton onClick={() => setPrintOpen(true)} icon={<Printer size={18} />}>
            Print Open Invoices
          </PrimaryButton>
          {!showForm && (
            <PrimaryButton onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
              Log Invoice
            </PrimaryButton>
          )}
        </div>
      </div>

      {showForm ? (
        <GlassCard className="animate-fade-in relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Log New Invoice</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassInput label="Invoice Number" name="invoiceNo" value={formData.invoiceNo} onChange={handleInputChange} required />
              <GlassInput label="PO Number" name="poNumber" value={formData.poNumber} onChange={handleInputChange} required />
              <GlassInput label="RR Number" name="rrNumber" value={formData.rrNumber} onChange={handleInputChange} required />
              <GlassInput label="Invoice Date" type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} required />
              <GlassInput label="Due Date" type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required />
              <GlassInput label="Total Amount Due" type="number" name="totalAmountDue" value={formData.totalAmountDue} onChange={handleInputChange} required />
            </div>
            <div className="flex justify-end pt-6 border-t border-white/10">
              <PrimaryButton type="submit">Submit & Match</PrimaryButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3 font-medium">Invoice No</th>
                  <th className="pb-3 font-medium">Supplier</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">3-Way Match</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 group">
                    <td className="py-4 font-medium flex items-center gap-2"><Receipt size={16} className="text-pink-400" />{inv.invoiceNo}</td>
                    <td className="py-4">{inv.supplier?.name}</td>
                    <td className="py-4">{format(new Date(inv.dueDate), 'MMM dd, yyyy')}</td>
                    <td className="py-4 font-bold">₱{Number(inv.totalAmountDue).toLocaleString()}</td>
                    <td className="py-4"><StatusBadge status={inv.threeWayStatus} /></td>
                    <td className="py-4"><StatusBadge status={inv.status} /></td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => openPrintInvoice(inv.id)}
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

      {printControlOpen && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={() => setPrintControlOpen(false)}></div>
          <div className="relative wm-print-overlay-panel overflow-x-auto" style={{ width: '100%', maxWidth: '1200px' }}>
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print Control Report</PrimaryButton>
              <button
                onClick={() => setPrintControlOpen(false)}
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
                <div className="wm-print-title uppercase text-[18px]">CONTROL REPORT</div>
              </div>

              <div className="grid grid-cols-2 border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Run Date:</div>
                  <div className="p-1 flex-1">{format(new Date(), 'MM-dd-yyyy')}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Run Time:</div>
                  <div className="p-1 flex-1">{format(new Date(), 'HH:mm')}</div>
                </div>
              </div>
              <div className="border-l border-r border-b border-[#1f4e79] text-[#1f4e79] flex">
                <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Report ID/Batch No.</div>
                <div className="p-1 flex-1">BATCH-{format(new Date(), 'yyyyMMdd-HHmm')}</div>
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-2 text-center text-[#1f4e79] uppercase">
                ACCOUNTS PAYABLE INVOICE ENTRY CONTROL RECEIPT
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full" style={{ fontSize: '9px' }}>
                <thead>
                  <tr className="bg-[#0070c0] text-white font-bold text-center">
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">VENDOR<br/>CODE</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">INVOICE<br/>NUMBER</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">INVOICE<br/>DATE</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">VENDOR<br/>NAME</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">DUE<br/>AMOUNT</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">DATE</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">DISCOUNT<br/>AMOUNT</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">DISTRIBUTION<br/>ACCOUNT</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 leading-tight">PO NO.</td>
                    <td className="border-[#1f4e79] border-b p-2 leading-tight">PAYMENT STATUS</td>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any, idx: number) => (
                    <tr key={idx} className="text-[#1f4e79] text-center">
                      <td className="border-[#1f4e79] border-r border-b p-2">{inv.supplier?.vendorCode || '---'}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{inv.invoiceNo}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{formatDate(inv.invoiceDate)}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2 truncate max-w-[120px]">{inv.supplier?.name || '---'}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2 text-right">{Number(inv.totalAmountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{formatDate(inv.dueDate)}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2 text-right">0.00</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">01-0020</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{inv.po?.poNumber || inv.poNumber}</td>
                      <td className="border-[#1f4e79] border-b p-2">{inv.status}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - invoices.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-[24px]">
                      <td className="border-[#1f4e79] border-r border-b"></td>
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
                  <tr className="font-bold bg-[#eef5fb] text-[#1f4e79]">
                    <td colSpan={4} className="border-[#1f4e79] border-r border-b p-2">TOTALS:</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 text-right">
                      {invoices.reduce((sum, inv) => sum + Number(inv.totalAmountDue), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border-[#1f4e79] border-r border-b p-2"></td>
                    <td className="border-[#1f4e79] border-r border-b p-2 text-right">0.00</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 text-right">0.00</td>
                    <td colSpan={2} className="border-b border-[#1f4e79] p-2"></td>
                  </tr>
                </tbody>
              </table>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79] uppercase">
                APPROVAL SECTION
              </div>
              
              <table className="wm-approval border-l border-r border-b border-[#1f4e79] w-full text-[#1f4e79]">
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }} className="border-r border-[#1f4e79] p-2 align-top h-[60px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Received By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[200px]">Signature / Date</div>
                    </td>
                    <td style={{ width: '50%' }} className="p-2 align-top h-[60px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Approved By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[200px]">Signature / Date</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                <div className="wm-print-title uppercase">OPEN INVOICES REPORT</div>
              </div>

              <div className="grid grid-cols-3 border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#fff]">Accounts Payable<br/>Account Covered:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">2010 - AP Trade</div>
                </div>
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#fff]">Date Prepared:</div>
                  <div className="p-2 flex-1 text-[11px] flex items-center">{formatDate(new Date())}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                </div>
              </div>
              <div className="flex border-b border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="w-[140px] font-bold p-2 text-[11px] border-r border-[#1f4e79] flex items-center bg-[#dce6f1]">As of Date:</div>
                <div className="p-2 flex-1 text-[11px] flex items-center font-bold bg-[#fff]">{formatDate(new Date())}</div>
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b">
                <tbody>
                  {(Object.values(groupedInvoices) as Array<{ supplier: any, invoices: any[] }>).map((group, idx) => {
                    const subtotal = group.invoices.reduce((sum, inv) => sum + Number(inv.totalAmountDue), 0);
                    return (
                      <React.Fragment key={idx}>
                        <tr className="bg-[#dce6f1]">
                          <td colSpan={7} className="font-bold border-[#1f4e79] border-t border-b uppercase text-[11px] px-2 py-1.5 text-left text-[#1f4e79]">
                            SUPPLIER: {group.supplier?.name || 'Unknown'}
                          </td>
                        </tr>
                        <tr className="bg-[#2e75b6] text-white font-bold text-center text-[10px]">
                          <td className="border-[#1f4e79] border-r border-b py-2 w-[15%]">Invoice No.</td>
                          <td className="border-[#1f4e79] border-r border-b py-2 w-[12%]">Invoice Date</td>
                          <td className="border-[#1f4e79] border-r border-b py-2 w-[12%]">Due Date</td>
                          <td className="border-[#1f4e79] border-r border-b py-2 w-[15%]">Gross Amount</td>
                          <td className="border-[#1f4e79] border-r border-b py-2 w-[15%]">Discount</td>
                          <td className="border-[#1f4e79] border-r border-b py-2 w-[15%]">Net Amount</td>
                          <td className="border-[#1f4e79] border-b py-2 w-[16%]">Balance</td>
                        </tr>
                        {group.invoices.map(inv => (
                          <tr key={inv.id} className="text-[10px] text-[#1f4e79]">
                            <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-center">{inv.invoiceNo}</td>
                            <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-center">{formatDate(inv.invoiceDate || inv.dueDate)}</td>
                            <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-center">{formatDate(inv.dueDate)}</td>
                            <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right">{formatMoney(inv.grossAmount)}</td>
                            <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right">{formatMoney(inv.discount)}</td>
                            <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-right">{formatMoney(inv.netAmount)}</td>
                            <td className="border-[#1f4e79] border-b py-2 px-2 text-right">{formatMoney(inv.totalAmountDue)}</td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 3 - group.invoices.length) }).map((_, emptyIdx) => (
                          <tr key={`empty-${idx}-${emptyIdx}`} className="text-[10px] h-[28px]">
                            <td className="border-[#1f4e79] border-r border-b"></td>
                            <td className="border-[#1f4e79] border-r border-b"></td>
                            <td className="border-[#1f4e79] border-r border-b"></td>
                            <td className="border-[#1f4e79] border-r border-b"></td>
                            <td className="border-[#1f4e79] border-r border-b"></td>
                            <td className="border-[#1f4e79] border-r border-b"></td>
                            <td className="border-[#1f4e79] border-b"></td>
                          </tr>
                        ))}
                        <tr className="bg-[#dce6f1] font-bold text-[10px] text-[#1f4e79]">
                          <td colSpan={6} className="text-right border-none py-2 px-2">SUBTOTAL</td>
                          <td className="text-right border-l border-b border-[#1f4e79] py-2 px-2">{formatMoney(subtotal)}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-[#dce6f1] font-bold text-[11px] text-[#1f4e79]">
                    <td colSpan={6} className="text-right border-none py-2 px-2">TOTAL OUTSTANDING</td>
                    <td className="text-right border-l border-t border-[#1f4e79] py-2 px-2">{formatMoney(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>

            </div>
          </div>
        </div>
      )}

      {printCashReqOpen && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={() => setPrintCashReqOpen(false)}></div>
          <div className="relative wm-print-overlay-panel overflow-x-auto" style={{ width: '100%', maxWidth: '1200px' }}>
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print Cash Requirement</PrimaryButton>
              <button
                onClick={() => setPrintCashReqOpen(false)}
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
                <div className="wm-print-title uppercase text-[18px]">CASH REQUIREMENT REPORT</div>
              </div>

              <div className="grid grid-cols-2 border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Pay Date:</div>
                  <div className="p-1 flex-1"></div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Report Date:</div>
                  <div className="p-1 flex-1">{formatDate(new Date())}</div>
                </div>
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] text-center font-bold p-1 text-[#1f4e79] uppercase">
                ACCOUNTS PAYABLE INVOICE ENTRY CONTROL RECEIPT
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full" style={{ fontSize: '9px' }}>
                <thead>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center">
                    <td className="border-[#1f4e79] border-r border-b p-2">SUPPLIER</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">INVOICE NO.</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">INVOICE DATE</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">CONTACT NUMBERS</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">AMOUNT</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">DISCOUNT</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">NET</td>
                    <td className="border-[#1f4e79] border-b p-2">DAILY TOTAL</td>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any, idx: number) => (
                    <tr key={idx} className="text-[#1f4e79] text-center">
                      <td className="border-[#1f4e79] border-r border-b p-2 truncate max-w-[120px]">{inv.supplier?.name}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{inv.invoiceNo}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{formatDate(inv.invoiceDate)}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{inv.supplier?.contactDetails || '---'}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2 text-right">{formatMoney(inv.grossAmount)}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2 text-right">{formatMoney(inv.discount)}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2 text-right">{formatMoney(inv.netAmount)}</td>
                      <td className="border-[#1f4e79] border-b p-2 text-right"></td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - invoices.length) }).map((_, i) => (
                    <tr key={`empty1-${i}`} className="h-[24px]">
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
                  <tr className="font-bold bg-[#eef5fb] text-[#1f4e79]">
                    <td colSpan={6} className="border-[#1f4e79] border-r border-b p-2 text-right">GRAND TOTAL</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 text-right">
                      {formatMoney(invoices.reduce((sum, inv) => sum + Number(inv.netAmount || 0), 0).toString().replace('₱', ''))}
                    </td>
                    <td className="border-b border-[#1f4e79] p-2"></td>
                  </tr>
                </tbody>
              </table>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] text-center font-bold p-1 text-[#1f4e79] uppercase">
                PURCHASE ORDER MATCHING
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full" style={{ fontSize: '9px' }}>
                <thead>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center">
                    <td className="border-[#1f4e79] border-r border-b p-2">INVOICE NUMBER/DATE</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">AMOUNT DUE/DATE</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">DISCOUNT AMOUNT/DUE</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">PO NUMBER</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">AMOUNT MATCHED</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">VAR. ($/%)</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">ACCOUNT</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">AMOUNT</td>
                    <td className="border-[#1f4e79] border-b p-2">PAYMENT STATUS</td>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any, idx: number) => (
                    <tr key={idx} className="text-[#1f4e79] text-center">
                      <td className="border-[#1f4e79] border-r border-b p-2">
                        {inv.invoiceNo}<br/>
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="border-[#1f4e79] border-r border-b p-2">
                        {formatMoney(inv.totalAmountDue)}<br/>
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="border-[#1f4e79] border-r border-b p-2">
                        {formatMoney(inv.discount)}<br/>
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{inv.po?.poNumber || '---'}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{formatMoney(inv.totalAmountDue)}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">0.00 / 0%</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">G/L 10-001</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{formatMoney(inv.totalAmountDue)}</td>
                      <td className="border-[#1f4e79] border-b p-2 uppercase font-bold">{inv.status}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - invoices.length) }).map((_, i) => (
                    <tr key={`empty2-${i}`} className="h-[36px]">
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
                </tbody>
              </table>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79] uppercase">
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
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Received By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[80%]">Signature / Date</div>
                    </td>
                    <td style={{ width: '33.33%' }} className="p-2 align-top h-[60px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[10px]">Approved By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[80%]">Signature / Date</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {printInvoiceOpen && printInvoiceData && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={closePrintInvoice}></div>
          <div className="relative wm-print-overlay-panel">
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print</PrimaryButton>
              <button
                onClick={closePrintInvoice}
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
                <div className="wm-print-title uppercase">SUPPLIER INVOICE</div>
              </div>

              <div className="border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Invoice No.</div>
                  <div className="p-2 flex-1 flex items-center">{printInvoiceData.invoiceNo}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Invoice Date:</div>
                  <div className="p-2 flex-1 flex items-center">{formatDate(printInvoiceData.invoiceDate)}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Due Date:</div>
                  <div className="p-2 flex-1 flex items-center">{formatDate(printInvoiceData.dueDate)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="p-2 flex-1 font-bold bg-[#dce6f1] uppercase">SUPPLIER</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="p-2 flex-1 font-bold bg-[#dce6f1] uppercase">BILL TO</div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Supplier Name:</div>
                  <div className="p-2 flex-1 flex items-center">{printInvoiceData.supplier?.name || ''}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Supplier Name:</div>
                  <div className="p-2 flex-1 flex items-center">Watermark Supermarket</div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Address:</div>
                  <div className="p-2 flex-1 flex items-center truncate max-w-[200px]">{printInvoiceData.supplier?.address || ''}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Address:</div>
                  <div className="p-2 flex-1 flex items-center">Alabang, Muntinlupa City</div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">TIN:</div>
                  <div className="p-2 flex-1 flex items-center">{printInvoiceData.supplier?.tin || ''}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">VAT Reg. TIN:</div>
                  <div className="p-2 flex-1 flex items-center"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Contact No.</div>
                  <div className="p-2 flex-1 flex items-center">{printInvoiceData.supplier?.contactPerson || ''}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Contact No.</div>
                  <div className="p-2 flex-1 flex items-center"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Email:</div>
                  <div className="p-2 flex-1 flex items-center">{printInvoiceData.supplier?.email || ''}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[140px] font-bold p-2 border-r border-[#1f4e79] flex items-center bg-[#eef5fb]">Email:</div>
                  <div className="p-2 flex-1 flex items-center"></div>
                </div>
              </div>

              <div className="grid grid-cols-4 border-l border-r border-b border-[#1f4e79] text-[#1f4e79]">
                <div className="border-r border-[#1f4e79]">
                  <div className="bg-[#2e75b6] text-white font-bold p-2 text-center text-[10px]">PO No.</div>
                  <div className="p-2 text-center h-[30px] flex items-center justify-center">{printInvoiceData.po?.poNumber || ''}</div>
                </div>
                <div className="border-r border-[#1f4e79]">
                  <div className="bg-[#2e75b6] text-white font-bold p-2 text-center text-[10px]">Delivery Receipt No.</div>
                  <div className="p-2 text-center h-[30px] flex items-center justify-center">{printInvoiceData.rr?.rrNumber || ''}</div>
                </div>
                <div className="border-r border-[#1f4e79]">
                  <div className="bg-[#2e75b6] text-white font-bold p-2 text-center text-[10px]">Terms</div>
                  <div className="p-2 text-center h-[30px] flex items-center justify-center">{printInvoiceData.supplier?.terms || 'Net 30'}</div>
                </div>
                <div>
                  <div className="bg-[#2e75b6] text-white font-bold p-2 text-center text-[10px]">Payment Due</div>
                  <div className="p-2 text-center h-[30px] flex items-center justify-center">{formatDate(printInvoiceData.dueDate)}</div>
                </div>
              </div>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79]">
                ITEM DETAILS
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full">
                <thead>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center text-[10px]">
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[10%]">No.</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[50%]">Description</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[10%]">Qty</td>
                    <td className="border-[#1f4e79] border-r border-b py-2 w-[10%]">Unit</td>
                    <td className="border-[#1f4e79] border-b py-2 w-[20%]">Amount</td>
                  </tr>
                </thead>
                <tbody>
                  {printInvoiceData.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="text-[10px] text-[#1f4e79]">
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-center">{idx + 1}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-left">{item.description}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-center">{item.qty}</td>
                      <td className="border-[#1f4e79] border-r border-b py-2 px-2 text-center">{item.unit}</td>
                      <td className="border-[#1f4e79] border-b py-2 px-2 text-right">{formatMoney(item.amount)}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 10 - (printInvoiceData.items?.length || 0)) }).map((_, emptyIdx) => (
                    <tr key={`empty-${emptyIdx}`} className="text-[10px] h-[28px]">
                      <td className="border-[#1f4e79] border-r border-b text-center text-[#1f4e79]">{(printInvoiceData.items?.length || 0) + emptyIdx + 1}</td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-r border-b"></td>
                      <td className="border-[#1f4e79] border-b"></td>
                    </tr>
                  ))}
                  
                  <tr>
                    <td colSpan={2} rowSpan={6} className="border-[#1f4e79] border-r p-2 align-top text-[#1f4e79] text-[10px]">
                      <span className="font-bold">NOTES:</span>
                    </td>
                    <td colSpan={2} className="border-[#1f4e79] border-r border-b py-1 px-2 text-[10px] text-[#1f4e79]">Total (VAT Inclusive)</td>
                    <td className="border-[#1f4e79] border-b py-1 px-2 text-[10px] text-right text-[#1f4e79]">{formatMoney(printInvoiceData.grossAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border-[#1f4e79] border-r border-b py-1 px-2 text-[10px] text-[#1f4e79]">Less: VAT</td>
                    <td className="border-[#1f4e79] border-b py-1 px-2 text-[10px] text-right text-[#1f4e79]">{formatMoney(printInvoiceData.vatAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border-[#1f4e79] border-r border-b py-1 px-2 text-[10px] text-[#1f4e79]">Amount Net of VAT</td>
                    <td className="border-[#1f4e79] border-b py-1 px-2 text-[10px] text-right text-[#1f4e79]">{formatMoney(Number(printInvoiceData.grossAmount) - Number(printInvoiceData.vatAmount))}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border-[#1f4e79] border-r border-b py-1 px-2 text-[10px] text-[#1f4e79]">Less: Discount (SC/PWD)</td>
                    <td className="border-[#1f4e79] border-b py-1 px-2 text-[10px] text-right text-[#1f4e79]">{formatMoney(printInvoiceData.discount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border-[#1f4e79] border-r border-b py-1 px-2 text-[10px] text-[#1f4e79]">Add: VAT</td>
                    <td className="border-[#1f4e79] border-b py-1 px-2 text-[10px] text-right text-[#1f4e79]">{formatMoney(printInvoiceData.vatAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border-[#1f4e79] border-r py-1 px-2 text-[10px] font-bold bg-[#dce6f1] text-[#1f4e79]">Total Amount Due</td>
                    <td className="py-1 px-2 text-[10px] font-bold text-right bg-[#dce6f1] text-[#1f4e79]">{formatMoney(printInvoiceData.totalAmountDue)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[#1f4e79]">
                APPROVAL SECTION
              </div>
              
              <table className="wm-approval border-l border-r border-b border-[#1f4e79] w-full text-[#1f4e79]">
                <tbody>
                  <tr>
                    <td style={{ width: '25%' }} className="border-r border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[9px]">Prepared By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic">Signature / Date</div>
                    </td>
                    <td style={{ width: '25%' }} className="border-r border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[9px]">Checked by</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic">Signature / Date</div>
                    </td>
                    <td style={{ width: '25%' }} className="border-r border-[#1f4e79] p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[9px]">Approved by</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic">Signature / Date</div>
                    </td>
                    <td style={{ width: '25%' }} className="p-2 align-top h-[70px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[9px]">Received by Supplier</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic">Signature / Date</div>
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

export default SupplierInvoices;
