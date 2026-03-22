import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { BackendStatus } from '../hooks/useBackendStatus';

interface ConnectionStatusProps {
  status: BackendStatus;
  isOnline: boolean;
  lastChecked: Date | null;
  error: string | null;
  onRetry: () => void;
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  isOnline: _isOnline,
  lastChecked,
  error,
  onRetry,
  showDetails = false,
}) => {
  const formatLastChecked = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-slate-600">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Checking connection...</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Offline</span>
          <button
            onClick={onRetry}
            className="ml-auto flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
        {showDetails && (
          <div className="px-3 py-2 bg-red-50/50 rounded-lg">
            {error && (
              <p className="text-xs text-red-600 mb-1">{error}</p>
            )}
            <p className="text-xs text-red-500">
              Last checked: {formatLastChecked(lastChecked)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Online
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700">
      <Wifi className="w-4 h-4" />
      <span className="text-sm font-medium">Connected</span>
      {showDetails && lastChecked && (
        <span className="text-xs text-green-600 ml-2">
          ({formatLastChecked(lastChecked)})
        </span>
      )}
    </div>
  );
};

/**
 * Compact inline status indicator for use in headers
 */
export const ConnectionStatusDot: React.FC<{
  status: BackendStatus;
  onClick?: () => void;
}> = ({ status, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500 animate-pulse';
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
      title={`Backend status: ${getStatusLabel()}`}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-slate-500">{getStatusLabel()}</span>
    </button>
  );
};

/**
 * Offline mode banner
 */
export const OfflineBanner: React.FC<{
  onRetry: () => void;
  onSwitchToDemo?: () => void;
}> = ({ onRetry, onSwitchToDemo }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Backend is offline
            </p>
            <p className="text-xs text-amber-600">
              Running in demo mode with mock responses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onSwitchToDemo && (
            <button
              onClick={onSwitchToDemo}
              className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
            >
              Demo Mode
            </button>
          )}
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;
