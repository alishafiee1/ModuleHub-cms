/**
 * In-memory rate limiter for failed module unlock attempts.
 */
export class ModuleUnlockRateLimiter {
  private readonly failureMap = new Map<string, number[]>();

  constructor(
    private readonly maxFailures: number = 5,
    private readonly windowMs: number = 15 * 60 * 1000,
  ) {}

  /**
   * Record a failed unlock attempt for client key (IP + moduleId).
   */
  recordFailure(clientKey: string): void {
    const now = Date.now();
    const timestamps = this.prune(this.failureMap.get(clientKey) ?? [], now);
    timestamps.push(now);
    this.failureMap.set(clientKey, timestamps);
  }

  /**
   * Clear failures after successful unlock.
   */
  clearFailures(clientKey: string): void {
    this.failureMap.delete(clientKey);
  }

  /**
   * Whether client is blocked due to too many failures.
   */
  isBlocked(clientKey: string): boolean {
    const now = Date.now();
    const timestamps = this.prune(this.failureMap.get(clientKey) ?? [], now);
    this.failureMap.set(clientKey, timestamps);
    return timestamps.length >= this.maxFailures;
  }

  private prune(timestamps: number[], now: number): number[] {
    return timestamps.filter((timestamp) => now - timestamp < this.windowMs);
  }
}
