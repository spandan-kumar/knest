// Simple console-based logger
const getTimestamp = () => new Date().toISOString();

const formatMessage = (level: string, emoji: string, message: string, data?: any) => {
  const timestamp = getTimestamp();
  const prefix = `[${timestamp}] ${emoji} ${level.toUpperCase()}:`;
  
  if (data && Object.keys(data).length > 0) {
    return `${prefix} ${message} - ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
};

// Simple logger implementation
const simpleLogger = {
  debug: (data: any, message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage('debug', '🔍', message, data));
    }
  },
  info: (data: any, message: string) => {
    console.log(formatMessage('info', 'ℹ️', message, data));
  },
  warn: (data: any, message: string) => {
    console.warn(formatMessage('warn', '⚠️', message, data));
  },
  error: (data: any, message: string) => {
    console.error(formatMessage('error', '❌', message, data));
  },
  fatal: (data: any, message: string) => {
    console.error(formatMessage('fatal', '💀', message, data));
  }
};

export const logger = simpleLogger;

// Utility functions for common logging patterns
export const loggers = {
  // API endpoint logging
  api: {
    start: (endpoint: string, method: string) =>
      logger.info({ endpoint, method }, `🚀 API ${method} ${endpoint} - Starting`),
    success: (endpoint: string, method: string, duration?: number) =>
      logger.info({ endpoint, method, duration }, `✅ API ${method} ${endpoint} - Success`),
    error: (endpoint: string, method: string, error: unknown, duration?: number) =>
      logger.error({ endpoint, method, error, duration }, `❌ API ${method} ${endpoint} - Error`),
  },

  // File processing logging
  file: {
    received: (filename: string, size: number, type: string) =>
      logger.info({ filename, size, type }, `📁 File received: ${filename}`),
    validated: (filename: string, type: string) =>
      logger.info({ filename, type }, `✅ File validated: ${type}`),
    processing: (filename: string) =>
      logger.info({ filename }, `⚙️ Processing file: ${filename}`),
    processed: (filename: string, duration?: number) =>
      logger.info({ filename, duration }, `🎉 File processed: ${filename}`),
    error: (filename: string, error: unknown) =>
      logger.error({ filename, error }, `💥 File processing error: ${filename}`),
    compressionStart: (originalSize: number) =>
      logger.info({ originalSize }, `🗜️ Starting audio compression`),
    compressionComplete: (stats: any) =>
      logger.info(stats, `✅ Audio compression complete`),
    compressionFailed: (error: unknown) =>
      logger.error({ error }, `❌ Audio compression failed`),
  },

  // AI/API integration logging
  ai: {
    request: (model: string, inputSize?: number) =>
      logger.info({ model, inputSize }, `🤖 AI request to ${model}`),
    response: (model: string, outputSize?: number, duration?: number) =>
      logger.info({ model, outputSize, duration }, `🧠 AI response from ${model}`),
    timeout: (model: string, duration: number) =>
      logger.warn({ model, duration }, `⏰ AI request timeout: ${model}`),
    error: (model: string, error: unknown) =>
      logger.error({ model, error }, `🚨 AI request error: ${model}`),
  },

  // Performance logging
  perf: {
    start: (operation: string) => {
      const start = Date.now();
      return {
        end: () => {
          const duration = Date.now() - start;
          logger.debug({ operation, duration }, `⏱️ Operation completed: ${operation}`);
          return duration;
        },
      };
    },
  },

  // Security logging
  security: {
    unauthorized: (ip?: string, userAgent?: string) =>
      logger.warn({ ip, userAgent }, '🔒 Unauthorized access attempt'),
    rateLimited: (ip?: string) =>
      logger.warn({ ip }, '🚦 Rate limit exceeded'),
    suspiciousActivity: (activity: string, details?: object) =>
      logger.warn({ activity, details }, `🚨 Suspicious activity: ${activity}`),
  },
};

// Export specific log levels for convenience
export const log = {
  debug: (data: any, message: string) => logger.debug(data, message),
  info: (data: any, message: string) => logger.info(data, message),
  warn: (data: any, message: string) => logger.warn(data, message),
  error: (data: any, message: string) => logger.error(data, message),
  fatal: (data: any, message: string) => logger.fatal(data, message),
};