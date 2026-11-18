import { FileText, UploadCloud } from 'lucide-react';

type Props = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card py-16 flex flex-col items-center text-center animate-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <FileText className="w-7 h-7 text-slate-400" />
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
        >
          <UploadCloud className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
