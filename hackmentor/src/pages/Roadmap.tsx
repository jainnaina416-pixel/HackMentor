import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ProgressBar } from "../components/ui/ProgressBar";
import { StatusBadge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Feedback";
import { useApp } from "../context/AppContext";

export function RoadmapPage() {
  const { project, generateRoadmap, busy } = useApp();
  if (!project) return null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Roadmap</h1>
          <p>Track your project stages and milestone deadlines across the hackathon sprint.</p>
        </div>
        <Button onClick={generateRoadmap} disabled={busy}>
          {busy && <Spinner />} Generate roadmap
        </Button>
      </div>
      <div className="list">
        {project.roadmap.stages.map((stage) => {
          const tasks = project.tasks.filter((t) => stage.taskIds.includes(t.id) || t.stageId === stage.id);
          return (
            <Card key={stage.id}>
              <div className="stage">
                <div className={`stage-dot ${stage.status}`} />
                <div>
                  <div className="row">
                    <h3>
                      {stage.order}. {stage.name}
                    </h3>
                    <StatusBadge status={stage.status} />
                  </div>
                  <p className="muted" style={{ margin: "8px 0" }}>
                    {stage.estimatedHours}h estimated · due {new Date(stage.deadlineAt).toLocaleString()}
                  </p>
                  <ProgressBar value={stage.progress} />
                  {tasks.length > 0 && (
                    <ul>
                      {tasks.map((t) => (
                        <li key={t.id}>
                          {t.name} · {t.status.replace("_", " ")}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
