// src/pages/LandingPage.tsx
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import LandingNav from "../components/layout/LandingNav";
import { Sparkles, ArrowRight, Zap, Target, Shield, Users, BarChart3, Bot } from "lucide-react";

const STAR_COUNT = 180;

const LandingPage: React.FC = () => {
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const planetCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw starfield (fixed background, responsive to resize)
  useEffect(() => {
    const canvas = starCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderStars = () => {
      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = window.innerHeight);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      for (let i = 0; i < STAR_COUNT; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const size = Math.random() * 1.5 + 0.5;
        ctx.fillRect(x, y, size, size);
      }
    };

    renderStars();
    window.addEventListener("resize", renderStars);
    return () => window.removeEventListener("resize", renderStars);
  }, []);

  // Fallback planet rim drawing for mobile / when video doesn't autoplay
  useEffect(() => {
    const canvas = planetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderPlanet = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);
      const radius = Math.min(w, h) * 0.45;
      const centerX = w / 2;
      const centerY = h * 0.85;
      const startAngle = Math.PI;
      const endAngle = 0;
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "rgba(147,18,255,0.6)");
      gradient.addColorStop(0.5, "rgba(255,0,255,0.3)");
      gradient.addColorStop(1, "rgba(147,18,255,0.6)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
      ctx.stroke();
    };

    renderPlanet();
    window.addEventListener("resize", renderPlanet);
    return () => window.removeEventListener("resize", renderPlanet);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      {/* Starfield canvas (fixed across viewport, never stretched) */}
      <canvas
        ref={starCanvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Hero Header: contains Video and Hero Banner strictly scoped */}
      <header className="relative min-h-screen flex flex-col justify-between overflow-hidden z-10">
        {/* Video for desktop */}
        <div className="absolute inset-0 hidden md:block pointer-events-none overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover mix-blend-screen opacity-70 animate-fadeInVideo"
            src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttgJiOeOK0P00eCrQu/e859f229-8ebd-43fb-a5a0-58006ba75327.mp4"
          />
          {/* Bottom gradient fade into pure black */}
          <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
        </div>

        {/* Fallback canvas for mobile / no-video */}
        <div className="absolute inset-0 md:hidden pointer-events-none overflow-hidden">
          <canvas
            ref={planetCanvasRef}
            className="w-full h-full pointer-events-none"
          />
          <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
        </div>

        {/* Navigation */}
        <LandingNav />

        {/* Main hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center max-w-5xl mx-auto py-12 md:py-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 mb-6 animate-fadeInUp">
            <Sparkles size={14} className="text-purple-400" />
            <span>Next-Generation AI Project Companion</span>
          </div>

          <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight animate-fadeInUp mx-auto text-balance">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
              HackMentor
            </span>
            .<br className="hidden sm:inline" /> Build Smarter, Dream Bigger, Ship Together.
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-gray-300 animate-fadeInUp delay-200 mx-auto leading-relaxed text-balance">
            From your first idea to final pitch presentation: plan, build, track, and polish every project milestone with an intelligent AI mentor by your side.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fadeInUp delay-400">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 transition-all font-semibold text-white shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2 group active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-violet-500/40 hover:bg-violet-950/40 hover:border-violet-400 transition-all font-medium text-gray-200 flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Gentle hero spacer */}
        <div className="h-8 md:h-16 relative z-10" />
      </header>

      {/* About section */}
      <section id="about" className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-black text-center border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 animate-fadeInUp tracking-tight">
            More Than Just Project Management.
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-gray-300 text-base md:text-lg leading-relaxed text-balance">
            HackMentor empowers you to plan, execute, track, and evaluate projects with AI-driven guidance at every step. Whether you are a solo creator or a full hackathon team, our intelligent assistant helps you scope realism, eliminate blockers, and craft winning pitches.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="relative z-10 py-24 md:py-32 px-6 md:px-12 bg-black border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-4 animate-fadeInUp tracking-tight">
              Supercharge Every Phase of Your Sprint
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto text-balance leading-relaxed">
              Everything your team needs to stay aligned, resolve technical challenges, and present with confidence.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Bot,
                title: "24/7 AI Project Mentor",
                description: "Get real-time answers, tech stack suggestions, and tactical advice grounded in your project specs.",
              },
              {
                icon: Target,
                title: "Strategic Sprint Roadmap",
                description: "Break complex hackathon goals into clear stages with realistic deadlines and progress tracking.",
              },
              {
                icon: Zap,
                title: "Actionable Task Board",
                description: "Prioritize what matters today. Auto-assign engineering tasks and keep team bandwidth balanced.",
              },
              {
                icon: Shield,
                title: "Document Vault",
                description: "Upload problem briefs, project guidelines, and research papers for intelligent context indexing.",
              },
              {
                icon: Users,
                title: "Pitch & Presentation Builder",
                description: "Generate structured slide decks, demo talking points, and anticipated judge Q&A automatically.",
              },
              {
                icon: BarChart3,
                title: "Objective Project Review",
                description: "Simulate judge evaluations across innovation, feasibility, UX, and technical execution before final submission.",
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="p-7 rounded-2xl border border-violet-600/20 bg-white/[0.02] backdrop-blur-sm hover:border-violet-500/50 hover:bg-white/[0.04] transition-all shadow-lg hover:shadow-violet-500/15 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-purple-300 mb-5 group-hover:scale-110 transition-transform">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 text-center text-xs text-white/40 border-t border-white/10 bg-black">
        <p>© 2026 HackMentor. Build Smarter, Dream Bigger, Ship Together.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
