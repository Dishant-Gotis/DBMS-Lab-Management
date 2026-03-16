import React from 'react';
import { FiBox, FiMonitor, FiPackage, FiClock } from 'react-icons/fi';
import { mockData } from '../../../mockData';
import { useAuth } from '../../../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user, role } = useAuth();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const stats = [
    { label: 'Labs', value: mockData.labs.length, icon: <FiBox size={17} />, color: 'text-indigo-500' },
    { label: 'Computers', value: mockData.pcs.length, icon: <FiMonitor size={17} />, color: 'text-emerald-500' },
    { label: 'Software', value: mockData.software.length, icon: <FiPackage size={17} />, color: 'text-violet-500' },
    { label: 'Schedule Slots', value: mockData.timetable.length, icon: <FiClock size={17} />, color: 'text-amber-500' },
  ];

  const activePCs = mockData.pcs.filter(pc => pc.status === 'active');
  const maintenancePCs = mockData.pcs.filter(pc => pc.status === 'maintenance');
  const inactivePCs = mockData.pcs.filter(pc => pc.status === 'inactive');

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

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Labs list */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Labs</h3>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{mockData.labs.length} total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {mockData.labs.slice(0, 4).map(lab => (
              <div key={lab.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{lab.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{lab.labNo} &middot; {lab.capacity} seats</p>
                </div>
                <span className="text-xs text-slate-400">{mockData.colleges.find(c => c.id === lab.collegeId)?.city}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PC status */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Computer Status</h3>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{mockData.pcs.length} total</span>
          </div>
          <div className="px-5 py-4 space-y-3 border-b border-slate-100">
            {[
              { label: 'Active', count: activePCs.length, bar: 'bg-emerald-400', text: 'text-emerald-600' },
              { label: 'Maintenance', count: maintenancePCs.length, bar: 'bg-amber-400', text: 'text-amber-600' },
              { label: 'Inactive', count: inactivePCs.length, bar: 'bg-slate-300', text: 'text-slate-500' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20">{s.label}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.bar} rounded-full`}
                    style={{ width: `${Math.round((s.count / mockData.pcs.length) * 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold font-mono ${s.text} w-4 text-right`}>{s.count}</span>
              </div>
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {activePCs.slice(0, 3).map(pc => (
              <div key={pc.id} className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 font-mono">{pc.pcNo}</span>
                </div>
                <span className="text-xs text-slate-400">{pc.os.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick info row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Faculty Members', value: mockData.faculty.length },
          { label: 'Active Classes', value: mockData.classes.length },
          { label: 'Courses Offered', value: mockData.courses.length },
          { label: 'Lab Assistants', value: mockData.labAssistants.length },
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
