"use client";

import { useEffect, useState } from "react";
import DivergenceInsightBridge from "@/app/lib/analytics/DivergenceInsightBridge";

export default function DivergencePanel() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const bridge = new DivergenceInsightBridge();

    useEffect(() => {
        async function load() {
            setLoading(true);
            const result = await bridge.getUIIntelligence();
            setData(result);
            setLoading(false);
        }
        load();

        const interval = setInterval(load, 2000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="text-purple-300 opacity-50 text-sm">
                Loading divergence intelligence…
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-red-400 text-sm">
                No divergence data available.
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3 rounded-xl bg-black/30 backdrop-blur-md border border-purple-600/20 shadow-lg">
            <div className="text-lg font-bold text-purple-300">
                🔮 Divergence Intelligence
            </div>

            {data.message && (
                <div className="text-cyan-300 text-sm">{data.message}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.panels.map((p: any, idx: number) => (
                    <div
                        key={idx}
                        className="p-3 rounded-lg bg-purple-900/20 border border-purple-600/20"
                    >
                        <div className="font-semibold text-purple-200">
                            {p.title}
                        </div>
                        <div className="text-sm text-purple-300 opacity-80">
                            {p.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-xs text-purple-400 opacity-70">
                Status: {data.status}
            </div>
        </div>
    );
}
