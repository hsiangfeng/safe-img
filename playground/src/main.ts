import { safeImg, initSafeImg, defineSafeImgElement } from '../../src/index'

safeImg(document.getElementById('prog-ok') as HTMLImageElement, {
  src: 'https://picsum.photos/seed/prog-a/640/360',
})

safeImg(document.getElementById('prog-fail') as HTMLImageElement, {
  src: 'https://broken.example.com/oh-no.jpg',
  fallback: 'https://picsum.photos/seed/prog-b/640/360',
  retry: 0,
})

initSafeImg()
defineSafeImgElement()
