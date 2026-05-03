export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold: number;   // Failures before opening
  successThreshold: number;   // Successes in half-open to close
  timeoutMs: number;          // Time in OPEN state before trying HALF_OPEN
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  totalCalls: number;
  totalFailures: number;
}

/**
 * Enterprise circuit breaker for external API calls (Groq, NVIDIA, etc).
 * Prevents cascade failures when AI provider is down or rate-limited.
 */
export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private totalCalls = 0;
  private totalFailures = 0;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {
      failureThreshold: 5,
      successThreshold: 2,
      timeoutMs: 30000,
    }
  ) {}

  get metrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
    };
  }

  private get now(): number {
    return Date.now();
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      console.warn(`[CircuitBreaker:${this.name}] ${this.state} → ${newState}`);
      this.state = newState;
    }
  }

  private shouldAttemptReset(): boolean {
    if (this.lastFailureTime === null) return true;
    return this.now - this.lastFailureTime >= this.options.timeoutMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.transitionTo("HALF_OPEN");
        this.failures = 0;
        this.successes = 0;
      } else {
        this.totalFailures++;
        throw new Error(
          `Circuit breaker [${this.name}] is OPEN. Retry after ${Math.ceil(
            (this.options.timeoutMs - (this.now - (this.lastFailureTime || 0))) / 1000
          )}s`
        );
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

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === "HALF_OPEN") {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo("CLOSED");
        this.successes = 0;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = this.now;
    this.totalFailures++;

    if (this.state === "HALF_OPEN") {
      this.transitionTo("OPEN");
      this.successes = 0;
      return;
    }

    if (this.failures >= this.options.failureThreshold) {
      this.transitionTo("OPEN");
    }
  }

  /**
   * Force the circuit into a specific state (useful for testing/admin).
   */
  forceState(state: CircuitState): void {
    this.state = state;
    this.failures = 0;
    this.successes = 0;
    if (state === "CLOSED") {
      this.lastFailureTime = null;
    }
    console.warn(`[CircuitBreaker:${this.name}] Forced to ${state}`);
  }
}
