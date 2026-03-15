import React from 'react';
import { Mic, Monitor, Loader2, CheckCircle, Circle } from 'lucide-react';

type AppStatus = 'idle' | 'capturing' | 'recording' | 'processing' | 'ready' | 'applied';

interface StatusIndicatorProps {
  status: AppStatus;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const statusConfig = {
    idle: {
      icon: Circle,
      text: 'Ready',
      color: 'text-slate-500',
      bgColor: 'bg-slate-100',
    },
    capturing: {
      icon: Monitor,
      text: 'Capturing Screen...',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    recording: {
      icon: Mic,
      text: 'Recording Voice...',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    processing: {
      icon: Loader2,
      text: 'Processing...',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    ready: {
      icon: CheckCircle,
      text: 'Ready to Apply',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    applied: {
      icon: CheckCircle,
      text: 'Changes Applied!',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
      <Icon className={`w-4 h-4 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
};