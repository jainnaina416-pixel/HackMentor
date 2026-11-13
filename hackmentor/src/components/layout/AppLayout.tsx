import { Moon, Sun } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { Button } from "../ui/Button";
import { ErrorBanner } from "../ui/Feedback";
import { BottomNav, Sidebar } from "./Nav";

export function AppLayout() {
  const { project, error } = useApp();
  const { theme, toggle } = useTheme();
  // const navigate = useNavigate(); // not needed in layout


  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{project?.hackathon.name}</div>
          </div>
          <div className="row">
            <Link to="/mentor">
              <Button>Ask Mentor</Button>
            </Link>
            <Button variant="ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>


          </div>
        </header>
        <ErrorBanner message={error} />
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
