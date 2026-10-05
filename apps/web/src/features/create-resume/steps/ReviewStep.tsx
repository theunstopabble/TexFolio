import { CARD_CLASS, HEADING_CLASS } from "../../resume-editor/components/sections/formStyles";
import { PLATFORM_META, type ProfilePlatform } from "@texfolio/shared";
import { survivingEntries } from "../entryValidation";
import type { ResumeFormData } from "../../resume-editor/types";

interface ReviewStepProps {
  formData: ResumeFormData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
  const { personalInfo, summary } = formData;
  // Exactly the entries `onSubmit` will send. The raw arrays include the blank
  // defaults the wizard starts with, so reviewing them showed a count like
  // "Education (1)" for an empty row — and a half-filled row too, which the
  // submit filter then discarded without a word.
  const education = survivingEntries("education", formData.education);
  const experience = survivingEntries("experience", formData.experience);
  const skills = survivingEntries("skills", formData.skills);
  const projects = survivingEntries("projects", formData.projects);
  const certifications = survivingEntries("certifications", formData.certifications);
  const profileLinks = survivingEntries("profileLinks", formData.profileLinks || []);
  // Everything clickable, in the order the header shows it.
  const contactLinks: { label: string; url: string }[] = [];
  if (personalInfo?.linkedin) contactLinks.push({ label: "LinkedIn", url: personalInfo.linkedin });
  if (personalInfo?.github) contactLinks.push({ label: "GitHub", url: personalInfo.github });
  if (personalInfo?.portfolio) contactLinks.push({ label: "Portfolio", url: personalInfo.portfolio });
  profileLinks.forEach((p) => {
    if (p.platform) {
      contactLinks.push({
        label: p.label || (PLATFORM_META[p.platform as ProfilePlatform]?.label ?? p.platform),
        url: p.url,
      });
    }
  });

  return (
    <div className={`${CARD_CLASS} animate-fade-in`}>
      <h2 className={HEADING_CLASS}>✅ Review Your Resume</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-700 mb-2">👤 Personal Information</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
            <p><span className="font-medium">Name:</span> {personalInfo?.fullName || "—"}</p>
            <p><span className="font-medium">Email:</span> {personalInfo?.email || "—"}</p>
            <p><span className="font-medium">Phone:</span> {personalInfo?.phone || "—"}</p>
            <p><span className="font-medium">Location:</span> {personalInfo?.location || "—"}</p>
            {contactLinks.map(({ label, url }) => (
              <p key={label} className="break-all">
                <span className="font-medium">{label}:</span>{" "}
                <span className="text-blue-700">{url}</span>
              </p>
            ))}
          </div>
        </div>
        {summary && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">📝 Summary</h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm whitespace-pre-wrap">{summary}</div>
          </div>
        )}
        {education.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">🎓 Education ({education.length})</h3>
            <div className="space-y-2">
              {education.map((e, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{e.institution || "—"}</p>
                  <p className="text-slate-600">{e.degree} {e.field && `- ${e.field}`}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {experience.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">💼 Experience ({experience.length})</h3>
            <div className="space-y-2">
              {experience.map((e, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{e.position || "—"} at {e.company || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {skills.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">🛠️ Skills ({skills.length} groups)</h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
              {skills.map((s, i) => (
                <p key={i}><span className="font-medium">{s.category}:</span> {Array.isArray(s.skills) ? s.skills.join(", ") : s.skills}</p>
              ))}
            </div>
          </div>
        )}
        {projects.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">🚀 Projects ({projects.length})</h3>
            <div className="space-y-2">
              {projects.map((p, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{p.name || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {certifications.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">🏆 Certifications ({certifications.length})</h3>
            <div className="space-y-2">
              {certifications.map((c, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{c.name || "—"}</p>
                  <p className="text-slate-600">{c.issuer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {(experience.length === 0 && education.length === 0 && skills.length === 0 && projects.length === 0 && certifications.length === 0 && !summary) && (
          <p className="text-center text-slate-500 py-4">No data entered yet. Fill in the previous steps to see a review here.</p>
        )}
      </div>
    </div>
  );
};

export default ReviewStep;
