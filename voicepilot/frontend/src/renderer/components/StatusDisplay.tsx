import React from 'react';
import { Mic, Monitor, CheckCircle, AlertCircle } from 'lucide-react';

interface StatusDisplayProps {
  status: string;
  isListening: boolean;
  isCapturing: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, isListening, isCapturing }) => {
  const getStatusColor = () => {
    if (status === 'Ready') return 'bg-gray-700';
    if (status === 'Connected') return 'bg-blue-900/50 border-blue-500';
    if (status === 'Listening...') return 'bg-green-900/50 border-green-500';
    if (status === 'Stopped') return 'bg-yellow-900/50 border-yellow-500';
    return 'bg-red-900/50 border-red-500';
  };

  return (
    <div className={`rounded-lg p-4 mb-6 border-2 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'Listening...' ? (
            <div className="relative">
              <Mic size={24} className="text-green-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
          ) : status === 'Connected' ? (
            <CheckCircle size={24} className="text-blue-400" />
          ) : (
            <AlertCircle size={24} className="text-gray-400" />
          )}
          <div>
            <div className="font-medium">{status}</div>
            <div className="text-sm text-gray-400">
              {isListening ? 'Active session' : 'Waiting to start'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isListening && (
            <>
              <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs rounded">Mic On</span>
              <span className="px-2 py-1 bg-blue-600/30 text-blue-400 text-xs rounded">Screen On</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusDisplay;