"use client";
import React from "react";

export function DataStream({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-cyan-300 text-sm tracking-wider">
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}
