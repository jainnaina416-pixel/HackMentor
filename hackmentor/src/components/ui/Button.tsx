import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "soft" | "danger";
  icon?: ReactNode;
}

export function Button({ variant = "primary", icon, children, className = "", ...rest }: Props) {
  const v = variant === "primary" ? "" : variant;
  return (
    <button className={`btn ${v} ${className}`.trim()} {...rest}>
      {icon}
      {children}
    </button>
  );
}
