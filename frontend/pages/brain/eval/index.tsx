import { useEffect, useState } from "react";

 type EvalSnapshot = {
   market_data_source?: string | null;
   decisions_total?: number;
   holds?: number;
   buys?: number;
   sells?: number;
   pn_l?: number;
   max_drawdown?: number;
   decision_ids?: string[];
   trace_ids?: string[];
   explain_snapshot?: Record<string, any> | null;
 };

 export default function BrainEvalPage() {
   const [snapshot, setSnapshot] = useState<EvalSnapshot | null>(null);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
     let canceled = false;
     const load = async () => {
       try {
         const response = await fetch("/api/brain/eval");
         if (!response.ok) throw new Error(`status ${response.status}`);
         const payload = await response.json();
         if (canceled) return;
         setSnapshot(payload?.detail ?? null);
       } catch (err: any) {
         if (canceled) return;
         setError(err?.message ?? "failed to load eval snapshot");
       }
     };
     load();
     return () => {
       canceled = true;
     };
   }, []);

   return (
     <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", display: "grid", gap: "1rem" }}>
       <header style={{ display: "grid", gap: "0.25rem" }}>
         <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-gold, #d9b65a)" }}>Brain Eval</p>
         <h1 style={{ fontSize: "2rem", margin: 0 }}>Read-only historical replay metrics</h1>
         <p style={{ color: "var(--text-muted, #94a3b8)" }}>Passive metrics correlated with decisions and explain snapshots.</p>
       </header>

       {error && <div style={{ padding: "1rem", border: "1px solid #fca5a5", borderRadius: "0.75rem", color: "#ef4444" }}>Error: {error}</div>}

       {!error && !snapshot && <div style={{ padding: "1rem", border: "1px solid #334155", borderRadius: "0.75rem" }}>Loading evaluation…</div>}

       {snapshot && (
         <section style={{ border: "1px solid #334155", borderRadius: "0.75rem", padding: "1rem", display: "grid", gap: "0.75rem", background: "rgba(12, 18, 28, 0.8)" }}>
           <div>
             <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Market Context</p>
             <p style={{ margin: "0.25rem 0 0" }}>Source: {snapshot.market_data_source || "UNKNOWN"}</p>
           </div>

           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
             <Metric label="Decisions" value={snapshot.decisions_total} />
             <Metric label="Buys" value={snapshot.buys} />
             <Metric label="Sells" value={snapshot.sells} />
             <Metric label="Holds" value={snapshot.holds} />
             <Metric label="P&L (hypo)" value={snapshot.pn_l} />
             <Metric label="Max Drawdown" value={snapshot.max_drawdown} />
           </div>

           <div>
             <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Decision IDs</p>
             <div style={{ marginTop: "0.35rem", display: "grid", gap: "0.25rem", fontFamily: "monospace", fontSize: "0.9rem" }}>
               {(snapshot.decision_ids || []).map((id) => (
                 <span key={id}>{id}</span>
               ))}
               {(!snapshot.decision_ids || snapshot.decision_ids.length === 0) && <span>none</span>}
             </div>
           </div>

           <div>
             <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Trace IDs</p>
             <div style={{ marginTop: "0.35rem", display: "grid", gap: "0.25rem", fontFamily: "monospace", fontSize: "0.9rem" }}>
               {(snapshot.trace_ids || []).map((id) => (
                 <span key={id}>{id}</span>
               ))}
               {(!snapshot.trace_ids || snapshot.trace_ids.length === 0) && <span>none</span>}
             </div>
           </div>
         </section>
       )}
     </main>
   );
 }

 function Metric({ label, value }: { label: string; value: number | string | undefined }) {
   return (
     <div style={{ border: "1px solid #334155", borderRadius: "0.65rem", padding: "0.75rem" }}>
       <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
       <p style={{ margin: "0.25rem 0 0", fontSize: "1.1rem" }}>{value ?? "—"}</p>
     </div>
   );
 }
