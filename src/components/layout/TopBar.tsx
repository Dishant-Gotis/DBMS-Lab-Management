import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiChevronDown, FiUser } from 'react-icons/fi';
import { NAV_ITEMS } from '../../utils/constants';

export const TopBar: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const location = useLocation();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles = ['student', 'labAssistant', 'faculty'];
  const currentPage = NAV_ITEMS.find(item => item.path === location.pathname)?.label ?? 'Dashboard';

  const roleStyle: Record<string, string> = {
    student: 'bg-sky-50 text-sky-700 border-sky-200',
    labAssistant: 'bg-amber-50 text-amber-700 border-amber-200',
    faculty: 'bg-violet-50 text-violet-700 border-violet-200',
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur border-b border-slate-200 z-30 flex items-center justify-between px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
        <div className="text-sm font-semibold text-slate-900 mt-0.5">{currentPage}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors ${
              roleStyle[role] ?? 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <FiUser size={11} />
            {role === 'labAssistant' ? 'Lab Asst.' : role}
            <FiChevronDown size={11} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => { switchRole(r as any); setShowRoleMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm capitalize hover:bg-slate-50 transition-colors ${
                    role === r ? 'text-indigo-600 font-medium' : 'text-slate-700'
                  }`}
                >
                  {r === 'labAssistant' ? 'Lab Assistant' : r}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-semibold select-none">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm text-slate-800 font-medium">{user.name}</p>
            <p className="text-[11px] text-slate-400 uppercase">{role === 'labAssistant' ? 'Lab Assistant' : role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
