import { NavLink } from "react-router-dom";
import { Card } from "../components/ui/Card";

const links = [
  { to: "/problem", label: "Problem", body: "Statement and analysis" },
  { to: "/documents", label: "Documents", body: "Upload team and project documents" },
  { to: "/resources", label: "Resources", body: "Datasets, APIs, papers" },
  { to: "/review", label: "Project review", body: "Structured feedback" },
  { to: "/pitch", label: "Pitch", body: "Talk track and Q&A" },
  { to: "/team", label: "Team", body: "People, skills, load" },
  { to: "/settings", label: "Settings", body: "Theme and workspace" },
];

export function MorePage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>More</h1>
          <p>Everything that does not sit on the mobile tab bar.</p>
        </div>
      </div>
      <div className="grid">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to}>
            <Card>
              <h3>{l.label}</h3>
              <p className="muted">{l.body}</p>
            </Card>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
