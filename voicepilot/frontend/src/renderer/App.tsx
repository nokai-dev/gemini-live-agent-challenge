import React, { useState, useCallback, useEffect } from 'react';
import { Mic, Monitor, Code2, Sparkles, Play, Square } from 'lucide-react';
import { ScreenPreview } from './components/ScreenPreview';
import { VoiceRecorder } from './components/VoiceRecorder';
import { HighlightOverlay } from './components/HighlightOverlay';
import { CodeDiff } from './components/CodeDiff';
import { DemoProject } from './components/DemoProject';
import { StatusIndicator } from './components/StatusIndicator';
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

function App() {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);

  const handleScreenshotCapture = useCallback((imageData: string) => {
    setScreenshot(imageData);
    setStatus('idle');
  }, []);

  const handleSelectionComplete = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    setSelection(rect);
    setShowOverlay(false);
    setStatus('idle');
  }, []);

  const handleTranscription = useCallback((text: string) => {
    setTranscription(text);
    processCommand(text);
  }, [screenshot, selection]);

  const processCommand = async (command: string) => {
    if (!screenshot) return;
    
    setStatus('processing');
    
    try {
      const result = await window.electronAPI.analyzeCommand({
        screenshot,
        audio: '',
        selection,
        command,
      });
      
      if (result.success) {
        setAnalysisResult(result);
        setStatus('ready');
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setStatus('idle');
    }
  };

  const handleApplyChange = async () => {
    if (!analysisResult) return;
    
    setStatus('processing');
    
    try {
      const result = await window.electronAPI.applyChange({
        targetFile: analysisResult.targetFile,
        codeChange: analysisResult.codeChange,
      });
      
      if (result.success) {
        setStatus('applied');
        setFileRefreshTrigger(prev => prev + 1);
        setTimeout(() => {
          setStatus('idle');
          setAnalysisResult(null);
          setTranscription('');
        }, 3000);
      } else {
        setStatus('ready');
      }
    } catch (error) {
      console.error('Apply failed:', error);
      setStatus('ready');
    }
  };

  const startCapture = () => {
    setShowOverlay(true);
    setStatus('capturing');
  };

  const startRecording = () => {
    setStatus('recording');
  };

  // Demo commands
  const demoCommands = [
    'Make this button blue',
    'Add more padding here',
    'Make this font bigger',
    'Make these cards a grid',
  ];

  const handleQuickCommand = (command: string) => {
    setScreenshot('mock');
    setTranscription(command);
    processCommand(command);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
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
          <StatusIndicator status={status} />
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
                  disabled={status === 'capturing' || status === 'processing'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Monitor className="w-4 h-4" />
                  {screenshot ? 'Recapture Screen' : 'Capture Screen'}
                </button>
                
                <button
                  onClick={startRecording}
                  disabled={status === 'recording' || status === 'processing' || !screenshot}
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
                  {demoCommands.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleQuickCommand(cmd)}
                      className="text-left px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      "{cmd}"
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
                  disabled={status === 'processing'}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-xl font-medium transition-all duration-200"
                >
                  {status === 'processing' ? (
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
    </div>
  );
}

export default App;