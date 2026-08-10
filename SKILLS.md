# SKILLS — Memory Index

Everything the agent must always remember about installed skills, MCP, and where
to re-install from. Read this whenever starting work or when a task exposes a
gap in installed capabilities.

> Maintained by the agent. After adding/removing a skill, update this file and
> run `graphify update .`.

---

## 1. Installed skills (`.opencode/skills/`)

OpenCode auto-discovers these from their `SKILL.md` frontmatter
(`name` + `description`) and routes to them via the `skill` tool.

### Lifecycle / process (from addyosmani/agent-skills)
| Skill | Use when |
|---|---|
| `spec-driven-development` | New feature/significant change needs a spec before coding |
| `planning-and-task-breakdown` | After spec, plan the work into tasks |
| `incremental-implementation` | Building a feature in safe, testable increments |
| `test-driven-development` | Writing code with tests first (red → green → refactor) |
| `debugging-and-error-recovery` | Any bug, failing test, or unexpected behavior |
| `code-review-and-quality` | Reviewing code/diff for correctness & design |
| `shipping-and-launch` | Releasing: verification, docs, launch checklist |

### Curated / community
| Skill | Source | Use when |
|---|---|---|
| `systematic-debugging` | obra/superpowers | Find root cause instead of guessing fixes |
| `frontend-design` | anthropics/skills | Building polished, production-quality UI |
| `webapp-testing` | anthropics/skills | Testing web apps end-to-end |
| `code-review` | mattpocock/skills | Structured PR/diff review |
| `shadcn` | shadcn/ui | Using shadcn/ui components & conventions |

### Plugin (always-on)
- **ponytail** (`@dietrichgebert/ponytail` in `.opencode/opencode.json`)
  - "Lazy senior dev": write only what the task needs; reuse stdlib/native/
    existing instead of over-building. ~54% less code, safe.
  - Slash commands: `/ponytail [lite|full|ultra|off]`, `/ponytail-review`,
    `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, `/ponytail-help`.
  - Runs automatically every turn via injected ruleset.

### Global (user-level, not in repo)
- **graphify** (`~/.config/opencode/skills/graphify/`) — knowledge-graph build/
  query of this repo. See `.opencode/plugins/graphify.js` + `graphify-out/`.

---

## 2. Re-install / get-more playbook (the 5 sources)

| Source | What it is | How to get skills |
|---|---|---|
| `github.com/addyosmani/agent-skills` | Production-grade lifecycle skills (SKILL.md) | `git clone` → copy `skills/<name>` into `.opencode/skills/` |
| `github.com/DietrichGebert/ponytail` | Minimalism/simplify plugin + skills | Add `"@dietrichgebert/ponytail"` to `opencode.json` plugins |
| `skills.sh` (Vercel) | Community skills directory + leaderboard | `npx skillsadd <owner/repo>` → files into `skills/` (move SKILL.md into `.opencode/skills/`) |
| `officialskills.sh` | Officially-vetted skills (651, 55 devs) | Browse → clone publisher repo → copy `SKILL.md` |
| `mcpmarket.com/tools/skills` | Marketplace (330k, quality varies, some paid) | Discovery + MCP Market Hub; verify before install |

General install steps for any skill:
1. Clone the source repo (shallow: `git clone --depth 1 <url>`).
2. Find the `SKILL.md` (keep its folder for bundled references).
3. Copy into `.opencode/skills/<skill-name>/`.
4. Verify frontmatter has `name:` and `description:` (OpenCode routing).
5. `graphify update .`
6. Record it in this index.

---

## 3. Project conventions worth remembering

- **Templates (LaTeX):** 3 templates under `apps/api/src/templates/`:
  `classic`, `premium`, `faangpath`. All render via `DYNAMIC_SECTIONS[]`
  (see `pdf.service.ts::transformResumeData`). `resume.cls` is A4.
- **PDF staleness guarded:** `GET /resumes/:id/pdf` sends
  `Cache-Control: no-store` and the client cache-busts with `?t=Date.now()`.
  `EditResume` auto-saves before download (dirty-check).
- **Live preview** (`ResumePreview.tsx`) renders exact template layout; dates
  show raw `YYYY-MM` (matching LaTeX), not formatted.
- **Always run:** `cd apps/api && npx tsc --noEmit`, `cd apps/web && npx tsc --noEmit`,
  `npx eslint src`, then `npx vite build` before finishing web changes.
- **Graph:** after code changes run `graphify update .`.