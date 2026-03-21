type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

function formatEntry(level: LogLevel, message: string, data?: unknown): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  if (data !== undefined) {
    entry.data = data;
  }
  return JSON.stringify(entry);
}

export const logger = {
  info(message: string, data?: unknown): void {
    console.log(formatEntry('info', message, data));
  },

  warn(message: string, data?: unknown): void {
    console.warn(formatEntry('warn', message, data));
  },

  error(message: string, data?: unknown): void {
    console.error(formatEntry('error', message, data));
  },
};
