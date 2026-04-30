import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PurchaseRequisition from './pages/PurchaseRequisition';
import PurchaseOrder from './pages/PurchaseOrder';
import Suppliers from './pages/Suppliers';
import ReceivingReport from './pages/ReceivingReport';
import StockStatus from './pages/StockStatus';
import SupplierInvoices from './pages/SupplierInvoices';
import VoucherApproval from './pages/VoucherApproval';
import Payments from './pages/Payments';
import DiscrepancyReports from './pages/DiscrepancyReports';
import ThreeWayMatch from './pages/ThreeWayMatch';
import AgingReport from './pages/AgingReport';
import UserManagement from './pages/UserManagement';
import SystemSettings from './pages/SystemSettings';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020813] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-watermark-blue-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        className: 'glass-card text-white',
        style: {
          background: 'rgba(7, 28, 53, 0.9)',
          color: '#fff',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(79, 211, 236, 0.3)',
        },
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pr" element={<PurchaseRequisition />} />
          <Route path="po" element={<PurchaseOrder />} />
          <Route path="receiving/reports" element={<ReceivingReport />} />
          <Route path="receiving/discrepancies" element={<DiscrepancyReports />} />
          <Route path="inventory/stock" element={<StockStatus />} />
          <Route path="inventory/alerts" element={<StockStatus />} />
          <Route path="ap/invoices" element={<SupplierInvoices />} />
          <Route path="ap/match" element={<ThreeWayMatch />} />
          <Route path="ap/aging" element={<AgingReport />} />
          <Route path="management/vouchers" element={<VoucherApproval />} />
          <Route path="disbursement/payments" element={<Payments />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
