import { shieldBrainSync } from "../engine/ShieldBrainSyncLayer";

export function runShieldSync() {
  return shieldBrainSync.sync();
}
