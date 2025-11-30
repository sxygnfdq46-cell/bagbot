'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { useTheme } from '../providers';
import { useState, useRef, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import { useAPI, useAPIMutation } from '@/lib/hooks/useAPI';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { AIAura, ParticleUniverse, HoloRefract } from '@/components/quantum/QuantumEffects';
import { AIEmotionAura, TemporalDisplacement } from '@/components/ascension/AscensionEffects';

export default function TerminalPage() {
  const { theme } = useTheme();
  const [command, setCommand] = useState('');
  const [terminalEmotion, setTerminalEmotion] = useState<'curious' | 'thinking' | 'excited' | 'confused' | 'confident' | 'idle'>('idle');
  const [output, setOutput] = useState<string[]>([
    '╔═══════════════════════════════════════════════════════════╗',
    '║           BAGBOT TERMINAL v2.0 — SYSTEM READY            ║',
    '╚═══════════════════════════════════════════════════════════╝',
    '',
    'Type "help" for available commands',
    '',
  ]);

  // Fetch safe commands
  const { data: safeCommands } = useAPI<any[]>('/api/terminal/safe-commands');

  // Execute command mutation
  const executeCommand = useAPIMutation('/api/terminal/execute', 'POST');

  // WebSocket for live command output
  const { data: liveOutput } = useWebSocket<any>({
    channel: 'terminal',
    enabled: true,
    autoConnect: true,
  });

  useEffect(() => {
    if (liveOutput?.output) {
      setOutput((prev) => [...prev, liveOutput.output]);
    }
  }, [liveOutput]);

  const handleExecuteCommand = async () => {
    if (!command.trim()) return;
    
    setOutput((prev) => [...prev, `> ${command}`]);
    const cmd = command.trim();
    setCommand('');

    try {
      const result = await executeCommand({ command: cmd });
      if (result.output) {
        setOutput((prev) => [...prev, result.output, '']);
      }
    } catch (error: any) {
      setOutput((prev) => [...prev, `Error: ${error.message || 'Command failed'}`, '']);
    }
  };

  return (
    <SciFiShell>
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
        <AIEmotionAura emotion={terminalEmotion} intensity={0.7}>
        <TemporalDisplacement active={liveOutput ? true : false}>
        <AIAura state={liveOutput ? 'active' : 'idle'}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <AnimatedText variant="breathe-cyan">
            <h1 
              className="text-4xl font-bold neon-text mb-2"
              style={{ color: theme.colors.neonCyan }}
            >
              Command Terminal
            </h1>
            </AnimatedText>
            <p style={{ color: theme.text.tertiary }}>
              Direct system interface and debugging console
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ 
                background: theme.colors.success,
                boxShadow: `0 0 15px ${theme.colors.success}` 
              }}
            />
            <span className="text-sm font-medium font-mono" style={{ color: theme.colors.success }}>
              CONNECTED
            </span>
          </div>
        </div>

        {/* Terminal Window */}
        <AnimatedCard variant="pulse-cyan" delay={100}>
        <HoloCard glowColor="cyan">
          <div
            className="font-mono text-sm p-6 rounded h-[600px] overflow-y-auto"
            style={{
              background: '#000000',
              color: theme.colors.neonCyan,
              border: `2px solid ${theme.border.active}`,
              boxShadow: `inset 0 0 30px rgba(0, 246, 255, 0.1), ${theme.shadows.glow.cyan}`,
            }}
          >
            {output.map((line, i) => (
              <div key={i} className="mb-1">
                {line}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span style={{ color: theme.colors.neonMagenta }}>{'>'}</span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ color: theme.colors.neonCyan }}
                placeholder="Enter command..."
                autoFocus
              />
              <span 
                className="w-2 h-4 animate-pulse"
                style={{ background: theme.colors.neonCyan }}
              />
            </div>
          </div>
        </HoloCard>
        </AnimatedCard>

        {/* Quick Commands */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedCard variant="pulse-cyan" delay={150}>
          <HoloCard title="System Commands" glowColor="cyan">
            <div className="space-y-2 font-mono text-sm">
              {[
                'status',
                'health',
                'logs',
                'restart',
              ].map((cmd) => (
                <div
                  key={cmd}
                  className="p-2 rounded cursor-pointer transition-smooth hover-lift hover-glow"
                  style={{
                    background: 'rgba(0, 246, 255, 0.1)',
                    border: `1px solid ${theme.border.subtle}`,
                    color: theme.colors.neonCyan,
                  }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </HoloCard>
          </AnimatedCard>

          <AnimatedCard variant="pulse-magenta" delay={200}>
          <HoloCard title="Trading Commands" glowColor="magenta">
            <div className="space-y-2 font-mono text-sm">
              {[
                'positions',
                'orders',
                'strategies',
                'signals',
              ].map((cmd) => (
                <div
                  key={cmd}
                  className="p-2 rounded cursor-pointer transition-smooth hover-lift hover-glow"
                  style={{
                    background: 'rgba(255, 0, 255, 0.1)',
                    border: `1px solid ${theme.border.magenta}`,
                    color: theme.colors.neonMagenta,
                  }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </HoloCard>
          </AnimatedCard>

          <AnimatedCard variant="pulse-green" delay={250}>
          <HoloCard title="Debug Commands" glowColor="teal">
            <div className="space-y-2 font-mono text-sm">
              {[
                'debug on',
                'trace',
                'metrics',
                'dump',
              ].map((cmd) => (
                <div
                  key={cmd}
                  className="p-2 rounded cursor-pointer transition-smooth hover-lift hover-glow"
                  style={{
                    background: 'rgba(0, 255, 170, 0.1)',
                    border: `1px solid ${theme.border.default}`,
                    color: theme.colors.neonTeal,
                  }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </HoloCard>
          </AnimatedCard>
        </div>

        {/* Terminal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Commands Run', value: '1,247', icon: '⌨️' },
            { label: 'Uptime', value: '847h', icon: '⏱️' },
            { label: 'Avg Response', value: '12ms', icon: '⚡' },
            { label: 'Success Rate', value: '99.8%', icon: '✅' },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="p-4 rounded glass-panel holo-border animate-fade-in-up"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${theme.border.default}`,
                animationDelay: `${0.1 + idx * 0.1}s`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-sm" style={{ color: theme.text.tertiary }}>
                  {stat.label}
                </span>
              </div>
              <div 
                className="text-2xl font-bold font-mono"
                style={{ color: theme.colors.neonCyan }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      </AIAura>
      </TemporalDisplacement>
      </AIEmotionAura>
      </PageTransition>
    </SciFiShell>
  );
}
