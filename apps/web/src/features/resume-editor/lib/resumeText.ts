import type { ResumeFormData } from "../types";
import {
  normalizeProfileLink,
  type ProfilePlatform,
} from "@texfolio/shared";

/**
 * Plain-text rendering of a resume, used by the TXT export in the download
 * chooser.
 *
 * Kept separate from `ResumePreview` on purpose: that component emits JSX and
 * carries per-template styling, while this has to produce something that reads
 * well in a bare editor window — fixed-width decoration is avoided so the file
 * pastes cleanly into an ATS textarea or an email body.
 */

/** `Experience.description` is `string[]`, but the editor's textarea holds a
 *  newline-delimited string until `toApiPayload` splits it. Both shapes reach
 *  this function depending on where in the save cycle we are called from. */
const toLines = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

/** Same duality for skill lists — TagChips writes a comma-delimited string. */
const toList = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

/** "Jan 2021 – Present" / "Jan 2021" — collapses to "" when both are empty. */
const dateRange = (start?: string, end?: string): string => {
  const from = (start || "").trim();
  const to = (end || "").trim();
  if (!from && !to) return "";
  return `${from || "?"} – ${to || "Present"}`;
};

const heading = (label: string): string => `\n${label.toUpperCase()}\n${"=".repeat(label.length)}\n`;

const joinParts = (parts: (string | undefined)[]): string =>
  parts.filter((p) => p && p.trim()).join(" | ");

export const buildResumeText = (data: ResumeFormData): string => {
  const out: string[] = [];
  const info = data.personalInfo;

  // ── Header ────────────────────────────────────────────────────────────────
  out.push((info?.fullName || data.title || "Resume").trim());
  const role = [data.title, info?.location].filter(Boolean).join(" — ");
  if (role.trim()) out.push(role.trim());
  const contact = joinParts([info?.email, info?.phone]);
  if (contact) out.push(contact);
  const links = joinParts([
    info?.linkedin && normalizeProfileLink("linkedin", info.linkedin),
    info?.github && normalizeProfileLink("github", info.github),
    ...(data.profileLinks || [])
      .filter((p) => p.platform && p.url.trim())
      .map((p) => normalizeProfileLink(p.platform as ProfilePlatform, p.url)),
  ]);
  if (links) out.push(links);

  // ── Sections, in the resume's own configured order ───────────────────────
  // `sectionOrder` is what the compiled PDF uses, so a plain-text export that
  // ignored it would present the same resume differently from the download it
  // sits next to.
  const builders: Record<string, () => string | null> = {
    summary: () => (data.summary?.trim() ? `${heading("Summary")}${data.summary.trim()}\n` : null),
    experience: () => {
      const items = data.experience || [];
      if (!items.length) return null;
      const body = items
        .map((exp) => {
          const lines: string[] = [];
          const head = joinParts([exp.position, exp.company]);
          lines.push(head || "(untitled role)");
          const meta = joinParts([dateRange(exp.startDate, exp.endDate), exp.location]);
          if (meta) lines.push(`  ${meta}`);
          if (exp.isCurrent) lines.push("  Current role");
          toLines(exp.description).forEach((line) => lines.push(`  - ${line}`));
          return lines.join("\n");
        })
        .join("\n\n");
      return `${heading("Experience")}${body}\n`;
    },
    education: () => {
      const items = data.education || [];
      if (!items.length) return null;
      const body = items
        .map((edu) => {
          const lines: string[] = [];
          const head = joinParts([
            [edu.degree, edu.field].filter(Boolean).join(", "),
            edu.institution,
          ]);
          lines.push(head || "(untitled)");
          const meta = joinParts([dateRange(edu.startDate, edu.endDate), edu.location, edu.gpa && `GPA ${edu.gpa}`]);
          if (meta) lines.push(`  ${meta}`);
          return lines.join("\n");
        })
        .join("\n\n");
      return `${heading("Education")}${body}\n`;
    },
    skills: () => {
      const items = data.skills || [];
      if (!items.length) return null;
      const body = items
        .map((skill) => {
          // `skills` is typed `string[]`, but TagChips writes a comma-delimited
          // string into it until `toApiPayload` splits it — both arrive here.
          const list = toList(skill.skills).join(", ");
          return `${skill.category || "Skills"}${list ? `: ${list}` : ""}`;
        })
        .join("\n");
      return `${heading("Skills")}${body}\n`;
    },
    projects: () => {
      const items = data.projects || [];
      if (!items.length) return null;
      const body = items
        .map((proj) => {
          const lines: string[] = [];
          lines.push(proj.name || "(untitled project)");
          if (proj.description?.trim()) lines.push(`  ${proj.description.trim()}`);
          const tech = toList(proj.technologies);
          if (tech.length) lines.push(`  Tech: ${tech.join(", ")}`);
          const links = joinParts([proj.link, proj.github, proj.liveUrl]);
          if (links) lines.push(`  ${links}`);
          return lines.join("\n");
        })
        .join("\n\n");
      return `${heading("Projects")}${body}\n`;
    },
    certifications: () => {
      const items = data.certifications || [];
      if (!items.length) return null;
      const body = items
        .map((cert) =>
          joinParts([
            cert.name,
            cert.issuer,
            cert.date,
          ]),
        )
        .filter(Boolean)
        .join("\n");
      return body ? `${heading("Certifications")}${body}\n` : null;
    },
  };

  const DEFAULT_ORDER = [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
  ];
  const order =
    Array.isArray(data.sectionOrder) && data.sectionOrder.length
      ? data.sectionOrder
      : DEFAULT_ORDER;

  const rendered = new Set<string>();
  order.forEach((key) => {
    if (rendered.has(key)) return;
    rendered.add(key);
    const section = builders[key]?.();
    if (section) out.push(section);
  });
  // Anything configured with an id this builder doesn't know about would
  // otherwise silently vanish from the export.
  DEFAULT_ORDER.forEach((key) => {
    if (rendered.has(key)) return;
    const section = builders[key]?.();
    if (section) out.push(section);
  });

  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
};
