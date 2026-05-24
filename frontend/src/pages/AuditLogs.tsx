import { useEffect, useMemo, useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { modulesApi } from '../api/modulesApi';
import { format } from 'date-fns';
import { ShieldCheck, Filter, Clock } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await modulesApi.getAuditLogs({ limit: 100, module: moduleFilter || undefined });
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError('Unable to load audit logs at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  const moduleOptions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.module).filter(Boolean))).sort();
  }, [logs]);

  const formatDateTime = (value: string) => {
    try {
      return format(new Date(value), 'MMM dd, yyyy HH:mm');
    } catch {
      return value;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Audit Logs</h1>
          <p className="text-watermark-blue-200 mt-1">Track user actions across PR, PO, receiving, inventory, AP, and security events.</p>
        </div>
        <PrimaryButton onClick={loadLogs} icon={<ShieldCheck size={18} />}>
          Refresh Audit Trail
        </PrimaryButton>
      </div>

      <GlassCard>
        <div className="grid sm:grid-cols-[1fr_220px] gap-4 mb-6">
          <div className="flex items-center gap-3 text-sm text-white/80">
            <Filter size={18} />
            <span>Filter by module:</span>
          </div>
          <div className="flex gap-3">
            <select
              aria-label="Filter audit logs by module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-watermark-blue-400"
            >
              <option value="">All Modules</option>
              {moduleOptions.map((module) => (
                <option key={module} value={module} className="text-black">{module}</option>
              ))}
            </select>
            <PrimaryButton onClick={() => setModuleFilter('')}>Clear</PrimaryButton>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-100">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-white border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-watermark-blue-200 text-sm">
                <th className="pb-3 font-medium">Timestamp</th>
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Module</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/50">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/50">No audit records found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-4 text-xs text-white/80 font-medium">{formatDateTime(log.timestamp)}</td>
                    <td className="py-4 text-sm">{log.userName || log.userId || 'SYSTEM'}</td>
                    <td className="py-4 text-sm">{log.module}</td>
                    <td className="py-4 text-sm">{log.action}</td>
                    <td className="py-4 text-sm">{log.recordNo || log.recordId}</td>
                    <td className="py-4 text-sm text-white/80">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="flex items-center gap-3 p-6 border border-white/10 bg-white/5">
        <div className="p-3 bg-watermark-blue-500/10 rounded-full text-watermark-blue-200">
          <Clock size={20} />
        </div>
        <div>
          <div className="text-sm text-watermark-blue-200">Audit trail retained for the most recent 100 actions.</div>
          <div className="text-xs text-white/50">Use the filter to track activity by module or follow suspicious approval flows in real time.</div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AuditLogs;
