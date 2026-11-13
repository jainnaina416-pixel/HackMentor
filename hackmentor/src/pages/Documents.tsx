import { CheckCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "../components/ui/Card";
import { ErrorBanner, Spinner, SuccessBanner } from "../components/ui/Feedback";
import { PdfDrop } from "../components/ui/PdfDrop";
import { useApp } from "../context/AppContext";

export function DocumentsPage() {
  const { uploads, uploadDocument, busy, error, success } = useApp();

  return (
    <div className="page documents-page">
      <div className="page-head">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-300 mb-2">
            <Sparkles size={14} />
            <span>Secure Document Vault</span>
          </div>

          <h1 className="serif text-3xl md:text-5xl font-normal text-white mt-1">
            Team & Project Documents
          </h1>
          <p className="text-white/70 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
            Upload team profiles, project guidelines, or problem statements as PDFs. Your documents will be indexed to provide personalized answers and intelligent mentorship.
          </p>
        </div>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div className="grid grid-2 mt-4">
        <Card className="liquid-glass-card">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Team Details PDF
                {uploads.team_details && <CheckCircle size={18} className="text-emerald-400" />}
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                Verified Vault
              </span>
            </div>
            <p className="text-white/60 text-xs mt-1">
              Upload member resumes, role matrices, or team skills breakdown.
            </p>
          </div>
          <PdfDrop
            label="Team Details PDF"
            hint="Drag and drop or click to upload PDF (up to 10 MB)"
            value={uploads.team_details}
            disabled={busy}
            onFile={(file) => uploadDocument("team_details", file)}
          />
        </Card>

        <Card className="liquid-glass-card">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Project Spec / PRD PDF
                {uploads.project_description && <CheckCircle size={18} className="text-emerald-400" />}
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                Verified Vault
              </span>
            </div>
            <p className="text-white/60 text-xs mt-1">
              Upload problem statement, judging criteria, or architecture outline.
            </p>
          </div>
          <PdfDrop
            label="Project Description PDF"
            hint="Drag and drop or click to upload PDF (up to 10 MB)"
            value={uploads.project_description}
            disabled={busy}
            onFile={(file) => uploadDocument("project_description", file)}
          />
        </Card>
      </div>

      {busy && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mt-4 text-purple-200 text-sm">
          <Spinner />
          <span>Uploading and indexing document content for intelligent mentorship…</span>
        </div>
      )}

      {/* Document Guidelines & Security Card */}
      <Card className="liquid-glass-card mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-300">
            <ShieldCheck size={26} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <strong className="text-white text-base">Private & Encrypted Storage</strong>
              <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                Protected
              </span>
            </div>
            <p className="text-white/70 text-xs sm:text-sm mt-1 leading-relaxed">
              Your uploaded materials are stored securely in your private workspace. The AI mentor automatically references these files during chat sessions, roadmap planning, and judging preparation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
