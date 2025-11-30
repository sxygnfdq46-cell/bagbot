'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroHoloSequenceProps {
  onComplete?: () => void;
}

export default function IntroHoloSequence({ onComplete }: IntroHoloSequenceProps) {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if intro has been shown this session
    const hasSeenIntro = sessionStorage.getItem('bagbot_intro_shown');
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    // Stage progression timeline
    const timers = [
      setTimeout(() => setStage(1), 500),      // Logo scan
      setTimeout(() => setStage(2), 1800),     // System init
      setTimeout(() => setStage(3), 3000),     // Neural grid
      setTimeout(() => setStage(4), 4200),     // Complete
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('bagbot_intro_shown', 'true');
        onComplete?.();
      }, 5000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(0, 246, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)
          `
        }}
      >
        {/* Animated Grid Background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 246, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 246, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Scanning Lines */}
        <motion.div
          initial={{ top: '-100%' }}
          animate={{ top: '200%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent blur-sm"
        />

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center gap-12">
          
          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={stage >= 1 ? { 
              scale: 1, 
              opacity: 1,
              rotateY: [0, 360],
            } : {}}
            transition={{ 
              scale: { duration: 0.8, ease: 'backOut' },
              opacity: { duration: 0.5 },
              rotateY: { duration: 2, ease: 'easeInOut' }
            }}
            className="relative"
          >
            {/* Holographic Rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={stage >= 1 ? {
                  scale: [0.8, 1.2, 1],
                  opacity: [0, 0.6, 0],
                } : {}}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="absolute inset-0 rounded-full border-2 border-cyan-500"
                style={{
                  width: '200px',
                  height: '200px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            {/* Main Logo */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 40px rgba(0, 246, 255, 0.6)',
                    '0 0 80px rgba(255, 0, 255, 0.6)',
                    '0 0 40px rgba(0, 246, 255, 0.6)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative w-32 h-32 rounded-full border-4 border-cyan-500 bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 backdrop-blur-xl flex items-center justify-center"
              >
                <span className="text-6xl font-bold bg-gradient-to-br from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
                  B
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Title Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={stage >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-2 tracking-wider">
              <span className="bg-gradient-to-r from-cyan-400 via-magenta-400 to-cyan-400 bg-clip-text text-transparent">
                BAGBOT
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={stage >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.4 }}
              className="text-cyan-400/80 text-sm tracking-widest font-mono"
            >
              AUTONOMOUS TRADING SYSTEM
            </motion.p>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={stage >= 2 ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="space-y-3 min-w-[400px]"
          >
            {/* System Init */}
            <StatusLine 
              label="SYSTEM INITIALIZATION"
              active={stage >= 2}
              complete={stage >= 3}
              delay={0}
            />
            
            {/* Neural Grid */}
            <StatusLine 
              label="NEURAL GRID SYNC"
              active={stage >= 3}
              complete={stage >= 4}
              delay={0.3}
            />
            
            {/* Trading Engine */}
            <StatusLine 
              label="TRADING ENGINE ONLINE"
              active={stage >= 3}
              complete={stage >= 4}
              delay={0.6}
            />
            
            {/* Risk Manager */}
            <StatusLine 
              label="RISK MANAGER ACTIVE"
              active={stage >= 3}
              complete={stage >= 4}
              delay={0.9}
            />
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={stage >= 2 ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="w-80 h-1 bg-gray-800 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 4, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-cyan-500 to-magenta-500"
              style={{
                boxShadow: '0 0 20px rgba(0, 246, 255, 0.8)',
              }}
            />
          </motion.div>

        </div>

        {/* Corner Accents */}
        {[
          { x: '0%', y: '0%', rotate: 0 },
          { x: '100%', y: '0%', rotate: 90 },
          { x: '100%', y: '100%', rotate: 180 },
          { x: '0%', y: '100%', rotate: 270 },
        ].map((pos, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={stage >= 1 ? { opacity: [0, 1, 0.6] } : {}}
            transition={{ duration: 1, delay: i * 0.1 }}
            className="absolute w-32 h-32"
            style={{
              left: pos.x,
              top: pos.y,
              transform: `translate(${pos.x === '100%' ? '-100%' : '0'}, ${pos.y === '100%' ? '-100%' : '0'}) rotate(${pos.rotate}deg)`,
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <motion.path
                d="M 0 20 L 0 0 L 20 0"
                stroke="url(#corner-gradient)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={stage >= 1 ? { pathLength: 1 } : {}}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
              <defs>
                <linearGradient id={`corner-gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f6ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ff00ff" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ))}

      </motion.div>
    </AnimatePresence>
  );
}

interface StatusLineProps {
  label: string;
  active: boolean;
  complete: boolean;
  delay: number;
}

function StatusLine({ label, active, complete, delay }: StatusLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={active ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-3 font-mono text-sm"
    >
      {/* Status Indicator */}
      <div className="relative w-4 h-4 flex-shrink-0">
        {active && !complete && (
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0.3, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-cyan-500"
          />
        )}
        <div 
          className={`absolute inset-0 rounded-full ${
            complete 
              ? 'bg-cyan-500 shadow-[0_0_10px_rgba(0,246,255,0.6)]' 
              : active 
                ? 'bg-cyan-500/50' 
                : 'bg-gray-700'
          }`}
        />
        {complete && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            viewBox="0 0 16 16"
            className="absolute inset-0 w-full h-full text-black"
          >
            <path
              d="M 3 8 L 6 11 L 13 4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </div>

      {/* Label */}
      <span className={`${
        complete ? 'text-cyan-400' : active ? 'text-cyan-400/60' : 'text-gray-600'
      }`}>
        {label}
      </span>

      {/* Dots Animation */}
      {active && !complete && (
        <span className="text-cyan-400/60">
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          >
            .
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          >
            .
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          >
            .
          </motion.span>
        </span>
      )}

      {/* Complete Checkmark */}
      {complete && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-cyan-400 ml-auto"
        >
          ✓ READY
        </motion.span>
      )}
    </motion.div>
  );
}
