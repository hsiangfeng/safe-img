/** Payload passed to onError when the main image ultimately fails. */
export interface ErrorInfo {
  /** Failed main URL */
  src: string
  /** Attempts including the first */
  attempts: number
  /** Which fallback was shown */
  fallbackUsed: string
  /** The actual <img> element when known (programmatic / declarative paths) */
  element?: HTMLImageElement
}

/** Global config — apply via configure() or createSafeImg(). */
export interface SafeImgConfig {
  /** Last-resort fallback. Defaults to the built-in SVG dataURL. */
  defaultSrc: string
  /** Shown while the main image is loading. */
  placeholder?: string
  /** Retries before walking the fallback chain. */
  retry: number
  /** Delay between retries in ms. */
  retryDelay: number
  /** Apply native loading="lazy". */
  lazy: boolean
  /** LRU cache capacity for failed URLs. 0 disables it. */
  cacheSize: number
  /** Fires once per final failure. */
  onError?: (info: ErrorInfo) => void
}

/** Per-call options accepted by safeImg() / data attributes / <safe-img>. */
export interface SourceOptions {
  src: string
  fallback?: string | string[]
  placeholder?: string
  retry?: number
  onError?: (info: ErrorInfo) => void
}

/** Normalised config produced by resolveSource() — internal. */
export interface ResolvedConfig {
  src: string
  fallbacks: string[]
  placeholder?: string
  retry: number
  retryDelay: number
  lazy: boolean
  onError?: (info: ErrorInfo) => void
}
