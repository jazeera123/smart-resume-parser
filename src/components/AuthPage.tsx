import { useState } from 'react';
import { FileText, Loader2, Lock, Mail, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => setError(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setEmail('');
    setPassword('');
    setConfirm('');
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();

    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    const result = mode === 'login' ? await signIn(emailTrim, password) : await signUp(emailTrim, password);
    setBusy(false);

    if (result.error) {
      if (mode === 'register' && /already/i.test(result.error)) {
        setError('An account with this email already exists. Try logging in.');
      } else if (mode === 'login' && /invalid/i.test(result.error)) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left brand panel (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-lg leading-tight">Smart Resume Parser</p>
              <p className="text-slate-400 text-sm">Intelligent candidate screening</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl font-bold leading-tight">
              Parse resumes in seconds.<br />Match the right talent faster.
            </h1>
            <p className="text-slate-400 mt-4 leading-relaxed">
              Upload PDF or DOCX resumes and automatically extract candidate details, technical skills, and experience — then match them against your job requirements.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { icon: Sparkles, text: 'Automatic skill extraction with 150+ recognized technologies' },
                { icon: ShieldCheck, text: 'Secure, per-account data isolation' },
                { icon: UploadCloud, text: 'Drag-and-drop PDF and DOCX uploads' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-500 text-xs">© {new Date().getFullYear()} Smart Resume Parser</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 mb-3">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Smart Resume Parser</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 border border-slate-200/70">
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-500 text-sm mt-1 mb-6">
              {mode === 'login' ? 'Sign in to access your dashboard' : 'Start parsing and matching resumes'}
            </p>

            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                  mode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                  mode === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition placeholder:text-slate-400"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition placeholder:text-slate-400"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition placeholder:text-slate-400"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 animate-slide-up">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100 text-white font-medium py-2.5 rounded-lg transition shadow-sm"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-5">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-blue-600 font-medium hover:underline"
              >
                {mode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
