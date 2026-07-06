import pino from 'pino';

const isBrowser = typeof globalThis.window !== 'undefined';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development' && !isBrowser
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

export const sanitizeContext = (context: any) => {
  if (!context) return context;
  const sanitized = { ...context };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'email'];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeContext(sanitized[key]);
    }
  }
  return sanitized;
};

export const logToDatabase = async (supabase: any, error: Error, context?: any) => {
  logger.error(error.message);
  try {
    const { error: dbError } = await supabase.from('system_logs').insert({
      level: 'error',
      message: error.message,
      stack_trace: error.stack,
      context: sanitizeContext(context),
    });
    if (dbError) throw dbError;
  } catch (e) {
    console.error(
      'CRITICAL: Failed to log error to Supabase system_logs',
      e instanceof Error ? e.message : e
    );
  }
};
