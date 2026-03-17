import React, { useState } from 'react';
import { FiShield, FiUsers, FiTool, FiMonitor, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

type UserRole = 'student' | 'labAssistant' | 'faculty' | 'admin';

interface LoginPageProps {
  onLoginSuccess: (email: string, password: string, role: UserRole) => { success: boolean; error?: string };
  onStudentAccess: () => void;
}

const ROLES: { role: Exclude<UserRole, 'student'>; label: string; sub: string; icon: React.ReactNode; accent: string; iconBg: string; border: string }[] = [
  { role: 'admin',        label: 'College / Admin', sub: 'Full system access',      icon: <FiShield size={20} />,  accent: 'text-red-700',    iconBg: 'bg-red-50',    border: 'border-red-200 hover:border-red-400 hover:bg-red-50/60' },
  { role: 'faculty',      label: 'Faculty',         sub: 'View & manage your labs', icon: <FiUsers size={20} />,   accent: 'text-violet-700', iconBg: 'bg-violet-50', border: 'border-violet-200 hover:border-violet-400 hover:bg-violet-50/60' },
  { role: 'labAssistant', label: 'Lab Assistant',   sub: 'Manage assigned labs',    icon: <FiTool size={20} />,    accent: 'text-amber-700',  iconBg: 'bg-amber-50',  border: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/60' },
];

export default function LoginPage({ onLoginSuccess, onStudentAccess }: LoginPageProps) {
  const [step, setStep]         = useState<'pick-role' | 'credentials'>('pick-role');
  const [role, setRole]         = useState<Exclude<UserRole, 'student'> | null>(null);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const selectedRole = ROLES.find(r => r.role === role);

  const handleRolePick = (r: Exclude<UserRole, 'student'>) => {
    setRole(r);
    setError('');
    setEmail('');
    setPassword('');
    setStep('credentials');
  };

  const handleBack = () => {
    setStep('pick-role');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError('');
    setLoading(true);
    // small artificial delay for UX
    await new Promise(r => setTimeout(r, 300));
    const result = onLoginSuccess(email.trim(), password, role);
    setLoading(false);
    if (!result.success) setError(result.error ?? 'Invalid credentials.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500 mb-4 shadow-sm">
          <FiMonitor size={22} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Management System</h1>
        <p className="text-sm text-slate-500 mt-1">PCCOE Pune</p>
      </div>

      <div className="w-full max-w-sm">

        {/* ── STEP 1: Role selector ─────────────────────────────── */}
        {step === 'pick-role' && (
          <div className="space-y-3">
            {/* Student */}
            <button
              onClick={onStudentAccess}
              className="w-full flex items-center gap-4 px-5 py-4 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl transition-colors shadow-sm"
            >
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <FiMonitor size={18} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Browse as Student</p>
                <p className="text-xs text-sky-100 mt-0.5">View labs & PCs — no login needed</p>
              </div>
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Login</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {ROLES.map(item => (
              <button
                key={item.role}
                onClick={() => handleRolePick(item.role)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 bg-white transition-colors ${item.border}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg} ${item.accent}`}>
                  {item.icon}
                </div>
                <div className="text-left">
                  <p className={`font-semibold text-sm ${item.accent}`}>{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 2: Credentials ───────────────────────────────── */}
        {step === 'credentials' && selectedRole && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            {/* Back + role badge */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={handleBack} className="text-slate-400 hover:text-slate-700 transition-colors">
                <FiArrowLeft size={18} />
              </button>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${selectedRole.iconBg} ${selectedRole.accent}`}>
                {selectedRole.icon}
                {selectedRole.label}
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Sign in</h2>
            <p className="text-sm text-slate-500 mb-5">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  placeholder="you@pccoepune.org"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">PCCOE Lab Management System — Demo Environment</p>
    </div>
  );
}
