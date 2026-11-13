import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { BareLayout } from "./components/layout/BareLayout";
import { RequireOnboarding } from "./components/layout/RequireOnboarding";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./hooks/useTheme";
import LandingPage from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/Dashboard";
import { DocumentsPage } from "./pages/Documents";
import { MentorPage } from "./pages/Mentor";
import { MorePage } from "./pages/More";
import { OnboardingPage } from "./pages/Onboarding";
import { PitchPage } from "./pages/Pitch";
import { ProblemPage } from "./pages/Problem";
import { ResourcesPage } from "./pages/Resources";
import { ReviewPage } from "./pages/Review";
import { RoadmapPage } from "./pages/Roadmap";
import { SettingsPage } from "./pages/Settings";
import { TasksPage } from "./pages/Tasks";
import { TeamPage } from "./pages/Team";

function GuardedOnboarding() {
  const { onboarded, project } = useApp();
  if (onboarded && project) return <Navigate to="/dashboard" replace />;
  return <OnboardingPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Fullscreen Landing and Auth layouts (No sidebar) */}
            <Route element={<BareLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Onboarding flow */}
            <Route path="/onboarding" element={<GuardedOnboarding />} />

            {/* Application Dashboard & Tools (With Sidebar & Top Nav) */}
            <Route element={<RequireOnboarding />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/problem" element={<ProblemPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/mentor" element={<MentorPage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/pitch" element={<PitchPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/more" element={<MorePage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
