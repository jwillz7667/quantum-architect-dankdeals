// src/lib/api/client.ts
import { z } from 'zod';
import { logger } from '../logger';

// Security headers configuration
interface SecurityHeaders {
  'Content-Type': string;
  'X-Client-Version': string;
  'X-Timestamp': string;
  'X-Request-ID': string;
  [key: string]: string;
}

// API Request configuration
interface APIRequestConfig<T = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
}

// API Response type
interface APIResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

// Error types
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Production-ready API client with security, validation, and error handling
 */
export class APIClient {
  private baseURL: string;
  private defaultTimeout: number = 10000;
  private maxRetries: number = 3;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  /**
   * Generate security headers for requests
   */
  private generateSecurityHeaders(): SecurityHeaders {
    const timestamp = Date.now().toString();
    const requestId = crypto.randomUUID();

    return {
      'Content-Type': 'application/json',
      'X-Client-Version': (import.meta.env['VITE_APP_VERSION'] as string) || '1.0.0',
      'X-Timestamp': timestamp,
      'X-Request-ID': requestId,
    };
  }

  /**
   * Process request configuration and merge with defaults
   */
  private processConfig<T>(config: APIRequestConfig<T> = {}): Required<APIRequestConfig<T>> {
    const securityHeaders = this.generateSecurityHeaders();

    return {
      method: config.method || 'GET',
      headers: {
        ...securityHeaders,
        ...(config.headers || {}),
      },
      body: config.body,
      params: config.params,
      timeout: config.timeout || this.defaultTimeout,
      retries: config.retries || this.maxRetries,
      schema: config.schema || z.any(),
      signal: config.signal || new AbortController().signal,
    };
  }

  /**
   * Parse and validate API response
   */
  private async parseResponse<T>(response: Response, schema?: z.ZodType<T>): Promise<T> {
    let data: unknown;

    try {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      } else {
        data = null;
      }
    } catch (error) {
      throw new APIError('Invalid JSON response', response.status, 'PARSE_ERROR', {
        originalError: error,
      });
    }

    // Validate response data if schema provided
    if (schema && schema !== z.any()) {
      try {
        return schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError('Response validation failed', error.issues);
        }
        throw error;
      }
    }

    return data as T;
  }

  /**
   * Execute HTTP request with retries and error handling
   */
  private async executeRequest<T>(
    url: string,
    config: Required<APIRequestConfig<T>>
  ): Promise<APIResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        const timeoutSignal = AbortSignal.timeout(config.timeout);
        const combinedSignal = AbortSignal.any([config.signal, timeoutSignal]);

        const fetchOptions: RequestInit = {
          method: config.method,
          headers: config.headers,
          signal: combinedSignal,
        };

        // Add body for non-GET requests
        if (config.method !== 'GET' && config.body !== undefined) {
          fetchOptions.body =
            typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
        }

        const response = await fetch(url, fetchOptions);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await this.parseResponse(response);
          const errorMessage =
            (errorData as { message?: string })?.message || `HTTP ${response.status}`;
          const errorCode = (errorData as { code?: string })?.code;

          throw new APIError(errorMessage, response.status, errorCode, errorData);
        }

        // Parse successful response
        const data = await this.parseResponse<T>(response, config.schema);

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry for certain errors
        if (
          error instanceof ValidationError ||
          (error instanceof APIError && error.status >= 400 && error.status < 500)
        ) {
          throw error;
        }

        // Log retry attempts
        if (attempt < config.retries) {
          logger.warn(`Request failed, retrying (${attempt + 1}/${config.retries})`, {
            url,
            error: lastError.message,
          });

          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries exhausted
    throw lastError || new APIError('Request failed', 0, 'UNKNOWN_ERROR');
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    config: Omit<APIRequestConfig<T>, 'method' | 'body'> = {}
  ): Promise<T> {
    let url = `${this.baseURL}${endpoint}`;

    // Add query parameters if provided
    if (config.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Only convert primitive values to string
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            searchParams.append(key, String(value));
          } else {
            // For objects/arrays, serialize as JSON
            searchParams.append(key, JSON.stringify(value));
          }
        }
      });
      if (searchParams.size > 0) {
        url += `?${searchParams.toString()}`;
      }
    }

    const processedConfig = this.processConfig({ ...config, method: 'GET' });
    const response = await this.executeRequest(url, processedConfig);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    config: Omit<APIRequestConfig<T>, 'method'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const processedConfig = this.processConfig({
      ...config,
      method: 'POST',
      body: data,
    });
    const response = await this.executeRequest(url, processedConfig);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    config: Omit<APIRequestConfig<T>, 'method'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const processedConfig = this.processConfig({
      ...config,
      method: 'PUT',
      body: data,
    });
    const response = await this.executeRequest(url, processedConfig);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    config: Omit<APIRequestConfig<T>, 'method' | 'body'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const processedConfig = this.processConfig({ ...config, method: 'DELETE' });
    const response = await this.executeRequest(url, processedConfig);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    config: Omit<APIRequestConfig<T>, 'method'> = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const processedConfig = this.processConfig({
      ...config,
      method: 'PATCH',
      body: data,
    });
    const response = await this.executeRequest(url, processedConfig);
    return response.data;
  }
}

// Export configured client instance
const apiClient = new APIClient((import.meta.env['VITE_SUPABASE_URL'] as string) || '');

export { apiClient, APIError, ValidationError };
export type { APIRequestConfig, APIResponse };
