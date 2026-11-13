import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { MOCK_PROBLEM_STATEMENT } from "../data/mock";
import type { TeamMember } from "../types";
import { Button } from "../components/ui/Button";
import { ErrorBanner, Spinner } from "../components/ui/Feedback";

const emptyMember = (i: number): TeamMember => ({
  id: crypto.randomUUID(),
  name: "",
  role: i === 0 ? "Team lead" : "",
  skills: [],
  avatarHue: 30 + i * 50,
});

export function OnboardingPage() {
  const { completeOnboarding, loadDemo, busy, error } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [hackathonName, setHackathonName] = useState("Smart India Hackathon");
  const [startAt, setStartAt] = useState(toLocal(new Date(Date.now() - 2 * 36e5)));
  const [deadlineAt, setDeadlineAt] = useState(toLocal(new Date(Date.now() + 30 * 36e5)));
  const [teamName, setTeamName] = useState("TechNova");
  const [count, setCount] = useState(4);
  const [members, setMembers] = useState<TeamMember[]>(() => Array.from({ length: 4 }, (_, i) => emptyMember(i)));
  const [problemStatement, setProblemStatement] = useState(MOCK_PROBLEM_STATEMENT);
  const [projectIdea, setProjectIdea] = useState("");
  const [tech, setTech] = useState("React, Python, FastAPI");

  const ready = useMemo(() => members.slice(0, count).every((m) => m.name && m.role), [members, count]);

  function updateCount(n: number) {
    const next = Math.min(8, Math.max(1, n));
    setCount(next);
    setMembers((prev) => {
      const copy = [...prev];
      while (copy.length < next) copy.push(emptyMember(copy.length));
      return copy;
    });
  }

  async function finish() {
    try {
      await completeOnboarding({
        hackathon: {
          name: hackathonName,
          startAt: new Date(startAt).toISOString(),
          deadlineAt: new Date(deadlineAt).toISOString(),
        },
        team: {
          name: teamName,
          members: members.slice(0, count).map((m) => ({
            ...m,
            skills: m.skills.length ? m.skills : splitSkills(tech),
          })),
        },
        problemStatement,
        projectIdea,
        knownTechnologies: splitSkills(tech),
      });
      navigate("/");
    } catch {
      /* error banner is set in context */
    }
  }

  return (
    <div className="onboard">
      <div className="onboard-card">
        <p className="muted">HackMentor</p>
        <h1 className="serif" style={{ fontSize: 42, marginTop: 6 }}>
          Set up your team in three quiet steps.
        </h1>
        <p className="muted" style={{ marginTop: 8 }}>
          This stays on the device until you connect your backend.
        </p>
        <div className="steps">
          {[0, 1, 2].map((s) => (
            <span key={s} className={s <= step ? "on" : ""} />
          ))}
        </div>
        <ErrorBanner message={error} />

        {step === 0 && (
          <div className="grid">
            <div className="field">
              <label>Hackathon name</label>
              <input value={hackathonName} onChange={(e) => setHackathonName(e.target.value)} />
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label>Start</label>
                <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div className="field">
                <label>Submission deadline</label>
                <input type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid">
            <div className="grid grid-2">
              <div className="field">
                <label>Team name</label>
                <input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              </div>
              <div className="field">
                <label>Number of members</label>
                <input type="number" min={1} max={8} value={count} onChange={(e) => updateCount(Number(e.target.value))} />
              </div>
            </div>
            {members.slice(0, count).map((m, i) => (
              <div key={m.id} className="grid grid-2">
                <div className="field">
                  <label>Member {i + 1} name</label>
                  <input
                    value={m.name}
                    onChange={(e) =>
                      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))
                    }
                  />
                </div>
                <div className="field">
                  <label>Role</label>
                  <input
                    value={m.role}
                    onChange={(e) =>
                      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role: e.target.value } : x)))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid">
            <div className="field">
              <label>Problem statement</label>
              <textarea rows={8} value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} />
            </div>
            <div className="field">
              <label>Initial project idea (optional)</label>
              <textarea rows={3} value={projectIdea} onChange={(e) => setProjectIdea(e.target.value)} />
            </div>
            <div className="field">
              <label>Technologies the team already knows</label>
              <input value={tech} onChange={(e) => setTech(e.target.value)} />
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: 22 }}>
          <Button variant="ghost" onClick={loadDemoAndGo}>
            Load TechNova demo
          </Button>
          <div className="row">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !ready}>
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={busy || !problemStatement || !hackathonName}>
                {busy && <Spinner />} Go to dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function loadDemoAndGo() {
    loadDemo();
    navigate("/");
  }
}

function splitSkills(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
