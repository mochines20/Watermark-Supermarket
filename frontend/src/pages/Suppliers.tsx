import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, X, Search, Users, Printer } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import React from 'react';
import { procurementApi } from '../api/procurement';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soaOpen, setSoaOpen] = useState(false);
  const [soaData, setSoaData] = useState<any | null>(null);
  const [queryOpen, setQueryOpen] = useState(false);
  const [queryData, setQueryData] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    vendorCode: '',
    name: '',
    address: '',
    contactPerson: '',
    contactDetails: '',
    email: '',
    tin: '',
    paymentTerms: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await procurementApi.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrintSOA = async (id: string) => {
    try {
      const data = await procurementApi.getSupplierSOA(id);
      setSoaData(data);
      setSoaOpen(true);
    } catch (error) {
      console.error('Failed to fetch SOA:', error);
      alert('Failed to load Statement of Account');
    }
  };

  const handlePrintQuery = async (id: string) => {
    try {
      const data = await procurementApi.getSupplierSOA(id);
      setQueryData(data);
      setQueryOpen(true);
    } catch (error) {
      console.error('Failed to fetch Vendor Query:', error);
      alert('Failed to load Vendor Query Report');
    }
  };

  const formatMoney = (value: any) => `₱${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await procurementApi.createSupplier(formData);
      setShowForm(false);
      fetchData();
      setFormData({
        vendorCode: '', name: '', address: '', contactPerson: '',
        contactDetails: '', email: '', tin: '', paymentTerms: ''
      });
    } catch (error: any) {
      console.error('Failed to submit:', error);
      alert(error.response?.data?.error || 'Error creating supplier');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Suppliers Master File</h1>
          <p className="text-watermark-blue-200 mt-1">Manage approved vendors and partners</p>
        </div>
        {!showForm && (
          <PrimaryButton onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
            Add Supplier
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
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Register New Supplier</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput label="Vendor Code" name="vendorCode" value={formData.vendorCode} onChange={handleInputChange} required />
              <GlassInput label="Company Name" name="name" value={formData.name} onChange={handleInputChange} required />
              <div className="col-span-2">
                <GlassInput label="Address" name="address" value={formData.address} onChange={handleInputChange} required />
              </div>
              <GlassInput label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required />
              <GlassInput label="Contact Number" name="contactDetails" value={formData.contactDetails} onChange={handleInputChange} required />
              <GlassInput label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              <GlassInput label="TIN" name="tin" value={formData.tin} onChange={handleInputChange} required />
              <GlassInput label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} required />
            </div>

            <div className="flex justify-end pt-6 border-t border-white/10">
              <PrimaryButton type="submit">Save Supplier</PrimaryButton>
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
                placeholder="Search Vendors..." 
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10 transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Company Name</th>
                  <th className="pb-3 font-medium">Contact Person</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 font-medium flex items-center gap-2">
                      <Users size={16} className="text-teal-400" />
                      {sup.vendorCode}
                    </td>
                    <td className="py-4 font-bold">{sup.name}</td>
                    <td className="py-4 text-white/70">{sup.contactPerson}</td>
                    <td className="py-4"><StatusBadge status={sup.isAccredited ? 'APPROVED' : 'PENDING'} /></td>
                    <td className="py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handlePrintQuery(sup.id)}
                        className="text-sm text-watermark-blue-300 hover:text-white px-3 py-1 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <Printer size={14} /> Query
                      </button>
                      <button 
                        onClick={() => handlePrintSOA(sup.id)}
                        className="text-sm text-watermark-blue-300 hover:text-white px-3 py-1 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <Printer size={14} /> SOA
                      </button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/50">No suppliers registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {soaOpen && soaData && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={() => setSoaOpen(false)}></div>
          <div className="relative wm-print-overlay-panel overflow-x-auto" style={{ width: '100%', maxWidth: '1200px' }}>
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print SOA</PrimaryButton>
              <button
                onClick={() => setSoaOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
              >
                Close
              </button>
            </div>

            <div className="wm-print-doc" style={{ fontSize: '10px' }}>
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
                <div className="wm-print-title uppercase">STATEMENT OF ACCOUNT</div>
              </div>

              {/* Top Details */}
              <div className="grid grid-cols-2 border-t border-l border-r border-[#1f4e79] text-[#1f4e79] text-[10px]">
                <div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Company Address:</div>
                    <div className="p-1 flex-1">Pavilion Global, Commerce Ave...</div>
                  </div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Contact No.</div>
                    <div className="p-1 flex-1"></div>
                  </div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Email Address:</div>
                    <div className="p-1 flex-1"></div>
                  </div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">VAT Reg. TIN:</div>
                    <div className="p-1 flex-1"></div>
                  </div>
                </div>
                <div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Statement Date:</div>
                    <div className="p-1 flex-1">{format(new Date(), 'MM/dd/yyyy')}</div>
                  </div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Covered Period:</div>
                    <div className="p-1 flex-1">All Unpaid</div>
                  </div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Account Number:</div>
                    <div className="p-1 flex-1">{soaData.vendorCode}</div>
                  </div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Payment Terms:</div>
                    <div className="p-1 flex-1">{soaData.paymentTerms}</div>
                  </div>
                </div>
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-[10px] text-[#1f4e79] uppercase">
                SUPPLIER INFORMATION
              </div>
              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79] text-[10px]">
                <div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Supplier Name:</div>
                    <div className="p-1 flex-1 font-bold">{soaData.name}</div>
                  </div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Address:</div>
                    <div className="p-1 flex-1 truncate max-w-[250px]">{soaData.address}</div>
                  </div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">VAT Reg. TIN:</div>
                    <div className="p-1 flex-1">{soaData.tin}</div>
                  </div>
                </div>
                <div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Contact Person:</div>
                    <div className="p-1 flex-1">{soaData.contactPerson}</div>
                  </div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Email:</div>
                    <div className="p-1 flex-1">{soaData.email}</div>
                  </div>
                  <div className="flex border-b border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Tel. No.</div>
                    <div className="p-1 flex-1">{soaData.contactDetails}</div>
                  </div>
                </div>
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-center text-[10px] text-[#1f4e79] uppercase">
                REFERENCE DOCUMENTS
              </div>
              <div className="grid grid-cols-3 text-center text-[10px] text-white border-l border-r border-[#1f4e79]">
                <div className="bg-[#2e75b6] p-1 border-r border-[#1f4e79] font-bold">PO No.</div>
                <div className="bg-[#2e75b6] p-1 border-r border-[#1f4e79] font-bold">RR No.</div>
                <div className="bg-[#2e75b6] p-1 font-bold">Invoice No.</div>
              </div>
              <div className="grid grid-cols-3 text-center text-[10px] text-[#1f4e79] border-l border-r border-b border-[#1f4e79] h-[24px]">
                <div className="border-r border-[#1f4e79]"></div>
                <div className="border-r border-[#1f4e79]"></div>
                <div></div>
              </div>

              {(() => {
                const totalCharges = soaData.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.totalAmountDue), 0) || 0;
                // Currently payments aren't calculated but keeping 0 for this report logic
                const totalPayments = 0; 
                const remainingBalance = totalCharges - totalPayments;
                return (
                  <>
                    <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-center text-[10px] text-[#1f4e79] uppercase">
                      ACCOUNT SUMMARY
                    </div>
                    <div className="grid grid-cols-4 text-center text-[10px] text-white border-l border-r border-[#1f4e79]">
                      <div className="bg-[#2e75b6] p-1 border-r border-[#1f4e79] font-bold">Previous Balance</div>
                      <div className="bg-[#2e75b6] p-1 border-r border-[#1f4e79] font-bold">Total Charges</div>
                      <div className="bg-[#2e75b6] p-1 border-r border-[#1f4e79] font-bold">Total Payments</div>
                      <div className="bg-[#2e75b6] p-1 font-bold">Remaining Balance</div>
                    </div>
                    <div className="grid grid-cols-4 text-center text-[10px] text-[#1f4e79] border-l border-r border-b border-[#1f4e79]">
                      <div className="border-r border-[#1f4e79] p-1">₱0.00</div>
                      <div className="border-r border-[#1f4e79] p-1 font-bold">{formatMoney(totalCharges)}</div>
                      <div className="border-r border-[#1f4e79] p-1 font-bold">{formatMoney(totalPayments)}</div>
                      <div className="p-1 font-bold">{formatMoney(remainingBalance)}</div>
                    </div>
                  </>
                );
              })()}

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] font-bold p-1 text-center text-[10px] text-[#1f4e79] uppercase">
                TRANSACTION HISTORY
              </div>
              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full" style={{ fontSize: '8px' }}>
                <thead>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center">
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">Date</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">PO No.</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">RR No.</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">Invoice No.</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">Description</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">Charges</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">Payments</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">Balance</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">Invoice Date</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1">Due Date</td>
                    <td colSpan={4} className="border-[#1f4e79] border-r border-b p-1">AGING (Days)</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1 leading-tight">Payment<br/>Status</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-r border-b p-1 leading-tight">Voucher<br/>Ref. No.</td>
                    <td rowSpan={2} className="border-[#1f4e79] border-b p-1 leading-tight">Payment<br/>Ref. No.</td>
                  </tr>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center">
                    <td className="border-[#1f4e79] border-r border-b p-1">0-30</td>
                    <td className="border-[#1f4e79] border-r border-b p-1">31-60</td>
                    <td className="border-[#1f4e79] border-r border-b p-1">61-90</td>
                    <td className="border-[#1f4e79] border-r border-b p-1">&gt;90</td>
                  </tr>
                </thead>
                <tbody>
                  {soaData.invoices?.map((inv: any) => {
                    const diff = differenceInDays(new Date(), new Date(inv.dueDate));
                    const is0to30 = diff >= 0 && diff <= 30;
                    const is31to60 = diff > 30 && diff <= 60;
                    const is61to90 = diff > 60 && diff <= 90;
                    const isOver90 = diff > 90;
                    return (
                      <tr key={inv.id} className="text-[#1f4e79] text-center">
                        <td className="border-[#1f4e79] border-r border-b p-1">{format(new Date(inv.createdAt), 'MM/dd/yy')}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1">{inv.po?.poNumber}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1">{inv.rr?.rrNumber}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1">{inv.invoiceNo}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1 text-left truncate max-w-[80px]">Purchases</td>
                        <td className="border-[#1f4e79] border-r border-b p-1 text-right">{formatMoney(inv.totalAmountDue)}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1 text-right">0</td>
                        <td className="border-[#1f4e79] border-r border-b p-1 text-right">{formatMoney(inv.totalAmountDue)}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1">{format(new Date(inv.invoiceDate), 'MM/dd/yy')}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1">{format(new Date(inv.dueDate), 'MM/dd/yy')}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1 text-right">{is0to30 ? formatMoney(inv.totalAmountDue) : ''}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1 text-right">{is31to60 ? formatMoney(inv.totalAmountDue) : ''}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1 text-right">{is61to90 ? formatMoney(inv.totalAmountDue) : ''}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1 text-right">{isOver90 ? formatMoney(inv.totalAmountDue) : ''}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1">{inv.status}</td>
                        <td className="border-[#1f4e79] border-r border-b p-1"></td>
                        <td className="border-[#1f4e79] border-b p-1"></td>
                      </tr>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 10 - (soaData.invoices?.length || 0)) }).map((_, emptyIdx) => (
                    <tr key={`empty-${emptyIdx}`} className="text-[8px] h-[20px]">
                       <td className="border-[#1f4e79] border-r border-b"></td>
                       <td className="border-[#1f4e79] border-r border-b"></td>
                       <td className="border-[#1f4e79] border-r border-b"></td>
                       <td className="border-[#1f4e79] border-r border-b"></td>
                       <td className="border-[#1f4e79] border-r border-b"></td>
                       <td className="border-[#1f4e79] border-r border-b"></td>
                       <td className="border-[#1f4e79] border-r border-b"></td>
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
                </tbody>
              </table>

              <div className="grid grid-cols-2 border-l border-r border-[#1f4e79] text-[#1f4e79] text-[10px]">
                <div>
                  <div className="bg-[#2e75b6] text-white font-bold p-1 text-center border-b border-[#1f4e79]">PAYMENT INFORMATION</div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-2 border-r border-[#1f4e79] flex items-center justify-center text-center bg-[#eef5fb]">Due Date:</div>
                    <div className="p-2 flex-1"></div>
                  </div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-2 border-r border-[#1f4e79] flex items-center justify-center text-center bg-[#eef5fb]">Mode of Payment<br/>(Check/E-Payment):</div>
                    <div className="p-2 flex-1"></div>
                  </div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-2 border-r border-[#1f4e79] flex items-center justify-center text-center bg-[#eef5fb]">Bank Details:</div>
                    <div className="p-2 flex-1"></div>
                  </div>
                  <div className="flex border-b border-r border-[#1f4e79]">
                    <div className="w-[120px] font-bold p-2 border-r border-[#1f4e79] flex items-center justify-center text-center bg-[#eef5fb]">Reference:</div>
                    <div className="p-2 flex-1"></div>
                  </div>
                </div>
                <div>
                  <div className="bg-[#2e75b6] text-white font-bold p-1 text-center border-b border-[#1f4e79]">NOTES/REMARKS</div>
                  <div className="p-2 h-full border-b border-[#1f4e79]"></div>
                </div>
              </div>

              <div className="border-l border-r border-[#1f4e79] border-b bg-[#dce6f1] text-center font-bold py-1 text-[10px] text-[#1f4e79] uppercase">
                APPROVAL SECTION
              </div>
              
              <table className="wm-approval border-l border-r border-b border-[#1f4e79] w-full text-[#1f4e79]">
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }} className="border-r border-[#1f4e79] p-2 align-top h-[60px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[9px]">Prepared By</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[200px]">Signature / Date</div>
                    </td>
                    <td style={{ width: '50%' }} className="p-2 align-top h-[60px] relative bg-[#eef5fb]">
                      <span className="font-bold absolute top-2 left-2 text-[9px]">Checked by</span>
                      <div className="absolute bottom-2 left-2 right-4 border-t border-[#A1B6D0] pt-1 text-[#A1B6D0] text-[8px] italic w-[200px]">Signature / Date</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {queryOpen && queryData && (
        <div className="wm-print-overlay">
          <div className="no-print fixed inset-0 bg-black/60" onClick={() => setQueryOpen(false)}></div>
          <div className="relative wm-print-overlay-panel overflow-x-auto" style={{ width: '100%', maxWidth: '1200px' }}>
            <div className="no-print flex justify-end gap-2 mb-4">
              <PrimaryButton onClick={() => window.print()}>Print Query Report</PrimaryButton>
              <button
                onClick={() => setQueryOpen(false)}
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
                <div className="wm-print-title uppercase text-[18px]">QUERY VENDOR REPORT</div>
              </div>

              <div className="grid grid-cols-2 border-t border-l border-r border-[#1f4e79] text-[#1f4e79]">
                <div className="flex border-b border-r border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Run Date:</div>
                  <div className="p-1 flex-1">{format(new Date(), 'MM/dd/yyyy')}</div>
                </div>
                <div className="flex border-b border-[#1f4e79]">
                  <div className="w-[120px] font-bold p-1 border-r border-[#1f4e79] bg-[#eef5fb]">Run Time:</div>
                  <div className="p-1 flex-1">{format(new Date(), 'HH:mm')}</div>
                </div>
              </div>

              <div className="border-l border-r border-b border-[#1f4e79] bg-[#dce6f1] text-center font-bold p-1 text-[#1f4e79] uppercase">
                ACCOUNTS PAYABLE INVOICE ENTRY CONTROL RECEIPT
              </div>

              <table className="wm-table border-[#1f4e79] border-t-0 border-l border-r border-b w-full" style={{ fontSize: '9px' }}>
                <thead>
                  <tr className="bg-[#2e75b6] text-white font-bold text-center">
                    <td className="border-[#1f4e79] border-r border-b p-2">VENDOR CODE</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">VENDOR NAME</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">ADDRESS</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">CONTACT NUMBERS</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">TIN/TAX ID</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">AMOUNT</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">FISCAL</td>
                    <td className="border-[#1f4e79] border-b p-2">LAST CHECK</td>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-[#1f4e79] text-center">
                    <td className="border-[#1f4e79] border-r border-b p-2 font-bold">{queryData.vendorCode}</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 font-bold">{queryData.name}</td>
                    <td className="border-[#1f4e79] border-r border-b p-2 truncate max-w-[120px]">{queryData.address}</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">{queryData.contactDetails}</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">{queryData.tin}</td>
                    <td className="border-[#1f4e79] border-r border-b p-2">
                      Total AP:<br/>
                      {formatMoney(queryData.invoices?.reduce((s: number, i: any) => s + Number(i.totalAmountDue), 0) || 0)}
                    </td>
                    <td className="border-[#1f4e79] border-r border-b p-2">
                      Fiscal YTD:<br/>
                      {formatMoney(queryData.invoices?.reduce((s: number, i: any) => s + Number(i.totalAmountDue), 0) || 0)}
                    </td>
                    <td className="border-[#1f4e79] border-b p-2">---</td>
                  </tr>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`empty1-${i}`} className="h-[20px]">
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
                  {queryData.invoices?.map((inv: any, idx: number) => (
                    <tr key={idx} className="text-[#1f4e79] text-center">
                      <td className="border-[#1f4e79] border-r border-b p-2">
                        {inv.invoiceNo}<br/>
                        {format(new Date(inv.invoiceDate), 'MM/dd/yyyy')}
                      </td>
                      <td className="border-[#1f4e79] border-r border-b p-2">
                        {formatMoney(inv.totalAmountDue)}<br/>
                        {format(new Date(inv.dueDate), 'MM/dd/yyyy')}
                      </td>
                      <td className="border-[#1f4e79] border-r border-b p-2">
                        0.00<br/>
                        {format(new Date(inv.dueDate), 'MM/dd/yyyy')}
                      </td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{inv.po?.poNumber || '---'}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{formatMoney(inv.totalAmountDue)}</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">0.00 / 0%</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">G/L 10-001</td>
                      <td className="border-[#1f4e79] border-r border-b p-2">{formatMoney(inv.totalAmountDue)}</td>
                      <td className="border-[#1f4e79] border-b p-2 uppercase font-bold">{inv.status}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - (queryData.invoices?.length || 0)) }).map((_, i) => (
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
    </div>
  );
};

export default Suppliers;
