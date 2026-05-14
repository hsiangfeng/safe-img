import { describe, it, expect } from 'vitest'
import { shouldRetry } from '../../src/core/retry'

describe('shouldRetry', () => {
  it('allows retrying within max', () => {
    expect(shouldRetry(1, 2)).toBe(true)
    expect(shouldRetry(2, 2)).toBe(true)
  })

  it('stops when attempt exceeds max', () => {
    expect(shouldRetry(3, 2)).toBe(false)
  })

  it('returns false when max is 0', () => {
    expect(shouldRetry(1, 0)).toBe(false)
  })
})
