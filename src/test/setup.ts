import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom 에 없는 브라우저 API — Base UI 팝업(포지셔닝)·스크롤 이동이 쓴다
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.assign(globalThis, { ResizeObserver: ResizeObserverStub })
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
// 창 스크롤(구현 확인 자동 스크롤) — jsdom 은 not implemented 경고만 남긴다
window.scrollTo = () => {}
