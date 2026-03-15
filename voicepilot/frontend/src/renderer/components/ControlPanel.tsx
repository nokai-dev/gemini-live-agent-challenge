import React from 'react';
import { Play, Square, Mic, Monitor } from 'lucide-react';

interface ControlPanelProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isListening, onStart, onStop }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex justify-center gap-4">
        {!isListening ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Play size={20} />
            Start Session
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Square size={20} />
            Stop Session
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border-2 ${isListening ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-700/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Mic size={20} className={isListening ? 'text-green-400' : 'text-gray-400'} />
            <span className="font-medium">Microphone</span>
          </div>
          <div className="text-sm text-gray-400">
            {isListening ? 'Listening for voice commands' : 'Click Start to begin'}
          </div>
        </div>

        <div className={`p-4 rounded-lg border-2 ${isListening ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-700/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Monitor size={20} className={isListening ? 'text-blue-400' : 'text-gray-400'} />
            <span className="font-medium">Screen Capture</span>
          </div>
          <div className="text-sm text-gray-400">
            {isListening ? 'Analyzing screen content' : 'Click Start to begin'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;