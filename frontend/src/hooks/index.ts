// Custom hooks for data fetching and state management

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/rbac';
import type { Lab, PC, Software, TimetableEntry, Faculty, Class } from '../types';
import {
  fetchLabs,
  fetchPcsCatalog,
  fetchSoftwareCatalog,
  fetchTimetable,
  fetchFacultyCatalog,
  fetchClasses,
} from '../services/api';

export const useLabs = () => {
  const { role } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);

  useEffect(() => {
    fetchLabs().then((rows) => {
      const mapped: Lab[] = rows.map(r => ({
        id: String(r.id),
        labNo: r.labNo,
        name: r.name,
        collegeId: '1',
        capacity: 0,
        description: '',
        assignedAssistant: r.assignedAssistantName ?? undefined,
      }));
      setLabs(mapped);
    }).catch(() => setLabs([]));
  }, []);

  const canManageLabs = hasPermission(role, 'labs', 'update');

  return { labs, canManageLabs };
};

export const usePCs = () => {
  const { role, user } = useAuth();
  const [pcs, setPcs] = useState<PC[]>([]);

  useEffect(() => {
    fetchPcsCatalog().then((rows) => {
      const mapped: PC[] = rows.map(r => ({
        id: String(r.id),
        pcNo: r.pcNo,
        labId: String(r.labId),
        os: r.os,
        specs: { processor: r.processor, ram: r.ram, storage: r.storage, gpu: 'N/A' },
        status: r.status,
        installedSoftware: [],
      }));
      setPcs(mapped);
    }).catch(() => setPcs([]));
  }, []);

  const visiblePcs = useMemo(() => {
    if (role === 'labAssistant' && user.assignedLabs && user.assignedLabs.length > 0) {
      return pcs.filter(pc => user.assignedLabs!.includes(pc.labId));
    }
    return pcs;
  }, [pcs, role, user.assignedLabs]);

  const canEditPCs = hasPermission(role, 'pcs', 'update');

  return { pcs: visiblePcs, canEditPCs };
};

export const useSoftware = () => {
  const { role } = useAuth();
  const [software, setSoftware] = useState<Software[]>([]);

  useEffect(() => {
    fetchSoftwareCatalog().then((rows) => {
      const mapped: Software[] = rows.map(r => ({
        id: String(r.id),
        name: r.name,
        version: r.version,
        category: r.category,
        installDate: r.installDate,
      }));
      setSoftware(mapped);
    }).catch(() => setSoftware([]));
  }, []);

  const canManageSoftware = hasPermission(role, 'software', 'update');

  return { software, canManageSoftware };
};

export const useTimetable = () => {
  const { role, user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    fetchTimetable().then(({ entries }) => {
      const mapped: TimetableEntry[] = entries.map(e => ({
        id: e.id,
        labId: e.labId,
        classId: e.classId,
        courseId: e.courseId,
        facultyId: e.facultyId,
        dayOfWeek: e.dayOfWeek as TimetableEntry['dayOfWeek'],
        startTime: e.startTime,
        endTime: e.endTime,
      }));
      setTimetable(mapped);
    }).catch(() => setTimetable([]));
  }, []);

  const visibleTimetable = useMemo(() => {
    if (role === 'labAssistant' && user.assignedLabs && user.assignedLabs.length > 0) {
      return timetable.filter(entry => user.assignedLabs!.includes(entry.labId));
    }
    return timetable;
  }, [timetable, role, user.assignedLabs]);

  const canEditTimetable = hasPermission(role, 'timetable', 'update');

  return { timetable: visibleTimetable, canEditTimetable };
};

export const useFaculty = () => {
  const { role } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  useEffect(() => {
    fetchFacultyCatalog().then((rows) => {
      const mapped: Faculty[] = rows.map(r => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        phone: r.phone,
        department: r.department,
      }));
      setFaculty(mapped);
    }).catch(() => setFaculty([]));
  }, []);

  const canEditFaculty = hasPermission(role, 'faculty', 'update');

  return { faculty, canEditFaculty };
};

export const useClasses = () => {
  const { role } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    fetchClasses().then((rows) => {
      const mapped: Class[] = rows.map(r => ({
        id: String(r.id),
        name: r.name,
        courseId: '',
        semester: r.year,
        strength: r.strength,
      }));
      setClasses(mapped);
    }).catch(() => setClasses([]));
  }, []);

  const canEditClasses = hasPermission(role, 'classes', 'update');

  return { classes, canEditClasses };
};
