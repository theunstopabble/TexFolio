import { test } from "node:test";
import assert from "node:assert/strict";
import {
  entryStarted,
  entryComplete,
  survivingEntries,
  requireIfStarted,
} from "../src/features/create-resume/entryValidation.ts";
import type { ResumeFormData } from "../src/features/resume-editor/types.ts";

/** The shape `fieldArray.append` creates in the wizard's default state. */
const blankEducation = {
  institution: "",
  degree: "",
  field: "",
  location: "",
  startDate: "",
  endDate: "",
};

const education = (...entries: Array<Partial<typeof blankEducation>>) =>
  entries.map((entry) => ({ ...blankEducation, ...entry }));

const formWith = (entries: Array<Partial<typeof blankEducation>>): ResumeFormData => ({
  title: "Frontend Developer",
  templateId: "classic",
  customization: { primaryColor: "#2563EB", fontFamily: "sans" },
  sectionOrder: [],
  personalInfo: {
    fullName: "Gautam Kumar",
    email: "g@example.com",
    phone: "+91 90000 00000",
    location: "Bengaluru, India",
  },
  summary: "",
  experience: [],
  education: education(...entries),
  skills: [],
  projects: [],
  certifications: [],
});

test("entryStarted: a blank wizard default is not started (section stays skippable)", () => {
  assert.equal(entryStarted(blankEducation), false);
  assert.equal(
    entryStarted({ company: "", position: "", description: [""], isCurrent: false }),
    false,
  );
  assert.equal(entryStarted({ category: "", skills: [] }), false);
  assert.equal(entryStarted(undefined), false);
});

test("entryStarted: any content counts, including non-required and list fields", () => {
  assert.equal(entryStarted({ ...blankEducation, institution: "UCB" }), true);
  // Only `location` — nothing the schema requires, but the user's work all the
  // same, so the entry must not be dropped silently.
  assert.equal(entryStarted({ ...blankEducation, location: "Berkeley" }), true);
  assert.equal(
    entryStarted({ company: "", position: "", description: ["Shipped X"] }),
    true,
  );
});

test("entryStarted: whitespace-only content does not count as content", () => {
  assert.equal(entryStarted({ ...blankEducation, institution: "   " }), false);
});

test("entryComplete: every required key must be present", () => {
  assert.equal(entryComplete("education", { ...blankEducation, institution: "UCB" }), false);
  assert.equal(
    entryComplete("education", {
      ...blankEducation,
      institution: "UCB",
      degree: "BS",
      field: "CS",
    }),
    true,
  );
  assert.equal(entryComplete("experience", { company: "Acme", position: "" }), false);
  assert.equal(entryComplete("experience", { company: "Acme", position: "Dev" }), true);
  assert.equal(entryComplete("projects", { name: "", description: "d" }), false);
  assert.equal(entryComplete("projects", { name: "TexFolio" }), true);
});

test("survivingEntries: matches what onSubmit keeps — blank and partial both drop", () => {
  const entries = education(
    {}, // untouched default
    { institution: "UCB" }, // partial: dropped by the submit filter
    { institution: "MIT", degree: "MS", field: "EE" }, // complete
  );
  const kept = survivingEntries("education", entries);

  assert.equal(kept.length, 1);
  assert.equal(kept[0].institution, "MIT");
  // Review's counts have to agree with the API payload, or it advertises
  // sections that never reach the server.
  assert.equal(survivingEntries("education", education({}, {})).length, 0);
});

test("requireIfStarted: a blank entry passes so optional sections stay optional", () => {
  const check = requireIfStarted("education", 0, "Institution is required");
  assert.equal(check("", formWith([{}])), true);
});

test("requireIfStarted: a started entry must fill this field", () => {
  const values = formWith([{ location: "Berkeley" }]);
  const check = requireIfStarted("education", 0, "Institution is required");
  assert.equal(check("", values), "Institution is required");
  // Content in the field itself satisfies the rule.
  assert.equal(check("UCB", values), true);
});

test("requireIfStarted: only the entry being validated is inspected", () => {
  const values = formWith([
    { institution: "UCB", degree: "BS", field: "CS" },
    {},
  ]);
  // Entry 0 is started but `degree` here is the checked field — it has content.
  assert.equal(
    requireIfStarted("education", 0, "Degree is required")("BS", values),
    true,
  );
  // Entry 1 is untouched, so its empty required fields stay skippable.
  assert.equal(
    requireIfStarted("education", 1, "Degree is required")("", values),
    true,
  );
  // Entry 1 started by another field -> now required.
  const started = formWith([{}, { location: "Pune" }]);
  assert.equal(
    requireIfStarted("education", 1, "Degree is required")("", started),
    "Degree is required",
  );
});
