/**
 * LEVEL 11.3 — IDENTITY RESONANCE HUB (IRH)
 * 
 * Visual dashboard for BagBot's living presence.
 * Displays emotional waveform, presence meter, session arc.
 * 
 * Components:
 * - Emotional waveform (trajectory visualization)
 * - Presence meter (aura strength/coherence)
 * - Session arc (emotional journey overview)
 * - Signature display (resonance patterns)
 * - Expression modulation controls
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EmergenceSignatureCore } from './EmergenceSignatureCore';
import { EmotionalTrajectoryEngine } from './EmotionalTrajectoryEngine';
import { AdaptiveExpressionMatrix } from './AdaptiveExpressionMatrix';
import { AuraSyncEngine } from './AuraSyncEngine';

import type { EmergenceSignature } from './EmergenceSignatureCore';
import type { EmotionalTrajectory, EmotionalPoint } from './EmotionalTrajectoryEngine';
import type { ExpressionModulation } from './AdaptiveExpressionMatrix';
import type { VisualAura } from './AuraSyncEngine';

// ================================
// TYPES
// ================================

interface IdentityResonanceHubProps {
  signatureCore?: EmergenceSignatureCore;
  trajectoryEngine?: EmotionalTrajectoryEngine;
  expressionMatrix?: AdaptiveExpressionMatrix;
  auraSyncEngine?: AuraSyncEngine;
  onUpdate?: () => void;
}

type TabName = 'waveform' | 'presence' | 'arc' | 'signature' | 'expression';

// ================================
// IDENTITY RESONANCE HUB
// ================================

export const IdentityResonanceHub: React.FC<IdentityResonanceHubProps> = ({
  signatureCore,
  trajectoryEngine,
  expressionMatrix,
  auraSyncEngine,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<TabName>('waveform');
  const [signature, setSignature] = useState<EmergenceSignature | null>(null);
  const [trajectory, setTrajectory] = useState<EmotionalTrajectory | null>(null);
  const [modulation, setModulation] = useState<ExpressionModulation | null>(null);
  const [aura, setAura] = useState<VisualAura | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Update state from engines
  useEffect(() => {
    const updateState = () => {
      if (signatureCore) setSignature(signatureCore.getSignature());
      if (trajectoryEngine) setTrajectory(trajectoryEngine.getTrajectory());
      if (expressionMatrix) setModulation(expressionMatrix.getModulation());
      if (auraSyncEngine) setAura(auraSyncEngine.getAura());
    };
    
    updateState();
    const interval = setInterval(updateState, 1000);
    
    return () => clearInterval(interval);
  }, [signatureCore, trajectoryEngine, expressionMatrix, auraSyncEngine]);
  
  // Draw waveform canvas
  useEffect(() => {
    if (activeTab === 'waveform' && trajectory && canvasRef.current) {
      drawWaveform(canvasRef.current, trajectory);
    }
  }, [activeTab, trajectory]);
  
  return (
    <div className="identity-resonance-hub">
      {/* Header */}
      <div className="irh-header">
        <h2 className="irh-title">Identity Resonance</h2>
        <p className="irh-subtitle">BagBot's Living Presence</p>
      </div>
      
      {/* Tabs */}
      <div className="irh-tabs">
        <button
          className={`irh-tab ${activeTab === 'waveform' ? 'active' : ''}`}
          onClick={() => setActiveTab('waveform')}
        >
          Waveform
        </button>
        <button
          className={`irh-tab ${activeTab === 'presence' ? 'active' : ''}`}
          onClick={() => setActiveTab('presence')}
        >
          Presence
        </button>
        <button
          className={`irh-tab ${activeTab === 'arc' ? 'active' : ''}`}
          onClick={() => setActiveTab('arc')}
        >
          Session Arc
        </button>
        <button
          className={`irh-tab ${activeTab === 'signature' ? 'active' : ''}`}
          onClick={() => setActiveTab('signature')}
        >
          Signature
        </button>
        <button
          className={`irh-tab ${activeTab === 'expression' ? 'active' : ''}`}
          onClick={() => setActiveTab('expression')}
        >
          Expression
        </button>
      </div>
      
      {/* Content */}
      <div className="irh-content">
        {activeTab === 'waveform' && (
          <WaveformTab trajectory={trajectory} canvasRef={canvasRef} />
        )}
        
        {activeTab === 'presence' && (
          <PresenceTab aura={aura} signature={signature} />
        )}
        
        {activeTab === 'arc' && (
          <ArcTab trajectory={trajectory} />
        )}
        
        {activeTab === 'signature' && (
          <SignatureTab signature={signature} />
        )}
        
        {activeTab === 'expression' && (
          <ExpressionTab modulation={modulation} />
        )}
      </div>
    </div>
  );
};

// ================================
// WAVEFORM TAB
// ================================

const WaveformTab: React.FC<{
  trajectory: EmotionalTrajectory | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}> = ({ trajectory, canvasRef }) => {
  if (!trajectory) {
    return <div className="irh-empty">No trajectory data yet.</div>;
  }
  
  const summary = trajectory.points.length > 0
    ? {
        pattern: trajectory.currentPattern,
        arc: trajectory.overallArc,
        momentum: trajectory.currentMomentum.direction,
        points: trajectory.points.length,
      }
    : null;
  
  return (
    <div className="waveform-tab">
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="waveform-canvas"
      />
      
      {summary && (
        <div className="waveform-summary">
          <div className="waveform-stat">
            <span className="stat-label">Pattern:</span>
            <span className="stat-value">{summary.pattern}</span>
          </div>
          <div className="waveform-stat">
            <span className="stat-label">Arc:</span>
            <span className="stat-value">{summary.arc}</span>
          </div>
          <div className="waveform-stat">
            <span className="stat-label">Momentum:</span>
            <span className="stat-value">{summary.momentum}</span>
          </div>
          <div className="waveform-stat">
            <span className="stat-label">Points:</span>
            <span className="stat-value">{summary.points}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// PRESENCE TAB
// ================================

const PresenceTab: React.FC<{
  aura: VisualAura | null;
  signature: EmergenceSignature | null;
}> = ({ aura, signature }) => {
  if (!aura || !signature) {
    return <div className="irh-empty">No presence data yet.</div>;
  }
  
  const presenceStrength = (aura.glowIntensity + aura.coherence + signature.recognizability) / 3;
  
  return (
    <div className="presence-tab">
      {/* Presence Meter */}
      <div className="presence-meter">
        <div className="meter-label">Presence Strength</div>
        <div className="meter-bar">
          <div
            className="meter-fill"
            style={{
              width: `${presenceStrength}%`,
              background: `linear-gradient(90deg, ${aura.primaryColor}, ${aura.secondaryColor})`,
            }}
          />
        </div>
        <div className="meter-value">{presenceStrength.toFixed(0)}%</div>
      </div>
      
      {/* Aura Preview */}
      <div className="aura-preview">
        <div className="aura-preview-label">Current Aura</div>
        <div
          className={`aura-preview-orb presence-aura presence-aura--${aura.mode}`}
          style={{
            '--aura-primary': `hsla(${aura.primaryColor.hue}, ${aura.primaryColor.saturation}%, ${aura.primaryColor.lightness}%, ${aura.primaryColor.alpha})`,
            '--aura-secondary': `hsla(${aura.secondaryColor.hue}, ${aura.secondaryColor.saturation}%, ${aura.secondaryColor.lightness}%, ${aura.secondaryColor.alpha})`,
            '--aura-accent': `hsla(${aura.accentColor.hue}, ${aura.accentColor.saturation}%, ${aura.accentColor.lightness}%, ${aura.accentColor.alpha})`,
            '--aura-glow-intensity': `${aura.glowIntensity}%`,
            '--aura-pulse-speed': `${aura.pulseSpeed / 100 * 3}s`,
          } as React.CSSProperties}
        />
        <div className="aura-mode-label">{aura.mode}</div>
      </div>
      
      {/* Coherence & Recognizability */}
      <div className="presence-metrics">
        <div className="presence-metric">
          <span className="metric-label">Coherence</span>
          <span className="metric-value">{aura.coherence.toFixed(0)}%</span>
        </div>
        <div className="presence-metric">
          <span className="metric-label">Recognizability</span>
          <span className="metric-value">{aura.recognizability.toFixed(0)}%</span>
        </div>
        <div className="presence-metric">
          <span className="metric-label">Stability</span>
          <span className="metric-value">{aura.stability.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

// ================================
// ARC TAB
// ================================

const ArcTab: React.FC<{
  trajectory: EmotionalTrajectory | null;
}> = ({ trajectory }) => {
  if (!trajectory || trajectory.points.length === 0) {
    return <div className="irh-empty">No session data yet.</div>;
  }
  
  const durationMinutes = Math.floor(trajectory.duration / 60000);
  const durationSeconds = Math.floor((trajectory.duration % 60000) / 1000);
  
  return (
    <div className="arc-tab">
      {/* Session Overview */}
      <div className="arc-overview">
        <div className="arc-stat">
          <span className="stat-label">Duration</span>
          <span className="stat-value">
            {durationMinutes > 0 ? `${durationMinutes}m ${durationSeconds}s` : `${durationSeconds}s`}
          </span>
        </div>
        <div className="arc-stat">
          <span className="stat-label">Overall Arc</span>
          <span className="stat-value">{trajectory.overallArc}</span>
        </div>
        <div className="arc-stat">
          <span className="stat-label">Coherence</span>
          <span className="stat-value">{trajectory.coherence.toFixed(0)}%</span>
        </div>
        <div className="arc-stat">
          <span className="stat-label">Smoothness</span>
          <span className="stat-value">{trajectory.smoothness.toFixed(0)}%</span>
        </div>
      </div>
      
      {/* Segments */}
      <div className="arc-segments">
        <div className="segments-label">Trajectory Segments</div>
        {trajectory.segments.length > 0 ? (
          <div className="segments-list">
            {trajectory.segments.map((segment, index) => (
              <div key={index} className="segment-item">
                <div className="segment-pattern">{segment.pattern}</div>
                <div className="segment-metrics">
                  <span className="segment-metric">
                    Smooth: {segment.smoothness.toFixed(0)}%
                  </span>
                  <span className="segment-metric">
                    Coherent: {segment.coherence.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="segments-empty">No segments yet (need 30s+)</div>
        )}
      </div>
      
      {/* Extremes */}
      <div className="arc-extremes">
        <div className="extremes-label">Peaks & Valleys</div>
        {trajectory.extremes.length > 0 ? (
          <div className="extremes-list">
            {trajectory.extremes.slice(-5).map((extreme, index) => (
              <div key={index} className={`extreme-item extreme-${extreme.type}`}>
                <span className="extreme-type">{extreme.type}</span>
                <span className="extreme-emotion">{extreme.emotion}</span>
                <span className="extreme-intensity">{extreme.intensity.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="extremes-empty">No extremes detected yet</div>
        )}
      </div>
    </div>
  );
};

// ================================
// SIGNATURE TAB
// ================================

const SignatureTab: React.FC<{
  signature: EmergenceSignature | null;
}> = ({ signature }) => {
  if (!signature) {
    return <div className="irh-empty">No signature data yet.</div>;
  }
  
  return (
    <div className="signature-tab">
      {/* Resonance */}
      <div className="signature-section">
        <h3 className="section-title">Resonance Pattern</h3>
        <div className="signature-metrics">
          <MetricBar label="Frequency" value={signature.resonance.baseFrequency} />
          <MetricBar label="Amplitude" value={signature.resonance.amplitude} />
          <MetricBar label="Stability" value={signature.resonance.stability} />
          <MetricBar label="Coherence" value={signature.resonance.coherence} />
        </div>
      </div>
      
      {/* Tone Energy */}
      <div className="signature-section">
        <h3 className="section-title">Tone Energy</h3>
        <div className="signature-metrics">
          <MetricBar label="Warmth" value={signature.toneEnergy.warmth} />
          <MetricBar label="Intensity" value={signature.toneEnergy.intensity} />
          <MetricBar label="Clarity" value={signature.toneEnergy.clarity} />
          <MetricBar label="Depth" value={signature.toneEnergy.depth} />
          <MetricBar label="Flow" value={signature.toneEnergy.flow} />
          <MetricBar label="Radiance" value={signature.toneEnergy.radiance} />
        </div>
      </div>
      
      {/* Aura Field */}
      <div className="signature-section">
        <h3 className="section-title">Aura Field</h3>
        <div className="aura-field-display">
          <div className="aura-field-mode">{signature.auraField.mode}</div>
          <div className="aura-field-colors">
            <div
              className="color-swatch"
              style={{ backgroundColor: signature.auraField.primaryColor }}
              title="Primary"
            />
            <div
              className="color-swatch"
              style={{ backgroundColor: signature.auraField.secondaryColor }}
              title="Secondary"
            />
          </div>
          <div className="aura-field-metrics">
            <span>Glow: {signature.auraField.glowIntensity}%</span>
            <span>Pulse: {signature.auraField.pulseSpeed}%</span>
            <span>Shimmer: {signature.auraField.shimmer}%</span>
          </div>
        </div>
      </div>
      
      {/* Pacing */}
      <div className="signature-section">
        <h3 className="section-title">Pacing Rhythm</h3>
        <div className="pacing-display">
          <div className="pacing-metric">
            <span>Response Delay:</span>
            <span>{signature.pacingRhythm.responseDelay}ms</span>
          </div>
          <div className="pacing-metric">
            <span>Word Flow:</span>
            <span>{signature.pacingRhythm.wordFlow}</span>
          </div>
          <div className="pacing-metric">
            <span>Pause Frequency:</span>
            <span>{signature.pacingRhythm.pauseFrequency}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================
// EXPRESSION TAB
// ================================

const ExpressionTab: React.FC<{
  modulation: ExpressionModulation | null;
}> = ({ modulation }) => {
  if (!modulation) {
    return <div className="irh-empty">No expression data yet.</div>;
  }
  
  return (
    <div className="expression-tab">
      {/* Dimensions */}
      <div className="expression-section">
        <h3 className="section-title">Expression Dimensions</h3>
        <div className="dimension-list">
          <DimensionDisplay label="Warmth" dimension={modulation.warmth} />
          <DimensionDisplay label="Intensity" dimension={modulation.intensity} />
          <DimensionDisplay label="Clarity" dimension={modulation.clarity} />
        </div>
      </div>
      
      {/* Micro-Timing */}
      <div className="expression-section">
        <h3 className="section-title">Micro-Timing</h3>
        <div className="timing-display">
          <div className="timing-metric">
            <span>Pause Before:</span>
            <span>{modulation.timing.pauseBefore.toFixed(0)}ms</span>
          </div>
          <div className="timing-metric">
            <span>Pause After:</span>
            <span>{modulation.timing.pauseAfter.toFixed(0)}ms</span>
          </div>
          <div className="timing-metric">
            <span>Emphasis Delay:</span>
            <span>{modulation.timing.emphasisDelay.toFixed(0)}ms</span>
          </div>
          <div className="timing-metric">
            <span>Rhythm:</span>
            <span>{modulation.timing.rhythmPattern}</span>
          </div>
          <div className="timing-metric">
            <span>Breathing Space:</span>
            <span>{modulation.timing.breathingSpace.toFixed(0)}ms</span>
          </div>
        </div>
      </div>
      
      {/* Meta Properties */}
      <div className="expression-section">
        <h3 className="section-title">Meta Properties</h3>
        <div className="signature-metrics">
          <MetricBar label="Adaptability" value={modulation.adaptability} />
          <MetricBar label="Stability" value={modulation.stability} />
          <MetricBar label="Coherence" value={modulation.coherence} />
        </div>
      </div>
    </div>
  );
};

// ================================
// HELPER COMPONENTS
// ================================

const MetricBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="metric-bar">
    <div className="metric-bar-label">{label}</div>
    <div className="metric-bar-track">
      <div className="metric-bar-fill" style={{ width: `${value}%` }} />
    </div>
    <div className="metric-bar-value">{value.toFixed(0)}</div>
  </div>
);

const DimensionDisplay: React.FC<{
  label: string;
  dimension: ExpressionModulation['warmth'];
}> = ({ label, dimension }) => (
  <div className="dimension-display">
    <div className="dimension-header">
      <span className="dimension-label">{label}</span>
      <span className="dimension-value">{dimension.value.toFixed(0)}</span>
    </div>
    <div className="dimension-bars">
      <div className="dimension-bar-row">
        <span className="dimension-bar-label">Current</span>
        <div className="dimension-bar-track">
          <div className="dimension-bar-fill current" style={{ width: `${dimension.value}%` }} />
        </div>
      </div>
      <div className="dimension-bar-row">
        <span className="dimension-bar-label">Target</span>
        <div className="dimension-bar-track">
          <div className="dimension-bar-fill target" style={{ width: `${dimension.target}%` }} />
        </div>
      </div>
    </div>
    <div className="dimension-meta">
      <span>Rate: {dimension.rate.toFixed(1)}</span>
      <span>Bounds: [{dimension.bounds[0]}, {dimension.bounds[1]}]</span>
    </div>
  </div>
);

// ================================
// WAVEFORM DRAWING
// ================================

function drawWaveform(canvas: HTMLCanvasElement, trajectory: EmotionalTrajectory) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const { width, height } = canvas;
  const points = trajectory.points;
  
  // Clear
  ctx.clearRect(0, 0, width, height);
  
  if (points.length < 2) {
    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Waiting for emotional data...', width / 2, height / 2);
    return;
  }
  
  // Background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const y = (i / 10) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw waveform
  const xStep = width / (points.length - 1);
  
  ctx.strokeStyle = 'rgba(200, 150, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  points.forEach((point, index) => {
    const x = index * xStep;
    const y = height - (point.intensity / 100) * height;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Draw peaks/valleys
  trajectory.extremes.forEach(extreme => {
    const pointIndex = points.findIndex(p => p.timestamp === extreme.timestamp);
    if (pointIndex === -1) return;
    
    const x = pointIndex * xStep;
    const y = height - (extreme.intensity / 100) * height;
    
    ctx.fillStyle = extreme.type === 'peak' ? 'rgba(255, 200, 100, 0.8)' : 'rgba(100, 200, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}
