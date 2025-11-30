/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 16.3: SYSTEM DASHBOARD GRID
 * ═══════════════════════════════════════════════════════════════════
 * Dynamic, dockable admin-style grid system (foundation for Level 17).
 * Drag-and-drop panels, resize handlers, layout persistence.
 * 
 * SAFETY: UI layout only, no execution logic
 * PURPOSE: Foundation for Level 17 Admin Page
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type PanelSize = 'small' | 'medium' | 'large' | 'xlarge';
export type PanelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';

export interface GridPanel {
  id: string;
  title: string;
  component: React.ReactNode;
  size: PanelSize;
  position: PanelPosition;
  x?: number;
  y?: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable: boolean;
  draggable: boolean;
  closable: boolean;
  collapsible: boolean;
  collapsed: boolean;
  zIndex: number;
  visible: boolean;
}

export interface GridLayout {
  id: string;
  name: string;
  panels: GridPanel[];
  gridSize: number;
  snapToGrid: boolean;
}

export interface DragState {
  isDragging: boolean;
  panelId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export interface ResizeState {
  isResizing: boolean;
  panelId: string | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
}

// ─────────────────────────────────────────────────────────────────
// SYSTEM DASHBOARD GRID COMPONENT
// ─────────────────────────────────────────────────────────────────

export const SystemDashboardGrid: React.FC<{
  initialLayout?: GridLayout;
  onLayoutChange?: (layout: GridLayout) => void;
  gridSize?: number;
  snapToGrid?: boolean;
}> = ({
  initialLayout,
  onLayoutChange,
  gridSize = 20,
  snapToGrid = true
}) => {
  const [layout, setLayout] = useState<GridLayout>(
    initialLayout || createDefaultLayout()
  );
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    panelId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    panelId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    direction: null
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────
  // DRAG HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((
    panelId: string,
    e: React.MouseEvent
  ) => {
    const panel = layout.panels.find(p => p.id === panelId);
    if (!panel || !panel.draggable) return;

    e.preventDefault();
    
    setDragState({
      isDragging: true,
      panelId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - (panel.x || 0),
      offsetY: e.clientY - (panel.y || 0)
    });

    // Bring panel to front
    bringToFront(panelId);
  }, [layout.panels]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.panelId) return;

    const newX = e.clientX - dragState.offsetX;
    const newY = e.clientY - dragState.offsetY;

    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => {
        if (panel.id === dragState.panelId) {
          const x = snapToGrid ? Math.round(newX / gridSize) * gridSize : newX;
          const y = snapToGrid ? Math.round(newY / gridSize) * gridSize : newY;
          
          return {
            ...panel,
            x: Math.max(0, x),
            y: Math.max(0, y),
            position: 'custom'
          };
        }
        return panel;
      })
    }));
  }, [dragState, gridSize, snapToGrid]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      panelId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    });

    if (onLayoutChange) {
      onLayoutChange(layout);
    }
  }, [layout, onLayoutChange]);

  // ─────────────────────────────────────────────────────────────
  // RESIZE HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleResizeStart = useCallback((
    panelId: string,
    direction: ResizeState['direction'],
    e: React.MouseEvent
  ) => {
    const panel = layout.panels.find(p => p.id === panelId);
    if (!panel || !panel.resizable) return;

    e.preventDefault();
    e.stopPropagation();

    setResizeState({
      isResizing: true,
      panelId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: panel.width,
      startHeight: panel.height,
      direction
    });
  }, [layout.panels]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeState.isResizing || !resizeState.panelId || !resizeState.direction) return;

    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;
    const direction = resizeState.direction; // Extract for type safety

    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel => {
        if (panel.id === resizeState.panelId) {
          let newWidth = panel.width;
          let newHeight = panel.height;
          let newX = panel.x;
          let newY = panel.y;

          if (direction.includes('e')) {
            newWidth = resizeState.startWidth + deltaX;
          }
          if (direction.includes('w')) {
            newWidth = resizeState.startWidth - deltaX;
            newX = (panel.x || 0) + deltaX;
          }
          if (direction.includes('s')) {
            newHeight = resizeState.startHeight + deltaY;
          }
          if (direction.includes('n')) {
            newHeight = resizeState.startHeight - deltaY;
            newY = (panel.y || 0) + deltaY;
          }

          // Apply constraints
          newWidth = Math.max(panel.minWidth || 200, Math.min(panel.maxWidth || 2000, newWidth));
          newHeight = Math.max(panel.minHeight || 150, Math.min(panel.maxHeight || 2000, newHeight));

          if (snapToGrid) {
            newWidth = Math.round(newWidth / gridSize) * gridSize;
            newHeight = Math.round(newHeight / gridSize) * gridSize;
          }

          return {
            ...panel,
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY
          };
        }
        return panel;
      })
    }));
  }, [resizeState, gridSize, snapToGrid]);

  const handleResizeEnd = useCallback(() => {
    setResizeState({
      isResizing: false,
      panelId: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      direction: null
    });

    if (onLayoutChange) {
      onLayoutChange(layout);
    }
  }, [layout, onLayoutChange]);

  // ─────────────────────────────────────────────────────────────
  // PANEL MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  const bringToFront = useCallback((panelId: string) => {
    setLayout(prev => {
      const maxZ = Math.max(...prev.panels.map(p => p.zIndex), 0);
      return {
        ...prev,
        panels: prev.panels.map(panel =>
          panel.id === panelId
            ? { ...panel, zIndex: maxZ + 1 }
            : panel
        )
      };
    });
  }, []);

  const closePanel = useCallback((panelId: string) => {
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel =>
        panel.id === panelId
          ? { ...panel, visible: false }
          : panel
      )
    }));
  }, []);

  const toggleCollapse = useCallback((panelId: string) => {
    setLayout(prev => ({
      ...prev,
      panels: prev.panels.map(panel =>
        panel.id === panelId
          ? { ...panel, collapsed: !panel.collapsed }
          : panel
      )
    }));
  }, []);

  const addPanel = useCallback((panel: Omit<GridPanel, 'id' | 'zIndex'>) => {
    const maxZ = Math.max(...layout.panels.map(p => p.zIndex), 0);
    const newPanel: GridPanel = {
      ...panel,
      id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      zIndex: maxZ + 1
    };

    setLayout(prev => ({
      ...prev,
      panels: [...prev.panels, newPanel]
    }));
  }, [layout.panels]);

  // ─────────────────────────────────────────────────────────────
  // MOUSE EVENT LISTENERS
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        handleDragMove(e);
      }
      if (resizeState.isResizing) {
        handleResizeMove(e);
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        handleDragEnd();
      }
      if (resizeState.isResizing) {
        handleResizeEnd();
      }
    };

    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, resizeState, handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);

  // ─────────────────────────────────────────────────────────────
  // LAYOUT PERSISTENCE
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Load layout from localStorage
    const saved = localStorage.getItem('bagbot-dashboard-layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLayout(parsed);
      } catch (error) {
        console.error('[DASHBOARD GRID] Failed to load layout:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save layout to localStorage (debounced)
    const timeout = setTimeout(() => {
      localStorage.setItem('bagbot-dashboard-layout', JSON.stringify(layout));
    }, 500);

    return () => clearTimeout(timeout);
  }, [layout]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="dashboard-grid"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-primary, #0a0a0f)'
      }}
    >
      {/* Grid background (optional) */}
      {snapToGrid && (
        <div
          className="dashboard-grid-background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Panels */}
      {layout.panels
        .filter(panel => panel.visible)
        .map(panel => (
          <DashboardPanel
            key={panel.id}
            panel={panel}
            onDragStart={(e) => handleDragStart(panel.id, e)}
            onResizeStart={(direction, e) => handleResizeStart(panel.id, direction, e)}
            onClose={() => closePanel(panel.id)}
            onToggleCollapse={() => toggleCollapse(panel.id)}
            onFocus={() => bringToFront(panel.id)}
          />
        ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// DASHBOARD PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────

const DashboardPanel: React.FC<{
  panel: GridPanel;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (direction: ResizeState['direction'], e: React.MouseEvent) => void;
  onClose: () => void;
  onToggleCollapse: () => void;
  onFocus: () => void;
}> = ({
  panel,
  onDragStart,
  onResizeStart,
  onClose,
  onToggleCollapse,
  onFocus
}) => {
  return (
    <div
      className={`dashboard-panel ${panel.collapsed ? 'collapsed' : ''}`}
      style={{
        position: 'absolute',
        left: panel.x || 0,
        top: panel.y || 0,
        width: panel.width,
        height: panel.collapsed ? 40 : panel.height,
        zIndex: panel.zIndex,
        background: 'var(--panel-bg, rgba(20, 20, 30, 0.95))',
        border: '1px solid var(--panel-border, rgba(255, 255, 255, 0.1))',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        transition: 'height 0.2s ease'
      }}
      onMouseDown={onFocus}
    >
      {/* Panel Header */}
      <div
        className="dashboard-panel-header"
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          cursor: panel.draggable ? 'move' : 'default',
          userSelect: 'none'
        }}
        onMouseDown={(e) => {
          if (panel.draggable) {
            onDragStart(e);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--status-active, #00ff88)'
          }} />
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary, #ffffff)'
          }}>
            {panel.title}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {panel.collapsible && (
            <button
              className="panel-button"
              onClick={onToggleCollapse}
              style={{
                width: 24,
                height: 24,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary, #888)',
                fontSize: 16
              }}
            >
              {panel.collapsed ? '▼' : '▲'}
            </button>
          )}
          {panel.closable && (
            <button
              className="panel-button"
              onClick={onClose}
              style={{
                width: 24,
                height: 24,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary, #888)',
                fontSize: 16
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {!panel.collapsed && (
        <div
          className="dashboard-panel-content"
          style={{
            height: 'calc(100% - 40px)',
            overflow: 'auto',
            padding: 12
          }}
        >
          {panel.component}
        </div>
      )}

      {/* Resize Handles */}
      {panel.resizable && !panel.collapsed && (
        <>
          <ResizeHandle direction="n" onMouseDown={(e) => onResizeStart('n', e)} />
          <ResizeHandle direction="s" onMouseDown={(e) => onResizeStart('s', e)} />
          <ResizeHandle direction="e" onMouseDown={(e) => onResizeStart('e', e)} />
          <ResizeHandle direction="w" onMouseDown={(e) => onResizeStart('w', e)} />
          <ResizeHandle direction="ne" onMouseDown={(e) => onResizeStart('ne', e)} />
          <ResizeHandle direction="nw" onMouseDown={(e) => onResizeStart('nw', e)} />
          <ResizeHandle direction="se" onMouseDown={(e) => onResizeStart('se', e)} />
          <ResizeHandle direction="sw" onMouseDown={(e) => onResizeStart('sw', e)} />
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// RESIZE HANDLE COMPONENT
// ─────────────────────────────────────────────────────────────────

const ResizeHandle: React.FC<{
  direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  onMouseDown: (e: React.MouseEvent) => void;
}> = ({ direction, onMouseDown }) => {
  const getPosition = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      background: 'transparent',
      zIndex: 10
    };

    switch (direction) {
      case 'n':
        return { ...base, top: 0, left: 0, right: 0, height: 4, cursor: 'ns-resize' };
      case 's':
        return { ...base, bottom: 0, left: 0, right: 0, height: 4, cursor: 'ns-resize' };
      case 'e':
        return { ...base, right: 0, top: 0, bottom: 0, width: 4, cursor: 'ew-resize' };
      case 'w':
        return { ...base, left: 0, top: 0, bottom: 0, width: 4, cursor: 'ew-resize' };
      case 'ne':
        return { ...base, top: 0, right: 0, width: 8, height: 8, cursor: 'nesw-resize' };
      case 'nw':
        return { ...base, top: 0, left: 0, width: 8, height: 8, cursor: 'nwse-resize' };
      case 'se':
        return { ...base, bottom: 0, right: 0, width: 8, height: 8, cursor: 'nwse-resize' };
      case 'sw':
        return { ...base, bottom: 0, left: 0, width: 8, height: 8, cursor: 'nesw-resize' };
      default:
        return base;
    }
  };

  return (
    <div
      className={`resize-handle resize-handle-${direction}`}
      style={getPosition()}
      onMouseDown={onMouseDown}
    />
  );
};

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

function createDefaultLayout(): GridLayout {
  return {
    id: 'default',
    name: 'Default Layout',
    gridSize: 20,
    snapToGrid: true,
    panels: [
      {
        id: 'panel-performance',
        title: 'System Performance',
        component: <div>Performance metrics will appear here</div>,
        size: 'medium',
        position: 'top-left',
        x: 20,
        y: 20,
        width: 400,
        height: 300,
        minWidth: 300,
        minHeight: 200,
        resizable: true,
        draggable: true,
        closable: true,
        collapsible: true,
        collapsed: false,
        zIndex: 1,
        visible: true
      },
      {
        id: 'panel-memory',
        title: 'Rolling Memory',
        component: <div>Memory timeline will appear here</div>,
        size: 'medium',
        position: 'top-right',
        x: 440,
        y: 20,
        width: 400,
        height: 300,
        minWidth: 300,
        minHeight: 200,
        resizable: true,
        draggable: true,
        closable: true,
        collapsible: true,
        collapsed: false,
        zIndex: 2,
        visible: true
      }
    ]
  };
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

export { createDefaultLayout };
