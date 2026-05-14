export { safeImg, type SafeImgHandle } from './attach'
export { initSafeImg, type InitOptions } from './init'
export {
  SafeImgElement,
  defineSafeImgElement,
} from './element'
export {
  configure,
  getConfig,
  getCache,
  resetConfig,
  createContext,
  type SafeImgContext,
} from './config'
export { createCache, type FailedCache } from './core/cache'
export { DEFAULT_CONFIG, mergeConfig } from './core/options'
export { resolveSource } from './core/resolve'
export { startLoad, type LoadController, type LoadResult, type LoadStatus } from './lib/loader'
export { DEFAULT_IMAGE } from './assets/default-svg'
export type { SafeImgConfig, SourceOptions, ResolvedConfig, ErrorInfo } from './types'
