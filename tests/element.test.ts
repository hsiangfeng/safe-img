import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import { defineSafeImgElement, SafeImgElement } from '../src/element'
import type { ErrorInfo } from '../src/types'
import { resetConfig, getCache } from '../src/config'

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

beforeAll(() => {
  defineSafeImgElement()
})

beforeEach(() => {
  globalThis.Image = MockImage as unknown as typeof Image
  resetConfig()
  document.body.innerHTML = ''
})

afterEach(() => {
  globalThis.Image = originalImage
})

const flush = (ms = 50) => new Promise((r) => setTimeout(r, ms))

const mount = (html: string): SafeImgElement => {
  document.body.innerHTML = html
  return document.body.firstElementChild as SafeImgElement
}

describe('<safe-img>', () => {
  it('registers under the default tag', () => {
    expect(customElements.get('safe-img')).toBeDefined()
  })

  it('re-registering with the same name is a no-op', () => {
    defineSafeImgElement()
    defineSafeImgElement()
    expect(customElements.get('safe-img')).toBeDefined()
  })

  it('shows the main image on success', async () => {
    const el = mount(`<safe-img src="cover.jpg"></safe-img>`)
    await flush()
    const img = el.shadowRoot!.querySelector('img') as HTMLImageElement
    expect(img.src).toContain('cover.jpg')
    expect(el.getStatus()).toBe('loaded')
  })

  it('falls back when main fails and emits safe-img-error', async () => {
    const events: ErrorInfo[] = []
    document.addEventListener('safe-img-error', (e) =>
      events.push((e as CustomEvent<ErrorInfo>).detail),
    )
    const el = mount(`<safe-img src="fail.jpg" fallback="/ok.jpg" retry="0"></safe-img>`)
    await flush()
    const img = el.shadowRoot!.querySelector('img') as HTMLImageElement
    expect(img.src).toContain('/ok.jpg')
    expect(events).toHaveLength(1)
    expect(events[0].src).toBe('fail.jpg')
  })

  it('parses fallback as comma-separated list', async () => {
    const el = mount(`<safe-img src="fail.jpg" fallback="fail2.jpg, /final.jpg" retry="0"></safe-img>`)
    await flush()
    const img = el.shadowRoot!.querySelector('img') as HTMLImageElement
    expect(img.src).toContain('/final.jpg')
  })

  it('layered=false removes the backdrop styling', async () => {
    const el = mount(`<safe-img src="cover.jpg" layered="false"></safe-img>`)
    await flush()
    const frame = el.shadowRoot!.querySelector('.frame') as HTMLDivElement
    expect(frame.classList.contains('flat')).toBe(true)
  })

  it('blur-amount sets --vsi-blur', async () => {
    const el = mount(`<safe-img src="cover.jpg" blur-amount="40px"></safe-img>`)
    await flush()
    const frame = el.shadowRoot!.querySelector('.frame') as HTMLDivElement
    expect(frame.style.getPropertyValue('--vsi-blur')).toBe('40px')
  })

  it('alt updates the inner img', async () => {
    const el = mount(`<safe-img src="cover.jpg" alt="hello"></safe-img>`)
    await flush()
    const img = el.shadowRoot!.querySelector('img') as HTMLImageElement
    expect(img.alt).toBe('hello')
    el.setAttribute('alt', 'world')
    expect(img.alt).toBe('world')
    el.removeAttribute('alt')
    expect(img.alt).toBe('')
  })

  it('attribute change to src restarts loading', async () => {
    const el = mount(`<safe-img src="cover-a.jpg"></safe-img>`)
    await flush()
    el.setAttribute('src', 'cover-b.jpg')
    await flush()
    const img = el.shadowRoot!.querySelector('img') as HTMLImageElement
    expect(img.src).toContain('cover-b.jpg')
  })

  it('same-value attribute change is a no-op', async () => {
    const el = mount(`<safe-img src="cover.jpg"></safe-img>`)
    await flush()
    const before = el.getSrc()
    el.setAttribute('src', 'cover.jpg')
    expect(el.getSrc()).toBe(before)
  })

  it('warns and does nothing when src is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(`<safe-img></safe-img>`)
    await flush()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('placeholder is rendered immediately', () => {
    const el = mount(`<safe-img src="cover.jpg" placeholder="data:ph"></safe-img>`)
    const img = el.shadowRoot!.querySelector('img') as HTMLImageElement
    expect(img.src).toBe('data:ph')
  })

  it('disconnect cancels in-flight load', async () => {
    const el = mount(`<safe-img src="cover.jpg"></safe-img>`)
    el.remove()
    await flush()
  })

  it('retry clears the failure cache', async () => {
    getCache().add('fail.jpg')
    const el = mount(`<safe-img src="fail.jpg" fallback="/ok.jpg" retry="0"></safe-img>`)
    await flush()
    el.retry()
    expect(getCache().has('fail.jpg')).toBe(false)
  })

  it('retry without src is a no-op', () => {
    const el = document.createElement('safe-img') as SafeImgElement
    document.body.appendChild(el)
    el.retry()
  })

  it('lazy="false" sets loading=eager', () => {
    const el = mount(`<safe-img src="cover.jpg" lazy="false"></safe-img>`)
    const img = el.shadowRoot!.querySelector('img') as HTMLImageElement
    expect(img.loading).toBe('eager')
  })

  it('attributeChangedCallback is silent before connection', () => {
    const el = document.createElement('safe-img') as SafeImgElement
    el.setAttribute('src', 'cover.jpg')
  })

  it('disconnected attribute change does not restart load', async () => {
    const el = mount(`<safe-img src="cover-a.jpg"></safe-img>`)
    await flush()
    el.remove()
    el.setAttribute('src', 'cover-b.jpg')
    await flush()
    const img = el.shadowRoot!.querySelector('img') as HTMLImageElement
    expect(img.src).not.toContain('cover-b.jpg')
  })
})
