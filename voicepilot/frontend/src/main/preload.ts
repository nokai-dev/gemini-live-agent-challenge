import { contextBridge, ipcRenderer } from 'electron';

interface ElectronAPI {
  getScreenSources: () => Promise<Array<{ id: string; name: string; thumbnail: string }>>;
  captureScreen: (sourceId: string) => Promise<{ success: boolean; image?: string; error?: string }>;
  analyzeCommand: (data: {
    screenshot: string;
    audio: string;
    selection: { x: number; y: number; width: number; height: number } | null;
    command: string;
  }) => Promise<any>;
  applyChange: (data: { targetFile: string; codeChange: { before: string; after: string } }) => Promise<{ success: boolean; error?: string }>;
  getDemoFiles: () => Promise<{ success: boolean; files?: any[]; error?: string }>;
  getFileContent: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  checkBackendHealth: () => Promise<{ isHealthy: boolean; url: string }>;
}

const api: ElectronAPI = {
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  captureScreen: (sourceId: string) => ipcRenderer.invoke('capture-screen', sourceId),
  analyzeCommand: (data) => ipcRenderer.invoke('analyze-command', data),
  applyChange: (data) => ipcRenderer.invoke('apply-change', data),
  getDemoFiles: () => ipcRenderer.invoke('get-demo-files'),
  getFileContent: (filePath: string) => ipcRenderer.invoke('get-file-content', filePath),
  checkBackendHealth: () => ipcRenderer.invoke('check-backend-health'),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type { ElectronAPI };
