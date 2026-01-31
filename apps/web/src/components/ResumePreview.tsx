import React from "react";

// Types (Mirrors the form data structure)
interface ResumeData {
  title: string;
  templateId: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: {
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string[] | string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    location: string;
    startDate: string;
    endDate: string;
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
    issuer: string;
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

  // Helper to format dates (YYYY-MM -> Mon YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    if (!year || !month) return dateStr;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  // Template Styles
  const isPremium = data.templateId === "premium";

  // CLASSIC: Standard simple Resume (Previous default)
  // PREMIUM: The user's specific LaTeX format (Times, Small Caps, Tight Margins)

  const containerStyle = isPremium
    ? {
        fontFamily: "'Times New Roman', Times, serif",
        // padding: "0.35in 0.5in", // Moved to class for responsiveness
        color: "#000",
        lineHeight: "1.3",
      }
    : {
        fontFamily: "'Times New Roman', Times, serif",
      };

  const paddingClass = isPremium ? "p-4 sm:p-8 md:p-[0.5in]" : "p-[8%]"; // Classic uses relative padding

  // Scale down font on mobile to simulate A4 look
  const fontSizeClass = isPremium
    ? "text-[10px] sm:text-[11px] md:text-[10pt]"
    : "text-xs sm:text-sm";

  const headerStyle = isPremium
    ? "text-center pb-2 mb-2" // LaTeX Header
    : "text-center border-b-2 border-slate-800 pb-4 mb-4"; // Classic Header

  const nameStyle = isPremium
    ? "text-3xl font-bold tracking-wide mb-1" // LaTeX Name (Title Case as per snippet)
    : "text-3xl font-bold uppercase tracking-wider mb-2"; // Classic Name

  const sectionHeaderStyle = isPremium
    ? "text-lg font-bold uppercase border-b border-black mb-2 mt-4 flex items-center pt-2" // LaTeX Section
    : "text-sm font-bold uppercase border-b border-slate-300 mb-2 mt-4"; // Classic Section

  return (
    <div
      className={`bg-white shadow-2xl transition-all duration-300 ${className}`}
      style={{ aspectRatio: "1 / 1.414" }}
    >
      {/* Container */}
      <div
        className={`w-full h-full overflow-hidden text-slate-900 leading-normal ${paddingClass} ${fontSizeClass}`}
        style={containerStyle}
      >
        {/* Header */}
        <div className={headerStyle}>
          <h1 className={nameStyle}>
            {data.personalInfo.fullName || "Your Name"}
          </h1>

          {/* LaTeX Style Location (Premium) */}
          {isPremium && (
            <div className="text-sm mb-1">{data.personalInfo.location}</div>
          )}

          <div
            className={`text-sm flex flex-wrap justify-center gap-x-2 text-slate-700`}
          >
            {data.personalInfo.email && (
              <>
                <a
                  href={`mailto:${data.personalInfo.email}`}
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

            {data.personalInfo.linkedin && (
              <>
                <a
                  href={data.personalInfo.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  linkedin
                </a>
                {data.personalInfo.github && <span>|</span>}
              </>
            )}
            {data.personalInfo.github && (
              <a
                href={data.personalInfo.github}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                github
              </a>
            )}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="mb-3">
            {/* Premium uses Small Caps */}
            <h2
              className={sectionHeaderStyle}
              style={isPremium ? { fontVariant: "small-caps" } : {}}
            >
              Professional Summary
            </h2>
            {/* Premium is tighter/justified */}
            <p className={`text-justify ${isPremium ? "leading-snug" : ""}`}>
              {data.summary}
            </p>
          </div>
        )}

        {/* Education */}
        {data.education?.length > 0 && data.education[0].institution && (
          <div className="mb-3">
            <h2
              className={sectionHeaderStyle}
              style={isPremium ? { fontVariant: "small-caps" } : {}}
            >
              Education
            </h2>
            <div className={`space-y-2 ${!isPremium ? "mt-2" : ""}`}>
              {data.education.map((edu, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline md:flex-row flex-col">
                    <h3 className="font-bold text-md">{edu.institution}</h3>
                    <span
                      className={`italic ${isPremium ? "text-sm" : "text-xs"}`}
                    >
                      {/* Premium puts location on right, Classic puts text-xs */}
                      {isPremium
                        ? edu.location
                        : formatDate(edu.startDate) +
                          " – " +
                          (edu.endDate ? formatDate(edu.endDate) : "Present")}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline md:flex-row flex-col">
                    <span className="italic text-sm">
                      {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                    </span>
                    <span className="text-sm">
                      {/* Premium puts Date on Right, Classic puts GPA/Extra here */}
                      {isPremium ? (
                        <>
                          {formatDate(edu.startDate)} –{" "}
                          {edu.endDate ? formatDate(edu.endDate) : "Present"}
                        </>
                      ) : (
                        edu.gpa && <span>GPA: {edu.gpa}</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills?.length > 0 && data.skills[0].category && (
          <div className="mb-3">
            <h2
              className={sectionHeaderStyle}
              style={isPremium ? { fontVariant: "small-caps" } : {}}
            >
              Technical Skills
            </h2>
            <ul className="text-sm list-disc ml-4 space-y-0.5">
              {data.skills.map((skill, i) => (
                <li key={i}>
                  <span className="font-bold">{skill.category}:</span>{" "}
                  {parseList(skill.skills).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Experience */}
        {data.experience?.length > 0 && data.experience[0].company && (
          <div className="mb-3">
            <h2
              className={sectionHeaderStyle}
              style={isPremium ? { fontVariant: "small-caps" } : {}}
            >
              Experience
            </h2>
            <div className="space-y-3">
              {data.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-md">{exp.company}</h3>
                    {/* Premium: Location on right? No, standard LaTeX usually Date on right. */}
                    <span className="text-sm">
                      {isPremium
                        ? formatDate(exp.startDate) +
                          " – " +
                          (exp.endDate ? formatDate(exp.endDate) : "Present")
                        : exp.location}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline mb-1">
                    <span className="italic text-sm">{exp.position}</span>
                    <span className="text-sm italic">
                      {/* If Premium, Location here? */}
                      {isPremium ? exp.location : ""}
                    </span>
                  </div>

                  <ul
                    className={`list-disc list-outside ml-4 text-sm ${isPremium ? "space-y-0.5" : "space-y-1"}`}
                  >
                    {parseDescription(exp.description).map((desc, j) => (
                      <li key={j} className="text-justify">
                        {desc}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.projects?.length > 0 && data.projects[0].name && (
          <div className="mb-3">
            <h2
              className={sectionHeaderStyle}
              style={isPremium ? { fontVariant: "small-caps" } : {}}
            >
              Projects
            </h2>
            <div className="space-y-2">
              {data.projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-md cursor-pointer hover:text-blue-700">
                      {proj.name}
                      <span className="font-normal text-sm ml-2">
                        |{" "}
                        <i className="italic">
                          {parseList(proj.technologies).join(", ")}
                        </i>
                      </span>
                    </h3>
                    <div className="flex gap-2 text-sm">
                      {proj.sourceCode && (
                        <a
                          href={proj.sourceCode}
                          className="text-blue-800 hover:underline"
                        >
                          [Source Code]
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          className="text-blue-800 hover:underline"
                        >
                          [Live Demo]
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mt-0.5 text-justify">
                    {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications?.length > 0 && data.certifications[0].name && (
          <div className="mb-3">
            <h2
              className={sectionHeaderStyle}
              style={isPremium ? { fontVariant: "small-caps" } : {}}
            >
              Certifications
            </h2>
            <ul className="text-sm list-disc ml-4 space-y-0.5">
              {data.certifications.map((cert, i) => (
                <li key={i}>
                  <span className="font-bold">{cert.name}</span>{" "}
                  {cert.issuer && <span>({cert.issuer})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;
