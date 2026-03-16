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
    // Lab assistants only see their assigned lab's PCs
    if (role === 'labAssistant' && user.assignedLab) {
      return pcs.filter(pc => pc.labId === user.assignedLab);
    }
    return pcs;
  }, [pcs, role, user.assignedLab]);

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
    // Lab assistants only see their lab's schedule
    if (role === 'labAssistant' && user.assignedLab) {
      return timetable.filter(entry => entry.labId === user.assignedLab);
    }
    return timetable;
  }, [timetable, role, user.assignedLab]);

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
