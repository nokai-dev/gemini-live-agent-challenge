import React from 'react';
import { History, RotateCcw, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { SessionEntry } from '../hooks/useSessionStorage';

interface SessionHistoryProps {
  entries: SessionEntry[];
  onReplay: (id: string) => void;
  maxItems?: number;
}

const statusIcons = {
  pending: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  pending: 'text-yellow-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
};

const statusBgColors = {
  pending: 'bg-yellow-50 border-yellow-200',
  completed: 'bg-green-50 border-green-200',
  failed: 'bg-red-50 border-red-200',
};

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  entries,
  onReplay,
  maxItems = 10,
}) => {
  const recentEntries = entries.slice(-maxItems).reverse();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-800">Session History</h3>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No commands yet</p>
          <p className="text-sm mt-1">Your command history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-800">Session History</h3>
        </div>
        <span className="text-sm text-slate-500">{entries.length} commands</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {recentEntries.map((entry) => {
          const StatusIcon = statusIcons[entry.status];
          return (
            <div
              key={entry.id}
              className={`p-3 rounded-xl border ${statusBgColors[entry.status]} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusIcon className={`w-4 h-4 ${statusColors[entry.status]} ${entry.status === 'pending' ? 'animate-spin' : ''}`} />
                    <span className="text-xs text-slate-500">{formatTime(entry.timestamp)}</span>
                    <span className="text-xs text-slate-400">({formatRelativeTime(entry.timestamp)})</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 truncate">"{entry.command}"</p>
                  {entry.description && (
                    <p className="text-xs text-slate-500 mt-1">{entry.description}</p>
                  )}
                  {entry.targetFile && (
                    <p className="text-xs text-slate-400 mt-1 font-mono">→ {entry.targetFile}</p>
                  )}
                </div>
                <button
                  onClick={() => onReplay(entry.id)}
                  disabled={entry.status === 'pending'}
                  className="flex-shrink-0 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="Replay this command"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionHistory;
