/**
 * Shared class strings for the resume-editor form.
 *
 * Kept in one place so the seven section components cannot drift apart — the
 * earlier per-file duplication drifted into typos such as `focus-border-transparent`.
 *
 * ── Layering contract (see index.css) ──────────────────────────────────────
 * Border colour and focus-ring colour are deliberately ABSENT from the field
 * strings below. They are owned by `.form-input` / `.form-textarea` /
 * `.form-select` in the `components` layer. Restating them here as utilities
 * would put a competing `focus:ring-blue-500` next to the error's red, and
 * Tailwind orders same-family utilities by its own sort — not by the order in
 * the class attribute — so blue could win and an invalid field would never look
 * invalid. `inputError()` swaps in `.form-input-error`, declared after every
 * field base inside the same layer, so it wins deterministically.
 *
 * Layout utilities (width, padding, radius) are safe to repeat here: they win
 * over the base by layer order *and* carry the same value, so there is no
 * visual difference either way.
 */

/* ── Field bases: layout only ─────────────────────────────────────────────── */

export const INPUT_CLASS =
  "form-input w-full px-3 py-2 rounded-lg transition-colors duration-200";

export const TEXTAREA_CLASS =
  "form-textarea w-full p-3 rounded-lg resize-y transition-colors duration-200";

export const SELECT_CLASS =
  "form-select w-full px-3 py-2 rounded-lg transition-colors duration-200";

/**
 * `.form-label` already supplies `block text-sm font-medium text-slate-700`
 * plus the shared `mb-1` — repeating them as utilities was pure duplication.
 * Append a spacing utility (e.g. `mb-2`) when a field needs extra room.
 */
export const LABEL_CLASS = "form-label";

export const ERROR_CLASS = "mt-1 text-xs text-red-600";

/** Error ring for the invalid field — keeps the base look, swaps to red. */
export const inputError = (base: string, invalid: boolean): string =>
  invalid ? `${base} form-input-error` : base;

/* ── Spacing ramps (one ramp for the whole editor, P2.6/P2.8) ─────────────── */

/** Steps are wrapped in `space-y-6` by the page; this is the card's inner rhythm. */
export const BODY_CLASS = "space-y-4 md:space-y-6";

/** Label → control 4px (from `.form-label mb-1`); control → error `mt-1`. */
export const HELP_CLASS = "mt-2 text-xs text-slate-500";

/** Bottom-of-section advisory text (ATS tips). */
export const TIP_CLASS = "text-xs text-slate-500";

/* ── Section chrome ───────────────────────────────────────────────────────── */

/** Outer wrapper around one or more cards in a step. */
export const SECTION_WRAPPER_CLASS = "space-y-8 md:space-y-12";

export const CARD_CLASS = "card shadow-lg p-6 bg-white rounded-xl lg:p-8";

export const HEADING_CLASS =
  "card-title mb-6 text-2xl font-bold flex items-center gap-2 lg:gap-3";

/**
 * Same heading, without `mb-6`. Use it when the heading sits inside a header
 * row that already carries the spacing — the create wizard puts every section
 * title in a `flex justify-between items-center mb-6` row alongside its add
 * button, and a margin-bottom on the title would make the row taller and shift
 * the title's text up out of alignment with the button.
 */
export const HEADING_ROW_CLASS =
  "card-title text-2xl font-bold flex items-center gap-2 lg:gap-3";

/** Empty-state message under an add button. */
export const EMPTY_CLASS = "text-center text-slate-500 py-4";

/* ── Repeating entry lists (experience / education / skills / projects / certs) ── */

export const ENTRY_LIST_CLASS = "space-y-6";

export const ENTRY_CARD_CLASS =
  "p-5 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors duration-200";

/**
 * `lg` (not `md`) so the two-up switch happens exactly when the page grid
 * splits into editor + preview at 1024px. On `md` the fields went *narrower*
 * as the viewport grew, because the card had already been halved.
 */
export const ENTRY_GRID_CLASS = "grid grid-cols-1 lg:grid-cols-2 gap-4";

export const ADD_ROW_CLASS = "flex flex-col sm:flex-row gap-3";

export const ADD_BTN_CLASS =
  "flex-1 btn btn-primary flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200";

/**
 * Left-aligned: three of the five lists render nothing but the Remove link here,
 * Education appends its ATS hint, Skills prefixes a count. `justify-between`
 * (Skills' old one-off) would have pushed Remove to the opposite edge on lists
 * with no sibling content.
 */
export const REMOVE_ROW_CLASS = "flex items-center gap-2 mt-3 text-xs text-slate-500";

/**
 * `red-600` (not `red-500`): red-500 on the `slate-50` entry card is ~3.6:1,
 * below the 4.5:1 WCAG AA floor for text. `py-1` lifts the hit area from ~16px
 * to the 24px minimum.
 */
export const REMOVE_BTN_CLASS =
  "focus-ring-danger text-red-600 hover:text-red-700 underline cursor-pointer py-1";
