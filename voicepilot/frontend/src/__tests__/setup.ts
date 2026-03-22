import '@testing-library/jest-dom';
import { beforeEach, afterEach, vi } from 'vitest';

// Mock electronAPI globally for tests
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electronAPI: {
      analyzeCommand: (_data: any) => Promise<any>;
      applyChange: (_data: any) => Promise<any>;
      getDemoFiles: () => Promise<any>;
      getFileContent: (_fileName: string) => Promise<any>;
      checkBackendHealth: () => Promise<any>;
    };
  }
}

// Mock fetch globally for backend health checks
const mockFetch = vi.fn().mockResolvedValue(
  new Response(JSON.stringify({ status: 'healthy' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
);
global.fetch = mockFetch;

// Setup default mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset fetch to return healthy status
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ status: 'healthy' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );

  window.electronAPI = {
    analyzeCommand: vi.fn().mockResolvedValue({
      success: true,
      targetFile: 'Button.tsx',
      description: 'Change button color',
      codeChange: {
        before: 'bg-purple-500',
        after: 'bg-blue-500',
      },
      fullBefore: '// Before',
      fullAfter: '// After',
    }),
    applyChange: vi.fn().mockResolvedValue({
      success: true,
      message: 'Changes applied',
    }),
    getDemoFiles: vi.fn().mockResolvedValue({
      success: true,
      files: [],
    }),
    getFileContent: vi.fn().mockResolvedValue({
      success: true,
      content: '',
    }),
    checkBackendHealth: vi.fn().mockResolvedValue({
      isHealthy: true,
      url: 'http://localhost:8080',
    }),
  };
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
