type LogMeta = Record<string, unknown> | undefined;

const stringifyMeta = (meta?: LogMeta) => {
  if (!meta) return '';

  try {
    return JSON.stringify(meta);
  } catch {
    return '[unserializable-meta]';
  }
};

const baseLog = (
  level: 'log' | 'warn' | 'error',
  message: string,
  meta?: LogMeta,
) => {
  const payload = stringifyMeta(meta);
  const finalMessage = payload ? `${message} ${payload}` : message;

  if (__DEV__) {
    console[level](finalMessage);
  }
};

export const logger = {
  debug: (message: string, meta?: LogMeta) => {
    if (__DEV__) {
      baseLog('log', `[DEBUG] ${message}`, meta);
    }
  },
  info: (message: string, meta?: LogMeta) => {
    baseLog('log', `[INFO] ${message}`, meta);
  },
  warn: (message: string, meta?: LogMeta) => {
    baseLog('warn', `[WARN] ${message}`, meta);
  },
  error: (message: string, meta?: LogMeta) => {
    baseLog('error', `[ERROR] ${message}`, meta);
  },
};
