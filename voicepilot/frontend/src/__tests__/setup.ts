import '@testing-library/jest-dom';

// Mock electronAPI globally for tests
declare global {
  interface Window {
    electronAPI: {
      analyzeCommand: (data: any) => Promise<any>;
      applyChange: (data: any) => Promise<any>;
      getDemoFiles: () => Promise<any>;
      getFileContent: (fileName: string) => Promise<any>;
      checkBackendHealth: () => Promise<any>;
    };
  }
}

// Setup default mocks before each test
beforeEach(() => {
  window.electronAPI = {
    analyzeCommand: jest.fn().mockResolvedValue({
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
    applyChange: jest.fn().mockResolvedValue({
      success: true,
      message: 'Changes applied',
    }),
    getDemoFiles: jest.fn().mockResolvedValue({
      success: true,
      files: [],
    }),
    getFileContent: jest.fn().mockResolvedValue({
      success: true,
      content: '',
    }),
    checkBackendHealth: jest.fn().mockResolvedValue({
      isHealthy: true,
      url: 'http://localhost:8080',
    }),
  };
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});