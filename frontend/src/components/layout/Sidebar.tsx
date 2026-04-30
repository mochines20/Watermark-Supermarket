import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Boxes, 
  Receipt, 
  CheckSquare, 
  Wallet, 
  FileText, 
  Settings, 
  Users, 
  Building2 
} from 'lucide-react';
import logoImage from '../../assets/logo.jpg';

const Sidebar = () => {
  return (
    <aside className="no-print w-[260px] h-screen fixed left-0 top-0 flex flex-col bg-[#0D2D49]/85 backdrop-blur-md border-r border-[#A1B6D0]/15 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(79,211,236,0.4)] border border-white/20">
          <img src={logoImage} alt="Watermark Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-wide leading-tight display-font">WATERMARK</span>
          <span className="text-[#4FD3EC] font-semibold text-xs tracking-wider leading-tight">SUPERMARKET</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <NavLink to="/" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'nav-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
        </div>

        <div>
          <div className="px-3 mb-2 text-xs font-bold text-[#A1B6D0] uppercase tracking-wider">Procurement</div>
          <NavLink to="/pr" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'nav-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
            <FileText className="w-5 h-5" />
            <span className="text-sm font-medium">Purchase Requisition</span>
          </NavLink>
          <NavLink to="/po" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'nav-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
            <Package className="w-5 h-5" />
            <span className="text-sm font-medium">Purchase Orders</span>
          </NavLink>
          
          <div className="mt-2">
            <div className="flex items-center gap-3 px-3 py-2 text-gray-300">
              <Truck className="w-5 h-5" />
              <span className="text-sm font-medium">Receiving</span>
            </div>
            <div className="pl-11 space-y-1">
              <NavLink to="/receiving/reports" className={({isActive}) => `block py-1.5 text-sm transition-colors ${isActive ? 'text-[#4FD3EC] font-medium' : 'text-gray-400 hover:text-white'}`}>Receiving Reports</NavLink>
              <NavLink to="/receiving/discrepancies" className={({isActive}) => `block py-1.5 text-sm transition-colors ${isActive ? 'text-[#4FD3EC] font-medium' : 'text-gray-400 hover:text-white'}`}>Discrepancy Reports</NavLink>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-3 px-3 py-2 text-gray-300">
              <Boxes className="w-5 h-5" />
              <span className="text-sm font-medium">Inventory</span>
            </div>
            <div className="pl-11 space-y-1">
              <NavLink to="/inventory/stock" className={({isActive}) => `block py-1.5 text-sm transition-colors ${isActive ? 'text-[#4FD3EC] font-medium' : 'text-gray-400 hover:text-white'}`}>Stock Status</NavLink>
              <NavLink to="/inventory/alerts" className={({isActive}) => `flex items-center justify-between py-1.5 text-sm transition-colors ${isActive ? 'text-[#4FD3EC] font-medium' : 'text-gray-400 hover:text-white'}`}>
                <span>Reorder Alerts</span>
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">3</span>
              </NavLink>
            </div>
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-xs font-bold text-[#A1B6D0] uppercase tracking-wider">Finance</div>
          <div className="mt-2">
            <div className="flex items-center gap-3 px-3 py-2 text-gray-300">
              <Receipt className="w-5 h-5" />
              <span className="text-sm font-medium">Accounts Payable</span>
            </div>
            <div className="pl-11 space-y-1">
              <NavLink to="/ap/invoices" className={({isActive}) => `block py-1.5 text-sm transition-colors ${isActive ? 'text-[#4FD3EC] font-medium' : 'text-gray-400 hover:text-white'}`}>Supplier Invoices</NavLink>
              <NavLink to="/ap/match" className={({isActive}) => `block py-1.5 text-sm transition-colors ${isActive ? 'text-[#4FD3EC] font-medium' : 'text-gray-400 hover:text-white'}`}>3-Way Match</NavLink>
              <NavLink to="/ap/aging" className={({isActive}) => `block py-1.5 text-sm transition-colors ${isActive ? 'text-[#4FD3EC] font-medium' : 'text-gray-400 hover:text-white'}`}>Aging Report</NavLink>
            </div>
          </div>

          <NavLink to="/management/vouchers" className={({isActive}) => `mt-2 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'nav-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
            <CheckSquare className="w-5 h-5 text-[#82D1B1]" />
            <span className="text-sm font-medium">Management Approval</span>
          </NavLink>

          <div className="mt-2">
            <div className="flex items-center gap-3 px-3 py-2 text-gray-300">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Disbursement</span>
            </div>
            <div className="pl-11 space-y-1">
              <NavLink to="/disbursement/payments" className={({isActive}) => `block py-1.5 text-sm transition-colors ${isActive ? 'text-[#4FD3EC] font-medium' : 'text-gray-400 hover:text-white'}`}>Payments</NavLink>
            </div>
          </div>
        </div>
        
        <div>
          <div className="px-3 mb-2 text-xs font-bold text-[#A1B6D0] uppercase tracking-wider">Setup</div>
          <NavLink to="/suppliers" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'nav-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium">Suppliers</span>
          </NavLink>
          <NavLink to="/users" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'nav-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Users</span>
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'nav-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
