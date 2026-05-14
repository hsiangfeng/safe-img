# safe-img

[![npm version](https://img.shields.io/npm/v/safe-img.svg)](https://www.npmjs.com/package/safe-img)
[![npm downloads](https://img.shields.io/npm/dm/safe-img.svg)](https://www.npmjs.com/package/safe-img)

> [English](./README.md) · [線上範例](https://israynotarray.com/safe-img/)

處理「圖片壞掉」的零框架小套件。對既有 `<img>` 補上 fallback chain、自動重試、共用的失敗 URL 快取，並提供可選的 YouTube 風格模糊背景 —— 當圖片比例跟容器對不上時，自動拿模糊版本填滿空白。

三種接入方式，選現場順手的用：

- **程式化**：`safeImg(el, opts)` 回傳 `{ retry, destroy }` handle。
- **宣告式**：`<img data-safe-src="…">` 加上一行 `initSafeImg()`。
- **Web Component**：`<safe-img src="…" layered>`，模糊背景內建。

vanilla JS、React、Vue、Svelte、Solid，任何會把 DOM 寫進瀏覽器的環境都能用。TypeScript、ESM + CJS、100% 測試覆蓋率，零 runtime 相依。

## 安裝

```bash
pnpm add safe-img
# npm install safe-img
# yarn add safe-img
```

### 不想用 bundler？兩種選擇

**從 CDN 載 ES module** — 貼到任何 HTML 就能跑，沒有 bundler 也可以：

```html
<script type="module">
  import { safeImg, defineSafeImgElement } from 'https://esm.sh/safe-img@0.1.0'
  // 或：'https://cdn.jsdelivr.net/npm/safe-img@0.1.0/+esm'

  defineSafeImgElement()
  safeImg(document.querySelector('#avatar'), {
    src: 'https://example.com/cover.jpg',
    fallback: '/local-default.jpg',
  })
</script>
```

**傳統 `<script>` 標籤** — IIFE build 會把所有 API 掛到 global 變數 `SafeImg`：

```html
<script src="https://unpkg.com/safe-img@0.1.0/dist/index.global.js"></script>
<!-- 或 jsDelivr：https://cdn.jsdelivr.net/npm/safe-img@0.1.0/dist/index.global.js -->
<script>
  const { safeImg, initSafeImg, defineSafeImgElement } = SafeImg

  defineSafeImgElement()
  initSafeImg()
</script>
```

> 正式環境建議**鎖版本**（`@0.1.0`）。不寫版本（直接 `safe-img`）會解析成 `latest`，CDN 端最久會快取 12 小時 —— prototype 沒差，正式用很危險。

## 起手式

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

// 之後
handle.retry()      // 從失敗快取移除並重新載入
handle.destroy()    // 取消未完成的載入並解綁
```

`configure()` 是可選的 —— 不呼叫就用內建 SVG 當最終 fallback。

## 程式化 API

```ts
import { safeImg } from 'safe-img'

const handle = safeImg(imgEl, {
  src: 'https://example.com/cover.jpg',
  fallback: '/local-default.jpg',          // string | string[]
  placeholder: 'data:image/svg+xml;…',     // 載入中的暫存圖
  retry: 2,                                // 覆寫全域
  onError: (info) => Sentry.captureMessage('image failed', { extra: info }),
})

handle.getStatus()  // 'loading' | 'loaded' | 'fallback' | 'error'
handle.getSrc()     // 目前顯示的 URL
handle.retry()
handle.destroy()
```

切換到 fallback 時會自動把 `srcset` / `sizes` 從 `<img>` 拿掉，避免瀏覽器再去抓壞掉的變體。

## 宣告式 API

對要保護的圖片加上 `data-safe-*` 屬性，再呼叫一次 `initSafeImg()`：

```html
<img
  data-safe-src="https://example.com/cover.jpg"
  data-safe-fallback="/a.jpg, /b.jpg"
  data-safe-placeholder="data:image/svg+xml;…"
  data-safe-retry="0"
  alt="文章封面"
/>

<script type="module">
  import { initSafeImg } from 'safe-img'

  // 掃描整份 document，把所有 <img data-safe-src> 接上 safe-img
  initSafeImg()

  // 縮限掃描範圍，並自動接上後續才插入的 <img>
  initSafeImg(document.querySelector('#feed'), { observe: true })
</script>
```

回傳的函式會關掉 observer（如果有的話），並把已綁的圖片全部解綁。

## `<safe-img>` Web Component

模糊背景僅 Web Component 版本提供（因為它有自己的 wrapper 可以畫）。先註冊元件再使用：

```ts
import { defineSafeImgElement } from 'safe-img'

defineSafeImgElement()           // <safe-img>
defineSafeImgElement('img-safe') // 或自訂 tag name
```

```html
<safe-img
  src="https://example.com/cover.jpg"
  fallback="/local-default.jpg"
  alt="文章封面"
  blur-amount="20px"
  style="width: 100%; aspect-ratio: 16 / 9;"
></safe-img>

<!-- 純圖片，不要模糊背景 -->
<safe-img src="…" layered="false"></safe-img>
```

### 模糊背景（預設開啟）

`<safe-img>` 會在 shadow DOM 渲染：

```html
<safe-img>
  #shadow-root
    <div class="frame" style="--vsi-image: url(…)">
      <img src="…" />
    </div>
</safe-img>
```

- 外層 div 把同一張圖當作 `background-image`，`background-size: cover`。
- `::before` 偽元素套 `backdrop-filter: blur()` 在上面。
- 內層 `<img>` 蓋在最上方，使用 `object-fit: contain`。

當圖片比例跟容器不一致時，留白處會用模糊版本填滿 —— YouTube 看直式影片時兩側那種感覺。設 `layered="false"` 就只剩一張單純的 `<img>`。

### 載入骨架

外層 wrapper 一掛上就先渲染，所以版位會立刻被佔住。預設背景色（`#e5e7eb`）就是 skeleton。可以透過 CSS 變數覆寫：

```css
safe-img {
  --vsi-bg: #1f2937;
}
```

### 尺寸

元件本身沒有預設尺寸，要靠 CSS 給 `width` / `height` / `aspect-ratio`，例如 `.cover { width: 100%; aspect-ratio: 16 / 9; }`。`layered="false"` 模式不保留空間 —— 退化成原生 `<img>` 行為。

### 屬性

| 屬性           | 說明                                              |
| -------------- | ------------------------------------------------- |
| `src`          | 主圖 URL。                                        |
| `fallback`     | 單一 URL，或逗號分隔的清單。                      |
| `placeholder`  | 載入中要顯示的 URL。                              |
| `retry`        | 主圖失敗時的重試次數。                            |
| `lazy`         | 設 `"false"` 取消原生 `loading="lazy"`。          |
| `layered`      | 設 `"false"` 不要模糊背景。                       |
| `blur-amount`  | CSS 長度，傳給 `backdrop-filter: blur()`。        |
| `alt`          | 轉發給內層 `<img>`。                              |

### 事件

```ts
const el = document.querySelector('safe-img')!
el.addEventListener('safe-img-error', (e) => {
  console.warn(e.detail) // ErrorInfo
})
```

### 手動重試

```ts
const el = document.querySelector<SafeImgElement>('safe-img')!
el.retry()
```

## 全域設定

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

resetConfig() // 還原預設、清空快取（主要給測試用）
```

| 選項          | 型別                         | 預設                  | 說明                                                                            |
| ------------- | ---------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| `defaultSrc`  | `string`                     | 內建 SVG dataURL      | 最終 fallback。當 per-instance chain 跑完還是失敗時派上用場。                   |
| `placeholder` | `string`                     | `undefined`           | 主圖載入中顯示的 URL。                                                          |
| `retry`       | `number`                     | `2`                   | 主圖失敗後重試次數。                                                            |
| `retryDelay`  | `number` (ms)                | `500`                 | 重試之間的固定延遲。                                                            |
| `lazy`        | `boolean`                    | `true`                | 是否設定 `loading="lazy"`。                                                     |
| `cacheSize`   | `number`                     | `100`                 | 失敗 URL 的 LRU 快取容量。`0` 停用。                                            |
| `onError`     | `(info: ErrorInfo) => void`  | `undefined`           | 最終失敗時觸發一次。可以接到 Sentry / analytics。                               |

### 隔離 context

SSR 邊界或測試環境不想讓 singleton 漏資料，可以用 `createContext()`：

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
  src: string                       // 失敗的主圖 URL
  attempts: number                  // 實際嘗試載入次數，包含第一次
  fallbackUsed: string              // 最終切換到的 fallback
  element?: HTMLImageElement        // 對應的 <img>
}
```

## 各框架接法

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

已經有一套官方 Vue 3 套件 —— [`vue3-safe-img`](https://www.npmjs.com/package/vue3-safe-img)，提供 `v-safe-img` directive、`<SafeImg>` component、`useSafeImg` composable。Vue 專案請直接用那個版本。

## 不在這個套件的範圍內

- 響應式圖片產生（`srcset` / `sizes`、`<picture>`、WebP/AVIF），請交給圖片 CDN 或專門套件處理。
- 編譯期的低解析占位圖（plaiceholder、sharp），請事先生成 dataURL 後透過 `placeholder` 傳入。
- 容器比例控制，由父層 CSS 自行處理。

## SSR

跟 DOM 互動的部分（`safeImg`、`initSafeImg`、`<safe-img>`）都會用到 `document` / `HTMLImageElement` / `MutationObserver`，請在 client 端執行。Web Component 一掛上就先渲染骨架，所以 hydration 後不會閃跳。如果 `defineSafeImgElement()` 是在 server 端會被執行的程式碼裡，請加 `typeof window !== 'undefined'` 保護。

## 贊助

如果這個套件幫你省了時間，歡迎請我喝杯咖啡：

- [Buy Me a Coffee](https://buymeacoffee.com/israynotarray)
- [Portaly（台灣）](https://portaly.cc/israynotarray/support)

## License

MIT
