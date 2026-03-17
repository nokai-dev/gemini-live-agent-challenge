import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, FileX, ServerOff, ShieldAlert } from 'lucide-react';

export type ErrorType = 'network' | 'validation' | 'server' | 'file' | 'unknown';

export interface ErrorDisplayProps {
  error: string | null;
  errorType?: ErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
  showIcon?: boolean;
  className?: string;
}

/**
 * Determine error type from error message
 */
export function getErrorType(error: string): ErrorType {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('offline') || lowerError.includes('connection')) {
    return 'network';
  }
  if (lowerError.includes('validation') || lowerError.includes('invalid') || lowerError.includes('not allowed') || lowerError.includes('security')) {
    return 'validation';
  }
  if (lowerError.includes('server') || lowerError.includes('backend') || lowerError.includes('500') || lowerError.includes('503')) {
    return 'server';
  }
  if (lowerError.includes('file') || lowerError.includes('not found') || lowerError.includes('path')) {
    return 'file';
  }
  return 'unknown';
}

/**
 * Get user-friendly error message
 */
export function getFriendlyErrorMessage(error: string, type: ErrorType): string {
  switch (type) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'validation':
      return 'The request could not be processed due to invalid input. Please check your input and try again.';
    case 'server':
      return 'The server encountered an error. Please try again in a moment.';
    case 'file':
      return 'There was a problem accessing the file. Please ensure the file exists and try again.';
    default:
      return error || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Get icon for error type
 */
function getErrorIcon(type: ErrorType) {
  switch (type) {
    case 'network':
      return <WifiOff className="w-5 h-5 text-red-500" />;
    case 'validation':
      return <ShieldAlert className="w-5 h-5 text-orange-500" />;
    case 'server':
      return <ServerOff className="w-5 h-5 text-red-500" />;
    case 'file':
      return <FileX className="w-5 h-5 text-red-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-red-500" />;
  }
}

/**
 * Get background color for error type
 */
function getErrorBackground(type: ErrorType): string {
  switch (type) {
    case 'network':
      return 'bg-red-50 border-red-200';
    case 'validation':
      return 'bg-orange-50 border-orange-200';
    case 'server':
      return 'bg-red-50 border-red-200';
    case 'file':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-slate-50 border-slate-200';
  }
}

/**
 * Get text color for error type
 */
function getErrorTextColor(type: ErrorType): string {
  switch (type) {
    case 'network':
      return 'text-red-800';
    case 'validation':
      return 'text-orange-800';
    case 'server':
      return 'text-red-800';
    case 'file':
      return 'text-red-800';
    default:
      return 'text-slate-800';
  }
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorType = 'unknown',
  onRetry,
  onDismiss,
  showIcon = true,
  className = '',
}) => {
  if (!error) return null;

  const type = errorType || getErrorType(error);
  const friendlyMessage = getFriendlyErrorMessage(error, type);
  const Icon = () => getErrorIcon(type);
  const bgColor = getErrorBackground(type);
  const textColor = getErrorTextColor(type);

  return (
    <div className={`rounded-xl border p-4 ${bgColor} ${className}`}>
      <div className="flex items-start gap-3">
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            <Icon />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textColor}`}>
            {friendlyMessage}
          </p>
          
          {/* Show technical details in smaller text */}
          <p className="text-xs text-slate-500 mt-1 break-words">
            {error}
          </p>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-sm"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline error message for form inputs
 */
export const InlineError: React.FC<{
  message: string;
}> = ({ message }) => {
  return (
    <div className="flex items-center gap-1.5 text-red-600 text-xs mt-1">
      <AlertCircle className="w-3 h-3" />
      <span>{message}</span>
    </div>
  );
};

/**
 * Error boundary fallback component
 */
export const ErrorFallback: React.FC<{
  error: Error;
  resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        
        <h2 className="text-lg font-semibold text-slate-800 text-center mb-2">
          Something went wrong
        </h2>
        
        <p className="text-sm text-slate-600 text-center mb-4">
          {getFriendlyErrorMessage(error.message, getErrorType(error.message))}
        </p>
        
        <div className="bg-slate-50 rounded-lg p-3 mb-4 overflow-auto">
          <code className="text-xs text-slate-500 break-words">
            {error.message}
          </code>
        </div>
        
        <button
          onClick={resetErrorBoundary}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
