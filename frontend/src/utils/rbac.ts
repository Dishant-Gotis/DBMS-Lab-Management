import { UserRole, Permission, PermissionMap } from '../types';

// Define permissions for each role and section
const permissionMap: PermissionMap = {
  student: {
    dashboard: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    labs: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    pcs: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    software: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    timetable: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    classes: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    faculty: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    settings: { canRead: true, canCreate: false, canUpdate: true, canDelete: false },
  },
  labAssistant: {
    dashboard: { canRead: true, canCreate: false, canUpdate: true, canDelete: false },
    labs: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    pcs: { canRead: true, canCreate: false, canUpdate: true, canDelete: false },
    software: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    timetable: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    classes: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    faculty: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    settings: { canRead: true, canCreate: false, canUpdate: true, canDelete: false },
  },
  faculty: {
    dashboard: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    labs: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    pcs: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    software: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    timetable: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    classes: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    faculty: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    settings: { canRead: true, canCreate: false, canUpdate: true, canDelete: false },
  },
  admin: {
    dashboard: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    labs: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    pcs: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    software: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    timetable: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    classes: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    faculty: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    settings: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
  },
};

/**
 * Get permissions for a specific role and section
 */
export const getPermissions = (role: UserRole, section: string): Permission => {
  const sectionPermissions = permissionMap[role]?.[section as keyof typeof permissionMap[UserRole]];
  return sectionPermissions || { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
};

/**
 * Check if a role can perform an action in a section
 */
export const hasPermission = (
  role: UserRole,
  section: string,
  action: 'read' | 'create' | 'update' | 'delete'
): boolean => {
  const permissions = getPermissions(role, section);
  return permissions[`can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof Permission] || false;
};

/**
 * Check if role is admin or faculty
 */
export const isStaff = (role: UserRole): boolean => {
  return role === 'faculty' || role === 'admin';
};

/**
 * Check if role can edit
 */
export const canEdit = (role: UserRole): boolean => {
  return role !== 'student';
};

/**
 * Get visible sections based on role
 */
export const getVisibleSections = (_role: UserRole): string[] => {
  const baseSection = ['dashboard', 'labs', 'pcs', 'software', 'timetable', 'classes', 'faculty', 'settings'];
  return baseSection;
};

/**
 * Filter sections based on edit capability
 */
export const getEditableSections = (role: UserRole): string[] => {
  if (!canEdit(role)) {
    return [];
  }
  return isStaff(role) ? ['labs', 'pcs', 'software', 'timetable', 'classes', 'faculty'] : ['software', 'pcs'];
};
