import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { buildResumeFileName, triggerDownload } from "../src/lib/download.ts";

test("buildResumeFileName: sanitises and falls back", () => {
  assert.equal(buildResumeFileName("Gautam Kumar", null), "Gautam_Kumar_Resume.pdf");
  assert.equal(buildResumeFileName(null, "My Resume!"), "My_Resume_Resume.pdf");
  assert.equal(buildResumeFileName("", ""), "Resume_Resume.pdf");
  assert.equal(buildResumeFileName("  Spaces  &  Tabs  ", undefined), "Spaces_Tabs_Resume.pdf");
});

test("buildResumeFileName: ext selects the JSON/TXT export extension", () => {
  assert.equal(buildResumeFileName("Gautam Kumar", null, "json"), "Gautam_Kumar_Resume.json");
  assert.equal(buildResumeFileName("Gautam Kumar", null, ".txt"), "Gautam_Kumar_Resume.txt");
  // A malformed/empty extension degrades to the default rather than producing
  // a trailing dot.
  assert.equal(buildResumeFileName("Gautam Kumar", null, ""), "Gautam_Kumar_Resume.pdf");
  assert.equal(buildResumeFileName("Gautam Kumar", null, "zip"), "Gautam_Kumar_Resume.zip");
});

test("triggerDownload: creates, clicks and removes an <a download> (B3)", () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const document = dom.window.document;

  // Clickable spy: record click without navigating.
  const clicked: Array<{ href: string; download: string }> = [];
  const originalCreate = document.createElement.bind(document);
  document.createElement = (tag: string, options?: unknown) => {
    const el = originalCreate(tag, options as never) as HTMLAnchorElement & {
      click(): void;
    };
    if (tag.toLowerCase() === "a") {
      el.click = () => clicked.push({ href: el.href, download: el.download });
    }
    return el;
  };

  (globalThis as Record<string, unknown>).document = document;
  (globalThis as Record<string, unknown>).HTMLElement = dom.window.HTMLElement;

  triggerDownload("blob:http://localhost/abc-123", "Gautam_Kumar_Resume.pdf");

  assert.equal(clicked.length, 1, "exactly one anchor click");
  assert.equal(clicked[0].download, "Gautam_Kumar_Resume.pdf");
  assert.ok(clicked[0].href.includes("abc-123"));
  // Removed from the DOM after use (no stray anchors accumulating).
  assert.equal(document.body.querySelectorAll("a").length, 0);
});
