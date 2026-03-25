import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { NotificationMessage } from '../types';

interface AppContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notifications: NotificationMessage[];
  addNotification: (notification: Omit<NotificationMessage, 'id'>) => void;
  removeNotification: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDarkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  useEffect(() => {
    localStorage.setItem('isDarkMode', String(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const addNotification = (notification: Omit<NotificationMessage, 'id'>) => {
    const id = `notif-${Date.now()}`;
    const newNotification: NotificationMessage = {
      ...notification,
      id,
    };
    setNotifications(prev => [...prev, newNotification]);

    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 3000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const value: AppContextType = {
    isDarkMode,
    toggleDarkMode,
    notifications,
    addNotification,
    removeNotification,
    sidebarOpen,
    toggleSidebar,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
