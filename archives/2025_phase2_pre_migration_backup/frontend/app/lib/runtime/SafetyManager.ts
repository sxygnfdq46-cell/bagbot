export class SafetyManager {
  private overloadCounter = 0;
  private lastTickTime = 0;

  detectOverdrive() {
    const now = Date.now();
    const delta = now - this.lastTickTime;
    this.lastTickTime = now;

    // If ticks come too fast (runtime spiraling)
    if (delta < 50) {
      this.overloadCounter++;
    } else {
      this.overloadCounter = Math.max(0, this.overloadCounter - 1);
    }

    // Overload thresholds
    if (this.overloadCounter > 15) {
      return "critical";
    }
    if (this.overloadCounter > 7) {
      return "high";
    }
    return "normal";
  }

  applyStabilizer(status: "normal" | "high" | "critical") {
    switch (status) {
      case "normal":
        return { safeMode: false, speedMultiplier: 1.0 };

      case "high":
        return {
          safeMode: true,
          speedMultiplier: 1.4, // slow down
        };

      case "critical":
        return {
          safeMode: true,
          speedMultiplier: 2.0, // hard slow
          emergencyStop: true,
        };
    }
  }
}

export const safetyManager = new SafetyManager();
