import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { supabase, type Candidate } from '@/lib/supabaseClient';
import { extractInfo, extractTextFromFile, type ExtractedInfo } from '@/lib/resumeParser';

const MAX_SIZE_MB = 10;
const ACCEPTED = ['.pdf', '.docx'];

type Stage = 'idle' | 'reading' | 'parsing' | 'saving' | 'done' | 'error';

export default function UploadPage({ onDone }: { onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedInfo | null>(null);
  const [saved, setSaved] = useState<Candidate | null>(null);

  const reset = () => {
    setFile(null);
    setStage('idle');
    setError(null);
    setExtracted(null);
    setSaved(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const validate = (f: File): string | null => {
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      return 'Only PDF and DOCX files are supported.';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleSelect = (f: File | null) => {
    reset();
    if (!f) return;
    const vErr = validate(f);
    if (vErr) {
      setError(vErr);
      setStage('error');
      return;
    }
    setFile(f);
  };

  const handleParse = async () => {
    if (!file) return;
    setError(null);
    setExtracted(null);
    setStage('reading');
    try {
      const text = await extractTextFromFile(file);
      setStage('parsing');
      const info = extractInfo(text);
      setExtracted(info);
      setStage('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse this file.');
      setStage('error');
    }
  };

  const handleSave = async () => {
    if (!file || !extracted) return;
    setStage('saving');
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error: err } = await supabase
      .from('candidates')
      .insert({
        name: extracted.name,
        email: extracted.email,
        phone: extracted.phone,
        education: extracted.education,
        experience: extracted.experience,
        skills: extracted.skills,
        filename: file.name,
        raw_text: null,
        user_id: userData.user?.id,
      })
      .select()
      .single();
    if (err) {
      setError('Could not save this candidate. Please try again.');
      setStage('idle');
      return;
    }
    setSaved(data as Candidate);
    setStage('done');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Upload Resume</h1>
      <p className="text-slate-500 text-sm mb-6">
        Upload a PDF or DOCX resume. We extract the candidate's contact info, education, experience, and technical skills automatically.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        {stage === 'done' && saved ? (
          <div className="text-center py-8 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-semibold text-slate-900 text-lg">Resume Saved</h2>
            <p className="text-sm text-slate-500 mt-1">
              {saved.name || 'Candidate'} has been added to your dashboard.
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <button onClick={reset} className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                Upload Another
              </button>
              <button onClick={onDone} className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition">
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Dropzone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleSelect(e.dataTransfer.files?.[0] ?? null);
              }}
              className="border-2 border-dashed border-slate-300 rounded-xl py-12 px-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/40 transition-colors duration-200 group"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-200">
                <UploadCloud className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                {file ? 'Choose a different file' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF or DOCX, up to {MAX_SIZE_MB}MB</p>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-100 animate-slide-up">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button onClick={reset} className="p-1 rounded hover:bg-slate-200">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            {file && stage !== 'done' && (
              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleParse}
                  disabled={stage === 'reading' || stage === 'parsing' || stage === 'saving'}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  {stage === 'reading' || stage === 'parsing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {stage === 'reading' ? 'Extracting text…' : stage === 'parsing' ? 'Analyzing…' : 'Parse Resume'}
                </button>

                {extracted && (
                  <button
                    onClick={handleSave}
                    disabled={stage === 'saving'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-60"
                  >
                    {stage === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {stage === 'saving' ? 'Saving…' : 'Save to Dashboard'}
                  </button>
                )}
              </div>
            )}

            {/* Extracted preview */}
            {extracted && (
              <div className="mt-6 border-t border-slate-100 pt-5 animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Extracted Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Name" value={extracted.name} />
                  <Field label="Email" value={extracted.email} />
                  <Field label="Phone" value={extracted.phone} />
                  <Field label="Skills Found" value={`${extracted.skills.length} detected`} />
                </div>
                {extracted.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Technical Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extracted.skills.map((s) => (
                        <span key={s} className="text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(extracted.education || extracted.experience) && (
                  <div className="mt-4 space-y-3">
                    {extracted.education && <LongField label="Education" value={extracted.education} />}
                    {extracted.experience && <LongField label="Experience" value={extracted.experience} />}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-4">
                  Review the extracted data, then click <span className="font-medium">Save to Dashboard</span> to store it.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value || 'Not detected'}</p>
    </div>
  );
}

function LongField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
    </div>
  );
}
