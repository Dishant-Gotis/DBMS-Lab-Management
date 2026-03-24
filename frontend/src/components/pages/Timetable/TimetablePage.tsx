import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { SearchBar } from '../../common/SearchBar';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useAuth } from '../../../context/AuthContext';
import { mockData } from '../../../mockData';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../../../utils/constants';
import { Class, Course, Faculty, Lab, TimetableEntry } from '../../../types';
import { FiAlertTriangle, FiCalendar, FiClock, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';

const STORAGE_KEY = 'lms_timetable_entries';

type FormState = Omit<TimetableEntry, 'id'>;

const EMPTY_FORM: FormState = {
  labId: '',
  classId: '',
  courseId: '',
  facultyId: '',
  dayOfWeek: 'Mon',
  startTime: '09:00',
  endTime: '10:00',
};

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
  const a1 = toMinutes(aStart);
  const a2 = toMinutes(aEnd);
  const b1 = toMinutes(bStart);
  const b2 = toMinutes(bEnd);
  return a1 < b2 && b1 < a2;
};

const readStoredEntries = (): TimetableEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TimetableEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback to seeded mock data if local cache is invalid.
  }
  return [...(mockData.timetable as TimetableEntry[])];
};

const TimetablePage: React.FC = () => {
  const { role } = useAuth();

  const labs = mockData.labs as Lab[];
  const classes = mockData.classes as Class[];
  const courses = mockData.courses as Course[];
  const faculty = mockData.faculty as Faculty[];

  const [entries, setEntries] = useState<TimetableEntry[]>(() => readStoredEntries());

  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [query, setQuery] = useState('');

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const canManage = role !== 'student';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const labelMap = useMemo(() => {
    const labMap = new Map(labs.map(l => [l.id, l]));
    const classMap = new Map(classes.map(c => [c.id, c]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const facultyMap = new Map(faculty.map(f => [f.id, f]));
    return { labMap, classMap, courseMap, facultyMap };
  }, [labs, classes, courses, faculty]);

  const filteredEntries = useMemo(() => {
    const q = query.toLowerCase().trim();

    return entries
      .filter(e => (selectedDay ? e.dayOfWeek === selectedDay : true))
      .filter(e => (selectedLab ? e.labId === selectedLab : true))
      .filter(e => (selectedFaculty ? e.facultyId === selectedFaculty : true))
      .filter(e => (selectedClass ? e.classId === selectedClass : true))
      .filter(e => {
        if (!q) return true;

        const labName = labelMap.labMap.get(e.labId)?.name ?? '';
        const className = labelMap.classMap.get(e.classId)?.name ?? '';
        const courseName = labelMap.courseMap.get(e.courseId)?.name ?? '';
        const facultyName = labelMap.facultyMap.get(e.facultyId)?.name ?? '';

        return (
          labName.toLowerCase().includes(q) ||
          className.toLowerCase().includes(q) ||
          courseName.toLowerCase().includes(q) ||
          facultyName.toLowerCase().includes(q) ||
          e.startTime.includes(q) ||
          e.endTime.includes(q)
        );
      })
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  }, [entries, query, selectedClass, selectedDay, selectedFaculty, selectedLab, labelMap]);

  const weeklyGrid = useMemo(() => {
    return DAYS_OF_WEEK.slice(0, 6).map(day => {
      const dayEntries = entries
        .filter(e => e.dayOfWeek === day)
        .filter(e => (selectedLab ? e.labId === selectedLab : true))
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
      return { day, entries: dayEntries };
    });
  }, [entries, selectedLab]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowEditor(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingId(entry.id);
    setForm({
      labId: entry.labId,
      classId: entry.classId,
      courseId: entry.courseId,
      facultyId: entry.facultyId,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
    setFormError(null);
    setShowEditor(true);
  };

  const detectConflicts = (candidate: FormState, ignoreId?: string | null): string[] => {
    const issues: string[] = [];

    for (const item of entries) {
      if (ignoreId && item.id === ignoreId) continue;
      if (item.dayOfWeek !== candidate.dayOfWeek) continue;
      if (!overlaps(item.startTime, item.endTime, candidate.startTime, candidate.endTime)) continue;

      if (item.labId === candidate.labId) {
        issues.push('Selected lab already has another session in this time range.');
      }
      if (item.facultyId === candidate.facultyId) {
        issues.push('Selected faculty member already has another session in this time range.');
      }
      if (item.classId === candidate.classId) {
        issues.push('Selected class already has another session in this time range.');
      }
    }

    return Array.from(new Set(issues));
  };

  const saveEntry = () => {
    setFormError(null);

    if (!form.labId || !form.classId || !form.courseId || !form.facultyId) {
      setFormError('Please fill all required fields.');
      return;
    }

    if (toMinutes(form.endTime) <= toMinutes(form.startTime)) {
      setFormError('End time must be after start time.');
      return;
    }

    const conflicts = detectConflicts(form, editingId);
    if (conflicts.length > 0) {
      setFormError(conflicts[0]);
      return;
    }

    if (editingId) {
      setEntries(prev => prev.map(item => (item.id === editingId ? { ...item, ...form } : item)));
    } else {
      const newEntry: TimetableEntry = {
        id: `tt-${Date.now()}`,
        ...form,
      };
      setEntries(prev => [...prev, newEntry]);
    }

    setShowEditor(false);
  };

  const deleteEntry = (id: string) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    setEntries(prev => prev.filter(item => item.id !== id));
  };

  const resetDemoData = () => {
    if (!window.confirm('Reset timetable to original mock dataset?')) return;
    const fresh = [...(mockData.timetable as TimetableEntry[])];
    setEntries(fresh);
    setShowEditor(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  return (
    <div className="space-y-5">
      {showEditor && (
        <Modal
          isOpen
          onClose={() => setShowEditor(false)}
          title={editingId ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
          size="md"
          footer={
            <div className="flex justify-between items-center w-full">
              <p className="text-xs text-slate-500">Saved locally for live demo (browser storage).</p>
              <div className="flex gap-2">
                <Button label="Cancel" variant="secondary" onClick={() => setShowEditor(false)} />
                <Button label={editingId ? 'Update Entry' : 'Add Entry'} onClick={saveEntry} />
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2">
                <FiAlertTriangle size={14} className="mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-slate-600">
                <span className="font-medium">Day</span>
                <select
                  value={form.dayOfWeek}
                  onChange={e => setForm(prev => ({ ...prev, dayOfWeek: e.target.value as FormState['dayOfWeek'] }))}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  {DAYS_OF_WEEK.slice(0, 6).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                <span className="font-medium">Lab</span>
                <select
                  value={form.labId}
                  onChange={e => setForm(prev => ({ ...prev, labId: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select Lab</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                <span className="font-medium">Class</span>
                <select
                  value={form.classId}
                  onChange={e => {
                    const classId = e.target.value;
                    const classRow = classes.find(c => c.id === classId);
                    setForm(prev => ({
                      ...prev,
                      classId,
                      courseId: classRow ? classRow.courseId : prev.courseId,
                    }));
                  }}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} (Sem {cls.semester})</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                <span className="font-medium">Course</span>
                <select
                  value={form.courseId}
                  onChange={e => setForm(prev => ({ ...prev, courseId: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600 md:col-span-2">
                <span className="font-medium">Faculty</span>
                <select
                  value={form.facultyId}
                  onChange={e => setForm(prev => ({ ...prev, facultyId: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select Faculty</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-600">
                <span className="font-medium">Start Time</span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </label>

              <label className="text-sm text-slate-600">
                <span className="font-medium">End Time</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Timetable</h1>
          <p className="text-sm text-slate-500 mt-1">Complete mock timetable manager for live demo (create, edit, delete, filter, conflict checks).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button label="Reset Mock Data" variant="secondary" onClick={resetDemoData} />
          {canManage && <Button label="Add Entry" icon={<FiPlus size={14} />} onClick={openCreateModal} />}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-0"><p className="text-xs text-slate-500">Total Entries</p><p className="text-2xl font-semibold text-slate-900 mt-1">{entries.length}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Visible (Filtered)</p><p className="text-2xl font-semibold text-slate-900 mt-1">{filteredEntries.length}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Labs Covered</p><p className="text-2xl font-semibold text-slate-900 mt-1">{new Set(entries.map(e => e.labId)).size}</p></Card>
        <Card className="p-0"><p className="text-xs text-slate-500">Faculty Scheduled</p><p className="text-2xl font-semibold text-slate-900 mt-1">{new Set(entries.map(e => e.facultyId)).size}</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card title="Filters">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Search</p>
                <SearchBar onSearch={setQuery} placeholder="Search by lab, class, course, faculty..." />
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Day
                <select
                  value={selectedDay}
                  onChange={e => setSelectedDay(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700"
                >
                  {DAYS_OF_WEEK.slice(0, 6).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lab
                <select
                  value={selectedLab}
                  onChange={e => setSelectedLab(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">All Labs</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Faculty
                <select
                  value={selectedFaculty}
                  onChange={e => setSelectedFaculty(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">All Faculty</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Class
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card title={`${selectedDay} Schedule`}>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <FiCalendar size={24} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">No timetable entries found for current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Time</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Lab</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Class</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Course</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Faculty</th>
                      {canManage && <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 text-xs text-slate-700 font-medium">
                          <span className="inline-flex items-center gap-1">
                            <FiClock size={12} />
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{labelMap.labMap.get(entry.labId)?.name ?? 'Unknown'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{labelMap.classMap.get(entry.classId)?.name ?? 'Unknown'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{labelMap.courseMap.get(entry.courseId)?.name ?? 'Unknown'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{labelMap.facultyMap.get(entry.facultyId)?.name ?? 'Unknown'}</td>
                        {canManage && (
                          <td className="px-3 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openEditModal(entry)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 size={13} />
                              </button>
                              <button
                                onClick={() => deleteEntry(entry.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card title="Weekly Overview">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Time</th>
                {weeklyGrid.map(col => (
                  <th key={col.day} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{col.day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.slice(0, 11).map(time => (
                <tr key={time} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">{time}</td>
                  {weeklyGrid.map(col => {
                    const entry = col.entries.find(e => e.startTime === time);
                    return (
                      <td key={`${col.day}-${time}`} className="px-4 py-3 align-top text-xs">
                        {entry ? (
                          <div className="bg-sky-50 text-sky-700 p-2 rounded border border-sky-100">
                            <p className="font-semibold text-[11px]">{labelMap.classMap.get(entry.classId)?.name ?? 'Class'}</p>
                            <p className="text-[11px]">{labelMap.labMap.get(entry.labId)?.name ?? 'Lab'}</p>
                            <p className="text-[10px] text-sky-600 mt-0.5">{entry.startTime} - {entry.endTime}</p>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TimetablePage;
