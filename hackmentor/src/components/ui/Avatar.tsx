export function Avatar({ name, hue }: { name: string; hue: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="avatar" style={{ background: `hsl(${hue} 42% 42%)` }} aria-hidden>
      {initials}
    </div>
  );
}
