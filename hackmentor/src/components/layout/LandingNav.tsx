// src/components/layout/LandingNav.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-20 flex items-center justify-between px-6 py-4 mx-4 md:mx-auto max-w-6xl mt-4 glass-nav">
      {/* Brand */}
      <Link to="/" className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">HackMentor</span>
      </Link>

      {/* Desktop links */}
      <div className="hidden space-x-6 md:flex items-center">
        <a href="#about" className="text-sm text-gray-300 hover:text-white transition-colors">About</a>
        <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
        <Link
          to="/login"
          className="text-sm text-gray-300 hover:text-white transition-colors font-medium"
        >
          Sign In
        </Link>
        <Link
          to="/login"
          className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90 transition-all font-medium text-sm text-white shadow-lg shadow-purple-500/25 active:scale-95"
        >
          Get Started
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors text-white"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute inset-x-0 top-full mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl md:hidden">
          <div className="flex flex-col space-y-4 text-center items-center">
            <a href="#about" className="text-gray-300 hover:text-white transition-colors py-1" onClick={() => setOpen(false)}>About</a>
            <a href="#features" className="text-gray-300 hover:text-white transition-colors py-1" onClick={() => setOpen(false)}>Features</a>
            <Link
              to="/login"
              className="text-gray-300 hover:text-white transition-colors py-1 font-medium"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="w-full max-w-xs py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 font-medium text-white shadow-lg"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
