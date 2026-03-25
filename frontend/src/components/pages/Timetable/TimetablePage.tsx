import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { SearchBar } from '../../common/SearchBar';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchTimetable,
  fetchAssistantLabs,
  fetchAssistantLabTimetable,
  fetchFacultyLabs,
  fetchFacultyLabTimetable,
  fetchAdminTimetableMeta,
  createAdminSlot,
  updateAdminTimetableDay,
  type ApiTimetableEntry,
  type ApiRoleSlot,
  type ApiAdminTimetableMeta,
} from '../../../services/api';
import { FiAlertCircle, FiCalendar, FiLoader, FiPlus, FiRefreshCw } from 'react-icons/fi';

const DAY_META: Record<string, { label: string; column: 'mon' | 'tue' | 'wed' | 'thur' | 'fri' }> = {
  mon: { label: 'Mon', column: 'mon' },
  tue: { label: 'Tue', column: 'tue' },
  wed: { label: 'Wed', column: 'wed' },
  thur: { label: 'Thu', column: 'thur' },
  fri: { label: 'Fri', column: 'fri' },
};
const DAY_KEYS = ['mon', 'tue', 'wed', 'thur', 'fri'] as const;

type RoleEntry = {
  id: string;
  dayOfWeek: string;
  labName: string;
  courseName: string;
  className: string;
  facultyName: string;
};

const TimetablePage: React.FC = () => {
  const { role, user } = useAuth();

  const [entries, setEntries] = useState<RoleEntry[]>([]);
  const [adminMeta, setAdminMeta] = useState<ApiAdminTimetableMeta>({ labs: [], classes: [], courses: [], faculty: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedLab, setSelectedLab] = useState('');

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    labId: '',
    day: 'mon' as 'mon' | 'tue' | 'wed' | 'thur' | 'fri',
    courseId: '',
    classId: '',
    facultyId: '',
    clearSlot: false,
  });

  const toRoleEntry = (
    lab: { id: number; name: string },
    dayKey: string,
    slot: ApiRoleSlot,
    prefix: string,
  ): RoleEntry => ({
    id: `${prefix}-${lab.id}-${dayKey}-${slot.id}`,
    dayOfWeek: DAY_META[dayKey].label,
    labName: lab.name,
    courseName: slot.courseName,
    className: `${slot.classDivision} (Year ${slot.classYear})`,
    facultyName: slot.facultyName,
  });

  const loadTimetable = async () => {
    setLoading(true);
    setError(null);

    try {
      if (role === 'admin') {
        const [fullData, adminMetaData] = await Promise.all([
          fetchTimetable(),
          fetchAdminTimetableMeta(),
        ]);

        const normalized: RoleEntry[] = fullData.entries.map((e: ApiTimetableEntry) => ({
          id: e.id,
          dayOfWeek: e.dayOfWeek,
          labName: e.labName,
          courseName: e.courseName || '—',
          className: e.className || '—',
          facultyName: e.facultyName || '—',
        }));

        setEntries(normalized);
        setAdminMeta(adminMetaData);
        return;
      }

      if (role === 'faculty') {
        const labs = await fetchFacultyLabs(user.id);
        const labTimetables = await Promise.all(
          labs.map(lab =>
            fetchFacultyLabTimetable(user.id, lab.id)
              .then(data => ({ ok: true as const, data }))
              .catch(() => ({ ok: false as const, data: null })),
          ),
        );

        const roleEntries: RoleEntry[] = [];
        for (const item of labTimetables) {
          if (!item.ok || !item.data) continue;
          const { lab, timetable } = item.data;
          DAY_KEYS.forEach(dayKey => {
            const slot = timetable[dayKey];
            if (slot) roleEntries.push(toRoleEntry(lab, dayKey, slot, 'fac'));
          });
        }

        setEntries(roleEntries);
        return;
      }

      if (role === 'labAssistant') {
        const labs = await fetchAssistantLabs(user.id);
        const labTimetables = await Promise.all(
          labs.map(lab =>
            fetchAssistantLabTimetable(user.id, lab.id)
              .then(data => ({ ok: true as const, data }))
              .catch(() => ({ ok: false as const, data: null })),
          ),
        );

        const roleEntries: RoleEntry[] = [];
        for (const item of labTimetables) {
          if (!item.ok || !item.data) continue;
          const { lab, timetable } = item.data;
          DAY_KEYS.forEach(dayKey => {
            const slot = timetable[dayKey];
            if (slot) roleEntries.push(toRoleEntry(lab, dayKey, slot, 'asst'));
          });
        }

        setEntries(roleEntries);
        return;
      }

      setEntries([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [role, user.id]);

  const filteredEntries = useMemo(() => {
    const q = query.toLowerCase().trim();

    return entries
      .filter(e => (selectedDay ? e.dayOfWeek === selectedDay : true))
      .filter(e => (selectedLab ? e.labName === selectedLab : true))
      .filter(e => {
        if (!q) return true;
        return (
          e.dayOfWeek.toLowerCase().includes(q) ||
          e.labName.toLowerCase().includes(q) ||
          e.courseName.toLowerCase().includes(q) ||
          e.className.toLowerCase().includes(q) ||
          e.facultyName.toLowerCase().includes(q)
        );
      });
  }, [entries, query, selectedDay, selectedLab]);

  const visibleLabs = useMemo(() => {
    const set = new Set(entries.map(e => e.labName));
    return Array.from(set).sort();
  }, [entries]);

  const openAdminModal = () => {
    setAdminForm({ labId: '', day: 'mon', courseId: '', classId: '', facultyId: '', clearSlot: false });
    setShowAdminModal(true);
  };

  const handleAdminSave = async () => {
    if (!adminForm.labId) return;
    if (!adminForm.clearSlot && (!adminForm.courseId || !adminForm.classId || !adminForm.facultyId)) return;

    setAdminSaving(true);
    try {
      let slotId: number | null = null;
      if (!adminForm.clearSlot) {
        const slot = await createAdminSlot(Number(adminForm.courseId), Number(adminForm.facultyId), Number(adminForm.classId));
        slotId = slot.id;
      }

      await updateAdminTimetableDay(Number(adminForm.labId), adminForm.day, slotId);
      setShowAdminModal(false);
      await loadTimetable();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update timetable');
    } finally {
      setAdminSaving(false);
    }
  };

  if (role === 'student') {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold text-slate-900">Timetable</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium">Not Available for Students</p>
          <p className="text-amber-700 text-sm mt-1">Students do not have timetable access in this project setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showAdminModal && (
        <Modal
          isOpen
          onClose={() => setShowAdminModal(false)}
          title="Update Lab Timetable"
          size="md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button label="Cancel" variant="secondary" onClick={() => setShowAdminModal(false)} disabled={adminSaving} />
              <Button label={adminSaving ? 'Saving...' : 'Save'} onClick={handleAdminSave} disabled={adminSaving} />
            </div>
          }
        >
          <div className="space-y-3">
            <label className="block text-sm text-slate-600">
              <span className="font-medium">Lab</span>
              <select className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={adminForm.labId} onChange={e => setAdminForm(prev => ({ ...prev, labId: e.target.value }))}>
                <option value="">Select Lab</option>
                {adminMeta.labs.map(l => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
              </select>
            </label>

            <label className="block text-sm text-slate-600">
              <span className="font-medium">Weekday</span>
              <select className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={adminForm.day} onChange={e => setAdminForm(prev => ({ ...prev, day: e.target.value as 'mon' | 'tue' | 'wed' | 'thur' | 'fri' }))}>
                {Object.entries(DAY_META).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={adminForm.clearSlot} onChange={e => setAdminForm(prev => ({ ...prev, clearSlot: e.target.checked }))} />
              Clear this day's slot for selected lab
            </label>

            {!adminForm.clearSlot && (
              <>
                <label className="block text-sm text-slate-600">
                  <span className="font-medium">Course</span>
                  <select className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={adminForm.courseId} onChange={e => setAdminForm(prev => ({ ...prev, courseId: e.target.value }))}>
                    <option value="">Select Course</option>
                    {adminMeta.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>

                <label className="block text-sm text-slate-600">
                  <span className="font-medium">Class</span>
                  <select className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={adminForm.classId} onChange={e => setAdminForm(prev => ({ ...prev, classId: e.target.value }))}>
                    <option value="">Select Class</option>
                    {adminMeta.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>

                <label className="block text-sm text-slate-600">
                  <span className="font-medium">Faculty</span>
                  <select className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={adminForm.facultyId} onChange={e => setAdminForm(prev => ({ ...prev, facultyId: e.target.value }))}>
                    <option value="">Select Faculty</option>
                    {adminMeta.faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </label>
              </>
            )}
          </div>
        </Modal>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Timetable</h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'faculty' && 'Your weekday lab-course sessions only.'}
            {role === 'labAssistant' && 'Full timetable for your assigned lab.'}
            {role === 'admin' && 'Complete timetable with admin edit controls.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role === 'admin' && <Button label="Add/Modify" icon={<FiPlus size={14} />} onClick={openAdminModal} />}
          <button onClick={loadTimetable} title="Refresh" className="p-2 text-slate-400 hover:text-sky-600 border border-slate-200 rounded-lg transition-colors">
            <FiRefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="p-0"><p className="text-xs text-slate-500">Visible Rows</p><p className="text-2xl font-semibold text-slate-900 mt-1">{filteredEntries.length}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Labs</p><p className="text-2xl font-semibold text-slate-900 mt-1">{new Set(entries.map(e => e.labName)).size}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Courses</p><p className="text-2xl font-semibold text-slate-900 mt-1">{new Set(entries.map(e => e.courseName)).size}</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card title="Filters">
            <div className="space-y-3">
              <SearchBar onSearch={setQuery} placeholder="Search lab/course/faculty..." />

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Day
                <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700">
                  <option value="">All Days</option>
                  {Object.values(DAY_META).map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lab
                <select value={selectedLab} onChange={e => setSelectedLab(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700">
                  <option value="">All Labs</option>
                  {visibleLabs.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card title="Schedule">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <FiLoader size={18} className="animate-spin" />
                <span className="text-sm">Loading timetable...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center">
                <FiAlertCircle size={22} className="mx-auto text-red-400 mb-2" />
                <p className="text-red-700 text-sm font-medium">Failed to fetch timetable</p>
                <p className="text-red-500 text-xs mt-1">{error}</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <FiCalendar size={24} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">No timetable rows found.</p>
              </div>
            ) : role === 'faculty' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Weekday</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Lab</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Course</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 text-xs text-slate-700 font-medium">{e.dayOfWeek}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{e.labName}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{e.courseName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Weekday</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Lab</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Course</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Class</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Faculty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 text-xs text-slate-700 font-medium">{e.dayOfWeek}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{e.labName}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{e.courseName}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{e.className}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{e.facultyName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;
