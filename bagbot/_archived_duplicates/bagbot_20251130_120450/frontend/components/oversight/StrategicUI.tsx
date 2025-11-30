/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 14.7: STRATEGIC OVERSIGHT UI
 * ═══════════════════════════════════════════════════════════════════
 * Visual dashboard for all Level 14 oversight systems.
 * Shows forecasts, risks, recommendations, and approval controls.
 * 
 * SAFETY: UI only - all buttons trigger human decisions
 * PURPOSE: Human-readable interface for strategic analysis
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useState, useEffect } from 'react';
import './strategic.css';

// Import types
import type { SystemHealthSnapshot, RiskLevel } from './StrategicStateMonitor';
import type { ForecastScenario, ExecutionPath } from './MultiPathForecastEngine';
import type { CommandIntent } from './IntentClarificationMatrix';
import type { RiskMap, RiskZone } from './RiskMapGenerator';
import type { OversightReport } from './OversightRecommendationEngine';
import type { ApprovalRequest } from './PreExecutionAuditGate';

// ─────────────────────────────────────────────────────────────────
// COMPONENT PROPS
// ─────────────────────────────────────────────────────────────────

export interface StrategicUIProps {
  command: string;
  health: SystemHealthSnapshot;
  forecast: ForecastScenario;
  intent: CommandIntent;
  riskMap: RiskMap;
  report: OversightReport;
  approvalRequest: ApprovalRequest;
  
  // Event handlers
  onApprove: (requestId: string, reason?: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  onRewrite: (requestId: string, newCommand: string) => void;
  onRefresh?: () => void;
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function StrategicUI(props: StrategicUIProps) {
  const { command, health, forecast, intent, riskMap, report, approvalRequest } = props;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'risk' | 'recommendations'>('overview');
  const [rewriteMode, setRewriteMode] = useState(false);
  const [rewriteText, setRewriteText] = useState(command);
  const [approvalReason, setApprovalReason] = useState('');
  
  // Auto-refresh timer
  useEffect(() => {
    if (props.onRefresh) {
      const interval = setInterval(props.onRefresh, 5000);
      return () => clearInterval(interval);
    }
  }, [props.onRefresh]);
  
  // ───────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ───────────────────────────────────────────────────────────────
  
  const renderStabilityBar = () => (
    <div className="strategic-stability-bar">
      <div className="ssb-label">System Stability</div>
      <div className="ssb-bar">
        <div 
          className={`ssb-fill ssb-${health.overall}`}
          style={{ width: `${getStabilityPercent(health.overall)}%` }}
        />
      </div>
      <div className="ssb-status">{health.overall.toUpperCase()}</div>
    </div>
  );
  
  const renderWarnings = () => {
    if (report.warnings.length === 0) {
      return <div className="strategic-no-warnings">✅ No warnings</div>;
    }
    
    return (
      <div className="strategic-warnings">
        {report.warnings.map((warning, idx) => (
          <div key={idx} className={`sw-item sw-${warning.priority}`}>
            <div className="sw-icon">{getWarningIcon(warning.priority)}</div>
            <div className="sw-content">
              <div className="sw-title">{warning.title}</div>
              <div className="sw-description">{warning.description}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderForecast = () => (
    <div className="strategic-forecast">
      <div className="sf-header">Execution Paths</div>
      <div className="sf-paths">
        {forecast.paths.map((path, idx) => (
          <div key={idx} className={`sf-path ${path.id === forecast.recommendedPath.id ? 'sf-recommended' : ''}`}>
            <div className="sf-path-header">
              <span className="sf-path-name">{formatPathName(path.id)}</span>
              {path.id === forecast.recommendedPath.id && <span className="sf-badge">RECOMMENDED</span>}
            </div>
            <div className="sf-path-stats">
              <div className="sf-stat">
                <span className="sf-stat-label">Duration</span>
                <span className="sf-stat-value">{Math.round(path.duration / 1000)}s</span>
              </div>
              <div className="sf-stat">
                <span className="sf-stat-label">Success Rate</span>
                <span className="sf-stat-value">{path.outcome.successProbability}%</span>
              </div>
              <div className="sf-stat">
                <span className="sf-stat-label">Risk Score</span>
                <span className={`sf-stat-value sf-risk-${getRiskClass(path.riskScore)}`}>
                  {path.riskScore}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderRiskMap = () => (
    <div className="strategic-risk-map">
      <div className="srm-header">
        <span>Risk Assessment</span>
        <span className={`srm-zone srm-zone-${riskMap.overallZone.toLowerCase()}`}>
          {riskMap.overallZone}
        </span>
      </div>
      
      <div className="srm-grid">
        {/* Simplified 2D projection of 4D risk space */}
        <div className="srm-axis srm-axis-x">Impact →</div>
        <div className="srm-axis srm-axis-y">↑ Scope</div>
        <div className="srm-canvas">
          {renderRiskPoints(riskMap)}
        </div>
      </div>
      
      <div className="srm-legend">
        <div className="srm-legend-item"><span className="srm-dot srm-safe"></span>Safe</div>
        <div className="srm-legend-item"><span className="srm-dot srm-caution"></span>Caution</div>
        <div className="srm-legend-item"><span className="srm-dot srm-unstable"></span>Unstable</div>
        <div className="srm-legend-item"><span className="srm-dot srm-forbidden"></span>Forbidden</div>
      </div>
    </div>
  );
  
  const renderRiskPoints = (map: RiskMap) => {
    // Sample points for visualization (take every 10th point)
    const sampledPoints = map.riskPoints.filter((_, idx) => idx % 10 === 0);
    
    return sampledPoints.map((point, idx) => (
      <div
        key={idx}
        className={`srm-point srm-point-${point.zone.toLowerCase()}`}
        style={{
          left: `${point.coordinate.impact}%`,
          bottom: `${point.coordinate.scope}%`
        }}
        title={`Zone: ${point.zone}, Score: ${Math.round(point.score)}`}
      />
    ));
  };
  
  const renderRecommendations = () => (
    <div className="strategic-recommendations">
      <div className="sr-section">
        <h3>Execution Plan</h3>
        <div className={`sr-plan ${report.shouldProceed ? 'sr-proceed' : 'sr-block'}`}>
          <div className="sr-plan-status">
            {report.shouldProceed ? '✅ Can Proceed' : '❌ Cannot Proceed'}
          </div>
          <p className="sr-plan-rationale">{report.executionPlan.rationale}</p>
          <div className="sr-plan-details">
            <div>Expected Duration: {Math.round(report.executionPlan.expectedDuration / 1000)}s</div>
            <div>Confidence: {report.executionPlan.confidence}%</div>
          </div>
        </div>
      </div>
      
      {report.alternatives.length > 0 && (
        <div className="sr-section">
          <h3>Alternatives</h3>
          {report.alternatives.map((alt, idx) => (
            <div key={idx} className="sr-alternative">
              <div className="sr-alt-title">{alt.description}</div>
              <div className="sr-alt-details">
                <div className="sr-alt-pros">
                  <strong>Advantages:</strong>
                  <ul>{alt.advantages.map((adv, i) => <li key={i}>{adv}</li>)}</ul>
                </div>
                <div className="sr-alt-cons">
                  <strong>Disadvantages:</strong>
                  <ul>{alt.disadvantages.map((dis, i) => <li key={i}>{dis}</li>)}</ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="sr-section">
        <h3>Final Advice</h3>
        <div className="sr-advice">{report.finalAdvice}</div>
      </div>
    </div>
  );
  
  const renderApprovalControls = () => (
    <div className="strategic-approval">
      <div className="sa-command">
        <div className="sa-command-label">Command:</div>
        {rewriteMode ? (
          <textarea
            className="sa-command-input"
            value={rewriteText}
            onChange={(e) => setRewriteText(e.target.value)}
            rows={3}
          />
        ) : (
          <div className="sa-command-text">{command}</div>
        )}
      </div>
      
      <div className="sa-reason">
        <input
          type="text"
          className="sa-reason-input"
          placeholder="Optional: Add reason for decision..."
          value={approvalReason}
          onChange={(e) => setApprovalReason(e.target.value)}
        />
      </div>
      
      <div className="sa-buttons">
        <button
          className="sa-btn sa-approve"
          onClick={() => props.onApprove(approvalRequest.id, approvalReason)}
          disabled={!report.shouldProceed}
        >
          ✓ Approve
        </button>
        
        <button
          className="sa-btn sa-rewrite"
          onClick={() => {
            if (rewriteMode) {
              props.onRewrite(approvalRequest.id, rewriteText);
              setRewriteMode(false);
            } else {
              setRewriteMode(true);
            }
          }}
        >
          ✎ {rewriteMode ? 'Submit Rewrite' : 'Rewrite'}
        </button>
        
        <button
          className="sa-btn sa-reject"
          onClick={() => props.onReject(approvalRequest.id, approvalReason)}
        >
          ✗ Reject
        </button>
      </div>
      
      <div className="sa-timeout">
        Expires: {formatTimeout(approvalRequest.expiresAt)}
      </div>
    </div>
  );
  
  // ───────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ───────────────────────────────────────────────────────────────
  
  return (
    <div className="strategic-ui">
      <div className="strategic-header">
        <h1>Strategic Oversight</h1>
        <div className="strategic-meta">
          <span>Confidence: {report.confidence}%</span>
          <span>Depth: {report.analysisDepth}%</span>
        </div>
      </div>
      
      {renderStabilityBar()}
      
      <div className="strategic-tabs">
        <button
          className={`st-tab ${activeTab === 'overview' ? 'st-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`st-tab ${activeTab === 'forecast' ? 'st-active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          Forecast
        </button>
        <button
          className={`st-tab ${activeTab === 'risk' ? 'st-active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          Risk Map
        </button>
        <button
          className={`st-tab ${activeTab === 'recommendations' ? 'st-active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>
      
      <div className="strategic-content">
        {activeTab === 'overview' && (
          <>
            {renderWarnings()}
            <div className="strategic-quick-stats">
              <div className="sqs-item">
                <div className="sqs-label">Risk Zone</div>
                <div className={`sqs-value sqs-zone-${riskMap.overallZone.toLowerCase()}`}>
                  {riskMap.overallZone}
                </div>
              </div>
              <div className="sqs-item">
                <div className="sqs-label">Success Rate</div>
                <div className="sqs-value">
                  {forecast.recommendedPath.outcome.successProbability}%
                </div>
              </div>
              <div className="sqs-item">
                <div className="sqs-label">Duration</div>
                <div className="sqs-value">
                  ~{Math.round(forecast.recommendedPath.duration / 1000)}s
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'forecast' && renderForecast()}
        {activeTab === 'risk' && renderRiskMap()}
        {activeTab === 'recommendations' && renderRecommendations()}
      </div>
      
      {renderApprovalControls()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

function getStabilityPercent(level: RiskLevel): number {
  const map: Record<RiskLevel, number> = {
    safe: 100,
    caution: 75,
    warning: 50,
    danger: 25,
    critical: 10
  };
  return map[level] || 50;
}

function getWarningIcon(priority: string): string {
  const icons: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
    info: 'ℹ️'
  };
  return icons[priority] || '⚠️';
}

function formatPathName(id: string): string {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getRiskClass(score: number): string {
  if (score > 80) return 'critical';
  if (score > 60) return 'high';
  if (score > 40) return 'medium';
  return 'low';
}

function formatTimeout(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining < 0) return 'EXPIRED';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  
  return `${minutes}m ${seconds}s`;
}
