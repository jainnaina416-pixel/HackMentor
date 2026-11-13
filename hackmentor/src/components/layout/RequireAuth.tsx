import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export function RequireAuth() {
  const { session } = useApp();
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireDocuments() {
  const { docsSeen } = useApp();
  if (!docsSeen) return <Navigate to="/documents" replace />;
  return <Outlet />;
}
