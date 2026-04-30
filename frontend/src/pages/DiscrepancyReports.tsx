import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { modulesApi } from '../api/modulesApi';
import { format } from 'date-fns';

const DiscrepancyReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [printDr, setPrintDr] = useState<any | null>(null);

  // Form State
  const [rrId, setRrId] = useState('');
  const [descriptionOfIssue, setDescriptionOfIssue] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [rrs, setRrs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [drData, rrData] = await Promise.all([
        modulesApi.getDiscrepancies(),
        modulesApi.getReceivingReports()
      ]);
      setReports(drData);
      setRrs(rrData);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await modulesApi.createDiscrepancy({
        rrId,
        descriptionOfIssue,
        recommendedAction,
        natureQuantity: true, // simplified
        natureQuality: false,
        naturePricing: false
      });
      setShowForm(false);
      fetchData();
      setRrId('');
      setDescriptionOfIssue('');
      setRecommendedAction('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating report');
    }
  };

  const openPrint = async (id: string) => {
    try {
      const dr = await modulesApi.getDiscrepancyById(id);
      setPrintDr(dr);
      setPrintOpen(true);
    } catch (error) {
      console.error('Failed to load DR for print:', error);
      alert('Failed to load DR details');
    }
  };

  const closePrint = () => {
    setPrintOpen(false);
    setPrintDr(null);
  };

  const formatDate = (value: any) => {
    if (!value) return '';
    try {
      return format(new Date(value), 'MMM dd, yyyy');
    } catch {
      return '';
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Discrepancy Reports</h1>
          <p className="text-watermark-blue-200 mt-1">Log issues with delivered goods (damaged, missing, wrong items)</p>
        </div>
        {!showForm && (
          <PrimaryButton onClick={() => setShowForm(true)} icon={<Plus size={18} />}>
            Report Issue
          </PrimaryButton>
        )}
      </div>

      {showForm ? (
        <GlassCard className="animate-fade-in relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Create Discrepancy Report</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Receiving Report Reference</label>
                <select 
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400 focus:bg-white/10"
                  value={rrId} onChange={(e) => setRrId(e.target.value)} required
                >
                  <option value="" className="text-black">Select Receiving Report...</option>
                  {rrs.map(rr => (
                    <option key={rr.id} value={rr.id} className="text-black">{rr.rrNumber} - {format(new Date(rr.dateReceived), 'MMM dd')}</option>
                  ))}
                </select>
              </div>
              <GlassInput label="Description of Issue" value={descriptionOfIssue} onChange={(e) => setDescriptionOfIssue(e.target.value)} required placeholder="e.g., 5 boxes were crushed during transit" />
              <GlassInput label="Recommended Action" value={recommendedAction} onChange={(e) => setRecommendedAction(e.target.value)} required placeholder="e.g., Return to supplier, deduct from invoice" />
            </div>
            <div className="flex justify-end pt-6 border-t border-white/10">
              <PrimaryButton type="submit">Submit Report</PrimaryButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-white border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                  <th className="pb-3 font-medium">DR Number</th>
                  <th className="pb-3 font-medium">RR Ref</th>
                  <th className="pb-3 font-medium">Date Reported</th>
                  <th className="pb-3 font-medium">Issue</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((dr) => (
                  <tr key={dr.id} className="hover:bg-white/5 group">
                    <td className="py-4 font-medium flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-400" />{dr.reportNo}</td>
                    <td className="py-4">{dr.rr?.rrNumber}</td>
                    <td className="py-4">{format(new Date(dr.createdAt), 'MMM dd, yyyy')}</td>
                    <td className="py-4 text-white/80">{dr.descriptionOfIssue}</td>
                    <td className="py-4 text-white/80">{dr.recommendedAction}</td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => openPrint(dr.id)}
                        className="text-sm text-watermark-blue-300 hover:text-white px-3 py-1 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-white/50">No discrepancy reports found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {printOpen && printDr && (
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
                <div className="wm-print-title">DISCREPANCY REPORT</div>
              </div>

              <div className="wm-grid border-t border-[#1f4e79]">
                <div className="wm-field">
                  <div className="wm-field-label">Report No.:</div>
                  <div className="wm-field-value">{printDr.reportNo}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Date:</div>
                  <div className="wm-field-value">{formatDate(printDr.date || printDr.createdAt)}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Reported By:</div>
                  <div className="wm-field-value">{printDr.reportedBy || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Department/Division:</div>
                  <div className="wm-field-value">{printDr.department || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">Location:</div>
                  <div className="wm-field-value">{printDr.location || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">PR No.:</div>
                  <div className="wm-field-value">{printDr.prNumber || printDr.rr?.po?.pr?.prNumber || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">PO No.:</div>
                  <div className="wm-field-value">{printDr.poNumber || printDr.rr?.po?.poNumber || ''}</div>
                </div>
                <div className="wm-field">
                  <div className="wm-field-label">RR No.:</div>
                  <div className="wm-field-value">{printDr.rrNumber || printDr.rr?.rrNumber || ''}</div>
                </div>
                <div className="wm-field border-r-0" style={{ gridColumn: '1 / -1' }}>
                  <div className="wm-field-label" style={{ borderRight: '1px solid #1f4e79' }}>Supplier:</div>
                  <div className="wm-field-value">{printDr.supplier || printDr.rr?.po?.supplier?.name || ''}</div>
                </div>
              </div>

              <div className="wm-section-title text-center">DESCRIPTION OF ISSUE</div>
              <div className="wm-textarea text-[#1f4e79] h-[100px] border-l border-r border-[#1f4e79]">
                {printDr.descriptionOfIssue}
              </div>

              <div className="wm-section-title text-center border-t border-[#1f4e79]">NATURE OF DISCREPANCY</div>
              <div className="wm-checkbox-row text-[#1f4e79]">
                <label className="wm-checkbox mr-4"><span className="wm-box">{printDr.natureQuantity ? '✓' : ''}</span> Quantity</label>
                <label className="wm-checkbox mr-4"><span className="wm-box">{printDr.natureQuality ? '✓' : ''}</span> Quality</label>
                <label className="wm-checkbox mr-4"><span className="wm-box">{printDr.naturePricing ? '✓' : ''}</span> Pricing</label>
                <label className="wm-checkbox"><span className="wm-box">{printDr.natureOthers ? '✓' : ''}</span> Others, specify: <span className="border-b border-[#1f4e79] w-[150px] inline-block ml-1 h-[14px]">{printDr.natureOthers || ''}</span></label>
              </div>

              <div className="wm-section-title text-center">PHOTO EVIDENCE</div>
              <div className="wm-photo-grid bg-[#fff] relative border-l border-r border-[#1f4e79]">
                 <div className="text-[10px] text-[#A1B6D0] italic absolute top-1 left-2">(Attach 2 photo/s here)</div>
                 <div className="wm-photo mt-4 rounded border border-[#dce6f1] bg-[#eef5fb]"></div>
                 <div className="wm-photo mt-4 rounded border border-[#dce6f1] bg-[#eef5fb]"></div>
              </div>

              <div className="wm-section-title text-center border-t border-[#1f4e79]">RECOMMENDED ACTION</div>
              <div className="wm-textarea text-[#1f4e79] h-[100px] border-l border-r border-[#1f4e79] border-b-0">
                {printDr.recommendedAction}
              </div>

              <div className="wm-section-title text-center border-t border-[#1f4e79]">APPROVAL SECTION</div>
              <table className="wm-approval">
                <tbody>
                  <tr>
                    <td style={{ width: '50%' }}>
                      <span className="font-bold">Received By</span>
                      <div className="text-sm font-normal mt-1">{printDr.receivedBy || ''}</div>
                      <div className="wm-sign-line border-[#1f4e79]">Signature / Date</div>
                    </td>
                    <td style={{ width: '50%' }}>
                      <span className="font-bold">Position:</span>
                      <div className="text-sm font-normal mt-1">{printDr.receivedByPosition || ''}</div>
                      <div className="wm-sign-line border-[#1f4e79]">Signature / Date</div>
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

export default DiscrepancyReports;
