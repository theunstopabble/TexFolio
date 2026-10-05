// Must run first: jsdom supplies document/window to React.
import "./setup.ts";

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderComponentSource } from "./renderUtils.ts";

/**
 * The editor's copy of the wizard's structural bug: `ResumeFormSections` used
 * to `switch (activeStep)`, so editing Basics and then stepping forward
 * unmounted step 0 — react-hook-form's `validateField` then bailed with
 * `if (!mount || disabled.has(name)) return {}` and the caller deleted the
 * stale error, letting Save ship a cleared email straight to the API (400 with
 * no field marked red).
 *
 * The harness stands on the last step, so a failure here means some earlier
 * section stopped being mounted.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(here, "harnesses/editorMount.tsx");
const bundlePath = path.join(here, ".editorMount.generated.mjs");

let container: HTMLElement;
let root: Root | null = null;

before(async () => {
  const source = await renderComponentSource(entry);
  // Rolldown runs without Vite's `define` here; rewriting `import.meta.env` to
  // an object literal stops a dependency that reads `import.meta.env.X` at
  // module scope from throwing on an undefined base.
  fs.writeFileSync(bundlePath, source.replaceAll("import.meta.env", "({})"), "utf8");
  // Provide a real `require` for rolldown's ESM output (it otherwise throws for
  // `require("react")` coming out of a bundled CJS dependency). Bound to this
  // directory it resolves the same `node_modules/react` the test imports — one
  // React instance, shared CJS cache.
  (globalThis as Record<string, unknown>).require = createRequire(
    pathToFileURL(bundlePath).href,
  );
  const harness = (await import(pathToFileURL(bundlePath).href)) as {
    default: ComponentType;
  };

  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(createElement(harness.default));
  });
});

after(() => {
  fs.rmSync(bundlePath, { force: true });
});

test("all seven editor sections are mounted, only the last one visible", () => {
  const steps = Array.from(container.querySelectorAll("[data-step]"));
  assert.equal(steps.length, 7, "every section must stay in the DOM");

  const visible = steps.filter((step) => !step.classList.contains("hidden"));
  assert.equal(visible.length, 1, "exactly one section may be on screen");
  assert.equal(
    visible[0].getAttribute("data-step"),
    "6",
    "the harness stands on Certifications",
  );
});

test("Save validates a section that is not on screen", async () => {
  const email = container.querySelector("#personalInfoEmail, input[type='email']");
  assert.ok(email, "Basics' email input exists");
  const owner = email.closest('[data-step="0"]');
  assert.ok(owner, "email input belongs to Basics (step 0)");
  assert.ok(owner.classList.contains("hidden"), "…which is hidden from the user");
  assert.equal(container.querySelector("#email-error"), null, "no error yet");

  const form = container.querySelector("form");
  assert.ok(form, "harness renders a form to submit");
  const win = container.ownerDocument.defaultView;
  assert.ok(win, "jsdom window is reachable from the container");
  await act(async () => {
    // `Event` on globalThis is Node's, not jsdom's — dispatching it would be
    // rejected as "not of type Event".
    form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 25));
  });

  assert.equal(
    email.getAttribute("aria-invalid"),
    "true",
    "the hidden email input is marked invalid",
  );
  assert.ok(
    container.querySelector("#email-error"),
    "…and Basics renders its error text even though the user is on step 6",
  );
});
