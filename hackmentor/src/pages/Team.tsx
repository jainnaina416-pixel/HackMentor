import { useState } from "react";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useApp } from "../context/AppContext";
import type { TeamMember } from "../types";

export function TeamPage() {
  const { project, updateMember } = useApp();
  const [editing, setEditing] = useState<TeamMember | null>(null);
  if (!project) return null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{project.team.name}</h1>
          <p>{project.team.members.length} members · workload is derived from assigned tasks.</p>
        </div>
      </div>
      <div className="grid grid-2">
        {project.team.members.map((m) => {
          const mine = project.tasks.filter((t) => t.assigneeId === m.id);
          const done = mine.filter((t) => t.status === "DONE").length;
          const open = mine.filter((t) => t.status !== "DONE").length;
          const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
          return (
            <Card key={m.id}>
              <div className="row">
                <div className="row" style={{ justifyContent: "flex-start" }}>
                  <Avatar name={m.name} hue={m.avatarHue} />
                  <div>
                    <h3>{m.name}</h3>
                    <p className="muted">{m.role}</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setEditing(m)}>
                  Edit
                </Button>
              </div>
              <div className="chip-row" style={{ margin: "12px 0" }}>
                {m.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              <p className="muted">
                Workload: {open} open · {done} done
              </p>
              <ProgressBar value={pct} />
              <ul>
                {mine.slice(0, 4).map((t) => (
                  <li key={t.id}>
                    {t.name} · {t.status.replace("_", " ")}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <Modal open={!!editing} title="Update member" onClose={() => setEditing(null)}>
        {editing && (
          <div className="grid">
            <div className="field">
              <label>Name</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Role</label>
              <input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
            </div>
            <div className="field">
              <label>Skills (comma separated)</label>
              <input
                value={editing.skills.join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </div>
            <Button
              onClick={() => {
                updateMember(editing);
                setEditing(null);
              }}
            >
              Save
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
