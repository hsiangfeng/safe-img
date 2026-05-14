import type { ErrorInfo, ResolvedConfig } from '../types'
import type { FailedCache } from '../core/cache'
import { shouldRetry } from '../core/retry'

export type LoadStatus = 'loading' | 'loaded' | 'fallback' | 'error'

export interface LoadResult {
  status: LoadStatus
  src: string
  /** Only present when the main image just failed (not on cache-hit fallback). */
  errorInfo?: ErrorInfo
}

export interface LoadController {
  cancel(): void
}

/** preload + retry + fallback chain. The returned controller can be cancelled. */
export function startLoad(
  config: ResolvedConfig,
  cache: FailedCache,
  onChange: (result: LoadResult) => void,
  element?: HTMLImageElement,
): LoadController {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let attempts = 0

  const emit = (result: LoadResult) => {
    if (!cancelled) onChange(result)
  }

  const buildInfo = (fallbackUsed: string): ErrorInfo => ({
    src: config.src,
    attempts,
    fallbackUsed,
    element,
  })

  // notify=false on cache-hit path; we already notified the previous time
  const tryFallback = (idx: number, notify: boolean) => {
    if (cancelled) return
    const fb = config.fallbacks[idx]
    if (!fb) {
      emit({ status: 'error', src: '' })
      return
    }
    const probe = new Image()
    probe.onload = () => {
      if (cancelled) return
      if (notify) {
        const info = buildInfo(fb)
        config.onError?.(info)
        emit({ status: 'fallback', src: fb, errorInfo: info })
      } else {
        emit({ status: 'fallback', src: fb })
      }
    }
    probe.onerror = () => tryFallback(idx + 1, notify)
    probe.src = fb
  }

  const tryMain = () => {
    attempts += 1
    const probe = new Image()
    probe.onload = () => emit({ status: 'loaded', src: config.src })
    probe.onerror = () => {
      if (shouldRetry(attempts, config.retry)) {
        timer = setTimeout(tryMain, config.retryDelay)
        return
      }
      cache.add(config.src)
      tryFallback(0, true)
    }
    probe.src = config.src
  }

  emit({ status: 'loading', src: '' })

  if (cache.has(config.src)) {
    tryFallback(0, false)
  } else {
    tryMain()
  }

  return {
    cancel() {
      cancelled = true
      if (timer) clearTimeout(timer)
    },
  }
}
