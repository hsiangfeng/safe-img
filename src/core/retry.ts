/** After `attempt` failures, should we try again? Pass 1 on the first failure. */
export function shouldRetry(attempt: number, max: number): boolean {
  return attempt <= max
}
