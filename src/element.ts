import type { SourceOptions, ErrorInfo } from './types'
import { resolveSource } from './core/resolve'
import { startLoad, type LoadController, type LoadStatus } from './lib/loader'
import { getCache, getConfig } from './config'

const SHADOW_CSS = `
:host {
  display: block;
  position: relative;
}
.frame {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  width: 100%;
  height: 100%;
  background-color: var(--vsi-bg, #e5e7eb);
  background-image: var(--vsi-image, none);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.frame::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(var(--vsi-blur, 20px));
  -webkit-backdrop-filter: blur(var(--vsi-blur, 20px));
  pointer-events: none;
}
.frame.flat {
  background-image: none;
  background-color: transparent;
}
.frame.flat::before {
  display: none;
}
img {
  position: relative;
  z-index: 1;
  grid-area: 1 / 1;
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: contain;
  object-position: center;
}
.frame.flat img {
  grid-area: auto;
  width: auto;
  height: auto;
  max-width: 100%;
  object-fit: initial;
  object-position: initial;
}
img.hidden { display: none; }
`

const OBSERVED = ['src', 'fallback', 'placeholder', 'retry', 'lazy', 'layered', 'blur-amount', 'alt'] as const

export class SafeImgElement extends HTMLElement {
  static get observedAttributes(): readonly string[] {
    return OBSERVED
  }

  private root: ShadowRoot
  private frame: HTMLDivElement
  private img: HTMLImageElement
  private controller?: LoadController
  private status: LoadStatus = 'loading'
  private displaySrc = ''

  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = SHADOW_CSS
    this.frame = document.createElement('div')
    this.frame.className = 'frame'
    this.img = document.createElement('img')
    this.img.classList.add('hidden')
    this.frame.appendChild(this.img)
    this.root.append(style, this.frame)
  }

  connectedCallback(): void {
    this.start()
  }

  disconnectedCallback(): void {
    this.controller?.cancel()
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
    if (oldVal === newVal) return
    if (name === 'alt') {
      this.img.alt = newVal ?? ''
      return
    }
    if (this.isConnected) this.start()
  }

  /** Drop the current src from the failure cache and reload. */
  retry(): void {
    const src = this.getAttribute('src')
    if (src) getCache().delete(src)
    this.start()
  }

  private readOptions(): SourceOptions | null {
    const src = this.getAttribute('src')
    if (!src) return null
    const fbAttr = this.getAttribute('fallback')
    const fallback = fbAttr
      ? fbAttr.includes(',')
        ? fbAttr.split(',').map((s) => s.trim()).filter(Boolean)
        : fbAttr
      : undefined
    const retryAttr = this.getAttribute('retry')
    const retry = retryAttr !== null ? Number(retryAttr) : undefined
    return {
      src,
      fallback,
      placeholder: this.getAttribute('placeholder') ?? undefined,
      retry: Number.isFinite(retry) ? retry : undefined,
    }
  }

  private applyDisplay(src: string): void {
    this.displaySrc = src
    if (src) {
      this.img.src = src
      this.img.classList.remove('hidden')
      this.frame.style.setProperty('--vsi-image', `url('${src}')`)
    } else {
      this.img.removeAttribute('src')
      this.img.classList.add('hidden')
      this.frame.style.setProperty('--vsi-image', 'none')
    }
  }

  private start(): void {
    this.controller?.cancel()

    const layered = this.hasAttribute('layered')
      ? this.getAttribute('layered') !== 'false'
      : true
    this.frame.classList.toggle('flat', !layered)

    const blur = this.getAttribute('blur-amount')
    if (blur) this.frame.style.setProperty('--vsi-blur', blur)

    const alt = this.getAttribute('alt')
    if (alt !== null) this.img.alt = alt

    const opts = this.readOptions()
    if (!opts) {
      console.warn('[safe-img] <safe-img>: empty src')
      return
    }

    const config = resolveSource(opts, getConfig())

    const lazyAttr = this.getAttribute('lazy')
    const lazy = lazyAttr === null ? config.lazy : lazyAttr !== 'false'
    this.img.loading = lazy ? 'lazy' : 'eager'

    this.applyDisplay(config.placeholder ?? '')

    this.controller = startLoad(
      config,
      getCache(),
      (result) => {
        this.status = result.status
        if (result.status === 'loaded' || result.status === 'fallback') {
          if (result.status === 'fallback') {
            this.img.removeAttribute('srcset')
            this.img.removeAttribute('sizes')
          }
          this.applyDisplay(result.src)
        }
        if (result.errorInfo) {
          this.dispatchEvent(
            new CustomEvent<ErrorInfo>('safe-img-error', {
              detail: result.errorInfo,
              bubbles: true,
              composed: true,
            }),
          )
        }
      },
      this.img,
    )
  }

  getStatus(): LoadStatus {
    return this.status
  }

  getSrc(): string {
    return this.displaySrc
  }
}

/** Register <safe-img> with the given tag name. Safe to call multiple times. */
export function defineSafeImgElement(tagName = 'safe-img'): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, SafeImgElement)
  }
}
