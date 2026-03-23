import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { SearchBar } from '../../common/SearchBar';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useAuth } from '../../../context/AuthContext';
import { mockData } from '../../../mockData';
import { FiPackage, FiLoader, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import SoftwareManager from './SoftwareManager';
import {
  fetchLabs, fetchAssistantLabs, fetchFacultyLabs,
  fetchPcDetails, type ApiLab, type ApiSoftware,
} from '../../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

type SoftwareEntry = { id: string; name: string; version: string; category: string };
const ALL_SOFTWARE: SoftwareEntry[] = mockData.software as SoftwareEntry[];

// Simple mock DemoPC shape for the software manager (no real PC-list endpoint yet)
interface DemoPC { id: string; pcNo: string; os: string; processor: string; ram: string; storage: string; gpu: string; status: 'active' | 'inactive' | 'maintenance' }

// ─── PC Software Detail Panel ────────────────────────────────────────────────

interface PcSoftwareDetailProps {
  pcId: number;
  onClose: () => void;
}

const PcSoftwareDetail: React.FC<PcSoftwareDetailProps> = ({ pcId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [software, setSoftware] = useState<ApiSoftware[]>([]);
  const [osInfo, setOsInfo] = useState('');

  useEffect(() => {
    fetchPcDetails(pcId)
      .then(data => {
        setSoftware(data.softwares);
        setOsInfo(`${data.pc.osName} ${data.pc.osVersion}`);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [pcId]);

  return (
    <Modal isOpen onClose={onClose} title={`PC #${pcId} — Installed Software`} size="md">
      {loading && (
        <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
          <FiLoader size={20} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}
      {!loading && error && (
        <div className="text-center py-8 text-red-400">
          <FiAlertCircle size={22} className="mx-auto mb-2" />
          <p className="text-sm text-red-600 font-medium">Failed to load</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}
      {!loading && !error && (
        <>
          <p className="text-xs text-slate-500 mb-4">OS: <span className="font-medium text-slate-700">{osInfo}</span></p>
          {software.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No software recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase text-slate-400">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase text-slate-400">Version</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase text-slate-400 hidden sm:table-cell">Installed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {software.map(sw => (
                  <tr key={sw.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-medium text-slate-800 text-xs">{sw.name}</td>
                    <td className="px-3 py-2 font-mono text-slate-500 text-xs">{sw.version ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-400 text-xs hidden sm:table-cell">
                      {new Date(sw.installedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Modal>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const LabsPage: React.FC = () => {
  const { role, user } = useAuth();

  // Real labs from API
  const [labs, setLabs] = useState<ApiLab[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [selectedLab, setSelectedLab] = useState<ApiLab | null>(null);
  const [viewPcSoftware, setViewPcSoftware] = useState<number | null>(null);

  // Legacy software manager (keeps existing mock-based flow for admin edits)
  const [softwarePc, setSoftwarePc] = useState<DemoPC | null>(null);
  const [pcSoftwareMap, setPcSoftwareMap] = useState<Record<string, string[]>>({});

  // ── Fetch real labs based on role ─────────────────────────────────────────
  const loadLabs = () => {
    setFetchLoading(true);
    setFetchError(null);

    let promise: Promise<ApiLab[]>;

    if (role === 'labAssistant' && user.id) {
      promise = fetchAssistantLabs(user.id);
    } else if (role === 'faculty' && user.id) {
      promise = fetchFacultyLabs(user.id);
    } else {
      // admin (or fallback) — fetch all labs for the college
      promise = fetchLabs();
    }

    promise
      .then(setLabs)
      .catch((err: Error) => {
        // For faculty/assistant, a 500 usually means no timetable entries yet — treat as empty
        if (role === 'faculty' || role === 'labAssistant') {
          setLabs([]);
        } else {
          setFetchError(err.message);
        }
      })
      .finally(() => setFetchLoading(false));
  };

  useEffect(() => { loadLabs(); }, [role, user.id]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredLabs = useMemo<ApiLab[]>(() => {
    if (!query.trim()) return labs;
    const q = query.toLowerCase();
    return labs.filter(
      l =>
        l.labNo.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        (l.assignedAssistantName ?? '').toLowerCase().includes(q),
    );
  }, [labs, query]);

  const canAccessLabs = role !== 'student';

  if (!canAccessLabs) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold text-slate-900">Labs</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium">Access Restricted</p>
          <p className="text-amber-700 text-sm mt-1">Students do not have access to the Labs section.</p>
        </div>
      </div>
    );
  }

  const handleSaveSoftware = (ids: string[]) => {
    if (!softwarePc) return;
    setPcSoftwareMap(prev => ({ ...prev, [softwarePc.id]: ids }));
    setSoftwarePc(null);
  };

  const getPcInstalledIds = (pcId: string): string[] =>
    pcSoftwareMap[pcId] ?? ALL_SOFTWARE.map(s => s.id);

  return (
    <div className="space-y-5">
      {/* PC Software Detail (real API) */}
      {viewPcSoftware !== null && (
        <PcSoftwareDetail pcId={viewPcSoftware} onClose={() => setViewPcSoftware(null)} />
      )}

      {/* Legacy software manager modal stub */}
      {softwarePc && (
        <SoftwareManager
          pc={softwarePc}
          installedIds={getPcInstalledIds(softwarePc.id)}
          onSave={handleSaveSoftware}
          onClose={() => setSoftwarePc(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Labs</h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'labAssistant' || role === 'faculty'
              ? `Showing your assigned lab(s)`
              : 'Click a lab to view details'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full md:w-[300px]">
            <SearchBar onSearch={setQuery} placeholder="Search labs..." />
          </div>
          <button
            onClick={loadLabs}
            title="Refresh"
            className="p-2 text-slate-400 hover:text-sky-600 border border-slate-200 rounded-lg transition-colors"
          >
            <FiRefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="p-0"><p className="text-xs text-slate-500">Total Labs</p><p className="text-2xl font-semibold text-slate-900 mt-1">{labs.length}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Visible</p><p className="text-2xl font-semibold text-slate-900 mt-1">{filteredLabs.length}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">With Assistant</p><p className="text-2xl font-semibold text-slate-900 mt-1">{labs.filter(l => l.assignedAssistantId !== null).length}</p></Card>
      </div>

      {/* ── Loading ── */}
      {fetchLoading && (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <FiLoader size={24} className="animate-spin" />
          <span className="text-sm">Loading labs…</span>
        </div>
      )}

      {/* ── Error ── */}
      {!fetchLoading && fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FiAlertCircle size={24} className="mx-auto text-red-400 mb-2" />
          <p className="text-red-700 font-medium text-sm">Failed to load labs</p>
          <p className="text-red-500 text-xs mt-1">{fetchError}</p>
          <button onClick={loadLabs} className="mt-3 text-xs text-sky-600 hover:underline">Retry</button>
        </div>
      )}

      {/* ── Lab cards ── */}
      {!fetchLoading && !fetchError && (
        filteredLabs.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-slate-600">No labs found</p>
            {(role === 'labAssistant' || role === 'faculty') && (
              <p className="text-slate-500 text-sm mt-1">You have not been assigned to any labs yet. Contact your admin.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLabs.map(lab => (
              <div key={lab.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-sky-300 hover:bg-sky-50/20 transition-colors">
                <button onClick={() => setSelectedLab(lab)} className="text-left w-full mb-2">
                  <p className="text-lg font-semibold text-slate-900">{lab.labNo}</p>
                  <p className="text-sm font-medium text-slate-700">{lab.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Floor {lab.floor}</p>
                </button>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{lab.assignedAssistantName ?? 'No assistant'}</span>
                  <button onClick={() => setSelectedLab(lab)} className="text-sky-600 font-medium hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Lab Detail Modal ── */}
      <Modal
        isOpen={Boolean(selectedLab)}
        onClose={() => setSelectedLab(null)}
        title={selectedLab ? `Lab ${selectedLab.labNo} — ${selectedLab.name}` : 'Lab Details'}
        size="md"
      >
        {selectedLab && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Lab Number', value: selectedLab.labNo },
                { label: 'Floor',      value: selectedLab.floor  },
                { label: 'Assistant',  value: selectedLab.assignedAssistantName ?? 'None' },
                { label: 'Lab ID (DB)', value: selectedLab.id },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{String(item.value)}</p>
                </div>
              ))}
            </div>

            {/* PC Software Lookup — real API */}
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-sky-800 mb-2">
                <FiPackage size={12} className="inline mr-1" />
                View PC Software (by PC ID)
              </p>
              <div className="flex items-center gap-2">
                <input
                  id={`pc-input-${selectedLab.id}`}
                  type="number"
                  min={1}
                  placeholder="PC ID e.g. 1"
                  className="border border-sky-200 rounded-lg px-3 py-1.5 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                />
                <Button
                  label="View"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const input = document.getElementById(`pc-input-${selectedLab.id}`) as HTMLInputElement;
                    const val = parseInt(input.value, 10);
                    if (!isNaN(val) && val > 0) { setSelectedLab(null); setViewPcSoftware(val); }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LabsPage;
