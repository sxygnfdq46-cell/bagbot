"use client";

import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: string;
};

const baseStyles =
  "btn-premium inline-flex items-center justify-center rounded-[0.75rem] px-5 py-2 text-sm font-semibold tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--accent-gold)] text-black shadow-card hover:shadow-glow focus-visible:outline-[color:var(--accent-gold)]",
  secondary:
    "border border-[color:var(--border-soft)] text-[color:var(--text-main)] hover:border-[color:var(--accent-green)]",
  ghost:
    "text-[color:var(--text-main)] opacity-70 hover:text-[color:var(--accent-cyan)]"
};

export default function Button({
  variant = "primary",
  className = "",
  isLoading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = `${baseStyles} ${variants[variant]} ${isLoading ? 'opacity-70' : ''} ${className}`.trim();
  return (
    <button className={classes} data-variant={variant} disabled={disabled || isLoading} {...props}>
      {isLoading && (
        <span
          className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--text-main)]/30 border-t-transparent"
          aria-hidden
        />
      )}
      {isLoading ? loadingText ?? children : children}
    </button>
  );
}
