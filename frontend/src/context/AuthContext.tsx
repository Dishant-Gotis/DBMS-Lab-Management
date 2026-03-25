import React, { createContext, useContext, useState, ReactNode } from 'react';
import { userStore, type AppUser, type AppRole } from '../store/userStore';
import { loginUser, type LoginRole } from '../services/api';

// ── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AppRole | 'student';
  assignedLabs: string[];
}

interface AuthContextType {
  user: AuthUser;
  role: AppRole | 'student';
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password: string, role: LoginRole) => Promise<{ success: boolean; error?: string }>;
  loginAsStudent: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Session persistence ──────────────────────────────────────────────────────
const SESSION_KEY = 'lms_auth';

const GUEST: AuthUser = {
  id: 'guest',
  name: 'Guest',
  email: '',
  role: 'student',
  assignedLabs: [],
};

function saveSession(user: AuthUser, authenticated: boolean) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, authenticated }));
}
function loadSession(): { user: AuthUser; authenticated: boolean } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.user?.id) {
        // Sanitize legacy string IDs from old sessions
        parsed.user.id = parsed.user.id.replace(/^user-/, '');
        
        // Prevent Postgres integer overflow crashes (max 32-bit int is 2,147,483,647)
        if (!isNaN(Number(parsed.user.id)) && Number(parsed.user.id) > 2147483647) {
          console.warn('Scrubbing out-of-bounds legacy ID to prevent 500 API errors.');
          sessionStorage.removeItem(SESSION_KEY);
          return { user: GUEST, authenticated: false };
        }
      }
      return parsed;
    }
  } catch {}
  return { user: GUEST, authenticated: false };
}

function appUserToAuthUser(u: AppUser): AuthUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role, assignedLabs: u.assignedLabs };
}

// ── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const saved = loadSession();
  const [currentUser, setCurrentUser] = useState<AuthUser>(saved.user);
  const [isAuthenticated, setIsAuthenticated] = useState(saved.authenticated);

  const loginWithCredentials = async (email: string, password: string, role: LoginRole): Promise<{ success: boolean; error?: string }> => {
    try {
      if (role === 'admin') {
        const found = userStore.validate(email, password);
        if (!found || found.role !== 'admin') return { success: false, error: 'Invalid admin credentials.' };

        const fresh = userStore.findByEmail(email)!;
        const authUser = appUserToAuthUser(fresh);
        setCurrentUser(authUser);
        setIsAuthenticated(true);
        saveSession(authUser, true);
        return { success: true };
      }

      const remote = await loginUser(email, password, role);
      const authUser: AuthUser = {
        id: String(remote.id),
        name: remote.name,
        email: remote.email,
        role: remote.role,
        assignedLabs: remote.assignedLabs || [],
      };

      setCurrentUser(authUser);
      setIsAuthenticated(true);
      saveSession(authUser, true);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      return { success: false, error: msg };
    }
  };

  const loginAsStudent = () => {
    const student: AuthUser = { id: 'student', name: 'Student', email: '', role: 'student', assignedLabs: [] };
    setCurrentUser(student);
    setIsAuthenticated(true);
    saveSession(student, true);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setCurrentUser(GUEST);
  };

  return (
    <AuthContext.Provider value={{ user: currentUser, role: currentUser.role, isAuthenticated, loginWithCredentials, loginAsStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
