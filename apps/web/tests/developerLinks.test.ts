import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeProfileLink,
  isHttpUrl,
  isPhone,
} from "@texfolio/shared/dist/developerLinks.js";
import { personalInfoSchema, profileLinkSchema } from "@texfolio/shared/dist/schemas/resume.schema.js";

// ── normalizeProfileLink ────────────────────────────────────────────────────

test("normalizeProfileLink: bare username becomes the platform's exact URL", () => {
  assert.equal(
    normalizeProfileLink("github", "gautam-kr"),
    "https://github.com/gautam-kr",
  );
  assert.equal(
    normalizeProfileLink("linkedin", "gautam-kr"),
    "https://www.linkedin.com/in/gautam-kr",
  );
  assert.equal(
    normalizeProfileLink("leetcode", "gautam_kr"),
    "https://leetcode.com/u/gautam_kr",
  );
  assert.equal(
    normalizeProfileLink("codechef", "gautamkr"),
    "https://www.codechef.com/users/gautamkr",
  );
  assert.equal(
    normalizeProfileLink("hackerrank", "gautam-kr"),
    "https://www.hackerrank.com/profile/gautam-kr",
  );
});

test("normalizeProfileLink: host without scheme gets https://", () => {
  assert.equal(
    normalizeProfileLink("github", "github.com/gautam-kr"),
    "https://github.com/gautam-kr",
  );
});

test("normalizeProfileLink: a pasted URL is kept, minus trailing slashes", () => {
  assert.equal(
    normalizeProfileLink("github", "https://github.com/gautam-kr/"),
    "https://github.com/gautam-kr",
  );
  assert.equal(
    normalizeProfileLink("github", "  https://github.com/gautam-kr  "),
    "https://github.com/gautam-kr",
  );
});

test("normalizeProfileLink: normalising an already-normalised URL is a no-op", () => {
  // Preview/PDF/TXT re-normalise defensively — doing it twice must not change
  // anything or the renderers would disagree with the stored value.
  const once = normalizeProfileLink("leetcode", "gautam-kr");
  assert.equal(normalizeProfileLink("leetcode", once), once);
});

test("normalizeProfileLink: blank stays blank", () => {
  assert.equal(normalizeProfileLink("github", ""), "");
  assert.equal(normalizeProfileLink("github", "   "), "");
  assert.equal(normalizeProfileLink("github", undefined), "");
});

test("normalizeProfileLink: unresolvable input passes through for the validity check", () => {
  const junk = "not a handle!";
  assert.equal(normalizeProfileLink("github", junk), junk);
  assert.equal(isHttpUrl(junk), false);
});

test("normalizeProfileLink: URL-only platforms never invent a handle mapping", () => {
  // Stack Overflow ids and portfolio sites have no username→URL rule: a bare
  // domain gets its scheme (that is all we can safely do), anything else is
  // left for the validity check to reject rather than guessed at.
  assert.equal(
    normalizeProfileLink("portfolio", "gautam.dev"),
    "https://gautam.dev",
  );
  assert.equal(normalizeProfileLink("portfolio", "my-site"), "my-site");
  assert.equal(isHttpUrl(normalizeProfileLink("portfolio", "my-site")), false);
  assert.equal(
    normalizeProfileLink("portfolio", "https://gautam.dev"),
    "https://gautam.dev",
  );
});

test("normalizeProfileLink: a dotted username stays a username on prefixed platforms", () => {
  // `j.smith` is host-shaped too; on a platform with a handle rule it must not
  // become a confident dead link at https://j.smith.
  assert.equal(
    normalizeProfileLink("github", "j.smith"),
    "https://github.com/j.smith",
  );
  // …and LinkedIn's pasted `in/handle` path is recognised as the handle.
  assert.equal(
    normalizeProfileLink("linkedin", "in/gautam-kr"),
    "https://www.linkedin.com/in/gautam-kr",
  );
});

// ── isPhone ─────────────────────────────────────────────────────────────────

test("isPhone: accepts real numbers in whatever spacing the user typed", () => {
  assert.equal(isPhone("+91 98765 43210"), true);
  assert.equal(isPhone("+91-98765-43210"), true);
  assert.equal(isPhone("(555) 123-4567"), true);
  assert.equal(isPhone("9876543210"), true);
});

test("isPhone: rejects blanks and non-numbers", () => {
  assert.equal(isPhone(""), false);
  assert.equal(isPhone("call me"), false);
  assert.equal(isPhone("12345"), false); // fewer than 7 digits
});

// ── schema transforms (server, normalise-at-write) ──────────────────────────

test("personalInfoSchema: username fields are stored as canonical URLs", () => {
  const parsed = personalInfoSchema.parse({
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+91 98765 43210",
    location: "London",
    linkedin: "ada-l",
    github: "github.com/ada-l",
    portfolio: "https://ada.example.com/",
  });
  assert.equal(parsed.linkedin, "https://www.linkedin.com/in/ada-l");
  assert.equal(parsed.github, "https://github.com/ada-l");
  assert.equal(parsed.portfolio, "https://ada.example.com");
});

test("personalInfoSchema: a handle that resolves to no URL is a 400, not a dead link", () => {
  const result = personalInfoSchema.safeParse({
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "9876543210",
    location: "London",
    github: "not a handle!",
  });
  assert.equal(result.success, false);
});

test("personalInfoSchema: phone must contain a phone number", () => {
  const base = {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    location: "London",
  };
  assert.equal(
    personalInfoSchema.safeParse({ ...base, phone: "call me" }).success,
    false,
  );
  assert.equal(
    personalInfoSchema.safeParse({ ...base, phone: "+44 20 7946 0958" }).success,
    true,
  );
});

test("profileLinkSchema: stores the canonical URL, rejects the unresolvable", () => {
  const ok = profileLinkSchema.parse({ platform: "codechef", url: "ada_l" });
  assert.equal(ok.url, "https://www.codechef.com/users/ada_l");

  const bad = profileLinkSchema.safeParse({
    platform: "codechef",
    url: "not a handle",
  });
  assert.equal(bad.success, false);

  const badPlatform = profileLinkSchema.safeParse({
    platform: "myspace",
    url: "ada",
  });
  assert.equal(badPlatform.success, false);
});
