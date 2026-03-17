import React, { createContext, useContext, useState, ReactNode } from 'react';
import { userStore, type AppUser, type AppRole } from '../store/userStore';

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
  loginWithCredentials: (email: string, password: string) => { success: boolean; error?: string };
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
    if (raw) return JSON.parse(raw);
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

  const loginWithCredentials = (email: string, password: string): { success: boolean; error?: string } => {
    const found = userStore.validate(email, password);
    if (!found) return { success: false, error: 'Invalid email or password.' };

    // Re-read from store in case labs were assigned since last load
    const fresh = userStore.findByEmail(email)!;
    const authUser = appUserToAuthUser(fresh);
    setCurrentUser(authUser);
    setIsAuthenticated(true);
    saveSession(authUser, true);
    return { success: true };
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
