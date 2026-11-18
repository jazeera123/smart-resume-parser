import { Loader2 } from 'lucide-react';

export default function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-sm text-slate-500 mt-3">{label || 'Loading…'}</p>
    </div>
  );
}
