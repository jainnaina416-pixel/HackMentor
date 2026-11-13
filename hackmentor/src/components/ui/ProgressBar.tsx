export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} role="progressbar">
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
