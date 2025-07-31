import pino from 'pino';

// Create logger configuration based on environment
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Base configuration
  const baseConfig: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    base: {
      pid: false, // Remove process ID for cleaner logs
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // Development configuration - pretty print
  if (isDevelopment) {
    return pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'hostname',
          singleLine: false,
          messageFormat: '{emoji} {msg}',
        },
      },
    });
  }

  // Production configuration - structured JSON
  if (isProduction) {
    return pino({
      ...baseConfig,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'apiKey'],
        censor: '[REDACTED]',
      },
    });
  }

  // Default configuration
  return pino(baseConfig);
};

// Create and export the logger instance
export const logger = createLogger();

// Utility functions for common logging patterns
export const loggers = {
  // API endpoint logging
  api: {
    start: (endpoint: string, method: string) =>
      logger.info({ endpoint, method, emoji: '🚀' }, `API ${method} ${endpoint} - Starting`),
    success: (endpoint: string, method: string, duration?: number) =>
      logger.info({ endpoint, method, duration, emoji: '✅' }, `API ${method} ${endpoint} - Success`),
    error: (endpoint: string, method: string, error: unknown, duration?: number) =>
      logger.error({ endpoint, method, error, duration, emoji: '❌' }, `API ${method} ${endpoint} - Error`),
  },

  // File processing logging
  file: {
    received: (filename: string, size: number, type: string) =>
      logger.info({ filename, size, type, emoji: '📁' }, `File received: ${filename}`),
    validated: (filename: string, type: string) =>
      logger.info({ filename, type, emoji: '✅' }, `File validated: ${type}`),
    processing: (filename: string) =>
      logger.info({ filename, emoji: '⚙️' }, `Processing file: ${filename}`),
    processed: (filename: string, duration?: number) =>
      logger.info({ filename, duration, emoji: '🎉' }, `File processed: ${filename}`),
    error: (filename: string, error: unknown) =>
      logger.error({ filename, error, emoji: '💥' }, `File processing error: ${filename}`),
  },

  // AI/API integration logging
  ai: {
    request: (model: string, inputSize?: number) =>
      logger.info({ model, inputSize, emoji: '🤖' }, `AI request to ${model}`),
    response: (model: string, outputSize?: number, duration?: number) =>
      logger.info({ model, outputSize, duration, emoji: '🧠' }, `AI response from ${model}`),
    timeout: (model: string, duration: number) =>
      logger.warn({ model, duration, emoji: '⏰' }, `AI request timeout: ${model}`),
    error: (model: string, error: unknown) =>
      logger.error({ model, error, emoji: '🚨' }, `AI request error: ${model}`),
  },

  // Performance logging
  perf: {
    start: (operation: string) => {
      const start = Date.now();
      return {
        end: () => {
          const duration = Date.now() - start;
          logger.debug({ operation, duration, emoji: '⏱️' }, `Operation completed: ${operation}`);
          return duration;
        },
      };
    },
  },

  // Security logging
  security: {
    unauthorized: (ip?: string, userAgent?: string) =>
      logger.warn({ ip, userAgent, emoji: '🔒' }, 'Unauthorized access attempt'),
    rateLimited: (ip?: string) =>
      logger.warn({ ip, emoji: '🚦' }, 'Rate limit exceeded'),
    suspiciousActivity: (activity: string, details?: object) =>
      logger.warn({ activity, details, emoji: '🚨' }, `Suspicious activity: ${activity}`),
  },
};

// Export specific log levels for convenience
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  fatal: logger.fatal.bind(logger),
};