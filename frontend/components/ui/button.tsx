"use client";

import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: string;
};

const baseStyles =
  "btn-premium surface-button inline-flex items-center justify-center rounded-[0.85rem] text-xs font-semibold uppercase tracking-[0.28em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<ButtonVariant, string> = {
  primary: "text-[color:var(--ink-soft)] focus-visible:outline-[color:var(--accent-gold)]",
  secondary: "text-[color:var(--text-main)] focus-visible:outline-[color:var(--accent-cyan)]",
  ghost: "text-[color:var(--text-main)] opacity-80 hover:opacity-100 focus-visible:outline-[color:var(--accent-violet)]"
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
