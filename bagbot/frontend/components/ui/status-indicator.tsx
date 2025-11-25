import React from "react";
export function StatusIndicator({ online }: { online: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${online ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
      <span className="text-sm opacity-70">{online ? "Online" : "Offline"}</span>
    </div>
  );
}
