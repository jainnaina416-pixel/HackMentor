import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowUp, Mic, MicOff, Sparkles, Lightbulb, Code2, Award, Clock } from "lucide-react";
import { AiOrb, WaveformVisualizer } from "../components/ui/AiOrb";
import { Spinner } from "../components/ui/Feedback";
import { ChatMessageView } from "../components/chat/ChatMessageView";
import { useApp } from "../context/AppContext";
import type { SourceCitation } from "../types";

// Types for Web Speech API
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

const PROMPT_CARDS = [
  {
    icon: Lightbulb,
    title: "Validate MVP Scope",
    desc: "Cut non-essential features for 24h",
    prompt: "Are we over-scoping this for a 24-hour hackathon? What is our core Tier-1 MVP?",
  },
  {
    icon: Code2,
    title: "Tech Stack & APIs",
    desc: "Fastest reliable libraries for our demo",
    prompt: "What is the fastest and most reliable architecture to build this MVP flow?",
  },
  {
    icon: Award,
    title: "Predict Judge Questions",
    desc: "Feasibility, scale & differentiation",
    prompt: "What hard technical and business questions will hackathon judges ask us?",
  },
  {
    icon: Clock,
    title: "Time & Priorities",
    desc: "What should we build first today?",
    prompt: "What should our team build first today before the scope freeze deadline?",
  },
];

export function MentorPage() {
  const { project, sendMentorMessage } = useApp();
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [streamingSources, setStreamingSources] = useState<SourceCitation[]>([]);
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Stable scrolling without jitter
  useEffect(() => {
    if (project?.messages.length) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [project?.messages.length]);

  useEffect(() => {
    if (streaming) {
      // Instant auto-scroll during token stream to avoid smooth animation fights
      endRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [streaming]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(async () => {
  if (isListening) {
    stopListening();
    return;
  }

  const SpeechRecognitionClass =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    setVoiceNotice("Speech recognition is supported in Chrome, Edge, and Safari.");
    setTimeout(() => setVoiceNotice(null), 4000);
    return;
  }

  try {
    // Request microphone permission explicitly
    await (navigator.mediaDevices as any)
      .getUserMedia({ audio: true })
      .then((stream: MediaStream) => {
        // Immediately stop the stream; we only needed permission
        stream.getTracks().forEach((t) => t.stop());
      })
      .catch((err: Error) => {
        setVoiceNotice(`Microphone permission denied: ${err.message}`);
        setTimeout(() => setVoiceNotice(null), 4000);
        setIsListening(false);
        // Abort further setup
        throw err;
      });

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceNotice("Listening... speak your question now.");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        setDraft(transcript);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") {
        setVoiceNotice(`Speech notice: ${e.error}`);
        setTimeout(() => setVoiceNotice(null), 3500);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setVoiceNotice(null), 2500);
    };

    recognitionRef.current = recognition;
    recognition.start();
  } catch (err) {
    console.error(err);
    setVoiceNotice(`Could not start microphone: ${err}`);
    setIsListening(false);
    setTimeout(() => setVoiceNotice(null), 4000);
  }
}, [isListening, stopListening]);

  if (!project) return null;

  const leadName = project.team.members[0]?.name?.split(" ")[0] || "Team";
  const orbState = isListening ? "listening" : sending ? "thinking" : streaming ? "speaking" : "idle";

  async function send(text: string) {
    if (isListening) {
      stopListening();
    }
    const message = text.trim();
    if (!message || sending) return;
    setDraft("");
    setSending(true);
    setStreaming("");
    setStreamingSources([]);
    await sendMentorMessage(
      message,
      (full) => setStreaming(full),
      undefined,
      (sources) => setStreamingSources(sources),
    );
    setStreaming("");
    setStreamingSources([]);
    setSending(false);
  }

  const hasChatStarted = project.messages.length > 1 || streaming;

  return (
    <div className="page mentor-ai-page">
      <div className="mentor-container">
        {/* Top AI Orb & Greeting Section */}
        <div className="mentor-hero-header">
          <AiOrb size="lg" state={orbState} />

          <div className="text-center mt-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium mb-2 transition-colors ${
              isListening
                ? "bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                : "bg-purple-500/10 border-purple-500/20 text-purple-300"
            }`}>
              <WaveformVisualizer active={isListening || sending || Boolean(streaming)} />
              <span>
                {isListening
                  ? "Listening to your voice..."
                  : sending
                  ? "Analyzing context..."
                  : streaming
                  ? "Streaming answer..."
                  : "HackMentor Voice & Assistant Ready"}
              </span>
            </div>

            <h1 className="serif mentor-greeting-title">
              Hello, {leadName}! How can I help you today?
            </h1>
            <p className="mentor-greeting-subtitle">
              {voiceNotice || `Context loaded: ${project.team.name} · ${project.hackathon.name} · AI Mentor active`}
            </p>
          </div>
        </div>

        {/* Quick Action Prompt Cards — aligned to chat width */}
        {!hasChatStarted && (
          <div className="mentor-quick-grid">
            {PROMPT_CARDS.map(({ icon: Icon, title, desc, prompt }, idx) => (
              <button
                key={idx}
                type="button"
                className="mentor-action-card"
                onClick={() => send(prompt)}
              >
                <div className="mentor-action-icon-wrap">
                  <Icon size={18} />
                </div>
                <div>
                  <strong className="mentor-action-title">{title}</strong>
                  <p className="mentor-action-desc">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Message Stream */}
        <div className="bubbles mentor-bubbles">
          {project.messages.map((m) => (
            <ChatMessageView
              key={m.id}
              role={m.role}
              content={m.content}
              sources={m.sources}
            />
          ))}
          {streaming && (
            <ChatMessageView
              role="assistant"
              content={streaming}
              sources={streamingSources}
              isStreaming
            />
          )}
          <div ref={endRef} />
        </div>

        {/* Floating Glassmorphic Pill Composer — aligned to container */}
        <div className="mentor-composer-anchor">
          <form
            className="mentor-pill-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <div className="mentor-composer-sparkle">
              <Sparkles size={18} />
            </div>

            <input
              type="text"
              value={draft}
              placeholder={
                isListening
                  ? "Listening... speak now, text will appear here"
                  : "Type or click the microphone to speak…"
              }
              onChange={(e) => setDraft(e.target.value)}
              disabled={sending}
              className="mentor-composer-input"
            />

            <div className="mentor-composer-actions">
              <button
                type="button"
                className={`mentor-composer-mic ${
                  isListening
                    ? "bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse"
                    : "hover:bg-purple-500/20 hover:text-purple-300"
                }`}
                title={isListening ? "Stop listening" : "Click to speak with voice"}
                onClick={toggleListening}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="mentor-composer-send"
              >
                {sending ? <Spinner /> : <ArrowUp size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
