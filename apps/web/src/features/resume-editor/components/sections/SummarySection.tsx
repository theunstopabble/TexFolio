import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { ResumeFormData } from "../../types";
import { AIWriterButton } from "../AIWriterButton";

interface SummarySectionProps {
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
}

export const SummarySection = ({
  register,
  watch,
  setValue,
}: SummarySectionProps) => (
  <div className="card shadow-lg p-6 bg-white rounded-xl">
    <h2 className="card-title mb-4 text-xl font-bold">
      📝 Professional Summary
    </h2>
    <AIWriterButton
      type="improve"
      originalText={watch("summary")}
      onResult={(text) => setValue("summary", text, { shouldDirty: true })}
    />
    <label htmlFor="summary" className="sr-only">Professional Summary</label>
    <textarea
      id="summary"
      {...register("summary")}
      className="form-input w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
      placeholder="Write a brief professional summary..."
    />
  </div>
);
