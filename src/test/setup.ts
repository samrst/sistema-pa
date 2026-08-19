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

class MockPointerEvent extends dom.window.MouseEvent {
  public pointerId?: number;
  public pointerType?: string;
  public isPrimary?: boolean;
  constructor(type: string, params: any = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 1;
    this.pointerType = params.pointerType || "mouse";
    this.isPrimary = params.isPrimary ?? true;
  }
}
(global as any).PointerEvent = MockPointerEvent;
(dom.window as any).PointerEvent = MockPointerEvent;

(global as any).KeyboardEvent = dom.window.KeyboardEvent;
(global as any).FocusEvent = dom.window.FocusEvent;
(global as any).MutationObserver = dom.window.MutationObserver;
(global as any).HTMLInputElement = dom.window.HTMLInputElement;
(global as any).HTMLButtonElement = dom.window.HTMLButtonElement;
(global as any).HTMLSelectElement = dom.window.HTMLSelectElement;
(global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
(global as any).HTMLFormElement = dom.window.HTMLFormElement;
(global as any).HTMLAnchorElement = dom.window.HTMLAnchorElement;
(global as any).HTMLDivElement = dom.window.HTMLDivElement;
(global as any).HTMLSpanElement = dom.window.HTMLSpanElement;
(global as any).HTMLParagraphElement = dom.window.HTMLParagraphElement;
(global as any).HTMLHeadingElement = dom.window.HTMLHeadingElement;
(global as any).HTMLTableElement = dom.window.HTMLTableElement;
(global as any).HTMLTableRowElement = dom.window.HTMLTableRowElement;
(global as any).HTMLTableCellElement = dom.window.HTMLTableCellElement;
(global as any).Document = dom.window.Document;
(global as any).HTMLDocument = dom.window.HTMLDocument;
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

const elements = [
  dom.window.Element.prototype,
  dom.window.HTMLElement.prototype,
  dom.window.HTMLInputElement.prototype,
  Element.prototype,
  HTMLElement.prototype,
];

for (const proto of elements) {
  if (proto) {
    (proto as any).scrollIntoView = (proto as any).scrollIntoView || (() => {});
    (proto as any).hasPointerCapture = (proto as any).hasPointerCapture || (() => false);
    (proto as any).setPointerCapture = (proto as any).setPointerCapture || (() => {});
    (proto as any).releasePointerCapture = (proto as any).releasePointerCapture || (() => {});
    (proto as any).attachEvent = (proto as any).attachEvent || (() => {});
    (proto as any).detachEvent = (proto as any).detachEvent || (() => {});
  }
}

if (!(global as any).ResizeObserver) {
  (global as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

try {
  delete (dom.window as any).Document.prototype.documentMode;
  delete (dom.window as any).HTMLDocument.prototype.documentMode;
  delete (dom.window.document as any).documentMode;
  delete (document as any).documentMode;
  if ((global as any).Document?.prototype) {
    delete (global as any).Document.prototype.documentMode;
  }
} catch {}

import jsPDF from "jspdf";
jsPDF.prototype.save = () => ({} as any);
