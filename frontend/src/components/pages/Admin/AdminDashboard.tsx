import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { SearchBar } from '../../common/SearchBar';
import { FiPlus, FiTrash2, FiBox, FiTool, FiUsers, FiCheck, FiLoader } from 'react-icons/fi';
import {
  fetchLabs, createLab,
  fetchAdminAssistants, createAdminAssistant, deleteAdminAssistant, assignAdminAssistantLab,
  fetchAdminFaculty, createAdminFaculty, deleteAdminFaculty,
  type ApiLab, type ApiAssistant, type ApiFaculty,
} from '../../../services/api';

// ── Lab assign multi-select modal (uses real labs from API) ──────────────────

interface AssignLabsModalProps {
  assistant: ApiAssistant;
  onSave: (labId: number | null) => void;
  onClose: () => void;
}

const AssignLabsModal: React.FC<AssignLabsModalProps> = ({ assistant, onSave, onClose }) => {
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  // Real labs from API
  const [labs, setLabs] = useState<ApiLab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabs()
      .then(setLabs)
      .catch(() => setLabs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return labs.filter(
      l => l.labNo.toLowerCase().includes(q) || l.name.toLowerCase().includes(q),
    );
  }, [query, labs]);

  const toggle = (labId: number) => {
    setSelectedLabId(prev => (prev === labId ? null : labId));
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Assign Lab — ${assistant.name}`}
      size="md"
      footer={
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-slate-500">{selectedLabId ? '1' : '0'} lab selected</span>
          <div className="flex gap-2">
            <Button label="Cancel" variant="secondary" onClick={onClose} />
            <Button label="Save Assignment" disabled={!selectedLabId} onClick={() => onSave(selectedLabId)} />
          </div>
        </div>
      }
    >
      <div className="mb-3">
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="Search labs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
          <FiLoader size={18} className="animate-spin" />
          <span className="text-xs">Loading labs from database…</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No labs found.</p>
          )}
          {filtered.map(lab => {
            const checked = selectedLabId === lab.id;
            return (
              <label
                key={lab.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  checked ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="labSelect"
                  className="accent-sky-500"
                  checked={checked}
                  onChange={() => toggle(lab.id)}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-800">Lab {lab.labNo}</span>
                  <span className="ml-2 text-xs text-slate-400">{lab.name}</span>
                  {lab.assignedAssistantName && lab.assignedAssistantName !== assistant.name && (
                    <span className="ml-2 text-xs text-orange-400">(Currently assigned to {lab.assignedAssistantName})</span>
                  )}
                </div>
                {checked && <FiCheck size={13} className="text-sky-500 shrink-0" />}
              </label>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

// ── Add User modal ────────────────────────────────────────────────────────────

interface AddUserModalProps {
  onSave: (data: { name: string; email: string; password: string; phone: string }) => void;
  onClose: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const valid = form.name.trim() && form.email.trim() && form.password.trim();
  const label = 'Lab Assistant';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Add ${label}`}
      size="sm"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button label="Cancel" variant="secondary" onClick={onClose} disabled={submitting} />
          <Button label={submitting ? "Saving..." : "Create Account"} disabled={!valid || submitting} onClick={() => {
            setSubmitting(true);
            onSave(form);
          }} />
        </div>
      }
    >
      <div className="space-y-3">
        {(['name', 'email', 'phone', 'password'] as const).map(field => (
          <label key={field} className="block text-sm text-slate-600">
            <span className="capitalize font-medium">{field} {field !== 'phone' ? '*' : ''}</span>
            <input
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              placeholder={field === 'email' ? 'user@pccoepune.org' : field === 'password' ? 'min 6 chars' : field === 'phone' ? 'Phone number' : `${label} name`}
            />
          </label>
        ))}
        <p className="text-xs text-slate-400">The user will log in with these credentials.</p>
      </div>
    </Modal>
  );
};

// ── Add Lab modal ────────────────────────────────────────────────────────────

interface AddLabModalProps {
  onSave: (data: { floor: number; name?: string }) => void;
  onClose: () => void;
}

const AddLabModal: React.FC<AddLabModalProps> = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ name: '', floor: '' });
  const [submitting, setSubmitting] = useState(false);
  const floorNum = parseInt(form.floor, 10);
  const valid = form.floor.trim() !== '' && !isNaN(floorNum);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add New Lab"
      size="sm"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button label="Cancel" variant="secondary" onClick={onClose} disabled={submitting} />
          <Button label={submitting ? "Creating..." : "Create Lab"} disabled={!valid || submitting} onClick={() => {
            setSubmitting(true);
            onSave({
              floor: floorNum,
              name: form.name.trim() || undefined,
            });
          }} />
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm text-slate-600">
          <span className="capitalize font-medium">Floor Level *</span>
          <input
            type="number"
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.floor}
            onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
            placeholder="e.g. 1"
          />
        </label>
        <label className="block text-sm text-slate-600">
          <span className="capitalize font-medium">Custom Name (Optional)</span>
          <input
            type="text"
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Advanced Networking Lab"
          />
        </label>
        <p className="text-xs text-slate-400">The Database will auto-generate the numeric Lab ID.</p>
      </div>
    </Modal>
  );
};

// ── Main Admin Dashboard ─────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const [tab, setTab]             = useState<'faculty' | 'assistant'>('faculty');
  const [assistants, setAssistants] = useState<ApiAssistant[]>([]);
  const [faculty, setFaculty]     = useState<ApiFaculty[]>([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignUser, setAssignUser]     = useState<ApiAssistant | null>(null);
  const [showAddLab, setShowAddLab]     = useState(false);
  const [totalLabs, setTotalLabs]       = useState<number | null>(null);

  const loadLabs = useCallback(() => {
    fetchLabs().then(l => setTotalLabs(l.length)).catch(() => setTotalLabs(null));
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true);
    Promise.all([fetchAdminAssistants(), fetchAdminFaculty()])
      .then(([a, f]) => { setAssistants(a); setFaculty(f); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadLabs(); loadUsers(); }, [loadLabs, loadUsers]);

  const handleCreateLab = async (data: { floor: number; name?: string }) => {
    try {
      await createLab(data.floor, data.name);
      loadLabs();
      setShowAddLab(false);
    } catch {
      alert('Failed to create lab.');
    }
  };

  const currentList = tab === 'faculty'
    ? faculty.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
    : assistants.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()));

  const handleAdd = async (data: { name: string; email: string; password: string; phone?: string }) => {
    try {
      if (tab === 'faculty') {
        await createAdminFaculty(data);
      } else {
        await createAdminAssistant(data);
      }
      loadUsers();
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      if (tab === 'faculty') {
        await deleteAdminFaculty(id);
      } else {
        await deleteAdminAssistant(id);
      }
      loadUsers();
    } catch {
      alert('Failed to delete user.');
    }
  };

  const handleAssignSave = async (labId: number | null) => {
    if (assignUser && labId !== null) {
      try {
        await assignAdminAssistantLab(assignUser.id, labId);
        loadUsers();
        setAssignUser(null);
      } catch {
        alert('Failed to assign lab.');
      }
    }
  };

  const stats = [
    { label: 'Faculty', value: faculty.length, color: 'text-violet-600' },
    { label: 'Lab Assistants', value: assistants.length, color: 'text-amber-600' },
    { label: 'Total Labs', value: totalLabs ?? '…', color: 'text-sky-600' },
    { label: 'Labs Assigned', value: assistants.filter(a => a.assignedLabNo).length, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-5">
      {showAddModal && <AddUserModal onSave={handleAdd} onClose={() => setShowAddModal(false)} />}
      {assignUser && <AssignLabsModal assistant={assignUser} onSave={handleAssignSave} onClose={() => setAssignUser(null)} />}
      {showAddLab && <AddLabModal onSave={handleCreateLab} onClose={() => setShowAddLab(false)} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Manage faculty, lab assistants, and lab assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg px-5 py-4 relative group">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex justify-between items-center">
              {s.label}
              {s.label === "Total Labs (DB)" && (
                <button 
                  onClick={() => setShowAddLab(true)}
                  className="text-sky-500 hover:text-sky-700 hover:bg-sky-50 p-1 rounded transition-colors -mr-2 -mt-1"
                  title="Add New Lab"
                >
                  <FiPlus size={16} />
                </button>
              )}
            </p>
            <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* User management panel */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Tabs + actions */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex rounded-lg bg-slate-100 p-0.5 gap-0.5">
            <button
              onClick={() => { setTab('faculty'); setQuery(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === 'faculty' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FiUsers size={14} /> Faculty ({faculty.length})
            </button>
            <button
              onClick={() => { setTab('assistant'); setQuery(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === 'assistant' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FiTool size={14} /> Lab Assistants ({assistants.length})
            </button>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <SearchBar onSearch={setQuery} placeholder={tab === 'faculty' ? 'Search faculty...' : 'Search assistants...'} />
            <Button
              label={tab === 'faculty' ? 'Add Faculty' : 'Add Assistant'}
              icon={<FiPlus size={14} />}
              onClick={() => setShowAddModal(true)}
            />
          </div>
        </div>

        {/* User table */}
        {loading ? (
          <div className="px-5 py-20 text-center text-slate-400">
            <FiLoader size={24} className="animate-spin mx-auto mb-3 opacity-50" />
            <p className="text-sm">Loading from database...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400">
            <FiBox size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {tab === 'faculty' ? 'faculty' : 'lab assistants'} yet. Click "Add" to create one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {tab === 'assistant' ? 'Assigned Lab' : 'Phone'}
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        tab === 'faculty' ? 'text-violet-700 bg-violet-50' : 'text-amber-700 bg-amber-50'
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    {tab === 'assistant' ? (
                      u.assignedLabNo ? (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold px-1.5 py-0.5 rounded">
                          Lab {u.assignedLabNo}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None assigned</span>
                      )
                    ) : (
                      <span className="text-xs text-slate-500">{u.phone || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {tab === 'assistant' && (
                        <button
                          onClick={() => setAssignUser(u)}
                          className="px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                        >
                          <FiBox size={12} className="inline mr-1" />Assign Lab
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
