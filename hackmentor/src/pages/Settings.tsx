import { useApp } from "../context/AppContext";
import { isDemoMode, getApiBaseUrl } from "../api/client";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useTheme } from "../hooks/useTheme";

export function SettingsPage() {
  const { reset, demoMode } = useApp();
  const { theme, toggle } = useTheme();
  const base = getApiBaseUrl();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Theme, demo data, and backend connection. PWA install is intentionally not included yet.</p>
        </div>
      </div>
      <Card>
        <h3>Appearance</h3>
        <p className="muted" style={{ margin: "8px 0 12px" }}>
          Current theme: {theme}
        </p>
        <Button onClick={toggle}>Switch to {theme === "light" ? "dark" : "light"} mode</Button>
      </Card>
      <Card>
        <h3>Backend</h3>
        <p className="muted" style={{ margin: "8px 0" }}>
          Requests go to <code>VITE_API_URL</code>. Demo mode is {demoMode || isDemoMode() ? "on" : "off"}.
        </p>
        <p>
          Current base URL: <strong>{base || "(empty — demo)"}</strong>
        </p>
        <div style={{ marginTop: 12 }}>
          <Badge tone="low">{demoMode ? "Using mock service layer" : "Using live API"}</Badge>
        </div>
      </Card>
      <Card>
        <h3>Workspace</h3>
        <p className="muted" style={{ margin: "8px 0 12px" }}>
          Resetting clears onboarding and local project state from this browser.
        </p>
        <Button variant="danger" onClick={reset}>
          Reset and start over
        </Button>
      </Card>
    </div>
  );
}
