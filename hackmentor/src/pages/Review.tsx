import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, Spinner } from "../components/ui/Feedback";
import { useApp } from "../context/AppContext";

export function ReviewPage() {
  const { project, reviewProject, busy } = useApp();
  if (!project) return null;
  const r = project.review;

  const blocks = r
    ? [
        ["Problem", r.problem],
        ["Solution", r.solution],
        ["Technical implementation", r.technicalImplementation],
        ["Innovation", r.innovation],
        ["Feasibility", r.feasibility],
        ["User experience", r.userExperience],
        ["Risks", r.risks],
        ["Missing pieces", r.missingPieces],
      ]
    : [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Project Review</h1>
          <p>Get objective AI evaluation of your project across judging criteria and feasibility.</p>
        </div>
        <Button onClick={reviewProject} disabled={busy}>
          {busy && <Spinner />} Review my project
        </Button>
      </div>
      {!r ? (
        <EmptyState title="No review yet" body="Generate an AI assessment of your idea, architecture, risks, and demo readiness." />
      ) : (
        <>
          {blocks.map(([title, body]) => (
            <Card key={title}>
              <h3>{title}</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                {body}
              </p>
            </Card>
          ))}
          <Card>
            <h3>Recommended next steps</h3>
            <ul>
              {r.recommendedNextSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
