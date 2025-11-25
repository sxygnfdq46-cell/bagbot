import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: "rectangular" | "circular" | "text";
}

export default function Skeleton({
  width = "100%",
  height = "1rem",
  className = "",
  variant = "rectangular",
}: SkeletonProps) {
  const radius =
    variant === "circular"
      ? "9999px"
      : variant === "text"
      ? "4px"
      : "8px";

  return (
    <div
      className={`animate-pulse bg-gray-700/40 ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
      }}
    ></div>
  );
}
