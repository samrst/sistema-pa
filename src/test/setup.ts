import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:5173",
  pretendToBeVisual: true,
});

(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).Element = dom.window.Element;
(global as any).Node = dom.window.Node;
(global as any).Event = dom.window.Event;
(global as any).CustomEvent = dom.window.CustomEvent;
(global as any).UIEvent = dom.window.UIEvent;
(global as any).MouseEvent = dom.window.MouseEvent;
(global as any).KeyboardEvent = dom.window.KeyboardEvent;
(global as any).FocusEvent = dom.window.FocusEvent;
(global as any).MutationObserver = dom.window.MutationObserver;
(global as any).getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
(global as any).requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(callback, 0);
(global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);

for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (!(key in global)) {
    try {
      (global as any)[key] = (dom.window as any)[key];
    } catch {}
  }
}

Object.defineProperty(dom.window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
