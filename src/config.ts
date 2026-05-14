import type { SafeImgConfig } from './types'
import { DEFAULT_CONFIG, mergeConfig } from './core/options'
import { createCache, type FailedCache } from './core/cache'

export interface SafeImgContext {
  getConfig: () => SafeImgConfig
  getCache: () => FailedCache
}

/** Create an isolated context — useful for SSR boundaries or tests. */
export function createContext(initial: Partial<SafeImgConfig> = {}): SafeImgContext & {
  configure: (next: Partial<SafeImgConfig>) => void
} {
  let config = mergeConfig(initial)
  let cache = createCache(config.cacheSize)

  return {
    getConfig: () => config,
    getCache: () => cache,
    configure(next) {
      const prev = config
      config = mergeConfig(next, config)
      if (config.cacheSize !== prev.cacheSize) {
        cache = createCache(config.cacheSize)
      }
    },
  }
}

const defaultContext = createContext()

/** Update the module-level singleton config. Resets the cache if `cacheSize` changed. */
export function configure(next: Partial<SafeImgConfig>): void {
  defaultContext.configure(next)
}

/** Read the current module-level config (deep-equal to DEFAULT_CONFIG until you call configure). */
export function getConfig(): SafeImgConfig {
  return defaultContext.getConfig()
}

/** Access the module-level failed-URL cache. */
export function getCache(): FailedCache {
  return defaultContext.getCache()
}

/** Reset the module-level singleton back to defaults — primarily for tests. */
export function resetConfig(): void {
  defaultContext.configure(DEFAULT_CONFIG)
  defaultContext.getCache().clear()
}

export { defaultContext as __defaultContext }
