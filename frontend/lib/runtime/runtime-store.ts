import type { RuntimeSnapshot } from '@/lib/runtime/types';

const INITIAL_SNAPSHOT: RuntimeSnapshot = {
  system: {},
  bot: {},
  brain: {},
  strategies: []
};

type Listener = (snapshot: RuntimeSnapshot) => void;

let snapshot: RuntimeSnapshot = INITIAL_SNAPSHOT;
const listeners = new Set<Listener>();

export const getRuntimeSnapshot = () => snapshot;

export const setRuntimeSnapshot = (next: RuntimeSnapshot) => {
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
};

export const updateRuntimeSnapshot = (updater: (prev: RuntimeSnapshot) => RuntimeSnapshot) => {
  setRuntimeSnapshot(updater(snapshot));
};

export const subscribeRuntimeSnapshot = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
