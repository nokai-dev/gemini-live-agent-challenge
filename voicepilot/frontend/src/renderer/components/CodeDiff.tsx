import React from 'react';
import { FileCode, Minus, Plus } from 'lucide-react';

interface CodeDiffProps {
  before: string;
  after: string;
}

export const CodeDiff: React.FC<CodeDiffProps> = ({ before, after }) => {
  // Simple diff calculation
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  
  // Find changed lines (simplified)
  const maxLines = Math.max(beforeLines.length, afterLines.length);
  const diffLines: Array<{
    type: 'unchanged' | 'removed' | 'added';
    beforeLine?: string;
    afterLine?: string;
    lineNumber: number;
  }> = [];
  
  for (let i = 0; i < maxLines; i++) {
    const beforeLine = beforeLines[i];
    const afterLine = afterLines[i];
    
    if (beforeLine === afterLine) {
      diffLines.push({
        type: 'unchanged',
        beforeLine,
        afterLine,
        lineNumber: i + 1,
      });
    } else if (beforeLine && !afterLine) {
      diffLines.push({
        type: 'removed',
        beforeLine,
        lineNumber: i + 1,
      });
    } else if (!beforeLine && afterLine) {
      diffLines.push({
        type: 'added',
        afterLine,
        lineNumber: i + 1,
      });
    } else {
      // Modified line
      diffLines.push({
        type: 'removed',
        beforeLine,
        lineNumber: i + 1,
      });
      diffLines.push({
        type: 'added',
        afterLine,
        lineNumber: i + 1,
      });
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Code Changes</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-red-400">
            <Minus className="w-3 h-3" />
            <span>Removed</span>
          </div>
          <div className="flex items-center gap-1 text-green-400">
            <Plus className="w-3 h-3" />
            <span>Added</span>
          </div>
        </div>
      </div>

      {/* Diff Content */}
      <div className="overflow-x-auto max-h-96">
        <div className="min-w-full">
          {diffLines.map((line, index) => (
            <div
              key={index}
              className={`flex text-sm font-mono ${
                line.type === 'removed'
                  ? 'bg-red-500/10'
                  : line.type === 'added'
                  ? 'bg-green-500/10'
                  : 'bg-transparent'
              }`}
            >
              {/* Line number */}
              <div className="flex-shrink-0 w-12 px-2 py-1 text-right text-slate-500 select-none border-r border-slate-700">
                {line.lineNumber}
              </div>
              
              {/* Change indicator */}
              <div className="flex-shrink-0 w-6 px-1 py-1 text-center select-none">
                {line.type === 'removed' && (
                  <Minus className="w-3 h-3 text-red-400 mx-auto" />
                )}
                {line.type === 'added' && (
                  <Plus className="w-3 h-3 text-green-400 mx-auto" />
                )}
              </div>
              
              {/* Code content */}
              <div
                className={`flex-1 px-3 py-1 whitespace-pre ${
                  line.type === 'removed'
                    ? 'text-red-300'
                    : line.type === 'added'
                    ? 'text-green-300'
                    : 'text-slate-300'
                }`}
              >
                {line.beforeLine || line.afterLine || ' '}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};