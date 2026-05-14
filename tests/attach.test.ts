import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { safeImg } from '../src/attach'
import { configure, resetConfig, getCache } from '../src/config'

class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private _src = ''
  get src() { return this._src }
  set src(value: string) {
    this._src = value
    setTimeout(() => {
      if (value.includes('fail')) this.onerror?.()
      else this.onload?.()
    }, 0)
  }
}

const originalImage = globalThis.Image

beforeEach(() => {
  globalThis.Image = MockImage as unknown as typeof Image
  resetConfig()
})

afterEach(() => {
  globalThis.Image = originalImage
})

const flush = (ms = 50) => new Promise((r) => setTimeout(r, ms))

describe('safeImg', () => {
  it('sets img.src on success', async () => {
    const el = document.createElement('img')
    safeImg(el, { src: 'cover.jpg' })
    await flush()
    expect(el.src).toContain('cover.jpg')
  })

  it('switches to fallback when main fails', async () => {
    const el = document.createElement('img')
    const handle = safeImg(el, { src: 'fail.jpg', fallback: '/ok.jpg', retry: 0 })
    await flush()
    expect(el.src).toContain('/ok.jpg')
    expect(handle.getStatus()).toBe('fallback')
  })

  it('strips srcset and sizes when falling back', async () => {
    const el = document.createElement('img')
    el.setAttribute('srcset', 'a.jpg 1x, b.jpg 2x')
    el.setAttribute('sizes', '50vw')
    safeImg(el, { src: 'fail.jpg', fallback: '/ok.jpg', retry: 0 })
    await flush()
    expect(el.hasAttribute('srcset')).toBe(false)
    expect(el.hasAttribute('sizes')).toBe(false)
  })

  it('applies placeholder immediately', () => {
    const el = document.createElement('img')
    safeImg(el, { src: 'cover.jpg', placeholder: 'data:image/placeholder' })
    expect(el.src).toBe('data:image/placeholder')
  })

  it('warns and no-ops when src is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = document.createElement('img')
    safeImg(el, { src: '' })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('honours global config for retry', async () => {
    configure({ retry: 0, retryDelay: 0 })
    const el = document.createElement('img')
    const handle = safeImg(el, { src: 'fail.jpg' })
    await flush()
    expect(handle.getStatus()).toBe('fallback')
  })

  it('respects lazy=false (sets loading=eager)', () => {
    configure({ lazy: false })
    const el = document.createElement('img')
    safeImg(el, { src: 'cover.jpg' })
    expect(el.loading).toBe('eager')
  })

  it('destroy cancels in-flight load', async () => {
    const el = document.createElement('img')
    const handle = safeImg(el, { src: 'cover.jpg' })
    handle.destroy()
    await flush()
    expect(el.src).toBe('')
  })

  it('retry clears the failure cache before reloading', async () => {
    const el = document.createElement('img')
    getCache().add('fail.jpg')
    const handle = safeImg(el, { src: 'fail.jpg', fallback: '/ok.jpg', retry: 0 })
    await flush()
    expect(getCache().has('fail.jpg')).toBe(true)
    handle.retry()
    expect(getCache().has('fail.jpg')).toBe(false)
  })

  it('getSrc returns the displayed URL', async () => {
    const el = document.createElement('img')
    const handle = safeImg(el, { src: 'cover.jpg' })
    await flush()
    expect(handle.getSrc()).toContain('cover.jpg')
  })

  it('getSrc reflects the placeholder before the main image resolves', () => {
    const el = document.createElement('img')
    const handle = safeImg(el, { src: 'cover.jpg', placeholder: 'data:ph' })
    expect(handle.getSrc()).toBe('data:ph')
  })
})
