import { describe, it, expect } from 'vitest'
import { createCache } from '../../src/core/cache'

describe('createCache', () => {
  it('starts empty', () => {
    const c = createCache(5)
    expect(c.has('a')).toBe(false)
  })

  it('remembers added urls', () => {
    const c = createCache(5)
    c.add('a')
    expect(c.has('a')).toBe(true)
  })

  it('evicts the oldest when capacity exceeded', () => {
    const c = createCache(2)
    c.add('a')
    c.add('b')
    c.add('c')
    expect(c.has('a')).toBe(false)
    expect(c.has('b')).toBe(true)
    expect(c.has('c')).toBe(true)
  })

  it('promotes recently accessed urls (LRU)', () => {
    const c = createCache(2)
    c.add('a')
    c.add('b')
    c.has('a')
    c.add('c')
    expect(c.has('a')).toBe(true)
    expect(c.has('b')).toBe(false)
    expect(c.has('c')).toBe(true)
  })

  it('capacity 0 disables caching entirely', () => {
    const c = createCache(0)
    c.add('a')
    expect(c.has('a')).toBe(false)
  })

  it('clear empties the store', () => {
    const c = createCache(5)
    c.add('a')
    c.add('b')
    c.clear()
    expect(c.has('a')).toBe(false)
    expect(c.has('b')).toBe(false)
  })

  it('delete removes a single url', () => {
    const c = createCache(5)
    c.add('a')
    c.add('b')
    c.delete('a')
    expect(c.has('a')).toBe(false)
    expect(c.has('b')).toBe(true)
  })

  it('delete is a no-op for unknown urls', () => {
    const c = createCache(5)
    c.add('a')
    c.delete('nonexistent')
    expect(c.has('a')).toBe(true)
  })

  it('re-adding the same url resets its recency without growing size', () => {
    const c = createCache(2)
    c.add('a')
    c.add('b')
    c.add('a')
    c.add('c')
    expect(c.has('a')).toBe(true)
    expect(c.has('b')).toBe(false)
    expect(c.has('c')).toBe(true)
  })
})
