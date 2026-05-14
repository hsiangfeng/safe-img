import { describe, it, expect } from 'vitest'
import { resolveSource } from '../../src/core/resolve'
import { DEFAULT_CONFIG } from '../../src/core/options'

const globals = { ...DEFAULT_CONFIG, defaultSrc: '/global.png' }

describe('resolveSource', () => {
  it('expands a bare src into the full chain', () => {
    const r = resolveSource({ src: 'cover.jpg' }, globals)
    expect(r.src).toBe('cover.jpg')
    expect(r.fallbacks).toEqual(['/global.png'])
    expect(r.retry).toBe(globals.retry)
  })

  it('appends globals.defaultSrc after user fallbacks', () => {
    const r = resolveSource(
      { src: 'a.jpg', fallback: ['/b.jpg', '/c.jpg'] },
      globals,
    )
    expect(r.fallbacks).toEqual(['/b.jpg', '/c.jpg', '/global.png'])
  })

  it('lifts a single fallback string into an array', () => {
    const r = resolveSource({ src: 'a.jpg', fallback: '/b.jpg' }, globals)
    expect(r.fallbacks).toEqual(['/b.jpg', '/global.png'])
  })

  it('per-instance retry overrides global', () => {
    const r = resolveSource({ src: 'a.jpg', retry: 0 }, globals)
    expect(r.retry).toBe(0)
  })

  it('per-instance onError overrides global', () => {
    const userFn = () => {}
    const r = resolveSource({ src: 'a.jpg', onError: userFn }, globals)
    expect(r.onError).toBe(userFn)
  })

  it('per-instance placeholder overrides global', () => {
    const r = resolveSource(
      { src: 'a.jpg', placeholder: 'data:image/svg' },
      { ...globals, placeholder: 'data:fallback' },
    )
    expect(r.placeholder).toBe('data:image/svg')
  })
})
