import React, { useState, useEffect } from 'react';
import { Terminal, Clock } from 'lucide-react';

interface Command {
  command: string;
  timestamp: Date;
}

interface CommandLogProps {
  commands: Command[];
}

/**
 * Typing animation for command text
 * Shows text appearing character by character for demo polish
 */
const useTypingAnimation = (text: string, speed: number = 30) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isTyping };
};

const AnimatedCommand: React.FC<{ command: Command; isNew?: boolean }> = ({ command, isNew }) => {
  const { displayedText, isTyping } = useTypingAnimation(command.command, 25);

  return (
    <div className={`flex items-start gap-2 p-2 bg-gray-700/50 rounded transition-all duration-200 ${isNew ? 'ring-2 ring-blue-400/50' : ''}`}>
      <Clock size={14} className="text-gray-500 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm font-mono">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-blue-400 ml-0.5 animate-pulse" />
          )}
        </div>
        <div className="text-xs text-gray-500">
          {command.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

const CommandLog: React.FC<CommandLogProps> = ({ commands }) => {
  const [newestIndex, setNewestIndex] = useState<number | null>(null);

  useEffect(() => {
    if (commands.length > 0) {
      setNewestIndex(commands.length - 1);
      // Clear highlight after animation
      const timer = setTimeout(() => setNewestIndex(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [commands.length]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Terminal size={20} className="text-gray-400" />
        <span className="font-medium">Command Log</span>
        <span className="text-xs text-gray-500 ml-auto">{commands.length} commands</span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {commands.length === 0 ? (
          <div className="text-gray-500 text-sm italic">
            No commands yet. Start a session to begin.
          </div>
        ) : (
          commands.map((cmd, index) => (
            <AnimatedCommand
              key={index}
              command={cmd}
              isNew={index === newestIndex}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommandLog;