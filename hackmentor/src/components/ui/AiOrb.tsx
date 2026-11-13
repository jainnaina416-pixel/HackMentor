import { motion } from "motion/react";

interface AiOrbProps {
  size?: "sm" | "md" | "lg" | "hero";
  state?: "idle" | "thinking" | "speaking" | "listening";
  interactive?: boolean;
  className?: string;
}

export function AiOrb({
  size = "md",
  state = "idle",
  interactive = true,
  className = "",
}: AiOrbProps) {
  const containerSizeMap = {
    sm: "w-16 h-16",
    md: "w-28 h-28",
    lg: "w-36 h-36 md:w-40 md:h-40",
    hero: "w-48 h-48 md:w-56 md:h-56",
  };

  const sphereSizeMap = {
    sm: "w-14 h-14",
    md: "w-24 h-24",
    lg: "w-32 h-32 md:w-36 md:h-36",
    hero: "w-44 h-44 md:w-52 md:h-52",
  };

  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  return (
    <div
      className={`relative flex items-center justify-center flex-shrink-0 select-none ${containerSizeMap[size]} ${className}`}
      style={{ willChange: "transform" }}
    >
      {/* Outer ambient glow — strictly fixed and hardware accelerated */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.15, 1] : isListening ? [1, 1.2, 1] : isSpeaking ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: isThinking ? [0.6, 0.85, 0.6] : isListening ? [0.7, 0.95, 0.7] : [0.45, 0.6, 0.45],
        }}
        transition={{
          duration: isThinking ? 1.8 : isListening ? 1.2 : isSpeaking ? 1.4 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full blur-2xl pointer-events-none transform-gpu"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(139, 92, 246, 0.25) 50%, transparent 75%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Outer subtle rotating ring */}
      <div
        className="absolute inset-[-4px] rounded-full p-[1.5px] pointer-events-none opacity-50 transform-gpu"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(192, 132, 252, 0.8), rgba(96, 165, 250, 0.6), rgba(244, 114, 182, 0.7), rgba(192, 132, 252, 0.8))",
          borderRadius: "9999px",
        }}
      />

      {/* Main 3D Sphere — perfectly centered without DOM reflow */}
      <motion.div
        whileHover={interactive ? { scale: 1.04 } : undefined}
        animate={
          isSpeaking
            ? { scale: [1, 1.025, 0.99, 1.02, 1] }
            : isListening
            ? { scale: [1, 1.04, 1] }
            : { scale: [1, 1.015, 1] }
        }
        transition={{
          duration: isSpeaking ? 1.8 : isListening ? 1.4 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`ai-orb-sphere relative rounded-full shadow-2xl overflow-hidden transform-gpu ${sphereSizeMap[size]}`}
        style={{ willChange: "transform" }}
      >
        {/* Deep 3D base sphere with multi-stop radial gradient */}
        <div className="absolute inset-0 rounded-full ai-orb-body" />

        {/* Specular gloss top light highlight */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 32% 26%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.2) 28%, rgba(255, 255, 255, 0) 55%)",
          }}
        />

        {/* Two cute glowing pill lights in center (matching Reference Image 1) */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none z-10 opacity-90">
          <motion.span
            animate={{
              scaleY: isThinking ? [1, 0.2, 1] : [1, 1, 0.15, 1],
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: isThinking ? 0.8 : 3.5,
              repeat: Infinity,
              times: isThinking ? [0, 0.5, 1] : [0, 0.9, 0.94, 1],
            }}
            style={{ transformOrigin: "center" }}
            className="w-1.5 h-3 bg-white rounded-full shadow-[0_0_8px_#ffffff] transform-gpu"
          />
          <motion.span
            animate={{
              scaleY: isThinking ? [1, 0.2, 1] : [1, 1, 0.15, 1],
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: isThinking ? 0.8 : 3.5,
              repeat: Infinity,
              times: isThinking ? [0, 0.9, 0.94, 1] : [0, 0.9, 0.94, 1],
              delay: isThinking ? 0.1 : 0,
            }}
            style={{ transformOrigin: "center" }}
            className="w-1.5 h-3 bg-white rounded-full shadow-[0_0_8px_#ffffff] transform-gpu"
          />
        </div>

        {/* Bottom rim reflection */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 88%, rgba(192, 132, 252, 0.65) 0%, rgba(139, 92, 246, 0.2) 32%, transparent 60%)",
          }}
        />
      </motion.div>
    </div>
  );
}

/**
 * Animated Waveform Bars (smooth GPU-accelerated scaleY transforms, zero layout reflow)
 */
export function WaveformVisualizer({ active = false }: { active?: boolean }) {
  const heights = [0.4, 0.75, 0.55, 0.9, 0.65, 0.8, 0.45, 0.95, 0.6, 0.85, 0.5, 0.7];

  return (
    <div className="flex items-end gap-[2px] h-3.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden">
      {heights.map((h, idx) => (
        <motion.span
          key={idx}
          style={{
            transformOrigin: "bottom",
            height: "100%",
            willChange: "transform",
          }}
          animate={
            active
              ? {
                  scaleY: [h * 0.3, h, h * 0.4],
                  opacity: [0.6, 1, 0.6],
                }
              : {
                  scaleY: 0.3,
                  opacity: 0.5,
                }
          }
          transition={{
            duration: 0.7 + (idx % 4) * 0.12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-[2px] rounded-full bg-gradient-to-t from-purple-400 to-indigo-300 transform-gpu"
        />
      ))}
    </div>
  );
}
