import { useState, useEffect, useCallback } from 'react';

export interface SessionEntry {
  id: string;
  timestamp: number;
  command: string;
  screenshot: string | null;
  selection: { x: number; y: number; width: number; height: number } | null;
  targetFile: string;
  description: string;
  codeChange: {
    before: string;
    after: string;
  };
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}

export interface SessionState {
  entries: SessionEntry[];
  currentSessionId: string | null;
}

const STORAGE_KEY = 'voicepilot_session_history';
const MAX_ENTRIES = 50; // Keep last 50 entries

/**
 * Custom hook for persisting session data to localStorage
 * Tracks commands, screenshots, and applied changes
 */
export function useSessionStorage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    entries: [],
    currentSessionId: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessionState({
          entries: parsed.entries || [],
          currentSessionId: parsed.currentSessionId || null,
        });
      }
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionState));
      } catch (error) {
        console.error('Failed to save session to localStorage:', error);
        // If quota exceeded, remove oldest entries
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          const trimmedEntries = sessionState.entries.slice(-20);
          setSessionState(prev => ({ ...prev, entries: trimmedEntries }));
        }
      }
    }
  }, [sessionState, isLoaded]);

  /**
   * Start a new session entry
   */
  const startSession = useCallback((data: {
    command: string;
    screenshot: string | null;
    selection: { x: number; y: number; width: number; height: number } | null;
  }): string => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEntry: SessionEntry = {
      id,
      timestamp: Date.now(),
      command: data.command,
      screenshot: data.screenshot,
      selection: data.selection,
      targetFile: '',
      description: '',
      codeChange: { before: '', after: '' },
      status: 'pending',
    };

    setSessionState(prev => ({
      entries: [...prev.entries.slice(-MAX_ENTRIES + 1), newEntry],
      currentSessionId: id,
    }));

    return id;
  }, []);

  /**
   * Update an existing session entry with analysis results
   */
  const updateSession = useCallback((id: string, data: {
    targetFile: string;
    description: string;
    codeChange: { before: string; after: string };
    status?: 'completed' | 'failed';
    error?: string;
  }) => {
    setSessionState(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === id
          ? { ...entry, ...data, status: data.status || 'completed' }
          : entry
      ),
    }));
  }, []);

  /**
   * Mark a session as failed
   */
  const failSession = useCallback((id: string, error: string) => {
    setSessionState(prev => ({
      ...prev,
      entries: prev.entries.map(entry =>
        entry.id === id ? { ...entry, status: 'failed', error } : entry
      ),
    }));
  }, []);

  /**
   * Replay a previous session by returning its data
   */
  const replaySession = useCallback((id: string): SessionEntry | null => {
    const entry = sessionState.entries.find(e => e.id === id);
    if (entry) {
      // Create a new session based on the old one
      const newId = startSession({
        command: entry.command,
        screenshot: entry.screenshot,
        selection: entry.selection,
      });
      // Immediately update with the old results
      updateSession(newId, {
        targetFile: entry.targetFile,
        description: entry.description,
        codeChange: entry.codeChange,
        status: 'completed',
      });
      return entry;
    }
    return null;
  }, [sessionState.entries, startSession, updateSession]);

  /**
   * Delete a specific session entry
   */
  const deleteSession = useCallback((id: string) => {
    setSessionState(prev => ({
      ...prev,
      entries: prev.entries.filter(entry => entry.id !== id),
      currentSessionId: prev.currentSessionId === id ? null : prev.currentSessionId,
    }));
  }, []);

  /**
   * Clear all session history
   */
  const clearAllSessions = useCallback(() => {
    setSessionState({
      entries: [],
      currentSessionId: null,
    });
  }, []);

  /**
   * Get the current session entry
   */
  const getCurrentSession = useCallback((): SessionEntry | null => {
    if (!sessionState.currentSessionId) return null;
    return sessionState.entries.find(e => e.id === sessionState.currentSessionId) || null;
  }, [sessionState.currentSessionId, sessionState.entries]);

  /**
   * Export session history as JSON
   */
  const exportSessions = useCallback((): string => {
    return JSON.stringify(sessionState, null, 2);
  }, [sessionState]);

  /**
   * Import session history from JSON
   */
  const importSessions = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.entries && Array.isArray(parsed.entries)) {
        setSessionState({
          entries: parsed.entries.slice(-MAX_ENTRIES),
          currentSessionId: parsed.currentSessionId || null,
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to import sessions:', error);
    }
    return false;
  }, []);

  return {
    entries: sessionState.entries,
    currentSessionId: sessionState.currentSessionId,
    isLoaded,
    startSession,
    updateSession,
    failSession,
    replaySession,
    deleteSession,
    clearAllSessions,
    getCurrentSession,
    exportSessions,
    importSessions,
  };
}

export default useSessionStorage;
