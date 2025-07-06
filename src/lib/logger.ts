import { env } from './env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  context?: Record<string, any>;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: LogContext;
}

class Logger {
  private isDevelopment = env.VITE_ENV === 'development';
  private isProduction = env.VITE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    // In development, log everything
    return true;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // Clone to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(data));

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'ssn'];

    const removeSensitive = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      Object.keys(obj).forEach((key) => {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          removeSensitive(obj[key]);
        }
      });
    };

    removeSensitive(sanitized);
    return sanitized;
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return;

    const sanitizedContext = this.sanitizeData(context);
    console.log(this.formatMessage('debug', message, sanitizedContext));
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return;

    const sanitizedContext = this.sanitizeData(context);
    console.info(this.formatMessage('info', message, sanitizedContext));
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return;

    const sanitizedContext = this.sanitizeData(context);
    console.warn(this.formatMessage('warn', message, sanitizedContext));

    // Send to monitoring service in production
    if (this.isProduction && window.Sentry) {
      window.Sentry.captureMessage(message, 'warning');
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (!this.shouldLog('error')) return;

    const sanitizedContext = this.sanitizeData(context);
    console.error(this.formatMessage('error', message, sanitizedContext), error);

    // Send to monitoring service in production
    if (this.isProduction && window.Sentry) {
      window.Sentry.captureException(error || new Error(message), {
        extra: sanitizedContext,
      });
    }
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext) {
    const message = `Performance: ${operation} took ${duration}ms`;

    if (duration > 1000) {
      this.warn(message, { ...context, duration, operation });
    } else if (this.isDevelopment) {
      this.debug(message, { ...context, duration, operation });
    }
  }

  // Security event logging
  security(event: string, context?: LogContext) {
    const message = `Security Event: ${event}`;
    this.warn(message, { ...context, securityEvent: event });
  }

  // Audit logging for compliance
  audit(action: string, userId: string, details?: Record<string, any>) {
    const message = `Audit: ${action}`;
    this.info(message, {
      userId,
      action,
      metadata: this.sanitizeData(details),
      timestamp: Date.now(),
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Type augmentation for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
      captureMessage: (message: string, level?: string) => void;
    };
  }
}
