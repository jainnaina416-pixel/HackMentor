import { FileUp, FileCheck2, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";
import type { StoredUpload } from "../../types";

const MAX_BYTES = 10 * 1024 * 1024;

export function PdfDrop({
  label,
  hint,
  value,
  disabled,
  onFile,
}: {
  label: string;
  hint: string;
  value?: StoredUpload;
  disabled?: boolean;
  onFile: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function take(file?: File) {
    setLocalError(null);
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setLocalError("Please choose a valid PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("File must be 10 MB or smaller.");
      return;
    }
    await onFile(file);
  }

  return (
    <div
      className={`glass-dropzone relative flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-dashed transition-all duration-300 cursor-pointer ${
        drag
          ? "border-purple-400 bg-purple-500/15 shadow-[0_0_30px_rgba(168,85,247,0.25)] scale-[1.01]"
          : "border-white/15 bg-white/[0.02] hover:border-purple-400/40 hover:bg-white/[0.04]"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void take(e.dataTransfer.files[0]);
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName !== "BUTTON") {
          inputRef.current?.click();
        }
      }}
    >
      <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-110 transition-transform">
        {value ? <FileCheck2 size={24} className="text-emerald-400" /> : <FileUp size={24} />}
      </div>

      <strong className="text-sm font-semibold text-white tracking-tight">{label}</strong>
      <p className="text-xs text-white/50 mt-1 max-w-xs">{hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => void take(e.target.files?.[0])}
      />

      <button
        type="button"
        className="mt-4 px-4 py-1.5 rounded-full text-xs font-medium bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/30 transition-all cursor-pointer"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        {value ? "Replace PDF" : "Choose PDF File"}
      </button>

      {value && (
        <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/10 text-left w-full text-xs">
          <div className="flex items-center justify-between text-white font-medium">
            <span className="truncate max-w-[200px]">{value.fileName}</span>
            <span className="text-white/50 font-mono text-[11px]">{(value.size / 1024).toFixed(0)} KB</span>
          </div>
          <div className="text-[11px] font-mono text-purple-300 mt-1 truncate">
            s3://{value.bucket}/{value.key}
          </div>
        </div>
      )}

      {localError && (
        <div className="mt-2 text-rose-400 text-xs flex items-center gap-1.5">
          <AlertCircle size={14} />
          <span>{localError}</span>
        </div>
      )}
    </div>
  );
}
