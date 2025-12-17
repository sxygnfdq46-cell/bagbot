import { useEffect, useState } from "react";

 type ExplainSnapshot = {
   status: string;
   market_data_source: string;
   reasons: string[];
   constraints: string[];
   context: {
     decision_action?: string | null;
     decision_confidence?: number | null;
     trace_id?: string | null;
   };
 };

 export default function BrainExplainPage() {
   const [snapshot, setSnapshot] = useState<ExplainSnapshot | null>(null);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
     let canceled = false;
     const load = async () => {
       try {
         const response = await fetch("/api/brain/explain");
         if (!response.ok) throw new Error(`status ${response.status}`);
         const payload = await response.json();
         if (canceled) return;
         setSnapshot(payload?.detail ?? null);
       } catch (err: any) {
         if (canceled) return;
         setError(err?.message ?? "failed to load explain snapshot");
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
         <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-gold, #d9b65a)" }}>Brain Explain</p>
         <h1 style={{ fontSize: "2rem", margin: 0 }}>Read-only decision introspection</h1>
         <p style={{ color: "var(--text-muted, #94a3b8)" }}>Status, reasons, constraints, and market context rendered without controls.</p>
       </header>

       {error && <div style={{ padding: "1rem", border: "1px solid #fca5a5", borderRadius: "0.75rem", color: "#ef4444" }}>Error: {error}</div>}

       {!error && !snapshot && <div style={{ padding: "1rem", border: "1px solid #334155", borderRadius: "0.75rem" }}>Loading explanation…</div>}

       {snapshot && (
         <section style={{ border: "1px solid #334155", borderRadius: "0.75rem", padding: "1rem", display: "grid", gap: "0.75rem", background: "rgba(12, 18, 28, 0.8)" }}>
           <div>
             <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Status</p>
             <p style={{ margin: "0.25rem 0 0", fontSize: "1.125rem" }}>{snapshot.status}</p>
           </div>

           <div>
             <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Market Context</p>
             <p style={{ margin: "0.25rem 0 0" }}>Source: {snapshot.market_data_source}</p>
             <p style={{ margin: "0.1rem 0 0", color: "var(--text-muted, #94a3b8)" }}>Trace: {snapshot.context?.trace_id || "—"}</p>
           </div>

           <div>
             <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Reasons</p>
             <ol style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem", display: "grid", gap: "0.25rem" }}>
               {snapshot.reasons?.map((reason, idx) => (
                 <li key={idx}>{reason}</li>
               )) || <li>none</li>}
             </ol>
           </div>

           <div>
             <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Constraints</p>
             <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem", display: "grid", gap: "0.25rem" }}>
               {snapshot.constraints?.map((constraint, idx) => (
                 <li key={idx}>{constraint}</li>
               )) || <li>none</li>}
             </ul>
           </div>

           <div>
             <p style={{ margin: 0, color: "var(--accent-cyan, #22d3ee)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Decision Context</p>
             <p style={{ margin: "0.25rem 0 0" }}>Action: {snapshot.context?.decision_action || "—"}</p>
             <p style={{ margin: "0.1rem 0 0" }}>Confidence: {snapshot.context?.decision_confidence ?? "—"}</p>
           </div>
         </section>
       )}
     </main>
   );
 }
