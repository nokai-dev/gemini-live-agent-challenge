/**
 * Production-safe logging utility
 * Strips debug logs in production while keeping errors and warnings
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export interface Logger {
  debug: (...args: any[]) => void;
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

/**
 * Create a logger instance with context
 */
export function createLogger(context: string): Logger {
  const prefix = `[${context}]`;

  return {
    debug: (...args: any[]) => {
      if (isDevelopment) {
        console.debug(prefix, ...args);
      }
    },

    log: (...args: any[]) => {
      if (isDevelopment) {
        console.log(prefix, ...args);
      }
    },

    info: (...args: any[]) => {
      // Always log info, but in production could send to analytics
      console.info(prefix, ...args);
    },

    warn: (...args: any[]) => {
      console.warn(prefix, ...args);
      // In production, could send to error tracking
    },

    error: (...args: any[]) => {
      console.error(prefix, ...args);
      // Always send errors to error tracking in production
      if (!isDevelopment && typeof window !== 'undefined' && (window as any).Sentry) {
        const error = args.find(arg => arg instanceof Error) || new Error(String(args[0]));
        (window as any).Sentry.captureException(error, {
          extra: { context, args },
        });
      }
    },
  };
}

/**
 * Default logger instance
 */
export const logger = createLogger('VoicePilot');

export default logger;