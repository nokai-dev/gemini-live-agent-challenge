import React, { useState, useCallback, useEffect } from 'react';
import { Mic, Monitor, Code2, Sparkles, Keyboard } from 'lucide-react';
import { ScreenPreview } from './components/ScreenPreview';
import { VoiceRecorder } from './components/VoiceRecorder';
import { HighlightOverlay } from './components/HighlightOverlay';
import { CodeDiff } from './components/CodeDiff';
import { DemoProject } from './components/DemoProject';
import { StatusIndicator } from './components/StatusIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingOverlay } from './components/LoadingSpinner';
import { useToast } from './components/Toast';
import { useAsyncOperation } from './hooks/useAsyncOperation';
import { useKeyboardShortcuts, VOICEPILOT_SHORTCUTS } from './hooks/useKeyboardShortcuts';
import { useSessionStorage } from './hooks/useSessionStorage';
import { SessionHistory } from './components/SessionHistory';
import './styles/main.css';

type AppStatus = 'idle' | 'capturing' | 'recording' | 'processing' | 'ready' | 'applied';

interface AnalysisResult {
  targetFile: string;
  description: string;
  codeChange: {
    before: string;
    after: string;
  };
  fullBefore: string;
  fullAfter: string;
}

// Demo commands configuration - centralized for maintainability
const DEMO_COMMANDS = [
  { text: 'Make this button blue', shortcut: 'Alt+1' },
  { text: 'Add more padding here', shortcut: 'Alt+2' },
  { text: 'Make this font bigger', shortcut: 'Alt+3' },
  { text: 'Make these cards a grid', shortcut: 'Alt+4' },
] as const;

function App() {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { success, error, ToastContainer } = useToast();

  // Session persistence
  const {
    entries: sessionEntries,
    startSession,
    updateSession,
    failSession,
    replaySession,
    deleteSession,
    clearAllSessions,
    exportSessions,
    importSessions,
  } = useSessionStorage();

  // Async operation hooks with retry logic
  const analyzeCommandOp = useAsyncOperation(
    async (data: any) => {
      const result = await window.electronAPI.analyzeCommand(data);
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }
      return result;
    },
    {
      maxRetries: 2,
      retryDelay: 1000,
      onError: (err) => {
        error(`Analysis failed: ${err.message}`);
        setStatus('idle');
      },
      onSuccess: () => {
        success('Analysis complete!');
      },
    }
  );

  const applyChangeOp = useAsyncOperation(
    async (data: any) => {
      const result = await window.electronAPI.applyChange(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to apply changes');
      }
      return result;
    },
    {
      maxRetries: 1,
      onError: (err) => {
        error(`Failed to apply changes: ${err.message}`);
        setStatus('ready');
      },
      onSuccess: () => {
        success('Changes applied successfully!');
      },
    }
  );

  const handleScreenshotCapture = useCallback((imageData: string) => {
    setScreenshot(imageData);
    setStatus('idle');
    success('Screen captured successfully');
  }, [success]);

  const handleSelectionComplete = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    setSelection(rect);
    setShowOverlay(false);
    setStatus('idle');
    success('Selection captured');
  }, [success]);

  const handleTranscription = useCallback((text: string) => {
    setTranscription(text);
    processCommand(text);
  }, [screenshot, selection]);

  const processCommand = async (command: string) => {
    if (!screenshot) {
      error('Please capture a screenshot first');
      return;
    }
    
    // Start a new session
    const sessionId = startSession({
      command,
      screenshot,
      selection,
    });
    
    setStatus('processing');
    
    const result = await analyzeCommandOp.execute({
      screenshot,
      audio: '',
      selection,
      command,
    });
    
    if (result) {
      setAnalysisResult(result);
      setStatus('ready');
      // Update session with results
      updateSession(sessionId, {
        targetFile: result.targetFile,
        description: result.description,
        codeChange: result.codeChange,
        status: 'completed',
      });
    } else {
      setStatus('idle');
      // Mark session as failed
      failSession(sessionId, analyzeCommandOp.error?.message || 'Analysis failed');
    }
  };

  const handleApplyChange = async () => {
    if (!analysisResult) return;
    
    setStatus('processing');
    
    const result = await applyChangeOp.execute({
      targetFile: analysisResult.targetFile,
      codeChange: analysisResult.codeChange,
    });
    
    if (result?.success) {
      setStatus('applied');
      setFileRefreshTrigger(prev => prev + 1);
      success('Changes applied successfully!');
      setTimeout(() => {
        setStatus('idle');
        setAnalysisResult(null);
        setTranscription('');
      }, 3000);
    } else {
      setStatus('ready');
      error(`Failed to apply changes: ${applyChangeOp.error?.message || 'Unknown error'}`);
    }
  };

  const startCapture = () => {
    setShowOverlay(true);
    setStatus('capturing');
  };

  const startRecording = () => {
    if (!screenshot) {
      error('Please capture a screenshot first');
      return;
    }
    setStatus('recording');
  };

  const handleQuickCommand = (command: string) => {
    setScreenshot('mock');
    setTranscription(command);
    processCommand(command);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      { key: 'c', modifiers: { ctrl: true }, handler: startCapture, description: 'Capture screen' },
      { key: 'r', modifiers: { ctrl: true }, handler: startRecording, description: 'Start recording' },
      { key: 'Enter', modifiers: { ctrl: true }, handler: handleApplyChange, description: 'Apply changes' },
      { key: 'Escape', handler: () => {
        setShowOverlay(false);
        setStatus('idle');
      }, description: 'Cancel' },
      { key: '?', modifiers: { shift: true }, handler: () => setShowShortcuts(true), description: 'Show shortcuts' },
      ...DEMO_COMMANDS.map((cmd, index) => ({
        key: String(index + 1),
        modifiers: { alt: true },
        handler: () => handleQuickCommand(cmd.text),
        description: `Demo: ${cmd.text}`,
      })),
    ],
    enabled: true,
  });

  // Handle Escape key to close shortcuts modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showShortcuts]);

  const isLoading = analyzeCommandOp.loading || applyChangeOp.loading;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
        {/* Loading Overlay */}
        <LoadingOverlay 
          isVisible={isLoading} 
          message="Processing..."
          subMessage={analyzeCommandOp.loading ? "Analyzing your command with AI..." : "Applying changes..."}
        />

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Keyboard className="w-5 h-5" />
                  Keyboard Shortcuts
                </h2>
                <button 
                  onClick={() => setShowShortcuts(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                <ShortcutItem keys="Ctrl+C" action="Capture screen" />
                <ShortcutItem keys="Ctrl+R" action="Start voice recording" />
                <ShortcutItem keys="Ctrl+Enter" action="Apply changes" />
                <ShortcutItem keys="Escape" action="Cancel current operation" />
                <ShortcutItem keys="Shift+?" action="Show this help" />
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Demo Commands</p>
                  {DEMO_COMMANDS.map((cmd, i) => (
                    <ShortcutItem key={i} keys={cmd.shortcut} action={cmd.text} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VoicePilot
                </h1>
                <p className="text-sm text-slate-500">AI-Powered Code Editing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowShortcuts(true)}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Keyboard className="w-4 h-4" />
                Shortcuts
              </button>
              <StatusIndicator status={status} />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls & Preview */}
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-500" />
                  Capture & Command
                </h2>
                
                <div className="flex gap-3">
                  <button
                    onClick={startCapture}
                    disabled={status === 'capturing' || isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Monitor className="w-4 h-4" />
                    {screenshot ? 'Recapture Screen' : 'Capture Screen'}
                  </button>
                  
                  <button
                    onClick={startRecording}
                    disabled={status === 'recording' || isLoading || !screenshot}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Mic className="w-4 h-4" />
                    Voice Command
                  </button>
                </div>

                {/* Demo Commands */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-600 mb-3">Try these demo commands:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_COMMANDS.map((cmd) => (
                      <button
                        key={cmd.text}
                        onClick={() => handleQuickCommand(cmd.text)}
                        disabled={isLoading}
                        className="text-left px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-lg transition-colors"
                      >
                        <span className="text-slate-400 text-xs mr-1">{cmd.shortcut}</span>
                        "{cmd.text}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Screen Preview */}
              <ScreenPreview 
                screenshot={screenshot} 
                selection={selection}
                onCapture={handleScreenshotCapture}
              />

              {/* Voice Recorder */}
              <VoiceRecorder 
                isRecording={status === 'recording'}
                onTranscription={handleTranscription}
                onStartRecording={startRecording}
              />
            </div>

            {/* Right Column - Results & Demo */}
            <div className="space-y-6">
              {/* Analysis Result */}
              {analysisResult && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-purple-500" />
                    AI Analysis
                  </h2>
                  
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Command understood:</p>
                    <p className="text-lg font-medium text-blue-700">"{transcription}"</p>
                  </div>

                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Target file: </span>
                      {analysisResult.targetFile}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-medium">Change: </span>
                      {analysisResult.description}
                    </p>
                  </div>

                  <CodeDiff 
                    before={analysisResult.fullBefore}
                    after={analysisResult.fullAfter}
                  />

                  <button
                    onClick={handleApplyChange}
                    disabled={isLoading}
                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>Apply Changes</>
                    )}
                  </button>
                </div>
              )}

              {/* Demo Project */}
              <DemoProject 
                key={fileRefreshTrigger}
                onFileChange={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Highlight Overlay */}
        {showOverlay && (
          <HighlightOverlay 
            onSelectionComplete={handleSelectionComplete}
            onCancel={() => {
              setShowOverlay(false);
              setStatus('idle');
            }}
          />
        )}

        {/* Toast Notifications */}
        <ToastContainer />

        {/* Session History Panel */}
        <SessionHistory
          entries={sessionEntries}
          onReplay={(id) => {
            const session = replaySession(id);
            if (session) {
              setScreenshot(session.screenshot);
              setSelection(session.selection);
              setTranscription(session.command);
              setAnalysisResult({
                targetFile: session.targetFile,
                description: session.description,
                codeChange: session.codeChange,
                fullBefore: session.codeChange.before,
                fullAfter: session.codeChange.after,
              });
              setStatus('ready');
              success('Session replayed!');
            }
          }}
          onDelete={deleteSession}
          onClear={clearAllSessions}
          onExport={exportSessions}
          onImport={importSessions}
        />
      </div>
    </ErrorBoundary>
  );
}

// Helper component for keyboard shortcuts
function ShortcutItem({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-600">{action}</span>
      <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700">
        {keys}
      </kbd>
    </div>
  );
}

export default App;