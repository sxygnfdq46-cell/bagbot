"use client";

import { HTMLAttributes, createElement } from "react";

type SupportedElements = "p" | "span" | "div" | "dt";

type MetricLabelProps = HTMLAttributes<HTMLElement> & {
  as?: SupportedElements;
  tone?: string;
};

export default function MetricLabel({
  as = "p",
  tone,
  className = "",
  children,
  style,
  ...props
}: MetricLabelProps) {
  const combinedClass = `metric-label ${className}`.trim();
  const toneStyle = tone ? { color: tone, ...(style ?? {}) } : style;

  return createElement(
    as,
    { className: combinedClass, style: toneStyle, ...props },
    children
  );
}
