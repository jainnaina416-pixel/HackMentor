import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <section className={`card ${className}`.trim()} onClick={onClick}>
      {children}
    </section>
  );
}
