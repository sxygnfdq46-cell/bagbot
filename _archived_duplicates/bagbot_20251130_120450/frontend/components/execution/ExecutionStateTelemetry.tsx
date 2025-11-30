/**
 * STEP 24.62 — Execution-State Visual Telemetry Layer (ESVT-Layer)
 * 
 * Advanced real-time execution state visualization with sci-fi aesthetics
 * Connects to backend event stream for live execution monitoring
 * Features neon effects, energy flows, and dynamic state transitions
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Zap,
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

// TypeScript Interfaces
interface ExecutionMessage {
  type: ExecutionMessageType;
  timestamp: number;
  data: any;
}

type ExecutionMessageType =
  | 'EXECUTION_PENDING'
  | 'EXECUTION_CONFIRMED'
  | 'EXECUTION_FILLED'
  | 'EXECUTION_CANCELED'
  | 'EXECUTION_FAILED'
  | 'PNL_UPDATE'
  | 'RISK_STATE'
  | 'LATENCY_UPDATE';

interface ExecutionState {
  status: 'idle' | 'pending' | 'confirmed' | 'filled' | 'canceled' | 'failed';
  orderId?: string;
  symbol?: string;
  size?: number;
  price?: number;
  timestamp?: number;
}

interface PnLState {
  unrealized: number;
  realized: number;
  totalPnL: number;
  percentage: number;
}

interface RiskState {
  level: 'low' | 'medium' | 'high' | 'critical';
  exposure: number;
  maxDrawdown: number;
  riskScore: number;
}

interface LatencyData {
  timestamp: number;
  latency: number;
}

interface BrokerConnection {
  status: 'connected' | 'disconnected' | 'unstable';
  lastPing: number;
  quality: number;
}

// Animation Variants
const neonPulse = {
  idle: {
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
    scale: 1,
  },
  active: {
    boxShadow: [
      '0 0 10px rgba(0, 255, 255, 0.3)',
      '0 0 30px rgba(0, 255, 255, 0.8)',
      '0 0 10px rgba(0, 255, 255, 0.3)',
    ],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const energyFlow = {
  hidden: { opacity: 0, x: -100 },
  visible: {
    opacity: [0, 1, 1, 0],
    x: ['-100%', '0%', '100%', '200%'],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
};

const glowRing = {
  positive: {
    boxShadow: '0 0 20px rgba(0, 255, 0, 0.6), inset 0 0 20px rgba(0, 255, 0, 0.2)',
    borderColor: 'rgb(0, 255, 0)',
  },
  negative: {
    boxShadow: '0 0 20px rgba(255, 0, 0, 0.6), inset 0 0 20px rgba(255, 0, 0, 0.2)',
    borderColor: 'rgb(255, 0, 0)',
  },
  neutral: {
    boxShadow: '0 0 20px rgba(100, 100, 100, 0.3), inset 0 0 20px rgba(100, 100, 100, 0.1)',
    borderColor: 'rgb(100, 100, 100)',
  },
};

const shieldWave = {
  low: { backgroundColor: 'rgba(0, 255, 0, 0.2)' },
  medium: { backgroundColor: 'rgba(255, 255, 0, 0.2)' },
  high: { backgroundColor: 'rgba(255, 165, 0, 0.2)' },
  critical: { backgroundColor: 'rgba(255, 0, 0, 0.2)' },
};

// Sub-components
const NeonPulseIndicator: React.FC<{ status: ExecutionState['status'] }> = ({ status }) => {
  const isActive = status === 'pending' || status === 'confirmed';
  
  return (
    <motion.div
      className="relative w-16 h-16 rounded-full border-2 border-cyan-400 flex items-center justify-center"
      variants={neonPulse}
      animate={isActive ? 'active' : 'idle'}
    >
      <motion.div
        className="absolute inset-2 rounded-full bg-cyan-400/20"
        animate={{
          opacity: isActive ? [0.2, 0.8, 0.2] : 0.2,
        }}
        transition={{
          duration: 1,
          repeat: isActive ? Infinity : 0,
        }}
      />
      <Activity className="w-6 h-6 text-cyan-400" />
      
      {/* Status indicator */}
      <motion.div
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background"
        animate={{
          backgroundColor: 
            status === 'filled' ? 'rgb(0, 255, 0)' :
            status === 'failed' || status === 'canceled' ? 'rgb(255, 0, 0)' :
            status === 'pending' || status === 'confirmed' ? 'rgb(255, 255, 0)' :
            'rgb(100, 100, 100)',
        }}
      />
    </motion.div>
  );
};

const EnergyFlowBeam: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  return (
    <div className="relative h-2 w-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent rounded-full overflow-hidden">
      <AnimatePresence>
        {trigger && (
          <motion.div
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"
            variants={energyFlow}
            initial="hidden"
            animate="visible"
            exit="hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const LivePnLGlowRing: React.FC<{ pnl: PnLState }> = ({ pnl }) => {
  const getGlowVariant = () => {
    if (pnl.totalPnL > 0) return 'positive';
    if (pnl.totalPnL < 0) return 'negative';
    return 'neutral';
  };

  return (
    <motion.div
      className="relative w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center"
      variants={glowRing}
      animate={getGlowVariant()}
      transition={{ duration: 0.5 }}
    >
      <div className="text-xs font-bold">
        {pnl.totalPnL >= 0 ? '+' : ''}${pnl.totalPnL.toFixed(2)}
      </div>
      <div className="text-xs opacity-70">
        {pnl.percentage >= 0 ? '+' : ''}{pnl.percentage.toFixed(1)}%
      </div>
      
      {pnl.totalPnL !== 0 && (
        pnl.totalPnL > 0 ? 
          <TrendingUp className="absolute -bottom-1 -right-1 w-4 h-4 text-green-400" /> :
          <TrendingDown className="absolute -bottom-1 -right-1 w-4 h-4 text-red-400" />
      )}
    </motion.div>
  );
};

const BrokerConnectionLine: React.FC<{ connection: BrokerConnection }> = ({ connection }) => {
  const getStatusColor = () => {
    switch (connection.status) {
      case 'connected': return 'text-green-400';
      case 'unstable': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <motion.div
        animate={{
          scale: connection.status === 'connected' ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 1,
          repeat: connection.status === 'connected' ? Infinity : 0,
        }}
      >
        <Wifi className={`w-4 h-4 ${getStatusColor()}`} />
      </motion.div>
      
      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
          animate={{
            width: `${connection.quality * 100}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <span className="text-xs text-gray-400">
        {Math.round(connection.quality * 100)}%
      </span>
    </div>
  );
};

const ShieldSyncWave: React.FC<{ riskState: RiskState }> = ({ riskState }) => {
  return (
    <motion.div
      className="relative h-8 w-full rounded-lg border border-gray-600 overflow-hidden"
      variants={shieldWave}
      animate={riskState.level}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between h-full px-3">
        <Shield className="w-4 h-4 text-gray-300" />
        <span className="text-xs text-gray-200 uppercase tracking-wide">
          {riskState.level} Risk
        </span>
        <span className="text-xs text-gray-300">
          {riskState.riskScore.toFixed(1)}
        </span>
      </div>
      
      {/* Risk level indicator */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-current"
        animate={{
          width: `${Math.min(riskState.riskScore * 20, 100)}%`,
        }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
};

const LatencySparkline: React.FC<{ data: LatencyData[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Calculate scaling
    const maxLatency = Math.max(...data.map(d => d.latency));
    const minLatency = Math.min(...data.map(d => d.latency));
    const range = maxLatency - minLatency || 1;

    // Draw sparkline
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.latency - minLatency) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
    ctx.stroke();

  }, [data]);

  const avgLatency = data.length > 0 ? data.reduce((sum, d) => sum + d.latency, 0) / data.length : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          Latency
        </span>
        <span className="text-xs text-cyan-400">
          {avgLatency.toFixed(0)}ms avg
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={40}
        className="w-full h-10 bg-gray-900/50 rounded border border-gray-700"
      />
    </div>
  );
};

const ExecutionLogGrid: React.FC<{ executions: ExecutionMessage[] }> = ({ executions }) => {
  const getStatusIcon = (type: ExecutionMessageType) => {
    switch (type) {
      case 'EXECUTION_FILLED':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'EXECUTION_FAILED':
      case 'EXECUTION_CANCELED':
        return <XCircle className="w-3 h-3 text-red-400" />;
      case 'EXECUTION_PENDING':
        return <Loader className="w-3 h-3 text-yellow-400 animate-spin" />;
      case 'EXECUTION_CONFIRMED':
        return <Target className="w-3 h-3 text-blue-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          Execution Log
        </span>
        <Badge variant="outline" className="text-xs">
          {executions.length}
        </Badge>
      </div>
      
      <div className="max-h-32 overflow-y-auto space-y-1">
        <AnimatePresence>
          {executions.slice(-10).map((execution, index) => (
            <motion.div
              key={`${execution.timestamp}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center space-x-2 px-2 py-1 bg-gray-800/50 rounded border border-gray-700 text-xs"
            >
              {getStatusIcon(execution.type)}
              <span className="text-gray-300 flex-1">
                {execution.type.replace('EXECUTION_', '').toLowerCase()}
              </span>
              <span className="text-gray-500">
                {formatTime(execution.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Main Component
const ExecutionStateTelemetry: React.FC = () => {
  const [executionState, setExecutionState] = useState<ExecutionState>({ status: 'idle' });
  const [pnlState, setPnlState] = useState<PnLState>({
    unrealized: 0,
    realized: 0,
    totalPnL: 0,
    percentage: 0,
  });
  const [riskState, setRiskState] = useState<RiskState>({
    level: 'low',
    exposure: 0,
    maxDrawdown: 0,
    riskScore: 0.2,
  });
  const [latencyData, setLatencyData] = useState<LatencyData[]>([]);
  const [brokerConnection, setBrokerConnection] = useState<BrokerConnection>({
    status: 'connected',
    lastPing: Date.now(),
    quality: 0.95,
  });
  const [executionLog, setExecutionLog] = useState<ExecutionMessage[]>([]);
  const [connectionActive, setConnectionActive] = useState(false);
  const [energyFlowTrigger, setEnergyFlowTrigger] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    try {
      // Placeholder endpoint - will be implemented when backend is ready
      const ws = new WebSocket('ws://localhost:8000/api/execution/stream');
      
      ws.onopen = () => {
        console.log('Execution telemetry stream connected');
        setConnectionActive(true);
        setBrokerConnection(prev => ({ ...prev, status: 'connected' }));
      };

      ws.onmessage = (event) => {
        try {
          const message: ExecutionMessage = JSON.parse(event.data);
          handleExecutionMessage(message);
        } catch (error) {
          console.error('Failed to parse execution message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setBrokerConnection(prev => ({ ...prev, status: 'unstable' }));
      };

      ws.onclose = () => {
        console.log('Execution telemetry stream disconnected');
        setConnectionActive(false);
        setBrokerConnection(prev => ({ ...prev, status: 'disconnected' }));
        
        // Attempt reconnection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to execution stream:', error);
      setBrokerConnection(prev => ({ ...prev, status: 'disconnected' }));
      
      // Attempt reconnection after 5 seconds
      setTimeout(connectWebSocket, 5000);
    }
  }, []);

  // Handle incoming execution messages
  const handleExecutionMessage = useCallback((message: ExecutionMessage) => {
    setExecutionLog(prev => [...prev.slice(-49), message]); // Keep last 50 messages

    switch (message.type) {
      case 'EXECUTION_PENDING':
        setExecutionState({
          status: 'pending',
          orderId: message.data.orderId,
          symbol: message.data.symbol,
          size: message.data.size,
          timestamp: message.timestamp,
        });
        break;

      case 'EXECUTION_CONFIRMED':
        setExecutionState(prev => ({ ...prev, status: 'confirmed' }));
        setEnergyFlowTrigger(true);
        setTimeout(() => setEnergyFlowTrigger(false), 100);
        break;

      case 'EXECUTION_FILLED':
        setExecutionState(prev => ({ ...prev, status: 'filled', price: message.data.price }));
        setEnergyFlowTrigger(true);
        setTimeout(() => setEnergyFlowTrigger(false), 100);
        break;

      case 'EXECUTION_CANCELED':
        setExecutionState(prev => ({ ...prev, status: 'canceled' }));
        break;

      case 'EXECUTION_FAILED':
        setExecutionState(prev => ({ ...prev, status: 'failed' }));
        break;

      case 'PNL_UPDATE':
        setPnlState({
          unrealized: message.data.unrealized,
          realized: message.data.realized,
          totalPnL: message.data.unrealized + message.data.realized,
          percentage: message.data.percentage,
        });
        break;

      case 'RISK_STATE':
        setRiskState({
          level: message.data.level,
          exposure: message.data.exposure,
          maxDrawdown: message.data.maxDrawdown,
          riskScore: message.data.riskScore,
        });
        break;

      case 'LATENCY_UPDATE':
        setLatencyData(prev => [
          ...prev.slice(-29), // Keep last 30 points
          { timestamp: message.timestamp, latency: message.data.latency }
        ]);
        break;
    }
  }, []);

  // Generate mock data for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      // Mock latency updates
      const mockLatency = 50 + Math.random() * 100;
      setLatencyData(prev => [
        ...prev.slice(-29),
        { timestamp: Date.now(), latency: mockLatency }
      ]);

      // Mock PnL updates
      const mockPnL = (Math.random() - 0.5) * 200;
      setPnlState(prev => ({
        ...prev,
        totalPnL: prev.totalPnL + mockPnL * 0.1,
        percentage: (prev.totalPnL + mockPnL * 0.1) / 1000,
      }));

      // Mock connection quality updates
      setBrokerConnection(prev => ({
        ...prev,
        quality: Math.max(0.7, Math.min(1, prev.quality + (Math.random() - 0.5) * 0.1)),
        lastPing: Date.now(),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  return (
    <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-cyan-400" />
            Execution State Telemetry
          </h3>
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: connectionActive ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)',
              }}
            />
            <span className="text-xs text-gray-400">
              {connectionActive ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        <Separator className="bg-gray-700" />

        {/* Main telemetry grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Execution status and energy flow */}
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <NeonPulseIndicator status={executionState.status} />
              <EnergyFlowBeam trigger={energyFlowTrigger} />
              <div className="text-center">
                <div className="text-sm font-medium text-gray-200 capitalize">
                  {executionState.status}
                </div>
                {executionState.orderId && (
                  <div className="text-xs text-gray-400">
                    Order: {executionState.orderId.slice(-8)}
                  </div>
                )}
              </div>
            </div>
            
            <BrokerConnectionLine connection={brokerConnection} />
          </div>

          {/* Center column - PnL and Risk */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <LivePnLGlowRing pnl={pnlState} />
            </div>
            <ShieldSyncWave riskState={riskState} />
          </div>

          {/* Right column - Latency and execution log */}
          <div className="space-y-4">
            <LatencySparkline data={latencyData} />
            <ExecutionLogGrid executions={executionLog} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutionStateTelemetry;