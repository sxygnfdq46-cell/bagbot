import type { RuntimeIntent } from '@/lib/runtime/types';

export type RuntimeAuditRecord = {
  intent: RuntimeIntent['type'];
  target: string;
  value: string;
  timestamp: number;
  source: string;
};

const auditLog: RuntimeAuditRecord[] = [];

export const recordRuntimeAudit = (record: RuntimeAuditRecord) => {
  try {
    auditLog.push(record);
  } catch (_error) {
    /* audit is passive; ignore failures */
  }
};

export const getRuntimeAuditLog = () => auditLog;
