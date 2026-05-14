import { safeImg, type SafeImgHandle } from './attach'
import type { SourceOptions } from './types'

const ATTR_SRC = 'data-safe-src'
const ATTR_FALLBACK = 'data-safe-fallback'
const ATTR_PLACEHOLDER = 'data-safe-placeholder'
const ATTR_RETRY = 'data-safe-retry'
const ATTACHED_FLAG = '__safeImgHandle'

interface AttachedImg extends HTMLImageElement {
  [ATTACHED_FLAG]?: SafeImgHandle
}

export interface InitOptions {
  /** Watch for <img data-safe-src> added later. Returns a disconnect fn from init(). */
  observe?: boolean
}

/** Read SourceOptions from data-safe-* attributes on a single <img>. */
function readAttrs(el: HTMLImageElement): SourceOptions | null {
  const src = el.getAttribute(ATTR_SRC)
  if (!src) return null

  const fbAttr = el.getAttribute(ATTR_FALLBACK)
  const fallback = fbAttr
    ? fbAttr.includes(',')
      ? fbAttr.split(',').map((s) => s.trim()).filter(Boolean)
      : fbAttr
    : undefined

  const retryAttr = el.getAttribute(ATTR_RETRY)
  const retry = retryAttr !== null ? Number(retryAttr) : undefined

  return {
    src,
    fallback,
    placeholder: el.getAttribute(ATTR_PLACEHOLDER) ?? undefined,
    retry: Number.isFinite(retry) ? retry : undefined,
  }
}

const isImg = (node: Node): node is HTMLImageElement =>
  node.nodeType === 1 && (node as Element).tagName === 'IMG'

function attachOne(el: AttachedImg): void {
  if (el[ATTACHED_FLAG]) return
  const opts = readAttrs(el)
  if (!opts) return
  el[ATTACHED_FLAG] = safeImg(el, opts)
}

function detachOne(el: AttachedImg): void {
  el[ATTACHED_FLAG]?.destroy()
  delete el[ATTACHED_FLAG]
}

/**
 * Scan `root` for `<img data-safe-src>` and attach safeImg() to each.
 * Returns a disconnect fn that stops the MutationObserver (if `observe`) and detaches every img.
 */
export function initSafeImg(
  root: ParentNode = document,
  options: InitOptions = {},
): () => void {
  const attached: AttachedImg[] = []

  const scan = (scope: ParentNode) => {
    const list = scope.querySelectorAll<HTMLImageElement>(`img[${ATTR_SRC}]`)
    list.forEach((el) => {
      attachOne(el)
      if ((el as AttachedImg)[ATTACHED_FLAG]) attached.push(el)
    })
  }

  scan(root)

  if (!options.observe) {
    return () => {
      attached.forEach(detachOne)
      attached.length = 0
    }
  }

  const target = root === document ? document.body : (root as Node)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (isImg(node)) {
          attachOne(node)
          if ((node as AttachedImg)[ATTACHED_FLAG]) attached.push(node)
        } else if (node.nodeType === 1) {
          const scoped = node as Element
          scoped.querySelectorAll<HTMLImageElement>(`img[${ATTR_SRC}]`).forEach((el) => {
            attachOne(el)
            if ((el as AttachedImg)[ATTACHED_FLAG]) attached.push(el)
          })
        }
      })
      m.removedNodes.forEach((node) => {
        if (isImg(node)) detachOne(node as AttachedImg)
      })
    }
  })

  observer.observe(target, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
    attached.forEach(detachOne)
    attached.length = 0
  }
}
