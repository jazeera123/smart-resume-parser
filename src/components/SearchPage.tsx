import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, CheckCircle2, XCircle } from 'lucide-react';
import { supabase, type Candidate } from '@/lib/supabaseClient';
import { matchSkills, type SkillMatchResult } from '@/lib/resumeParser';
import Loader from './Loader';
import EmptyState from './EmptyState';

export default function SearchPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError('Could not load candidates.');
    } else {
      setCandidates(data as Candidate[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const allSkills = useMemo(
    () => Array.from(new Set(candidates.flatMap((c) => c.skills))).sort((a, b) => a.localeCompare(b)),
    [candidates],
  );

  // Filter by name + skill filter
  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const nq = nameQuery.trim().toLowerCase();
      const sq = skillFilter.trim().toLowerCase();
      const nameOk = !nq || (c.name?.toLowerCase().includes(nq) ?? false);
      const skillOk = !sq || c.skills.some((s) => s.toLowerCase().includes(sq));
      return nameOk && skillOk;
    });
  }, [candidates, nameQuery, skillFilter]);

  // Match against required skills
  const requiredList = useMemo(
    () =>
      requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [requiredSkills],
  );

  const matchResults: SkillMatchResult[] = useMemo(() => {
    if (requiredList.length === 0) return [];
    return filtered
      .map((c) => matchSkills(c, requiredList))
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [filtered, requiredList]);

  const clearFilters = () => {
    setNameQuery('');
    setSkillFilter('');
    setRequiredSkills('');
  };

  const hasFilters = nameQuery || skillFilter || requiredSkills;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Search & Match</h1>
      <p className="text-slate-500 text-sm mb-6">Find candidates by name, filter by skill, and match against required job skills.</p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Search by name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Candidate name…"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Filter by skill</label>
            <input
              list="skill-options"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Type a skill (e.g. React, Python)…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="skill-options">
              {allSkills.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Required job skills <span className="text-slate-400">(comma-separated, e.g. React, Node.js, PostgreSQL)</span>
          </label>
          <input
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="Enter skills to match against candidates…"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : candidates.length === 0 ? (
        <EmptyState title="No candidates" subtitle="Upload resumes first to use search and matching." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching candidates" subtitle="Try adjusting your name or skill filters." />
      ) : requiredList.length > 0 ? (
        <MatchResults results={matchResults} requiredSkills={requiredList} />
      ) : (
        <ResultsList candidates={filtered} />
      )}
    </div>
  );
}

function ResultsList({ candidates }: { candidates: Candidate[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {candidates.map((c) => (
          <div key={c.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
            <div>
              <p className="font-medium text-slate-900">{c.name || 'Unknown'}</p>
              <p className="text-xs text-slate-500">{c.email || 'No email'}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 max-w-md">
              {c.skills.slice(0, 5).map((s) => (
                <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
              {c.skills.length > 5 && <span className="text-xs text-slate-400">+{c.skills.length - 5}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchResults({ results, requiredSkills }: { results: SkillMatchResult[]; requiredSkills: string[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
        <p className="text-sm text-blue-800">
          Matching <span className="font-semibold">{requiredSkills.length}</span> required skill{requiredSkills.length !== 1 ? 's' : ''} across{' '}
          <span className="font-semibold">{results.length}</span> candidate{results.length !== 1 ? 's' : ''}. Sorted by best match.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {requiredSkills.map((s) => (
            <span key={s} className="text-xs bg-white text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {results.map((r, idx) => (
          <div key={r.candidate.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover transition-all duration-200" style={{ animationDelay: `${idx * 40}ms` }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{r.candidate.name || 'Unknown'}</p>
                <p className="text-xs text-slate-500">{r.candidate.email || 'No email'}</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-2xl font-bold tabular-nums ${r.matchPercentage >= 75 ? 'text-green-600' : r.matchPercentage >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {r.matchPercentage}%
                </div>
                <p className="text-xs text-slate-400">{r.matchCount}/{requiredSkills.length} skills</p>
              </div>
            </div>

            {/* Match bar */}
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${r.matchPercentage >= 75 ? 'bg-green-500' : r.matchPercentage >= 50 ? 'bg-amber-500' : 'bg-slate-300'}`}
                style={{ width: `${r.matchPercentage}%` }}
              />
            </div>

            {/* Per-skill breakdown */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {requiredSkills.map((req) => {
                const has = r.matchedSkills.some((m) => m.toLowerCase() === req.toLowerCase());
                return (
                  <div key={req} className="flex items-center gap-2 text-sm">
                    {has ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={has ? 'text-slate-800' : 'text-slate-400 line-through'}>{req}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
