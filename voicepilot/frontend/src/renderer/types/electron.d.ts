export interface ElectronAPI {
  getScreenSources: () => Promise<Array<{ id: string; name: string; thumbnail: string }>>;
  captureScreen: (_sourceId: string) => Promise<{ success: boolean; image?: string; error?: string }>;
  analyzeCommand: (_data: {
    screenshot: string;
    audio: string;
    selection: { x: number; y: number; width: number; height: number } | null;
    command: string;
  }) => Promise<any>;
  applyChange: (_data: { targetFile: string; codeChange: { before: string; after: string } }) => Promise<{ success: boolean; error?: string }>;
  getDemoFiles: () => Promise<{ success: boolean; files?: any[]; error?: string }>;
  getFileContent: (_filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  checkBackendHealth: () => Promise<{ isHealthy: boolean; url: string }>;
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
