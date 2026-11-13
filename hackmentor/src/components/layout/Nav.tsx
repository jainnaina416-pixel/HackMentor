import {
  ClipboardList,
  Compass,
  FileUp,
  Flag,
  Home,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Presentation,
  ScanSearch,
  Settings,
  Sparkles,
  Users,
  Waypoints,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Badge } from "../ui/Badge";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/problem", label: "Problem", icon: ScanSearch },
  { to: "/documents", label: "Documents", icon: FileUp },
  { to: "/mentor", label: "Mentor", icon: MessageSquare },
  { to: "/roadmap", label: "Roadmap", icon: Waypoints },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/resources", label: "Resources", icon: Compass },
  { to: "/review", label: "Project Review", icon: Flag },
  { to: "/pitch", label: "Pitch", icon: Presentation },
  { to: "/team", label: "Team", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { demoMode, project } = useApp();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-500 shadow-[0_0_18px_rgba(168,85,247,0.5)] border border-white/20">
          <Sparkles size={17} className="text-white" />
        </div>
        <div>
          <strong className="tracking-tight text-white font-semibold">HackMentor</strong>
          <small className="text-purple-300/70 text-[11px] block">{project?.team.name ?? "Your team"}</small>
        </div>
      </div>
      <nav className="nav-list">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        {demoMode && <Badge tone="low">Demo mode</Badge>}
      </div>
    </aside>
  );
}

export function BottomNav() {
  const mobile = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/mentor", label: "Mentor", icon: MessageSquare },
    { to: "/roadmap", label: "Roadmap", icon: Waypoints },
    { to: "/tasks", label: "Tasks", icon: ClipboardList },
    { to: "/more", label: "More", icon: MoreHorizontal },
  ];
  return (
    <nav className="bottom-nav">
      {mobile.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
