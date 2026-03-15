import React from 'react';
import { Terminal, Clock } from 'lucide-react';

interface Command {
  command: string;
  timestamp: Date;
}

interface CommandLogProps {
  commands: Command[];
}

const CommandLog: React.FC<CommandLogProps> = ({ commands }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Terminal size={20} className="text-gray-400" />
        <span className="font-medium">Command Log</span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {commands.length === 0 ? (
          <div className="text-gray-500 text-sm italic">
            No commands yet. Start a session to begin.
          </div>
        ) : (
          commands.map((cmd, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-gray-700/50 rounded">
              <Clock size={14} className="text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm">{cmd.command}</div>
                <div className="text-xs text-gray-500">
                  {cmd.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommandLog;