"use client";

import { useEffect, useRef } from "react";

type TelemetryIntervalOptions = {
  intervalMs: number;
  onTick: () => void;
};

export function useTelemetryInterval({ intervalMs, onTick }: TelemetryIntervalOptions) {
  const callbackRef = useRef(onTick);

  useEffect(() => {
    callbackRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined" || intervalMs <= 0) {
      return;
    }

    let rafId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let lastTimestamp = 0;

    const clearTimers = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const runWithRaf = () => {
      clearTimers();
      const loop = (timestamp: number) => {
        if (timestamp - lastTimestamp >= intervalMs) {
          lastTimestamp = timestamp;
          callbackRef.current();
        }
        rafId = requestAnimationFrame(loop);
      };
      lastTimestamp = performance.now();
      rafId = requestAnimationFrame(loop);
    };

    const runWithInterval = () => {
      clearTimers();
      intervalId = setInterval(() => {
        callbackRef.current();
      }, intervalMs);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        runWithInterval();
      } else {
        runWithRaf();
      }
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility, { passive: true });

    return () => {
      clearTimers();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs]);
}
