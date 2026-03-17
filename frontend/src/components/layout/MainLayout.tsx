import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useApp } from '../../context/AppContext';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { sidebarOpen } = useApp();

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <TopBar />
      <Sidebar />
      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'pl-56' : 'pl-14'}`}>
        <div className="px-6 py-5 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
};
