import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  FieldErrors,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import { isPhone, normalizeProfileLink } from "@texfolio/shared";
import {
  SECTION_WRAPPER_CLASS,
  CARD_CLASS,
  HEADING_CLASS,
  BODY_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  ERROR_CLASS,
  HELP_CLASS,
  inputError,
} from "./formStyles";
import type { ResumeFormData } from "../../types";
import TemplateSelector from "../../../../components/TemplateSelector";
import { MAX_TITLE_CHARS } from "../../lib/resumePayload";
import { ProfileLinksEditor } from "../ProfileLinksEditor";

interface BasicInfoSectionProps {
  register: UseFormRegister<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
  getValues: UseFormGetValues<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  plFields: FieldArrayWithId<ResumeFormData, "profileLinks", "id">[];
  appendPl: UseFieldArrayAppend<ResumeFormData, "profileLinks">;
  removePl: UseFieldArrayRemove;
}

const formLabels = {
  title: "Resume Title",
  templateId: "Design Template",
  personalInfo: {
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    location: "Location",
    linkedin: "LinkedIn",
    github: "GitHub",
  },
};

export const BasicInfoSection = ({
  register,
  watch,
  setValue,
  getValues,
  errors,
  plFields,
  appendPl,
  removePl,
}: BasicInfoSectionProps) => {
  const titleInvalid = !!errors.title;
  const nameInvalid = !!errors.personalInfo?.fullName;
  const emailInvalid = !!errors.personalInfo?.email;
  const phoneInvalid = !!errors.personalInfo?.phone;
  const locationInvalid = !!errors.personalInfo?.location;
  const linkedinInvalid = !!errors.personalInfo?.linkedin;
  const githubInvalid = !!errors.personalInfo?.github;

  /** `gautam-kr` → `https://github.com/gautam-kr` on blur: the stored value is
   *  the canonical URL, and the user watches it become one. The schema runs
   *  the same normaliser at write for imported/legacy data. */
  const normalizeField = (field: "linkedin" | "github") => () => {
    const raw = getValues(`personalInfo.${field}`);
    const normalized = normalizeProfileLink(field, raw);
    if (normalized !== raw) {
      setValue(`personalInfo.${field}`, normalized, { shouldDirty: true });
    }
  };

  return (
    <div className={SECTION_WRAPPER_CLASS}>
      <div className={CARD_CLASS}>
        <h2 className={HEADING_CLASS}>📋 Resume Settings</h2>

        <div className={BODY_CLASS}>
          <div>
            <label htmlFor="resumeTitle" className={LABEL_CLASS}>
              {formLabels.title}
            </label>
            <input
              id="resumeTitle"
              {...register("title", {
                required: "Resume title is required",
                // The schema caps this at MAX_TITLE_CHARS; without the rule a
                // long title reached the API and came back as a 400.
                maxLength: {
                  value: MAX_TITLE_CHARS,
                  message: `Resume title is limited to ${MAX_TITLE_CHARS} characters`,
                },
              })}
              className={inputError(INPUT_CLASS, titleInvalid)}
              placeholder="e.g. Software Engineer Resume"
              maxLength={MAX_TITLE_CHARS}
              aria-required="true"
              aria-invalid={titleInvalid || undefined}
              /* Both nodes are referenced, but only while they exist — a static
                 `aria-describedby="title-help"` pointed at a paragraph that was
                 only rendered on error, a broken reference for screen readers. */
              aria-describedby={
                titleInvalid ? "title-error title-help" : "title-help"
              }
            />
            {titleInvalid && (
              <p id="title-error" role="alert" className={ERROR_CLASS}>
                {errors.title?.message}
              </p>
            )}
            <p id="title-help" className={HELP_CLASS}>
              Include job-title keywords (for example &quot;Full-Stack Developer&quot;)
              so the resume matches the roles you apply for.
            </p>
          </div>

          <div>
            <span id="template-label" className={LABEL_CLASS}>
              {formLabels.templateId}
            </span>
            {/* A <label> without a `for`/wrapped control announces nothing — this
                is a group of buttons, so label it as one. */}
            <div role="group" aria-labelledby="template-label">
              <TemplateSelector
                currentTemplate={watch("templateId")}
                onSelect={(id: string) => {
                  const event = {
                    target: { name: "templateId", value: id },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  register("templateId").onChange(event);
                }}
              />
            </div>
            <input type="hidden" {...register("templateId")} />
            <p className={HELP_CLASS}>
              Free templates are always available; premium templates require a Pro plan.
            </p>
          </div>
        </div>
      </div>

      <div className={CARD_CLASS}>
        <h2 className={HEADING_CLASS}>👤 Personal Information</h2>
        <div className={BODY_CLASS}>
          {/* Full name — full width on every breakpoint. */}
          <div>
            <label htmlFor="fullName" className={LABEL_CLASS}>
              {formLabels.personalInfo.fullName}
            </label>
            <input
              id="fullName"
              {...register("personalInfo.fullName", {
                required: "Full name is required",
              })}
              className={inputError(INPUT_CLASS, nameInvalid)}
              placeholder="e.g. John Doe"
              aria-required="true"
              aria-invalid={nameInvalid || undefined}
              aria-describedby={nameInvalid ? "fullName-error" : undefined}
            />
            {nameInvalid && (
              <p id="fullName-error" role="alert" className={ERROR_CLASS}>
                {errors.personalInfo?.fullName?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={LABEL_CLASS}>
              {formLabels.personalInfo.email}
            </label>
            <input
              id="email"
              {...register("personalInfo.email", {
                // `z.string().email()` rejects "" — the pattern alone let an
                // emptied field pass the client and 400 on save.
                required: "Email is required",
                pattern: {
                  value: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/,
                  message: "Enter a valid email address",
                },
              })}
              className={inputError(INPUT_CLASS, emailInvalid)}
              type="email"
              placeholder="e.g. john@example.com"
              aria-invalid={emailInvalid || undefined}
              aria-describedby={
                emailInvalid ? "email-error email-help" : "email-help"
              }
            />
            {emailInvalid && (
              <p id="email-error" role="alert" className={ERROR_CLASS}>
                {errors.personalInfo?.email?.message}
              </p>
            )}
            <p id="email-help" className={HELP_CLASS}>
              We&apos;ll never share your email with anyone else.
            </p>
          </div>

          {/* Phone + location: two-up from `sm` — the card is still full width
              below `lg`, so splitting early costs nothing. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className={LABEL_CLASS}>
                {formLabels.personalInfo.phone}
              </label>
              <input
                id="phone"
                {...register("personalInfo.phone", {
                  // One rule does both jobs: `isPhone("")` is false, so blank
                  // reports the same message the API's schema would.
                  validate: (v) =>
                    isPhone(v || "") ||
                    "Enter a valid phone number (7-15 digits)",
                })}
                className={inputError(INPUT_CLASS, phoneInvalid)}
                placeholder="e.g. +1 555-1234"
                inputMode="tel"
                aria-required="true"
                aria-invalid={phoneInvalid || undefined}
                aria-describedby={phoneInvalid ? "phone-error" : undefined}
              />
              {phoneInvalid && (
                <p id="phone-error" role="alert" className={ERROR_CLASS}>
                  {errors.personalInfo?.phone?.message || "Phone number is required"}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="location" className={LABEL_CLASS}>
                {formLabels.personalInfo.location}
              </label>
              <input
                id="location"
                {...register("personalInfo.location", {
                  required: "Location is required",
                })}
                className={inputError(INPUT_CLASS, locationInvalid)}
                placeholder="e.g. San Francisco, CA"
                aria-required="true"
                aria-invalid={locationInvalid || undefined}
                aria-describedby={locationInvalid ? "location-error" : undefined}
              />
              {locationInvalid && (
                <p id="location-error" role="alert" className={ERROR_CLASS}>
                  {errors.personalInfo?.location?.message || "Location is required"}
                </p>
              )}
            </div>
          </div>

          {/* URLs: two-up from `sm`, matching the phone/location rhythm. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="linkedin" className={LABEL_CLASS}>
                {formLabels.personalInfo.linkedin}
              </label>
              <input
                id="linkedin"
                {...register("personalInfo.linkedin", {
                  onBlur: normalizeField("linkedin"),
                })}
                className={inputError(INPUT_CLASS, linkedinInvalid)}
                placeholder="username"
                aria-invalid={linkedinInvalid || undefined}
                aria-describedby={
                  linkedinInvalid ? "linkedin-error linkedin-help" : "linkedin-help"
                }
              />
              {linkedinInvalid && (
                <p id="linkedin-error" role="alert" className={ERROR_CLASS}>
                  {errors.personalInfo?.linkedin?.message}
                </p>
              )}
              <p id="linkedin-help" className={HELP_CLASS}>
                Username or full URL — expands to the real link on blur.
              </p>
            </div>
            <div>
              <label htmlFor="github" className={LABEL_CLASS}>
                {formLabels.personalInfo.github}
              </label>
              <input
                id="github"
                {...register("personalInfo.github", {
                  onBlur: normalizeField("github"),
                })}
                className={inputError(INPUT_CLASS, githubInvalid)}
                placeholder="username"
                aria-invalid={githubInvalid || undefined}
                aria-describedby={
                  githubInvalid ? "github-error github-help" : "github-help"
                }
              />
              {githubInvalid && (
                <p id="github-error" role="alert" className={ERROR_CLASS}>
                  {errors.personalInfo?.github?.message}
                </p>
              )}
              <p id="github-help" className={HELP_CLASS}>
                Username or full URL — expands to the real link on blur.
              </p>
            </div>
          </div>

          {/* LeetCode, CodeChef, Codeforces… — username in, canonical URL out. */}
          <ProfileLinksEditor
            register={register}
            setValue={setValue}
            getValues={getValues}
            errors={errors}
            fields={plFields}
            append={appendPl}
            remove={removePl}
          />
        </div>
      </div>
    </div>
  );
};
