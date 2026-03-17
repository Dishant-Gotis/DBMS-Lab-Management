import React, { useState, useMemo, useCallback } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { SearchBar } from '../../common/SearchBar';
import { FiPlus, FiTrash2, FiBox, FiUsers, FiTool, FiCheck } from 'react-icons/fi';
import { userStore, type AppUser, type AppRole } from '../../../store/userStore';
import { getAllLabs } from '../../../utils/labData';

const ALL_LABS = getAllLabs();

// ── Small hook so component re-renders when store changes ────────────────────
function useUsers() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  const users = useMemo(() => userStore.getAll().filter(u => u.role !== 'admin'), [tick]);
  return { users, refresh };
}

// ── Lab assign multi-select modal ────────────────────────────────────────────
interface AssignLabsModalProps {
  user: AppUser;
  onSave: (labNos: string[]) => void;
  onClose: () => void;
}
const AssignLabsModal: React.FC<AssignLabsModalProps> = ({ user, onSave, onClose }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(user.assignedLabs));
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_LABS.filter(l =>
      l.labNo.toLowerCase().includes(q) || l.name.toLowerCase().includes(q)
    );
  }, [query]);

  const toggle = (labNo: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(labNo) ? next.delete(labNo) : next.add(labNo);
      return next;
    });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Assign Labs — ${user.name}`}
      size="md"
      footer={
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-slate-500">{selected.size} lab(s) selected</span>
          <div className="flex gap-2">
            <Button label="Cancel" variant="secondary" onClick={onClose} />
            <Button label="Save Assignment" onClick={() => onSave([...selected])} />
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
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {filtered.map(lab => {
          const checked = selected.has(lab.labNo);
          return (
            <label
              key={lab.labNo}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                checked ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <input
                type="checkbox"
                className="accent-sky-500"
                checked={checked}
                onChange={() => toggle(lab.labNo)}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-800">{lab.labNo}</span>
                <span className="ml-2 text-xs text-slate-400">{lab.name}</span>
              </div>
              {checked && <FiCheck size={13} className="text-sky-500 shrink-0" />}
            </label>
          );
        })}
      </div>
    </Modal>
  );
};

// ── Add User modal ────────────────────────────────────────────────────────────
interface AddUserModalProps {
  targetRole: 'faculty' | 'labAssistant';
  onSave: (data: { name: string; email: string; password: string }) => void;
  onClose: () => void;
}
const AddUserModal: React.FC<AddUserModalProps> = ({ targetRole, onSave, onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const valid = form.name.trim() && form.email.trim() && form.password.trim();
  const label = targetRole === 'faculty' ? 'Faculty' : 'Lab Assistant';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Add ${label}`}
      size="sm"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button label="Cancel" variant="secondary" onClick={onClose} />
          <Button label="Create Account" disabled={!valid} onClick={() => onSave(form)} />
        </div>
      }
    >
      <div className="space-y-3">
        {(['name', 'email', 'password'] as const).map(field => (
          <label key={field} className="block text-sm text-slate-600">
            <span className="capitalize font-medium">{field} *</span>
            <input
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              placeholder={field === 'email' ? 'user@pccoepune.org' : field === 'password' ? 'min 6 chars' : `${label} name`}
            />
          </label>
        ))}
        <p className="text-xs text-slate-400">The user will log in with these credentials.</p>
      </div>
    </Modal>
  );
};

// ── Main Admin Dashboard ─────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { users, refresh } = useUsers();
  const [tab, setTab]               = useState<'faculty' | 'labAssistant'>('faculty');
  const [query, setQuery]           = useState('');
  const [addModalRole, setAddModalRole] = useState<'faculty' | 'labAssistant' | null>(null);
  const [assignUser, setAssignUser] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(u => u.role === tab && (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    ));
  }, [users, tab, query]);

  const handleAdd = (data: { name: string; email: string; password: string }) => {
    userStore.add({ ...data, role: addModalRole!, assignedLabs: [] });
    refresh();
    setAddModalRole(null);
  };

  const handleAssignSave = (labNos: string[]) => {
    if (assignUser) { userStore.assignLabs(assignUser.id, labNos); refresh(); setAssignUser(null); }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this user?')) { userStore.remove(id); refresh(); }
  };

  const tabLabel = (r: AppRole) => r === 'faculty' ? 'Faculty' : 'Lab Assistants';
  const roleIcon = (r: AppRole) => r === 'faculty' ? <FiUsers size={14} /> : <FiTool size={14} />;
  const roleColor = (r: AppRole) => r === 'faculty' ? 'text-violet-700 bg-violet-50' : 'text-amber-700 bg-amber-50';

  const allUsers = userStore.getAll();
  const stats = [
    { label: 'Total Faculty',    value: allUsers.filter(u => u.role === 'faculty').length,      color: 'text-violet-600' },
    { label: 'Lab Assistants',   value: allUsers.filter(u => u.role === 'labAssistant').length, color: 'text-amber-600' },
    { label: 'Total Labs',       value: ALL_LABS.length,                                         color: 'text-sky-600' },
    { label: 'Labs Assigned',    value: allUsers.flatMap(u => u.assignedLabs).filter((v, i, a) => a.indexOf(v) === i).length, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-5">
      {/* Modals */}
      {addModalRole && <AddUserModal targetRole={addModalRole} onSave={handleAdd} onClose={() => setAddModalRole(null)} />}
      {assignUser && <AssignLabsModal user={assignUser} onSave={handleAssignSave} onClose={() => setAssignUser(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Manage faculty, lab assistants, and lab assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{s.label}</p>
            <p className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* User management panel */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Tabs + actions */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex rounded-lg bg-slate-100 p-0.5 gap-0.5">
            {(['faculty', 'labAssistant'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTab(r)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  tab === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {roleIcon(r)} {tabLabel(r)} ({allUsers.filter(u => u.role === r).length})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <SearchBar onSearch={setQuery} placeholder={`Search ${tabLabel(tab).toLowerCase()}...`} />
            <Button
              label={`Add ${tab === 'faculty' ? 'Faculty' : 'Assistant'}`}
              icon={<FiPlus size={14} />}
              onClick={() => setAddModalRole(tab)}
            />
          </div>
        </div>

        {/* User table */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400">
            <FiBox size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {tabLabel(tab).toLowerCase()} yet. Click "Add" to create one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned Labs</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${roleColor(u.role as AppRole)}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.assignedLabs.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">None assigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.assignedLabs.slice(0, 4).map(l => (
                          <span key={l} className="bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold px-1.5 py-0.5 rounded">
                            {l}
                          </span>
                        ))}
                        {u.assignedLabs.length > 4 && (
                          <span className="text-xs text-slate-400">+{u.assignedLabs.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setAssignUser(u)}
                        className="px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                        title="Assign labs"
                      >
                        <FiBox size={12} className="inline mr-1" />Assign Labs
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete user"
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
