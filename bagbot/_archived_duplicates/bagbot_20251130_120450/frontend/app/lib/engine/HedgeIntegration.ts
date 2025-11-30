import { autonomousHedgePathway } from "./AutonomousHedgePathwayEngine";

export function getCurrentHedgeSignal(): string {
  return autonomousHedgePathway.computeHedgeSignal();
}

export function getHedgeProfile() {
  return autonomousHedgePathway.getHedgeProfile();
}

export function isHedgeActive(): boolean {
  const signal = getCurrentHedgeSignal();
  return signal !== "NO_HEDGE";
}

export function isCrisisHedge(): boolean {
  return getCurrentHedgeSignal() === "CRISIS_HEDGE";
}

export function getHedgeSize(): number {
  return autonomousHedgePathway.getHedgeProfile().size;
}

export function shouldOpenHedge(): boolean {
  const signal = getCurrentHedgeSignal();
  return signal === "MICRO_HEDGE" || signal === "STABILIZER_HEDGE" || signal === "CRISIS_HEDGE";
}

export function getHedgeMultiplier(): number {
  const profile = autonomousHedgePathway.getHedgeProfile();
  return profile.size;
}
