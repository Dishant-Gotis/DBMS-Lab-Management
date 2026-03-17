import React from 'react';
import { FiShield, FiUsers, FiTool, FiMonitor } from 'react-icons/fi';

type UserRole = 'student' | 'labAssistant' | 'faculty' | 'admin';

interface LoginPageProps {
  onLoginSuccess: (payload: { email: string; role: UserRole }) => void;
}

const DEMO_LOGINS: { role: UserRole; label: string; sub: string; email: string; icon: React.ReactNode; bg: string; border: string; text: string }[] = [
  {
    role: 'admin',
    label: 'College / Admin',
    sub: 'Full system access',
    email: 'admin@pccoepune.org',
    icon: <FiShield size={20} />,
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200 hover:border-red-400',
    text: 'text-red-700',
  },
  {
    role: 'faculty',
    label: 'Faculty',
    sub: 'View labs, classes & timetable',
    email: 'faculty@pccoepune.org',
    icon: <FiUsers size={20} />,
    bg: 'bg-violet-50 hover:bg-violet-100',
    border: 'border-violet-200 hover:border-violet-400',
    text: 'text-violet-700',
  },
  {
    role: 'labAssistant',
    label: 'Lab Assistant',
    sub: 'Manage assigned labs',
    email: 'rajpatel@pccoepune.org',
    icon: <FiTool size={20} />,
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-200 hover:border-amber-400',
    text: 'text-amber-700',
  },
];

export default function AnimatedLoginPage({ onLoginSuccess }: LoginPageProps) {
  const handleStaffLogin = (role: UserRole, email: string) => {
    onLoginSuccess({ email, role });
  };

  const handleStudentAccess = () => {
    onLoginSuccess({ email: 'student@pccoepune.org', role: 'student' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500 mb-4">
          <FiMonitor size={22} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Management System</h1>
        <p className="text-sm text-slate-500 mt-1">PCCOE Pune — Select your access type</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* Student Access */}
        <button
          onClick={handleStudentAccess}
          className="w-full flex items-center gap-4 px-5 py-4 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl transition-colors shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <FiMonitor size={18} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Browse as Student</p>
            <p className="text-xs text-sky-100 mt-0.5">View labs, PCs & software — no login needed</p>
          </div>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Staff Demo Login</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Staff Demo Buttons */}
        {DEMO_LOGINS.map(item => (
          <button
            key={item.role}
            onClick={() => handleStaffLogin(item.role, item.email)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-colors ${item.bg} ${item.border}`}
          >
            <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 ${item.text}`}>
              {item.icon}
            </div>
            <div className="text-left">
              <p className={`font-semibold text-sm ${item.text}`}>{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
            </div>
            <span className="ml-auto text-xs text-slate-400 font-medium">Demo</span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        This is a demonstration environment — no real credentials required.
      </p>
    </div>
  );
}
