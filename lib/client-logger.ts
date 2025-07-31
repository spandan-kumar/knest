// Client-side logger utility
// Note: Pino doesn't work well in browser environments, so we create a simplified logger

interface LogContext {
  [key: string]: any;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, context?: LogContext, emoji?: string) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const timestamp = new Date().toISOString();
    const prefix = emoji ? `${emoji} ` : '';
    
    if (context && Object.keys(context).length > 0) {
      console[level](`[${timestamp}] ${prefix}${message}`, context);
    } else {
      console[level](`[${timestamp}] ${prefix}${message}`);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context, '🔍');
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context, 'ℹ️');
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context, '⚠️');
  }

  error(message: string, context?: LogContext) {
    // Enhance error context with additional debugging info
    const enhancedContext = {
      ...context,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };
    this.log('error', message, enhancedContext, '❌');
  }
}

export const clientLogger = new ClientLogger();

// Specific loggers for common client-side operations
export const clientLoggers = {
  // File handling
  file: {
    selected: (filename: string, size: number, type: string) =>
      clientLogger.info(`File selected: ${filename}`, { size, type, emoji: '📁' }),
    compressionStart: (originalSize: number) =>
      clientLogger.info('Starting audio compression', { originalSize, emoji: '🗜️' }),
    compressionComplete: (result: { originalSize: number; compressedSize: number; compressionRatio: number }) =>
      clientLogger.info('Audio compression completed', { ...result, emoji: '✅' }),
    compressionFailed: (error: unknown) =>
      clientLogger.warn('Audio compression failed, using original file', { error, emoji: '⚠️' }),
    upload: (filename: string, size: number) =>
      clientLogger.info(`Uploading file: ${filename}`, { size, emoji: '⬆️' }),
  },

  // Recording
  recording: {
    start: () => clientLogger.info('Recording started', { emoji: '🎙️' }),
    stop: () => clientLogger.info('Recording stopped', { emoji: '⏹️' }),
    error: (error: unknown) => clientLogger.error('Recording error', { error }),
  },

  // API calls
  api: {
    request: (endpoint: string, method: string) =>
      clientLogger.info(`API ${method} ${endpoint}`, { emoji: '📡' }),
    success: (endpoint: string, method: string, duration?: number) =>
      clientLogger.info(`API ${method} ${endpoint} - Success`, { duration, emoji: '✅' }),
    error: (endpoint: string, method: string, error: unknown) =>
      clientLogger.error(`API ${method} ${endpoint} - Error`, { error }),
  },

  // UI actions
  ui: {
    download: (filename: string) =>
      clientLogger.info(`Downloading file: ${filename}`, { emoji: '⬇️' }),
    downloadError: (error: unknown) =>
      clientLogger.error('Download failed', { error }),
  },
};