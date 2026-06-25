import type { ResumeFormData } from "../../resume-editor/types";

interface ReviewStepProps {
  formData: ResumeFormData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
  const { personalInfo, summary, experience, education, skills, projects, certifications } = formData;

  return (
    <div className="card animate-fade-in shadow-lg">
      <h2 className="card-title mb-6">✅ Review Your Resume</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-slate-700 mb-2">👤 Personal Information</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
            <p><span className="font-medium">Name:</span> {personalInfo?.fullName || "—"}</p>
            <p><span className="font-medium">Email:</span> {personalInfo?.email || "—"}</p>
            <p><span className="font-medium">Phone:</span> {personalInfo?.phone || "—"}</p>
            <p><span className="font-medium">Location:</span> {personalInfo?.location || "—"}</p>
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
