"use client";

import { useState } from "react";

export default function RuntimeControls() {
  const [status, setStatus] = useState("stopped");
  const [speed, setSpeed] = useState(1000);

  async function sendCommand(command: "start" | "stop") {
    try {
      const res = await fetch("/api/runtime", {
        method: "POST",
        body: JSON.stringify({ command, speed }),
      });

      const data = await res.json();
      setStatus(command === "start" ? "running" : "stopped");
      console.log("Runtime Response:", data);
    } catch (err) {
      console.error("Runtime Control Error:", err);
    }
  }

  return (
    <div className="bg-[#0a0a1a] p-6 rounded-xl border border-[#3f3f7a] shadow-xl">
      <h2 className="text-xl font-bold text-purple-400">⚡ Brain Runtime Control</h2>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => sendCommand("start")}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          Start Runtime
        </button>

        <button
          onClick={() => sendCommand("stop")}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          Stop Runtime
        </button>
      </div>

      <div className="mt-6">
        <label className="text-purple-300">Tick Speed (ms)</label>
        <input
          type="number"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full mt-2 p-2 bg-black border border-purple-500 rounded"
        />
      </div>

      <div className="mt-6 text-purple-400 font-semibold">
        Status:{" "}
        {status === "running" ? (
          <span className="text-green-400">Running</span>
        ) : (
          <span className="text-red-400">Stopped</span>
        )}
      </div>
    </div>
  );
}
