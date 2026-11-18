import { useEffect, useState } from 'react';
import { FileText, Mail, Phone, Search, Trash2, Users, X, CheckCircle2 } from 'lucide-react';
import { supabase, type Candidate } from '@/lib/supabaseClient';
import Loader from './Loader';
import EmptyState from './EmptyState';

type Props = {
  goToUpload: () => void;
};

export default function Dashboard({ goToUpload }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError('Could not load candidates. Please try again.');
    } else {
      setCandidates(data as Candidate[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this candidate record? This cannot be undone.')) return;
    setDeleting(id);
    const { error: err } = await supabase.from('candidates').delete().eq('id', id);
    setDeleting(null);
    if (err) {
      setError('Could not delete this record. Please try again.');
      return;
    }
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = query.trim()
    ? candidates.filter((c) => {
        const q = query.toLowerCase();
        return (
          (c.name?.toLowerCase().includes(q) ?? false) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
        );
      })
    : candidates;

  const totalSkills = Array.from(new Set(candidates.flatMap((c) => c.skills))).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Overview of all parsed candidate resumes</p>
        </div>
        <button
          onClick={goToUpload}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Upload Resume
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Resumes" value={candidates.length} icon={<FileText className="w-5 h-5" />} color="blue" />
        <StatCard label="Unique Skills" value={totalSkills} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
        <StatCard label="Candidates" value={candidates.length} icon={<Users className="w-5 h-5" />} color="slate" />
      </div>
      {candidates.length > 0 && (
        <p className="text-xs text-slate-400 mb-4">{filtered.length} of {candidates.length} shown{query ? ' for current search' : ''}</p>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Search bar */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or skill..."
          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? 'No matching candidates' : 'No resumes yet'}
          subtitle={query ? 'Try a different search term.' : 'Upload your first resume to get started.'}
          actionLabel={!query ? 'Upload Resume' : undefined}
          onAction={goToUpload}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Candidate</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Contact</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Top Skills</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{c.filename}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {c.email || '—'}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {c.phone || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                        {c.skills.length > 3 && (
                          <span className="text-xs text-slate-400">+{c.skills.length - 3} more</span>
                        )}
                        {c.skills.length === 0 && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(c)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        {deleting === c.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{c.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{c.filename}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="text-red-600 p-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email || '—'}
                </p>
                <p className="text-sm text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone || '—'}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {c.skills.slice(0, 4).map((s) => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                  {c.skills.length === 0 && <span className="text-xs text-slate-400">No skills detected</span>}
                </div>
                <button
                  onClick={() => setSelected(c)}
                  className="mt-3 w-full text-sm text-blue-600 font-medium border border-slate-200 rounded-lg py-2"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && <DetailDrawer candidate={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'slate';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  const accents = {
    blue: 'before:bg-blue-500',
    green: 'before:bg-green-500',
    slate: 'before:bg-slate-400',
  };
  return (
    <div className={`relative bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 before:absolute before:top-0 before:left-5 before:right-5 before:h-[3px] before:rounded-full ${accents[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function DetailDrawer({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Candidate Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">{candidate.filename}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition" aria-label="Close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-5 animate-slide-up">
          <Section label="Name" value={candidate.name || 'Not detected'} />
          <Section label="Email" value={candidate.email || 'Not detected'} />
          <Section label="Phone" value={candidate.phone || 'Not detected'} />
          <Section label="File" value={candidate.filename} />
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Skills ({candidate.skills.length})</p>
            {candidate.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((s) => (
                  <span key={s} className="text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No skills detected</p>
            )}
          </div>
          <Section label="Education" value={candidate.education || 'Not detected'} multiline />
          <Section label="Experience" value={candidate.experience || 'Not detected'} multiline />
        </div>
      </div>
    </div>
  );
}

function Section({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-slate-800 ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>{value}</p>
    </div>
  );
}
