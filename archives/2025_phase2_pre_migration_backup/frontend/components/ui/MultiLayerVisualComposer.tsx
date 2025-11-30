/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 16.5: MULTI-LAYER VISUAL COMPOSER
 * ═══════════════════════════════════════════════════════════════════
 * Layered UI builder: charts, graphs, pulse-rings, timelines.
 * Composable visualization system with z-index management.
 * 
 * SAFETY: Pure rendering, no data mutations
 * PURPOSE: GPU-accelerated visualizations for dashboards
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getStreamEngine, AnimationFrame } from './ViewportStreamEngine';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type LayerType = 'chart' | 'graph' | 'pulse' | 'timeline' | 'grid' | 'text' | 'custom';
export type ChartType = 'line' | 'bar' | 'area' | 'sparkline' | 'gauge';

export interface VisualLayer {
  id: string;
  type: LayerType;
  zIndex: number;
  visible: boolean;
  opacity: number;
  config: LayerConfig;
}

export interface LayerConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  data?: any;
  options?: any;
}

export interface ChartConfig extends LayerConfig {
  chartType: ChartType;
  data: number[];
  labels?: string[];
  min?: number;
  max?: number;
  showGrid?: boolean;
  showAxes?: boolean;
}

export interface PulseRingConfig extends LayerConfig {
  centerX: number;
  centerY: number;
  baseRadius: number;
  pulseSpeed: number;
  pulseCount: number;
}

export interface TimelineConfig extends LayerConfig {
  events: TimelineEvent[];
  startTime: number;
  endTime: number;
  orientation: 'horizontal' | 'vertical';
}

export interface TimelineEvent {
  timestamp: number;
  label: string;
  color: string;
  priority: number;
}

export interface ComposerConfig {
  width: number;
  height: number;
  backgroundColor: string;
  enableGPU: boolean;
}

// ─────────────────────────────────────────────────────────────────
// MULTI-LAYER VISUAL COMPOSER COMPONENT
// ─────────────────────────────────────────────────────────────────

export const MultiLayerVisualComposer: React.FC<{
  config?: Partial<ComposerConfig>;
  layers?: VisualLayer[];
  onLayerUpdate?: (layers: VisualLayer[]) => void;
}> = ({
  config,
  layers: initialLayers = [],
  onLayerUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<VisualLayer[]>(initialLayers);
  const streamId = useRef<string>();
  const frameCount = useRef(0);

  const composerConfig: ComposerConfig = {
    width: 1920,
    height: 1080,
    backgroundColor: 'transparent',
    enableGPU: true,
    ...config
  };

  // ─────────────────────────────────────────────────────────────
  // LAYER MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  const addLayer = useCallback((layer: VisualLayer) => {
    setLayers(prev => {
      const maxZ = Math.max(...prev.map(l => l.zIndex), 0);
      const newLayer = { ...layer, zIndex: maxZ + 1 };
      const updated = [...prev, newLayer];
      onLayerUpdate?.(updated);
      return updated;
    });
  }, [onLayerUpdate]);

  const removeLayer = useCallback((layerId: string) => {
    setLayers(prev => {
      const updated = prev.filter(l => l.id !== layerId);
      onLayerUpdate?.(updated);
      return updated;
    });
  }, [onLayerUpdate]);

  const updateLayer = useCallback((layerId: string, updates: Partial<VisualLayer>) => {
    setLayers(prev => {
      const updated = prev.map(l => l.id === layerId ? { ...l, ...updates } : l);
      onLayerUpdate?.(updated);
      return updated;
    });
  }, [onLayerUpdate]);

  const setLayerVisibility = useCallback((layerId: string, visible: boolean) => {
    updateLayer(layerId, { visible });
  }, [updateLayer]);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity: Math.max(0, Math.min(1, opacity)) });
  }, [updateLayer]);

  // ─────────────────────────────────────────────────────────────
  // RENDERING
  // ─────────────────────────────────────────────────────────────

  const renderLayers = useCallback((frame: AnimationFrame) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (composerConfig.backgroundColor !== 'transparent') {
      ctx.fillStyle = composerConfig.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Sort layers by zIndex
    const sortedLayers = [...layers]
      .filter(l => l.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    // Render each layer
    for (const layer of sortedLayers) {
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      switch (layer.type) {
        case 'chart':
          renderChart(ctx, layer.config as ChartConfig, frame);
          break;
        case 'pulse':
          renderPulseRing(ctx, layer.config as PulseRingConfig, frame);
          break;
        case 'timeline':
          renderTimeline(ctx, layer.config as TimelineConfig, frame);
          break;
        case 'grid':
          renderGrid(ctx, layer.config);
          break;
        case 'text':
          renderText(ctx, layer.config);
          break;
      }

      ctx.restore();
    }

    frameCount.current++;
  }, [layers, composerConfig]);

  // ─────────────────────────────────────────────────────────────
  // STREAM ENGINE INTEGRATION
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const engine = getStreamEngine();
    streamId.current = engine.registerStream(
      'visual-composer',
      renderLayers,
      'canvas',
      5
    );

    return () => {
      if (streamId.current) {
        engine.unregisterStream(streamId.current);
      }
    };
  }, [renderLayers]);

  // ─────────────────────────────────────────────────────────────
  // CANVAS SETUP
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = composerConfig.width;
    canvas.height = composerConfig.height;

    // Enable GPU acceleration
    if (composerConfig.enableGPU) {
      canvas.style.transform = 'translateZ(0)';
      canvas.style.willChange = 'transform';
    }
  }, [composerConfig]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// LAYER RENDERERS
// ─────────────────────────────────────────────────────────────────

function renderChart(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  frame: AnimationFrame
): void {
  const { x, y, width, height, color, chartType, data, labels, showGrid, showAxes } = config;

  // Draw background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x, y, width, height);

  // Draw grid
  if (showGrid) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const gx = x + (width / 10) * i;
      const gy = y + (height / 10) * i;

      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + width, gy);
      ctx.stroke();
    }
  }

  // Draw axes
  if (showAxes) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
  }

  // Draw chart data
  if (data && data.length > 0) {
    const maxValue = config.max !== undefined ? config.max : Math.max(...data, 1);
    const minValue = config.min !== undefined ? config.min : Math.min(...data, 0);
    const range = maxValue - minValue || 1;

    switch (chartType) {
      case 'line':
        drawLineChart(ctx, data, x, y, width, height, color, minValue, range);
        break;
      case 'bar':
        drawBarChart(ctx, data, labels, x, y, width, height, color, maxValue);
        break;
      case 'area':
        drawAreaChart(ctx, data, x, y, width, height, color, minValue, range);
        break;
      case 'sparkline':
        drawSparkline(ctx, data, x, y, width, height, color, minValue, range);
        break;
      case 'gauge':
        drawGauge(ctx, data[data.length - 1] || 0, x + width / 2, y + height / 2, Math.min(width, height) / 3, maxValue);
        break;
    }
  }
}

function drawLineChart(
  ctx: CanvasRenderingContext2D,
  data: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  minValue: number,
  range: number
): void {
  if (data.length < 2) return;

  const stepX = width / (data.length - 1);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  for (let i = 0; i < data.length; i++) {
    const px = x + i * stepX;
    const normalized = (data[i] - minValue) / range;
    const py = y + height - (normalized * height);

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
}

function drawBarChart(
  ctx: CanvasRenderingContext2D,
  data: number[],
  labels: string[] | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  maxValue: number
): void {
  const barWidth = width / data.length;

  data.forEach((value, index) => {
    const barHeight = (value / maxValue) * height;
    const barX = x + index * barWidth;
    const barY = y + height - barHeight;

    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barWidth * 0.8, barHeight);

    if (labels && labels[index]) {
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index], barX + barWidth * 0.4, y + height + 15);
    }
  });
}

function drawAreaChart(
  ctx: CanvasRenderingContext2D,
  data: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  minValue: number,
  range: number
): void {
  if (data.length < 2) return;

  const stepX = width / (data.length - 1);

  ctx.beginPath();
  ctx.moveTo(x, y + height);

  for (let i = 0; i < data.length; i++) {
    const px = x + i * stepX;
    const normalized = (data[i] - minValue) / range;
    const py = y + height - (normalized * height);
    ctx.lineTo(px, py);
  }

  ctx.lineTo(x + width, y + height);
  ctx.closePath();

  ctx.fillStyle = color.replace(/rgb/, 'rgba').replace(/\)/, ', 0.3)');
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSparkline(
  ctx: CanvasRenderingContext2D,
  data: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  minValue: number,
  range: number
): void {
  if (data.length < 2) return;

  const stepX = width / (data.length - 1);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  for (let i = 0; i < data.length; i++) {
    const px = x + i * stepX;
    const normalized = (data[i] - minValue) / range;
    const py = y + height - (normalized * height);

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
}

function drawGauge(
  ctx: CanvasRenderingContext2D,
  value: number,
  centerX: number,
  centerY: number,
  radius: number,
  maxValue: number
): void {
  const startAngle = -Math.PI * 0.75;
  const endAngle = Math.PI * 0.75;
  const normalizedValue = Math.max(0, Math.min(1, value / maxValue));
  const angle = startAngle + (endAngle - startAngle) * normalizedValue;

  // Background arc
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Value arc
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, angle);
  
  let color;
  if (normalizedValue < 0.5) color = '#00ff88';
  else if (normalizedValue < 0.8) color = '#ffaa00';
  else color = '#ff3366';
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.stroke();

  // Center text
  ctx.fillStyle = color;
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(value)}`, centerX, centerY + 5);
}

function renderPulseRing(
  ctx: CanvasRenderingContext2D,
  config: PulseRingConfig,
  frame: AnimationFrame
): void {
  const { centerX, centerY, baseRadius, pulseSpeed, pulseCount, color } = config;

  for (let i = 0; i < pulseCount; i++) {
    const offset = (i / pulseCount) * Math.PI * 2;
    const progress = ((frame.timestamp * pulseSpeed * 0.001) + offset) % 1;
    
    const pulseRadius = baseRadius + (progress * baseRadius * 0.5);
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function renderTimeline(
  ctx: CanvasRenderingContext2D,
  config: TimelineConfig,
  frame: AnimationFrame
): void {
  const { x, y, width, height, events, startTime, endTime, orientation } = config;

  // Timeline background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x, y, width, height);

  // Timeline axis
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;

  if (orientation === 'horizontal') {
    ctx.beginPath();
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.stroke();
  }

  // Timeline events
  const timeRange = endTime - startTime;

  events.forEach(event => {
    const normalized = (event.timestamp - startTime) / timeRange;
    
    if (orientation === 'horizontal') {
      const ex = x + normalized * width;
      const ey = y + height / 2;

      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fillStyle = event.color;
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(event.label, ex, ey - 10);
    } else {
      const ex = x + width / 2;
      const ey = y + normalized * height;

      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fillStyle = event.color;
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(event.label, ex + 10, ey + 5);
    }
  });
}

function renderGrid(
  ctx: CanvasRenderingContext2D,
  config: LayerConfig
): void {
  const { x, y, width, height, color } = config;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  const cellSize = 20;

  for (let i = 0; i <= width; i += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + height);
    ctx.stroke();
  }

  for (let j = 0; j <= height; j += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, y + j);
    ctx.lineTo(x + width, y + j);
    ctx.stroke();
  }
}

function renderText(
  ctx: CanvasRenderingContext2D,
  config: LayerConfig
): void {
  const { x, y, color, data } = config;

  if (!data?.text) return;

  ctx.fillStyle = color;
  ctx.font = data.font || '14px monospace';
  ctx.textAlign = data.align || 'left';
  ctx.fillText(data.text, x, y);
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

export function createChartLayer(
  id: string,
  chartType: ChartType,
  data: number[],
  config: Partial<ChartConfig> = {}
): VisualLayer {
  return {
    id,
    type: 'chart',
    zIndex: 1,
    visible: true,
    opacity: 1,
    config: {
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      color: '#00ff88',
      chartType,
      data,
      labels: [],
      showGrid: true,
      showAxes: true,
      ...config
    } as ChartConfig
  };
}

export function createPulseRingLayer(
  id: string,
  centerX: number,
  centerY: number,
  config: Partial<PulseRingConfig> = {}
): VisualLayer {
  return {
    id,
    type: 'pulse',
    zIndex: 2,
    visible: true,
    opacity: 1,
    config: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      color: '#00ff88',
      centerX,
      centerY,
      baseRadius: 50,
      pulseSpeed: 1,
      pulseCount: 3,
      ...config
    } as PulseRingConfig
  };
}

export function createTimelineLayer(
  id: string,
  events: TimelineEvent[],
  config: Partial<TimelineConfig> = {}
): VisualLayer {
  const now = Date.now();
  
  return {
    id,
    type: 'timeline',
    zIndex: 3,
    visible: true,
    opacity: 1,
    config: {
      x: 0,
      y: 0,
      width: 800,
      height: 100,
      color: '#ffffff',
      events,
      startTime: now - 3600000, // 1 hour ago
      endTime: now,
      orientation: 'horizontal',
      ...config
    } as TimelineConfig
  };
}

export { MultiLayerVisualComposer as default };
