'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';

type Props = {
  label: string;
  hint?: string;
  valueUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onClear?: () => Promise<void>;
  disabled?: boolean;
};

export function LogoUpload({ label, hint, valueUrl, onUpload, onClear, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Max file size is 5 MB.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      await onUpload(file);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}

      <div
        className={`relative rounded-xl border-2 border-dashed transition ${
          drag ? 'border-[#0A2540] bg-slate-50' : 'border-slate-200 bg-white'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        {valueUrl ? (
          <div className="flex items-center gap-4 p-4">
            <div className="h-16 w-28 rounded-lg bg-slate-900 flex items-center justify-center p-2">
              <img src={valueUrl} alt={label} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 truncate">{valueUrl}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  <Upload className="w-3.5 h-3.5" /> Replace
                </button>
                {onClear && (
                  <button
                    type="button"
                    onClick={async () => {
                      setUploading(true);
                      try {
                        await onClear();
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-xs font-medium text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
            {uploading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-8 text-slate-400 hover:text-slate-600"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <ImagePlus className="w-7 h-7" />
            )}
            <span className="text-sm font-medium">Drop image or click to upload</span>
            <span className="text-xs">PNG, JPG, SVG · max 5 MB</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
