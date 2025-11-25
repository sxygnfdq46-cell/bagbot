"use client";
import React from "react";
export function AIOrb() {
  return (
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse"></div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 animate-spin-slow"></div>
      <div className="absolute inset-4 rounded-full bg-black/80 backdrop-blur-xl border border-cyan-500/40 shadow-lg shadow-cyan-500/30"></div>
    </div>
  );
}
