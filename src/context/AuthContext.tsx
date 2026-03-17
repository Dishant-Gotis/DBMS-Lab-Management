import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AuthContextType, LabAssistantRecord } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Mock database for lab assistants (in production, this would be in backend)
const mockAssistantsDB: LabAssistantRecord[] = [
  {
    id: 'asst-001',
    name: 'Raj Patel',
    email: 'rajpatel@pccoepune.org',
    assignedLabs: ['6101', '6102', '6103'],
    createdDate: '2024-01-15',
  },
  {
    id: 'asst-002',
    name: 'Priya Sharma',
    email: 'priyasharma@pccoepune.org',
    assignedLabs: ['6104', '6105'],
    createdDate: '2024-01-20',
  },
  {
    id: 'asst-003',
    name: 'Vikram Singh',
    email: 'vikramsingh@pccoepune.org',
    assignedLabs: ['6106', '6107', '6108'],
    createdDate: '2024-01-25',
  },
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-001',
    name: 'Guest User',
    email: 'guest@pccoepune.org',
    role: 'student',
    assignedLabs: [],
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [assistantsDB] = useState<LabAssistantRecord[]>(mockAssistantsDB);

  const login = (email: string, role: Exclude<UserRole, 'admin'> | 'admin') => {
    const normalizedEmail = email.trim().toLowerCase();
    const prefix = normalizedEmail.split('@')[0] || 'user';
    const displayName = prefix
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, m => m.toUpperCase());

    // For lab assistants, find their assigned labs from database
    let assignedLabs: string[] = [];
    if (role === 'labAssistant') {
      const assistant = assistantsDB.find(a => a.email === normalizedEmail);
      assignedLabs = assistant?.assignedLabs || [];
    }

    setCurrentUser({
      id: `user-${Date.now()}`,
      name: displayName,
      email: normalizedEmail,
      role,
      assignedLabs,
    });
    setIsAuthenticated(true);
  };

  const loginAsAdmin = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const prefix = normalizedEmail.split('@')[0] || 'admin';
    const displayName = prefix
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, m => m.toUpperCase());

    setCurrentUser({
      id: `admin-${Date.now()}`,
      name: displayName,
      email: normalizedEmail,
      role: 'admin',
      assignedLabs: [], // Admin doesn't have limited labs
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser({
      id: 'user-001',
      name: 'Guest User',
      email: 'guest@pccoepune.org',
      role: 'student',
      assignedLabs: [],
    });
  };

  const value: AuthContextType = {
    user: currentUser,
    role: currentUser.role,
    isAuthenticated,
    login,
    loginAsAdmin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
