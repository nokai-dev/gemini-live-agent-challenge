import { useState, useCallback, useRef } from 'react';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

export interface AsyncOperationReturn<T> extends AsyncOperationState<T> {
  execute: (..._args: any[]) => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
}

export interface UseAsyncOperationOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (_error: Error) => void;
  onSuccess?: (_data: any) => void;
}

/**
 * Custom hook for handling async operations with loading states,
 * error handling, and automatic retry logic
 */
export function useAsyncOperation<T>(
  asyncFunction: (..._args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {}
): AsyncOperationReturn<T> {
  const { maxRetries = 3, retryDelay = 1000, onError, onSuccess } = options;
  
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const lastArgsRef = useRef<any[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
    });
    lastArgsRef.current = [];
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Cancel any pending operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      lastArgsRef.current = args;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await asyncFunction(...args);
          
          setState({
            data: result,
            loading: false,
            error: null,
            retryCount: attempt,
          });
          
          onSuccess?.(result);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Don't retry if aborted
          if (abortControllerRef.current?.signal.aborted) {
            throw lastError;
          }
          
          // Don't retry on the last attempt
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = retryDelay * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // All retries exhausted
      setState({
        data: null,
        loading: false,
        error: lastError,
        retryCount: maxRetries,
      });
      
      onError?.(lastError!);
      return null;
    },
    [asyncFunction, maxRetries, retryDelay, onError, onSuccess]
  );

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastArgsRef.current.length === 0) {
      console.warn('No previous arguments to retry with');
      return null;
    }
    return execute(...lastArgsRef.current);
  }, [execute]);

  return {
    ...state,
    execute,
    reset,
    retry,
  };
}

export default useAsyncOperation;