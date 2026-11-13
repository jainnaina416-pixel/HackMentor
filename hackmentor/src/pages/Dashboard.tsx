import { ArrowRight, AlertTriangle, FileUp, Sparkles, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

import { ProgressBar } from "../components/ui/ProgressBar";
import { AiOrb } from "../components/ui/AiOrb";
import { useApp } from "../context/AppContext";

export function DashboardPage() {
  const { project } = useApp();
  if (!project) return null;
  const { dashboard, team, tasks, hackathon } = project;
  const done = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="page dashboard-page">
      {/* Hero Welcome Banner with glowing AI Orb */}
      <div className="dashboard-hero-card liquid-glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-300 mb-3">
            <Sparkles size={14} className="text-purple-300" />
            <span>{hackathon.name} · Active Sprint</span>
          </div>

          <h1 className="serif text-3xl md:text-5xl leading-tight font-normal text-white">
            {team.name}, here is where you stand.
          </h1>
          <p className="text-white/70 text-sm md:text-base mt-3 leading-relaxed">
            Your 24/7 AI mentor is tracking your MVP scope, project documents, and judging prep.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link to="/mentor">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-purple-500/25">
                <Sparkles size={16} /> Ask AI Mentor <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/documents">
              <Button variant="ghost" className="border-white/15 text-white hover:bg-white/5">
                <FileUp size={16} /> Document Vault
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <AiOrb size="md" interactive={true} />
        </div>
      </div>      {/* Overall Progress */}
      <Card className="liquid-glass-card">
        <div className="flex justify-between text-xs text-white/60 mb-2">
          <span>Overall Hackathon Progress</span>
          <span className="font-semibold text-purple-300">{dashboard.progressPercent}%</span>
        </div>
        <ProgressBar value={dashboard.progressPercent} />
      </Card>

      {/* Grid: Priority & Today's Plan */}
      <div className="grid grid-2">
        <Card className="liquid-glass-card">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-purple-300 mb-2">
            <Target size={15} />
            <span>AI Strategic Priority</span>
          </div>
          <h2 className="serif text-2xl md:text-3xl text-white mb-2">
            {dashboard.recommendation.headline}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            {dashboard.recommendation.body}
          </p>
          <Badge tone={dashboard.recommendation.urgency}>
            {`Priority: ${dashboard.recommendation.urgency}`}
          </Badge>
        </Card>

        <Card className="liquid-glass-card">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-purple-300 mb-2">
            <Zap size={15} />
            <span>Today's Critical Tasks</span>
          </div>
          <div className="list mt-3">
            {dashboard.todayPriorities.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="text-sm text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Grid: Upcoming, Blockers & Team */}
      <div className="grid grid-3">
        <Card className="liquid-glass-card">
          <h3 className="text-base font-semibold text-white mb-3">Upcoming Milestones</h3>
          <div className="list">
            {dashboard.upcomingDeadlines.map((d, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-sm">
                <span className="text-white/80">{d.label}</span>
                <span className="text-xs text-purple-300 font-mono">
                  {new Date(d.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="liquid-glass-card">
          <h3 className="text-base font-semibold text-white mb-3">Active Blockers</h3>
          <div className="list">
            {dashboard.blockers.length === 0 ? (
              <p className="text-sm text-emerald-400/80 flex items-center gap-2 py-2">
                ✓ No critical blockers flagged.
              </p>
            ) : (
              dashboard.blockers.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-rose-300 py-1.5">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="liquid-glass-card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-white">Team Bandwidth</h3>
            <span className="text-xs text-purple-300 font-semibold">{done}/{tasks.length} done</span>
          </div>

          <div className="flex flex-col gap-3">
            {team.members.map((m) => {
              const mine = tasks.filter((t) => t.assigneeId === m.id);
              const finished = mine.filter((t) => t.status === "DONE").length;
              return (
                <div key={m.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} hue={m.avatarHue} />
                    <div>
                      <strong className="block text-white text-xs">{m.name}</strong>
                      <span className="text-[11px] text-white/50">{m.role}</span>
                    </div>
                  </div>
                  <span className="text-xs text-white/60 font-mono">
                    {finished}/{mine.length || 0}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
