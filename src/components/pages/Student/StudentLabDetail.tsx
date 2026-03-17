import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMonitor, FiCpu, FiHardDrive, FiPackage, FiBox, FiX, FiUser } from 'react-icons/fi';
import { getAllLabs, buildDemoPCs, getLabAssistant, type DemoPC } from '../../../utils/labData';
import { mockData } from '../../../mockData';

const statusStyle: Record<DemoPC['status'], string> = {
  active:      'bg-emerald-100 text-emerald-700',
  maintenance: 'bg-amber-100 text-amber-700',
  inactive:    'bg-slate-100 text-slate-500',
};

// ── Software popup ──────────────────────────────────────────────────────────
interface SoftwareModalProps {
  pcNo: string;
  onClose: () => void;
}

const SoftwareModal: React.FC<SoftwareModalProps> = ({ pcNo, onClose }) => {
  const software = mockData.software;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">Installed Software</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{pcNo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Software list */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Software</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Version</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {software.map(sw => (
                <tr key={sw.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-slate-800 text-xs">{sw.name}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-500 text-xs">{sw.version}</td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {sw.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400">{software.length} packages installed</p>
        </div>
      </div>
    </div>
  );
};

// ── Main page ───────────────────────────────────────────────────────────────
const StudentLabDetail: React.FC = () => {
  const { labNo } = useParams<{ labNo: string }>();
  const navigate = useNavigate();
  const [softwarePc, setSoftwarePc] = useState<string | null>(null); // pcNo of the card whose popup is open

  const labs = useMemo(() => getAllLabs(), []);
  const lab  = labs.find(l => l.labNo === labNo);
  const pcs  = useMemo(() => (labNo ? buildDemoPCs(labNo) : []), [labNo]);
  const assistant = labNo ? getLabAssistant(labNo) : '—';

  const activePCs      = pcs.filter(p => p.status === 'active').length;
  const maintenancePCs = pcs.filter(p => p.status === 'maintenance').length;
  const inactivePCs    = pcs.filter(p => p.status === 'inactive').length;

  if (!lab) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FiBox size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">Lab not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-sm text-sky-600 hover:underline">
            ← Back to labs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Software popup */}
      {softwarePc && (
        <SoftwareModal pcNo={softwarePc} onClose={() => setSoftwarePc(null)} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
          <FiBox size={15} className="text-white" />
        </div>
        <span className="font-semibold text-slate-800 text-sm tracking-tight">Lab Management — Student View</span>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Back + Lab title */}
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <FiArrowLeft size={14} />
            Back to labs
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                Lab {lab.labNo}
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-2">{lab.name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{lab.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm text-slate-600">
              <span>Capacity: <strong className="text-slate-900">{lab.capacity}</strong></span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <FiUser size={12} />
                Assistant: <strong className="text-slate-700">{assistant}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* PC Status Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active',      count: activePCs,      color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Maintenance', count: maintenancePCs, color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
            { label: 'Inactive',    count: inactivePCs,    color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200' },
          ].map(s => (
            <div key={s.label} className={`border rounded-lg px-4 py-3 ${s.bg}`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* PC Cards */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FiMonitor size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Computers ({pcs.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pcs.map(pc => (
              <div key={pc.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
                {/* PC header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-semibold text-slate-800">{pc.pcNo}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusStyle[pc.status]}`}>
                    {pc.status}
                  </span>
                </div>

                {/* Specs */}
                <div className="space-y-1.5 text-xs flex-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">OS</span>
                    <span className="text-slate-700 font-medium text-right max-w-[150px] truncate">{pc.os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1"><FiCpu size={10} /> CPU</span>
                    <span className="text-slate-700 font-medium text-right max-w-[150px] truncate">{pc.processor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">RAM</span>
                    <span className="text-slate-700 font-medium">{pc.ram}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1"><FiHardDrive size={10} /> Storage</span>
                    <span className="text-slate-700 font-medium">{pc.storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">GPU</span>
                    <span className="text-slate-700 font-medium text-right max-w-[150px] truncate">{pc.gpu}</span>
                  </div>
                </div>

                {/* Footer: assistant + software button */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <FiUser size={10} />
                    {assistant}
                  </span>
                  <button
                    onClick={() => setSoftwarePc(pc.pcNo)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                  >
                    <FiPackage size={10} />
                    Software
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Overall Software Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FiPackage size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Installed Software ({mockData.software.length})
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Software</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Version</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Installed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockData.software.map(sw => (
                  <tr key={sw.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{sw.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs">{sw.version}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-medium">
                        {sw.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{sw.installDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentLabDetail;
