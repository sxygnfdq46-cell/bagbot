'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GodModeIntroProps {
  onComplete?: () => void;
}

export default function GodModeIntro({ onComplete }: GodModeIntroProps) {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if intro has been shown this session
    const hasSeenIntro = sessionStorage.getItem('bagbot_godmode_intro_shown');
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    // Preload audio
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sfx/intro-whisper.mp3');
      audioRef.current.volume = 0.6;
    }

    // Stage progression timeline (10-12 seconds total)
    const timers = [
      setTimeout(() => setStage(1), 800),      // Stage 1: Logo assembly
      setTimeout(() => setStage(2), 2000),     // Stage 2: Holographic activation
      setTimeout(() => setStage(3), 4000),     // Stage 3: Neural network
      setTimeout(() => setStage(4), 7000),     // Stage 4: System checks
      setTimeout(() => {
        // Play audio at stage 4
        audioRef.current?.play().catch(() => {});
      }, 7500),
      setTimeout(() => setStage(5), 10000),    // Stage 5: Fade out
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('bagbot_godmode_intro_shown', 'true');
        onComplete?.();
      }, 12000),
    ];

    return () => {
      timers.forEach(clearTimeout);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: stage < 5 ? 1 : 0 }}
        transition={{ duration: stage < 5 ? 0.8 : 2 }}
        className="god-mode-intro"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Starfield Background */}
        <div className="starfield-layer" style={{ opacity: 0.2 }}>
          {[...Array(150)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              initial={{ 
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                scale: 0,
                opacity: 0
              }}
              animate={{
                scale: [0, 1, 1],
                opacity: [0, Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2],
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 1.5,
                repeat: Infinity,
                repeatDelay: Math.random() * 3,
              }}
              style={{
                position: 'absolute',
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 0 4px #fff',
              }}
            />
          ))}
        </div>

        {/* Multi-layer Parallax Grid */}
        <div className="parallax-grid-container" style={{ position: 'absolute', inset: 0 }}>
          {[1, 2, 3].map((layer) => (
            <motion.div
              key={`grid-${layer}`}
              className="grid-layer"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={stage >= 2 ? {
                opacity: [0, 0.3, 0.3],
                scale: [1.2, 1, 1],
                y: [0, -50 * layer, -100 * layer],
              } : {}}
              transition={{
                duration: 8,
                delay: layer * 0.3,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(0, 246, 255, ${0.15 / layer}) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 246, 255, ${0.15 / layer}) 1px, transparent 1px)
                `,
                backgroundSize: `${80 * layer}px ${80 * layer}px`,
                transformStyle: 'preserve-3d',
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>

        {/* Digital Rain */}
        <div className="digital-rain" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={`rain-${i}`}
              initial={{ y: '-100%', opacity: 0 }}
              animate={stage >= 1 ? {
                y: '200%',
                opacity: [0, 0.8, 0],
              } : {}}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                left: `${(i / 30) * 100}%`,
                width: '2px',
                height: '100px',
                background: 'linear-gradient(180deg, transparent, #00f6ff, transparent)',
                filter: 'blur(1px)',
                willChange: 'transform',
              }}
            />
          ))}
        </div>

        {/* Central Content Container */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1000px',
        }}>
          
          {/* Energy Orb Background */}
          <motion.div
            className="energy-orb"
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={stage >= 0 ? {
              scale: [0, 1.5, 1.5],
              opacity: [0, 0.6, 0.6],
              rotate: [0, 360],
            } : {}}
            transition={{
              scale: { duration: 1.5, ease: 'backOut' },
              opacity: { duration: 1 },
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            }}
            style={{
              position: 'absolute',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 246, 255, 0.3) 0%, rgba(255, 0, 255, 0.2) 50%, transparent 70%)',
              filter: 'blur(40px)',
              willChange: 'transform, opacity',
            }}
          />

          {/* Reactor Core Pulse */}
          <motion.div
            className="reactor-core"
            animate={stage >= 4 ? {
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 246, 255, 0.5) 0%, transparent 70%)',
              filter: 'blur(60px)',
              opacity: 0.8,
              willChange: 'transform, opacity',
            }}
          />

          {/* Logo Assembly Container */}
          <div style={{ position: 'relative', width: '500px', height: '500px' }}>
            
            {/* Holographic Rings */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`ring-${i}`}
                className="holo-ring"
                initial={{ scale: 0.5, opacity: 0, rotateX: 75 }}
                animate={stage >= 2 ? {
                  scale: [0.5, 1 + i * 0.15, 1 + i * 0.15],
                  opacity: [0, 0.6, 0.6],
                  rotateX: [75, 0, 0],
                  rotateZ: [0, 360 * (i % 2 === 0 ? 1 : -1)],
                } : {}}
                transition={{
                  scale: { duration: 1.2, delay: i * 0.15 },
                  opacity: { duration: 0.8, delay: i * 0.15 },
                  rotateX: { duration: 1.5, delay: i * 0.15 },
                  rotateZ: { duration: 15 + i * 2, repeat: Infinity, ease: 'linear' },
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${250 + i * 60}px`,
                  height: `${250 + i * 60}px`,
                  border: `2px solid ${i % 2 === 0 ? '#00f6ff' : '#ff00ff'}`,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 20px ${i % 2 === 0 ? 'rgba(0, 246, 255, 0.6)' : 'rgba(255, 0, 255, 0.6)'}`,
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                }}
              />
            ))}

            {/* Logo Particle Assembly */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
              
              {/* Logo Shards */}
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 200;
                return (
                  <motion.div
                    key={`shard-${i}`}
                    initial={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={stage >= 1 ? {
                      x: 0,
                      y: 0,
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    } : {}}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.05,
                      ease: 'backOut',
                    }}
                    style={{
                      position: 'absolute',
                      width: '40px',
                      height: '40px',
                      background: `linear-gradient(135deg, #00f6ff, #ff00ff)`,
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                      filter: 'blur(1px)',
                      willChange: 'transform, opacity',
                    }}
                  />
                );
              })}

              {/* Main Logo */}
              <motion.div
                initial={{ scale: 0, opacity: 0, rotateY: 0 }}
                animate={stage >= 1 ? {
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1],
                  rotateY: [0, 360, 360],
                } : {}}
                transition={{
                  scale: { duration: 1.5, delay: 0.5, ease: 'backOut' },
                  opacity: { duration: 1, delay: 0.5 },
                  rotateY: { duration: 2, delay: 0.5 },
                }}
                style={{
                  position: 'relative',
                  width: '200px',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(circle, rgba(0, 246, 255, 0.2) 0%, transparent 70%)',
                  borderRadius: '50%',
                  border: '4px solid rgba(0, 246, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: `
                    0 0 40px rgba(0, 246, 255, 0.8),
                    0 0 80px rgba(0, 246, 255, 0.4),
                    inset 0 0 40px rgba(0, 246, 255, 0.2)
                  `,
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                }}
              >
                <motion.div
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(0, 246, 255, 0.8)',
                      '0 0 40px rgba(255, 0, 255, 0.8)',
                      '0 0 20px rgba(0, 246, 255, 0.8)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    fontSize: '96px',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #00f6ff 0%, #ff00ff 50%, #00f6ff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '4px',
                  }}
                >
                  B
                </motion.div>
              </motion.div>

              {/* Energy Arcs */}
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                  <motion.div
                    key={`arc-${i}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={stage >= 2 ? {
                      scale: [0, 1, 0],
                      opacity: [0, 0.8, 0],
                    } : {}}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1 + 1,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                    style={{
                      position: 'absolute',
                      width: '3px',
                      height: '120px',
                      background: 'linear-gradient(180deg, #00f6ff, transparent)',
                      transform: `rotate(${(angle * 180) / Math.PI}deg) translateY(-120px)`,
                      transformOrigin: 'bottom center',
                      filter: 'blur(2px)',
                      willChange: 'transform, opacity',
                    }}
                  />
                );
              })}

            </div>

            {/* Particle Burst Effects */}
            {[...Array(60)].map((_, i) => {
              const angle = Math.random() * Math.PI * 2;
              const distance = 100 + Math.random() * 200;
              const color = ['#00f6ff', '#ff00ff', '#8b5cf6'][Math.floor(Math.random() * 3)];
              return (
                <motion.div
                  key={`particle-${i}`}
                  initial={{ 
                    x: 250, 
                    y: 250, 
                    scale: 0, 
                    opacity: 0 
                  }}
                  animate={stage >= 1 ? {
                    x: 250 + Math.cos(angle) * distance,
                    y: 250 + Math.sin(angle) * distance,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  } : {}}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 1.5,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 3,
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'absolute',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 10px ${color}`,
                    willChange: 'transform, opacity',
                  }}
                />
              );
            })}

          </div>

          {/* Neural Network Connections */}
          {stage >= 3 && (
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {[...Array(15)].map((_, i) => {
                const x1 = Math.random() * 100;
                const y1 = Math.random() * 100;
                const x2 = Math.random() * 100;
                const y2 = Math.random() * 100;
                return (
                  <motion.line
                    key={`neural-${i}`}
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: [0, 1, 0],
                      opacity: [0, 0.6, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: 'easeInOut',
                    }}
                    stroke="#00f6ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{
                      filter: 'blur(1px)',
                    }}
                  />
                );
              })}
            </svg>
          )}

          {/* Scanning Sweep */}
          <motion.div
            className="scan-sweep"
            initial={{ top: '-10%', opacity: 0 }}
            animate={stage >= 2 && stage < 4 ? {
              top: ['0%', '100%'],
              opacity: [0, 0.8, 0],
            } : {}}
            transition={{
              duration: 2,
              repeat: 2,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '200px',
              background: 'linear-gradient(180deg, transparent, rgba(0, 246, 255, 0.3), rgba(255, 0, 255, 0.3), transparent)',
              filter: 'blur(20px)',
              willChange: 'transform, opacity',
            }}
          />

        </div>

        {/* System Status Display */}
        {stage >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              fontFamily: 'monospace',
              fontSize: '14px',
            }}>
              {[
                { label: 'NEURAL MATRIX', delay: 0 },
                { label: 'QUANTUM PROCESSOR', delay: 0.2 },
                { label: 'TRADING ENGINE', delay: 0.4 },
                { label: 'RISK MANAGER', delay: 0.6 },
              ].map((system, i) => (
                <motion.div
                  key={system.label}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: system.delay }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 24px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(0, 246, 255, 0.3)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {/* Status Indicator */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(0, 246, 255, 0.8)',
                        '0 0 20px rgba(0, 246, 255, 1)',
                        '0 0 10px rgba(0, 246, 255, 0.8)',
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#00f6ff',
                      flexShrink: 0,
                    }}
                  />
                  
                  <span style={{ 
                    color: '#00f6ff', 
                    flex: 1,
                    letterSpacing: '2px',
                  }}>
                    {system.label}
                  </span>
                  
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: system.delay + 0.5 }}
                    style={{ 
                      color: '#0f0', 
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                    }}
                  >
                    ✓ ONLINE
                  </motion.span>
                </motion.div>
              ))}
            </div>

            {/* Voice Text Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ 
                duration: 4, 
                delay: 0.5,
                times: [0, 0.1, 0.9, 1],
              }}
              style={{
                marginTop: '32px',
                textAlign: 'center',
                fontSize: '18px',
                color: '#00f6ff',
                fontFamily: 'monospace',
                letterSpacing: '3px',
                textShadow: '0 0 20px rgba(0, 246, 255, 0.8)',
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                INITIALIZING BAGBOT SYSTEM...
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                NEURAL SYNC COMPLETE...
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 }}
                style={{ fontSize: '24px', marginTop: '8px' }}
              >
                WELCOME BACK.
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Corner Brackets */}
        {[
          { top: '5%', left: '5%', rotate: 0 },
          { top: '5%', right: '5%', rotate: 90 },
          { bottom: '5%', right: '5%', rotate: 180 },
          { bottom: '5%', left: '5%', rotate: 270 },
        ].map((pos, i) => (
          <motion.div
            key={`corner-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={stage >= 1 ? { opacity: 0.8, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            style={{
              position: 'absolute',
              ...pos,
              width: '80px',
              height: '80px',
              transform: `rotate(${pos.rotate}deg)`,
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <motion.path
                d="M 0 30 L 0 0 L 30 0 M 0 30 L 0 0 L 30 0"
                stroke="#00f6ff"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={stage >= 1 ? { pathLength: 1 } : {}}
                transition={{ duration: 1, delay: i * 0.1 }}
                style={{
                  filter: 'drop-shadow(0 0 5px #00f6ff)',
                }}
              />
            </svg>
          </motion.div>
        ))}

      </motion.div>
    </AnimatePresence>
  );
}
