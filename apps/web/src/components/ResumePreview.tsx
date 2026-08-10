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
  summary: string;
  experience: {
    company: string;
    position: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description: string[] | string;
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

  // Templates render dates as-is (raw YYYY-MM) feeding LaTeX directly via
  // escapeLatex — the live preview MUST show the same raw string to be faithful.
  const rawDate = (dateStr: string | undefined) => dateStr || "";
  const dateRange = (start?: string, end?: string) => {
    const s = rawDate(start);
    const e = rawDate(end);
    if (!s && !e) return "";
    return `${s} - ${e}`.replace(/ - $/, "");
  };
  const dateRangeEmDash = (start?: string, end?: string) => {
    const s = rawDate(start);
    const e = rawDate(end);
    if (!s && !e) return "";
    return `${s} – ${e}`.replace(/ – $/, "");
  };

  // Template Styles
  const isPremium = data.templateId === "premium";
  const isFaangpath = data.templateId === "faangpath";
  // classic (default) otherwise

  // ----- Classic: standard simple resume -----
  const classicContainerStyle = {
    fontFamily: "'Times New Roman', Times, serif",
    color: "#000",
    lineHeight: "1.3",
  };

  const classicHeader =
    "text-center border-b-2 border-slate-800 pb-4 mb-4";
  const classicName =
    "text-3xl font-bold tracking-wide mb-2"; // classic.tex: \Huge\bfseries (title case)
  const classicSection =
    "text-sm font-bold uppercase border-b border-slate-300 mb-2 mt-4";

  // ----- Premium: user's LaTeX format (Times, Small Caps, Tight Margins) -----
  const premiumContainerStyle = {
    fontFamily: "'Times New Roman', Times, serif",
    color: "#000",
    lineHeight: "1.3",
  };
  const premiumName = "text-3xl font-bold tracking-wide mb-1";
  const premiumSection =
    "text-lg font-bold uppercase border-b border-black mb-2 mt-4 flex items-center pt-2";

  // ----- FAANGPath: resume.cls — uppercase centered name, address lines, rSection headers -----
  const faangpathContainerStyle = {
    fontFamily: "'Times New Roman', Times, serif",
    color: "#000",
    lineHeight: "1.25",
  };
  const faangpathName =
    "text-3xl font-bold text-center uppercase tracking-wide mb-2"; // \printname → \MakeUppercase{\LARGE\bf}
  const faangpathAddress =
    "text-sm text-center flex justify-center gap-x-1.5 flex-wrap text-slate-800";
  const faangpathDiamond = "text-slate-500"; // address separation (like resume.cls \addressSep)
  const faangpathSection =
    "text-sm font-bold uppercase border-b border-black mb-2 mt-4 pt-2"; // rSection: \MakeUppercase{\bf} + \hrule

  const nameStyle = isPremium
    ? premiumName
    : isFaangpath
      ? faangpathName
      : classicName;
  const sectionHeaderStyle = isPremium
    ? premiumSection
    : isFaangpath
      ? faangpathSection
      : classicSection;
  const headerBottom = isPremium
    ? "text-center pb-2 mb-2"
    : isFaangpath
      ? "pb-3 mb-3"
      : classicHeader;

  const renderHeader = () => {
    if (isFaangpath) {
      // faangpath.tex: two \address lines, items joined by diamonds
      const addrOne = [
        data.personalInfo.phone,
        data.personalInfo.location,
      ].filter(Boolean);
      const addrTwo = [
        data.personalInfo.email,
        data.personalInfo.linkedin,
        data.personalInfo.github,
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

    // Premium bottom border free, classic has a border
    return (
      <div className={headerBottom}>
        <h1 className={nameStyle}>
          {data.personalInfo.fullName || "Your Name"}
        </h1>

        {isPremium && (
          <div className="text-sm mb-1">{data.personalInfo.location}</div>
        )}

        <div className="text-sm flex flex-wrap justify-center gap-x-2 text-slate-700">
          {data.personalInfo.email && (
            <>
              <a
                href={sanitizeUrl(`mailto:${data.personalInfo.email}`)}
                className="hover:underline"
              >
                {data.personalInfo.email}
              </a>
              {(data.personalInfo.phone ||
                data.personalInfo.linkedin ||
                data.personalInfo.github) && <span>|</span>}
            </>
          )}

          {data.personalInfo.phone && (
            <>
              <span>{data.personalInfo.phone}</span>
              {(data.personalInfo.linkedin || data.personalInfo.github) && (
                <span>|</span>
              )}
            </>
          )}

          {/* Standard Classic Location is inline */}
          {!isPremium && data.personalInfo.location && (
            <>
              <span>{data.personalInfo.location}</span>
              {(data.personalInfo.linkedin || data.personalInfo.github) && (
                <span>|</span>
              )}
            </>
          )}

          {sanitizeUrl(data.personalInfo.linkedin) && (
            <>
              <a
                href={sanitizeUrl(data.personalInfo.linkedin)}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                linkedin
              </a>
              {sanitizeUrl(data.personalInfo.github) && <span>|</span>}
            </>
          )}
          {sanitizeUrl(data.personalInfo.github) && (
            <a
              href={sanitizeUrl(data.personalInfo.github)}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              github
            </a>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    children: React.ReactNode,
    key?: number,
  ) => (
    <div key={key} className="mb-3">
      <h2
        className={sectionHeaderStyle}
        style={isPremium ? { fontVariant: "small-caps" } : {}}
      >
        {title}
      </h2>
      {children}
    </div>
  );

  const renderEducation = () => {
    if (!data.education?.length) return null;
    return renderSection(
      "Education",
      <div className={`space-y-2 ${!isPremium ? "mt-2" : ""}`}>
        {data.education.map((edu, i) =>
          isFaangpath ? (
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
            <div key={i}>
              <div className="flex justify-between items-baseline md:flex-row flex-col">
                <h3 className="font-bold text-md">{edu.institution}</h3>
                <span className="italic text-sm">{edu.location}</span>
              </div>
              <div className="flex justify-between items-baseline md:flex-row flex-col">
                <span className="italic text-sm">
                  {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                </span>
                <span className="text-sm">
                  {dateRangeEmDash(edu.startDate, edu.endDate)}
                </span>
              </div>
            </div>
          ) : (
            <div key={i}>
              <div className="flex justify-between items-baseline md:flex-row flex-col">
                <h3 className="font-bold text-md">{edu.institution}</h3>
                <span className="italic text-xs">
                  {dateRangeEmDash(edu.startDate, edu.endDate)}
                </span>
              </div>
              <div className="flex justify-between items-baseline md:flex-row flex-col">
                <span className="italic text-sm">
                  {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                </span>
                <span className="text-sm">{edu.gpa && `GPA: ${edu.gpa}`}</span>
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
      isFaangpath ? (
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
        <ul className="text-sm list-disc ml-4 space-y-0.5">
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
      <div className={isFaangpath ? "space-y-2" : "space-y-3"}>
        {data.experience.map((exp, i) => (
          <div key={i}>
            {isFaangpath ? (
              // faangpath.tex: \textbf{POSITION} \hfill dates \\ COMPANY \hfill \textit{location}
              <>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold">{exp.position}</span>
                  <span className="text-sm whitespace-nowrap">
                    {dateRange(exp.startDate, exp.endDate)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span>{exp.company}</span>
                  {exp.location && (
                    <span className="italic text-sm">{exp.location}</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-md">{exp.company}</h3>
                  <span className="text-sm">
                    {isPremium
                      ? dateRangeEmDash(exp.startDate, exp.endDate)
                      : exp.location}
                  </span>
                </div>

                <div className="flex justify-between items-baseline mb-1">
                  <span className="italic text-sm">{exp.position}</span>
                  <span className="text-sm italic">
                    {isPremium ? exp.location : ""}
                  </span>
                </div>
              </>
            )}

            <ul
              className={`list-disc list-outside ml-4 text-sm ${
                isFaangpath
                  ? "space-y-0.5"
                  : isPremium
                    ? "space-y-0.5"
                    : "space-y-1"
              }`}
            >
              {parseDescription(exp.description).map((desc, j) => (
                <li key={j} className="text-justify">
                  {desc}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>,
    );
  };

  const renderProjects = () => {
    if (!data.projects?.length || !data.projects.some((p) => p.name)) return null;
    return renderSection(
      "Projects",
      <div className={isFaangpath ? "space-y-2" : "space-y-2"}>
        {data.projects.map((proj, i) => (
          <div key={i}>
            <div className="flex justify-between items-baseline">
              <h3 className="font-bold text-md">
                {proj.name}
                <span className={`font-normal text-sm ml-2 ${isFaangpath ? "" : ""}`}>
                  |{" "}
                  <i className="italic">
                    {parseList(proj.technologies).join(", ")}
                  </i>
                </span>
              </h3>
              <div className="flex gap-2 text-sm whitespace-nowrap">
                {sanitizeUrl(proj.sourceCode) && (
                  <a
                    href={sanitizeUrl(proj.sourceCode)}
                    className="text-blue-800 hover:underline"
                  >
                    [Source Code]
                  </a>
                )}
                {sanitizeUrl(proj.liveUrl) && (
                  <a
                    href={sanitizeUrl(proj.liveUrl)}
                    className="text-blue-800 hover:underline"
                  >
                    [Live Demo]
                  </a>
                )}
              </div>
            </div>
            <p className="text-sm mt-0.5 text-justify">{proj.description}</p>
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
          <p className={`text-justify ${isPremium ? "leading-snug" : ""}`}>
            {data.summary}
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

  const containerStyle = isPremium
    ? premiumContainerStyle
    : isFaangpath
      ? faangpathContainerStyle
      : classicContainerStyle;

  // Padding mirrors each template's LaTeX margins:
  // faangpath 0.4in, premium 0.35in/0.5in, classic 0.75in
  const paddingClass = isPremium
    ? "p-4 sm:p-8 md:p-[0.35in] md:px-[0.5in]"
    : isFaangpath
      ? "p-[0.4in]"
      : "p-[0.75in]";

  // Scale down font on smaller screens; all templates render ~10-11pt in LaTeX
  const fontSizeClass = isPremium
    ? "text-[10px] sm:text-[11px] md:text-[10pt]"
    : isFaangpath
      ? "text-[10px] sm:text-[11px] md:text-[10.5pt]"
      : "text-xs sm:text-sm md:text-[11pt]";

  return (
    <div
      className={`bg-white shadow-2xl transition-all duration-300 ${className}`}
      style={{ aspectRatio: "1 / 1.414" }}
    >
      {/* Container */}
      <div
        className={`w-full h-full overflow-y-auto overflow-x-hidden text-slate-900 leading-normal ${paddingClass} ${fontSizeClass}`}
        style={containerStyle}
      >
        {renderHeader()}
        {renderContent()}
      </div>
    </div>
  );
};

export default ResumePreview;