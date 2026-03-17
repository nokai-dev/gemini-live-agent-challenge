/**
 * VoicePilot API Client
 * Handles communication with the backend API
 */

const API_BASE_URL = process.env.VOICEPILOT_API_URL || 'http://localhost:8080';

// Types matching backend API
export interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnalyzeRequest {
  screenshot: string;
  audio: string;
  selection: Selection | null;
}

export interface AnalyzeResponse {
  targetFile: string;
  codeChange: string;
  description: string;
  confidence: number;
  element: string;
  intent: string;
}

export interface ApplyRequest {
  filePath: string;
  codeChange: {
    before: string;
    after: string;
  };
}

export interface ApplyResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
}

/**
 * Check if backend is healthy
 */
export async function healthCheck(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return null;
  }
}

/**
 * Analyze screenshot + audio command via backend API
 */
export async function analyzeCommand(
  request: AnalyzeRequest & { command: string }
): Promise<{
  success: boolean;
  targetFile?: string;
  description?: string;
  codeChange?: { before: string; after: string };
  fullBefore?: string;
  fullAfter?: string;
  error?: string;
}> {
  try {
    // First check if backend is available
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      throw new Error('Backend is not available');
    }

    // Call the backend analyze endpoint
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        screenshot: request.screenshot,
        audio: request.audio,
        selection: request.selection,
      }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `HTTP ${response.status}`,
      }));
      throw new Error(errorData.message || errorData.error);
    }

    const data: AnalyzeResponse = await response.json();

    // Transform backend response to frontend format
    return {
      success: true,
      targetFile: data.targetFile,
      description: data.description,
      codeChange: {
        before: `// ${data.element} - before`,
        after: data.codeChange,
      },
      fullBefore: `// ${data.targetFile}\n// Element: ${data.element}\n// Intent: ${data.intent}\n\n${data.codeChange}`,
      fullAfter: `// ${data.targetFile}\n// Element: ${data.element}\n// Intent: ${data.intent}\n// Confidence: ${data.confidence}\n\n${data.codeChange}`,
    };
  } catch (error) {
    console.error('API analyze error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply code change via backend API
 */
export async function applyChange(
  request: ApplyRequest
): Promise<ApplyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filePath: request.filePath,
        codeChange: request.codeChange.after,
      }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `HTTP ${response.status}`,
      }));
      throw new Error(errorData.message || errorData.error);
    }

    return await response.json();
  } catch (error) {
    console.error('API apply error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Demo endpoint - returns hardcoded responses for testing
 */
export async function demoCommand(
  demoType: 'button-blue' | 'card-padding' | 'text-bigger' | 'grid-layout'
): Promise<{
  success: boolean;
  targetFile?: string;
  description?: string;
  codeChange?: { before: string; after: string };
  fullBefore?: string;
  fullAfter?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ demoType }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: AnalyzeResponse = await response.json();

    return {
      success: true,
      targetFile: data.targetFile,
      description: data.description,
      codeChange: {
        before: `// ${data.element} - before`,
        after: data.codeChange,
      },
      fullBefore: `// ${data.targetFile}\n// Element: ${data.element}\n// Intent: ${data.intent}\n\n${data.codeChange}`,
      fullAfter: `// ${data.targetFile}\n// Element: ${data.element}\n// Intent: ${data.intent}\n// Confidence: ${data.confidence}\n\n${data.codeChange}`,
    };
  } catch (error) {
    console.error('API demo error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check backend availability
 */
export async function isBackendAvailable(): Promise<boolean> {
  const health = await healthCheck();
  return health !== null && health.status === 'healthy';
}

export default {
  healthCheck,
  analyzeCommand,
  applyChange,
  demoCommand,
  isBackendAvailable,
};
