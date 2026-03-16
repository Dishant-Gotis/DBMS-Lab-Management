import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-001',
    name: 'John Doe',
    email: 'john@college.edu',
    role: 'student',
  });

  const switchRole = (newRole: UserRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role: newRole,
      assignedLab: newRole === 'labAssistant' ? 'lab-001' : undefined,
    }));
  };

  const value: AuthContextType = {
    user: currentUser,
    role: currentUser.role,
    switchRole,
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
