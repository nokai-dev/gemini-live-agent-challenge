import React, { useState } from 'react';
import { History, Play, Trash2, X, ChevronDown, ChevronUp, Download, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { SessionEntry } from '../hooks/useSessionStorage';

interface SessionHistoryProps {
  entries: SessionEntry[];
  onReplay: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onExport: () => string;
  onImport: (json: string) => boolean;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  entries,
  onReplay,
  onDelete,
  onClear,
  onExport,
  onImport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: SessionEntry['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicepilot-sessions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (onImport(content)) {
          alert('Sessions imported successfully!');
        } else {
          alert('Failed to import sessions. Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = ''; // Reset input
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-slate-700 hover:text-slate-900"
      >
        <History className="w-5 h-5" />
        <span className="font-medium">Session History</span>
        {entries.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            {entries.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-800">Session History</h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
            {entries.length}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50">
        <button
          onClick={handleExport}
          disabled={entries.length === 0}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
        <label className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors cursor-pointer">
          <Upload className="w-3 h-3" />
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
        {entries.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="ml-auto flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No sessions yet</p>
            <p className="text-xs mt-1">Your command history will appear here</p>
          </div>
        ) : (
          [...entries].reverse().map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border transition-all duration-200 ${
                expandedId === entry.id
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className="flex items-center gap-2 p-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                {getStatusIcon(entry.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    "{entry.command}"
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatTimestamp(entry.timestamp)}
                    {entry.targetFile && ` • ${entry.targetFile}`}
                  </p>
                </div>
                {expandedId === entry.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {expandedId === entry.id && (
                <div className="px-3 pb-3 border-t border-slate-100">
                  {entry.description && (
                    <p className="text-xs text-slate-600 mt-2">
                      <span className="font-medium">Change:</span> {entry.description}
                    </p>
                  )}
                  {entry.error && (
                    <p className="text-xs text-red-600 mt-2">
                      <span className="font-medium">Error:</span> {entry.error}
                    </p>
                  )}
                  {entry.screenshot && entry.screenshot !== 'mock' && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 mb-1">Screenshot:</p>
                      <img
                        src={entry.screenshot}
                        alt="Session screenshot"
                        className="w-full h-24 object-cover rounded border border-slate-200"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {entry.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplay(entry.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Replay
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(entry.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showConfirmClear && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 max-w-xs">
            <h4 className="font-semibold text-slate-800 mb-2">Clear History?</h4>
            <p className="text-sm text-slate-600 mb-4">
              This will permanently delete all {entries.length} session entries.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClear();
                  setShowConfirmClear(false);
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
