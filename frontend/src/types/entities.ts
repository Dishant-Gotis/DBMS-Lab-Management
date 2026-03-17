// Core Entity Types

export interface College {
  id: string;
  name: string;
  city: string;
}

export interface Lab {
  id: string;
  labNo: string;
  name: string;
  collegeId: string;
  capacity: number;
  description: string;
  assignedAssistant?: string;
}

export interface PCSpecs {
  processor: string;
  ram: string;
  storage: string;
  gpu: string;
}

export interface PC {
  id: string;
  pcNo: string;
  labId: string;
  os: string;
  specs: PCSpecs;
  status: 'active' | 'inactive' | 'maintenance';
  installedSoftware: string[];
}

export interface Software {
  id: string;
  name: string;
  version: string;
  category: string;
  installDate: string;
}

export interface TimetableEntry {
  id: string;
  labId: string;
  classId: string;
  courseId: string;
  facultyId: string;
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  startTime: string;
  endTime: string;
}

export interface Class {
  id: string;
  name: string;
  courseId: string;
  semester: number;
  strength: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  courses?: string[];
}

export interface LabAssistant {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedLab: string;
}
