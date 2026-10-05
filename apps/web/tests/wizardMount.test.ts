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
 * Regression test for the wizard's structural bug.
 *
 * `ResumeFormSteps` used to render `currentStep === N && <Step/>`, so every
 * other step's inputs were *unmounted*. react-hook-form's `validateField`
 * starts with `if (!mount || disabled.has(name)) return {}` and the caller then
 * deletes the field's stale error — so walking back off an array step, hopping
 * to Review and pressing Generate validated nothing and shipped unchecked
 * content straight to the API, which answered 400 with no field marked red.
 *
 * Both assertions here fail against the old conditional rendering: step 3's
 * input would not be in the DOM at all.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(here, "harnesses/wizardMount.tsx");
const bundlePath = path.join(here, ".wizardMount.generated.mjs");

let container: HTMLElement;
let root: Root | null = null;

before(async () => {
  // One rolldown pass for the file — it is by far the slowest step.
  const source = await renderComponentSource(entry);
  // Rolldown runs without Vite's `define` here; rewriting `import.meta.env` to
  // an object literal stops a dependency that reads `import.meta.env.X` at
  // module scope from throwing on an undefined base.
  fs.writeFileSync(bundlePath, source.replaceAll("import.meta.env", "({})"), "utf8");
  // rolldown's ESM output rewrites a bundled CJS dependency's `require("react")`
  // into a helper that throws unless a real `require` is in scope. Supply one
  // bound to this file's directory: it resolves to the very same
  // `node_modules/react` the test itself imports (shared CJS cache, so there is
  // still exactly one React instance).
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

test("all eight steps are mounted, only the active one visible", () => {
  const steps = Array.from(container.querySelectorAll("[data-step]"));
  assert.equal(steps.length, 8, "every step must stay in the DOM");

  const visible = steps.filter((step) => !step.classList.contains("hidden"));
  assert.equal(visible.length, 1, "exactly one step may be on screen");
  assert.equal(visible[0].getAttribute("data-step"), "0", "the wizard opens on Basics");
});

test("a field on a hidden step is mounted — and still validated", async () => {
  // Structural half: experience[0].company must exist while step 0 (Basics)
  // is the active step. The entry is started-but-incomplete, so its own
  // `requireIfStarted` rule is what has to fire.
  const company = container.querySelector("#crt-exp-company-0");
  assert.ok(company, "experience's company input must be mounted even on step 0");
  const owner = company.closest('[data-step="3"]');
  assert.ok(owner, "company input belongs to the Experience step (data-step 3)");
  assert.ok(
    owner.classList.contains("hidden"),
    "…and step 3 is the one being kept off screen",
  );

  // Behavioural half: submitting must surface an error on that hidden input.
  const form = container.querySelector("form");
  assert.ok(form, "harness renders a form to submit");
  // RHF validates asynchronously; give its await-chain a beat to settle.
  const win = container.ownerDocument.defaultView;
  assert.ok(win, "jsdom window is reachable from the container");
  await act(async () => {
    // `Event` on globalThis is Node's, not jsdom's — dispatching it would be
    // rejected as "not of type Event".
    form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 25));
  });

  assert.equal(
    company.getAttribute("aria-invalid"),
    "true",
    "the hidden company input is marked invalid",
  );
  assert.ok(
    container.querySelector("#crt-exp-company-0-err"),
    "…and Experience renders its own error text, even though step 3 is hidden",
  );
});
