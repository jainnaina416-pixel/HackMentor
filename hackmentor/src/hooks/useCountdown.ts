import { useEffect, useMemo, useState } from "react";

export interface TimeLeft {
  totalMs: number;
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
  urgency: "calm" | "focus" | "critical";
}

function split(ms: number): Omit<TimeLeft, "label" | "urgency"> {
  const clamped = Math.max(0, ms);
  const seconds = Math.floor(clamped / 1000) % 60;
  const minutes = Math.floor(clamped / (1000 * 60)) % 60;
  const hours = Math.floor(clamped / (1000 * 60 * 60)) % 24;
  const days = Math.floor(clamped / (1000 * 60 * 60 * 24));
  return { totalMs: ms, expired: ms <= 0, days, hours, minutes, seconds };
}

export function formatTimeLeft(deadlineAt: string, now = Date.now()): TimeLeft {
  const parts = split(new Date(deadlineAt).getTime() - now);
  const label = parts.expired
    ? "Deadline passed"
    : parts.days > 0
      ? `${parts.days}d ${parts.hours}h ${parts.minutes}m remaining`
      : `${parts.hours} hours ${parts.minutes} minutes remaining`;

  const hoursLeft = parts.totalMs / 36e5;
  const urgency: TimeLeft["urgency"] =
    parts.expired || hoursLeft <= 6 ? "critical" : hoursLeft <= 18 ? "focus" : "calm";

  return { ...parts, label, urgency };
}

export function useCountdown(deadlineAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadlineAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadlineAt]);

  return useMemo(
    () => (deadlineAt ? formatTimeLeft(deadlineAt, now) : null),
    [deadlineAt, now],
  );
}
