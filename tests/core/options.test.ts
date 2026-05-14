import { describe, it, expect } from 'vitest'
import { mergeConfig, DEFAULT_CONFIG } from '../../src/core/options'

describe('mergeConfig', () => {
  it('returns defaults when nothing passed', () => {
    expect(mergeConfig()).toEqual(DEFAULT_CONFIG)
  })

  it('overrides only the specified fields', () => {
    const result = mergeConfig({ retry: 5 })
    expect(result.retry).toBe(5)
    expect(result.retryDelay).toBe(DEFAULT_CONFIG.retryDelay)
    expect(result.cacheSize).toBe(DEFAULT_CONFIG.cacheSize)
  })

  it('does not mutate the input', () => {
    const user = { retry: 5 }
    mergeConfig(user)
    expect(user).toEqual({ retry: 5 })
  })

  it('does not mutate the defaults', () => {
    const snapshot = { ...DEFAULT_CONFIG }
    mergeConfig({ retry: 99 })
    expect(DEFAULT_CONFIG).toEqual(snapshot)
  })
})
