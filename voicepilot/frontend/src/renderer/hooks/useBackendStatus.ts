import { useState, useEffect, useCallback, useRef } from 'react';

export type BackendStatus = 'online' | 'offline' | 'checking' | 'error';

export interface BackendStatusState {
  status: BackendStatus;
  lastChecked: Date | null;
  latency: number | null;
  error: string | null;
}

export interface UseBackendStatusOptions {
  url?: string;
  interval?: number; // milliseconds
  timeout?: number; // milliseconds
  onStatusChange?: (status: BackendStatus) => void;
}

const DEFAULT_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const DEFAULT_INTERVAL = 30000; // 30 seconds
const DEFAULT_TIMEOUT = 5000; // 5 seconds

/**
 * Hook for monitoring backend connectivity
 * Polls the /health endpoint and provides offline mode detection
 */
export function useBackendStatus(options: UseBackendStatusOptions = {}) {
  const {
    url = DEFAULT_URL,
    interval = DEFAULT_INTERVAL,
    timeout = DEFAULT_TIMEOUT,
    onStatusChange,
  } = options;

  const [state, setState] = useState<BackendStatusState>({
    status: 'checking',
    lastChecked: null,
    latency: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const previousStatusRef = useRef<BackendStatus>('checking');

  const checkHealth = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const startTime = performance.now();

    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        const isHealthy = data.status === 'healthy' || data.status === 'ok';
        
        const newStatus: BackendStatus = isHealthy ? 'online' : 'error';
        
        setState({
          status: newStatus,
          lastChecked: new Date(),
          latency,
          error: isHealthy ? null : 'Backend reported unhealthy status',
        });

        // Notify on status change
        if (previousStatusRef.current !== newStatus && onStatusChange) {
          onStatusChange(newStatus);
        }
        previousStatusRef.current = newStatus;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isOffline = errorMessage.includes('fetch') || 
                       errorMessage.includes('network') ||
                       errorMessage.includes('Failed to fetch');

      const newStatus: BackendStatus = isOffline ? 'offline' : 'error';

      setState({
        status: newStatus,
        lastChecked: new Date(),
        latency: null,
        error: errorMessage,
      });

      // Notify on status change
      if (previousStatusRef.current !== newStatus && onStatusChange) {
        onStatusChange(newStatus);
      }
      previousStatusRef.current = newStatus;
    }
  }, [url, onStatusChange]);

  // Initial check and interval polling
  useEffect(() => {
    // Check immediately on mount
    checkHealth();

    // Set up interval polling
    const intervalId = setInterval(checkHealth, interval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkHealth, interval]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'checking' }));
    await checkHealth();
  }, [checkHealth]);

  return {
    ...state,
    isOnline: state.status === 'online',
    isOffline: state.status === 'offline',
    isChecking: state.status === 'checking',
    hasError: state.status === 'error',
    refresh,
  };
}

export default useBackendStatus;
