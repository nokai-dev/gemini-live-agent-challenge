/**
 * Structured Logger Utility
 * Provides JSON-formatted logging with correlation IDs
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMetadata {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  metadata?: LogMetadata;
}

class Logger {
  private static instance: Logger;
  private requestId: string | undefined;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setRequestId(id: string | undefined): void {
    this.requestId = id;
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.requestId && { requestId: this.requestId }),
      ...(metadata && Object.keys(metadata).length > 0 && { metadata }),
    };

    // Output JSON to stdout/stderr based on level
    const output = JSON.stringify(entry);
    if (level === 'error') {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, metadata);
    }
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: LogMetadata): void {
    this.log('error', message, metadata);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export for use in middleware
export const setRequestId = (id: string): void => {
  logger.setRequestId(id);
};

export const clearRequestId = (): void => {
  logger.setRequestId(undefined);
};
