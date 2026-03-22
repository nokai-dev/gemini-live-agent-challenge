import { useState, useEffect, useCallback, useRef } from 'react';

export type BackendStatus = 'online' | 'offline' | 'checking';

export interface BackendStatusState {
  status: BackendStatus;
  isOnline: boolean;
  lastChecked: Date | null;
  error: string | null;
  url: string;
}

export interface UseBackendStatusOptions {
  pollInterval?: number; // milliseconds
  onStatusChange?: (_status: BackendStatus, _previousStatus: BackendStatus) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

const DEFAULT_POLL_INTERVAL = 10000; // 10 seconds
const API_BASE_URL = process.env.VOICEPILOT_API_URL || 'http://localhost:8080';

/**
 * Custom hook for monitoring backend availability
 * Polls the /health endpoint and provides offline/online status
 */
export function useBackendStatus(options: UseBackendStatusOptions = {}) {
  const {
    pollInterval = DEFAULT_POLL_INTERVAL,
    onStatusChange,
    onOffline,
    onOnline,
  } = options;

  const [state, setState] = useState<BackendStatusState>({
    status: 'checking',
    isOnline: false,
    lastChecked: null,
    error: null,
    url: API_BASE_URL,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const previousStatusRef = useRef<BackendStatus>('checking');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Check backend health
   */
  const checkHealth = useCallback(async (): Promise<boolean> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
        // Short timeout for health checks
        cache: 'no-store',
      });

      if (signal.aborted) {
        return false;
      }

      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }

      return false;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      return false;
    }
  }, []);

  /**
   * Perform a health check and update state
   */
  const performCheck = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'checking' }));

    const isHealthy = await checkHealth();
    const newStatus: BackendStatus = isHealthy ? 'online' : 'offline';
    const previousStatus = previousStatusRef.current;

    setState(prev => ({
      ...prev,
      status: newStatus,
      isOnline: isHealthy,
      lastChecked: new Date(),
      error: isHealthy ? null : 'Backend is not responding',
    }));

    // Trigger callbacks if status changed
    if (previousStatus !== newStatus) {
      onStatusChange?.(newStatus, previousStatus);

      if (newStatus === 'offline' && previousStatus === 'online') {
        onOffline?.();
      } else if (newStatus === 'online' && previousStatus === 'offline') {
        onOnline?.();
      }
    }

    previousStatusRef.current = newStatus;
  }, [checkHealth, onStatusChange, onOffline, onOnline]);

  /**
   * Manually trigger a health check
   */
  const checkNow = useCallback(async () => {
    await performCheck();
  }, [performCheck]);

  // Set up polling
  useEffect(() => {
    // Initial check
    performCheck();

    // Set up interval
    intervalRef.current = setInterval(performCheck, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [performCheck, pollInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    checkNow,
  };
}

export default useBackendStatus;
