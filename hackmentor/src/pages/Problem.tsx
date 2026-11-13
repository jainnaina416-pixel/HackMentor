import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, Spinner } from "../components/ui/Feedback";
import { useApp } from "../context/AppContext";

const sections = [
  ["simpleWords", "Problem in simple words"],
  ["coreProblem", "Core problem"],
] as const;

export function ProblemPage() {
  const { project, analyzeProblem, busy } = useApp();
  if (!project) return null;
  const a = project.analysis;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Problem</h1>
          <p>Keep the original statement visible. Analysis comes from your backend.</p>
        </div>
        <Button onClick={analyzeProblem} disabled={busy}>
          {busy && <Spinner />} Analyze Problem
        </Button>
      </div>

      <Card>
        <h3>Original statement</h3>
        <p style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{project.problemStatement}</p>
      </Card>

      {!a ? (
        <EmptyState
          title="No analysis yet"
          body="Analyze your problem statement to extract core challenges, target users, and technical constraints."
          action={
            <Button onClick={analyzeProblem} disabled={busy}>
              Analyze Problem
            </Button>
          }
        />
      ) : (
        <>
          {sections.map(([key, title]) => (
            <Card key={key}>
              <h3>{title}</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                {a[key]}
              </p>
            </Card>
          ))}
          <ListCard title="Target users" items={a.targetUsers} />
          <ListCard title="Requirements" items={a.requirements} />
          <ListCard title="Constraints" items={a.constraints} />
          <ListCard title="Important questions" items={a.importantQuestions} />
          <ListCard title="Possible directions" items={a.possibleDirections} />
          <ListCard title="Risks" items={a.risks} />
        </>
      )}
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}
