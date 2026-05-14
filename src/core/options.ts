import type { SafeImgConfig } from '../types'
import { DEFAULT_IMAGE } from '../assets/default-svg'

export const DEFAULT_CONFIG: SafeImgConfig = {
  defaultSrc: DEFAULT_IMAGE,
  placeholder: undefined,
  retry: 2,
  retryDelay: 500,
  lazy: true,
  cacheSize: 100,
  onError: undefined,
}

/** Merge user-supplied partial config with defaults; never mutates inputs. */
export function mergeConfig(
  user: Partial<SafeImgConfig> = {},
  defaults: SafeImgConfig = DEFAULT_CONFIG,
): SafeImgConfig {
  return { ...defaults, ...user }
}
