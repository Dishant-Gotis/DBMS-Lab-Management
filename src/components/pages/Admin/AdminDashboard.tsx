import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { SearchBar } from '../../common/SearchBar';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { FiPlus, FiTrash2, FiEdit2, FiUsers, FiBox } from 'react-icons/fi';

interface LabRecord {
  labNo: string;
  name: string;
  capacity: number;
  assignedAssistantId?: string;
  assignedAssistantName?: string;
}

interface AssistantRecord {
  id: string;
  name: string;
  email: string;
  assignedLabs: string[];
  createdDate: string;
}

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<'labs' | 'assistants'>('labs');
  const [query, setQuery] = useState('');
  const [allLabs, setAllLabs] = useState<LabRecord[]>([
    { labNo: '6101', name: 'Computer Lab 6101', capacity: 30, assignedAssistantId: 'asst-001', assignedAssistantName: 'Raj Patel' },
    { labNo: '6102', name: 'Computer Lab 6102', capacity: 30, assignedAssistantId: 'asst-001', assignedAssistantName: 'Raj Patel' },
    { labNo: '6103', name: 'Computer Lab 6103', capacity: 30, assignedAssistantId: 'asst-001', assignedAssistantName: 'Raj Patel' },
    { labNo: '6104', name: 'Computer Lab 6104', capacity: 30, assignedAssistantId: 'asst-002', assignedAssistantName: 'Priya Sharma' },
    { labNo: '6105', name: 'Computer Lab 6105', capacity: 30, assignedAssistantId: 'asst-002', assignedAssistantName: 'Priya Sharma' },
    { labNo: '6106', name: 'Computer Lab 6106', capacity: 30, assignedAssistantId: 'asst-003', assignedAssistantName: 'Vikram Singh' },
    { labNo: '6107', name: 'Computer Lab 6107', capacity: 30, assignedAssistantId: 'asst-003', assignedAssistantName: 'Vikram Singh' },
    { labNo: '6108', name: 'Computer Lab 6108', capacity: 30, assignedAssistantId: 'asst-003', assignedAssistantName: 'Vikram Singh' },
  ]);

  const [allAssistants, setAllAssistants] = useState<AssistantRecord[]>([
    { id: 'asst-001', name: 'Raj Patel', email: 'rajpatel@pccoepune.org', assignedLabs: ['6101', '6102', '6103'], createdDate: '2024-01-15' },
    { id: 'asst-002', name: 'Priya Sharma', email: 'priyasharma@pccoepune.org', assignedLabs: ['6104', '6105'], createdDate: '2024-01-20' },
    { id: 'asst-003', name: 'Vikram Singh', email: 'vikramsingh@pccoepune.org', assignedLabs: ['6106', '6107', '6108'], createdDate: '2024-01-25' },
  ]);

  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [showAddAssistantModal, setShowAddAssistantModal] = useState(false);
  const [showAssignLabModal, setShowAssignLabModal] = useState(false);
  const [selectedLab, setSelectedLab] = useState<LabRecord | null>(null);
  const [newLabForm, setNewLabForm] = useState({ labNo: '', name: '', capacity: 30 });
  const [newAssistantForm, setNewAssistantForm] = useState({ name: '', email: '' });
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');

  const filteredLabs = useMemo(() => {
    if (!query.trim()) return allLabs;
    const normalized = query.toLowerCase();
    return allLabs.filter(lab => lab.labNo.includes(normalized) || lab.name.toLowerCase().includes(normalized));
  }, [query, allLabs]);

  const filteredAssistants = useMemo(() => {
    if (!query.trim()) return allAssistants;
    const normalized = query.toLowerCase();
    return allAssistants.filter(asst => asst.name.toLowerCase().includes(normalized) || asst.email.includes(normalized));
  }, [query, allAssistants]);

  const handleAddLab = () => {
    if (newLabForm.labNo && newLabForm.name) {
      setAllLabs([...allLabs, { ...newLabForm, capacity: Number(newLabForm.capacity) }]);
      setNewLabForm({ labNo: '', name: '', capacity: 30 });
      setShowAddLabModal(false);
    }
  };

  const handleAddAssistant = () => {
    if (newAssistantForm.name && newAssistantForm.email) {
      const newAssistant: AssistantRecord = {
        id: `asst-${Date.now()}`,
        name: newAssistantForm.name,
        email: newAssistantForm.email,
        assignedLabs: [],
        createdDate: new Date().toISOString().split('T')[0],
      };
      setAllAssistants([...allAssistants, newAssistant]);
      setNewAssistantForm({ name: '', email: '' });
      setShowAddAssistantModal(false);
    }
  };

  const handleAssignLab = () => {
    if (selectedLab && selectedAssistantId) {
      const assistant = allAssistants.find(a => a.id === selectedAssistantId);
      if (assistant) {
        setAllAssistants(allAssistants.map(a =>
          a.id === selectedAssistantId
            ? { ...a, assignedLabs: a.assignedLabs.includes(selectedLab.labNo) ? a.assignedLabs : [...a.assignedLabs, selectedLab.labNo] }
            : a
        ));
        setAllLabs(allLabs.map(l =>
          l.labNo === selectedLab.labNo
            ? { ...l, assignedAssistantId: selectedAssistantId, assignedAssistantName: assistant.name }
            : l
        ));
        setShowAssignLabModal(false);
        setSelectedLab(null);
        setSelectedAssistantId('');
      }
    }
  };

  const handleUnassignLab = (labNo: string) => {
    const lab = allLabs.find(l => l.labNo === labNo);
    if (lab && lab.assignedAssistantId) {
      setAllAssistants(allAssistants.map(a =>
        a.id === lab.assignedAssistantId
          ? { ...a, assignedLabs: a.assignedLabs.filter(l => l !== labNo) }
          : a
      ));
      setAllLabs(allLabs.map(l =>
        l.labNo === labNo
          ? { ...l, assignedAssistantId: undefined, assignedAssistantName: undefined }
          : l
      ));
    }
  };

  const handleDeleteAssistant = (assistantId: string) => {
    setAllLabs(allLabs.map(l =>
      l.assignedAssistantId === assistantId
        ? { ...l, assignedAssistantId: undefined, assignedAssistantName: undefined }
        : l
    ));
    setAllAssistants(allAssistants.filter(a => a.id !== assistantId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage labs and lab assistants</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('labs')}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            tab === 'labs' ? 'text-sky-600 border-sky-600' : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          <FiBox className="inline mr-2" size={16} />
          Labs ({filteredLabs.length})
        </button>
        <button
          onClick={() => setTab('assistants')}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            tab === 'assistants' ? 'text-sky-600 border-sky-600' : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          <FiUsers className="inline mr-2" size={16} />
          Lab Assistants ({filteredAssistants.length})
        </button>
      </div>

      {tab === 'labs' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <SearchBar onSearch={setQuery} placeholder="Search labs..." />
            <Button label="Add Lab" icon={<FiPlus size={16} />} onClick={() => setShowAddLabModal(true)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Labs</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{allLabs.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned</p>
              <p className="text-3xl font-bold text-sky-600 mt-2">{allLabs.filter(l => l.assignedAssistantId).length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unassigned</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{allLabs.filter(l => !l.assignedAssistantId).length}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLabs.map(lab => (
              <Card key={lab.labNo} className="p-4 hover:border-sky-300 hover:bg-sky-50/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{lab.labNo}</p>
                    <p className="text-xs text-slate-500">{lab.name}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    lab.assignedAssistantId ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {lab.assignedAssistantId ? 'Assigned' : 'Unassigned'}
                  </span>
                </div>
                <div className="bg-slate-50 rounded p-2 mb-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-700">Capacity: {lab.capacity} PCs</p>
                  {lab.assignedAssistantName && (
                    <p className="text-slate-500 mt-1">Assistant: {lab.assignedAssistantName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    label={lab.assignedAssistantId ? 'Change' : 'Assign'}
                    icon={<FiEdit2 size={12} />}
                    onClick={() => { setSelectedLab(lab); setShowAssignLabModal(true); }}
                    variant="secondary"
                    size="sm"
                  />
                  {lab.assignedAssistantId && (
                    <Button
                      label="Unassign"
                      icon={<FiTrash2 size={12} />}
                      onClick={() => handleUnassignLab(lab.labNo)}
                      variant="danger"
                      size="sm"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'assistants' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <SearchBar onSearch={setQuery} placeholder="Search assistants..." />
            <Button label="Add Assistant" icon={<FiPlus size={16} />} onClick={() => setShowAddAssistantModal(true)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Assistants</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{allAssistants.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Labs Managed</p>
              <p className="text-3xl font-bold text-sky-600 mt-2">{allAssistants.reduce((sum, a) => sum + a.assignedLabs.length, 0)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredAssistants.map(assistant => (
              <Card key={assistant.id} className="p-4 hover:border-sky-300 hover:bg-sky-50/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{assistant.name}</p>
                    <p className="text-xs text-slate-500">{assistant.email}</p>
                  </div>
                  <span className="text-xs text-slate-400">Added: {assistant.createdDate}</span>
                </div>
                <div className="bg-slate-50 rounded p-2 mb-3">
                  <p className="text-xs font-medium text-slate-700">Assigned Labs:</p>
                  {assistant.assignedLabs.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assistant.assignedLabs.map(labNo => (
                        <span key={labNo} className="bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded">{labNo}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No labs assigned</p>
                  )}
                </div>
                <Button
                  label="Remove"
                  icon={<FiTrash2 size={12} />}
                  onClick={() => handleDeleteAssistant(assistant.id)}
                  variant="danger"
                  size="sm"
                />
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={showAddLabModal}
        onClose={() => setShowAddLabModal(false)}
        title="Add New Lab"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button label="Cancel" variant="secondary" onClick={() => setShowAddLabModal(false)} />
            <Button label="Add Lab" onClick={handleAddLab} />
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Lab Number</label>
            <input type="text" placeholder="e.g., 6109" value={newLabForm.labNo}
              onChange={(e) => setNewLabForm({ ...newLabForm, labNo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Lab Name</label>
            <input type="text" placeholder="e.g., Computer Lab 6109" value={newLabForm.name}
              onChange={(e) => setNewLabForm({ ...newLabForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Capacity (PCs)</label>
            <input type="number" value={newLabForm.capacity}
              onChange={(e) => setNewLabForm({ ...newLabForm, capacity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddAssistantModal}
        onClose={() => setShowAddAssistantModal(false)}
        title="Add Lab Assistant"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button label="Cancel" variant="secondary" onClick={() => setShowAddAssistantModal(false)} />
            <Button label="Add Assistant" onClick={handleAddAssistant} />
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Name</label>
            <input type="text" placeholder="e.g., John Doe" value={newAssistantForm.name}
              onChange={(e) => setNewAssistantForm({ ...newAssistantForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
            <input type="email" placeholder="name@pccoepune.org" value={newAssistantForm.email}
              onChange={(e) => setNewAssistantForm({ ...newAssistantForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignLabModal}
        onClose={() => setShowAssignLabModal(false)}
        title={`Assign Lab ${selectedLab?.labNo ?? ''}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button label="Cancel" variant="secondary" onClick={() => setShowAssignLabModal(false)} />
            <Button label="Assign Lab" onClick={handleAssignLab} disabled={!selectedAssistantId} />
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Select a lab assistant to assign this lab to:</p>
          <div className="space-y-2">
            {allAssistants.map(assistant => (
              <button
                key={assistant.id}
                onClick={() => setSelectedAssistantId(assistant.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  selectedAssistantId === assistant.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-slate-900">{assistant.name}</p>
                <p className="text-xs text-slate-500">{assistant.email}</p>
                <p className="text-xs text-slate-400 mt-1">{assistant.assignedLabs.length} labs assigned</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
