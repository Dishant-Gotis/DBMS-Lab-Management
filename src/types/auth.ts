// Authentication & Authorization Types

export type UserRole = 'student' | 'labAssistant' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedLabs?: string[]; // For lab assistants: array of lab IDs they manage
}

export interface AuthContextType {
  user: User;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, role: Exclude<UserRole, 'admin'> | 'admin') => void;
  loginAsAdmin: (email: string) => void;
  logout: () => void;
}

// Lab and Assistant Management Types
export interface LabAssignment {
  labNo: string;
  assistantId: string;
  assistantName: string;
  assignedDate: string;
}

export interface LabAssistantRecord {
  id: string;
  name: string;
  email: string;
  assignedLabs: string[]; // Lab IDs assigned to this assistant
  createdDate: string;
}

export interface Permission {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export type PermissionMap = {
  [key in UserRole]: {
    [section: string]: Permission;
  };
};
