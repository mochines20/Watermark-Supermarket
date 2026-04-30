import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { procurementApi } from '../api/procurement';
import { modulesApi } from '../api/modulesApi';
import { ShoppingCart, FileText, AlertTriangle, CreditCard, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    pendingApprovals: 0,
    openPOs: 0,
    reorderAlerts: 0,
    outstandingPayables: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [prs, pos, items, invoices] = await Promise.all([
          procurementApi.getPRs(),
          procurementApi.getPOs(),
          procurementApi.getItems(),
          modulesApi.getInvoices()
        ]);

        const pendingPRs = prs.filter((pr: any) => pr.status === 'PENDING_APPROVAL').length;
        const openPOs = pos.filter((po: any) => po.status === 'OPEN').length;
        
        let reorderAlerts = 0;
        items.forEach((item: any) => {
          const stock = item.inventoryStockStatus?.[0]?.qtyOnHand || 0;
          if (stock <= item.reorderPoint) reorderAlerts++;
        });

        const outstandingPayables = invoices
          .filter((inv: any) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
          .reduce((sum: number, inv: any) => sum + Number(inv.totalAmountDue || 0), 0);

        setMetrics({
          pendingApprovals: pendingPRs,
          openPOs,
          reorderAlerts,
          outstandingPayables
        });

        // Combine PRs and POs for recent activity
        const combined = [
          ...prs.map((pr: any) => ({ ...pr, type: 'PR', displayId: pr.prNumber })),
          ...pos.map((po: any) => ({ ...po, type: 'PO', displayId: po.poNumber }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
         .slice(0, 5);

        setRecentActivity(combined);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white display-font tracking-tight">System Overview</h1>
          <div className="text-sm text-[#A1B6D0] mt-1">Real-time metrics and activity monitoring</div>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-[#A1B6D0] font-medium backdrop-blur-md">
          Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="relative overflow-hidden group stagger-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={48} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <FileText size={20} />
            </div>
            <div className="text-sm text-[#A1B6D0] font-medium">Pending Approvals</div>
          </div>
          <div className="text-4xl font-bold text-white mt-4 display-font">
            {loading ? '...' : metrics.pendingApprovals}
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden group stagger-2">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingCart size={48} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#82D1B1]/20 rounded-lg text-[#82D1B1]">
              <ShoppingCart size={20} />
            </div>
            <div className="text-sm text-[#A1B6D0] font-medium">Open Orders (PO)</div>
          </div>
          <div className="text-4xl font-bold text-white mt-4 display-font">
            {loading ? '...' : metrics.openPOs}
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden group stagger-3">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={48} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
              <AlertTriangle size={20} />
            </div>
            <div className="text-sm text-[#A1B6D0] font-medium">Reorder Alerts</div>
          </div>
          <div className="text-4xl font-bold text-red-400 mt-4 display-font">
            {loading ? '...' : metrics.reorderAlerts}
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden group stagger-4">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard size={48} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#4FD3EC]/20 rounded-lg text-[#4FD3EC]">
              <CreditCard size={20} />
            </div>
            <div className="text-sm text-[#A1B6D0] font-medium">Outstanding Payables</div>
          </div>
          <div className="text-3xl font-bold text-[#4FD3EC] mt-4 display-font tracking-tight">
            {loading ? '...' : `₱ ${(metrics.outstandingPayables).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-5">
        <GlassCard className="col-span-2 min-h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6 display-font flex items-center gap-2">
            <ActivityIcon /> Recent Transactions
          </h3>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FD3EC]"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-[#A1B6D0] text-sm flex flex-col items-center justify-center h-48 opacity-60">
              <FileText size={32} className="mb-3" />
              <p>No recent activity found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${act.type === 'PR' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#82D1B1]/20 text-[#82D1B1]'}`}>
                      {act.type === 'PR' ? <FileText size={18} /> : <ShoppingCart size={18} />}
                    </div>
                    <div>
                      <div className="font-semibold text-white display-font">{act.displayId}</div>
                      <div className="text-xs text-[#A1B6D0]">{act.type === 'PR' ? act.purposeOfRequest : `For Department: ${act.forDepartment}`}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">₱ {Number(act.totalCost || act.total || 0).toLocaleString()}</div>
                    <div className="text-xs text-[#A1B6D0]">{format(new Date(act.createdAt), 'MMM dd, h:mm a')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
        
        <GlassCard className="min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 display-font">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
              <div className="p-3 bg-[#4FD3EC]/10 text-[#4FD3EC] rounded-full mb-3 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-sm font-medium text-white">Create PR</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
              <div className="p-3 bg-[#82D1B1]/10 text-[#82D1B1] rounded-full mb-3 group-hover:scale-110 transition-transform">
                <ShoppingCart size={24} />
              </div>
              <span className="text-sm font-medium text-white">Create PO</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
              <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <span className="text-sm font-medium text-white">Log Issue</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <span className="text-sm font-medium text-white">Pay Invoice</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4FD3EC]">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

export default Dashboard;
