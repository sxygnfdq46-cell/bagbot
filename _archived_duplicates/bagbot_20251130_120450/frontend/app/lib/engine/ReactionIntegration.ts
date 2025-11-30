import { dynamicReactionPathway } from "./DynamicReactionPathwayEngine";

export function getCurrentReaction(): string {
  return dynamicReactionPathway.evaluateReaction();
}

export function getReactionProfile() {
  return dynamicReactionPathway.getReactionProfile();
}

export function isSteadyMode(): boolean {
  return getCurrentReaction() === "SteadyMode";
}

export function isPauseMode(): boolean {
  return getCurrentReaction() === "PauseMode";
}

export function isLockdownMode(): boolean {
  return getCurrentReaction() === "LockdownMode";
}

export function isHedgeMode(): boolean {
  return getCurrentReaction() === "HedgeMode";
}

export function isReverseMode(): boolean {
  return getCurrentReaction() === "ReverseMode";
}

export function shouldBlockTrades(): boolean {
  const mode = getCurrentReaction();
  return mode === "PauseMode" || mode === "LockdownMode";
}

export function shouldReduceLotSize(): boolean {
  const mode = getCurrentReaction();
  return mode === "ReduceMode" || mode === "MicroTradeMode";
}

export function getReactionLotMultiplier(): number {
  const mode = getCurrentReaction();
  switch (mode) {
    case "MicroTradeMode": return 0.1;
    case "ReduceMode": return 0.5;
    case "PauseMode": return 0;
    case "LockdownMode": return 0;
    default: return 1.0;
  }
}
