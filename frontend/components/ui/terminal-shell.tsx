"use client";

import { CSSProperties, HTMLAttributes } from "react";

export type TerminalShellProps = HTMLAttributes<HTMLDivElement> & {
  safeArea?: boolean;
};

const basePadding = "1.5rem";
const inlinePadding = "clamp(0rem, 1vw, 1.5rem)";

export default function TerminalShell({
  safeArea = true,
  className = "",
  style,
  children,
  ...props
}: TerminalShellProps) {
  const shellClass = [
    "terminal-shell",
    "rounded-[1.5rem]",
    "border",
    "border-[color:var(--border-soft)]",
    "bg-base/60",
    "backdrop-blur-xl",
    "shadow-[0_25px_60px_rgba(12,8,4,0.35)]",
    "transition-all",
    "data-soft-fade"
  ]
    .join(" ")
    .trim();

  const paddingStyles: CSSProperties = safeArea
    ? {
        paddingTop: `calc(${basePadding} + env(safe-area-inset-top))`,
        paddingBottom: `calc(${basePadding} + env(safe-area-inset-bottom))`,
        paddingLeft: `calc(${inlinePadding} + env(safe-area-inset-left))`,
        paddingRight: `calc(${inlinePadding} + env(safe-area-inset-right))`,
      }
    : {
        paddingInline: inlinePadding,
        paddingTop: basePadding,
        paddingBottom: basePadding,
      };

  const mergedStyle: CSSProperties = { ...paddingStyles, ...style };

  return (
    <div className={`${shellClass} ${className}`.trim()} style={mergedStyle} {...props}>
      {children}
    </div>
  );
}
