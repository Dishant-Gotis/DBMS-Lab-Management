import React, { useEffect, useState } from 'react';
import { FiMonitor, FiPlus, FiGrid, FiArrowLeft, FiHardDrive, FiCpu, FiArchive, FiSettings, FiTrash2, FiX } from 'react-icons/fi';
import { fetchLabs, createLab, fetchAdminLabPcs, createAdminLabPc, installAdminPcSoftware, deleteAdminLab, deleteAdminLabPc, deleteAdminPcSoftware, type ApiLab, type ApiAdminPc } from '../../../services/api';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Modal } from '../../common/Modal';

// ── Models & Modals ─────────────────────────────────────────────────────────

const AddPcModal: React.FC<{ onSave: (p: any) => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ password: 'password', osId: '1', pcNo: '', status: 'active', processor: '', ram: '', storage: '' });
  const [sub, setSub] = useState(false);
  const valid = form.pcNo.trim() !== '';

  return (
    <Modal isOpen onClose={onClose} title="Add New PC" size="sm" footer={
      <div className="flex justify-end gap-2 w-full">
        <Button label="Cancel" variant="secondary" onClick={onClose} disabled={sub} />
        <Button label={sub ? "Saving..." : "Create PC"} disabled={!valid || sub} onClick={() => { setSub(true); onSave(form); }} />
      </div>
    }>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-slate-600">
            <span className="font-medium">PC Number *</span>
            <input type="text" placeholder="e.g. PC-01" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.pcNo} onChange={e => setForm(f => ({ ...f, pcNo: e.target.value }))} />
          </label>
          <label className="block text-sm text-slate-600">
            <span className="font-medium">Status</span>
            <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-slate-600">
            <span className="font-medium">OS Type</span>
            <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.osId} onChange={e => setForm(f => ({ ...f, osId: e.target.value }))}>
              <option value="1">Windows 11</option>
              <option value="2">Ubuntu 24</option>
              <option value="3">Debian 12</option>
            </select>
          </label>
          <label className="block text-sm text-slate-600">
            <span className="font-medium">Processor</span>
            <input type="text" placeholder="e.g. Intel i7" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.processor} onChange={e => setForm(f => ({ ...f, processor: e.target.value }))} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-slate-600">
            <span className="font-medium">RAM</span>
            <input type="text" placeholder="e.g. 16GB" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.ram} onChange={e => setForm(f => ({ ...f, ram: e.target.value }))} />
          </label>
          <label className="block text-sm text-slate-600">
            <span className="font-medium">Storage</span>
            <input type="text" placeholder="e.g. 512GB SSD" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.storage} onChange={e => setForm(f => ({ ...f, storage: e.target.value }))} />
          </label>
        </div>
      </div>
    </Modal>
  );
};

const AddSoftwareModal: React.FC<{ onSave: (p: any) => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ name: '', version: '' });
  const [sub, setSub] = useState(false);
  const valid = form.name.trim() !== '';

  return (
    <Modal isOpen onClose={onClose} title="Install Software" size="sm" footer={
      <div className="flex justify-end gap-2 w-full">
        <Button label="Cancel" variant="secondary" onClick={onClose} disabled={sub} />
        <Button label={sub ? "Installing..." : "Install"} disabled={!valid || sub} onClick={() => { setSub(true); onSave(form); }} />
      </div>
    }>
      <div className="space-y-3">
        <label className="block text-sm text-slate-600">
          <span className="font-medium">Software Name *</span>
          <input type="text" placeholder="e.g. VS Code" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </label>
        <label className="block text-sm text-slate-600">
          <span className="font-medium">Version</span>
          <input type="text" placeholder="e.g. 1.85.0" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
        </label>
      </div>
    </Modal>
  );
};

const AddLabModal: React.FC<{ onSave: (p: { floor: number; name?: string }) => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ name: '', floor: '' });
  const [sub, setSub] = useState(false);
  const floorNum = parseInt(form.floor, 10);
  const valid = form.floor.trim() !== '' && !isNaN(floorNum);

  return (
    <Modal isOpen onClose={onClose} title="Add New Lab" size="sm" footer={
      <div className="flex justify-end gap-2 w-full">
        <Button label="Cancel" variant="secondary" onClick={onClose} disabled={sub} />
        <Button label={sub ? "Creating..." : "Create Lab"} disabled={!valid || sub} onClick={() => {
          setSub(true);
          onSave({ floor: floorNum, name: form.name.trim() || undefined });
        }} />
      </div>
    }>
      <div className="space-y-3">
        <label className="block text-sm text-slate-600">
          <span className="font-medium">Floor Level *</span>
          <input type="number" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="e.g. 1" />
        </label>
        <label className="block text-sm text-slate-600">
          <span className="font-medium">Custom Name (Optional)</span>
          <input type="text" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Advanced Networking Lab" />
        </label>
        <p className="text-xs text-slate-400">The Database will auto-generate the numeric Lab ID.</p>
      </div>
    </Modal>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

const AdminLabsPage: React.FC = () => {
  const [labs, setLabs] = useState<ApiLab[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Single Lab View
  const [selectedLab, setSelectedLab] = useState<ApiLab | null>(null);
  const [pcs, setPcs] = useState<ApiAdminPc[]>([]);
  const [pcsLoading, setPcsLoading] = useState(false);
  
  // Modals
  const [showAddPc, setShowAddPc] = useState(false);
  const [showAddLab, setShowAddLab] = useState(false);
  const [installSoftwareFor, setInstallSoftwareFor] = useState<number | null>(null);

  const loadAllLabs = () => {
    setLoading(true);
    fetchLabs().then(setLabs).catch(console.error).finally(() => setLoading(false));
  };

  const loadLabPcs = (labId: number) => {
    setPcsLoading(true);
    fetchAdminLabPcs(labId).then(setPcs).catch(console.error).finally(() => setPcsLoading(false));
  };

  useEffect(() => { loadAllLabs(); }, []);
  
  useEffect(() => {
    if (selectedLab) loadLabPcs(selectedLab.id);
  }, [selectedLab]);

  const handleCreatePc = async (f: any) => {
    if (!selectedLab) return;
    try {
      await createAdminLabPc(selectedLab.id, f.password, parseInt(f.osId, 10), f.pcNo, f.status, f.processor, f.ram, f.storage);
      setShowAddPc(false);
      loadLabPcs(selectedLab.id);
    } catch {
      alert("Failed to add PC");
      setShowAddPc(false);
    }
  };

  const handleInstallSoftware = async (f: any) => {
    if (!installSoftwareFor || !selectedLab) return;
    try {
      await installAdminPcSoftware(installSoftwareFor, f.name, f.version);
      setInstallSoftwareFor(null);
      loadLabPcs(selectedLab.id);
    } catch {
      alert("Failed to install software");
      setInstallSoftwareFor(null);
    }
  };

  const handleDeleteLab = async (labId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This will delete the Lab, ALL PCs, and ALL software permanently.")) return;
    try {
      await deleteAdminLab(labId);
      loadAllLabs();
      if (selectedLab?.id === labId) setSelectedLab(null);
    } catch {
      alert("Failed to delete lab.");
    }
  };

  const handleDeletePc = async (pcId: number) => {
    if (!selectedLab) return;
    if (!window.confirm("Delete this PC and all installed software?")) return;
    try {
      await deleteAdminLabPc(selectedLab.id, pcId);
      loadLabPcs(selectedLab.id);
    } catch {
      alert("Failed to delete PC");
    }
  };

  const handleDeleteSoftware = async (swId: number) => {
    if (!selectedLab) return;
    if (!window.confirm("Remove this software?")) return;
    try {
      await deleteAdminPcSoftware(swId);
      loadLabPcs(selectedLab.id);
    } catch {
      alert("Failed to delete software");
    }
  };

  const handleCreateLab = async (d: { floor: number; name?: string }) => {
    try {
      await createLab(d.floor, d.name);
      setShowAddLab(false);
      loadAllLabs();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create lab: ${err.message}`);
      setShowAddLab(false);
    }
  };

  if (selectedLab) {
    return (
      <div className="space-y-5">
        {showAddPc && <AddPcModal onSave={handleCreatePc} onClose={() => setShowAddPc(false)} />}
        {installSoftwareFor !== null && <AddSoftwareModal onSave={handleInstallSoftware} onClose={() => setInstallSoftwareFor(null)} />}

        <button onClick={() => setSelectedLab(null)} className="flex items-center text-sm font-medium hover:text-sky-600 transition-colors text-slate-500">
          <FiArrowLeft className="mr-1" /> Back to Labs
        </button>
        
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center bg-white p-5 rounded-xl border border-slate-200">
           <div>
             <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               Lab {selectedLab.labNo}
               {selectedLab.name && <span className="text-sm font-normal text-slate-500 ml-2">({selectedLab.name})</span>}
             </h1>
             <p className="text-sm text-slate-500 mt-1">Floor {selectedLab.floor} &bull; Assistant: <span className="font-medium text-slate-700">{selectedLab.assignedAssistantName || 'Unassigned'}</span></p>
           </div>
           <div className="mt-4 md:mt-0">
             <Button label="Add PC" icon={<FiPlus />} onClick={() => setShowAddPc(true)} />
           </div>
        </div>
        
        {pcsLoading ? (
            <div className="py-12 text-center text-slate-400">Fetching PCs from Database...</div>
        ) : pcs.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 p-12 rounded-xl text-center text-slate-400">
                <FiMonitor size={32} className="mx-auto mb-3 opacity-30" />
                <p>No PCs configured for this lab.</p>
                <p className="text-sm mt-1 text-slate-400">Click "Add PC" above to provision hardware.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pcs.map(pc => (
                    <Card key={pc.id} className="p-0 overflow-hidden flex flex-col h-full hover:border-sky-200 hover:shadow-sm transition-all">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded shadow-sm text-slate-50 border border-slate-200 ${pc.status === 'active' ? 'bg-emerald-500' : pc.status === 'maintenance' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                                    <FiMonitor size={16} />
                                </div>
                                <span className="font-bold text-slate-700">{pc.pcNo || `PC #${pc.id}`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                    {pc.status || 'Active'}
                                </span>
                                <button onClick={() => handleDeletePc(pc.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete PC">
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Hardware Specs */}
                        <div className="p-4 text-sm text-slate-600 space-y-2 border-b border-slate-100 flex-1">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Specs</span>
                                <span className="text-[10px] font-semibold text-slate-400">{pc.osName} {pc.osVersion}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2"><FiCpu className="text-slate-400"/> {pc.processor || '-'}</div>
                                <div className="flex items-center gap-2"><FiArchive className="text-slate-400"/> {pc.ram || '-'}</div>
                                <div className="flex items-center gap-2 col-span-2"><FiHardDrive className="text-slate-400"/> {pc.storage || '-'}</div>
                            </div>
                        </div>

                        {/* Software */}
                        <div className="p-4 bg-white flex-1 min-h-[100px]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Software</span>
                                <button onClick={() => setInstallSoftwareFor(pc.id)} className="text-sky-600 hover:text-sky-800 transition-colors bg-sky-50 px-2 py-0.5 rounded text-xs font-semibold">
                                    + Add
                                </button>
                            </div>
                            {pc.softwares.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No software installed.</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {pc.softwares.map(sw => (
                                        <span key={sw.id} className="flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 pl-2 pr-1 py-1 rounded border border-slate-200">
                                            {sw.name} {sw.version && <span className="text-slate-400">{sw.version}</span>}
                                            <button onClick={() => handleDeleteSoftware(sw.id)} className="text-slate-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 rounded-sm p-0.5 ml-1">
                                                <FiX size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showAddLab && <AddLabModal onSave={handleCreateLab} onClose={() => setShowAddLab(false)} />}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Lab Hardware Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure physical lab rooms, provision PCs, and specify installed hardware specs and software.</p>
        </div>
        <Button label="New Lab" icon={<FiPlus />} onClick={() => setShowAddLab(true)} />
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400">Loading labs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {labs.map(lab => (
            <Card key={lab.id} className="cursor-pointer hover:border-sky-300 hover:shadow-md transition-all group" onClick={() => setSelectedLab(lab)}>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-sky-50 transition-colors text-slate-600 group-hover:text-sky-600">
                  <FiGrid size={20} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                    Floor {lab.floor}
                  </span>
                  <button onClick={(e) => handleDeleteLab(lab.id, e)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Delete Lab">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">Lab {lab.labNo}</h3>
              <p className="text-sm text-slate-500 truncate mb-5">{lab.name || 'Standard Lab'}</p>
              
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
                <span>{lab.assignedAssistantName || 'Unassigned'}</span>
                <span className="text-sky-600 font-medium group-hover:underline flex items-center gap-1">Manage PCs <FiSettings size={12}/></span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLabsPage;
