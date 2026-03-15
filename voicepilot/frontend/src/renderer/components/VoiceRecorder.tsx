import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';

interface VoiceRecorderProps {
  isRecording: boolean;
  onTranscription: (text: string) => void;
  onStartRecording: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onTranscription,
  onStartRecording,
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Demo commands for quick testing
  const demoCommands = [
    'Make this button blue',
    'Add more padding here',
    'Make this font bigger',
    'Make these cards a grid',
  ];

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // In a real app, send this to the backend
        console.log('Recording stopped, blob size:', audioBlob.size);
      };

      mediaRecorderRef.current.start();
      
      // Start visualization
      visualizeAudio();
      
      // For demo: simulate transcription after 2 seconds
      setTimeout(() => {
        const randomCommand = demoCommands[Math.floor(Math.random() * demoCommands.length)];
        setTranscript(randomCommand);
        onTranscription(randomCommand);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setAudioLevel(0);
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 128);
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const handleQuickCommand = (command: string) => {
    setTranscript(command);
    onTranscription(command);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <Volume2 className="w-4 h-4" />
        Voice Input
      </h3>

      {/* Recording Visualizer */}
      <div className="relative h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-4">
        {isRecording ? (
          <>
            {/* Animated bars */}
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(8, Math.min(80, (audioLevel * 60) + Math.random() * 40))}%`,
                    opacity: 0.6 + (i / 40),
                  }}
                />
              ))}
            </div>
            
            {/* Recording indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-red-500">Recording...</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-400 text-sm">
              {transcript ? 'Ready to record' : 'Click "Voice Command" to start'}
            </p>
          </div>
        )}
      </div>

      {/* Transcription Display */}
      {transcript && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs text-slate-500 mb-1">Transcribed:</p>
          <p className="text-lg font-medium text-blue-700">"{transcript}"</p>
        </div>
      )}

      {/* Manual Input Fallback */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2">Or type your command:</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., Make this button blue"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleQuickCommand(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (input?.value) {
                handleQuickCommand(input.value);
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};