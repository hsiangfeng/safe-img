import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initSafeImg } from '../src/init'
import { resetConfig } from '../src/config'

let cleanup: Array<() => void> = []
const init = (...args: Parameters<typeof initSafeImg>) => {
  const disconnect = initSafeImg(...args)
  cleanup.push(disconnect)
  return disconnect
}

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
  document.body.innerHTML = ''
})

afterEach(() => {
  globalThis.Image = originalImage
  cleanup.forEach((fn) => fn())
  cleanup = []
})

const flush = (ms = 50) => new Promise((r) => setTimeout(r, ms))

describe('initSafeImg', () => {
  it('attaches to all imgs with data-safe-src under root', async () => {
    document.body.innerHTML = `
      <img id="a" data-safe-src="cover-a.jpg">
      <img id="b" data-safe-src="cover-b.jpg">
      <img id="skip" src="other.jpg">
    `
    init()
    await flush()
    expect((document.getElementById('a') as HTMLImageElement).src).toContain('cover-a.jpg')
    expect((document.getElementById('b') as HTMLImageElement).src).toContain('cover-b.jpg')
    expect((document.getElementById('skip') as HTMLImageElement).src).toContain('other.jpg')
  })

  it('reads fallback as comma-separated list', async () => {
    document.body.innerHTML = `<img id="a" data-safe-src="fail.jpg" data-safe-fallback="fail2.jpg, /final.jpg" data-safe-retry="0">`
    init()
    await flush()
    expect((document.getElementById('a') as HTMLImageElement).src).toContain('/final.jpg')
  })

  it('reads fallback as a single string', async () => {
    document.body.innerHTML = `<img id="a" data-safe-src="fail.jpg" data-safe-fallback="/only.jpg" data-safe-retry="0">`
    init()
    await flush()
    expect((document.getElementById('a') as HTMLImageElement).src).toContain('/only.jpg')
  })

  it('reads data-safe-retry as a number', async () => {
    document.body.innerHTML = `<img id="a" data-safe-src="fail.jpg" data-safe-fallback="/ok.jpg" data-safe-retry="0">`
    init()
    await flush()
    expect((document.getElementById('a') as HTMLImageElement).src).toContain('/ok.jpg')
  })

  it('reads data-safe-placeholder', () => {
    document.body.innerHTML = `<img id="a" data-safe-src="cover.jpg" data-safe-placeholder="data:ph">`
    init()
    expect((document.getElementById('a') as HTMLImageElement).src).toBe('data:ph')
  })

  it('skips imgs without data-safe-src', () => {
    document.body.innerHTML = `<img id="a" src="plain.jpg">`
    init()
    expect((document.getElementById('a') as HTMLImageElement).src).toContain('plain.jpg')
  })

  it('treats empty data-safe-src as a no-op', () => {
    document.body.innerHTML = `<img id="a" data-safe-src="">`
    init()
    expect((document.getElementById('a') as unknown as { __safeImgHandle?: object }).__safeImgHandle).toBeUndefined()
  })

  it('disconnect detaches every img', async () => {
    document.body.innerHTML = `<img id="a" data-safe-src="cover.jpg">`
    const disconnect = initSafeImg()
    disconnect()
    await flush()
  })

  it('does not double-attach if scanned twice', () => {
    document.body.innerHTML = `<img id="a" data-safe-src="cover.jpg">`
    init()
    const handleA = (document.getElementById('a') as unknown as { __safeImgHandle: object }).__safeImgHandle
    init()
    const handleB = (document.getElementById('a') as unknown as { __safeImgHandle: object }).__safeImgHandle
    expect(handleA).toBe(handleB)
  })

  it('observe=true attaches imgs added later', async () => {
    init(document, { observe: true })
    const img = document.createElement('img')
    img.setAttribute('data-safe-src', 'late.jpg')
    document.body.appendChild(img)
    await flush()
    expect(img.src).toContain('late.jpg')
  })

  it('observe=true attaches imgs inside an added subtree', async () => {
    init(document, { observe: true })
    const div = document.createElement('div')
    div.innerHTML = `<span><img data-safe-src="nested.jpg"></span>`
    document.body.appendChild(div)
    await flush()
    expect((div.querySelector('img') as HTMLImageElement).src).toContain('nested.jpg')
  })

  it('observe=true detaches imgs removed from the DOM', async () => {
    document.body.innerHTML = `<img id="a" data-safe-src="cover.jpg">`
    init(document, { observe: true })
    const el = document.getElementById('a') as HTMLImageElement
    el.remove()
    await flush()
  })

  it('observe=true disconnects the observer', async () => {
    const disconnect = init(document, { observe: true })
    disconnect()
    const img = document.createElement('img')
    img.setAttribute('data-safe-src', 'late.jpg')
    document.body.appendChild(img)
    await flush()
    expect((img as unknown as { __safeImgHandle?: object }).__safeImgHandle).toBeUndefined()
  })

  it('observe with a non-document root observes that root', async () => {
    const scope = document.createElement('section')
    document.body.appendChild(scope)
    initSafeImg(scope, { observe: true })
    const img = document.createElement('img')
    img.setAttribute('data-safe-src', 'scoped.jpg')
    scope.appendChild(img)
    await flush()
    expect(img.src).toContain('scoped.jpg')
  })
})
