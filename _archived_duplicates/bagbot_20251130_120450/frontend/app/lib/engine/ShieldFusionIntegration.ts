import { shieldFusion } from "./ShieldFusionSynchronizer";

export function getShieldFusionSignal() {
  return shieldFusion.generateFusionSignal();
}

export function getShieldScore(): number {
  return shieldFusion.generateFusionSignal().score;
}

export function getShieldClassification(): string {
  return shieldFusion.generateFusionSignal().classification;
}

export function isLowThreat(): boolean {
  return getShieldClassification() === "LOW_THREAT";
}

export function isCriticalThreat(): boolean {
  return getShieldClassification() === "CRITICAL_THREAT";
}

export function getShieldRootCause(): string {
  return shieldFusion.generateFusionSignal().rootCause;
}

export function getShieldHedgeMode(): string {
  return shieldFusion.generateFusionSignal().hedge;
}
