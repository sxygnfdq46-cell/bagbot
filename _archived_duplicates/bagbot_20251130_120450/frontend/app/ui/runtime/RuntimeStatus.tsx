"use client";

import { useEffect, useState } from "react";

export default function RuntimeStatus() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/runtime-stream");

    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      setLogs((prev) => [parsed, ...prev].slice(0, 20)); // show last 20 ticks
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="bg-[#0a0a1a] p-6 rounded-xl border border-[#3f3f7a] mt-4">
      <h2 className="text-purple-400 font-bold text-lg">🧠 Live Brain Feed</h2>

      <div className="mt-3 text-purple-300 space-y-1">
        {logs.map((log, idx) => (
          <div key={idx} className="text-sm border-b border-purple-800 opacity-80 pb-1">
            <strong>{new Date(log.timestamp).toISOString()}</strong> → Shield: {log.shield} | Strategy:{" "}
            {log.strategy} | Decision: {log.decision} | Trade: {log.trade}
            <div className="mt-2 text-sm text-yellow-300">
              Safety State: {log.safetyLevel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
