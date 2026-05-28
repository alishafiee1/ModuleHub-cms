/** Rolling restart attempt timestamps per module */
const restartAttemptsByModule = new Map<string, number[]>();

/**
 * Records an automatic restart attempt for rate limiting.
 * @param moduleId - Module identifier
 * @param timestampMs - Attempt time in epoch ms
 */
export function recordAutoRestartAttempt(moduleId: string, timestampMs: number): void {
  const attempts = restartAttemptsByModule.get(moduleId) ?? [];
  attempts.push(timestampMs);
  restartAttemptsByModule.set(moduleId, attempts);
}

/**
 * Prunes attempts older than one hour from the rolling window.
 * @param attempts - Attempt timestamps
 * @param nowMs - Current time in epoch ms
 * @returns Attempts within the last hour
 */
export function pruneAttemptsWithinHour(attempts: number[], nowMs: number): number[] {
  const oneHourMs = 60 * 60 * 1000;
  return attempts.filter((timestamp) => nowMs - timestamp < oneHourMs);
}

/**
 * Returns whether another auto-restart is allowed within the hourly limit.
 * @param moduleId - Module identifier
 * @param maxAttemptsPerHour - Limit from system settings
 * @param nowMs - Current time in epoch ms
 * @returns True when restart is allowed
 */
export function canAutoRestartModule(
  moduleId: string,
  maxAttemptsPerHour: number,
  nowMs: number,
): boolean {
  const attempts = restartAttemptsByModule.get(moduleId) ?? [];
  const recent = pruneAttemptsWithinHour(attempts, nowMs);
  restartAttemptsByModule.set(moduleId, recent);
  return recent.length < maxAttemptsPerHour;
}

/**
 * Clears restart attempt history (tests only).
 */
export function clearAutoRestartAttemptsForTests(): void {
  restartAttemptsByModule.clear();
}
