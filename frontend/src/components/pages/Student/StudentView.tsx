import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMonitor, FiArrowRight, FiBox, FiLogOut, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { fetchLabs, type ApiLab } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const StudentView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [labs, setLabs] = useState<ApiLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Fetch real labs from backend on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchLabs()
      .then(setLabs)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return labs;
    return labs.filter(
      l =>
        l.labNo.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        (l.assignedAssistantName ?? '').toLowerCase().includes(q),
    );
  }, [query, labs]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
          <FiBox size={15} className="text-white" />
        </div>
        <span className="font-semibold text-slate-800 text-sm tracking-tight">Lab Management — Student View</span>
        <button
          onClick={logout}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          <FiLogOut size={13} />
          Back to Login
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Search */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Computer Labs</h1>
          <p className="text-sm text-slate-500 mb-6">Browse available labs, PCs, and installed software</p>
          <div className="relative max-w-md mx-auto">
            <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by lab number, name, or assistant..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <FiLoader size={28} className="animate-spin" />
            <p className="text-sm">Loading labs...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl px-5 py-6 text-center">
            <FiAlertCircle size={28} className="mx-auto text-red-400 mb-2" />
            <p className="text-red-700 font-medium text-sm">Could not load labs</p>
            <p className="text-red-500 text-xs mt-1">{error}</p>
            <button
              onClick={() => { setLoading(true); setError(null); fetchLabs().then(setLabs).catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }}
              className="mt-4 text-xs text-sky-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Lab list */}
        {!loading && !error && (
          <>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {filtered.length} lab{filtered.length !== 1 ? 's' : ''} available
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FiBox size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No labs match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(lab => (
                  <button
                    key={lab.id}
                    onClick={() => navigate(`/lab/${lab.id}`)}
                    className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-sky-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                        Lab {lab.labNo}
                      </span>
                      <FiArrowRight
                        size={15}
                        className="text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all mt-0.5"
                      />
                    </div>

                    <p className="font-semibold text-slate-800 text-sm mb-1">{lab.name}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">Floor {lab.floor}</p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <FiMonitor size={12} />
                        <span>{lab.assignedAssistantName ?? 'No assistant assigned'}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StudentView;
