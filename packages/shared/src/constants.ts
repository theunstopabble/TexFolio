/**
 * Cross-app constants that both the API and the web client must agree on.
 *
 * Lives in `shared` rather than in either app so the server-side entitlement
 * check and the UI lock cannot drift apart: before this existed, only
 * `TemplateSelector` gated premium templates — it just disabled the buttons —
 * so a crafted `POST /api/resumes` could persist `templateId: "premium"` for a
 * free account and the PDF route would compile it without ever asking the
 * question.
 */

/** Template ids that require an active Pro subscription. */
export const PRO_TEMPLATES = ["premium", "faangpath", "developer"] as const;

export type ProTemplateId = (typeof PRO_TEMPLATES)[number];

/**
 * Whether a template id is gated behind Pro.
 *
 * Accepts anything (including `undefined`/`null`) because `templateId` is a
 * free-form `z.string()` in the schema — unknown ids are treated as free so a
 * typo degrades to the default template instead of locking the user out.
 */
export const isProTemplate = (templateId?: string | null): boolean =>
  (PRO_TEMPLATES as readonly string[]).includes(templateId ?? "");

/** The only ungated template — used as the schema default and as a client fallback. */
export const FREE_TEMPLATE_ID = "classic";
