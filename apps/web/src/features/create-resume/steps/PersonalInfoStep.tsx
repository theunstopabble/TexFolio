import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormGetValues,
  FieldErrors,
  UseFieldArrayReturn,
} from "react-hook-form";
import { isPhone, normalizeProfileLink } from "@texfolio/shared";
import type { ResumeFormData } from "../../resume-editor/types";
import { CARD_CLASS, HEADING_CLASS } from "../../resume-editor/components/sections/formStyles";
import { ProfileLinksEditor } from "../../resume-editor/components/ProfileLinksEditor";

interface PersonalInfoStepProps {
  register: UseFormRegister<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
  getValues: UseFormGetValues<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  profileLinks: UseFieldArrayReturn<ResumeFormData, "profileLinks", "id">;
}

// Error text: `text-red-600` (4.5:1) rather than red-500 (3.76:1), and `text-xs`
// to match the help/error ramp used by the editor sections.
const errClass = "mt-1 block text-xs text-red-600";

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  register,
  setValue,
  getValues,
  errors,
  profileLinks,
}) => {
  /** `gautam-kr` → `https://github.com/gautam-kr` on blur, so the user sees
   *  the real link before Next. The schema normalises the same way at write. */
  const normalizeField = (field: "linkedin" | "github") => () => {
    const raw = getValues(`personalInfo.${field}`);
    const normalized = normalizeProfileLink(field, raw);
    if (normalized !== raw) {
      setValue(`personalInfo.${field}`, normalized, { shouldDirty: true });
    }
  };

  return (
    <div className={`${CARD_CLASS} animate-fade-in`}>
      <h2 className={HEADING_CLASS}>👤 Personal Information</h2>
    <div className="space-y-4">
      <div className="form-group">
        <label htmlFor="crt-fullName" className="form-label">
          Full Name *
        </label>
        <input
          id="crt-fullName"
          {...register("personalInfo.fullName", { required: true })}
          className="form-input"
          placeholder="John Doe"
          aria-required="true"
          aria-invalid={!!errors.personalInfo?.fullName || undefined}
          aria-describedby={
            errors.personalInfo?.fullName ? "crt-fullName-err" : undefined
          }
        />
        {/* These three were `required` but rendered no message: the Next button
            simply did nothing, with nothing on screen to explain why. */}
        {errors.personalInfo?.fullName && (
          <span id="crt-fullName-err" role="alert" className={errClass}>
            {errors.personalInfo.fullName.message || "Required"}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="crt-email" className="form-label">
          Email *
        </label>
        <input
          id="crt-email"
          {...register("personalInfo.email", {
            required: true,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address",
            },
          })}
          type="email"
          className="form-input"
          placeholder="john@example.com"
          aria-required="true"
          aria-invalid={!!errors.personalInfo?.email || undefined}
          aria-describedby={
            errors.personalInfo?.email ? "crt-email-err" : "crt-email-help"
          }
        />
        {errors.personalInfo?.email && (
          <span id="crt-email-err" role="alert" className={errClass}>
            {errors.personalInfo.email.message || "Required"}
          </span>
        )}
        <span id="crt-email-help" className="mt-1 block text-xs text-slate-500">
          We&apos;ll never share your email with anyone else.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="crt-phone" className="form-label">
            Phone *
          </label>
          <input
            id="crt-phone"
            {...register("personalInfo.phone", {
              // One rule does both jobs: `isPhone("")` is false, so a blank
              // field reports the same message the schema would.
              validate: (v) =>
                isPhone(v || "") || "Enter a valid phone number (7-15 digits)",
            })}
            className="form-input"
            placeholder="+91..."
            inputMode="tel"
            aria-required="true"
            aria-invalid={!!errors.personalInfo?.phone || undefined}
            aria-describedby={
              errors.personalInfo?.phone ? "crt-phone-err" : undefined
            }
          />
          {errors.personalInfo?.phone && (
            <span id="crt-phone-err" role="alert" className={errClass}>
              {errors.personalInfo.phone.message || "Required"}
            </span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="crt-location" className="form-label">
            Location *
          </label>
          <input
            id="crt-location"
            {...register("personalInfo.location", { required: true })}
            className="form-input"
            placeholder="City, Country"
            aria-required="true"
            aria-invalid={!!errors.personalInfo?.location || undefined}
            aria-describedby={
              errors.personalInfo?.location ? "crt-location-err" : undefined
            }
          />
          {errors.personalInfo?.location && (
            <span id="crt-location-err" role="alert" className={errClass}>
              {errors.personalInfo.location.message || "Required"}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="crt-linkedin" className="form-label">
            LinkedIn
          </label>
          <input
            id="crt-linkedin"
            {...register("personalInfo.linkedin", {
              onBlur: normalizeField("linkedin"),
            })}
            className="form-input"
            placeholder="username"
            aria-invalid={!!errors.personalInfo?.linkedin || undefined}
            aria-describedby={
              errors.personalInfo?.linkedin ? "crt-linkedin-err" : undefined
            }
          />
          {errors.personalInfo?.linkedin && (
            <span id="crt-linkedin-err" role="alert" className={errClass}>
              {errors.personalInfo.linkedin.message || "Invalid link"}
            </span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="crt-github" className="form-label">
            GitHub
          </label>
          <input
            id="crt-github"
            {...register("personalInfo.github", {
              onBlur: normalizeField("github"),
            })}
            className="form-input"
            placeholder="username"
            aria-invalid={!!errors.personalInfo?.github || undefined}
            aria-describedby={
              errors.personalInfo?.github ? "crt-github-err" : undefined
            }
          />
          {errors.personalInfo?.github && (
            <span id="crt-github-err" role="alert" className={errClass}>
              {errors.personalInfo.github.message || "Invalid link"}
            </span>
          )}
        </div>
      </div>

      <ProfileLinksEditor
        register={register}
        setValue={setValue}
        getValues={getValues}
        errors={errors}
        fields={profileLinks.fields}
        append={profileLinks.append}
        remove={profileLinks.remove}
      />
    </div>
  </div>
  );
};

export default PersonalInfoStep;
