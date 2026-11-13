import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorBanner, Spinner } from "../components/ui/Feedback";
import { useApp } from "../context/AppContext";
import { useTheme } from "../hooks/useTheme";

export function SignInPage() {
  const { session, signIn, register, busy, error, setError } = useApp();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("team@hackmentor.demo");
  const [password, setPassword] = useState("mentor123");

  if (session) return <Navigate to="/documents" replace />;

  async function submit() {
    try {
      if (mode === "register") await register(name, email, password);
      else await signIn(email, password);
      navigate("/documents");
    } catch {
      /* banner */
    }
  }

  return (
    <div className="onboard">
      <div className="onboard-card auth-card">
        <div className="row">
          <p className="muted">HackMentor</p>
          <Button variant="ghost" type="button" onClick={toggle}>
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
        <h1 className="serif" style={{ fontSize: 40, marginTop: 8 }}>
          {mode === "signin" ? "Sign in to your team space." : "Create a demo account."}
        </h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Not connected to a database yet. Accounts stay in this browser until you wire{" "}
          <code>POST /api/auth/login</code>.
        </p>
        <ErrorBanner message={error} />
        <form
          className="grid"
          style={{ marginTop: 20 }}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {mode === "register" && (
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" disabled={busy || password.length < 6}>
            {busy && <Spinner />} {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          Demo login: <strong>team@hackmentor.demo</strong> / <strong>mentor123</strong>
        </p>
        <Button
          variant="ghost"
          className="full"
          type="button"
          onClick={() => {
            setError(null);
            setMode(mode === "signin" ? "register" : "signin");
          }}
        >
          {mode === "signin" ? "New here? Create a demo account" : "Already have an account? Sign in"}
        </Button>
      </div>
    </div>
  );
}
