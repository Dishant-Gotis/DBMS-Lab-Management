// Navigation constants
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
  { id: 'labs', label: 'Labs', icon: 'labs', path: '/labs' },
  { id: 'pcs', label: 'PCs', icon: 'pcs', path: '/pcs' },
  { id: 'software', label: 'Software', icon: 'software', path: '/software' },
  { id: 'timetable', label: 'Timetable', icon: 'timetable', path: '/timetable' },
  { id: 'classes', label: 'Classes', icon: 'classes', path: '/classes' },
  { id: 'faculty', label: 'Faculty', icon: 'faculty', path: '/faculty' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
];

// User roles
export const USER_ROLES = ['student', 'labAssistant', 'faculty', 'admin'] as const;

// PC Status colors
export const PC_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
};

// Days of week
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Time slots for timetable
export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Notification durations
export const NOTIFICATION_DURATIONS = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
  PERSISTENT: 0,
};
