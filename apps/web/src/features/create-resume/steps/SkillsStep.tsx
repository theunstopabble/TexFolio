import { CARD_CLASS, HEADING_ROW_CLASS, ERROR_CLASS } from "../../resume-editor/components/sections/formStyles";
import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  UseFieldArrayReturn,
  FieldErrors,
} from "react-hook-form";
import type { ResumeFormData } from "../../resume-editor/types";
import { requireIfStarted } from "../entryValidation";
import TagChips from "../../resume-editor/components/TagChips";

interface SkillsStepProps {
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
  fieldArray: UseFieldArrayReturn<ResumeFormData, "skills", "id">;
  errors: FieldErrors<ResumeFormData>;
}

const suggestedCategories = [
  "Languages",
  "Frameworks",
  "Databases",
  "Tools",
  "Cloud",
  "Soft Skills",
];

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  Languages: [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "Go", "Rust", "SQL", "HTML/CSS", "PHP", "Ruby", "Kotlin", "Swift"
  ],
  Frameworks: [
    "React", "Next.js", "Node.js", "Express.js", "Tailwind CSS", "Vue.js", "Django", "FastAPI", "Spring Boot", "NestJS", "Redux", "GraphQL"
  ],
  Databases: [
    "PostgreSQL", "MongoDB", "MySQL", "Redis", "SQLite", "Supabase", "Firebase", "DynamoDB", "Prisma", "Mongoose"
  ],
  Tools: [
    "Git", "GitHub", "Docker", "Kubernetes", "Postman", "Linux", "VS Code", "Vite", "Webpack", "Jira", "Figma", "CI/CD"
  ],
  Cloud: [
    "AWS", "Google Cloud (GCP)", "Azure", "Vercel", "Render", "Cloudflare", "Netlify", "Heroku"
  ],
  "Soft Skills": [
    "Problem Solving", "Team Leadership", "Agile / Scrum", "Communication", "Time Management", "Code Review", "Mentoring"
  ],
};

const getSuggestionsForCategory = (catName: string): string[] => {
  const trimmed = (catName || "").trim().toLowerCase();
  if (trimmed.includes("lang")) return CATEGORY_SUGGESTIONS["Languages"];
  if (trimmed.includes("frame") || trimmed.includes("lib")) return CATEGORY_SUGGESTIONS["Frameworks"];
  if (trimmed.includes("data") || trimmed.includes("db") || trimmed.includes("sql")) return CATEGORY_SUGGESTIONS["Databases"];
  if (trimmed.includes("tool") || trimmed.includes("devops")) return CATEGORY_SUGGESTIONS["Tools"];
  if (trimmed.includes("cloud") || trimmed.includes("infra") || trimmed.includes("aws")) return CATEGORY_SUGGESTIONS["Cloud"];
  if (trimmed.includes("soft")) return CATEGORY_SUGGESTIONS["Soft Skills"];

  return [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "Git", "Docker", "AWS", "Tailwind CSS", "PostgreSQL", "Next.js"
  ];
};

const SkillsStep: React.FC<SkillsStepProps> = ({
  register,
  watch,
  setValue,
  fieldArray,
  errors,
}) => (
  <div className={`${CARD_CLASS} animate-fade-in`}>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <h2 className={HEADING_ROW_CLASS}>🛠️ Skills</h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            fieldArray.append({ category: "", skills: [] })
          }
          className="btn btn-secondary text-sm"
        >
          + Add Category
        </button>
      </div>
    </div>

    {/* Quick add category presets */}
    <div className="flex flex-wrap items-center gap-1.5 mb-6 text-xs text-slate-500">
      <span className="font-medium text-slate-600 mr-1">Quick Add:</span>
      {suggestedCategories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => {
            const emptyIndex = fieldArray.fields.findIndex(
              (_, idx) => !watch(`skills.${idx}.category` as `skills.${number}.category`)?.trim(),
            );
            if (emptyIndex !== -1) {
              setValue(`skills.${emptyIndex}.category` as `skills.${number}.category`, cat, {
                shouldDirty: true,
                shouldValidate: true,
              });
            } else {
              fieldArray.append({ category: cat, skills: [] });
            }
          }}
          className="px-2.5 py-1 rounded-md border bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors text-xs font-medium cursor-pointer"
        >
          + {cat}
        </button>
      ))}
    </div>

    <div className="space-y-4">
      {fieldArray.fields.map((field, index) => {
        const category = errors.skills?.[index]?.category;
        const currentCat = watch(`skills.${index}.category` as `skills.${number}.category`) || "";
        const rawSkills = watch(`skills.${index}.skills` as `skills.${number}.skills`);
        const skillsValue = Array.isArray(rawSkills)
          ? rawSkills.join(", ")
          : rawSkills || "";
        const skillsCount = skillsValue
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean).length;
        const categorySuggestions = getSuggestionsForCategory(currentCat);

        return (
          <div
            key={field.id}
            className="p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-slate-700">
                Skill Category #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => fieldArray.remove(index)}
                className="text-red-600 hover:text-red-700 text-sm font-medium p-1 -m-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <input
                  id={`crt-skill-category-${index}`}
                  {...register(`skills.${index}.category`, {
                    validate: requireIfStarted(
                      "skills",
                      index,
                      "Category is required",
                    ),
                  })}
                  className="form-input"
                  placeholder="Category (e.g. Languages, Frameworks)"
                  aria-invalid={!!category || undefined}
                  aria-describedby={
                    category ? `crt-skill-category-${index}-err` : undefined
                  }
                />
                {category && (
                  <p
                    id={`crt-skill-category-${index}-err`}
                    role="alert"
                    className={ERROR_CLASS}
                  >
                    {category.message || "Category is required"}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-slate-400">Suggestions:</span>
                  {suggestedCategories.slice(0, 4).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setValue(`skills.${index}.category` as `skills.${number}.category`, cat, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <TagChips
                  id={`crt-skill-list-${index}`}
                  error={false}
                  value={skillsValue}
                  onChange={(val) =>
                    setValue(
                      `skills.${index}.skills` as unknown as `skills.${number}.skills`,
                      val as unknown as string[],
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    )
                  }
                  suggestions={categorySuggestions}
                  placeholder="Type skills (press comma or Enter to add)"
                  ariaDescribedBy={`crt-skill-list-${index}-help`}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span className="font-medium text-slate-600">
                  {skillsCount} {skillsCount === 1 ? "skill" : "skills"} added
                </span>
              </div>
            </div>
          </div>
        );
      })}
      {fieldArray.fields.length === 0 && (
        <p className="text-center text-slate-500 py-4">
          No skills added yet. Click &quot;+ Add Category&quot; to begin.
        </p>
      )}
    </div>
  </div>
);

export default SkillsStep;
