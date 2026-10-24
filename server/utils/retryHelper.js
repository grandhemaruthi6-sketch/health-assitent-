/**
 * Exponential backoff retry utility for network and rate-limited calls
 */

export async function withRetry(
  operation,
  {
    maxRetries = 3,
    initialDelayMs = 500,
    maxDelayMs = 4000,
    backoffFactor = 2,
    shouldRetry = (err) => true
  } = {}
) {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await operation(attempt);
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || !shouldRetry(err)) {
        throw err;
      }

      // Add jitter (±20%)
      const jitter = (Math.random() - 0.5) * 0.4 * delay;
      const sleepTime = Math.min(maxDelayMs, Math.max(100, delay + jitter));

      await new Promise((resolve) => setTimeout(resolve, sleepTime));
      delay = Math.min(maxDelayMs, delay * backoffFactor);
    }
  }
}
