# safe-img

[![npm version](https://img.shields.io/npm/v/safe-img.svg)](https://www.npmjs.com/package/safe-img)
[![npm downloads](https://img.shields.io/npm/dm/safe-img.svg)](https://www.npmjs.com/package/safe-img)

> [繁體中文](./README.zh-TW.md) · [Live demo](https://israynotarray.com/safe-img/)

A tiny, framework-agnostic library for the broken-image problem. Picks up an
`<img>` and gives it a fallback chain, retry-with-delay, a shared failed-URL
cache, and an optional YouTube-style blurred backdrop when the image's aspect
ratio doesn't match its container.

Three entry points so you can pick whichever fits the call site:

- **Programmatic** — `safeImg(el, opts)` returns a `{ retry, destroy }` handle.
- **Declarative** — `<img data-safe-src="…">` plus a single `initSafeImg()` call.
- **Web Component** — `<safe-img src="…" layered>` with the layered backdrop baked in.

Works in vanilla JS, React, Vue, Svelte, Solid, or anything that renders to
the DOM. Written in TypeScript, ESM + CJS, 100 % test coverage, zero runtime
dependencies.

## Install

```bash
pnpm add safe-img
# npm install safe-img
# yarn add safe-img
```

### No build step? Two options

**ES module from a CDN** — paste into any HTML file, no bundler needed:

```html
<script type="module">
  import { safeImg, defineSafeImgElement } from 'https://unpkg.com/safe-img'

  defineSafeImgElement()
  safeImg(document.querySelector('#avatar'), {
    src: 'https://example.com/cover.jpg',
    fallback: '/local-default.jpg',
  })
</script>
```

**Classic `<script>` tag** — IIFE build exposes a global `SafeImg`:

```html
<script src="https://unpkg.com/safe-img/dist/index.global.js"></script>
<script>
  const { safeImg, initSafeImg, defineSafeImgElement } = SafeImg

  defineSafeImgElement()
  initSafeImg()
</script>
```

## Quick start

```ts
import { safeImg, configure } from 'safe-img'

configure({
  defaultSrc: '/assets/placeholder.png',
  retry: 2,
  retryDelay: 500,
  lazy: true,
  cacheSize: 100,
})

const img = document.querySelector<HTMLImageElement>('#avatar')!
const handle = safeImg(img, {
  src: user.avatar,
  fallback: ['/local-default.jpg'],
})

// later
handle.retry()      // drop from failure cache and reload
handle.destroy()    // cancel any in-flight load and detach
```

`configure()` is optional — skip it and the built-in SVG fallback takes over.

## Programmatic API

```ts
import { safeImg } from 'safe-img'

const handle = safeImg(imgEl, {
  src: 'https://example.com/cover.jpg',
  fallback: '/local-default.jpg',          // string | string[]
  placeholder: 'data:image/svg+xml;…',     // shown while loading
  retry: 2,                                // overrides global
  onError: (info) => Sentry.captureMessage('image failed', { extra: info }),
})

handle.getStatus()  // 'loading' | 'loaded' | 'fallback' | 'error'
handle.getSrc()     // current displayed URL
handle.retry()
handle.destroy()
```

When the loader falls back, `srcset` and `sizes` are stripped from the `<img>`
so the browser doesn't request a variant of the broken URL.

## Declarative API

Mark images with `data-safe-*` attributes, then call `initSafeImg()` once:

```html
<img
  data-safe-src="https://example.com/cover.jpg"
  data-safe-fallback="/a.jpg, /b.jpg"
  data-safe-placeholder="data:image/svg+xml;…"
  data-safe-retry="0"
  alt="Article cover"
/>

<script type="module">
  import { initSafeImg } from 'safe-img'

  // Attach to every <img data-safe-src> in the document.
  initSafeImg()

  // Scoped + auto-attach to <img> added later:
  initSafeImg(document.querySelector('#feed'), { observe: true })
</script>
```

The returned function disconnects the observer (if any) and detaches every
attached image.

## `<safe-img>` Web Component

Layered backdrop is exclusive to the Web Component — it provides a wrapper
where it can render one. Register the element once, then use it anywhere:

```ts
import { defineSafeImgElement } from 'safe-img'

defineSafeImgElement()           // <safe-img>
defineSafeImgElement('img-safe') // or pick another tag name
```

```html
<safe-img
  src="https://example.com/cover.jpg"
  fallback="/local-default.jpg"
  alt="Article cover"
  blur-amount="20px"
  style="width: 100%; aspect-ratio: 16 / 9;"
></safe-img>

<!-- plain image, no backdrop -->
<safe-img src="…" layered="false"></safe-img>
```

### Layered backdrop (default)

`<safe-img>` renders into shadow DOM:

```html
<safe-img>
  #shadow-root
    <div class="frame" style="--vsi-image: url(…)">
      <img src="…" />
    </div>
</safe-img>
```

- The wrapper holds the same image as `background-image`, sized `cover`.
- A `::before` pseudo-element runs `backdrop-filter: blur()` over the wrapper.
- The inner `<img>` sits on top with `object-fit: contain`.

When the image aspect doesn't match the container, the empty space fills with a
blurred copy of the same image — the way YouTube fills the sides of a vertical
video. Set `layered="false"` to skip all that and get a plain inner `<img>`.

### Loading skeleton

The wrapper renders immediately, so the slot is reserved before the image
finishes loading. The default background (`#e5e7eb`) acts as a skeleton.
Override it via the `--vsi-bg` CSS variable on the host element:

```css
safe-img {
  --vsi-bg: #1f2937;
}
```

### Sizing

The element has no intrinsic size. Give it `width`/`height` or `aspect-ratio`
via CSS — for example a `.cover { width: 100%; aspect-ratio: 16 / 9; }` class.
`layered="false"` mode does not reserve space; use width/height attributes if
you need a layout slot without the backdrop.

### Attributes

| Attribute      | Notes                                                       |
| -------------- | ----------------------------------------------------------- |
| `src`          | Main image URL.                                             |
| `fallback`     | Single URL, or comma-separated list.                        |
| `placeholder`  | URL shown while the main image loads.                       |
| `retry`        | Retries before walking the fallback chain.                  |
| `lazy`         | `"false"` to disable native `loading="lazy"`.               |
| `layered`      | `"false"` to skip the blurred backdrop.                     |
| `blur-amount`  | CSS length passed to `backdrop-filter: blur()`.             |
| `alt`          | Forwarded to the inner `<img>`.                             |

### Events

```ts
const el = document.querySelector('safe-img')!
el.addEventListener('safe-img-error', (e) => {
  console.warn(e.detail) // ErrorInfo
})
```

### Manual retry

```ts
const el = document.querySelector<SafeImgElement>('safe-img')!
el.retry()
```

## Global config

```ts
import { configure, resetConfig } from 'safe-img'

configure({
  defaultSrc: '/assets/placeholder.png',
  placeholder: undefined,
  retry: 2,
  retryDelay: 500,
  lazy: true,
  cacheSize: 100,
  onError: (info) => Sentry.captureMessage('image failed', { extra: info }),
})

resetConfig() // restore defaults + clear the cache (mostly for tests)
```

| Option        | Type                         | Default              | Notes                                                                              |
| ------------- | ---------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `defaultSrc`  | `string`                     | built-in SVG dataURL | Last-resort fallback when the per-instance chain is exhausted or empty.            |
| `placeholder` | `string`                     | `undefined`          | Shown while the main image is loading.                                             |
| `retry`       | `number`                     | `2`                  | Retries on transient failure before walking the fallback chain.                    |
| `retryDelay`  | `number` (ms)                | `500`                | Fixed delay between retries.                                                       |
| `lazy`        | `boolean`                    | `true`               | Sets `loading="lazy"` on the inner `<img>`.                                        |
| `cacheSize`   | `number`                     | `100`                | LRU cache for failed URLs. `0` disables it.                                        |
| `onError`     | `(info: ErrorInfo) => void`  | `undefined`          | Fires once per final failure. Hook it to Sentry / analytics.                       |

### Isolated contexts

For SSR boundaries or tests where the singleton would leak, use
`createContext()`:

```ts
import { createContext } from 'safe-img'

const ctx = createContext({ retry: 0, cacheSize: 0 })
ctx.configure({ retry: 1 })
ctx.getConfig()
ctx.getCache().clear()
```

### `ErrorInfo`

```ts
interface ErrorInfo {
  src: string                       // failed main URL
  attempts: number                  // how many times we tried before falling back
  fallbackUsed: string              // which fallback was shown
  element?: HTMLImageElement        // the actual <img>
}
```

## Framework recipes

### React

```tsx
import { useEffect, useRef } from 'react'
import { safeImg } from 'safe-img'

export function Avatar({ src }: { src: string }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const handle = safeImg(ref.current, { src, fallback: '/default.png' })
    return () => handle.destroy()
  }, [src])
  return <img ref={ref} alt="" />
}
```

### Svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { safeImg, type SafeImgHandle } from 'safe-img'
  export let src: string
  let img: HTMLImageElement
  let handle: SafeImgHandle | undefined
  onMount(() => {
    handle = safeImg(img, { src, fallback: '/default.png' })
    return () => handle?.destroy()
  })
</script>

<img bind:this={img} alt="" />
```

### Vue 3

There is a [first-party Vue 3 package — `vue3-safe-img`](https://www.npmjs.com/package/vue3-safe-img)
with a `v-safe-img` directive, `<SafeImg>` component, and `useSafeImg`
composable. Use that if you're already in Vue.

## What's not in scope

- Responsive image generation (`srcset` / `sizes`, `<picture>`, WebP/AVIF). Use
  an image CDN or a dedicated package.
- Build-time placeholder hashing (plaiceholder, sharp). Pass a pre-built
  dataURL via `placeholder` instead.
- Container aspect-ratio control. Parent CSS owns that.

## SSR

The browser-only parts (`safeImg`, `initSafeImg`, `<safe-img>`) all touch
`document`/`HTMLImageElement`/`MutationObserver` and should run on the client.
The Web Component renders its skeleton state immediately so there's no
content-jump after hydration. If you call `defineSafeImgElement()` in code
that runs on the server, guard it with `typeof window !== 'undefined'`.

## Sponsor

If this package saved you some time, feel free to buy me a coffee:

- [Buy Me a Coffee](https://buymeacoffee.com/israynotarray)
- [Portaly (Taiwan)](https://portaly.cc/israynotarray/support)

## License

MIT
