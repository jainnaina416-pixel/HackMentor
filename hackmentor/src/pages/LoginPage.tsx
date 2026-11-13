// Updated LoginPage with Google Identity Services integration
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Mail, Lock, User, ArrowRight, X, PlusCircle, Check } from "lucide-react";
import { useApp } from "../context/AppContext";

interface GoogleAccount {
  name: string;
  email: string;
  avatarText: string;
  avatarBg: string;
}

const DEFAULT_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    name: "Nituj Sharma",
    email: "nituj.sharma@gmail.com",
    avatarText: "N",
    avatarBg: "bg-purple-600",
  },
  {
    name: "TechNova Lead",
    email: "team.lead@gmail.com",
    avatarText: "T",
    avatarBg: "bg-blue-600",
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, register, googleLogin, busy, error, setError, loadDemo } = useApp();
  const [authMethod, setAuthMethod] = useState<"options" | "email">("options");
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("team@hackmentor.demo");
  const [password, setPassword] = useState("mentor123");

  // Custom account input inside Google Chooser
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [showCustomGoogleForm, setShowCustomGoogleForm] = useState(false);

  // Check for incoming Google OAuth access_token from URL hash (fallback for demo mode)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        // Fetch user info from Google API
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.email) {
              void googleLogin({
                name: data.name || data.email.split("@")[0],
                email: data.email,
              }).then(() => navigate("/dashboard"));
            }
          })
          .catch(() => {
            loadDemo();
            navigate("/dashboard");
          });
      }
    }
  }, [googleLogin, loadDemo, navigate]);

  // Google Identity Services (GIS) popup flow
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            await googleLogin({ credential: response.credential });
            navigate("/dashboard");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Google sign‑in failed");
          }
        },
        auto_select: false,
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large" }
      );
    }
  }, [googleLogin, navigate, setError]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await signIn(email, password);
      }
      navigate("/dashboard");
    } catch {
      // Error handled in AppContext
    }
  };

  const handleSelectGoogleAccount = async (acc: { name: string; email: string }) => {
    try {
      await googleLogin(acc);
      setShowGoogleChooser(false);
      navigate("/dashboard");
    } catch {
      // Error handled
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail) return;
    const resolvedName =
      customGoogleName.trim() ||
      customGoogleEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    await handleSelectGoogleAccount({ name: resolvedName, email: customGoogleEmail.trim() });
  };

  const handleDemoLogin = () => {
    loadDemo();
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/20 to-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 max-w-6xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">HackMentor</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-6 py-8">
        <div className="liquid-glass border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-white/60">
              {isRegister
                ? "Join your team and build with your AI project mentor."
                : "Sign in to track sprints, documents, and pitch prep."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {authMethod === "options" ? (
            <div className="space-y-4">
              {/* Google Sign‑In button rendered by GIS */}
              <div id="google-signin-button" className="w-full flex items-center justify-center" />

              {/* Email Button */}
              <button
                type="button"
                onClick={() => setAuthMethod("email")}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-white font-semibold text-sm transition-all active:scale-[0.98]"
              >
                <Mail size={18} className="text-purple-300" />
                Sign in with Email
              </button>

              {/* Instant Demo Sandbox Entry */}
              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-purple-300 font-medium transition-colors"
                >
                  <Sparkles size={14} /> Quick Demo Access (No password required)
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-white/40" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required={isRegister}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-sm outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="team@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-white/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? "Signing in..." : isRegister ? "Create Account" : "Sign In"}
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod("options")}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  ← Other sign in options
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                >
                  {isRegister ? "Already registered? Sign in" : "New here? Create account"}
                </button>
              </div>
            </form>
          )}

          {showGoogleChooser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeInUp">
              <div className="relative w-full max-w-sm rounded-3xl bg-[#1f1f1f] border border-white/10 p-6 shadow-2xl text-left">
                <button onClick={() => setShowGoogleChooser(false)} className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors p-1">
                  <X size={18} />
                </button>

                {/* Google Header */}
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-white text-base">Choose an account</h3>
                    <p className="text-xs text-white/50">to continue to HackMentor</p>
                  </div>
                </div>

                {/* List of Accounts / Custom Account Form */}
                {!showCustomGoogleForm ? (
                  <div className="divide-y divide-white/5 my-2">
                    {DEFAULT_GOOGLE_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => handleSelectGoogleAccount(acc)}
                        className="w-full flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
                      >
                        <div className={`w-9 h-9 rounded-full ${acc.avatarBg} text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-md`}>{acc.avatarText}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">{acc.name}</div>
                          <div className="text-xs text-white/50 truncate">{acc.email}</div>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogleForm(true)}
                      className="w-full flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors text-left text-xs text-purple-300 font-medium"
                    >
                      <PlusCircle size={20} className="text-purple-400" />
                      <span>Use another Google account</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 mt-3">
                    <div>
                      <label className="block text-xs text-white/70 mb-1">Google Email</label>
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        required
                        autoFocus
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/70 mb-1">Display Name (Optional)</label>
                      <input
                        type="text"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCustomGoogleForm(false)}
                        className="flex-1 py-2 rounded-xl bg-white/5 text-xs text-white/60 hover:text-white"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} /> Continue
                      </button>
                    </div>
                  </form>
                )}

                <p className="text-[11px] text-white/30 text-center mt-4">
                  To continue, Google will share your name, email address, and profile picture with HackMentor.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/40">
        HackMentor · Empowering Teams to Build Better, Faster
      </footer>
    </div>
  );
}

export default LoginPage;
