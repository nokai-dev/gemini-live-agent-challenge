import React from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { BackendStatus } from '../hooks/useBackendStatus';

interface ConnectionStatusProps {
  status: BackendStatus;
  latency: number | null;
  lastChecked: Date | null;
  error: string | null;
  onRefresh: () => void;
}

const statusConfig: Record<BackendStatus, { icon: typeof Wifi; color: string; label: string }> = {
  online: {
    icon: Wifi,
    color: 'text-green-500 bg-green-50 border-green-200',
    label: 'Connected',
  },
  offline: {
    icon: WifiOff,
    color: 'text-amber-500 bg-amber-50 border-amber-200',
    label: 'Offline Mode',
  },
  checking: {
    icon: RefreshCw,
    color: 'text-blue-500 bg-blue-50 border-blue-200',
    label: 'Checking...',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500 bg-red-50 border-red-200',
    label: 'Connection Error',
  },
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  latency,
  lastChecked,
  error,
  onRefresh,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    const seconds = Math.floor((Date.now() - lastChecked.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${config.color}`}>
      <Icon className={`w-4 h-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
      <span className="font-medium">{config.label}</span>
      
      {status === 'online' && latency !== null && (
        <span className="text-xs opacity-75">({latency}ms)</span>
      )}
      
      {(status === 'offline' || status === 'error') && (
        <button
          onClick={onRefresh}
          className="ml-1 p-0.5 hover:bg-black/5 rounded transition-colors"
          title="Retry connection"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
      
      {error && status === 'error' && (
        <span className="text-xs opacity-75 ml-1" title={error}>
          (hover for details)
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
