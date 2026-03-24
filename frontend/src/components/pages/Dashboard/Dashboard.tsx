import React, { useEffect, useState } from 'react';
import { FiBox, FiMonitor, FiUsers, FiTool } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { fetchLabs, fetchAdminFaculty, fetchAdminAssistants } from '../../../services/api';

const Dashboard: React.FC = () => {
  const { user, role } = useAuth();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const [labs, setLabs] = useState<any[]>([]);
  const [facultyCount, setFacultyCount] = useState<number | null>(null);
  const [assistantCount, setAssistantCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLabs(),
      fetchAdminFaculty().catch(() => []),
      fetchAdminAssistants().catch(() => []),
    ]).then(([labsData, facultyData, assistantData]) => {
      setLabs(labsData);
      setFacultyCount(facultyData.length);
      setAssistantCount(assistantData.length);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Labs', value: loading ? '…' : labs.length, icon: <FiBox size={17} />, color: 'text-indigo-500' },
    { label: 'Faculty', value: loading ? '…' : (facultyCount ?? 0), icon: <FiUsers size={17} />, color: 'text-violet-500' },
    { label: 'Lab Assistants', value: loading ? '…' : (assistantCount ?? 0), icon: <FiTool size={17} />, color: 'text-amber-500' },
    { label: 'Labs Assigned', value: loading ? '…' : labs.filter(l => l.assignedAssistantName).length, icon: <FiMonitor size={17} />, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{today}</p>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-0.5 capitalize">
          Signed in as <span className="font-medium text-slate-600">{role}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{stat.label}</span>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 font-mono">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Labs list */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Labs</h3>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{labs.length} total</span>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-slate-400">Loading from database…</p>
        ) : labs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400 italic">No labs yet. Create one in Admin → Labs.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {labs.slice(0, 5).map(lab => (
              <div key={lab.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{lab.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">Lab #{lab.labNo} · Floor {lab.floor}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${lab.assignedAssistantName ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                  {lab.assignedAssistantName ?? 'Unassigned'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick info row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: 'Faculty Members', value: loading ? '…' : (facultyCount ?? 0) },
          { label: 'Lab Assistants', value: loading ? '…' : (assistantCount ?? 0) },
          { label: 'Labs Assigned', value: loading ? '…' : labs.filter(l => l.assignedAssistantName).length },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">{item.label}</span>
            <span className="text-xl font-bold text-slate-800 font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
