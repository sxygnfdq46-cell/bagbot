"use client";

import React, { useState, useEffect, useMemo } from "react";
import "./multiflow.css";

// ═══════════════════════════════════════════════════════════════════
// LEVEL 13.5: MULTI-FLOW VISUALIZATION HUB
// ═══════════════════════════════════════════════════════════════════
// A complete 4D visualization + control system for multi-flow orchestration
// Features:
// - 4D Task Graph Viewer with Time/Scope/Impact/Mode dimensions
// - Execution Roadmap Panel with perfect ordering
// - Approval Queue Interface with manual controls
// - Safety Shield UI with zero-execution barriers
// - GPU-accelerated animations and conflict warnings
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

interface TaskNode {
  id: string;
  name: string;
  description: string;
  
  // 4D Coordinates
  time: number;        // Execution order (0-100)
  scope: number;       // Breadth of impact (0-100)
  impact: number;      // Risk/importance level (0-100)
  mode: "sequential" | "parallel" | "conditional" | "fallback";
  
  // Status
  status: "pending" | "ready" | "approved" | "executing" | "complete" | "failed";
  readiness: number;   // 0-100%
  
  // Dependencies
  dependencies: string[];
  conflicts: string[];
  
  // Safety
  requiresApproval: boolean;
  approvalStatus: "pending" | "approved" | "rejected" | null;
  approvalExpiry?: number;
  
  // Metadata
  estimatedDuration: number;
  priority: number;
  tags: string[];
}

interface FlowExecution {
  id: string;
  taskIds: string[];
  order: string[];
  criticalPath: string[];
  totalDuration: number;
  status: "planning" | "approved" | "executing" | "complete";
}

interface ConflictWarning {
  taskA: string;
  taskB: string;
  type: "resource" | "timing" | "dependency" | "logic";
  severity: "low" | "medium" | "high" | "critical";
  resolution?: string;
}

interface MultiFlowHubProps {
  tasks?: TaskNode[];
  execution?: FlowExecution;
  conflicts?: ConflictWarning[];
  onNodeSelect?: (task: TaskNode) => void;
  onConflictInspect?: (conflict: ConflictWarning) => void;
  onApprovalRequest?: (taskId: string) => void;
  onApprovalGrant?: (taskId: string) => void;
  onApprovalReject?: (taskId: string) => void;
  onExecutionStart?: () => void;
  showDebugInfo?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// MOCK DATA (for demo/development)
// ─────────────────────────────────────────────────────────────────

const MOCK_TASKS: TaskNode[] = [
  {
    id: "task-1",
    name: "Initialize Market Data",
    description: "Load and validate market data streams",
    time: 10,
    scope: 30,
    impact: 40,
    mode: "sequential",
    status: "complete",
    readiness: 100,
    dependencies: [],
    conflicts: [],
    requiresApproval: false,
    approvalStatus: null,
    estimatedDuration: 5000,
    priority: 10,
    tags: ["data", "initialization"]
  },
  {
    id: "task-2",
    name: "Run Risk Analysis",
    description: "Calculate position risks and exposure",
    time: 30,
    scope: 60,
    impact: 70,
    mode: "parallel",
    status: "ready",
    readiness: 100,
    dependencies: ["task-1"],
    conflicts: [],
    requiresApproval: true,
    approvalStatus: "pending",
    estimatedDuration: 8000,
    priority: 20,
    tags: ["risk", "analysis"]
  },
  {
    id: "task-3",
    name: "Generate Trade Signals",
    description: "AI signal generation based on patterns",
    time: 35,
    scope: 50,
    impact: 85,
    mode: "conditional",
    status: "ready",
    readiness: 90,
    dependencies: ["task-1"],
    conflicts: ["task-4"],
    requiresApproval: true,
    approvalStatus: "pending",
    estimatedDuration: 12000,
    priority: 25,
    tags: ["ai", "signals"]
  },
  {
    id: "task-4",
    name: "Portfolio Rebalance",
    description: "Adjust portfolio weights and positions",
    time: 40,
    scope: 80,
    impact: 90,
    mode: "sequential",
    status: "pending",
    readiness: 75,
    dependencies: ["task-2"],
    conflicts: ["task-3"],
    requiresApproval: true,
    approvalStatus: null,
    estimatedDuration: 15000,
    priority: 30,
    tags: ["portfolio", "critical"]
  },
  {
    id: "task-5",
    name: "Execute Orders",
    description: "Submit orders to exchange",
    time: 70,
    scope: 90,
    impact: 95,
    mode: "parallel",
    status: "pending",
    readiness: 0,
    dependencies: ["task-3", "task-4"],
    conflicts: [],
    requiresApproval: true,
    approvalStatus: null,
    approvalExpiry: Date.now() + 300000,
    estimatedDuration: 20000,
    priority: 40,
    tags: ["execution", "critical"]
  },
  {
    id: "task-6",
    name: "Update Metrics",
    description: "Log performance and update dashboard",
    time: 90,
    scope: 20,
    impact: 20,
    mode: "fallback",
    status: "pending",
    readiness: 100,
    dependencies: ["task-5"],
    conflicts: [],
    requiresApproval: false,
    approvalStatus: null,
    estimatedDuration: 3000,
    priority: 5,
    tags: ["metrics", "logging"]
  }
];

const MOCK_EXECUTION: FlowExecution = {
  id: "flow-1",
  taskIds: ["task-1", "task-2", "task-3", "task-4", "task-5", "task-6"],
  order: ["task-1", "task-2", "task-3", "task-4", "task-5", "task-6"],
  criticalPath: ["task-1", "task-4", "task-5"],
  totalDuration: 63000,
  status: "planning"
};

const MOCK_CONFLICTS: ConflictWarning[] = [
  {
    taskA: "task-3",
    taskB: "task-4",
    type: "resource",
    severity: "medium",
    resolution: "Execute task-3 first, then task-4"
  }
];

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function MultiFlowHub({
  tasks = MOCK_TASKS,
  execution = MOCK_EXECUTION,
  conflicts = MOCK_CONFLICTS,
  onNodeSelect,
  onConflictInspect,
  onApprovalRequest,
  onApprovalGrant,
  onApprovalReject,
  onExecutionStart,
  showDebugInfo = false
}: MultiFlowHubProps) {
  
  const [selectedTask, setSelectedTask] = useState<TaskNode | null>(null);
  const [highlightMode, setHighlightMode] = useState<"critical" | "conflicts" | "ready" | null>(null);
  const [viewMode, setViewMode] = useState<"3d" | "timeline" | "approval">("3d");
  const [animationEnabled, setAnimationEnabled] = useState(true);

  // ─────────────────────────────────────────────────────────────
  // COMPUTED PROPERTIES
  // ─────────────────────────────────────────────────────────────

  const tasksById = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {} as Record<string, TaskNode>);
  }, [tasks]);

  const approvalQueue = useMemo(() => {
    return tasks.filter(t => t.requiresApproval && t.approvalStatus === "pending");
  }, [tasks]);

  const criticalPathSet = useMemo(() => {
    return new Set(execution.criticalPath);
  }, [execution]);

  const conflictMap = useMemo(() => {
    const map: Record<string, ConflictWarning[]> = {};
    conflicts.forEach(c => {
      if (!map[c.taskA]) map[c.taskA] = [];
      if (!map[c.taskB]) map[c.taskB] = [];
      map[c.taskA].push(c);
      map[c.taskB].push(c);
    });
    return map;
  }, [conflicts]);

  // ─────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleTaskClick = (task: TaskNode) => {
    setSelectedTask(task);
    onNodeSelect?.(task);
  };

  const handleApprovalGrant = (taskId: string) => {
    onApprovalGrant?.(taskId);
  };

  const handleApprovalReject = (taskId: string) => {
    onApprovalReject?.(taskId);
  };

  const handleConflictClick = (conflict: ConflictWarning) => {
    onConflictInspect?.(conflict);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDERING HELPERS
  // ─────────────────────────────────────────────────────────────

  const getTaskColor = (task: TaskNode): string => {
    if (task.status === "complete") return "var(--color-success)";
    if (task.status === "failed") return "var(--color-error)";
    if (task.status === "executing") return "var(--color-warning)";
    if (task.requiresApproval && !task.approvalStatus) return "var(--color-danger)";
    return "var(--color-primary)";
  };

  const getImpactGlow = (impact: number): string => {
    if (impact >= 80) return "mf-glow-critical";
    if (impact >= 60) return "mf-glow-high";
    if (impact >= 40) return "mf-glow-medium";
    return "mf-glow-low";
  };

  const getModeColor = (mode: TaskNode["mode"]): string => {
    switch (mode) {
      case "sequential": return "#3b82f6";
      case "parallel": return "#8b5cf6";
      case "conditional": return "#f59e0b";
      case "fallback": return "#10b981";
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: 3D TASK GRAPH VIEW
  // ─────────────────────────────────────────────────────────────

  const render3DGraph = () => (
    <div className="mf-graph-container">
      <div className="mf-graph-axes">
        <div className="mf-axis mf-axis-time">
          <span className="mf-axis-label">Time →</span>
        </div>
        <div className="mf-axis mf-axis-scope">
          <span className="mf-axis-label">Scope →</span>
        </div>
        <div className="mf-axis mf-axis-impact">
          <span className="mf-axis-label">↑ Impact</span>
        </div>
      </div>

      <div className="mf-graph-grid">
        {tasks.map(task => {
          const isSelected = selectedTask?.id === task.id;
          const isCritical = criticalPathSet.has(task.id);
          const hasConflicts = conflictMap[task.id]?.length > 0;
          const isHighlighted = 
            highlightMode === "critical" && isCritical ||
            highlightMode === "conflicts" && hasConflicts ||
            highlightMode === "ready" && task.readiness === 100;

          return (
            <div
              key={task.id}
              className={`
                mf-task-node
                ${getImpactGlow(task.impact)}
                ${isSelected ? "mf-node-selected" : ""}
                ${isCritical ? "mf-node-critical" : ""}
                ${hasConflicts ? "mf-node-conflict" : ""}
                ${isHighlighted ? "mf-node-highlighted" : ""}
                ${animationEnabled ? "mf-animated" : ""}
              `}
              style={{
                left: `${task.time}%`,
                top: `${100 - task.scope}%`,
                transform: `translateZ(${task.impact}px)`,
                borderColor: getTaskColor(task),
                backgroundColor: getModeColor(task.mode) + "20"
              }}
              onClick={() => handleTaskClick(task)}
            >
              {/* Lock Icon for Safety */}
              {task.requiresApproval && (
                <div className="mf-node-lock">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm6 10v8H6v-8h12zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7z"/>
                  </svg>
                </div>
              )}

              {/* Readiness Meter */}
              <div className="mf-node-readiness" style={{ width: `${task.readiness}%` }} />

              {/* Node Content */}
              <div className="mf-node-content">
                <div className="mf-node-name">{task.name}</div>
                <div className="mf-node-meta">
                  <span className="mf-node-mode">{task.mode}</span>
                  <span className="mf-node-impact">I:{task.impact}</span>
                </div>
              </div>

              {/* Dependency Lines */}
              {task.dependencies.map(depId => {
                const dep = tasksById[depId];
                if (!dep) return null;
                
                return (
                  <svg
                    key={depId}
                    className="mf-dependency-line"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none"
                    }}
                  >
                    <line
                      x1={`${dep.time}%`}
                      y1={`${100 - dep.scope}%`}
                      x2={`${task.time}%`}
                      y2={`${100 - task.scope}%`}
                      className="mf-dep-line-path"
                    />
                  </svg>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER: TIMELINE VIEW
  // ─────────────────────────────────────────────────────────────

  const renderTimeline = () => (
    <div className="mf-timeline-container">
      <div className="mf-timeline-header">
        <h3>Execution Roadmap</h3>
        <div className="mf-timeline-stats">
          <span>Total Duration: {(execution.totalDuration / 1000).toFixed(1)}s</span>
          <span>Tasks: {execution.taskIds.length}</span>
          <span>Critical: {execution.criticalPath.length}</span>
        </div>
      </div>

      <div className="mf-timeline-track">
        {execution.order.map((taskId, index) => {
          const task = tasksById[taskId];
          if (!task) return null;

          const isCritical = criticalPathSet.has(taskId);
          const startPercent = (index / execution.order.length) * 100;
          const widthPercent = (task.estimatedDuration / execution.totalDuration) * 100;

          return (
            <div
              key={taskId}
              className={`
                mf-timeline-task
                ${isCritical ? "mf-timeline-critical" : ""}
                ${task.status === "complete" ? "mf-timeline-complete" : ""}
              `}
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                backgroundColor: getModeColor(task.mode)
              }}
              onClick={() => handleTaskClick(task)}
            >
              <div className="mf-timeline-task-label">
                {task.name}
                {task.requiresApproval && " 🔒"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Path Overlay */}
      <div className="mf-critical-path-overlay">
        {execution.criticalPath.map(taskId => {
          const task = tasksById[taskId];
          const index = execution.order.indexOf(taskId);
          if (!task || index === -1) return null;

          const startPercent = (index / execution.order.length) * 100;
          const widthPercent = (task.estimatedDuration / execution.totalDuration) * 100;

          return (
            <div
              key={taskId}
              className="mf-critical-marker"
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`
              }}
            />
          );
        })}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER: APPROVAL QUEUE
  // ─────────────────────────────────────────────────────────────

  const renderApprovalQueue = () => (
    <div className="mf-approval-container">
      <div className="mf-approval-header">
        <h3>🔒 Approval Queue</h3>
        <div className="mf-approval-count">{approvalQueue.length} tasks pending</div>
      </div>

      {approvalQueue.length === 0 ? (
        <div className="mf-approval-empty">
          <p>No tasks require approval</p>
        </div>
      ) : (
        <div className="mf-approval-list">
          {approvalQueue.map(task => {
            const timeRemaining = task.approvalExpiry 
              ? Math.max(0, task.approvalExpiry - Date.now())
              : null;

            return (
              <div key={task.id} className="mf-approval-item">
                <div className="mf-approval-info">
                  <div className="mf-approval-name">{task.name}</div>
                  <div className="mf-approval-desc">{task.description}</div>
                  <div className="mf-approval-meta">
                    <span className="mf-approval-impact">
                      Impact: <strong>{task.impact}</strong>
                    </span>
                    <span className="mf-approval-mode">{task.mode}</span>
                    {timeRemaining && (
                      <span className="mf-approval-timer">
                        Expires in {Math.floor(timeRemaining / 1000)}s
                      </span>
                    )}
                  </div>
                </div>

                <div className="mf-approval-actions">
                  <button
                    className="mf-btn-approve"
                    onClick={() => handleApprovalGrant(task.id)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="mf-btn-reject"
                    onClick={() => handleApprovalReject(task.id)}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER: CONFLICT PANEL
  // ─────────────────────────────────────────────────────────────

  const renderConflicts = () => (
    <div className="mf-conflicts-panel">
      <h4>⚠️ Conflicts Detected</h4>
      {conflicts.length === 0 ? (
        <p className="mf-conflicts-none">No conflicts</p>
      ) : (
        <div className="mf-conflicts-list">
          {conflicts.map((conflict, idx) => (
            <div
              key={idx}
              className={`mf-conflict-item mf-conflict-${conflict.severity}`}
              onClick={() => handleConflictClick(conflict)}
            >
              <div className="mf-conflict-header">
                <span className="mf-conflict-type">{conflict.type}</span>
                <span className="mf-conflict-severity">{conflict.severity}</span>
              </div>
              <div className="mf-conflict-tasks">
                {tasksById[conflict.taskA]?.name} ↔ {tasksById[conflict.taskB]?.name}
              </div>
              {conflict.resolution && (
                <div className="mf-conflict-resolution">
                  → {conflict.resolution}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER: CONTROL PANEL
  // ─────────────────────────────────────────────────────────────

  const renderControls = () => (
    <div className="mf-controls-panel">
      <div className="mf-controls-group">
        <label>View Mode:</label>
        <div className="mf-btn-group">
          <button
            className={viewMode === "3d" ? "active" : ""}
            onClick={() => setViewMode("3d")}
          >
            3D Graph
          </button>
          <button
            className={viewMode === "timeline" ? "active" : ""}
            onClick={() => setViewMode("timeline")}
          >
            Timeline
          </button>
          <button
            className={viewMode === "approval" ? "active" : ""}
            onClick={() => setViewMode("approval")}
          >
            Approvals
          </button>
        </div>
      </div>

      <div className="mf-controls-group">
        <label>Highlight:</label>
        <div className="mf-btn-group">
          <button
            className={highlightMode === "critical" ? "active" : ""}
            onClick={() => setHighlightMode(highlightMode === "critical" ? null : "critical")}
          >
            Critical Path
          </button>
          <button
            className={highlightMode === "conflicts" ? "active" : ""}
            onClick={() => setHighlightMode(highlightMode === "conflicts" ? null : "conflicts")}
          >
            Conflicts
          </button>
          <button
            className={highlightMode === "ready" ? "active" : ""}
            onClick={() => setHighlightMode(highlightMode === "ready" ? null : "ready")}
          >
            Ready
          </button>
        </div>
      </div>

      <div className="mf-controls-group">
        <label>
          <input
            type="checkbox"
            checked={animationEnabled}
            onChange={(e) => setAnimationEnabled(e.target.checked)}
          />
          Enable Animations
        </label>
      </div>

      <div className="mf-controls-actions">
        <button
          className="mf-btn-execute"
          onClick={onExecutionStart}
          disabled={approvalQueue.length > 0}
        >
          🚀 Execute Flow
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="multiflow-hub">
      {/* Header */}
      <div className="mf-header">
        <h2>Multi-Flow Orchestration Hub</h2>
        <div className="mf-status-badge">
          Status: <span className="mf-status-value">{execution.status}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="mf-content">
        <div className="mf-main-view">
          {viewMode === "3d" && render3DGraph()}
          {viewMode === "timeline" && renderTimeline()}
          {viewMode === "approval" && renderApprovalQueue()}
        </div>

        <div className="mf-sidebar">
          {renderControls()}
          {renderConflicts()}
          
          {/* Selected Task Details */}
          {selectedTask && (
            <div className="mf-task-details">
              <h4>{selectedTask.name}</h4>
              <p>{selectedTask.description}</p>
              <div className="mf-task-stats">
                <div>Status: <strong>{selectedTask.status}</strong></div>
                <div>Readiness: <strong>{selectedTask.readiness}%</strong></div>
                <div>Impact: <strong>{selectedTask.impact}</strong></div>
                <div>Mode: <strong>{selectedTask.mode}</strong></div>
                <div>Duration: <strong>{selectedTask.estimatedDuration}ms</strong></div>
              </div>
              {selectedTask.dependencies.length > 0 && (
                <div className="mf-task-deps">
                  <strong>Dependencies:</strong>
                  <ul>
                    {selectedTask.dependencies.map(depId => (
                      <li key={depId}>{tasksById[depId]?.name || depId}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedTask.requiresApproval && (
                <div className="mf-task-approval-warning">
                  🔒 This task requires manual approval
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      {showDebugInfo && (
        <div className="mf-debug-panel">
          <pre>{JSON.stringify({ tasks, execution, conflicts }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
