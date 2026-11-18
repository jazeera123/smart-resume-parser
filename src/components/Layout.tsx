import { useState, type ReactNode } from 'react';
import { FileText, LayoutDashboard, LogOut, Menu, Search, Upload, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export type Page = 'dashboard' | 'upload' | 'search';

type Props = {
  current: Page;
  onNavigate: (p: Page) => void;
  children: ReactNode;
};

const NAV: Array<{ key: Page; label: string; icon: typeof LayoutDashboard; description: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'All candidates' },
  { key: 'upload', label: 'Upload Resume', icon: Upload, description: 'Parse a new file' },
  { key: 'search', label: 'Search & Match', icon: Search, description: 'Find and rank talent' },
];

export default function Layout({ current, onNavigate, children }: Props) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const email = user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  const NavItems = () => (
    <nav className="space-y-1">
      {NAV.map(({ key, label, icon: Icon, description }) => (
        <button
          key={key}
          onClick={() => {
            onNavigate(key);
            setMobileOpen(false);
          }}
          className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            current === key
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          <Icon className={`w-4 h-4 shrink-0 ${current === key ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className="flex-1 text-left">
            <span className="block">{label}</span>
            <span className={`block text-[11px] font-normal ${current === key ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
              {description}
            </span>
          </span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-slate-900 flex-col p-4 z-30 border-r border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Smart Resume</p>
            <p className="text-slate-400 text-xs">Parser</p>
          </div>
        </div>
        <NavItems />
        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-slate-300 text-xs truncate">{email}</p>
              <p className="text-slate-500 text-[11px]">Signed in</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 bg-slate-900 text-white flex items-center justify-between px-4 py-3 z-30 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Smart Resume Parser</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-800" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 flex flex-col p-4 animate-slide-in-left">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold text-sm">Menu</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800" aria-label="Close menu">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <NavItems />
            <div className="mt-auto pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-semibold text-white">
                  {initials}
                </div>
                <p className="text-slate-300 text-xs truncate">{email}</p>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="md:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
