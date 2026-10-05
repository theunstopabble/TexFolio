import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldErrors,
} from "react-hook-form";
import type { ResumeFormData } from "../../types";
import {
  SECTION_WRAPPER_CLASS,
  CARD_CLASS,
  HEADING_CLASS,
  BODY_CLASS,
  ADD_ROW_CLASS,
  ADD_BTN_CLASS,
  ENTRY_LIST_CLASS,
  ENTRY_CARD_CLASS,
  ENTRY_GRID_CLASS,
  REMOVE_ROW_CLASS,
  REMOVE_BTN_CLASS,
  EMPTY_CLASS,
  TIP_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  ERROR_CLASS,
  inputError,
} from "./formStyles";
import TagChips from "../TagChips";

interface SkillsSectionProps {
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  skillFields: FieldArrayWithId<ResumeFormData, "skills", "id">[];
  appendSkill: UseFieldArrayAppend<ResumeFormData, "skills">;
  removeSkill: UseFieldArrayRemove;
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

export const SkillsSection = ({
  register,
  watch,
  setValue,
  errors,
  skillFields,
  appendSkill,
  removeSkill,
}: SkillsSectionProps) => (
  <div className={SECTION_WRAPPER_CLASS}>
    <div className={CARD_CLASS}>
      <h2 className={HEADING_CLASS}>🛠️ Skills</h2>

      <div className={BODY_CLASS}>
        <div className={ADD_ROW_CLASS}>
          <button
            type="button"
            onClick={() => appendSkill({ category: "", skills: [] })}
            className={ADD_BTN_CLASS}
          >
            + Add Category
          </button>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-600 mr-1">Quick Add:</span>
            {suggestedCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  const emptyIndex = skillFields.findIndex(
                    (_, idx) => !watch(`skills.${idx}.category` as `skills.${number}.category`)?.trim(),
                  );
                  if (emptyIndex !== -1) {
                    setValue(`skills.${emptyIndex}.category` as `skills.${number}.category`, cat, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  } else {
                    appendSkill({ category: cat, skills: [] });
                  }
                }}
                className="px-2.5 py-1 rounded-md border bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors text-xs font-medium cursor-pointer"
              >
                + {cat}
              </button>
            ))}
          </div>
        </div>

        <div className={ENTRY_LIST_CLASS}>
          {skillFields.map((field, index) => {
            const categoryInvalid = !!errors.skills?.[index]?.category;
            const listInvalid = !!errors.skills?.[index]?.skills;

            // Reactive values from form state
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
                className={ENTRY_CARD_CLASS}
                role="group"
                aria-label={`Skill category ${index + 1}`}
              >
                <div className={ENTRY_GRID_CLASS}>
                  <div>
                    <label htmlFor={`skill-cat-${index}`} className={LABEL_CLASS}>
                      Category
                    </label>
                    <input
                      id={`skill-cat-${index}`}
                      {...register(`skills.${index}.category`, {
                        required: "Category is required",
                      })}
                      className={inputError(INPUT_CLASS, categoryInvalid)}
                      placeholder="e.g. Languages, Frameworks, Tools"
                      aria-invalid={categoryInvalid || undefined}
                      aria-describedby={
                        categoryInvalid ? `skill-cat-${index}-error` : undefined
                      }
                    />
                    {categoryInvalid && (
                      <p
                        id={`skill-cat-${index}-error`}
                        role="alert"
                        className={ERROR_CLASS}
                      >
                        {errors.skills?.[index]?.category?.message}
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
                    <label htmlFor={`skill-list-${index}`} className={LABEL_CLASS}>
                      Skills (comma separated)
                    </label>
                    <TagChips
                      id={`skill-list-${index}`}
                      error={listInvalid}
                      value={skillsValue}
                      onChange={(value) =>
                        setValue(
                          `skills.${index}.skills` as unknown as `skills.${number}.skills`,
                          value as unknown as string[],
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        )
                      }
                      suggestions={categorySuggestions}
                      placeholder="Type skills (press comma or Enter to add)"
                      ariaDescribedBy={`skill-list-${index}-help`}
                    />
                    {listInvalid && (
                      <p
                        id={`skill-list-${index}-error`}
                        role="alert"
                        className={ERROR_CLASS}
                      >
                        {errors.skills?.[index]?.skills?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className={REMOVE_ROW_CLASS}>
                  <span className="text-xs font-medium text-slate-600">
                    {skillsCount} {skillsCount === 1 ? "skill" : "skills"} added
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className={REMOVE_BTN_CLASS}
                    aria-label={`Remove skill category ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {skillFields.length === 0 && (
          <p className={EMPTY_CLASS}>
            No skills added yet. Click &quot;+ Add Category&quot; to list your skills.
          </p>
        )}

        <p className={TIP_CLASS}>
          💡 ATS tip: Use exact keywords from the job description (e.g. &quot;React&quot;
          not &quot;ReactJS&quot;) and group related skills together.
        </p>
      </div>
    </div>
  </div>
);
