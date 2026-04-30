import { Bell, Search, User, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <header className="no-print h-16 flex items-center justify-between px-8 bg-[#071C35]/40 backdrop-blur-md border-b border-[#A1B6D0]/10 sticky top-0 z-40">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1B6D0] group-focus-within:text-[#4FD3EC] transition-colors" />
          <input 
            type="text" 
            placeholder="Search PR, PO, Invoices..." 
            className="w-full bg-white/5 border border-[#A1B6D0]/20 rounded-full py-1.5 pl-9 pr-4 text-sm text-white placeholder:text-[#A1B6D0]/50 focus:outline-none focus:border-[#4FD3EC]/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-[#A1B6D0] hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-[#A1B6D0]/20 mx-2"></div>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-white group-hover:text-[#4FD3EC] transition-colors">{user?.name || 'User'}</span>
              <span className="text-xs text-[#A1B6D0]">{user?.role?.replace('_', ' ') || 'Guest'}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#135A8E] flex items-center justify-center border border-[#4FD3EC]/30">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-[#0a2342]/90 backdrop-blur-xl border border-[#4FD3EC]/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden animate-fade-in-up">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors text-left"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
