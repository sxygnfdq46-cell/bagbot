import React from "react";
export function AlertPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 backdrop-blur-md shadow-lg">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm opacity-80">{message}</p>
    </div>
  );
}
