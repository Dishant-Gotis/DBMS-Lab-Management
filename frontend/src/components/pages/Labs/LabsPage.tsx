import React, { useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { SearchBar } from '../../common/SearchBar';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useAuth } from '../../../context/AuthContext';

type DemoLab = {
  id: string;
  labNo: string;
  name: string;
  capacity: number;
  description: string;
};

type DemoPC = {
  id: string;
  pcNo: string;
  os: string;
  processor: string;
  ram: string;
  storage: string;
  gpu: string;
  status: 'active' | 'inactive' | 'maintenance';
};

const buildLabIds = (): string[] => {
  const blocks = ['61', '62', '63', '64', '65'];
  const ids: string[] = [];

  blocks.forEach(block => {
    for (let i = 1; i <= 12; i += 1) {
      ids.push(`${block}${String(i).padStart(2, '0')}`);
    }
  });

  return ids;
};

const demoSpecSet = [
  { os: 'Windows 11 Pro', processor: 'Intel Core i7-12700', ram: '16GB DDR4', storage: '512GB NVMe SSD', gpu: 'Intel UHD 770' },
  { os: 'Ubuntu 22.04 LTS', processor: 'AMD Ryzen 7 5800X', ram: '32GB DDR4', storage: '1TB NVMe SSD', gpu: 'NVIDIA RTX 3060' },
  { os: 'Windows 10 Pro', processor: 'Intel Core i5-12400', ram: '16GB DDR4', storage: '512GB SSD', gpu: 'Intel UHD 730' },
];

const buildDemoPCs = (labNo: string): DemoPC[] => {
  const pcs: DemoPC[] = [];
  const statusPool: DemoPC['status'][] = ['active', 'active', 'active', 'maintenance', 'inactive'];

  for (let i = 1; i <= 15; i += 1) {
    const spec = demoSpecSet[(i - 1) % demoSpecSet.length];
    pcs.push({
      id: `${labNo}-pc-${i}`,
      pcNo: `${labNo}-PC-${String(i).padStart(2, '0')}`,
      os: spec.os,
      processor: spec.processor,
      ram: spec.ram,
      storage: spec.storage,
      gpu: spec.gpu,
      status: statusPool[(i - 1) % statusPool.length],
    });
  }

  return pcs;
};

const LabsPage: React.FC = () => {
  const { role, user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedLab, setSelectedLab] = useState<DemoLab | null>(null);
  const [pcEditorOpen, setPcEditorOpen] = useState(false);
  const [pcEditorMode, setPcEditorMode] = useState<'add' | 'edit'>('add');
  const [editingPcId, setEditingPcId] = useState<string | null>(null);
  const [pcForm, setPcForm] = useState<Omit<DemoPC, 'id'>>({
    pcNo: '',
    os: 'Windows 11 Pro',
    processor: 'Intel Core i5-12400',
    ram: '16GB DDR4',
    storage: '512GB SSD',
    gpu: 'Intel UHD 730',
    status: 'active',
  });

  const allLabs = useMemo<DemoLab[]>(() => {
    return buildLabIds().map((labNo, idx) => ({
      id: `lab-${labNo}`,
      labNo,
      name: `Computer Lab ${labNo}`,
      capacity: 30 + (idx % 4) * 5,
      description: `Specialized practical lab for batch ${labNo.slice(0, 2)} with modern systems.`,
    }));
  }, []);

  // STRICT ROLE-BASED ACCESS: Lab assistants only see their assigned labs
  const accessibleLabs = useMemo(() => {
    if (role === 'student') {
      return []; // Students cannot access labs
    }
    if (role === 'labAssistant') {
      // Lab assistants can only see their assigned labs
      const assignedLabNos = user.assignedLabs || [];
      return allLabs.filter(lab => assignedLabNos.includes(lab.labNo));
    }
    // Faculty and admin can see all labs
    return allLabs;
  }, [role, user.assignedLabs, allLabs]);

  const filteredLabs = useMemo(() => {
    if (!query.trim()) return accessibleLabs;

    const normalized = query.toLowerCase();
    return accessibleLabs.filter(
      lab =>
        lab.labNo.toLowerCase().includes(normalized) ||
        lab.name.toLowerCase().includes(normalized) ||
        lab.description.toLowerCase().includes(normalized)
    );
  }, [accessibleLabs, query]);

  const [labPCMap, setLabPCMap] = useState<Record<string, DemoPC[]>>(() => {
    const map: Record<string, DemoPC[]> = {};
    allLabs.forEach(lab => {
      map[lab.labNo] = buildDemoPCs(lab.labNo);
    });
    return map;
  });

  const selectedLabPCs = useMemo(() => {
    if (!selectedLab) return [];
    return labPCMap[selectedLab.labNo] || [];
  }, [selectedLab, labPCMap]);

  // Faculty and admin can add/edit PCs; lab assistants can only edit existing ones
  const canAddPCs = role === 'faculty' || role === 'admin';
  const canEditPCs = role === 'faculty' || role === 'labAssistant' || role === 'admin';
  const canAccessLabs = role === 'faculty' || role === 'labAssistant' || role === 'admin';

  // If student tries to access, show restricted message
  if (role === 'student' || !canAccessLabs) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold text-slate-900">Labs</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium">Access Restricted</p>
          <p className="text-amber-700 text-sm mt-1">Students do not have access to the Labs section. Please contact your administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  const openAddPc = () => {
    if (!selectedLab) return;
    const nextIndex = (labPCMap[selectedLab.labNo]?.length || 0) + 1;
    setPcEditorMode('add');
    setEditingPcId(null);
    setPcForm({
      pcNo: `${selectedLab.labNo}-PC-${String(nextIndex).padStart(2, '0')}`,
      os: 'Windows 11 Pro',
      processor: 'Intel Core i5-12400',
      ram: '16GB DDR4',
      storage: '512GB SSD',
      gpu: 'Intel UHD 730',
      status: 'active',
    });
    setPcEditorOpen(true);
  };

  const openEditPc = (pc: DemoPC) => {
    setPcEditorMode('edit');
    setEditingPcId(pc.id);
    setPcForm({
      pcNo: pc.pcNo,
      os: pc.os,
      processor: pc.processor,
      ram: pc.ram,
      storage: pc.storage,
      gpu: pc.gpu,
      status: pc.status,
    });
    setPcEditorOpen(true);
  };

  const savePcChanges = () => {
    if (!selectedLab) return;

    setLabPCMap(prev => {
      const current = prev[selectedLab.labNo] || [];

      if (pcEditorMode === 'add') {
        const newPc: DemoPC = {
          id: `${selectedLab.labNo}-pc-${Date.now()}`,
          ...pcForm,
        };

        return {
          ...prev,
          [selectedLab.labNo]: [...current, newPc],
        };
      }

      return {
        ...prev,
        [selectedLab.labNo]: current.map(pc =>
          pc.id === editingPcId
            ? {
                ...pc,
                ...pcForm,
              }
            : pc
        ),
      };
    });

    setPcEditorOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Labs</h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'labAssistant' 
              ? `You have access to ${user.assignedLabs?.length || 0} lab(s)`
              : 'Tap a lab card to open details and PCs'}
          </p>
        </div>
        <div className="w-full md:w-[360px]">
          <SearchBar onSearch={setQuery} placeholder="Search by lab id or name..." />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-0">
          <p className="text-xs text-slate-500">Total Labs</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{allLabs.length}</p>
        </Card>
        <Card className="p-0">
          <p className="text-xs text-slate-500">Accessible Labs</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{accessibleLabs.length}</p>
        </Card>
        <Card className="p-0">
          <p className="text-xs text-slate-500">Visible Labs</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{filteredLabs.length}</p>
        </Card>
        <Card className="p-0">
          <p className="text-xs text-slate-500">Total Demo PCs</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{filteredLabs.length * 15}</p>
        </Card>
      </div>

      {filteredLabs.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">No labs available</p>
          {role === 'labAssistant' && (
            <p className="text-slate-500 text-sm mt-1">You have not been assigned to any labs yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLabs.map(lab => (
            <button
              key={lab.id}
              onClick={() => setSelectedLab(lab)}
              className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-sky-300 hover:bg-sky-50/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900">{lab.labNo}</p>
                <span className="text-xs text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full font-semibold">Open</span>
              </div>
              <p className="text-sm font-medium text-slate-700 mt-2">{lab.name}</p>
              <p className="text-xs text-slate-500 mt-1">{lab.description}</p>
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Capacity: {lab.capacity}</span>
                <span>15 PCs</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedLab)}
        onClose={() => setSelectedLab(null)}
        title={selectedLab ? `${selectedLab.labNo} - ${selectedLab.name}` : 'Lab Details'}
        size="lg"
        footer={
          canAddPCs && selectedLab ? (
            <div className="w-full flex justify-end">
              <Button label="Add PC" variant="primary" onClick={openAddPc} />
            </div>
          ) : undefined
        }
      >
        {selectedLab && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <p className="text-xs text-slate-500">Lab ID</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{selectedLab.labNo}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <p className="text-xs text-slate-500">Capacity</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{selectedLab.capacity}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <p className="text-xs text-slate-500">Total PCs</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{selectedLabPCs.length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                <p className="text-xs text-slate-500">Your Role</p>
                <p className="text-sm font-semibold text-slate-800 mt-1 capitalize">{role === 'labAssistant' ? 'Lab Assistant' : role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedLabPCs.map(pc => (
                <div key={pc.id} className="bg-white border border-slate-200 rounded-md p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-900">{pc.pcNo}</p>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                        pc.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : pc.status === 'maintenance'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pc.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p><span className="text-slate-500">OS:</span> <span className="font-medium text-slate-800">{pc.os}</span></p>
                    <p><span className="text-slate-500">CPU:</span> <span className="font-medium text-slate-800">{pc.processor}</span></p>
                    <p><span className="text-slate-500">RAM:</span> <span className="font-medium text-slate-800">{pc.ram}</span></p>
                    <p><span className="text-slate-500">Storage:</span> <span className="font-medium text-slate-800">{pc.storage}</span></p>
                    <p><span className="text-slate-500">GPU:</span> <span className="font-medium text-slate-800">{pc.gpu}</span></p>
                  </div>
                  {canEditPCs && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                      <Button label="Edit Specs" variant="secondary" size="sm" onClick={() => openEditPc(pc)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

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
          <label className="text-sm text-slate-600">
            PC Number
            <input
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              value={pcForm.pcNo}
              onChange={e => setPcForm(prev => ({ ...prev, pcNo: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-600">
            Status
            <select
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              value={pcForm.status}
              onChange={e => setPcForm(prev => ({ ...prev, status: e.target.value as DemoPC['status'] }))}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="text-sm text-slate-600 md:col-span-2">
            Operating System
            <input
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              value={pcForm.os}
              onChange={e => setPcForm(prev => ({ ...prev, os: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-600 md:col-span-2">
            Processor
            <input
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              value={pcForm.processor}
              onChange={e => setPcForm(prev => ({ ...prev, processor: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-600">
            RAM
            <input
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              value={pcForm.ram}
              onChange={e => setPcForm(prev => ({ ...prev, ram: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-600">
            Storage
            <input
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              value={pcForm.storage}
              onChange={e => setPcForm(prev => ({ ...prev, storage: e.target.value }))}
            />
          </label>
          <label className="text-sm text-slate-600 md:col-span-2">
            GPU
            <input
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              value={pcForm.gpu}
              onChange={e => setPcForm(prev => ({ ...prev, gpu: e.target.value }))}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default LabsPage;
