import React from "react";

export interface ParchmentBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "card" | "banner" | "inset" | "chip";
  className?: string;
  hoverable?: boolean;
}

export function ParchmentBox({
  children,
  variant = "card",
  className = "",
  hoverable = false,
  ...props
}: ParchmentBoxProps) {
  const variantClass = {
    card: `parchment-card ${hoverable ? "parchment-card-hover" : ""}`,
    banner: "parchment-banner",
    inset: "parchment-inset",
    chip: `parchment-chip ${hoverable ? "parchment-chip-interactive" : ""}`,
  }[variant];

  return (
    <div className={`${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

export default ParchmentBox;
