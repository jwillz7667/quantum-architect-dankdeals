// Utility functions for retry logic, timeouts, and rate limiting

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Calculate next delay with exponential backoff
      const nextDelay = Math.min(delay * backoffFactor, maxDelay);

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * nextDelay;
      const actualDelay = nextDelay + jitter;

      await sleep(actualDelay);
      delay = nextDelay;
    }
  }

  throw lastError;
}

export function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([fn(), timeout]);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rate limiter implementation
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: Array<() => void> = [];

  constructor(
    private maxTokens: number,
    private refillRate: number,
    private refillInterval: number = 1000
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.refillInterval) * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  acquire(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }

    // Wait for token to become available
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.scheduleTokenRelease();
    });
  }

  private scheduleTokenRelease(): void {
    setTimeout(() => {
      this.refill();
      if (this.tokens > 0 && this.queue.length > 0) {
        const resolve = this.queue.shift();
        if (resolve) {
          this.tokens--;
          resolve();
        }
      }
    }, this.refillInterval / this.refillRate);
  }
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private name: string,
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker '${this.name}' is open`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== undefined && Date.now() - this.lastFailureTime >= this.resetTimeout
    );
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }

  getMetrics(): Record<string, unknown> {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Batch processor for efficient operations
export class BatchProcessor<T, R> {
  private batch: Array<{ item: T; resolve: (value: R) => void; reject: (error: any) => void }> = [];
  private timer?: number;
  private processing = false;

  constructor(
    private processFn: (items: T[]) => Promise<R[]>,
    private maxBatchSize: number = 100,
    private maxWaitTime: number = 1000
  ) {}

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.batch.push({ item, resolve, reject });

      if (this.batch.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.maxWaitTime);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    if (this.batch.length === 0 || this.processing) {
      return;
    }

    this.processing = true;
    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      const items = currentBatch.map((b) => b.item);
      const results = await this.processFn(items);

      // Resolve promises with corresponding results
      currentBatch.forEach((batchItem, index) => {
        if (index < results.length) {
          batchItem.resolve(results[index]);
        } else {
          batchItem.reject(new Error('No result returned for batch item'));
        }
      });
    } catch (error) {
      // Reject all promises in the batch
      currentBatch.forEach((batchItem) => {
        batchItem.reject(error);
      });
    } finally {
      this.processing = false;
    }
  }
}
