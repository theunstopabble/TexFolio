import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  errorPaths,
  firstErrorStep,
} from "../src/lib/stepErrors.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Minimal leaf shape react-hook-form produces for a failed field. */
const leaf = (message = "Required") => ({ type: "required", message });

/** The wizard's scope, straight from STEPS — duplicated here so the test does
 *  not depend on hook internals. Personal info lives inside Basics (step 0). */
const wizardSteps: readonly (readonly string[])[] = [
  [
    "title",
    "templateId",
    "personalInfo.fullName",
    "personalInfo.email",
    "personalInfo.phone",
    "personalInfo.location",
    "profileLinks",
  ],
  ["summary"],
  ["education"],
  ["experience"],
  ["skills"],
  ["projects"],
  ["certifications"],
  [],
];

const editorSteps: readonly (readonly string[])[] = [
  ["title", "templateId", "personalInfo", "profileLinks"],
  ["summary"],
  ["education"],
  ["experience"],
  ["skills"],
  ["projects"],
  ["certifications"],
];

test("errorPaths: flat error", () => {
  assert.deepEqual(errorPaths({ title: leaf("Too long") }), ["title"]);
});

test("errorPaths: nested personalInfo", () => {
  assert.deepEqual(
    errorPaths({ personalInfo: { email: leaf("Enter a valid email") } }),
    ["personalInfo.email"],
  );
});

test("errorPaths: field array index is part of the path", () => {
  assert.deepEqual(
    errorPaths({ education: [{ institution: leaf() }, { degree: leaf() }] }),
    ["education.0.institution", "education.1.degree"],
  );
});

test("errorPaths: a container is descended into, a leaf is not", () => {
  // `types` is RHF's multi-reason shape; it must be treated as a leaf or the
  // path would grow a bogus `.types.<rule>` tail.
  assert.deepEqual(
    errorPaths({ summary: { types: { maxLength: "1500 max" } } }),
    ["summary"],
  );
});

test("errorPaths: empty and non-object input yield no paths", () => {
  assert.deepEqual(errorPaths({}), []);
  assert.deepEqual(errorPaths(null), []);
  assert.deepEqual(errorPaths(undefined), []);
  assert.deepEqual(errorPaths("required"), []);
});

test("firstErrorStep: earliest step wins, not first path alphabetically", () => {
  // A later step's error sorts first as a string ("experience" < "summary"),
  // but the user filled summary first, so summary is what must be revealed.
  const errors = {
    summary: leaf(),
    experience: [{ company: leaf() }],
  };
  assert.equal(firstErrorStep(errors, editorSteps), 1);
});

test("firstErrorStep: root-segment matching covers a step's whole scope", () => {
  // The step declares personalInfo.fullName, but email is the one that failed.
  const errors = { personalInfo: { email: leaf("Enter a valid email") } };
  assert.equal(firstErrorStep(errors, wizardSteps), 0);
});

test("firstErrorStep: reproduces the wizard's back-then-Generate hole", () => {
  // Email was cleared, the user backed out to Summary, hopped to Review and
  // pressed Generate. Before every step stayed mounted, RHF skipped the
  // detached field entirely and the payload went out unchecked. The error now
  // resolves to Basics, which owns personal info (and title/template too).
  const errors = {
    personalInfo: { email: leaf("Email is required") },
  };
  assert.equal(firstErrorStep(errors, wizardSteps), 0);
});

test("firstErrorStep: editor Basic scope claims a personalInfo error", () => {
  const errors = { personalInfo: { phone: leaf("Phone is required") } };
  assert.equal(firstErrorStep(errors, editorSteps), 0);
});

test("firstErrorStep: a profileLinks error belongs to the Basics step", () => {
  // `profileLinks` is registered inside step 0 in both forms; without it in
  // the scope a bad link row resolved to null and the submit handler scrolled
  // nowhere, leaving the failing row invisible.
  const errors = { profileLinks: [{ url: leaf("Enter a username or link") }] };
  assert.equal(firstErrorStep(errors, editorSteps), 0);
  assert.equal(firstErrorStep(errors, wizardSteps), 0);
});

test("firstErrorStep: the Review step claims nothing", () => {
  // Review declares no fields, so an error can never belong to it — it must
  // resolve to an earlier step rather than parking the user on Review.
  const errors = { certifications: [{ name: leaf() }] };
  assert.equal(firstErrorStep(errors, wizardSteps), 6);
  assert.notEqual(firstErrorStep(errors, wizardSteps), 7);
});

test("firstErrorStep: null when there is nothing to reveal", () => {
  assert.equal(firstErrorStep({}, editorSteps), null);
  assert.equal(firstErrorStep(null, editorSteps), null);
});

test("firstErrorStep: null for a synthetic root error no step owns", () => {
  // RHF's `root` errors (e.g. a failed cross-field rule set with setError)
  // belong to no section; the caller falls back to the first marked field.
  const errors = { root: { server: leaf("Could not save") } };
  assert.equal(firstErrorStep(errors, editorSteps), null);
  assert.deepEqual(errorPaths(errors), ["root.server"]);
});

test("both multi-step forms opt out of native constraint validation", () => {
  // With every step mounted, `<input type="email">` / `type="number"` in an
  // *inactive* section becomes a candidate for the browser's own validation.
  // Native validation can't show its tooltip on a display:none element, so a
  // bad value would block submit with nothing on screen to explain it. Keeping
  // the markup mounted and the native validator off is what lets
  // react-hook-form be the single source of truth for the whole form.
  for (const page of ["EditResume", "CreateResume"]) {
    const src = fs.readFileSync(
      path.resolve(here, `../src/pages/${page}.tsx`),
      "utf8",
    );
    const openTag = src.match(/<form[\s\S]*?>/);
    assert.ok(openTag, `${page}.tsx still renders a <form>`);
    assert.match(
      openTag[0],
      /\bnoValidate\b/,
      `${page}.tsx's <form> must declare noValidate — found:\n${openTag[0]}`,
    );
  }
});
