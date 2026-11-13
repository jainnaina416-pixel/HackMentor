import { formatTimeLeft, useCountdown } from "../../hooks/useCountdown";

export function Countdown({ deadlineAt, compact = false }: { deadlineAt: string; compact?: boolean }) {
  const t = useCountdown(deadlineAt) ?? formatTimeLeft(deadlineAt);
  if (compact) {
    return (
      <div className={`countdown ${t.urgency}`}>
        <strong>{t.expired ? "00:00:00" : compactLabel(t)}</strong>
      </div>
    );
  }
  return (
    <div className={`countdown ${t.urgency}`}>
      <strong className="hero-num">{t.expired ? "Time is up" : t.label}</strong>
    </div>
  );
}

function compactLabel(t: NonNullable<ReturnType<typeof useCountdown>>) {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (t.days > 0) return `${t.days}d ${pad(t.hours)}:${pad(t.minutes)}`;
  return `${pad(t.hours + t.days * 24)}:${pad(t.minutes)}:${pad(t.seconds)}`;
}
