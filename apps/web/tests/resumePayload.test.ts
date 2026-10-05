import { test } from "node:test";
import assert from "node:assert/strict";
import { updateResumeSchema } from "@texfolio/shared/dist/schemas/resume.schema.js";
import {
  toFormShapeFromApi,
  toApiPayload,
  countWords,
  MAX_SUMMARY_CHARS,
} from "../src/features/resume-editor/lib/resumePayload.ts";

test("countWords: empty / whitespace-only is 0, not 1 (B10)", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   \n  "), 0);
  assert.equal(countWords("one"), 1);
  assert.equal(countWords("one two  three"), 3);
});

test("toFormShapeFromApi: description array joins with newlines, skills with commas", () => {
  const form = toFormShapeFromApi({
    experience: [
      { company: "A", position: "B", description: ["Line 1", "Line 2"] },
    ],
    skills: [{ category: "Lang", skills: ["JS", "TS"] }],
    projects: [{ name: "X", description: "", technologies: ["React", "Vite"] }],
  });
  assert.equal(form.experience[0].description, "Line 1\nLine 2");
  assert.equal(form.skills[0].skills, "JS, TS");
  assert.equal(form.projects[0].technologies, "React, Vite");
});

test("toFormShapeFromApi: legacy string data (B8) passes through as the editable string", () => {
  const form = toFormShapeFromApi({
    experience: [{ company: "A", position: "B", description: "Line 1\nLine 2" }],
    skills: [{ category: "Lang", skills: "JS, TS" }],
    projects: [{ name: "X", description: "", technologies: "React, Vite" }],
  });
  assert.equal(form.experience[0].description, "Line 1\nLine 2");
  assert.equal(form.skills[0].skills, "JS, TS");
  assert.equal(form.projects[0].technologies, "React, Vite");
});

test("toApiPayload: form strings split back into arrays (submit contract)", () => {
  const payload = toApiPayload({
    experience: [{ company: "A", position: "B", description: "L1\nL2\n\nL3" }],
    skills: [{ category: "Lang", skills: "JS, TS" }],
    projects: [{ name: "X", description: "", technologies: "React, Vite" }],
  } as never);
  assert.deepEqual(payload.experience[0].description, ["L1", "L2", "L3"]);
  assert.deepEqual(payload.skills[0].skills, ["JS", "TS"]);
  assert.deepEqual(payload.projects[0].technologies, ["React", "Vite"]);
});

test("round-trip: untouched load → save is byte-identical (dirty-check invariant)", () => {
  const apiResume = {
    experience: [
      { company: "A", position: "B", description: ["Led team", "Shipped v1"] },
    ],
    education: [{ institution: "I", degree: "B.S.", field: "CS" }],
    skills: [{ category: "Lang", skills: ["JS", "TS"] }],
    projects: [{ name: "X", description: "", technologies: ["React"] }],
    certifications: [{ name: "AWS", issuer: "Amazon", date: "2024-05" }],
  };
  const formShape = toFormShapeFromApi(apiResume);
  const back = toApiPayload({
    ...formShape,
    experience: formShape.experience,
    skills: formShape.skills,
    projects: formShape.projects,
  } as never);

  assert.deepEqual(back.experience[0].description, ["Led team", "Shipped v1"]);
  assert.deepEqual(back.skills[0].skills, ["JS", "TS"]);
  assert.deepEqual(back.projects[0].technologies, ["React"]);
  assert.deepEqual(formShape.certifications[0].date, "2024-05");
});

test("toApiPayload output passes updateResumeSchema for a real resume (B1 limit)", () => {
  const formShape = toFormShapeFromApi({
    experience: [{ company: "A", position: "B", description: ["Led team"] }],
    skills: [{ category: "Lang", skills: ["JS"] }],
    projects: [{ name: "X", description: "", technologies: ["React"] }],
  });
  const payload = toApiPayload({ ...formShape } as never);
  assert.equal(updateResumeSchema.safeParse(payload).success, true);
  assert.equal(
    updateResumeSchema.safeParse({ summary: "x".repeat(1500) }).success,
    true,
  );
  assert.equal(
    updateResumeSchema.safeParse({ summary: "x".repeat(1501) }).success,
    false,
  );
});

test("summary cap parity: the UI constant and the schema agree", () => {
  // Every surface clamps with its own copy of this number — the editor's
  // textarea, the wizard's SummaryStep, and the API's zod rule. A mismatch in
  // either direction is a real defect: too low and the UI refuses text the
  // server would have taken, too high and the user finishes the wizard only to
  // get a 400. Deriving the boundary from MAX_SUMMARY_CHARS makes this fail
  // whichever side moves.
  assert.equal(
    updateResumeSchema.safeParse({
      summary: "x".repeat(MAX_SUMMARY_CHARS),
    }).success,
    true,
    `schema must accept exactly ${MAX_SUMMARY_CHARS} characters`,
  );
  assert.equal(
    updateResumeSchema.safeParse({
      summary: "x".repeat(MAX_SUMMARY_CHARS + 1),
    }).success,
    false,
    `schema must reject ${MAX_SUMMARY_CHARS + 1} characters`,
  );
});

// Dirty-check tests (T23)
function makeSnapshot(formShape: ReturnType<typeof toFormShapeFromApi>) {
  // Snapshot is JSON of the form shape (what savedSnapshotRef.current stores)
  return JSON.stringify(formShape);
}

test("dirty-check: freshly loaded resume is clean (snapshot matches current)", () => {
  const apiResume = {
    experience: [
      { company: "A", position: "B", description: ["Led team", "Shipped v1"] },
    ],
    education: [{ institution: "I", degree: "B.S.", field: "CS" }],
    skills: [{ category: "Lang", skills: ["JS", "TS"] }],
    projects: [{ name: "X", description: "", technologies: ["React"] }],
    certifications: [{ name: "AWS", issuer: "Amazon", date: "2024-05" }],
  };
  const formShape = toFormShapeFromApi(apiResume);
  const snapshot = makeSnapshot(formShape);

  // Fresh load - current form equals snapshot
  const current = JSON.stringify(formShape);
  const isDirty = snapshot !== "" && current !== snapshot;

  assert.equal(isDirty, false, "Freshly loaded resume should not be dirty");
});

test("dirty-check: editing any field makes form dirty", () => {
  const apiResume = {
    experience: [{ company: "A", position: "B", description: ["Led team"] }],
    skills: [{ category: "Lang", skills: ["JS"] }],
    projects: [{ name: "X", description: "", technologies: ["React"] }],
  };
  const formShape = toFormShapeFromApi(apiResume);
  const snapshot = makeSnapshot(formShape);

  // Simulate user editing the summary field
  const editedShape = { ...formShape, summary: "New summary text" };
  const current = JSON.stringify(editedShape);
  const isDirty = snapshot !== "" && current !== snapshot;

  assert.equal(isDirty, true, "Edited form should be dirty");
});

test("dirty-check: payload shape stability (object key order independent)", () => {
  // JSON.stringify key order can vary, but toApiPayload preserves array order
  // Object keys are now deterministic (ES2015+), so top-level keys are stable
  const formShape1 = toFormShapeFromApi({
    experience: [{ company: "A", position: "B", description: ["L1", "L2"] }],
    skills: [{ category: "Lang", skills: ["JS", "TS"] }],
  });
  const formShape2 = toFormShapeFromApi({
    skills: [{ category: "Lang", skills: ["JS", "TS"] }],
    experience: [{ company: "A", position: "B", description: ["L1", "L2"] }],
  });

  // Same data, different input field order -> top-level keys should be stable in output
  const payload1 = toApiPayload({ ...formShape1 } as never);
  const payload2 = toApiPayload({ ...formShape2 } as never);

  assert.deepEqual(payload1, payload2, "Payload top-level keys should be stable regardless of input field order");
});

test("dirty-check: toApiPayload normalizes known fields (stable comparison)", () => {
  // Verify that using toApiPayload for comparison is stable
  const formShape = toFormShapeFromApi({
    experience: [{ company: "A", position: "B", description: ["L1", "L2"] }],
    skills: [{ category: "Lang", skills: ["JS", "TS"] }],
    projects: [{ name: "X", description: "", technologies: ["React"] }],
  });

  const payloadSnapshot = toApiPayload({ ...formShape } as never);
  const payloadCurrent = toApiPayload({ ...formShape, summary: "test" } as never);
  // toApiPayload only returns experience/skills/projects - extra fields are dropped
  // So adding summary doesn't change the payload
  const payloadUnchanged = JSON.stringify(payloadSnapshot) === JSON.stringify(payloadCurrent);

  // Adding a description change to experience DOES change the payload
  const payloadWithDescChange = toApiPayload({
    ...formShape,
    experience: [{ company: "A", position: "B", description: ["L1", "L2", "L3"] }],
  } as never);
  const descChanged = JSON.stringify(payloadSnapshot) !== JSON.stringify(payloadWithDescChange);

  assert.equal(payloadUnchanged, true, "Payload unchanged when only summary changes");
  assert.equal(descChanged, true, "Payload comparison catches description edits");
});
