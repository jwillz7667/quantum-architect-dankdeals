// Structured logger for edge functions
import '../_shared/deno-types.d.ts';

interface LogContext {
  correlationId?: string;
  orderId?: string;
  userId?: string;
  [key: string]: unknown;
}

export class Logger {
  public context: LogContext = {};

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  private formatMessage(level: string, message: string, extra?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...this.context,
      ...extra,
    };
    return JSON.stringify(logData);
  }

  info(message: string, extra?: Record<string, unknown>): void {
    console.log(this.formatMessage('INFO', message, extra));
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    console.warn(this.formatMessage('WARN', message, extra));
  }

  error(message: string, error?: unknown, extra?: Record<string, unknown>): void {
    const errorData =
      error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : error
          ? { error }
          : {};

    console.error(this.formatMessage('ERROR', message, { ...errorData, ...extra }));
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    if (typeof Deno !== 'undefined' && Deno.env.get('DEBUG') === 'true') {
      console.log(this.formatMessage('DEBUG', message, extra));
    }
  }

  // Create child logger with additional context
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
}

// Singleton logger instance
export const logger = new Logger();
