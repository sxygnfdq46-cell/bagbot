/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 15.7: ROLLING MEMORY UI
 * ═══════════════════════════════════════════════════════════════════
 * Visual dashboard for 72-hour technical memory with timeline,
 * heatmaps, manual controls, and real-time sync status.
 * 
 * SAFETY: Transparent memory visualization for user oversight
 * PURPOSE: Full visibility into what BagBot remembers and why
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RollingMemoryCore, type MemoryEntry, type MemoryType } from './RollingMemoryCore';
import { TechnicalContextWeaver, type ContextThread } from './TechnicalContextWeaver';
import { IntentThreadTracker, type TechnicalIntent } from './IntentThreadTracker';
import { MemoryReliabilityMatrix, type ReliabilityScore } from './MemoryReliabilityMatrix';
import { ContinuitySyncLayer, type SyncState } from './ContinuitySyncLayer';
import { MemoryAuditGate, type ApprovalRequest, type MemoryStats } from './MemoryAuditGate';

// ─────────────────────────────────────────────────────────────────
// COMPONENT PROPS
// ─────────────────────────────────────────────────────────────────

interface RollingMemoryUIProps {
  memoryCore: RollingMemoryCore;
  contextWeaver: TechnicalContextWeaver;
  intentTracker: IntentThreadTracker;
  reliabilityMatrix: MemoryReliabilityMatrix;
  syncLayer: ContinuitySyncLayer;
  auditGate: MemoryAuditGate;
  visible?: boolean;
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export const RollingMemoryUI: React.FC<RollingMemoryUIProps> = ({
  memoryCore,
  contextWeaver,
  intentTracker,
  reliabilityMatrix,
  syncLayer,
  auditGate,
  visible = true,
  onClose
}) => {
  
  const [activeTab, setActiveTab] = useState<'timeline' | 'memory' | 'intents' | 'sync' | 'audit'>('timeline');
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [threads, setThreads] = useState<ContextThread[]>([]);
  const [intents, setIntents] = useState<TechnicalIntent[]>([]);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const updateInterval = useRef<NodeJS.Timeout>();

  // ─────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 2 seconds
    updateInterval.current = setInterval(loadData, 2000);
    
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  const loadData = () => {
    // Load memory entries
    const allEntries = memoryCore.query({});
    setEntries(allEntries);
    
    // Load context threads
    const weave = contextWeaver.weave(allEntries);
    setThreads(weave.threads);
    
    // Load intents
    const activeIntents = intentTracker.getActive();
    setIntents(activeIntents);
    
    // Load sync state
    const sync = syncLayer.getSyncState();
    setSyncState(sync);
    
    // Load statistics
    const memStats = auditGate.getStatistics(allEntries);
    setStats(memStats);
    
    // Load pending approvals
    const pending = auditGate.getPendingRequests();
    setApprovalRequests(pending);
  };

  // ─────────────────────────────────────────────────────────────
  // APPROVAL HANDLING
  // ─────────────────────────────────────────────────────────────

  const handleApprove = (requestId: string) => {
    auditGate.approve(requestId, 'user', 'Approved via UI');
    loadData();
  };

  const handleReject = (requestId: string) => {
    auditGate.reject(requestId, 'user', 'Rejected via UI');
    loadData();
  };

  // ─────────────────────────────────────────────────────────────
  // MANUAL CONTROLS
  // ─────────────────────────────────────────────────────────────

  const handlePurgeExpired = async () => {
    const expiredCount = stats?.expired || 0;
    
    if (expiredCount === 0) {
      alert('No expired entries to purge');
      return;
    }
    
    const approved = await auditGate.safePurge(expiredCount);
    
    if (approved) {
      entries.forEach(entry => {
        if (auditGate.isExpired(entry)) {
          memoryCore.delete(entry.id);
        }
      });
      loadData();
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const approved = await auditGate.safeDelete(entryId);
    
    if (approved) {
      memoryCore.delete(entryId);
      loadData();
    }
  };

  const handleExtendExpiry = (entryId: string) => {
    const hours = prompt('Extend expiration by how many hours?', '24');
    if (!hours) return;
    
    const additionalTime = parseInt(hours) * 3600 * 1000;
    auditGate.extendExpiration(entryId, additionalTime);
    alert(`Extended expiration by ${hours} hours`);
  };

  // ─────────────────────────────────────────────────────────────
  // SEARCH & FILTER
  // ─────────────────────────────────────────────────────────────

  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      entry.id.toLowerCase().includes(query) ||
      entry.type.toLowerCase().includes(query) ||
      JSON.stringify(entry.content).toLowerCase().includes(query)
    );
  });

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (!visible) return null;

  return (
    <div className="rolling-memory-ui">
      <div className="memory-header">
        <div className="header-left">
          <h2>🧠 Rolling Memory Intelligence</h2>
          <div className="memory-status">
            <span className={`sync-indicator sync-${syncState?.status || 'offline'}`}>
              {syncState?.status || 'offline'}
            </span>
            <span className="memory-count">{entries.length} entries</span>
            <span className="sync-tabs">{syncState?.onlineTabs || 0} tabs</span>
          </div>
        </div>
        <div className="header-right">
          {approvalRequests.length > 0 && (
            <div className="approval-badge">{approvalRequests.length} pending</div>
          )}
          {onClose && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      <div className="memory-tabs">
        <button
          className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button
          className={`tab ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          Memory Browser
        </button>
        <button
          className={`tab ${activeTab === 'intents' ? 'active' : ''}`}
          onClick={() => setActiveTab('intents')}
        >
          Intents
        </button>
        <button
          className={`tab ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          Sync Status
        </button>
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Log
        </button>
      </div>

      <div className="memory-content">
        {activeTab === 'timeline' && (
          <TimelineView
            threads={threads}
            entries={entries}
            onSelectEntry={setSelectedEntry}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryBrowserView
            entries={filteredEntries}
            selectedEntry={selectedEntry}
            onSelectEntry={setSelectedEntry}
            onDelete={handleDeleteEntry}
            onExtend={handleExtendExpiry}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            reliabilityMatrix={reliabilityMatrix}
            auditGate={auditGate}
          />
        )}

        {activeTab === 'intents' && (
          <IntentsView
            intents={intents}
            intentTracker={intentTracker}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'sync' && (
          <SyncStatusView
            syncState={syncState}
            syncLayer={syncLayer}
            stats={stats}
            onPurgeExpired={handlePurgeExpired}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView
            auditGate={auditGate}
            approvalRequests={approvalRequests}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// TIMELINE VIEW
// ─────────────────────────────────────────────────────────────────

const TimelineView: React.FC<{
  threads: ContextThread[];
  entries: MemoryEntry[];
  onSelectEntry: (id: string) => void;
}> = ({ threads, entries, onSelectEntry }) => {
  
  const now = Date.now();
  const timeRange = 72 * 3600 * 1000; // 72 hours
  
  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <h3>Technical Context Timeline</h3>
        <div className="timeline-legend">
          <span className="legend-item"><span className="dot critical"></span>Critical</span>
          <span className="legend-item"><span className="dot high"></span>High</span>
          <span className="legend-item"><span className="dot medium"></span>Medium</span>
          <span className="legend-item"><span className="dot low"></span>Low</span>
        </div>
      </div>

      <div className="threads-container">
        {threads.map(thread => (
          <div key={thread.id} className="thread-block">
            <div className="thread-header">
              <h4>{thread.name}</h4>
              <span className={`thread-status ${thread.status}`}>{thread.status}</span>
              <span className="thread-confidence">{thread.confidence}% confidence</span>
            </div>
            
            <div className="thread-timeline">
              {thread.entries.map(entryId => {
                const entry = entries.find(e => e.id === entryId);
                if (!entry) return null;
                
                const position = ((now - entry.createdAt) / timeRange) * 100;
                if (position > 100) return null;
                
                return (
                  <div
                    key={entry.id}
                    className={`timeline-point priority-${entry.priority}`}
                    style={{ left: `${100 - position}%` }}
                    onClick={() => onSelectEntry(entry.id)}
                    title={`${entry.type} - ${new Date(entry.createdAt).toLocaleString()}`}
                  />
                );
              })}
            </div>

            {thread.milestones.length > 0 && (
              <div className="thread-milestones">
                {thread.milestones.slice(-3).map((milestone, idx) => (
                  <div key={idx} className={`milestone milestone-${milestone.type}`}>
                    <span className="milestone-icon">
                      {milestone.type === 'critical' ? '⚡' : milestone.type === 'major' ? '🎯' : '📍'}
                    </span>
                    <span className="milestone-desc">{milestone.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {threads.length === 0 && (
          <div className="empty-state">
            <p>No context threads yet</p>
            <p className="empty-hint">Technical context will appear as you work</p>
          </div>
        )}
      </div>

      <div className="timeline-axis">
        <span>72h ago</span>
        <span>48h ago</span>
        <span>24h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MEMORY BROWSER VIEW
// ─────────────────────────────────────────────────────────────────

const MemoryBrowserView: React.FC<{
  entries: MemoryEntry[];
  selectedEntry: string | null;
  onSelectEntry: (id: string) => void;
  onDelete: (id: string) => void;
  onExtend: (id: string) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  reliabilityMatrix: MemoryReliabilityMatrix;
  auditGate: MemoryAuditGate;
}> = ({ entries, selectedEntry, onSelectEntry, onDelete, onExtend, searchQuery, onSearch, reliabilityMatrix, auditGate }) => {
  
  const selected = entries.find(e => e.id === selectedEntry);
  const reliability = selected ? reliabilityMatrix.assessReliability(selected) : null;
  
  return (
    <div className="memory-browser">
      <div className="browser-sidebar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search memory..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="memory-list">
          {entries.map(entry => {
            const score = reliabilityMatrix.getCachedScore(entry.id);
            const expired = auditGate.isExpired(entry);
            
            return (
              <div
                key={entry.id}
                className={`memory-item ${selectedEntry === entry.id ? 'selected' : ''} ${expired ? 'expired' : ''}`}
                onClick={() => onSelectEntry(entry.id)}
              >
                <div className="item-header">
                  <span className="item-type">{entry.type}</span>
                  <span className={`item-priority priority-${entry.priority}`}>{entry.priority}</span>
                </div>
                <div className="item-meta">
                  <span className="item-age">{formatAge(Date.now() - entry.createdAt)}</span>
                  {score && (
                    <span className={`item-reliability rel-${score.status}`}>
                      {score.overall}%
                    </span>
                  )}
                </div>
                {expired && <div className="item-badge expired-badge">EXPIRED</div>}
              </div>
            );
          })}

          {entries.length === 0 && (
            <div className="empty-state">
              <p>No memory entries</p>
            </div>
          )}
        </div>
      </div>

      <div className="browser-details">
        {selected ? (
          <>
            <div className="details-header">
              <h3>{selected.type}</h3>
              <div className="details-actions">
                <button onClick={() => onExtend(selected.id)} className="btn-extend">
                  Extend
                </button>
                <button onClick={() => onDelete(selected.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>

            <div className="details-metadata">
              <div className="meta-row">
                <span className="meta-label">ID:</span>
                <span className="meta-value">{selected.id}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Priority:</span>
                <span className={`meta-value priority-${selected.priority}`}>{selected.priority}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Created:</span>
                <span className="meta-value">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Updated:</span>
                <span className="meta-value">{new Date(selected.updatedAt).toLocaleString()}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Retention:</span>
                <span className="meta-value">
                  <div className="retention-bar">
                    <div
                      className="retention-fill"
                      style={{ width: `${selected.retentionScore}%` }}
                    />
                  </div>
                  {selected.retentionScore}%
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Expires in:</span>
                <span className="meta-value">
                  {formatDuration(auditGate.getTimeUntilExpiry(selected))}
                </span>
              </div>
            </div>

            {reliability && (
              <div className="reliability-card">
                <h4>Reliability Assessment</h4>
                <div className="reliability-score">
                  <div className={`score-circle status-${reliability.status}`}>
                    <span className="score-value">{reliability.overall}</span>
                    <span className="score-label">%</span>
                  </div>
                  <div className="score-breakdown">
                    <div className="breakdown-item">
                      <span>Integrity:</span>
                      <span>{reliability.components.integrity}%</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Consistency:</span>
                      <span>{reliability.components.consistency}%</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Freshness:</span>
                      <span>{reliability.components.freshness}%</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Completeness:</span>
                      <span>{reliability.components.completeness}%</span>
                    </div>
                  </div>
                </div>
                {reliability.issues.length > 0 && (
                  <div className="reliability-issues">
                    <h5>Issues:</h5>
                    <ul>
                      {reliability.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="details-content">
              <h4>Content</h4>
              <pre>{JSON.stringify(selected.content, null, 2)}</pre>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Select a memory entry to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// INTENTS VIEW
// ─────────────────────────────────────────────────────────────────

const IntentsView: React.FC<{
  intents: TechnicalIntent[];
  intentTracker: IntentThreadTracker;
  onRefresh: () => void;
}> = ({ intents, intentTracker, onRefresh }) => {
  
  const summary = intentTracker.getSummary();
  
  return (
    <div className="intents-view">
      <div className="intents-summary">
        <div className="summary-card">
          <span className="summary-label">Active</span>
          <span className="summary-value">{summary.activeCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Blocked</span>
          <span className="summary-value">{summary.blockedCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Achieved Today</span>
          <span className="summary-value">{summary.achievedToday}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Avg Progress</span>
          <span className="summary-value">{summary.avgProgress}%</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Avg Clarity</span>
          <span className="summary-value">{summary.avgClarity}%</span>
        </div>
      </div>

      <div className="intents-list">
        {intents.map(intent => (
          <div key={intent.id} className={`intent-card status-${intent.status}`}>
            <div className="intent-header">
              <span className={`intent-type type-${intent.type}`}>{intent.type}</span>
              <span className={`intent-priority priority-${intent.priority}`}>{intent.priority}</span>
              <span className={`intent-status status-${intent.status}`}>{intent.status}</span>
            </div>
            
            <h4 className="intent-goal">{intent.goal}</h4>
            <p className="intent-reason">{intent.reason}</p>
            
            <div className="intent-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${intent.progress}%` }}
                />
              </div>
              <span className="progress-label">{intent.progress}%</span>
            </div>

            <div className="intent-meta">
              <span>Clarity: {intent.clarity}%</span>
              {intent.level && <span>Level: {intent.level}</span>}
              {intent.blockers.length > 0 && (
                <span className="blockers-count">{intent.blockers.length} blockers</span>
              )}
            </div>

            {intent.ambiguities.length > 0 && (
              <div className="intent-ambiguities">
                <strong>Ambiguities:</strong>
                <ul>
                  {intent.ambiguities.map((amb, idx) => (
                    <li key={idx}>{amb}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {intents.length === 0 && (
          <div className="empty-state">
            <p>No active intents</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// SYNC STATUS VIEW
// ─────────────────────────────────────────────────────────────────

const SyncStatusView: React.FC<{
  syncState: SyncState | null;
  syncLayer: ContinuitySyncLayer;
  stats: MemoryStats | null;
  onPurgeExpired: () => void;
}> = ({ syncState, syncLayer, stats, onPurgeExpired }) => {
  
  const activeTabs = syncLayer.getActiveTabs();
  
  return (
    <div className="sync-view">
      <div className="sync-status-card">
        <h3>Sync Status</h3>
        <div className={`sync-indicator-large sync-${syncState?.status || 'offline'}`}>
          {syncState?.status || 'offline'}
        </div>
        
        {syncState && (
          <div className="sync-details">
            <div className="detail-row">
              <span>Last Sync:</span>
              <span>{syncState.lastSync > 0 ? formatAge(Date.now() - syncState.lastSync) + ' ago' : 'Never'}</span>
            </div>
            <div className="detail-row">
              <span>Pending Changes:</span>
              <span>{syncState.pendingChanges}</span>
            </div>
            <div className="detail-row">
              <span>Conflicts:</span>
              <span>{syncState.conflictCount}</span>
            </div>
            <div className="detail-row">
              <span>Online Tabs:</span>
              <span>{syncState.onlineTabs}</span>
            </div>
          </div>
        )}
      </div>

      <div className="tabs-card">
        <h3>Active Tabs</h3>
        <div className="tabs-list">
          {activeTabs.map(tab => (
            <div key={tab.id} className="tab-item">
              <span className="tab-id">{tab.id}</span>
              <span className="tab-ping">
                {tab.active ? '🟢 Active' : '🔴 Inactive'}
              </span>
              <span className="tab-age">
                {formatAge(Date.now() - tab.connectedAt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {stats && (
        <div className="stats-card">
          <h3>Memory Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Entries</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Expiring Soon</span>
              <span className="stat-value warning">{stats.expiringSoon}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Expired</span>
              <span className="stat-value error">{stats.expired}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Reads Today</span>
              <span className="stat-value">{stats.readsToday}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Writes Today</span>
              <span className="stat-value">{stats.writesToday}</span>
            </div>
          </div>

          <div className="stats-actions">
            <button
              onClick={onPurgeExpired}
              className="btn-purge"
              disabled={stats.expired === 0}
            >
              Purge {stats.expired} Expired
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// AUDIT LOG VIEW
// ─────────────────────────────────────────────────────────────────

const AuditLogView: React.FC<{
  auditGate: MemoryAuditGate;
  approvalRequests: ApprovalRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ auditGate, approvalRequests, onApprove, onReject }) => {
  
  const log = auditGate.getAuditLog();
  const approvalRate = auditGate.getApprovalRate();
  const breakdown = auditGate.getOperationBreakdown();
  
  return (
    <div className="audit-view">
      {approvalRequests.length > 0 && (
        <div className="approvals-section">
          <h3>Pending Approvals</h3>
          {approvalRequests.map(req => (
            <div key={req.id} className="approval-request">
              <div className="request-header">
                <span className={`request-operation op-${req.operation}`}>
                  {req.operation}
                </span>
                <span className="request-time">
                  {formatAge(Date.now() - req.requestedAt)} ago
                </span>
              </div>
              <p className="request-description">{req.description}</p>
              <div className="request-meta">
                <span>Affects: {req.affectedEntries} entries</span>
                <span>Expires: {formatDuration(req.expiresAt - Date.now())}</span>
              </div>
              <div className="request-actions">
                <button onClick={() => onApprove(req.id)} className="btn-approve">
                  ✓ Approve
                </button>
                <button onClick={() => onReject(req.id)} className="btn-reject">
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="audit-summary">
        <div className="summary-card">
          <span className="summary-label">Total Operations</span>
          <span className="summary-value">{log.totalOperations}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Approved</span>
          <span className="summary-value success">{log.approvedOperations}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Rejected</span>
          <span className="summary-value error">{log.rejectedOperations}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Approval Rate</span>
          <span className="summary-value">{approvalRate}%</span>
        </div>
      </div>

      <div className="audit-breakdown">
        <h4>Operation Breakdown</h4>
        {Object.entries(breakdown).map(([op, counts]) => (
          <div key={op} className="breakdown-row">
            <span className="breakdown-label">{op}</span>
            <span className="breakdown-approved">{counts.approved} ✓</span>
            <span className="breakdown-rejected">{counts.rejected} ✗</span>
          </div>
        ))}
      </div>

      <div className="audit-log">
        <h4>Recent Operations</h4>
        <div className="log-entries">
          {log.entries.slice(-20).reverse().map(entry => (
            <div key={entry.id} className={`log-entry ${entry.approved ? 'approved' : 'rejected'}`}>
              <span className={`log-operation op-${entry.operation}`}>
                {entry.operation}
              </span>
              <span className="log-time">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              {entry.targetId && (
                <span className="log-target">{entry.targetId.substring(0, 12)}...</span>
              )}
              <span className={`log-status ${entry.approved ? 'approved' : 'rejected'}`}>
                {entry.approved ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (ms < 0) return 'Expired';
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export default RollingMemoryUI;
