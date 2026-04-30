import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Shield, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import api from '../api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STORE_MANAGER',
    department: 'MANAGEMENT',
    isActive: true
  });

  const roles = ['STORE_MANAGER', 'FINANCE_BUDGETING', 'CFO', 'PURCHASING_OFFICER', 'RECEIVING_CLERK', 'INVENTORY_CUSTODIAN', 'AP_CLERK', 'TREASURER', 'CASHIER', 'ADMIN'];
  const departments = ['PROCUREMENT', 'RECEIVING', 'INVENTORY', 'FINANCE', 'MANAGEMENT', 'ADMINISTRATION'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'STORE_MANAGER', department: 'MANAGEMENT', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', // Leave blank unless changing
      role: user.role, 
      department: user.department, 
      isActive: user.isActive 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('User removed successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}`, formData);
        toast.success('User updated successfully');
      } else {
        await api.post('/auth/users', formData);
        toast.success('User invited successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center text-watermark-blue-300">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-watermark-blue-400"></div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 relative animate-slide-up">
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-watermark-blue-200 mt-1">Control access, roles, and permissions across the system</p>
        </div>
        <PrimaryButton icon={<Plus size={18} />} onClick={openAddModal}>
          Invite User
        </PrimaryButton>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-white border-collapse">
            <thead>
              <tr className="table-header">
                <th className="py-4 px-6 rounded-tl-xl">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 rounded-tr-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4FD3EC]/10">
              {users.map((u, i) => (
                <tr key={u.id} className={`${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'} table-row group transition-colors`}>
                  <td className="py-4 px-6 font-bold flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-watermark-blue-500/20 border border-watermark-blue-400/30 flex items-center justify-center shadow-[0_0_10px_rgba(79,211,236,0.1)]">
                      <Shield size={14} className="text-watermark-blue-400" />
                    </div>
                    {u.name}
                  </td>
                  <td className="py-4 px-6 text-white/80">{u.email}</td>
                  <td className="py-4 px-6 font-medium text-watermark-blue-300">
                    <span className="px-2 py-1 rounded bg-[#071C35]/50 border border-watermark-blue-400/20 text-xs tracking-wider">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6">{u.department}</td>
                  <td className="py-4 px-6"><StatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(u)} className="p-2 bg-watermark-blue-400/10 hover:bg-watermark-blue-400/20 text-watermark-blue-300 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-white/50">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020813]/80 backdrop-blur-sm animate-fade-in-up">
          <GlassCard className="w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingUser ? 'Edit User' : 'Invite New User'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-watermark-blue-200 uppercase tracking-wider">Full Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-watermark-blue-200 uppercase tracking-wider">Email Address</label>
                    <input type="email" required={!editingUser} disabled={!!editingUser} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="glass-input w-full disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-watermark-blue-200 uppercase tracking-wider">Role</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="glass-input w-full [&>option]:bg-[#071C35]">
                      {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-watermark-blue-200 uppercase tracking-wider">Department</label>
                    <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="glass-input w-full [&>option]:bg-[#071C35]">
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs text-watermark-blue-200 uppercase tracking-wider">
                      {editingUser ? 'Password (Leave blank to keep current)' : 'Password'}
                    </label>
                    <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="glass-input w-full" />
                  </div>
                  {editingUser && (
                    <div className="space-y-2 col-span-2">
                      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded border-white/20 bg-transparent text-watermark-blue-400 focus:ring-0 focus:ring-offset-0" />
                        Account is Active
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-white/10 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors font-medium">Cancel</button>
                  <button type="submit" className="btn-primary rounded-xl px-8 shadow-[0_0_15px_rgba(79,211,236,0.3)]">
                    {editingUser ? 'Save Changes' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
