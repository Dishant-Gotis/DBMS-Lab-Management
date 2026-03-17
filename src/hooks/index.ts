// Custom hooks for data fetching and state management

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockData } from '../mockData';
import { hasPermission } from '../utils/rbac';
import type { Lab, PC, Software, TimetableEntry, Faculty, Class } from '../types';

export const useLabs = () => {
  const { role } = useAuth();
  const [labs] = useState<Lab[]>(mockData.labs as Lab[]);

  const getLabs = useCallback(() => {
    return labs;
  }, [labs]);

  const canManageLabs = hasPermission(role, 'labs', 'update');

  return { labs: getLabs(), canManageLabs };
};

export const usePCs = () => {
  const { role, user } = useAuth();
  const [pcs] = useState<PC[]>(mockData.pcs as PC[]);

  const getPCs = useCallback(() => {
    // Lab assistants only see their assigned labs' PCs
    if (role === 'labAssistant' && user.assignedLabs && user.assignedLabs.length > 0) {
      return pcs.filter(pc => user.assignedLabs!.includes(pc.labId));
    }
    return pcs;
  }, [pcs, role, user.assignedLabs]);

  const canEditPCs = hasPermission(role, 'pcs', 'update');

  return { pcs: getPCs(), canEditPCs };
};

export const useSoftware = () => {
  const { role } = useAuth();
  const [software] = useState<Software[]>(mockData.software as Software[]);

  const canManageSoftware = hasPermission(role, 'software', 'update');

  return { software, canManageSoftware };
};

export const useTimetable = () => {
  const { role, user } = useAuth();
  const [timetable] = useState<TimetableEntry[]>(mockData.timetable as TimetableEntry[]);

  const getTimetable = useCallback(() => {
    // Lab assistants only see their assigned labs' schedule
    if (role === 'labAssistant' && user.assignedLabs && user.assignedLabs.length > 0) {
      return timetable.filter(entry => user.assignedLabs!.includes(entry.labId));
    }
    return timetable;
  }, [timetable, role, user.assignedLabs]);

  const canEditTimetable = hasPermission(role, 'timetable', 'update');

  return { timetable: getTimetable(), canEditTimetable };
};

export const useFaculty = () => {
  const { role } = useAuth();
  const [faculty] = useState<Faculty[]>(mockData.faculty as Faculty[]);

  const canEditFaculty = hasPermission(role, 'faculty', 'update');

  return { faculty, canEditFaculty };
};

export const useClasses = () => {
  const { role } = useAuth();
  const [classes] = useState<Class[]>(mockData.classes as Class[]);

  const canEditClasses = hasPermission(role, 'classes', 'update');

  return { classes, canEditClasses };
};
