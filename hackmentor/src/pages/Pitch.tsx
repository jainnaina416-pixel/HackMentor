import { useState } from "react";
import { Sparkles, MessageSquare, Presentation, HelpCircle, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, Spinner } from "../components/ui/Feedback";
import { useApp } from "../context/AppContext";

export function PitchPage() {
  const { project, generatePitch, generateJudgeQuestions, busy } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!project) return null;
  const p = project.pitch;

  return (
    <div className="page">
      <div className="page-head flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="serif text-3xl md:text-4xl text-white">Pitch & Presentation</h1>
          <p className="text-white/70 text-sm mt-1">
            Generate your talk track, presentation slides, and rehearse anticipated judge questions.
          </p>
        </div>
        <div className="row flex items-center gap-2">
          <Button variant="ghost" onClick={generateJudgeQuestions} disabled={busy}>
            <HelpCircle size={15} /> Mock Q&A
          </Button>
          <Button onClick={generatePitch} disabled={busy} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white">
            {busy ? <Spinner /> : <Sparkles size={15} />} Generate Pitch
          </Button>
        </div>
      </div>

      {!p ? (
        <EmptyState
          title="No pitch generated yet"
          body="Click Generate Pitch above to synthesize your problem, architecture, demo flow, and slide deck outline."
        />
      ) : (
        <div className="space-y-6">
          {/* Main Pitch Headline */}
          <Card className="liquid-glass-card">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-purple-300 mb-2">
              <Presentation size={15} />
              <span>Core Elevator Pitch</span>
            </div>
            <p className="serif text-2xl md:text-3xl text-white leading-relaxed">
              {p.pitch || "A compelling solution engineered for real-world impact."}
            </p>
          </Card>

          {/* Presentation Slide Structure */}
          <Card className="liquid-glass-card">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-purple-300 mb-3">
              <Layers size={15} />
              <span>Recommended Slide Deck Flow</span>
            </div>
            <div className="space-y-3">
              {(p.structure || []).map((s, idx) => {
                if (typeof s === "string") {
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-sm text-white/90">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{s}</span>
                    </div>
                  );
                }
                const slide = s as any;
                return (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-purple-200 mb-1">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
                        {slide.slide_number ?? idx + 1}
                      </span>
                      <span>{slide.title || `Slide ${idx + 1}`}</span>
                    </div>
                    {Array.isArray(slide.bullets) && slide.bullets.length > 0 && (
                      <ul className="list-disc list-inside text-white/70 pl-6 mt-1 space-y-0.5 text-xs">
                        {slide.bullets.map((b: string, bIdx: number) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Problem & Solution Explanations */}
          <div className="grid grid-2">
            <Card className="liquid-glass-card">
              <h3 className="text-base font-semibold text-white mb-2">Problem Statement Framing</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {p.problemExplanation || "Clear articulation of user pain points and current limitations."}
              </p>
            </Card>

            <Card className="liquid-glass-card">
              <h3 className="text-base font-semibold text-white mb-2">Solution Framing</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {p.solutionExplanation || "Targeted technical approach delivering reliable, scalable value."}
              </p>
            </Card>
          </div>

          {/* Architecture Explanation */}
          <Card className="liquid-glass-card">
            <h3 className="text-base font-semibold text-white mb-2">Technical Architecture for Judges</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              {p.architectureExplanation || "Modular, modern stack balancing execution speed with architectural robustness."}
            </p>
          </Card>

          {/* Demo Flow & Talking Points */}
          <div className="grid grid-2">
            <Card className="liquid-glass-card">
              <h3 className="text-base font-semibold text-white mb-3">Live Demo Walkthrough</h3>
              <div className="space-y-2">
                {(p.demoFlow || []).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-white/80 py-1 border-b border-white/5 last:border-0">
                    <CheckCircle2 size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{typeof step === "string" ? step : JSON.stringify(step)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="liquid-glass-card">
              <h3 className="text-base font-semibold text-white mb-3">Key Talking Points</h3>
              <div className="space-y-2">
                {(p.talkingPoints || []).map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-white/80 py-1 border-b border-white/5 last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-2" />
                    <span>{typeof pt === "string" ? pt : JSON.stringify(pt)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Judge Q&A Rehearsal */}
          <Card className="liquid-glass-card">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-purple-300 mb-3">
              <MessageSquare size={15} />
              <span>Anticipated Judge Questions & Answers</span>
            </div>
            <div className="space-y-3 mt-2">
              {(p.judgeQuestions || []).length === 0 ? (
                <p className="text-sm text-white/50 py-2">
                  Click "Mock Q&A" to generate customized questions tailored to your solution.
                </p>
              ) : (
                (p.judgeQuestions || []).map((q, idx) => {
                  const qId = q.id || `q-${idx}`;
                  const isOpen = openId === qId;
                  return (
                    <div key={qId} className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : qId)}
                        className="w-full flex items-center justify-between p-4 text-left font-medium text-sm text-white hover:bg-white/5 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-purple-300 font-mono text-xs">Q{idx + 1}.</span>
                          <span>{q.question}</span>
                        </span>
                        <span className="text-xs text-purple-300 font-semibold ml-2">
                          {isOpen ? "Hide Answer" : "View Answer"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-purple-950/20 text-xs sm:text-sm text-white/80 leading-relaxed">
                          <strong className="text-purple-200 block mb-1">Recommended Response:</strong>
                          {q.suggestedAnswer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
