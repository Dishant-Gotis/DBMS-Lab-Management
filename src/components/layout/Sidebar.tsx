import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';
import {
  FiChevronLeft, FiChevronRight,
  FiLayout, FiBox, FiMonitor, FiPackage,
  FiClock, FiBookOpen, FiUsers, FiSettings,
} from 'react-icons/fi';

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <FiLayout size={15} />,
  labs: <FiBox size={15} />,
  pcs: <FiMonitor size={15} />,
  software: <FiPackage size={15} />,
  timetable: <FiClock size={15} />,
  classes: <FiBookOpen size={15} />,
  faculty: <FiUsers size={15} />,
  settings: <FiSettings size={15} />,
};

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useApp();

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-40 ${
        sidebarOpen ? 'w-56' : 'w-14'
      }`}
    >
      {/* Brand */}
      <div
        className={`h-14 flex items-center flex-shrink-0 border-b border-slate-200 ${
          sidebarOpen ? 'px-4 gap-2.5' : 'justify-center'
        }`}
      >
        <div className="w-7 h-7 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <FiBox size={13} className="text-white" />
        </div>
        {sidebarOpen && (
          <span className="text-slate-900 font-semibold text-sm tracking-tight">ClubERP</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {sidebarOpen && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Main
          </p>
        )}
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.id}
            to={item.path}
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
            {iconMap[item.id] || <FiBox size={15} />}
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse */}
      <div className="p-2 border-t border-slate-200 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className={`w-full flex items-center py-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors ${
            sidebarOpen ? 'gap-3 px-3' : 'justify-center'
          }`}
        >
          {sidebarOpen ? (
            <>
              <FiChevronLeft size={14} />
              <span className="text-xs">Collapse</span>
            </>
          ) : (
            <FiChevronRight size={14} />
          )}
        </button>
      </div>
    </div>
  );
};
