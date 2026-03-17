import React, { useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { SearchBar } from '../../common/SearchBar';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useAuth } from '../../../context/AuthContext';
import { type DemoLab, type DemoPC, getAllLabs, buildDemoPCs } from '../../../utils/labData';
import { mockData } from '../../../mockData';
import { FiPlus, FiEdit2, FiPackage } from 'react-icons/fi';
import LabEditor from './LabEditor';
import SoftwareManager from './SoftwareManager';

type SoftwareEntry = { id: string; name: string; version: string; category: string };
const ALL_SOFTWARE: SoftwareEntry[] = mockData.software as SoftwareEntry[];

// ─── Main Page ───────────────────────────────────────────────────────────────
const LabsPage: React.FC = () => {
  const { role, user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedLab, setSelectedLab] = useState<DemoLab | null>(null);

  // PC editor (hardware specs)
  const [pcEditorOpen, setPcEditorOpen]   = useState(false);
  const [pcEditorMode, setPcEditorMode]   = useState<'add' | 'edit'>('add');
  const [editingPcId, setEditingPcId]     = useState<string | null>(null);
  const [pcForm, setPcForm]               = useState<Omit<DemoPC, 'id'>>({
    pcNo: '', os: 'Windows 11 Pro', processor: 'Intel Core i5-12400',
    ram: '16GB DDR4', storage: '512GB SSD', gpu: 'Intel UHD 730', status: 'active',
  });

  // Software manager for a PC
  const [softwarePc, setSoftwarePc]       = useState<DemoPC | null>(null);
  const [pcSoftwareMap, setPcSoftwareMap] = useState<Record<string, string[]>>({});

  // Lab editor
  const [labEditorOpen, setLabEditorOpen] = useState(false);
  const [labEditorMode, setLabEditorMode] = useState<'add' | 'edit'>('add');
  const [editingLab, setEditingLab]       = useState<DemoLab | null>(null);

  // Extra labs created at runtime
  const [extraLabs, setExtraLabs]   = useState<DemoLab[]>([]);
  const [labEdits, setLabEdits]     = useState<Record<string, Partial<DemoLab>>>({});

  const baseLabs = useMemo<DemoLab[]>(() => getAllLabs(), []);

  const allLabs = useMemo<DemoLab[]>(
    () => [...baseLabs, ...extraLabs].map(l => ({ ...l, ...(labEdits[l.labNo] ?? {}) })),
    [baseLabs, extraLabs, labEdits]
  );

  // Faculty AND labAssistant see only their assigned labs; admin sees all
  const accessibleLabs = useMemo<DemoLab[]>(() => {
    if (role === 'student') return [];
    if (role === 'faculty' || role === 'labAssistant') {
      const assigned = user.assignedLabs ?? [];
      return allLabs.filter(l => assigned.includes(l.labNo));
    }
    return allLabs; // admin
  }, [role, user.assignedLabs, allLabs]);

  const filteredLabs = useMemo<DemoLab[]>(() => {
    if (!query.trim()) return accessibleLabs;
    const q = query.toLowerCase();
    return accessibleLabs.filter(l =>
      l.labNo.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q)
    );
  }, [accessibleLabs, query]);

  const [labPCMap, setLabPCMap] = useState<Record<string, DemoPC[]>>(() => {
    const map: Record<string, DemoPC[]> = {};
    getAllLabs().forEach(lab => { map[lab.labNo] = buildDemoPCs(lab.labNo); });
    return map;
  });

  const selectedLabPCs = useMemo(
    () => (selectedLab ? labPCMap[selectedLab.labNo] ?? [] : []),
    [selectedLab, labPCMap]
  );

  const canAddLabs      = role === 'faculty' || role === 'admin';
  const canEditLabs     = role === 'faculty' || role === 'admin';
  const canAddPCs       = role === 'faculty' || role === 'admin';
  const canEditPCs      = role === 'faculty' || role === 'labAssistant' || role === 'admin';
  const canEditSoftware = role === 'faculty' || role === 'labAssistant' || role === 'admin';
  const canAccessLabs   = role !== 'student';

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

  // ── Lab editor handlers ──────────────────────────────────────────────────
  const openAddLab  = () => { setLabEditorMode('add');  setEditingLab(null); setLabEditorOpen(true); };
  const openEditLab = (lab: DemoLab) => { setLabEditorMode('edit'); setEditingLab(lab); setLabEditorOpen(true); };

  const handleSaveLab = (data: Omit<DemoLab, 'id'>) => {
    if (labEditorMode === 'add') {
      setExtraLabs(prev => [...prev, { id: `lab-${data.labNo}`, ...data }]);
      setLabPCMap(prev => ({ ...prev, [data.labNo]: buildDemoPCs(data.labNo) }));
    } else if (editingLab) {
      setLabEdits(prev => ({ ...prev, [editingLab.labNo]: data }));
    }
    setLabEditorOpen(false);
  };

  // ── PC editor handlers ───────────────────────────────────────────────────
  const openAddPc = () => {
    if (!selectedLab) return;
    const nextIdx = (labPCMap[selectedLab.labNo]?.length ?? 0) + 1;
    setPcEditorMode('add');
    setEditingPcId(null);
    setPcForm({
      pcNo: `${selectedLab.labNo}-PC-${String(nextIdx).padStart(2, '0')}`,
      os: 'Windows 11 Pro', processor: 'Intel Core i5-12400',
      ram: '16GB DDR4', storage: '512GB SSD', gpu: 'Intel UHD 730', status: 'active',
    });
    setPcEditorOpen(true);
  };

  const openEditPc = (pc: DemoPC) => {
    setPcEditorMode('edit');
    setEditingPcId(pc.id);
    setPcForm({ pcNo: pc.pcNo, os: pc.os, processor: pc.processor, ram: pc.ram, storage: pc.storage, gpu: pc.gpu, status: pc.status });
    setPcEditorOpen(true);
  };

  const savePcChanges = () => {
    if (!selectedLab) return;
    setLabPCMap(prev => {
      const current = prev[selectedLab.labNo] ?? [];
      if (pcEditorMode === 'add') {
        return { ...prev, [selectedLab.labNo]: [...current, { id: `${selectedLab.labNo}-pc-${Date.now()}`, ...pcForm }] };
      }
      return { ...prev, [selectedLab.labNo]: current.map(pc => pc.id === editingPcId ? { ...pc, ...pcForm } : pc) };
    });
    setPcEditorOpen(false);
  };

  // ── Software handlers ────────────────────────────────────────────────────
  const handleSaveSoftware = (ids: string[]) => {
    if (!softwarePc) return;
    setPcSoftwareMap(prev => ({ ...prev, [softwarePc.id]: ids }));
    setSoftwarePc(null);
  };

  const getPcInstalledIds = (pcId: string): string[] =>
    pcSoftwareMap[pcId] ?? ALL_SOFTWARE.map(s => s.id);

  return (
    <div className="space-y-5">
      {/* ── Lab Editor Modal ── */}
      {labEditorOpen && (
        <LabEditor
          mode={labEditorMode}
          initial={editingLab ?? {}}
          onSave={handleSaveLab}
          onClose={() => setLabEditorOpen(false)}
        />
      )}

      {/* ── Software Manager Modal ── */}
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
              ? `You have access to ${user.assignedLabs?.length ?? 0} lab(s)`
              : 'Click a lab to view and manage PCs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full md:w-[300px]">
            <SearchBar onSearch={setQuery} placeholder="Search labs..." />
          </div>
          {canAddLabs && (
            <Button label="Add Lab" icon={<FiPlus size={14} />} onClick={openAddLab} />
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-0"><p className="text-xs text-slate-500">Total Labs</p><p className="text-2xl font-semibold text-slate-900 mt-1">{allLabs.length}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Accessible</p><p className="text-2xl font-semibold text-slate-900 mt-1">{accessibleLabs.length}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Visible</p><p className="text-2xl font-semibold text-slate-900 mt-1">{filteredLabs.length}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Total PCs</p><p className="text-2xl font-semibold text-slate-900 mt-1">{filteredLabs.length * 15}</p></Card>
      </div>

      {/* ── Lab cards ── */}
      {filteredLabs.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">No labs available</p>
          {(role === 'labAssistant' || role === 'faculty') && (
            <p className="text-slate-500 text-sm mt-1">You have not been assigned to any labs yet. Contact your admin.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLabs.map(lab => (
            <div key={lab.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-sky-300 hover:bg-sky-50/20 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <button onClick={() => setSelectedLab(lab)} className="text-left flex-1">
                  <p className="text-lg font-semibold text-slate-900">{lab.labNo}</p>
                  <p className="text-sm font-medium text-slate-700">{lab.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{lab.description}</p>
                </button>
                {canEditLabs && (
                  <button
                    onClick={() => openEditLab(lab)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                    title="Edit lab"
                  >
                    <FiEdit2 size={14} />
                  </button>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Capacity: {lab.capacity}</span>
                <button onClick={() => setSelectedLab(lab)} className="text-sky-600 font-medium hover:underline">
                  View PCs →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lab Detail Modal (PCs list) ── */}
      <Modal
        isOpen={Boolean(selectedLab)}
        onClose={() => setSelectedLab(null)}
        title={selectedLab ? `${selectedLab.labNo} — ${selectedLab.name}` : 'Lab Details'}
        size="lg"
        footer={
          canAddPCs && selectedLab ? (
            <div className="w-full flex justify-end">
              <Button label="Add PC" icon={<FiPlus size={14} />} variant="primary" onClick={openAddPc} />
            </div>
          ) : undefined
        }
      >
        {selectedLab && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Lab ID',    value: selectedLab.labNo },
                { label: 'Capacity',  value: selectedLab.capacity },
                { label: 'Total PCs', value: selectedLabPCs.length },
                { label: 'Your Role', value: role === 'labAssistant' ? 'Lab Assistant' : role },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedLabPCs.map(pc => {
                const installedCount = getPcInstalledIds(pc.id).length;
                return (
                  <div key={pc.id} className="bg-white border border-slate-200 rounded-md p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-slate-900">{pc.pcNo}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                        pc.status === 'active'      ? 'bg-emerald-100 text-emerald-700' :
                        pc.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {pc.status}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-xs text-slate-600 mb-3">
                      <p><span className="text-slate-400">OS:</span>      <span className="font-medium text-slate-800">{pc.os}</span></p>
                      <p><span className="text-slate-400">CPU:</span>     <span className="font-medium text-slate-800">{pc.processor}</span></p>
                      <p><span className="text-slate-400">RAM:</span>     <span className="font-medium text-slate-800">{pc.ram}</span></p>
                      <p><span className="text-slate-400">Storage:</span> <span className="font-medium text-slate-800">{pc.storage}</span></p>
                      <p><span className="text-slate-400">GPU:</span>     <span className="font-medium text-slate-800">{pc.gpu}</span></p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {canEditPCs && (
                        <Button label="Edit Specs" variant="secondary" size="sm" icon={<FiEdit2 size={11} />} onClick={() => openEditPc(pc)} />
                      )}
                      {canEditSoftware && (
                        <Button
                          label={`Software (${installedCount})`}
                          variant="secondary"
                          size="sm"
                          icon={<FiPackage size={11} />}
                          onClick={() => setSoftwarePc(pc)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* ── PC Editor Modal ── */}
      <Modal
        isOpen={pcEditorOpen}
        onClose={() => setPcEditorOpen(false)}
        title={pcEditorMode === 'add' ? 'Add New PC' : 'Edit PC Specs'}
        size="md"
        footer={
          <div className="w-full flex justify-end gap-2">
            <Button label="Cancel" variant="secondary" onClick={() => setPcEditorOpen(false)} />
            <Button label={pcEditorMode === 'add' ? 'Add PC' : 'Save Changes'} variant="primary" onClick={savePcChanges} />
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(['pcNo', 'os', 'processor', 'ram', 'storage', 'gpu'] as const).map(field => {
            const meta: Record<string, { label: string; span: boolean }> = {
              pcNo:      { label: 'PC Number',        span: false },
              os:        { label: 'Operating System', span: true  },
              processor: { label: 'Processor',        span: true  },
              ram:       { label: 'RAM',              span: false },
              storage:   { label: 'Storage',          span: false },
              gpu:       { label: 'GPU',              span: true  },
            };
            const { label, span } = meta[field];
            return (
              <label key={field} className={`text-sm text-slate-600 ${span ? 'md:col-span-2' : ''}`}>
                {label}
                <input
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={pcForm[field]}
                  onChange={e => setPcForm(prev => ({ ...prev, [field]: e.target.value }))}
                />
              </label>
            );
          })}
          <label className="text-sm text-slate-600">
            Status
            <select
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={pcForm.status}
              onChange={e => setPcForm(prev => ({ ...prev, status: e.target.value as DemoPC['status'] }))}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default LabsPage;
