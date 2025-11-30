/**
 * QUANTUM HOLOENGINE COMPONENTS
 * React wrappers for Level 4 visual effects
 */

'use client';

import { useEffect, useRef, useState } from 'react';

/* ========================================
   PARTICLE UNIVERSE (4-Layer System)
   ======================================== */

export function ParticleUniverse({ enabled = true }: { enabled?: boolean }) {
  if (!enabled) return null;

  return (
    <div className="particle-universe gpu-accelerated">
      {/* Layer 1: Dust (Depth) */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={`dust-${i}`}
          className="particle-layer-dust"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 12}s`,
            animationDuration: `${12 + Math.random() * 8}s`,
          }}
        />
      ))}

      {/* Layer 2: Micro Sparks (Data Reactive) */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={`spark-${i}`}
          className="particle-layer-spark"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Layer 3: Directional Streams */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`stream-${i}`}
          className="particle-layer-stream"
          style={{
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Layer 4: Gravity Pulls */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={`gravity-${i}`}
          className="particle-layer-gravity"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ========================================
   SIGNAL STORM (For Signals Page)
   ======================================== */

export function SignalStorm({ intensity = 1 }: { intensity?: number }) {
  const [arcs, setArcs] = useState<Array<{ id: number; path: string }>>([]);
  const arcIdRef = useRef(0);

  useEffect(() => {
    if (intensity === 0) return;

    const interval = setInterval(() => {
      // Generate random lightning arc path
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight * 0.3;
      const endX = Math.random() * window.innerWidth;
      const endY = startY + Math.random() * 300 + 200;
      
      const midX1 = startX + (Math.random() - 0.5) * 200;
      const midY1 = startY + (endY - startY) * 0.33;
      const midX2 = endX + (Math.random() - 0.5) * 200;
      const midY2 = startY + (endY - startY) * 0.66;

      const path = `M ${startX} ${startY} Q ${midX1} ${midY1}, ${(startX + endX) / 2} ${(startY + endY) / 2} Q ${midX2} ${midY2}, ${endX} ${endY}`;

      const newArc = { id: arcIdRef.current++, path };
      setArcs((prev) => [...prev, newArc]);

      // Remove arc after animation
      setTimeout(() => {
        setArcs((prev) => prev.filter((arc) => arc.id !== newArc.id));
      }, 800);
    }, 2000 / intensity);

    return () => clearInterval(interval);
  }, [intensity]);

  return (
    <div className="signal-storm">
      {/* Lightning Arcs */}
      <svg className="lightning-layer" style={{ width: '100%', height: '100%' }}>
        {arcs.map((arc) => (
          <path
            key={arc.id}
            d={arc.path}
            className="lightning-arc"
          />
        ))}
      </svg>

      {/* Static Shimmer */}
      <div className="static-shimmer" />

      {/* Energy Flows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`flow-${i}`}
          className="energy-flow"
          style={{
            left: `${20 + i * 20}%`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ========================================
   HYPERSPACE THREADLINE
   ======================================== */

export function HyperspaceThread({
  fromElement,
  toElement,
  duration = 500,
}: {
  fromElement: HTMLElement | null;
  toElement: HTMLElement | null;
  duration?: number;
}) {
  const [path, setPath] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!fromElement || !toElement) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + toRect.height / 2;

    // Create curved path
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 - 50; // Slight curve upward

    const threadPath = `M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`;
    setPath(threadPath);
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [fromElement, toElement, duration]);

  if (!visible || !path) return null;

  return (
    <svg className="hyperspace-thread">
      <path d={path} className="thread-line" />
    </svg>
  );
}

/* ========================================
   CAMERA DRIFT CONTAINER
   ======================================== */

export function CameraDrift({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const xPercent = (clientX / innerWidth - 0.5) * 2;
      const yPercent = (clientY / innerHeight - 0.5) * 2;

      containerRef.current.style.transform = `
        perspective(2000px)
        rotateY(${xPercent * 2}deg)
        rotateX(${-yPercent * 2}deg)
        translateZ(10px)
      `;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="camera-drift-container camera-drift-layer-1 camera-drift-layer-2"
      style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {children}
    </div>
  );
}

/* ========================================
   QUANTUM REACTIVE WRAPPER
   ======================================== */

export function QuantumReactive({
  children,
  trigger,
}: {
  children: React.ReactNode;
  trigger?: boolean;
}) {
  const [isReactive, setIsReactive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsReactive(true);
      const timer = setTimeout(() => setIsReactive(false), 300);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className={`${isReactive ? 'quantum-reactive fabric-bend' : ''}`}>
      {children}
    </div>
  );
}

/* ========================================
   AI AURA WRAPPER
   ======================================== */

export function AIAura({
  children,
  state = 'idle',
}: {
  children: React.ReactNode;
  state?: 'receiving' | 'processing' | 'active' | 'idle';
}) {
  return (
    <div className="ai-aura" data-state={state}>
      {children}
    </div>
  );
}

/* ========================================
   HOLOGRAM REFRACTION
   ======================================== */

export function HoloRefract({ children }: { children: React.ReactNode }) {
  return <div className="holo-refract gpu-accelerated">{children}</div>;
}

/* ========================================
   QUANTUM FIELD (For Metrics)
   ======================================== */

export function QuantumField({
  children,
  valueChanged,
}: {
  children: React.ReactNode;
  valueChanged?: boolean;
}) {
  const [showAfterGlow, setShowAfterGlow] = useState(false);

  useEffect(() => {
    if (valueChanged) {
      setShowAfterGlow(true);
      const timer = setTimeout(() => setShowAfterGlow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [valueChanged]);

  return (
    <div className="quantum-field">
      <div className={`value-update ${showAfterGlow ? 'value-afterglow' : ''}`}>
        {children}
      </div>
    </div>
  );
}

/* ========================================
   PARALLAX DEPTH LAYER
   ======================================== */

export function ParallaxDepth({
  children,
  depth = 1,
}: {
  children: React.ReactNode;
  depth?: 1 | 2 | 3;
}) {
  return (
    <div className="parallax-hover depth-layer" data-depth={depth}>
      {children}
    </div>
  );
}
