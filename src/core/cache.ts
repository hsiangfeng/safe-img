export interface FailedCache {
  has(url: string): boolean
  add(url: string): void
  delete(url: string): void
  clear(): void
}

/** LRU failed-URL cache. capacity = 0 disables it entirely. */
export function createCache(capacity: number): FailedCache {
  const store = new Map<string, true>()
  const enabled = capacity > 0

  return {
    has(url) {
      if (!enabled) return false
      const hit = store.has(url)
      if (hit) {
        store.delete(url)
        store.set(url, true)
      }
      return hit
    },
    add(url) {
      if (!enabled) return
      if (store.has(url)) store.delete(url)
      store.set(url, true)
      if (store.size > capacity) {
        const oldest = store.keys().next().value
        if (oldest !== undefined) store.delete(oldest)
      }
    },
    delete(url) {
      store.delete(url)
    },
    clear() {
      store.clear()
    },
  }
}
