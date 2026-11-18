import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import AuthPage from '@/components/AuthPage';
import Layout, { type Page } from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import UploadPage from '@/components/UploadPage';
import SearchPage from '@/components/SearchPage';
import Loader from '@/components/Loader';

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader label="Starting up…" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Layout current={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard goToUpload={() => setPage('upload')} />}
      {page === 'upload' && <UploadPage onDone={() => setPage('dashboard')} />}
      {page === 'search' && <SearchPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
