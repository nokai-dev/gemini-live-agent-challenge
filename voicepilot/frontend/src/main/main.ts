import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let previewWindow: BrowserWindow | null = null;

const DEMO_PROJECT_PATH = path.join(__dirname, '../../demo-project');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'VoicePilot - AI Code Editor',
    titleBarStyle: 'hiddenInset',
  });

  // Load the control panel
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createPreviewWindow() {
  previewWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'VoicePilot - Preview'
  });

  // Load the demo project
  previewWindow.loadFile(path.join(__dirname, '../../demo-project/LandingPage.html'));

  previewWindow.on('closed', () => {
    previewWindow = null;
  });
}

// App event handlers
app.whenReady().then(() => {
  createMainWindow();
  createPreviewWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createPreviewWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers

// Get available screen sources
ipcMain.handle('get-screen-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 300, height: 300 }
  });
  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL()
  }));
});

// Capture screen
ipcMain.handle('capture-screen', async (event, sourceId: string) => {
  try {
    // In a real implementation, this would capture the screen
    // For demo, return success
    return { success: true, message: 'Screen captured' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Analyze command (mock)
ipcMain.handle('analyze-command', async (event, data: {
  screenshot: string;
  audio: string;
  selection: { x: number; y: number; width: number; height: number } | null;
  command: string;
}) => {
  const cmd = data.command.toLowerCase();
  
  // Demo command 1: "Make this button blue"
  if (cmd.includes('button') && cmd.includes('blue')) {
    return {
      success: true,
      targetFile: 'Button.tsx',
      description: 'Change button background color to blue',
      codeChange: {
        before: 'backgroundColor: "#8b5cf6",',
        after: 'backgroundColor: "#3b82f6",',
      },
      fullBefore: await getFileContent('Button.tsx'),
      fullAfter: (await getFileContent('Button.tsx')).replace('backgroundColor: "#8b5cf6",', 'backgroundColor: "#3b82f6",'),
    };
  }
  
  // Demo command 2: "Add more padding here"
  if (cmd.includes('padding')) {
    return {
      success: true,
      targetFile: 'Card.tsx',
      description: 'Add more padding to the card',
      codeChange: {
        before: 'padding: "16px",',
        after: 'padding: "32px",',
      },
      fullBefore: await getFileContent('Card.tsx'),
      fullAfter: (await getFileContent('Card.tsx')).replace('padding: "16px",', 'padding: "32px",'),
    };
  }
  
  // Demo command 3: "Make this font bigger"
  if (cmd.includes('font') && cmd.includes('bigger')) {
    const content = await getFileContent('Button.tsx');
    return {
      success: true,
      targetFile: 'Button.tsx',
      description: 'Increase button font size',
      codeChange: {
        before: 'fontSize: "14px",',
        after: 'fontSize: "18px",',
      },
      fullBefore: content,
      fullAfter: content.replace('fontSize: "14px",', 'fontSize: "18px",'),
    };
  }
  
  // Demo command 4: "Make these cards a grid"
  if (cmd.includes('grid') || (cmd.includes('cards') && cmd.includes('layout'))) {
    const content = await getFileContent('App.tsx');
    return {
      success: true,
      targetFile: 'App.tsx',
      description: 'Change cards layout to grid',
      codeChange: {
        before: 'flexDirection: "column",',
        after: 'display: "grid",\n    gridTemplateColumns: "repeat(3, 1fr)",\n    gap: "16px",',
      },
      fullBefore: content,
      fullAfter: content.replace('flexDirection: "column",', 'display: "grid",\n    gridTemplateColumns: "repeat(3, 1fr)",\n    gap: "16px",'),
    };
  }
  
  // Default response
  return {
    success: true,
    targetFile: 'Button.tsx',
    description: `Processed command: "${data.command}"`,
    codeChange: {
      before: '// Original code',
      after: '// Modified code',
    },
    fullBefore: await getFileContent('Button.tsx'),
    fullAfter: await getFileContent('Button.tsx'),
  };
});

// Apply code change
ipcMain.handle('apply-change', async (event, data: {
  targetFile: string;
  codeChange: { before: string; after: string };
}) => {
  try {
    const filePath = path.join(DEMO_PROJECT_PATH, data.targetFile);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes(data.codeChange.before)) {
      content = content.replace(data.codeChange.before, data.codeChange.after);
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } else {
      return { success: false, error: 'Could not find the code to replace' };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Get demo project files
ipcMain.handle('get-demo-files', async () => {
  try {
    const files: Array<{ name: string; path: string; content: string }> = [];
    const entries = fs.readdirSync(DEMO_PROJECT_PATH);
    
    for (const entry of entries) {
      const fullPath = path.join(DEMO_PROJECT_PATH, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isFile() && (entry.endsWith('.tsx') || entry.endsWith('.ts') || entry.endsWith('.jsx') || entry.endsWith('.js'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({ name: entry, path: fullPath, content });
      }
    }
    
    return { success: true, files };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Get file content
ipcMain.handle('get-file-content', async (event, fileName: string) => {
  try {
    const content = await getFileContent(fileName);
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Helper function to get file content
async function getFileContent(fileName: string): Promise<string> {
  const filePath = path.join(DEMO_PROJECT_PATH, fileName);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}