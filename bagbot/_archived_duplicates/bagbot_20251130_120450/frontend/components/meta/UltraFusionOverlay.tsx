/**
 * 🌌 ULTRA-FUSION OVERLAY
 * 
 * Master visualization component that renders Level 10 meta-consciousness.
 * This is the "god view" that displays system awareness, strategic planning,
 * and multi-agent debate in a unified holographic interface.
 * 
 * VISUAL SYSTEMS:
 * • Meta-Awareness Dashboard: System health, layer performance, diagnostics
 * • Strategic Timeline: Long-horizon goals, opportunities, scenario pathways
 * • Debate Chamber: Live agent council deliberations and votes
 * • Fusion Intensity Display: Overall consciousness level visualization
 * 
 * This component orchestrates all three Level 10 engines and renders
 * their combined consciousness as a living, breathing holographic display.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { MetaAwarenessState } from './MetaAwarenessEngine';
import type { LongHorizonState } from './LongHorizonThoughtEngine';
import type { MultiAgentDebateState, AgentPersona } from './MultiAgentDebateEngine';

// ============================================
// PROPS
// ============================================

export interface UltraFusionOverlayProps {
  metaAwareness: MetaAwarenessState | null;
  longHorizon: LongHorizonState | null;
  debate: MultiAgentDebateState | null;
  enabled?: boolean;
}

// ============================================
// ULTRA-FUSION OVERLAY COMPONENT
// ============================================

export const UltraFusionOverlay: React.FC<UltraFusionOverlayProps> = ({
  metaAwareness,
  longHorizon,
  debate,
  enabled = true
}) => {
  const [activeTab, setActiveTab] = useState<'awareness' | 'horizon' | 'debate'>('awareness');
  const [fusionIntensity, setFusionIntensity] = useState(0);
  const animationRef = useRef<number>();
  
  // Calculate fusion intensity (how "active" the meta-layer is)
  useEffect(() => {
    if (!enabled) return;
    
    let intensity = 0;
    
    // Meta-awareness contribution
    if (metaAwareness) {
      intensity += metaAwareness.systemHealth.overallScore * 0.3;
      intensity += metaAwareness.metacognitionLevel * 0.2;
    }
    
    // Long-horizon contribution
    if (longHorizon) {
      intensity += longHorizon.strategicClarity * 0.2;
      intensity += longHorizon.executionReadiness * 0.15;
    }
    
    // Debate contribution
    if (debate) {
      intensity += debate.avgConfidence * 0.1;
      intensity += debate.cohesionScore * 0.05;
    }
    
    setFusionIntensity(Math.min(1, intensity));
  }, [metaAwareness, longHorizon, debate, enabled]);
  
  // Pulse animation
  useEffect(() => {
    if (!enabled) return;
    
    let phase = 0;
    const animate = () => {
      phase += 0.02;
      const pulse = Math.sin(phase) * 0.5 + 0.5;
      
      // Apply pulse effect
      const container = document.querySelector('.ultra-fusion-container');
      if (container) {
        (container as HTMLElement).style.setProperty('--fusion-pulse', pulse.toString());
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled]);
  
  if (!enabled) return null;
  
  return (
    <div className="ultra-fusion-container" data-intensity={fusionIntensity.toFixed(2)}>
      {/* Header with fusion intensity indicator */}
      <div className="fusion-header">
        <div className="fusion-title">
          <span className="title-glow">LEVEL 10</span>
          <span className="title-subtitle">Meta-Consciousness</span>
        </div>
        
        <div className="fusion-intensity-meter">
          <div className="intensity-label">Fusion Intensity</div>
          <div className="intensity-bar">
            <div 
              className="intensity-fill" 
              style={{ width: `${fusionIntensity * 100}%` }}
            />
          </div>
          <div className="intensity-value">{(fusionIntensity * 100).toFixed(0)}%</div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="fusion-tabs">
        <button
          className={`fusion-tab ${activeTab === 'awareness' ? 'active' : ''}`}
          onClick={() => setActiveTab('awareness')}
        >
          <span className="tab-icon">🧠</span>
          <span className="tab-label">Meta-Awareness</span>
          {metaAwareness && (
            <span className="tab-badge">{metaAwareness.activeAlerts.length}</span>
          )}
        </button>
        
        <button
          className={`fusion-tab ${activeTab === 'horizon' ? 'active' : ''}`}
          onClick={() => setActiveTab('horizon')}
        >
          <span className="tab-icon">🔮</span>
          <span className="tab-label">Strategic Horizon</span>
          {longHorizon && (
            <span className="tab-badge">{longHorizon.activeGoals.length}</span>
          )}
        </button>
        
        <button
          className={`fusion-tab ${activeTab === 'debate' ? 'active' : ''}`}
          onClick={() => setActiveTab('debate')}
        >
          <span className="tab-icon">🗣️</span>
          <span className="tab-label">Council Debate</span>
          {debate && debate.latestDecision && (
            <span className="tab-badge confidence">
              {(debate.latestDecision.confidence * 100).toFixed(0)}%
            </span>
          )}
        </button>
      </div>
      
      {/* Content panels */}
      <div className="fusion-content">
        {activeTab === 'awareness' && (
          <MetaAwarenessPanel metaAwareness={metaAwareness} />
        )}
        
        {activeTab === 'horizon' && (
          <LongHorizonPanel longHorizon={longHorizon} />
        )}
        
        {activeTab === 'debate' && (
          <DebatePanel debate={debate} />
        )}
      </div>
      
      {/* Background effects */}
      <div className="fusion-background">
        <div className="fusion-grid" />
        <div className="fusion-particles" />
        <div className="fusion-aura" style={{ opacity: fusionIntensity }} />
      </div>
    </div>
  );
};

// ============================================
// META-AWARENESS PANEL
// ============================================

const MetaAwarenessPanel: React.FC<{ metaAwareness: MetaAwarenessState | null }> = ({
  metaAwareness
}) => {
  if (!metaAwareness) {
    return <div className="panel-empty">Initializing meta-awareness...</div>;
  }
  
  return (
    <div className="meta-awareness-panel">
      {/* System Health Overview */}
      <div className="health-overview">
        <h3 className="section-title">System Health</h3>
        
        <div className="health-status-card" data-status={metaAwareness.systemHealth.overallHealth}>
          <div className="status-indicator">
            <div className="status-pulse" />
            <div className="status-label">{metaAwareness.systemHealth.overallHealth.toUpperCase()}</div>
          </div>
          
          <div className="health-score">
            {(metaAwareness.systemHealth.overallScore * 100).toFixed(0)}
            <span className="score-unit">%</span>
          </div>
        </div>
        
        <div className="health-metrics">
          <div className="metric">
            <div className="metric-label">CPU Usage</div>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ width: `${metaAwareness.systemHealth.cpuUsage * 100}%` }}
              />
            </div>
            <div className="metric-value">{(metaAwareness.systemHealth.cpuUsage * 100).toFixed(0)}%</div>
          </div>
          
          <div className="metric">
            <div className="metric-label">Coherence</div>
            <div className="metric-bar">
              <div 
                className="metric-fill coherence" 
                style={{ width: `${metaAwareness.overallCoherence * 100}%` }}
              />
            </div>
            <div className="metric-value">{(metaAwareness.overallCoherence * 100).toFixed(0)}%</div>
          </div>
          
          <div className="metric">
            <div className="metric-label">Latency</div>
            <div className="metric-value-only">
              {metaAwareness.systemHealth.systemLatency.toFixed(0)}ms
            </div>
          </div>
        </div>
      </div>
      
      {/* Layer Performance */}
      <div className="layer-performance">
        <h3 className="section-title">Layer Performance</h3>
        
        <div className="layer-grid">
          {metaAwareness.layerPerformance.slice(0, 6).map(layer => (
            <div key={layer.layerId} className="layer-card" data-health={layer.healthStatus}>
              <div className="layer-name">{layer.layerId}</div>
              <div className="layer-health-dot" />
              <div className="layer-metrics">
                <div className="layer-metric">
                  <span className="metric-icon">⚡</span>
                  {(layer.accuracy * 100).toFixed(0)}%
                </div>
                <div className="layer-metric">
                  <span className="metric-icon">🚀</span>
                  {layer.latency.toFixed(0)}ms
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Active Alerts */}
      {metaAwareness.activeAlerts.length > 0 && (
        <div className="alerts-section">
          <h3 className="section-title">Active Alerts</h3>
          
          <div className="alerts-list">
            {metaAwareness.activeAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="alert-card" data-severity={alert.severity}>
                <div className="alert-icon">{
                  alert.severity === 'critical' ? '🚨' :
                  alert.severity === 'error' ? '⚠️' :
                  alert.severity === 'warning' ? '⚡' : 'ℹ️'
                }</div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-description">{alert.description}</div>
                </div>
                <div className="alert-layer">{alert.layerId}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Self-Awareness Metrics */}
      <div className="self-awareness-metrics">
        <h3 className="section-title">Self-Awareness</h3>
        
        <div className="awareness-grid">
          <div className="awareness-metric">
            <div className="metric-icon-large">🔍</div>
            <div className="metric-label">Introspection</div>
            <div className="metric-value">{(metaAwareness.introspectionDepth * 100).toFixed(0)}%</div>
          </div>
          
          <div className="awareness-metric">
            <div className="metric-icon-large">🔧</div>
            <div className="metric-label">Self-Correction</div>
            <div className="metric-value">{(metaAwareness.selfCorrectionRate * 100).toFixed(0)}%</div>
          </div>
          
          <div className="awareness-metric">
            <div className="metric-icon-large">🧩</div>
            <div className="metric-label">Adaptive Capacity</div>
            <div className="metric-value">{(metaAwareness.adaptiveCapacity * 100).toFixed(0)}%</div>
          </div>
          
          <div className="awareness-metric">
            <div className="metric-icon-large">🧠</div>
            <div className="metric-label">Metacognition</div>
            <div className="metric-value">{(metaAwareness.metacognitionLevel * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LONG-HORIZON PANEL
// ============================================

const LongHorizonPanel: React.FC<{ longHorizon: LongHorizonState | null }> = ({
  longHorizon
}) => {
  if (!longHorizon) {
    return <div className="panel-empty">Initializing strategic planning...</div>;
  }
  
  return (
    <div className="long-horizon-panel">
      {/* Strategic Narrative */}
      <div className="strategic-narrative">
        <h3 className="section-title">Strategic Plan</h3>
        
        <div className="narrative-card">
          <div className="narrative-title">{longHorizon.strategicNarrative.title}</div>
          <div className="narrative-summary">{longHorizon.strategicNarrative.summary}</div>
          
          <div className="narrative-sections">
            <div className="narrative-section">
              <div className="section-label">Current Situation</div>
              <div className="section-text">{longHorizon.strategicNarrative.currentSituation}</div>
            </div>
            
            <div className="narrative-section">
              <div className="section-label">Macro Context</div>
              <div className="section-text">{longHorizon.strategicNarrative.macroContext}</div>
            </div>
            
            <div className="narrative-section">
              <div className="section-label">Action Plan</div>
              <div className="section-text">{longHorizon.strategicNarrative.actionPlan}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Strategic Goals */}
      <div className="strategic-goals">
        <h3 className="section-title">Active Goals</h3>
        
        <div className="goals-list">
          {longHorizon.activeGoals.slice(0, 4).map(goal => (
            <div key={goal.id} className="goal-card" data-trajectory={goal.trajectory}>
              <div className="goal-header">
                <div className="goal-title">{goal.title}</div>
                <div className="goal-progress">{goal.progressPercent.toFixed(0)}%</div>
              </div>
              
              <div className="goal-progress-bar">
                <div 
                  className="goal-progress-fill" 
                  style={{ width: `${goal.progressPercent}%` }}
                />
              </div>
              
              <div className="goal-details">
                <div className="goal-detail">
                  <span className="detail-label">Target:</span>
                  <span className="detail-value">{goal.targetValue}{goal.unit}</span>
                </div>
                <div className="goal-detail">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value trajectory">{goal.trajectory}</span>
                </div>
              </div>
              
              <div className="goal-milestones">
                {goal.milestones.map(milestone => (
                  <div 
                    key={milestone.id} 
                    className={`milestone ${milestone.achieved ? 'achieved' : ''}`}
                  >
                    {milestone.achieved ? '✓' : '○'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Macro Trends */}
      <div className="macro-trends">
        <h3 className="section-title">Macro Trends</h3>
        
        <div className="trends-list">
          {longHorizon.macroTrends.slice(0, 3).map((trend, idx) => (
            <div key={idx} className="trend-card" data-phase={trend.currentPhase}>
              <div className="trend-header">
                <div className="trend-name">{trend.name}</div>
                <div className="trend-confidence">
                  {(trend.confidenceLevel * 100).toFixed(0)}% confident
                </div>
              </div>
              
              <div className="trend-momentum">
                <div className="momentum-bar">
                  <div 
                    className="momentum-fill" 
                    style={{ 
                      width: `${Math.abs(trend.momentum) * 100}%`,
                      background: trend.momentum > 0 ? '#4ade80' : '#f87171'
                    }}
                  />
                </div>
                <div className="momentum-label">
                  {trend.momentum > 0 ? 'Positive' : 'Negative'} momentum
                </div>
              </div>
              
              <div className="trend-impact">
                <span className="impact-label">Impact:</span>
                <span className="impact-value">{(trend.portfolioImpact * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scenario Pathways */}
      {longHorizon.mostLikelyPathway && (
        <div className="scenario-pathway">
          <h3 className="section-title">Most Likely Scenario</h3>
          
          <div className="pathway-card">
            <div className="pathway-header">
              <div className="pathway-name">{longHorizon.mostLikelyPathway.name}</div>
              <div className="pathway-probability">
                {(longHorizon.mostLikelyPathway.probability * 100).toFixed(0)}% likely
              </div>
            </div>
            
            <div className="pathway-description">
              {longHorizon.mostLikelyPathway.description}
            </div>
            
            <div className="pathway-outcomes">
              <div className="outcome best">
                <div className="outcome-label">Best Case</div>
                <div className="outcome-value">
                  +{longHorizon.mostLikelyPathway.bestCase.returnPercent.toFixed(1)}%
                </div>
              </div>
              
              <div className="outcome base">
                <div className="outcome-label">Base Case</div>
                <div className="outcome-value">
                  +{longHorizon.mostLikelyPathway.baseCase.returnPercent.toFixed(1)}%
                </div>
              </div>
              
              <div className="outcome worst">
                <div className="outcome-label">Worst Case</div>
                <div className="outcome-value">
                  {longHorizon.mostLikelyPathway.worstCase.returnPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// DEBATE PANEL
// ============================================

const DebatePanel: React.FC<{ debate: MultiAgentDebateState | null }> = ({
  debate
}) => {
  if (!debate) {
    return <div className="panel-empty">Initializing council...</div>;
  }
  
  // Agent colors
  const agentColors: Record<AgentPersona, string> = {
    'bull': '#4ade80',
    'bear': '#f87171',
    'neutral': '#60a5fa',
    'risk-manager': '#fbbf24',
    'opportunist': '#a78bfa'
  };
  
  return (
    <div className="debate-panel">
      {/* Council Overview */}
      <div className="council-overview">
        <h3 className="section-title">The Council</h3>
        
        <div className="council-grid">
          {debate.council.map(agent => (
            <div 
              key={agent.persona} 
              className="agent-card"
              style={{ borderColor: agentColors[agent.persona] }}
            >
              <div className="agent-avatar" style={{ background: agentColors[agent.persona] }}>
                {agent.name.charAt(0)}
              </div>
              
              <div className="agent-info">
                <div className="agent-name">{agent.name}</div>
                <div className="agent-description">{agent.description}</div>
              </div>
              
              <div className="agent-metrics">
                <div className="agent-metric">
                  <span className="metric-label">Accuracy</span>
                  <span className="metric-value">
                    {(agent.recentAccuracy * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="agent-metric">
                  <span className="metric-label">Weight</span>
                  <span className="metric-value">
                    {(agent.votingWeight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="agent-mood" data-mood={agent.currentMood}>
                {agent.currentMood}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Latest Decision */}
      {debate.latestDecision && (
        <div className="latest-decision">
          <h3 className="section-title">Latest Decision</h3>
          
          <div className="decision-card">
            <div className="decision-header">
              <div className="decision-stance" data-stance={debate.latestDecision.decision}>
                {debate.latestDecision.decision.toUpperCase()}
              </div>
              
              <div className="decision-confidence">
                <div className="confidence-label">Confidence</div>
                <div className="confidence-value">
                  {(debate.latestDecision.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            <div className="decision-reasoning">
              {debate.latestDecision.majorityReasoning}
            </div>
            
            {/* Vote Summary */}
            <div className="vote-summary">
              <h4 className="vote-title">Council Votes</h4>
              <div className="vote-grid">
                {Object.entries(debate.latestDecision.voteSummary).map(([persona, stance]) => (
                  <div key={persona} className="vote-item">
                    <div 
                      className="vote-dot" 
                      style={{ background: agentColors[persona as AgentPersona] }}
                    />
                    <div className="vote-agent">{persona}</div>
                    <div className="vote-stance" data-stance={stance}>{stance}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Unanimity meter */}
            <div className="unanimity-section">
              <div className="unanimity-label">Unanimity</div>
              <div className="unanimity-bar">
                <div 
                  className="unanimity-fill" 
                  style={{ width: `${debate.latestDecision.unanimity * 100}%` }}
                />
              </div>
              <div className="unanimity-value">
                {(debate.latestDecision.unanimity * 100).toFixed(0)}%
              </div>
            </div>
            
            {/* Minority report if exists */}
            {debate.latestDecision.minorityView && (
              <div className="minority-report">
                <div className="minority-label">Minority View</div>
                <div className="minority-text">{debate.latestDecision.minorityView}</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Council Health */}
      <div className="council-health">
        <h3 className="section-title">Council Health</h3>
        
        <div className="health-metrics-grid">
          <div className="health-metric">
            <div className="metric-icon-large">🤝</div>
            <div className="metric-label">Cohesion</div>
            <div className="metric-value">{(debate.cohesionScore * 100).toFixed(0)}%</div>
          </div>
          
          <div className="health-metric">
            <div className="metric-icon-large">💡</div>
            <div className="metric-label">Debate Quality</div>
            <div className="metric-value">{(debate.avgDebateQuality * 100).toFixed(0)}%</div>
          </div>
          
          <div className="health-metric">
            <div className="metric-icon-large">🎯</div>
            <div className="metric-label">Avg Confidence</div>
            <div className="metric-value">{(debate.avgConfidence * 100).toFixed(0)}%</div>
          </div>
          
          <div className="health-metric">
            <div className="metric-icon-large">⚔️</div>
            <div className="metric-label">Conflict Level</div>
            <div className="metric-value">{(debate.conflictLevel * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
      
      {/* Recent Arguments */}
      {debate.activeDebate && debate.activeDebate.arguments.length > 0 && (
        <div className="arguments-section">
          <h3 className="section-title">Recent Arguments</h3>
          
          <div className="arguments-list">
            {debate.activeDebate.arguments.slice(0, 3).map((arg, idx) => (
              <div 
                key={idx} 
                className="argument-card"
                style={{ borderLeftColor: agentColors[arg.agentPersona] }}
              >
                <div className="argument-header">
                  <div className="argument-agent">{arg.agentPersona}</div>
                  <div className="argument-stance" data-stance={arg.position}>
                    {arg.position}
                  </div>
                </div>
                
                <div className="argument-claim">{arg.claim}</div>
                <div className="argument-reasoning">{arg.reasoning}</div>
                
                <div className="argument-strength">
                  <div className="strength-label">Strength</div>
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ width: `${arg.strength * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UltraFusionOverlay;
