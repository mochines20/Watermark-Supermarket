import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { GlassInput } from '../components/ui/GlassInput';
import { Save, Server, ShieldCheck, Bell } from 'lucide-react';

const SystemSettings = () => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-watermark-blue-200 mt-1">Configure global application parameters</p>
        </div>
        <PrimaryButton icon={<Save size={18} />}>
          Save Changes
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* General Settings */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <Server className="text-watermark-blue-400" />
              <h2 className="text-xl font-semibold text-white">General Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassInput label="Company Name" defaultValue="Watermark Supermarket" />
              <GlassInput label="Corporate Address" defaultValue="123 Commerce Way, Manila, PH" />
              <GlassInput label="Tax Identification Number (TIN)" defaultValue="123-456-789-000" />
              <GlassInput label="Base Currency" defaultValue="PHP (₱)" disabled />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <ShieldCheck className="text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Security & Audit</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-white font-medium">Require 2FA for CFO/Admin</h4>
                  <p className="text-sm text-white/50 mt-1">Enforce two-factor authentication for sensitive roles</p>
                </div>
                <div className="w-12 h-6 bg-watermark-blue-500 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-white font-medium">Strict 3-Way Match Enforcement</h4>
                  <p className="text-sm text-white/50 mt-1">Block voucher creation if PO and RR do not perfectly match Invoice</p>
                </div>
                <div className="w-12 h-6 bg-watermark-blue-500 rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Notifications & Integrations */}
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <Bell className="text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-white/80 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/20 text-watermark-blue-500 focus:ring-watermark-blue-400" defaultChecked />
                <span>Email alerts for Reorder Points</span>
              </label>
              <label className="flex items-center gap-3 text-white/80 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/20 text-watermark-blue-500 focus:ring-watermark-blue-400" defaultChecked />
                <span>Notify Dept. Head on PR Approval</span>
              </label>
              <label className="flex items-center gap-3 text-white/80 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/20 text-watermark-blue-500 focus:ring-watermark-blue-400" defaultChecked />
                <span>Daily AP Aging Summary Email</span>
              </label>
            </div>
          </GlassCard>

          <GlassCard className="bg-red-500/10 border-red-500/30">
            <h3 className="text-red-400 font-bold mb-2">Danger Zone</h3>
            <p className="text-sm text-white/60 mb-4">Actions here are irreversible.</p>
            <button className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-lg border border-red-500/50 transition-colors">
              Reset System Counters (PR/PO/RR)
            </button>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default SystemSettings;
