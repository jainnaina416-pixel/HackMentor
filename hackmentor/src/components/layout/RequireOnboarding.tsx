import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export function RequireOnboarding() {
  const { onboarded, project } = useApp();
  if (!onboarded || !project) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
