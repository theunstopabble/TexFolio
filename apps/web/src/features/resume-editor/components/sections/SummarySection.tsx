import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import toast from "react-hot-toast";
import type { ResumeFormData } from "../../types";
import { AIWriterButton } from "../AIWriterButton";
import {
  SECTION_WRAPPER_CLASS,
  CARD_CLASS,
  HEADING_CLASS,
  BODY_CLASS,
  TEXTAREA_CLASS,
  LABEL_CLASS,
  TIP_CLASS,
} from "./formStyles";
import {
  MAX_SUMMARY_CHARS,
  RECOMMENDED_SUMMARY_CHARS,
  countWords,
} from "../../lib/resumePayload";

interface SummarySectionProps {
  register: UseFormRegister<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
}

const atsKeywords = [
  "leadership",
  "management",
  "communication",
  "analysis",
  "strategy",
  "execution",
  "optimization",
  "innovation",
  "development",
  "delivery",
];

export const SummarySection = ({
  register,
  setValue,
  watch,
}: SummarySectionProps) => {
  const summary = watch("summary") || "";
  const wordCount = countWords(summary);
  const charCount = summary.length;
  const keywordsFound = atsKeywords.filter((kw) =>
    summary.toLowerCase().includes(kw)
  ).length;
  const overRecommended = charCount > RECOMMENDED_SUMMARY_CHARS;

  const handleAIResult = (text: string) => {
    // maxLength only constrains typing, so clamp AI output too — otherwise a
    // long generation would be rejected by the API on save.
    if (text.length > MAX_SUMMARY_CHARS) {
      setValue("summary", text.slice(0, MAX_SUMMARY_CHARS), { shouldDirty: true });
      toast.error(`AI text was trimmed to the ${MAX_SUMMARY_CHARS} character limit.`);
      return;
    }
    setValue("summary", text, { shouldDirty: true });
  };

  return (
    <div className={SECTION_WRAPPER_CLASS}>
      <div className={CARD_CLASS}>
        <h2 className={HEADING_CLASS}>📝 Professional Summary</h2>

        <div className={BODY_CLASS}>
          <AIWriterButton type="improve" originalText={summary} onResult={handleAIResult} />

          <div>
            <label htmlFor="summary" className={LABEL_CLASS}>
              Professional Summary
            </label>

            <div className="space-y-3">
              <textarea
                id="summary"
                {...register("summary")}
                maxLength={MAX_SUMMARY_CHARS}
                className={`${TEXTAREA_CLASS} min-h-[200px]`}
                placeholder="Write a brief professional summary... (include keywords like: leadership, strategy, management, analysis)"
                rows={4}
              />

              {/* Counters: hard limit first, guidance second */}
              <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span className={overRecommended ? "text-amber-600 font-medium" : ""}>
                  {charCount}/{MAX_SUMMARY_CHARS} characters
                </span>
                <span>{wordCount} words</span>
              </div>
              <p className={TIP_CLASS}>
                {overRecommended
                  ? `Longer than the ${RECOMMENDED_SUMMARY_CHARS}-character recommendation — recruiters scan the first 2–3 lines.`
                  : `Aim for ${RECOMMENDED_SUMMARY_CHARS} characters or fewer (2–3 sentences).`}
              </p>

              {/* ATS Keyword Highlighting */}
              {keywordsFound > 0 && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-medium text-slate-600 mb-1">
                    📊 ATS Keyword Match: {keywordsFound}/{atsKeywords.length} common
                    keywords detected
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {atsKeywords.map((kw) => {
                      const found = summary.toLowerCase().includes(kw);
                      return (
                        <span
                          key={kw}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                            found
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {kw}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggested keywords if none found */}
              {keywordsFound === 0 && charCount > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Consider adding these ATS-friendly keywords: leadership, strategy,
                  management, analysis, communication, optimization.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
