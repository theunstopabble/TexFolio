import { Fragment, useEffect, useRef, useState } from "react";
import {
  PLATFORM_META,
  isHttpUrl,
  normalizeProfileLink,
  type ProfilePlatform,
} from "@texfolio/shared";

// Types (Mirrors the form data structure)
export interface ResumeData {
  title: string;
  templateId: string;
  sectionOrder?: string[];
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  /** Extra developer-platform handles. `platform: ""` is a freshly-added,
   *  unselected row — never rendered. */
  profileLinks?: { platform: ProfilePlatform | ""; url: string; label?: string }[];
  summary: string;
  experience: {
    company: string;
    position: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description: string[] | string;
    isCurrent?: boolean;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }[];
  skills: {
    category: string;
    skills: string[] | string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[] | string;
    sourceCode?: string;
    liveUrl?: string;
  }[];
  certifications: {
    name: string;
    issuer?: string;
    date?: string;
  }[];
  customization?: {
    primaryColor?: string;
    fontFamily?: "serif" | "sans" | string;
  };
}

interface ResumePreviewProps {
  data: ResumeData;
  className?: string; // Allow custom styling from parent
}

const ResumePreview: React.FC<ResumePreviewProps> = ({
  data,
  className = "",
}) => {
  // Helpers to safely parse arrays from string inputs (if user is still typing comma separated values)
  const parseList = (input: string[] | string): string[] => {
    if (Array.isArray(input)) return input;
    if (typeof input === "string")
      return input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return [];
  };

  const parseDescription = (input: string[] | string): string[] => {
    if (Array.isArray(input)) return input;
    if (typeof input === "string") return input.split("\n").filter(Boolean);
    return [];
  };

  // Sanitize user-provided URLs to prevent javascript: XSS
  const sanitizeUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    const trimmed = url.trim();
    const allowedProtocols = /^https?:\/\//i;
    const mailtoProtocol = /^mailto:/i;
    if (allowedProtocols.test(trimmed) || mailtoProtocol.test(trimmed)) {
      return trimmed;
    }
    // Reject dangerous protocols (javascript:, data:, vbscript:, file:)
    if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
      return undefined;
    }
    // Bare URLs — assume HTTPS
    return `https://${trimmed}`;
  };

  // Strip protocol/www for display (mirrors pdf.service cleanUrlForDisplay)
  const cleanUrlDisplay = (url: string | null | undefined): string => {
    if (!url) return "";
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  };

  // Templates render dates as-is (raw YYYY-MM) feeding LaTeX directly via
  // escapeLatex — the live preview MUST show the same raw string to be faithful.
  const rawDate = (dateStr: string | undefined) => dateStr || "";
  const dateRange = (start?: string, end?: string, isCurrent?: boolean) => {
    const s = rawDate(start);
    const e = isCurrent ? "Present" : end ? rawDate(end) : s ? "Present" : "";
    if (!s && !e) return "";
    return `${s} - ${e}`.replace(/ - $/, "");
  };
  const dateRangeEmDash = (start?: string, end?: string, isCurrent?: boolean) => {
    const s = rawDate(start);
    const e = isCurrent ? "Present" : end ? rawDate(end) : s ? "Present" : "";
    if (!s && !e) return "";
    return `${s} – ${e}`.replace(/ – $/, "");
  };

  // Parses markdown and LaTeX formatting tokens (**bold**, \textbf{bold}, *italic*, \textit{italic})
  const renderFormattedText = (text: string | null | undefined): React.ReactNode => {
    if (!text) return null;
    const parts: React.ReactNode[] = [];
    const regex = /(\\textbf\{([^}]+)\}|\*\*([^*]+)\*\*|\\textit\{([^}]+)\}|(?<!\*)\*([^*]+)\*(?!\*))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const boldContent = match[2] || match[3];
      const italicContent = match[4] || match[5];
      if (boldContent) {
        parts.push(
          <strong key={match.index} className="font-bold">
            {boldContent}
          </strong>,
        );
      } else if (italicContent) {
        parts.push(
          <em key={match.index} className="italic">
            {italicContent}
          </em>,
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Template Styles
  const isDeveloper = data.templateId === "developer";
  const isPremium = data.templateId === "premium";
  const isFaangpath = data.templateId === "faangpath";
  const isClassic = !isDeveloper && !isPremium && !isFaangpath;

  const primaryColor = data.customization?.primaryColor || "#2563EB";

  // ----- Developer: Gautam's exact LaTeX format (extarticle 9pt, Computer Modern, Small Caps, blue links) -----
  const developerContainerStyle = {
    fontFamily: "'Computer Modern Serif', 'Latin Modern Roman', serif",
    color: "#000000",
    lineHeight: "1.22",
  };
  const developerName = "text-2xl sm:text-3xl font-bold tracking-tight mb-0.5 text-center text-black";
  const developerSection =
    "text-[12px] sm:text-[13px] font-bold tracking-wide border-b border-black mb-1 mt-2.5 pb-0.5 flex items-center text-black";
  const developerHeader = "text-center pb-1 mb-1.5";

  // ----- Classic: standard article 11pt, Times, primary navy #004F90 -----
  const classicContainerStyle = {
    fontFamily: "'Times New Roman', Times, serif",
    color: "#000000",
    lineHeight: "1.28",
  };
  const classicHeader = "text-center pb-1 mb-3";
  const classicName = "text-3xl font-bold tracking-wide mb-1 text-black";
  const classicSection =
    "text-sm font-bold border-b mb-2 mt-4 pb-0.5 flex items-center text-[#004f90] border-[#004f90]";

  // ----- Premium: user's LaTeX format (Times/Sans, Small Caps, dynamic primaryColor) -----
  const premiumContainerStyle = {
    fontFamily: data.customization?.fontFamily === "sans" ? "sans-serif" : "'Times New Roman', Times, serif",
    color: "#000000",
    lineHeight: "1.28",
  };
  const premiumHeader = "text-center pb-1 mb-3";
  const premiumName = "text-3xl font-bold tracking-wide mb-1 text-black";
  const premiumSection =
    "text-sm font-bold border-b mb-2 mt-4 pb-0.5 flex items-center";

  // ----- FAANGPath: resume.cls — uppercase centered name, address lines, rSection headers -----
  const faangpathContainerStyle = {
    fontFamily: "'Times New Roman', Times, serif",
    color: "#000000",
    lineHeight: "1.25",
  };
  const faangpathHeader = "mb-4";
  const faangpathName =
    "text-2xl sm:text-3xl font-bold text-center uppercase tracking-wide mb-1.5 text-black";
  const faangpathAddress =
    "text-sm text-center flex justify-center gap-x-1.5 flex-wrap text-black";
  const faangpathDiamond = "text-slate-500 font-normal";
  const faangpathSection =
    "text-xs sm:text-sm font-bold uppercase border-b border-black mb-2 mt-3.5 pb-0.5 text-black";

  const nameStyle = isDeveloper
    ? developerName
    : isPremium
      ? premiumName
      : isFaangpath
        ? faangpathName
        : classicName;
  const sectionHeaderStyle = isDeveloper
    ? developerSection
    : isPremium
      ? premiumSection
      : isFaangpath
        ? faangpathSection
        : classicSection;
  const headerBottom = isDeveloper
    ? developerHeader
    : isPremium
      ? premiumHeader
      : isFaangpath
        ? faangpathHeader
        : classicHeader;

  const renderHeader = () => {
    // Defensive normalise: legacy rows and LinkedIn-imported values may hold a
    // bare handle, and a relative href would just 404. `normalizeProfileLink`
    // is idempotent, so already-canonical URLs pass through untouched.
    const linkedin = normalizeProfileLink("linkedin", data.personalInfo.linkedin);
    const github = normalizeProfileLink("github", data.personalInfo.github);
    const extras = (data.profileLinks || [])
      .filter((p) => p.platform !== "" && p.url.trim() !== "")
      .map((p) => ({
        href: normalizeProfileLink(p.platform as ProfilePlatform, p.url),
        label: p.label || (PLATFORM_META[p.platform as ProfilePlatform]?.label ?? p.platform),
      }))
      .filter((l) => isHttpUrl(l.href));

    if (isDeveloper) {
      // developer.tex: Name, optional Title/Tagline, Line 1: email | phone | location, Line 2: linkedin | github | portfolio | extras
      const line1: React.ReactNode[] = [];
      if (data.personalInfo.email) {
        line1.push(
          <a
            key="email"
            href={sanitizeUrl(`mailto:${data.personalInfo.email}`)}
            className="text-[#0000ee] hover:underline"
          >
            {data.personalInfo.email}
          </a>,
        );
      }
      if (data.personalInfo.phone) {
        line1.push(
          <a
            key="phone"
            href={sanitizeUrl(`tel:${data.personalInfo.phone.replace(/\s+/g, "")}`)}
            className="text-[#0000ee] hover:underline"
          >
            {data.personalInfo.phone}
          </a>,
        );
      }
      if (data.personalInfo.location) {
        line1.push(
          <span key="loc" className="text-black">
            {data.personalInfo.location}
          </span>,
        );
      }

      const line2: React.ReactNode[] = [];
      if (linkedin) {
        line2.push(
          <a
            key="linkedin"
            href={sanitizeUrl(linkedin)}
            target="_blank"
            rel="noreferrer"
            className="text-[#0000ee] hover:underline"
          >
            {cleanUrlDisplay(linkedin)}
          </a>,
        );
      }
      if (github) {
        line2.push(
          <a
            key="github"
            href={sanitizeUrl(github)}
            target="_blank"
            rel="noreferrer"
            className="text-[#0000ee] hover:underline"
          >
            {cleanUrlDisplay(github)}
          </a>,
        );
      }
      if (data.personalInfo.portfolio) {
        const portfolio = normalizeProfileLink("portfolio", data.personalInfo.portfolio);
        if (portfolio) {
          line2.push(
            <a
              key="portfolio"
              href={sanitizeUrl(portfolio)}
              target="_blank"
              rel="noreferrer"
              className="text-[#0000ee] hover:underline"
            >
              {cleanUrlDisplay(portfolio)}
            </a>,
          );
        }
      }
      extras.forEach((ext) => {
        line2.push(
          <a
            key={ext.href}
            href={sanitizeUrl(ext.href)}
            target="_blank"
            rel="noreferrer"
            className="text-[#0000ee] hover:underline"
          >
            {ext.label}
          </a>,
        );
      });

      return (
        <div className={headerBottom}>
          <h1 className={nameStyle}>
            {data.personalInfo.fullName || "Your Name"}
          </h1>
          {data.title && (
            <div className="text-xs sm:text-sm font-bold text-black mb-1">
              {data.title}
            </div>
          )}
          {line1.length > 0 && (
            <div className="text-[10px] sm:text-[10.5px] flex flex-wrap justify-center gap-x-1 text-black">
              {line1.map((seg, i) => (
                <span key={i}>
                  {seg}
                  {i < line1.length - 1 && <span className="mx-1 text-black font-normal">|</span>}
                </span>
              ))}
            </div>
          )}
          {line2.length > 0 && (
            <div className="text-[10px] sm:text-[10.5px] flex flex-wrap justify-center gap-x-1 text-black">
              {line2.map((seg, i) => (
                <span key={i}>
                  {seg}
                  {i < line2.length - 1 && <span className="mx-1 text-black font-normal">|</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (isFaangpath) {
      // faangpath.tex: two \address lines, items joined by diamonds
      const addrOne = [
        data.personalInfo.phone,
        data.personalInfo.location,
      ].filter(Boolean);
      const addrTwo = [
        data.personalInfo.email,
        linkedin,
        github,
        ...extras.map((l) => l.href),
      ].filter(Boolean);
      return (
        <div className={headerBottom}>
          <h1 className={nameStyle}>
            {data.personalInfo.fullName || "Your Name"}
          </h1>
          {addrOne.length > 0 && (
            <div className={faangpathAddress}>
              {addrOne.map((item, i, arr) => (
                <span key={i}>
                  {item}
                  {i < arr.length - 1 && (
                    <span className={`${faangpathDiamond} mx-1`}>◆</span>
                  )}
                </span>
              ))}
            </div>
          )}
          {addrTwo.length > 0 && (
            <div className={faangpathAddress}>
              {addrTwo.map((item, i, arr) => (
                <span key={i}>
                  <a
                    href={
                      data.personalInfo.email === item
                        ? sanitizeUrl(`mailto:${item}`)
                        : sanitizeUrl(item)
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {item}
                  </a>
                  {i < arr.length - 1 && (
                    <span className={`${faangpathDiamond} mx-1`}>◆</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Classic & Premium contact row
    const linkColor = isPremium ? primaryColor : "#004F90";
    return (
      <div className={headerBottom}>
        <h1 className={nameStyle}>
          {data.personalInfo.fullName || "Your Name"}
        </h1>

        <div className="text-xs sm:text-sm flex flex-wrap justify-center gap-x-1.5 text-black">
        {(() => {
          const segments: React.ReactNode[] = [];
          if (data.personalInfo.email) {
            segments.push(
              <a
                key="email"
                href={sanitizeUrl(`mailto:${data.personalInfo.email}`)}
                className="hover:underline"
                style={{ color: linkColor }}
              >
                {data.personalInfo.email}
              </a>,
            );
          }
          if (data.personalInfo.phone) {
            segments.push(
              <span key="phone">{data.personalInfo.phone}</span>,
            );
          }
          if (data.personalInfo.location) {
            segments.push(
              <span key="location">{data.personalInfo.location}</span>,
            );
          }
          if (linkedin) {
            segments.push(
              <a
                key="linkedin"
                href={sanitizeUrl(linkedin)}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
                style={{ color: linkColor }}
              >
                {isPremium ? "LinkedIn" : cleanUrlDisplay(linkedin)}
              </a>,
            );
          }
          if (github) {
            segments.push(
              <a
                key="github"
                href={sanitizeUrl(github)}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
                style={{ color: linkColor }}
              >
                {isPremium ? "GitHub" : cleanUrlDisplay(github)}
              </a>,
            );
          }
          extras.forEach((link) => {
            segments.push(
              <a
                key={link.href}
                href={sanitizeUrl(link.href)}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
                style={{ color: linkColor }}
              >
                {link.label}
              </a>,
            );
          });
          return segments.map((segment, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="mx-0.5 text-black">|</span>}
              {segment}
            </Fragment>
          ));
        })()}
      </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    children: React.ReactNode,
    key?: number,
  ) => {
    const style: React.CSSProperties = {};
    if (isDeveloper) {
      style.fontVariant = "small-caps";
    } else if (isPremium) {
      style.fontVariant = "small-caps";
      style.color = primaryColor;
      style.borderColor = primaryColor;
    } else if (isClassic) {
      style.color = "#004F90";
      style.borderColor = "#004F90";
    }

    return (
      <div key={key} className={isDeveloper ? "mb-2" : "mb-3"}>
        <h2 className={sectionHeaderStyle} style={style}>
          {title}
        </h2>
        {children}
      </div>
    );
  };

  const renderEducation = () => {
    if (!data.education?.length) return null;
    return renderSection(
      "Education",
      <div className={`space-y-2 ${!isPremium && !isDeveloper ? "mt-2" : ""}`}>
        {data.education.map((edu, i) =>
          isDeveloper ? (
            <div key={i} className="mb-1">
              <div className="flex justify-between items-baseline font-bold text-[10.5px] sm:text-[11.5px] text-black">
                <span>{edu.institution}</span>
                <span className="font-normal">{edu.location}</span>
              </div>
              <div className="flex justify-between items-baseline italic text-[10px] sm:text-[10.5px] text-black">
                <span>
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                </span>
                <span className="not-italic">
                  {dateRangeEmDash(edu.startDate, edu.endDate)}
                </span>
              </div>
              {edu.gpa && (
                <div className="italic text-[9.5px] sm:text-[10px] text-black">
                  {(() => {
                    const gpaRaw = edu.gpa.trim();
                    const isCw = /^coursework/i.test(gpaRaw);
                    const clean = gpaRaw.replace(/^(gpa|coursework)[:\s]*/i, "");
                    const label = isCw ? "Coursework:" : "GPA:";
                    return (
                      <>
                        <span className="font-medium">{label}</span>{" "}
                        {renderFormattedText(clean || gpaRaw)}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : isFaangpath ? (
            // faangpath.tex: {\bf DEGREE - FIELD}, INSTITUTION \hfill {dates} [+ GPA}
            <div key={i}>
              <div className="flex justify-between items-baseline">
                <span className="font-bold">
                  {edu.degree}
                  {edu.field ? ` - ${edu.field}` : ""}
                  {edu.institution ? `, ${edu.institution}` : ""}
                </span>
                <span className="text-sm whitespace-nowrap">
                  {dateRange(edu.startDate, edu.endDate)}
                </span>
              </div>
              {edu.gpa && <div className="text-sm">GPA: {edu.gpa}</div>}
            </div>
          ) : isPremium ? (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline font-bold text-xs sm:text-sm text-black">
                <span>{edu.institution}</span>
                <span className="italic font-normal">{edu.location}</span>
              </div>
              <div className="flex justify-between items-baseline italic text-[11px] sm:text-xs text-black">
                <span>
                  {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                  {edu.gpa ? ` -- GPA: ${edu.gpa}` : ""}
                </span>
                <span className="not-italic">
                  {dateRangeEmDash(edu.startDate, edu.endDate)}
                </span>
              </div>
            </div>
          ) : (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline font-bold text-xs sm:text-sm text-black">
                <span>{edu.institution}</span>
                <span className="font-normal">{edu.location}</span>
              </div>
              <div className="flex justify-between items-baseline italic text-[11px] sm:text-xs text-black">
                <span>
                  {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                  {edu.gpa ? ` -- GPA: ${edu.gpa}` : ""}
                </span>
                <span className="not-italic">
                  {dateRangeEmDash(edu.startDate, edu.endDate)}
                </span>
              </div>
            </div>
          ),
        )}
      </div>,
    );
  };

  const renderSkills = () => {
    if (!data.skills?.length || !data.skills.some((s) => s.category)) return null;
    return renderSection(
      "Technical Skills",
      isDeveloper ? (
        <ul className="list-disc ml-3.5 space-y-0.5 text-[10px] sm:text-[10.5px] leading-tight">
          {data.skills.map((skill, i) => (
            <li key={i}>
              <span className="font-bold">{skill.category}:</span>{" "}
              {parseList(skill.skills).join(", ")}
            </li>
          ))}
        </ul>
      ) : isFaangpath ? (
        // faangpath.tex: tabular — bold category column, skills to the right
        <div className="text-sm">
          {data.skills.map((skill, i) => (
            <div key={i} className="flex gap-x-6 items-baseline">
              <span className="font-bold shrink-0">{skill.category}</span>
              <span>{parseList(skill.skills).join(", ")}</span>
            </div>
          ))}
        </div>
      ) : (
        <ul
          className={`text-xs text-black space-y-0.5 ${
            isPremium ? "list-disc ml-4" : ""
          }`}
        >
          {data.skills.map((skill, i) => (
            <li key={i}>
              <span className="font-bold">{skill.category}:</span>{" "}
              {parseList(skill.skills).join(", ")}
            </li>
          ))}
        </ul>
      ),
    );
  };

  const renderExperience = () => {
    if (!data.experience?.length || !data.experience.some((e) => e.company)) {
      return null;
    }
    return renderSection(
      "Experience",
      <div className={isDeveloper ? "space-y-1.5" : isFaangpath ? "space-y-2" : "space-y-3"}>
        {data.experience.map((exp, i) => (
          <div key={i}>
            {isDeveloper ? (
              <>
                <div className="flex justify-between items-baseline font-bold text-[10.5px] sm:text-[11.5px] text-black">
                  <span>{exp.company}</span>
                  <span className="font-normal">{exp.location}</span>
                </div>
                <div className="flex justify-between items-baseline italic text-[10px] sm:text-[10.5px] text-black mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span>{exp.position}</span>
                    {exp.isCurrent && (
                      <span className="not-italic inline-flex items-center px-1 py-0.2 rounded text-[9px] font-medium bg-emerald-100 text-emerald-700">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="not-italic">
                    {dateRangeEmDash(exp.startDate, exp.endDate, exp.isCurrent)}
                  </span>
                </div>
                <ul className="list-disc ml-3.5 space-y-0.5 text-[10px] sm:text-[10.5px] leading-tight text-justify text-black">
                  {parseDescription(exp.description).map((desc, j) => (
                    <li key={j}>
                      {renderFormattedText(desc)}
                    </li>
                  ))}
                </ul>
              </>
            ) : isFaangpath ? (
              // faangpath.tex: \textbf{POSITION} \hfill dates \\ COMPANY \hfill \textit{location}
              <>
                <div className="flex justify-between items-baseline">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{exp.position}</span>
                    {exp.isCurrent && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-sm whitespace-nowrap">
                    {dateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span>{exp.company}</span>
                  {exp.location && (
                    <span className="italic text-sm">{exp.location}</span>
                  )}
                </div>
                <ul className="list-disc list-outside ml-4 text-sm space-y-0.5">
                  {parseDescription(exp.description).map((desc, j) => (
                    <li key={j} className="text-justify">
                      {renderFormattedText(desc)}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              // classic.tex & premium.tex: tabular alignment
              <>
                <div className="flex justify-between items-baseline font-bold text-xs sm:text-sm text-black">
                  <span>{exp.company}</span>
                  <span className={isPremium ? "italic font-normal" : "font-normal"}>{exp.location}</span>
                </div>
                <div className="flex justify-between items-baseline italic text-[11px] sm:text-xs text-black mb-1">
                  <div className="flex items-center gap-2">
                    <span>{exp.position}</span>
                    {exp.isCurrent && (
                      <span className="not-italic inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="not-italic">
                    {dateRangeEmDash(exp.startDate, exp.endDate, exp.isCurrent)}
                  </span>
                </div>
                <ul
                  className={`list-disc list-outside ml-4 text-sm ${
                    isPremium ? "space-y-0.5" : "space-y-1"
                  }`}
                >
                  {parseDescription(exp.description).map((desc, j) => (
                    <li key={j} className="text-justify">
                      {renderFormattedText(desc)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>,
    );
  };

  const renderProjects = () => {
    if (!data.projects?.length || !data.projects.some((p) => p.name)) return null;

    // Template link labels mirror each .tex (\footnotesize{\scriptsize...})
    const sourceLabel = isPremium ? "[Source Code]" : "[Source]";
    const demoLabel = isPremium || isFaangpath ? "[Live Demo]" : "[Demo]";

    const renderProjectLinks = (proj: ResumeData["projects"][number]) => {
      const links = [];
      const src = sanitizeUrl(proj.sourceCode);
      const live = sanitizeUrl(proj.liveUrl);
      if (src) {
        links.push(
          <a
            key="src"
            href={src}
            className="text-[10px] text-blue-800 hover:underline"
          >
            {sourceLabel}
          </a>,
        );
      }
      if (live) {
        if (links.length > 0 && (isPremium || isFaangpath)) links.push(<span key="sep"> | </span>);
        links.push(
          <a
            key="live"
            href={live}
            className="text-[10px] text-blue-800 hover:underline"
          >
            {demoLabel}
          </a>,
        );
      }
      return links.length > 0 ? links : null;
    };

    return renderSection(
      "Projects",
      <div className="space-y-2">
        {data.projects.map((proj, i) => (
          <div key={i}>
            {isFaangpath ? (
              // faangpath.tex: {\bf NAME}. DESCRIPTION \newline *Technologies* \hfill [links]
              <>
                <div className="font-bold text-md">
                  {proj.name}
                  {proj.description && (
                    <span className="font-normal">. {proj.description}</span>
                  )}
                </div>
                {parseList(proj.technologies).length > 0 && (
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="italic">
                      Technologies: {parseList(proj.technologies).join(", ")}
                    </span>
                    <div className="flex gap-1 whitespace-nowrap text-[10px]">
                      {renderProjectLinks(proj)}
                    </div>
                  </div>
                )}
              </>
            ) : isDeveloper ? (
              // developer.tex: \noindent\textbf{NAME} \hfill GitHub | Live \\ \textit{Technologies} \\ bullet items
              <>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-[10.5px] sm:text-[11.5px] text-black">
                    {proj.name}
                  </h3>
                  <div className="flex gap-1.5 whitespace-nowrap text-[10px]">
                    {proj.sourceCode && (
                      <a href={sanitizeUrl(proj.sourceCode)} target="_blank" rel="noreferrer" className="text-[#0000ee] hover:underline">
                        GitHub
                      </a>
                    )}
                    {proj.sourceCode && proj.liveUrl && <span className="text-black">|</span>}
                    {proj.liveUrl && (
                      <a href={sanitizeUrl(proj.liveUrl)} target="_blank" rel="noreferrer" className="text-[#0000ee] hover:underline">
                        Live
                      </a>
                    )}
                  </div>
                </div>
                {parseList(proj.technologies).length > 0 && (
                  <div className="italic text-[10px] sm:text-[10.5px] text-black mb-0.5">
                    {parseList(proj.technologies).join(", ")}
                  </div>
                )}
                {proj.description && (
                  <ul className="list-disc ml-3.5 text-[10px] sm:text-[10.5px] space-y-0.5 text-black">
                    {proj.description.split("\n").filter(Boolean).map((d, idx) => (
                      <li key={idx} className="text-justify leading-tight">
                        {renderFormattedText(d)}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : isPremium ? (
              // premium.tex: {\bf NAME} | {\it technologies} \hfill [links] \\ bullet description
              <>
                <div className="flex justify-between items-baseline text-md">
                  <h3 className="font-bold text-md">
                    {proj.name}
                    {parseList(proj.technologies).length > 0 && (
                      <span className="font-normal text-sm ml-2">
                        | <i>{parseList(proj.technologies).join(", ")}</i>
                      </span>
                    )}
                  </h3>
                  {renderProjectLinks(proj) && (
                    <div className="flex gap-1 whitespace-nowrap text-[10px]">
                      {renderProjectLinks(proj)}
                    </div>
                  )}
                </div>
                {proj.description && (
                  <ul className="list-disc ml-4 text-sm space-y-0.5">
                    <li className="text-justify">{proj.description}</li>
                  </ul>
                )}
              </>
            ) : (
              // classic.tex: {\bf NAME} -- DESCRIPTION \newline {\it Technologies} \hfill [links]
              <>
                <div className="font-bold text-md">
                  {proj.name}
                  {proj.description && (
                    <span className="font-normal"> -- {proj.description}</span>
                  )}
                </div>
                {parseList(proj.technologies).length > 0 && (
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="italic">
                      Technologies: {parseList(proj.technologies).join(", ")}
                    </span>
                    <div className="flex gap-1 whitespace-nowrap text-[10px]">
                      {renderProjectLinks(proj)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>,
    );
  };

  const renderCertifications = () => {
    if (!data.certifications?.length || !data.certifications.some((c) => c.name)) {
      return null;
    }
    return renderSection(
      "Certifications",
      <ul className="text-sm list-disc ml-4 space-y-0.5">
        {data.certifications.map((cert, i) => (
          <li key={i}>
            <span className="font-bold">{cert.name}</span>{" "}
            {cert.issuer && <span>({cert.issuer})</span>}
            {cert.date && <span> — {cert.date}</span>}
          </li>
        ))}
      </ul>,
    );
  };

  const renderContent = () => {
    const order =
      data.sectionOrder && data.sectionOrder.length > 0
        ? data.sectionOrder
        : [
            "summary",
            "experience",
            "education",
            "skills",
            "projects",
            "certifications",
          ];

    const byKey: Record<string, React.ReactNode> = {
      summary:
        data.summary &&
        renderSection(
          "Professional Summary",
          <p
            className={`text-justify ${
              isDeveloper
                ? "text-[10px] sm:text-[10.5px] leading-tight"
                : isPremium
                  ? "leading-snug"
                  : ""
            }`}
          >
            {renderFormattedText(data.summary)}
          </p>,
        ),
      experience: renderExperience(),
      education: renderEducation(),
      skills: renderSkills(),
      projects: renderProjects(),
      certifications: renderCertifications(),
    };

    return (
      <>
        {order.map((key, i) =>
          byKey[key] ? (
            <div key={`${key}-${i}`}>{byKey[key]}</div>
          ) : null,
        )}
      </>
    );
  };

  // The sheet is exactly one A4 page tall and scrolls internally, so "does the
  // resume spill onto a second page?" is directly readable from the DOM: any
  // scroll overflow past the sheet means the LaTeX compile yields 2+ pages.
  // MutationObserver catches every keystroke-driven content change (ResizeObserver
  // can't — the sheet's own box never changes when only its content grows),
  // and the rAF coalesces the forced layout out of the hot keystroke path.
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exceedsOnePage, setExceedsOnePage] = useState(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setExceedsOnePage(sheet.scrollHeight - sheet.clientHeight > 8);
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sheet);
    const mo = new MutationObserver(measure);
    mo.observe(sheet, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const containerStyle = isDeveloper
    ? developerContainerStyle
    : isPremium
      ? premiumContainerStyle
      : isFaangpath
        ? faangpathContainerStyle
        : classicContainerStyle;

  // Padding mirrors each template's LaTeX margins, expressed as a PERCENTAGE of
  // the sheet width instead of absolute CSS inches. The preview is not 1:1 — the
  // sheet stands in for 8.5in at whatever width it renders — so an inch-based
  // padding of 0.75in (=108px) reserved ~19% of the desktop sheet where the real
  // page reserves 8.8%, and on a 311px mobile sheet it ate ~70% of the width,
  // leaving an unreadable text column. Percentage padding resolves against width
  // for all four sides, which is exactly right: vertical margins scale with the
  // same factor as horizontal ones, so the box stays proportional at every size.
  const paddingClass = isDeveloper
    ? "px-[5.44%] pt-[5.44%] pb-[2.05%]" // 0.45in sides/top, 0.17in bottom of 8.27in (A4)
    : isPremium
      ? "px-[5.88%] py-[4.12%]" // 0.5in sides, 0.35in top/bottom of 8.5in
      : isFaangpath
        ? "p-[4.71%]" // 0.4in of 8.5in
        : "p-[8.82%]"; // 0.75in of 8.5in

  // A literal 11pt (14.7px) assumes 96 CSS px/inch, but the preview
  // sheet renders at ~66px/inch (560px wide for 8.5in), so 11pt should be ~10px.
  // The old ladder made the preview look ~40% zoomed — content appeared to
  // overflow onto page 2 well before the compiled PDF actually did. Keep the text
  // near its true rendered size, with a 10px readability floor on narrow screens
  // (where the true size would be ~5.6px, unusable). Per-template differences are
  // ≤1pt — imperceptible at preview scale, so one ladder serves all three.
  const fontSizeClass = "text-[10px] sm:text-[11px] md:text-[12px] lg:text-[12.5px]";

  return (
    <div
      className={`relative bg-white shadow-2xl transition-all duration-300 ${className}`}
      style={{ aspectRatio: "1 / 1.414" }}
    >
      {/* Page-1 boundary marker: the sheet's bottom edge IS the page break, so
          a badge anchored there shows exactly where page 2 starts. */}
      {exceedsOnePage && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center">
          <span
            role="status"
            className="rounded-t-md bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow-md"
          >
            ⚠ Continues onto page 2
          </span>
        </div>
      )}

      {/* Container */}
      <div
        ref={sheetRef}
        className={`w-full h-full overflow-y-auto overflow-x-hidden text-black leading-normal ${paddingClass} ${fontSizeClass}`}
        style={containerStyle}
      >
        {renderHeader()}
        {renderContent()}
      </div>
    </div>
  );
};

export default ResumePreview;