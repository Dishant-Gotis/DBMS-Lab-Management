// localStorage-based dynamic user store
// Admin creates faculty/assistant accounts; they persist across refreshes.

export type AppRole = 'admin' | 'faculty' | 'labAssistant';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string; // plain text for demo purposes
  role: AppRole;
  assignedLabs: string[]; // lab numbers e.g. ['6101', '6202']
  createdAt: string;
}

const STORE_KEY = 'lms_users';

const DEFAULT_ADMIN: AppUser = {
  id: 'admin-001',
  name: 'Admin',
  email: 'admin@pccoepune.org',
  password: 'admin123',
  role: 'admin',
  assignedLabs: [],
  createdAt: new Date().toISOString(),
};

function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as AppUser[];
  } catch {}
  // First run — seed with just the admin account
  const initial = [DEFAULT_ADMIN];
  localStorage.setItem(STORE_KEY, JSON.stringify(initial));
  return initial;
}

function saveUsers(users: AppUser[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(users));
}

// ── Public API ──────────────────────────────────────────────────────────────

export const userStore = {
  getAll(): AppUser[] {
    return loadUsers();
  },

  getByRole(role: AppRole): AppUser[] {
    return loadUsers().filter(u => u.role === role);
  },

  findByEmail(email: string): AppUser | undefined {
    return loadUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  validate(email: string, password: string): AppUser | null {
    const user = loadUsers().find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    return user ?? null;
  },

  add(user: Omit<AppUser, 'id' | 'createdAt'>): AppUser {
    const users = loadUsers();
    const newUser: AppUser = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    return newUser;
  },

  update(id: string, patch: Partial<Omit<AppUser, 'id' | 'createdAt'>>): void {
    const users = loadUsers().map(u => (u.id === id ? { ...u, ...patch } : u));
    saveUsers(users);
  },

  remove(id: string): void {
    const users = loadUsers().filter(u => u.id !== id);
    saveUsers(users);
  },

  assignLabs(id: string, labNos: string[]): void {
    const users = loadUsers().map(u => (u.id === id ? { ...u, assignedLabs: labNos } : u));
    saveUsers(users);
  },
};
