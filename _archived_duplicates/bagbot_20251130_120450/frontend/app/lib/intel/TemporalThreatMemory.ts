// app/lib/intel/TemporalThreatMemory.ts
// Step 24.11 — Temporal Threat Memory Engine

interface ThreatEvent {
  level: "GREEN" | "YELLOW" | "RED";
  timestamp: number;
}

class TemporalThreatMemory {
  private memory: ThreatEvent[] = [];
  private decayMs = 3 * 60 * 60 * 1000; // 3 hours

  addEvent(level: "GREEN" | "YELLOW" | "RED") {
    this.memory.push({
      level,
      timestamp: Date.now(),
    });

    // Clean old events
    this.memory = this.memory.filter(
      (e) => Date.now() - e.timestamp <= this.decayMs
    );
  }

  getThreatScore(): number {
    let score = 0;

    const now = Date.now();
    for (const entry of this.memory) {
      const age = now - entry.timestamp;
      const weight = 1 - age / this.decayMs; // fades over time

      if (entry.level === "YELLOW") score += 1 * weight;
      if (entry.level === "RED") score += 3 * weight;
    }

    return Math.min(score, 5); // max danger cap
  }

  getMode(): "clear" | "memory-caution" | "memory-danger" {
    const score = this.getThreatScore();

    if (score >= 3) return "memory-danger";
    if (score >= 1) return "memory-caution";
    return "clear";
  }

  getMemoryCount(): number {
    return this.memory.length;
  }

  getRecentEvents(limit: number = 10): ThreatEvent[] {
    return this.memory.slice(-limit);
  }

  clear() {
    this.memory = [];
  }
}

export const temporalThreatMemory = new TemporalThreatMemory();
