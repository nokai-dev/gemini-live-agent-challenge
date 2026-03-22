import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let previewWindow: BrowserWindow | null = null;

const DEMO_PROJECT_PATH = path.join(__dirname, '../../demo-project');
const API_BASE_URL = process.env.VOICEPILOT_API_URL || 'http://localhost:8080';

// Allowed file extensions for code changes
const ALLOWED_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.html', '.json'];

// Maximum file path length
const MAX_PATH_LENGTH = 255;

// Maximum command length
const MAX_COMMAND_LENGTH = 1000;

/**
 * Validate file path to prevent directory traversal attacks
 * Returns { isValid, error, sanitizedPath }
 */
function validateFilePath(filePath: string): { isValid: boolean; error?: string; sanitizedPath?: string } {
  // Check if path is empty
  if (!filePath || filePath.trim().length === 0) {
    return { isValid: false, error: 'File path is required' };
  }

  // Check path length
  if (filePath.length > MAX_PATH_LENGTH) {
    return { isValid: false, error: `File path exceeds maximum length of ${MAX_PATH_LENGTH} characters` };
  }

  // Check for null bytes
  if (filePath.includes('\0')) {
    return { isValid: false, error: 'File path contains invalid characters' };
  }

  // Normalize the path and get the basename
  const normalizedPath = path.normalize(filePath);
  const basename = path.basename(normalizedPath);

  // Check for directory traversal attempts
  if (normalizedPath.startsWith('..') || normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
    return { isValid: false, error: 'Directory traversal is not allowed' };
  }

  // Check for absolute paths
  if (path.isAbsolute(normalizedPath)) {
    return { isValid: false, error: 'Absolute paths are not allowed' };
  }

  // Check file extension
  const ext = path.extname(basename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { isValid: false, error: `File extension '${ext}' is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }

  // Check for valid filename characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(basename)) {
    return { isValid: false, error: 'File path contains invalid characters' };
  }

  // Ensure the resolved path is within the demo project
  const fullPath = path.join(DEMO_PROJECT_PATH, basename);
  const resolvedPath = path.resolve(fullPath);
  const resolvedDemoPath = path.resolve(DEMO_PROJECT_PATH);
  
  if (!resolvedPath.startsWith(resolvedDemoPath)) {
    return { isValid: false, error: 'File path is outside the allowed directory' };
  }

  return { isValid: true, sanitizedPath: basename };
}

/**
 * Validate command input
 */
function validateCommand(command: string): { isValid: boolean; error?: string; sanitizedCommand?: string } {
  // Check if command is empty
  if (!command || command.trim().length === 0) {
    return { isValid: false, error: 'Command is required' };
  }

  // Check command length
  if (command.length > MAX_COMMAND_LENGTH) {
    return { isValid: false, error: `Command exceeds maximum length of ${MAX_COMMAND_LENGTH} characters` };
  }

  // Check for null bytes
  if (command.includes('\0')) {
    return { isValid: false, error: 'Command contains invalid characters' };
  }

  // Basic XSS prevention - check for script tags
  const xssPattern = /<(script|iframe|object|embed|form)[\s\S]*?>/i;
  if (xssPattern.test(command)) {
    return { isValid: false, error: 'Command contains potentially dangerous content' };
  }

  // Sanitize the command (trim whitespace)
  const sanitizedCommand = command.trim();

  return { isValid: true, sanitizedCommand };
}

/**
 * Validate code change content
 */
function validateCodeChange(codeChange: { before: string; after: string }): { isValid: boolean; error?: string } {
  // Check if code change is provided
  if (!codeChange) {
    return { isValid: false, error: 'Code change is required' };
  }

  // Check before/after strings
  if (typeof codeChange.before !== 'string' || typeof codeChange.after !== 'string') {
    return { isValid: false, error: 'Invalid code change format' };
  }

  // Check for excessive length (prevent memory issues)
  const MAX_CODE_LENGTH = 100000; // 100KB
  if (codeChange.before.length > MAX_CODE_LENGTH || codeChange.after.length > MAX_CODE_LENGTH) {
    return { isValid: false, error: 'Code change exceeds maximum size' };
  }

  // Check for null bytes
  if (codeChange.before.includes('\0') || codeChange.after.includes('\0')) {
    return { isValid: false, error: 'Code change contains invalid characters' };
  }

  return { isValid: true };
}

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

// API Client for backend communication
async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }
    return false;
  } catch {
    return false;
  }
}

async function callBackendAPI(endpoint: string, body: unknown): Promise<any> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

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
ipcMain.handle('capture-screen', async (_event, _sourceId: string) => {
  // In a real implementation, this would capture the screen
  // For demo, return success
  return { success: true, message: 'Screen captured' };
});

// Analyze command - tries backend API first, falls back to mock
ipcMain.handle('analyze-command', async (event, data: {
  screenshot: string;
  audio: string;
  selection: { x: number; y: number; width: number; height: number } | null;
  command: string;
}) => {
  // Validate command input
  const commandValidation = validateCommand(data.command);
  if (!commandValidation.isValid) {
    console.error('Command validation failed:', commandValidation.error);
    return { success: false, error: commandValidation.error };
  }

  const cmd = commandValidation.sanitizedCommand!.toLowerCase();
  
  // Try backend API first
  try {
    const isBackendHealthy = await healthCheck();
    if (isBackendHealthy) {
      console.log('Using backend API for analyze-command');
      
      // Map command to demo type for backend
      let demoType: string | null = null;
      if (cmd.includes('button') && cmd.includes('blue')) demoType = 'button-blue';
      else if (cmd.includes('padding')) demoType = 'card-padding';
      else if (cmd.includes('font') && cmd.includes('bigger')) demoType = 'text-bigger';
      else if (cmd.includes('grid') || (cmd.includes('cards') && cmd.includes('layout'))) demoType = 'grid-layout';
      
      if (demoType) {
        // Use demo endpoint for known commands
        const result = await callBackendAPI('/api/analyze/demo', { demoType });
        return {
          success: true,
          targetFile: result.targetFile,
          description: result.description,
          codeChange: {
            before: `// ${result.element} - before`,
            after: result.codeChange,
          },
          fullBefore: `// ${result.targetFile}\n// Element: ${result.element}\n// Intent: ${result.intent}\n\n${result.codeChange}`,
          fullAfter: `// ${result.targetFile}\n// Element: ${result.element}\n// Intent: ${result.intent}\n// Confidence: ${result.confidence}\n\n${result.codeChange}`,
        };
      }
      
      // For unknown commands, use the analyze endpoint
      const result = await callBackendAPI('/api/analyze', {
        screenshot: data.screenshot,
        audio: data.audio,
        selection: data.selection,
      });
      
      return {
        success: true,
        targetFile: result.targetFile,
        description: result.description,
        codeChange: {
          before: `// ${result.element} - before`,
          after: result.codeChange,
        },
        fullBefore: `// ${result.targetFile}\n// Element: ${result.element}\n// Intent: ${result.intent}\n\n${result.codeChange}`,
        fullAfter: `// ${result.targetFile}\n// Element: ${result.element}\n// Intent: ${result.intent}\n// Confidence: ${result.confidence}\n\n${result.codeChange}`,
      };
    }
  } catch (err) {
    console.warn('Backend API failed, falling back to mock:', err);
  }
  
  // Fallback to mock implementation
  console.log('Using mock implementation for analyze-command');
  
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

// Apply code change - tries backend API first, falls back to local file system
ipcMain.handle('apply-change', async (event, data: {
  targetFile: string;
  codeChange: { before: string; after: string };
}) => {
  // Validate file path
  const pathValidation = validateFilePath(data.targetFile);
  if (!pathValidation.isValid) {
    console.error('File path validation failed:', pathValidation.error);
    return { success: false, error: pathValidation.error };
  }

  // Validate code change
  const codeValidation = validateCodeChange(data.codeChange);
  if (!codeValidation.isValid) {
    console.error('Code change validation failed:', codeValidation.error);
    return { success: false, error: codeValidation.error };
  }

  const sanitizedFileName = pathValidation.sanitizedPath!;

  // Try backend API first
  try {
    const isBackendHealthy = await healthCheck();
    if (isBackendHealthy) {
      console.log('Using backend API for apply-change');
      const result = await callBackendAPI('/api/analyze/apply', {
        filePath: sanitizedFileName,
        codeChange: data.codeChange.after,
      });
      return result;
    }
  } catch (err) {
    console.warn('Backend API failed, falling back to local file system:', err);
  }
  
  // Fallback to local file system
  console.log('Using local file system for apply-change');
  try {
    const filePath = path.join(DEMO_PROJECT_PATH, sanitizedFileName);
    
    // Double-check the resolved path is still within demo project
    const resolvedPath = path.resolve(filePath);
    const resolvedDemoPath = path.resolve(DEMO_PROJECT_PATH);
    if (!resolvedPath.startsWith(resolvedDemoPath)) {
      return { success: false, error: 'Security violation: Path traversal detected' };
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${sanitizedFileName}` };
    }
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes(data.codeChange.before)) {
      content = content.replace(data.codeChange.before, data.codeChange.after);
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true, message: `Changes applied to ${sanitizedFileName}` };
    } else {
      return { success: false, error: 'Could not find the code to replace' };
    }
  } catch (error) {
    console.error('Error applying change:', error);
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

// New IPC handler: Check backend health
ipcMain.handle('check-backend-health', async () => {
  const isHealthy = await healthCheck();
  return { isHealthy, url: API_BASE_URL };
});
