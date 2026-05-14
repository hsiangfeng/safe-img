import { safeImg, initSafeImg, defineSafeImgElement } from '../../src/index'
import './style.css'

defineSafeImgElement()

const okSquare = 'https://picsum.photos/seed/square/600/600'
const okWide = 'https://picsum.photos/seed/wide/1200/450'
const okPortrait = 'https://picsum.photos/seed/portrait/450/800'
const okBig = 'https://picsum.photos/seed/big/1920/1080'
const badUrl = 'https://this-host-does-not-exist.invalid/cover.jpg'
const customFallback = 'https://picsum.photos/seed/fallback/400/400'

const app = document.getElementById('app')!
app.innerHTML = `
  <main>
    <h1>safe-img playground</h1>
    <p class="lead">
      左邊是實際渲染畫面，右邊是對應的程式碼。
      切換上方的 checkbox 可以打開／關掉雙層模糊背景。
    </p>

    <div class="controls">
      <label>
        <input id="ctl-layered" type="checkbox" checked />
        雙層模糊背景 (layered)
      </label>
      <label>
        模糊強度 (blur-amount)
        <input id="ctl-blur-range" type="range" min="0" max="80" step="1" value="32" />
        <input id="ctl-blur-num" type="number" min="0" max="200" step="1" value="32" />
        px
      </label>
    </div>

    <section>
      <h2>1. 固定 400×400 盒子塞 1920×1080 大圖</h2>
      <p class="note">圖自動 fit 成 400×225，上下空白由模糊背景補。</p>
      <div class="example">
        <safe-img class="demo box-400" data-ctl src="${okBig}"></safe-img>
        <pre><code>&lt;safe-img
  class="box-400"
  src="https://picsum.photos/seed/big/1920/1080"
  blur-amount="32px"
&gt;&lt;/safe-img&gt;

&lt;style&gt;
.box-400 {
  width: 400px;
  height: 400px;
}
&lt;/style&gt;</code></pre>
      </div>
    </section>

    <section>
      <h2>2. 垂直長圖塞 16:9 寬框（左右模糊背景）</h2>
      <div class="example">
        <safe-img class="demo ratio-16-9" data-ctl src="${okPortrait}"></safe-img>
        <pre><code>&lt;safe-img
  class="ratio-16-9"
  src="https://picsum.photos/seed/portrait/450/800"
&gt;&lt;/safe-img&gt;

&lt;style&gt;
.ratio-16-9 {
  width: 100%;
  aspect-ratio: 16 / 9;
}
&lt;/style&gt;</code></pre>
      </div>
    </section>

    <section>
      <h2>3. 方形圖塞 16:9 寬框</h2>
      <div class="example">
        <safe-img class="demo ratio-16-9" data-ctl src="${okSquare}"></safe-img>
        <pre><code>&lt;safe-img
  class="ratio-16-9"
  src="https://picsum.photos/seed/square/600/600"
&gt;&lt;/safe-img&gt;

&lt;style&gt;
.ratio-16-9 {
  width: 100%;
  aspect-ratio: 16 / 9;
}
&lt;/style&gt;</code></pre>
      </div>
    </section>

    <section>
      <h2>4. 寬圖塞 1:1 方框（上下模糊背景）</h2>
      <div class="example">
        <safe-img class="demo ratio-1-1" data-ctl src="${okWide}"></safe-img>
        <pre><code>&lt;safe-img
  class="ratio-1-1"
  src="https://picsum.photos/seed/wide/1200/450"
&gt;&lt;/safe-img&gt;

&lt;style&gt;
.ratio-1-1 {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1 / 1;
}
&lt;/style&gt;</code></pre>
      </div>
    </section>

    <section>
      <h2>5. 壞圖 + 自訂 fallback（聽 safe-img-error 事件）</h2>
      <p class="note">打開 DevTools console 看 ErrorInfo。</p>
      <div class="example">
        <safe-img
          id="bad-with-fallback"
          class="demo ratio-16-9"
          data-ctl
          src="${badUrl}"
          fallback="${customFallback}"
          retry="0"
        ></safe-img>
        <pre><code>&lt;safe-img
  class="ratio-16-9"
  src="https://broken.example/cover.jpg"
  fallback="/local-default.jpg"
  retry="0"
&gt;&lt;/safe-img&gt;

&lt;script&gt;
const el = document.querySelector('safe-img')
el.addEventListener('safe-img-error', (e) =&gt; {
  console.log('image failed:', e.detail)
})
&lt;/script&gt;</code></pre>
      </div>
    </section>

    <section>
      <h2>6. 壞圖 + 走全域 default svg</h2>
      <div class="example">
        <safe-img class="demo ratio-16-9" data-ctl src="${badUrl}" retry="0"></safe-img>
        <pre><code>&lt;!-- 沒給 fallback：走 configure() 設定的 defaultSrc，
     還是沒設就用套件內建破圖 SVG --&gt;
&lt;safe-img
  class="ratio-16-9"
  src="https://broken.example/cover.jpg"
  retry="0"
&gt;&lt;/safe-img&gt;</code></pre>
      </div>
    </section>

    <section>
      <h2>7. 程式化 API — <code>safeImg(el, opts)</code></h2>
      <p class="note">手動把 fallback 行為掛到既有的 <code>&lt;img&gt;</code>，沒有 wrapper、沒有模糊背景。</p>
      <div class="example">
        <div class="demo ratio-16-9 plain-frame">
          <img id="prog-img" alt="" />
        </div>
        <pre><code>&lt;div class="frame"&gt;
  &lt;img id="avatar" alt="" /&gt;
&lt;/div&gt;

&lt;script type="module"&gt;
import { safeImg } from 'safe-img'

const el = document.getElementById('avatar')
const handle = safeImg(el, {
  src: 'https://broken.example/cover.jpg',
  fallback: '/local-default.jpg',
  retry: 0,
})

// 之後想手動 retry / 解綁：
// handle.retry()
// handle.destroy()
&lt;/script&gt;

&lt;style&gt;
.frame {
  width: 100%;
  aspect-ratio: 16 / 9;
}
.frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
&lt;/style&gt;</code></pre>
      </div>
    </section>

    <section>
      <h2>8. 宣告式 API — <code>&lt;img data-safe-src&gt;</code></h2>
      <p class="note">在 HTML 上加 data 屬性，呼叫一次 <code>initSafeImg()</code> 全部就位。</p>
      <div class="example">
        <div class="demo ratio-16-9 plain-frame">
          <img
            data-safe-src="${badUrl}"
            data-safe-fallback="${customFallback}"
            data-safe-retry="0"
            alt=""
          />
        </div>
        <pre><code>&lt;div class="frame"&gt;
  &lt;img
    data-safe-src="https://broken.example/cover.jpg"
    data-safe-fallback="/a.jpg, /b.jpg"
    data-safe-retry="0"
    alt=""
  /&gt;
&lt;/div&gt;

&lt;script type="module"&gt;
import { initSafeImg } from 'safe-img'

// 掃描整份 document
initSafeImg()

// 或縮限範圍，並自動接上後續才插入的 &lt;img&gt;：
// initSafeImg(document.querySelector('#feed'), { observe: true })
&lt;/script&gt;</code></pre>
      </div>
    </section>

    <section>
      <h2>9. <code>layered="false"</code> — 平面模式</h2>
      <p class="note">不要模糊背景，<code>&lt;safe-img&gt;</code> 退化成單純的 <code>&lt;img&gt;</code>。</p>
      <div class="example">
        <safe-img class="demo ratio-16-9 plain-frame" data-ctl src="${okSquare}" layered="false"></safe-img>
        <pre><code>&lt;safe-img
  src="https://picsum.photos/seed/square/600/600"
  layered="false"
&gt;&lt;/safe-img&gt;</code></pre>
      </div>
    </section>
  </main>
`

// init the declarative <img data-safe-src> in section 8
initSafeImg()

// programmatic demo for section 7
safeImg(document.getElementById('prog-img') as HTMLImageElement, {
  src: badUrl,
  fallback: customFallback,
  retry: 0,
})

// section 5: log error events
document
  .getElementById('bad-with-fallback')!
  .addEventListener('safe-img-error', (e) => {
    console.log('image failed:', (e as CustomEvent).detail)
  })

// controls — wire layered + blur to every <safe-img data-ctl>
const layeredEl = document.getElementById('ctl-layered') as HTMLInputElement
const blurRange = document.getElementById('ctl-blur-range') as HTMLInputElement
const blurNum = document.getElementById('ctl-blur-num') as HTMLInputElement
const controlled = () => document.querySelectorAll<HTMLElement>('safe-img[data-ctl]')

function applyLayered() {
  controlled().forEach((el) => {
    if (layeredEl.checked) el.removeAttribute('layered')
    else el.setAttribute('layered', 'false')
  })
}
function applyBlur(v: string) {
  controlled().forEach((el) => el.setAttribute('blur-amount', `${v}px`))
}

layeredEl.addEventListener('change', applyLayered)
blurRange.addEventListener('input', () => {
  blurNum.value = blurRange.value
  applyBlur(blurRange.value)
})
blurNum.addEventListener('input', () => {
  blurRange.value = blurNum.value
  applyBlur(blurNum.value)
})

applyBlur(blurRange.value)
