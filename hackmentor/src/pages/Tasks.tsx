import { useMemo, useState } from "react";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, Spinner } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { useApp } from "../context/AppContext";
import type { Task, TaskPriority, TaskStatus } from "../types";

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const priorities: TaskPriority[] = ["low", "medium", "high", "critical"];

const blank = (deadlineAt: string): Task => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  assigneeId: null,
  priority: "medium",
  estimatedHours: 2,
  deadlineAt,
  status: "TODO",
});

export function TasksPage() {
  const { project, generateTasks, busy, upsertTask, deleteTask } = useApp();
  const [query, setQuery] = useState("");
  const [member, setMember] = useState("all");
  const [priority, setPriority] = useState("all");
  const [editing, setEditing] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    if (!project) return [];
    return project.tasks.filter((t) => {
      const q = query.toLowerCase();
      const matchesQ = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      const matchesM = member === "all" || t.assigneeId === member;
      const matchesP = priority === "all" || t.priority === priority;
      return matchesQ && matchesM && matchesP;
    });
  }, [project, query, member, priority]);

  if (!project) return null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tasks</h1>
          <p>Organize, assign, and track engineering tasks for your hackathon sprint.</p>
        </div>
        <div className="row">
          <Button variant="ghost" onClick={() => setEditing(blank(project.hackathon.deadlineAt))}>
            Add task
          </Button>
          <Button onClick={generateTasks} disabled={busy}>
            {busy && <Spinner />} AI Generate Tasks
          </Button>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="field">
          <label>Search</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" />
        </div>
        <div className="field">
          <label>Member</label>
          <select value={member} onChange={(e) => setMember(e.target.value)}>
            <option value="all">Everyone</option>
            {project.team.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">All</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tasks match" body="Generate a plan or add a task by hand." />
      ) : (
        <div className="kanban">
          {statuses.map((status) => (
            <div key={status} className="kanban-col">
              <div className="row" style={{ marginBottom: 10 }}>
                <strong>{status.replace("_", " ")}</strong>
                <Badge>{String(filtered.filter((t) => t.status === status).length)}</Badge>
              </div>
              {filtered
                .filter((t) => t.status === status)
                .map((task) => {
                  const who = project.team.members.find((m) => m.id === task.assigneeId);
                  return (
                    <Card key={task.id} className="task-card" onClick={() => setEditing(task)}>
                      <div className="row">
                        <h4>{task.name}</h4>
                        <Badge tone={task.priority}>{task.priority}</Badge>
                      </div>
                      <p className="muted" style={{ margin: "8px 0" }}>
                        {task.description}
                      </p>
                      <div className="row">
                        <span className="muted">{who?.name ?? "Unassigned"}</span>
                        <span className="muted">{task.estimatedHours}h</span>
                      </div>
                    </Card>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} title={editing && project.tasks.some((t) => t.id === editing.id) ? "Edit task" : "Add task"} onClose={() => setEditing(null)}>
        {editing && (
          <div className="grid">
            <div className="field">
              <label>Name</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label>Assignee</label>
                <select
                  value={editing.assigneeId ?? ""}
                  onChange={(e) => setEditing({ ...editing, assigneeId: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {project.team.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select
                  value={editing.priority}
                  onChange={(e) => setEditing({ ...editing, priority: e.target.value as TaskPriority })}
                >
                  {priorities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label>Status</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as TaskStatus })}>
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Estimated hours</label>
                <input
                  type="number"
                  value={editing.estimatedHours}
                  onChange={(e) => setEditing({ ...editing, estimatedHours: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="field">
              <label>Deadline</label>
              <input
                type="datetime-local"
                value={editing.deadlineAt.slice(0, 16)}
                onChange={(e) => setEditing({ ...editing, deadlineAt: new Date(e.target.value).toISOString() })}
              />
            </div>
            <div className="row">
              <Button
                variant="danger"
                onClick={() => {
                  deleteTask(editing.id);
                  setEditing(null);
                }}
              >
                Delete
              </Button>
              <Button
                onClick={() => {
                  if (!editing.name.trim()) return;
                  upsertTask(editing);
                  setEditing(null);
                }}
              >
                Save
              </Button>
            </div>
            <Button variant="soft" onClick={() => upsertTask({ ...editing, status: "DONE" })}>
              Mark complete
            </Button>
            {editing.status !== "DONE" && <StatusBadge status={editing.status} />}
          </div>
        )}
      </Modal>
    </div>
  );
}
