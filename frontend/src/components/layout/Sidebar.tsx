import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  FiChevronLeft, FiChevronRight,
  FiBox, FiClock, FiBookOpen,
  FiUsers, FiSettings, FiShield,
} from 'react-icons/fi';

const iconMap: Record<string, React.ReactNode> = {
  admin:     <FiShield size={15} />,
  labs:      <FiBox size={15} />,
  timetable: <FiClock size={15} />,
  classes:   <FiBookOpen size={15} />,
  faculty:   <FiUsers size={15} />,
  settings:  <FiSettings size={15} />,
};

type NavItem = { id: string; label: string; path: string };

// Dashboard removed — faculty/assistant land directly on Labs
const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { id: 'admin',    label: 'Admin Dashboard', path: '/admin' },
    { id: 'settings', label: 'Settings',        path: '/settings' },
  ],
  faculty: [
    { id: 'labs',      label: 'Labs',      path: '/labs' },
    { id: 'timetable', label: 'Timetable', path: '/timetable' },
    { id: 'classes',   label: 'Classes',   path: '/classes' },
    { id: 'settings',  label: 'Settings',  path: '/settings' },
  ],
  labAssistant: [
    { id: 'labs',      label: 'Labs',      path: '/labs' },
    { id: 'timetable', label: 'Timetable', path: '/timetable' },
    { id: 'settings',  label: 'Settings',  path: '/settings' },
  ],
  student: [],
};

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useApp();
  const { role } = useAuth();

  const navItems = useMemo<NavItem[]>(() => NAV_BY_ROLE[role] ?? NAV_BY_ROLE.faculty, [role]);
  const isAdmin = role === 'admin';

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-40 ${
        sidebarOpen ? 'w-56' : 'w-14'
      }`}
    >
      {/* Brand */}
      <div className={`h-14 flex items-center flex-shrink-0 border-b border-slate-200 ${sidebarOpen ? 'px-4 gap-2.5' : 'justify-center'}`}>
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${isAdmin ? 'bg-red-500' : 'bg-sky-500'}`}>
          {isAdmin ? <FiShield size={13} className="text-white" /> : <FiBox size={13} className="text-white" />}
        </div>
        {sidebarOpen && (
          <span className="text-slate-900 font-semibold text-sm tracking-tight">
            {isAdmin ? 'Admin Panel' : 'Lab Manager'}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {sidebarOpen && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {isAdmin ? 'Administration' : 'Main'}
          </p>
        )}
        {navItems.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/admin'}
            title={!sidebarOpen ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-md py-2 text-sm transition-all duration-150 ${
                sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } ${
                isActive
                  ? 'bg-sky-50 text-sky-700 border border-sky-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`
            }
          >
            {iconMap[item.id] ?? <FiBox size={15} />}
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse */}
      <div className="p-2 border-t border-slate-200 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center py-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors ${sidebarOpen ? 'gap-3 px-3' : 'justify-center'}`}
        >
          {sidebarOpen ? (
            <><FiChevronLeft size={14} /><span className="text-xs">Collapse</span></>
          ) : (
            <FiChevronRight size={14} />
          )}
        </button>
      </div>
    </div>
  );
};
