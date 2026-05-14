import type { ResolvedConfig, SafeImgConfig, SourceOptions } from '../types'

/** Normalise a per-call SourceOptions against the active global config. */
export function resolveSource(
  input: SourceOptions,
  globals: SafeImgConfig,
): ResolvedConfig {
  const userFallbacks = input.fallback
    ? Array.isArray(input.fallback)
      ? input.fallback
      : [input.fallback]
    : []

  return {
    src: input.src,
    fallbacks: [...userFallbacks, globals.defaultSrc],
    placeholder: input.placeholder ?? globals.placeholder,
    retry: input.retry ?? globals.retry,
    retryDelay: globals.retryDelay,
    lazy: globals.lazy,
    onError: input.onError ?? globals.onError,
  }
}
