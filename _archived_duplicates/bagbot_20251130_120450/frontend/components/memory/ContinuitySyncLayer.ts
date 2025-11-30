/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 15.5: CONTINUITY SYNC LAYER
 * ═══════════════════════════════════════════════════════════════════
 * Synchronizes memory across tabs, pages, and environments to ensure
 * BagBot behaves like a single cohesive entity everywhere.
 * 
 * SAFETY: Technical sync only, no cross-user data sharing
 * PURPOSE: Unified memory across all user contexts
 * ═══════════════════════════════════════════════════════════════════
 */

import type { MemoryEntry } from './RollingMemoryCore';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type SyncStatus = 'synced' | 'syncing' | 'conflict' | 'offline' | 'failed';
export type StorageType = 'memory' | 'localStorage' | 'indexedDB' | 'sessionStorage';
export type ConflictResolution = 'newest_wins' | 'highest_priority' | 'merge' | 'manual';

export interface SyncState {
  status: SyncStatus;
  lastSync: number;
  pendingChanges: number;
  conflictCount: number;
  onlineTabs: number;
  syncErrors: string[];
}

export interface SyncMessage {
  type: 'sync' | 'update' | 'delete' | 'request' | 'response' | 'ping';
  timestamp: number;
  senderId: string;
  data?: any;
}

export interface SyncConflict {
  entryId: string;
  localVersion: MemoryEntry;
  remoteVersion: MemoryEntry;
  detectedAt: number;
  resolution?: ConflictResolution;
  resolved?: boolean;
  mergedVersion?: MemoryEntry;
}

export interface StorageAdapter {
  type: StorageType;
  available: boolean;
  read: (key: string) => Promise<any>;
  write: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: () => Promise<string[]>;
  clear: () => Promise<void>;
}

export interface SyncConfig {
  enableBroadcast: boolean;
  enableLocalStorage: boolean;
  enableIndexedDB: boolean;
  syncInterval: number;           // ms
  conflictResolution: ConflictResolution;
  maxConflicts: number;
  offlineMode: boolean;
}

export interface TabInfo {
  id: string;
  connectedAt: number;
  lastPing: number;
  active: boolean;
}

// ─────────────────────────────────────────────────────────────────
// CONTINUITY SYNC LAYER CLASS
// ─────────────────────────────────────────────────────────────────

export class ContinuitySyncLayer {
  private tabId: string;
  private broadcastChannel?: BroadcastChannel;
  private storageAdapters: Map<StorageType, StorageAdapter>;
  private config: SyncConfig;
  private syncState: SyncState;
  private conflicts: SyncConflict[];
  private activeTabs: Map<string, TabInfo>;
  private syncInterval?: NodeJS.Timeout;
  
  constructor(config: Partial<SyncConfig> = {}) {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.storageAdapters = new Map();
    this.conflicts = [];
    this.activeTabs = new Map();
    
    this.config = {
      enableBroadcast: true,
      enableLocalStorage: true,
      enableIndexedDB: true,
      syncInterval: 1000,
      conflictResolution: 'newest_wins',
      maxConflicts: 50,
      offlineMode: false,
      ...config
    };
    
    this.syncState = {
      status: 'offline',
      lastSync: 0,
      pendingChanges: 0,
      conflictCount: 0,
      onlineTabs: 0,
      syncErrors: []
    };
    
    this.initialize();
  }

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────

  private async initialize(): Promise<void> {
    console.log(`[SYNC] Initializing tab ${this.tabId}`);
    
    // Setup storage adapters
    await this.setupStorageAdapters();
    
    // Setup broadcast channel for cross-tab communication
    if (this.config.enableBroadcast && typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('bagbot-memory-sync');
        this.broadcastChannel.onmessage = (event) => this.handleBroadcastMessage(event.data);
        console.log('[SYNC] BroadcastChannel initialized');
        
        // Announce presence
        this.broadcast({ type: 'ping', timestamp: Date.now(), senderId: this.tabId });
        
        // Register this tab
        this.activeTabs.set(this.tabId, {
          id: this.tabId,
          connectedAt: Date.now(),
          lastPing: Date.now(),
          active: true
        });
        
      } catch (error) {
        console.error('[SYNC] BroadcastChannel setup failed:', error);
      }
    }
    
    // Start periodic sync
    if (this.config.syncInterval > 0) {
      this.syncInterval = setInterval(() => this.periodicSync(), this.config.syncInterval);
    }
    
    // Setup beforeunload to cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
    
    this.syncState.status = 'synced';
    this.syncState.onlineTabs = 1;
  }

  private async setupStorageAdapters(): Promise<void> {
    // LocalStorage adapter
    if (this.config.enableLocalStorage && typeof localStorage !== 'undefined') {
      this.storageAdapters.set('localStorage', {
        type: 'localStorage',
        available: true,
        read: async (key) => {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        write: async (key, value) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        delete: async (key) => {
          localStorage.removeItem(key);
        },
        list: async () => {
          return Object.keys(localStorage).filter(k => k.startsWith('bagbot-memory:'));
        },
        clear: async () => {
          const keys = Object.keys(localStorage).filter(k => k.startsWith('bagbot-memory:'));
          keys.forEach(k => localStorage.removeItem(k));
        }
      });
    }
    
    // IndexedDB adapter
    if (this.config.enableIndexedDB && typeof indexedDB !== 'undefined') {
      try {
        await this.setupIndexedDB();
        console.log('[SYNC] IndexedDB adapter ready');
      } catch (error) {
        console.error('[SYNC] IndexedDB setup failed:', error);
      }
    }
  }

  private async setupIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BagBotMemory', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        
        this.storageAdapters.set('indexedDB', {
          type: 'indexedDB',
          available: true,
          read: async (key) => {
            return new Promise((res, rej) => {
              const tx = db.transaction(['memories'], 'readonly');
              const store = tx.objectStore('memories');
              const req = store.get(key);
              req.onsuccess = () => res(req.result);
              req.onerror = () => rej(req.error);
            });
          },
          write: async (key, value) => {
            return new Promise((res, rej) => {
              const tx = db.transaction(['memories'], 'readwrite');
              const store = tx.objectStore('memories');
              const req = store.put(value, key);
              req.onsuccess = () => res();
              req.onerror = () => rej(req.error);
            });
          },
          delete: async (key) => {
            return new Promise((res, rej) => {
              const tx = db.transaction(['memories'], 'readwrite');
              const store = tx.objectStore('memories');
              const req = store.delete(key);
              req.onsuccess = () => res();
              req.onerror = () => rej(req.error);
            });
          },
          list: async () => {
            return new Promise((res, rej) => {
              const tx = db.transaction(['memories'], 'readonly');
              const store = tx.objectStore('memories');
              const req = store.getAllKeys();
              req.onsuccess = () => res(req.result as string[]);
              req.onerror = () => rej(req.error);
            });
          },
          clear: async () => {
            return new Promise((res, rej) => {
              const tx = db.transaction(['memories'], 'readwrite');
              const store = tx.objectStore('memories');
              const req = store.clear();
              req.onsuccess = () => res();
              req.onerror = () => rej(req.error);
            });
          }
        });
        
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('memories')) {
          db.createObjectStore('memories');
        }
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CROSS-TAB SYNC
  // ─────────────────────────────────────────────────────────────

  broadcast(message: SyncMessage): void {
    if (!this.broadcastChannel) return;
    
    this.broadcastChannel.postMessage(message);
  }

  private handleBroadcastMessage(message: SyncMessage): void {
    // Ignore own messages
    if (message.senderId === this.tabId) return;
    
    switch (message.type) {
      case 'ping':
        this.handlePing(message);
        break;
      case 'update':
        this.handleRemoteUpdate(message);
        break;
      case 'delete':
        this.handleRemoteDelete(message);
        break;
      case 'request':
        this.handleSyncRequest(message);
        break;
      case 'response':
        this.handleSyncResponse(message);
        break;
    }
  }

  private handlePing(message: SyncMessage): void {
    const existing = this.activeTabs.get(message.senderId);
    
    if (existing) {
      existing.lastPing = message.timestamp;
    } else {
      this.activeTabs.set(message.senderId, {
        id: message.senderId,
        connectedAt: message.timestamp,
        lastPing: message.timestamp,
        active: true
      });
    }
    
    this.syncState.onlineTabs = this.activeTabs.size;
    
    // Respond with our ping
    this.broadcast({ type: 'ping', timestamp: Date.now(), senderId: this.tabId });
  }

  private handleRemoteUpdate(message: SyncMessage): void {
    // Will be called when another tab updates memory
    console.log(`[SYNC] Remote update from ${message.senderId}`);
    // Trigger sync from storage
    this.syncState.pendingChanges++;
  }

  private handleRemoteDelete(message: SyncMessage): void {
    console.log(`[SYNC] Remote delete from ${message.senderId}`);
    this.syncState.pendingChanges++;
  }

  private handleSyncRequest(message: SyncMessage): void {
    // Another tab is requesting full sync
    console.log(`[SYNC] Sync request from ${message.senderId}`);
    // Respond with current state (would need memory entries)
  }

  private handleSyncResponse(message: SyncMessage): void {
    // Received sync data from another tab
    console.log(`[SYNC] Sync response from ${message.senderId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // STORAGE PERSISTENCE
  // ─────────────────────────────────────────────────────────────

  async persistEntry(entry: MemoryEntry): Promise<void> {
    const key = `bagbot-memory:${entry.id}`;
    
    this.syncState.status = 'syncing';
    
    try {
      // Write to all available storage adapters
      const promises: Promise<void>[] = [];
      
      for (const adapter of this.storageAdapters.values()) {
        if (adapter.available) {
          promises.push(adapter.write(key, entry));
        }
      }
      
      await Promise.all(promises);
      
      // Broadcast to other tabs
      if (this.broadcastChannel) {
        this.broadcast({
          type: 'update',
          timestamp: Date.now(),
          senderId: this.tabId,
          data: { entryId: entry.id }
        });
      }
      
      this.syncState.status = 'synced';
      this.syncState.lastSync = Date.now();
      
    } catch (error) {
      console.error('[SYNC] Persist failed:', error);
      this.syncState.status = 'failed';
      this.syncState.syncErrors.push(`Persist error: ${error}`);
    }
  }

  async loadEntry(entryId: string): Promise<MemoryEntry | null> {
    const key = `bagbot-memory:${entryId}`;
    
    // Try adapters in order of preference: IndexedDB > LocalStorage
    for (const type of ['indexedDB', 'localStorage'] as StorageType[]) {
      const adapter = this.storageAdapters.get(type);
      if (adapter?.available) {
        try {
          const entry = await adapter.read(key);
          if (entry) {
            return entry;
          }
        } catch (error) {
          console.error(`[SYNC] Load from ${type} failed:`, error);
        }
      }
    }
    
    return null;
  }

  async deleteEntry(entryId: string): Promise<void> {
    const key = `bagbot-memory:${entryId}`;
    
    this.syncState.status = 'syncing';
    
    try {
      const promises: Promise<void>[] = [];
      
      for (const adapter of this.storageAdapters.values()) {
        if (adapter.available) {
          promises.push(adapter.delete(key));
        }
      }
      
      await Promise.all(promises);
      
      // Broadcast deletion
      if (this.broadcastChannel) {
        this.broadcast({
          type: 'delete',
          timestamp: Date.now(),
          senderId: this.tabId,
          data: { entryId }
        });
      }
      
      this.syncState.status = 'synced';
      this.syncState.lastSync = Date.now();
      
    } catch (error) {
      console.error('[SYNC] Delete failed:', error);
      this.syncState.status = 'failed';
      this.syncState.syncErrors.push(`Delete error: ${error}`);
    }
  }

  async loadAll(): Promise<MemoryEntry[]> {
    const entries: Map<string, MemoryEntry> = new Map();
    
    // Collect from all adapters
    for (const adapter of this.storageAdapters.values()) {
      if (!adapter.available) continue;
      
      try {
        const keys = await adapter.list();
        
        for (const key of keys) {
          const entry = await adapter.read(key);
          if (entry && entry.id) {
            // Handle conflicts (newest version wins by default)
            const existing = entries.get(entry.id);
            if (!existing || entry.updatedAt > existing.updatedAt) {
              entries.set(entry.id, entry);
            }
          }
        }
      } catch (error) {
        console.error(`[SYNC] Load from ${adapter.type} failed:`, error);
      }
    }
    
    return Array.from(entries.values());
  }

  // ─────────────────────────────────────────────────────────────
  // CONFLICT RESOLUTION
  // ─────────────────────────────────────────────────────────────

  async detectConflicts(localEntries: MemoryEntry[], remoteEntries: MemoryEntry[]): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];
    
    const remoteMap = new Map(remoteEntries.map(e => [e.id, e]));
    
    for (const local of localEntries) {
      const remote = remoteMap.get(local.id);
      
      if (remote && this.isConflict(local, remote)) {
        conflicts.push({
          entryId: local.id,
          localVersion: local,
          remoteVersion: remote,
          detectedAt: Date.now(),
          resolution: this.config.conflictResolution,
          resolved: false
        });
      }
    }
    
    return conflicts;
  }

  private isConflict(local: MemoryEntry, remote: MemoryEntry): boolean {
    // Same ID but different content
    if (local.updatedAt === remote.updatedAt) {
      return JSON.stringify(local.content) !== JSON.stringify(remote.content);
    }
    
    // Different versions at similar times (within 1 second = likely conflict)
    const timeDiff = Math.abs(local.updatedAt - remote.updatedAt);
    if (timeDiff < 1000) {
      return local.version !== remote.version;
    }
    
    return false;
  }

  async resolveConflict(conflict: SyncConflict): Promise<MemoryEntry> {
    switch (conflict.resolution || this.config.conflictResolution) {
      case 'newest_wins':
        return conflict.localVersion.updatedAt > conflict.remoteVersion.updatedAt
          ? conflict.localVersion
          : conflict.remoteVersion;
      
      case 'highest_priority':
        const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorities[conflict.localVersion.priority] >= priorities[conflict.remoteVersion.priority]
          ? conflict.localVersion
          : conflict.remoteVersion;
      
      case 'merge':
        return this.mergeEntries(conflict.localVersion, conflict.remoteVersion);
      
      case 'manual':
        // Store for manual resolution
        this.conflicts.push(conflict);
        this.syncState.conflictCount = this.conflicts.length;
        return conflict.localVersion; // Keep local until resolved
      
      default:
        return conflict.localVersion;
    }
  }

  private mergeEntries(local: MemoryEntry, remote: MemoryEntry): MemoryEntry {
    // Deep merge content objects
    const mergedContent = {
      ...remote.content,
      ...local.content
    };
    
    // Use newest metadata
    const merged: MemoryEntry = local.updatedAt > remote.updatedAt ? { ...local } : { ...remote };
    merged.content = mergedContent;
    merged.version = Math.max(local.version, remote.version) + 1;
    merged.updatedAt = Date.now();
    
    return merged;
  }

  getPendingConflicts(): SyncConflict[] {
    return this.conflicts.filter(c => !c.resolved);
  }

  manualResolve(entryId: string, chosenVersion: 'local' | 'remote' | MemoryEntry): void {
    const conflict = this.conflicts.find(c => c.entryId === entryId && !c.resolved);
    
    if (!conflict) return;
    
    if (chosenVersion === 'local') {
      conflict.mergedVersion = conflict.localVersion;
    } else if (chosenVersion === 'remote') {
      conflict.mergedVersion = conflict.remoteVersion;
    } else {
      conflict.mergedVersion = chosenVersion;
    }
    
    conflict.resolved = true;
    this.syncState.conflictCount = this.conflicts.filter(c => !c.resolved).length;
  }

  // ─────────────────────────────────────────────────────────────
  // PERIODIC SYNC
  // ─────────────────────────────────────────────────────────────

  private async periodicSync(): Promise<void> {
    // Clean up stale tabs
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds
    
    for (const [tabId, info] of this.activeTabs.entries()) {
      if (now - info.lastPing > staleThreshold) {
        this.activeTabs.delete(tabId);
      }
    }
    
    this.syncState.onlineTabs = this.activeTabs.size;
    
    // Ping to announce presence
    if (this.broadcastChannel) {
      this.broadcast({ type: 'ping', timestamp: now, senderId: this.tabId });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STATE QUERIES
  // ─────────────────────────────────────────────────────────────

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  getActiveTabs(): TabInfo[] {
    return Array.from(this.activeTabs.values());
  }

  isOnline(): boolean {
    return this.syncState.status === 'synced' || this.syncState.status === 'syncing';
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    
    this.activeTabs.delete(this.tabId);
    
    console.log(`[SYNC] Tab ${this.tabId} cleanup complete`);
  }

  async clearAllStorage(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const adapter of this.storageAdapters.values()) {
      if (adapter.available) {
        promises.push(adapter.clear());
      }
    }
    
    await Promise.all(promises);
    
    console.log('[SYNC] All storage cleared');
  }
}
