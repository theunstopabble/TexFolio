import { test } from "node:test";
import assert from "node:assert/strict";
import { buildResumeText } from "../src/features/resume-editor/lib/resumeText.ts";
import type { ResumeFormData } from "../src/features/resume-editor/types.ts";

const makeData = (overrides: Partial<ResumeFormData> = {}): ResumeFormData => ({
  title: "Frontend Developer",
  templateId: "classic",
  customization: { primaryColor: "#2563EB", fontFamily: "sans" },
  sectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
  ],
  personalInfo: {
    fullName: "Gautam Kumar",
    email: "g@example.com",
    phone: "+91 90000 00000",
    location: "Bengaluru, India",
    linkedin: "in/gautam",
    github: "gautam",
  },
  summary: "Ships accessible web apps.",
  experience: [
    {
      company: "Acme",
      position: "Engineer",
      startDate: "2021-01",
      endDate: "",
      description: ["Built the editor", "Cut bundle 40%"],
      location: "Remote",
      isCurrent: true,
    },
  ],
  education: [
    {
      institution: "IIT",
      degree: "B.Tech",
      field: "CSE",
      startDate: "2017",
      endDate: "2021",
      gpa: "8.9",
      location: "Delhi",
    },
  ],
  skills: [{ category: "Languages", skills: ["TypeScript", "Rust"] }],
  projects: [
    {
      name: "TexFolio",
      description: "Resume builder",
      technologies: ["React", "Hono"],
      link: "texfolio.app",
    },
  ],
  certifications: [
    { name: "AWS SAA", issuer: "Amazon", date: "2024" },
  ],
  ...overrides,
});

test("buildResumeText: renders every section once, with its heading", () => {
  const text = buildResumeText(makeData());
  for (const heading of [
    "SUMMARY",
    "EXPERIENCE",
    "EDUCATION",
    "SKILLS",
    "PROJECTS",
    "CERTIFICATIONS",
  ]) {
    assert.ok(text.includes(`${heading}\n`), `missing heading: ${heading}`);
  }
  // Each heading appears exactly once — the fallback pass must not re-emit
  // sections the configured order already covered.
  assert.equal(text.split("EXPERIENCE\n=====").length - 1, 1);
});

test("buildResumeText: honors sectionOrder and appends unconfigured sections", () => {
  const text = buildResumeText(
    makeData({ sectionOrder: ["experience", "skills"] }),
  );
  const expAt = text.indexOf("EXPERIENCE\n=====");
  const skillsAt = text.indexOf("SKILLS\n=====");
  const summaryAt = text.indexOf("SUMMARY\n=====");

  assert.ok(expAt >= 0 && skillsAt >= 0, "ordered sections present");
  assert.ok(expAt < skillsAt, "configured order is respected");
  // Summary was not in sectionOrder — it must still appear, at the end, rather
  // than silently vanishing from the export.
  assert.ok(summaryAt > skillsAt, "unordered section appended, not dropped");
});

test("buildResumeText: empty sections are omitted entirely", () => {
  const text = buildResumeText(
    makeData({ projects: [], certifications: [], summary: "   " }),
  );
  assert.ok(!text.includes("PROJECTS"));
  assert.ok(!text.includes("CERTIFICATIONS"));
  assert.ok(!text.includes("SUMMARY"));
});

test("buildResumeText: editor's string-shaped description/skills both work", () => {
  // The form holds a newline/comma-delimited STRING until toApiPayload splits
  // it; the API copy holds arrays. The export is reachable from either.
  const text = buildResumeText(
    makeData({
      experience: [
        {
          company: "Acme",
          position: "Engineer",
          startDate: "2021-01",
          endDate: "",
          description: "Shipped it\n  Kept it fast" as unknown as string[],
          location: "",
          isCurrent: false,
        },
      ],
      skills: [
        { category: "Tools", skills: "Vite, Playwright" as unknown as string[] },
      ],
    }),
  );

  assert.ok(text.includes("- Shipped it"));
  assert.ok(text.includes("- Kept it fast"));
  assert.ok(text.includes("Tools: Vite, Playwright"));
  // The description's leading whitespace was not a bullet marker.
  assert.ok(!text.includes("-   Kept it fast"));
});

test("buildResumeText: header carries contact + links, ends with a newline", () => {
  const text = buildResumeText(makeData());
  assert.ok(text.startsWith("Gautam Kumar"));
  assert.ok(text.includes("g@example.com | +91 90000 00000"));
  // Handles are expanded to the canonical URLs, whatever form they were typed
  // in (`in/gautam` is the path LinkedIn shows in its own address bar).
  assert.ok(
    text.includes(
      "https://www.linkedin.com/in/gautam | https://github.com/gautam",
    ),
  );
  assert.ok(text.endsWith("\n"));
  // No triple-spaced gaps: sections are separated by a single blank line.
  assert.ok(!/\n{3}/.test(text));
});

test("buildResumeText: empty resume still yields a usable header", () => {
  const text = buildResumeText(
    makeData({
      summary: "",
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      sectionOrder: [],
    }),
  );
  assert.ok(text.startsWith("Gautam Kumar"));
  assert.equal(text.includes("SUMMARY"), false);
  assert.ok(text.endsWith("\n"));
});
