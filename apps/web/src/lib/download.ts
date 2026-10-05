/**
 * Start a file download for a blob/object URL.
 *
 * Uses a synthetic `<a download>` click on purpose: `window.open(url, "_blank")`
 * called after an `await` has already lost the user-gesture context and is
 * commonly blocked by popup blockers (the PDF download used to depend on it).
 */
export const triggerDownload = (url: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Download in-memory text (the JSON/TXT exports) without a server round trip.
 *
 * The object URL is revoked on the next task rather than immediately: Safari in
 * particular cancels a download whose URL is revoked synchronously after
 * `click()`.
 */
export const downloadTextFile = (
  content: string,
  filename: string,
  mime: string,
): void => {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/**
 * Human-friendly resume filename, e.g. "Gautam_Kumar_Resume.pdf".
 *
 * `ext` lets the JSON/TXT exports share the same naming as the PDF instead of
 * hardcoding ".pdf" in each caller.
 */
export const buildResumeFileName = (
  fullName?: string | null,
  title?: string | null,
  ext = "pdf",
): string => {
  const base = `${fullName || title || "Resume"}`
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safeExt = ext.replace(/^\./, "") || "pdf";
  return `${base || "Resume"}_Resume.${safeExt}`;
};
