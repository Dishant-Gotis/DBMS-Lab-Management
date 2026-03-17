import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiChevronDown, FiUser, FiLogOut } from 'react-icons/fi';
import { NAV_ITEMS } from '../../utils/constants';

export const TopBar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentPage = NAV_ITEMS.find(item => item.path === location.pathname)?.label ?? 'Dashboard';

  const roleStyle: Record<string, string> = {
    student: 'bg-sky-50 text-sky-700 border-sky-200',
    labAssistant: 'bg-amber-50 text-amber-700 border-amber-200',
    faculty: 'bg-violet-50 text-violet-700 border-violet-200',
    admin: 'bg-red-50 text-red-700 border-red-200',
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur border-b border-slate-200 z-30 flex items-center justify-between px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
        <div className="text-sm font-semibold text-slate-900 mt-0.5">{currentPage}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors ${
          roleStyle[role] ?? 'bg-slate-50 text-slate-600 border-slate-200'
        }`}>
          <FiUser size={11} className="inline mr-1" />
          {role === 'labAssistant' ? 'Lab Assistant' : role}
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-200 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-semibold select-none">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm text-slate-800 font-medium">{user.name}</p>
              <p className="text-[11px] text-slate-400 uppercase">{user.email}</p>
            </div>
            <FiChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
              >
                <FiLogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
