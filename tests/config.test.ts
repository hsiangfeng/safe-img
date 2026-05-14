import { describe, it, expect, beforeEach } from 'vitest'
import {
  configure,
  getConfig,
  getCache,
  resetConfig,
  createContext,
} from '../src/config'
import { DEFAULT_CONFIG } from '../src/core/options'

beforeEach(() => {
  resetConfig()
})

describe('module-level config singleton', () => {
  it('defaults match DEFAULT_CONFIG after reset', () => {
    expect(getConfig()).toEqual(DEFAULT_CONFIG)
  })

  it('configure overrides only the specified keys', () => {
    configure({ retry: 7 })
    expect(getConfig().retry).toBe(7)
    expect(getConfig().retryDelay).toBe(DEFAULT_CONFIG.retryDelay)
  })

  it('reconfiguring cacheSize swaps the underlying cache', () => {
    const a = getCache()
    a.add('x')
    configure({ cacheSize: 50 })
    const b = getCache()
    expect(b).not.toBe(a)
    expect(b.has('x')).toBe(false)
  })

  it('reconfiguring without cacheSize keeps the same cache instance', () => {
    const a = getCache()
    a.add('keep')
    configure({ retry: 9 })
    const b = getCache()
    expect(b).toBe(a)
    expect(b.has('keep')).toBe(true)
  })

  it('resetConfig restores defaults and clears the cache', () => {
    configure({ retry: 99, cacheSize: 5 })
    getCache().add('x')
    resetConfig()
    expect(getConfig()).toEqual(DEFAULT_CONFIG)
    expect(getCache().has('x')).toBe(false)
  })
})

describe('createContext', () => {
  it('creates an isolated context independent of the singleton', () => {
    const ctx = createContext({ retry: 42 })
    expect(ctx.getConfig().retry).toBe(42)
    expect(getConfig().retry).toBe(DEFAULT_CONFIG.retry)
  })

  it('configure on context does not affect the singleton', () => {
    const ctx = createContext()
    ctx.configure({ retry: 11 })
    expect(getConfig().retry).toBe(DEFAULT_CONFIG.retry)
  })
})
