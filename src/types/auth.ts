// Authentication & Authorization Types

export type UserRole = 'student' | 'labAssistant' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedLab?: string;
}

export interface AuthContextType {
  user: User;
  role: UserRole;
  switchRole: (newRole: UserRole) => void;
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
