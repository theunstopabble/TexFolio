/**
 * Developer-platform profile links — username in, exact canonical URL out.
 *
 * The resume form takes a bare handle (`gautam-kr`), because typing
 * `https://github.com/gautam-kr` into a field labelled "GitHub" is exactly the
 * kind of repetition users skip — and skipping it used to store
 * `gautam-kr`, which every renderer then turned into a dead `https://gautam-kr`.
 *
 * ONE source of truth: the zod schema (server, normalise-at-write), the form
 * inputs' blur handler (client, live feedback), and the preview/PDF/TXT
 * renderers (defensive re-normalise for legacy or imported data) all import
 * from here, so they can never disagree. Normalising an already-normalised URL
 * is a no-op, so applying it twice is safe.
 */

export const PROFILE_PLATFORMS = [
  "github",
  "linkedin",
  "leetcode",
  "codechef",
  "codeforces",
  "hackerrank",
  "kaggle",
  "gitlab",
  "x",
  "behance",
  "dribbble",
  "stackoverflow",
  "portfolio",
  "other",
] as const;

export type ProfilePlatform = (typeof PROFILE_PLATFORMS)[number];

interface PlatformMeta {
  label: string;
  /** `${prefix}${username}` for a bare handle; `null` = full URL only (no
   *  reliable username→URL mapping, e.g. Stack Overflow's numeric ids). */
  prefix: string | null;
}

export const PLATFORM_META: Record<ProfilePlatform, PlatformMeta> = {
  github: { label: "GitHub", prefix: "https://github.com/" },
  linkedin: { label: "LinkedIn", prefix: "https://www.linkedin.com/in/" },
  leetcode: { label: "LeetCode", prefix: "https://leetcode.com/u/" },
  codechef: { label: "CodeChef", prefix: "https://www.codechef.com/users/" },
  codeforces: { label: "Codeforces", prefix: "https://codeforces.com/profile/" },
  hackerrank: { label: "HackerRank", prefix: "https://www.hackerrank.com/profile/" },
  kaggle: { label: "Kaggle", prefix: "https://www.kaggle.com/" },
  gitlab: { label: "GitLab", prefix: "https://gitlab.com/" },
  x: { label: "X (Twitter)", prefix: "https://x.com/" },
  behance: { label: "Behance", prefix: "https://www.behance.net/" },
  dribbble: { label: "Dribbble", prefix: "https://dribbble.com/" },
  // Numeric user ids — a handle cannot be turned into a profile URL.
  stackoverflow: { label: "Stack Overflow", prefix: null },
  portfolio: { label: "Portfolio", prefix: null },
  other: { label: "Other / Custom", prefix: null },
};

/** A handle as the major platforms accept it: letters, digits, `.`, `_`, `-`. */
const USERNAME_RE = /^[\w.@-]{1,80}$/;

/** Host-with-path but no scheme (`github.com/foo`) — users paste this a lot. */
const BARE_HOST_RE = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+([/?#][^\s]*)?$/;

export const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Best-effort normalise; never throws. Returns `""` for blank input and the
 * trimmed input unchanged when no rule applies — validity is decided by
 * `isHttpUrl` on the result, so an un-normalisable value surfaces as an error
 * instead of being silently rewritten.
 *
 * Order matters, and it is per platform:
 * - Platforms WITH a username prefix take the handle first: `j.smith` is a
 *   username, not a domain, and turning it into `https://j.smith` would be a
 *   confident dead link. Only a slash (`github.com/foo`) says "host" here.
 * - URL-only platforms (portfolio, Stack Overflow) have no handle rule, so
 *   anything host-shaped gets `https://` — that is how `gautam.dev` works.
 *
 * Known limit: a bare domain with no path (`github.com`) typed into a prefixed
 * field is username-shaped and will be prefixed as a handle. Rare enough not
 * to justify a TLD table; paste the full URL for that one.
 */
export const normalizeProfileLink = (
  platform: ProfilePlatform,
  raw: string | undefined | null,
): string => {
  const value = (raw ?? "").trim();
  if (!value) return "";

  // Trailing slashes are noise: `https://github.com/u/` ≡ `https://github.com/u`
  const withoutTrailingSlash = value.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  const prefix = PLATFORM_META[platform].prefix;
  if (prefix) {
    if (withoutTrailingSlash.includes("/") && BARE_HOST_RE.test(withoutTrailingSlash)) {
      return `https://${withoutTrailingSlash}`;
    }
    // People paste `in/gautam-kr` (the path LinkedIn shows in its own URL bar)
    // more often than the bare handle — drop the path segment first.
    const handle =
      platform === "linkedin"
        ? withoutTrailingSlash.replace(/^in\//i, "")
        : withoutTrailingSlash;
    if (USERNAME_RE.test(handle)) {
      // encodeURIComponent: handles non-ASCII names without breaking the URL.
      return prefix + encodeURIComponent(handle);
    }
    return withoutTrailingSlash;
  }

  if (BARE_HOST_RE.test(withoutTrailingSlash)) {
    return `https://${withoutTrailingSlash}`;
  }
  return withoutTrailingSlash;
};

/**
 * Phone: validated, not rewritten. The digits behind `+91 98765 43210` and
 * `+919876543210` are the same number, and a resume reads better with the
 * spacing the user typed — so we only reject strings with no phone number in
 * them: allowed characters plus 7–15 actual digits (E.164 range).
 */
export const isPhone = (value: string): boolean => {
  const v = value.trim();
  if (!v || !/^\+?[\d\s().-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};
