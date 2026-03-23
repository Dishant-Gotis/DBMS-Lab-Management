import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiBox, FiX, FiUser, FiMonitor, FiPackage,
  FiLoader, FiAlertCircle, FiLayers,
} from 'react-icons/fi';
import {
  fetchLabById, fetchPcDetails,
  type ApiLabDetail, type ApiSoftware, type ApiPCDetails,
} from '../../../services/api';

// ── Installed Software Modal ──────────────────────────────────────────────────

interface SoftwareModalProps {
  pcId: number;
  pcLabel: string;
  onClose: () => void;
}

const SoftwareModal: React.FC<SoftwareModalProps> = ({ pcId, pcLabel, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pc, setPc] = useState<ApiPCDetails | null>(null);
  const [software, setSoftware] = useState<ApiSoftware[]>([]);

  useEffect(() => {
    fetchPcDetails(pcId)
      .then(data => { setPc(data.pc); setSoftware(data.softwares); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [pcId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">PC Details &amp; Installed Software</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{pcLabel}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading && (
            <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
              <FiLoader size={22} className="animate-spin" />
              <p className="text-xs">Loading PC details…</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-8 text-red-400">
              <FiAlertCircle size={22} className="mx-auto mb-2" />
              <p className="text-sm font-medium text-red-600">Failed to load PC details</p>
              <p className="text-xs mt-1 text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && pc && (
            <>
              {/* OS info */}
              <div className="mb-5 bg-slate-50 rounded-lg p-4 space-y-1 text-xs">
                <p className="font-semibold text-slate-700 mb-2 uppercase tracking-wider">System Info</p>
                <div className="flex justify-between">
                  <span className="text-slate-400">OS</span>
                  <span className="text-slate-800 font-medium">{pc.osName} {pc.osVersion}</span>
                </div>
                {pc.specDescription && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Specs</span>
                    <span className="text-slate-800 font-medium">{pc.specDescription}</span>
                  </div>
                )}
              </div>

              {/* Software table */}
              {software.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No software recorded for this PC.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Software</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Version</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Installed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {software.map(sw => (
                      <tr key={sw.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-slate-800 text-xs">{sw.name}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-500 text-xs">{sw.version ?? '—'}</td>
                        <td className="px-3 py-2.5 text-slate-400 text-xs hidden sm:table-cell">
                          {new Date(sw.installedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400">{software.length} package(s) installed</p>
        </div>
      </div>
    </div>
  );
};

// ── Main Lab Detail Page ──────────────────────────────────────────────────────

const StudentLabDetail: React.FC = () => {
  const { labNo } = useParams<{ labNo: string }>();
  const navigate = useNavigate();

  const [lab, setLab] = useState<ApiLabDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which PC's software popup is open (by numeric PC id)
  const [softwarePcId, setSoftwarePcId] = useState<number | null>(null);

  useEffect(() => {
    if (!labNo) return;
    setLoading(true);
    setError(null);
    fetchLabById(labNo)
      .then(setLab)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [labNo]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <FiLoader size={32} className="animate-spin" />
          <p className="text-sm">Loading lab details…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !lab) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <FiAlertCircle size={40} className="mx-auto text-red-300 mb-3" />
          <p className="text-slate-700 font-medium">{error ?? 'Lab not found'}</p>
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
      {softwarePcId !== null && (
        <SoftwareModal
          pcId={softwarePcId}
          pcLabel={`PC #${softwarePcId}`}
          onClose={() => setSoftwarePcId(null)}
        />
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
              <p className="text-sm text-slate-500 mt-0.5">Floor {lab.floor}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <FiUser size={12} />
                Assistant:{' '}
                <strong className="text-slate-700">
                  {lab.assignedAssistantName ?? 'Not assigned'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Info block — no PC list endpoint available yet */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <FiMonitor size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium text-sm">PC list not yet available</p>
          <p className="text-slate-400 text-xs mt-1">
            The backend doesn't expose a "list PCs in lab" endpoint yet.<br />
            When it does, individual PC cards with software details will appear here.
          </p>
        </section>

        {/* How to view PC software */}
        <section className="bg-sky-50 border border-sky-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <FiLayers size={18} className="text-sky-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-sky-800">View software for a specific PC</p>
              <p className="text-xs text-sky-600 mt-1">
                If you know the PC's numeric ID, you can view its installed software by clicking below.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  id="pc-id-input"
                  type="number"
                  min={1}
                  placeholder="Enter PC ID (e.g. 1)"
                  className="border border-sky-200 rounded-lg px-3 py-1.5 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = parseInt((e.target as HTMLInputElement).value, 10);
                      if (!isNaN(val) && val > 0) setSoftwarePcId(val);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('pc-id-input') as HTMLInputElement;
                    const val = parseInt(input.value, 10);
                    if (!isNaN(val) && val > 0) setSoftwarePcId(val);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sky-700 bg-white hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                >
                  <FiPackage size={12} />
                  View Software
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentLabDetail;
