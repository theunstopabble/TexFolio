// jsdom provides a minimal DOM (document, CustomEvent, FormData, …) for the
// component smoke tests. Real keyboard input (B1, B7) still needs a live
// browser — these cover what is headlessly verifiable: render, props, defaults.
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const globalObj = globalThis as unknown as Record<string, unknown>;

// Copy DOM constructors + helpers so React/react-hook-form can see them.
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "HTMLSelectElement",
  "Element",
  "Node",
  "navigator",
  "CustomEvent",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
  "FocusEvent",
  "InputEvent",
  "MutationObserver",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
]) {
  const value = (dom.window as unknown as Record<string, unknown>)[key];
  if (value !== undefined && globalObj[key] === undefined) {
    globalObj[key] = value;
  }
}
