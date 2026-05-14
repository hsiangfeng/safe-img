import type { SourceOptions } from './types'
import { resolveSource } from './core/resolve'
import { startLoad, type LoadController, type LoadStatus } from './lib/loader'
import { getCache, getConfig } from './config'
import type { FailedCache } from './core/cache'
import type { SafeImgConfig } from './types'

export interface SafeImgHandle {
  /** Drop the current src from the failure cache and reload. */
  retry: () => void
  /** Stop any in-flight load and detach. */
  destroy: () => void
  /** Latest load status. */
  getStatus: () => LoadStatus
  /** Currently displayed URL. */
  getSrc: () => string
}

/** Attach safe-image behaviour to an existing <img>. */
export function safeImg(
  el: HTMLImageElement,
  options: SourceOptions,
): SafeImgHandle {
  return attachWithContext(el, options, getConfig, getCache)
}

/** Internal: same as safeImg() but with explicit context — used by createSafeImg(). */
export function attachWithContext(
  el: HTMLImageElement,
  options: SourceOptions,
  getCfg: () => SafeImgConfig,
  getCch: () => FailedCache,
): SafeImgHandle {
  let controller: LoadController | undefined
  let currentStatus: LoadStatus = 'loading'
  let currentSrc = ''

  const start = () => {
    controller?.cancel()
    const config = resolveSource(options, getCfg())

    if (!config.src) {
      console.warn('[safe-img] safeImg(): empty src')
      return
    }

    el.loading = config.lazy ? 'lazy' : 'eager'
    if (config.placeholder) {
      el.src = config.placeholder
      currentSrc = config.placeholder
    }

    controller = startLoad(
      config,
      getCch(),
      (result) => {
        currentStatus = result.status
        if (result.status === 'loaded' || result.status === 'fallback') {
          if (result.status === 'fallback') {
            el.removeAttribute('srcset')
            el.removeAttribute('sizes')
          }
          el.src = result.src
          currentSrc = result.src
        }
      },
      el,
    )
  }

  start()

  return {
    retry() {
      getCch().delete(options.src)
      start()
    },
    destroy() {
      controller?.cancel()
    },
    getStatus: () => currentStatus,
    getSrc: () => currentSrc,
  }
}
