# Design system — progress and open recommendations

This document records what the repository already delivers and what remains to make the system fully operational for your real brands and tooling.

## Progress (delivered)

### Brand structure

- **Three profile slots** with JSON manifests: `personal`, `business-primary`, `business-venture` (`design-system/manifests/`).
- **JSON Schema** for manifests (`design-system/manifest.schema.json`) to support validation and editor tooling.
- **Index file** listing profiles and default id (`design-system/manifests/index.json`).
- **Voice alignment** via `voice.theyAllSoundLike` plus per-profile purpose, values, tone, and voice do/don’t lists.

### Visual and content assets

- **Design tokens** — shared neutrals, typography scale, spacing, radii, motion (`design-system/tokens/shared.json`) plus **per-profile colour and font roles** (`personal.json`, `business-primary.json`, `business-venture.json`).
- **Figma-oriented token exports** mirroring those values (`design-system/figma/*.json`) for Tokens Studio or manual Variables.
- **SVG logomarks and wordmarks** per profile (`design-system/assets/logos/`).
- **HTML/CSS mockups** — one preview card per profile (`design-system/mockups/`).
- **Reference placeholder** for headshot guidance (`design-system/assets/reference/personal/`).
- **Markdown templates** — email signature, social bios, article, deck outline (`design-system/templates/`).

### Documentation and integration hooks

- **Author guidelines** (`design-system/GUIDELINES.md`).
- **Tool consumption** — how agents and pipelines load manifests and tokens (`design-system/tooling/CONSUME.md`).
- **Figma workflows** — Tokens Studio, Variables, assets (`design-system/tooling/FIGMA.md`).
- **MCP readiness** — Figma official MCP URL, Stitch placeholder pattern, security notes (`design-system/tooling/MCP.md`), `.cursor/mcp.json.example`, `integrations.example.json`, `.gitignore` for local secrets.
- **Manifest validation script** (`scripts/validate-manifests.mjs`).

### Repository hygiene

- **`.gitignore`** excludes local `.cursor/mcp.json` and `design-system/tooling/integrations.json` so secrets and machine-specific paths stay out of Git.

---

## Outstanding recommendations (to resolve)

### High impact — replace placeholders

1. **Legal and marketing names** — Update manifest `name`, `tagline`, and business wordmark SVG text; align `business-primary` and `business-venture` with real registered or trading names. (`personal` is done — see below.)
2. **Final colour system** — Replace exploratory hex values in `design-system/tokens/*.json` and `design-system/figma/*.json`; add print specs (CMYK/Pantone) if needed. (`personal` is done — see below; `business-primary` and `business-venture` still exploratory.)
3. **Final logos** — Swap starter SVGs for production lockups (clear space, monochrome reversals, favicon sizes as needed).
4. **Voice copy** — Rewrite purpose, values, tone, and `theyAllSoundLike` in your authentic voice; expand `tone.avoid` with real phrases to ban.

### Medium impact — operational readiness

5. **Profile count** — Add or merge manifests if you have more or fewer than two business entities; register new files in `manifests/index.json` and add matching tokens, figma JSON, logos, and mockup cards.
6. **Figma library** — Create or link the canonical Figma file(s); import tokens; document file URLs in a local `integrations.json` (from `integrations.example.json`).
7. **Fonts** — Confirm Source Sans 3 / Source Serif 4 / JetBrains Mono or substitute licensed fonts; update tokens and Figma accordingly.
8. **Reference imagery** — Add licensed photography and mood boards under `design-system/assets/reference/<profile>/`.

### Tooling and automation

9. **CI** — Delivered: GitHub Actions runs Gitleaks, ESLint, Prettier `--check`, and `validate-manifests` on pushes and PRs to `main` (see `.github/workflows/ci.yml`). Optional next step: validate manifests against `manifest.schema.json` with AJV or similar.
10. **Token pipeline** — Add Style Dictionary (or similar) to emit CSS variables, iOS/Android, or Tailwind from `design-system/tokens/` so apps do not drift from Figma.
11. **Schema validation** — Extend `validate-manifests.mjs` or add a second script to assert JSON Schema compliance, not only required keys.
12. **MCP** — Copy `.cursor/mcp.json.example` to `.cursor/mcp.json`, complete Figma OAuth in Cursor, and add a **specific Google Stitch MCP package** plus GCP credentials per your org’s choice (`design-system/tooling/MCP.md`).

### Governance

13. **Change control** — Decide who may edit manifests/tokens and whether version tags (semver) matter for downstream consumers.
14. **Co-branding rules** — Document logo lockups and colour precedence when personal and business appear together (extend `GUIDELINES.md` or manifests with `coBranding` notes if useful).

---

## Suggested order of work

1. Replace names, colours, logos, and voice text (items 1–4).
2. Lock Figma Variables to repo tokens and record file URLs (items 6–7).
3. Add CI and optional token build (items 9–11).
4. Enable MCP in your IDE and Stitch when a server package is approved (item 12).

Update this file when major milestones complete so the repo stays an accurate snapshot of status.

## 2026-09-19 — Personal profile is now real

`personal` tokens, manifest, and Figma export were replaced with the actual design of
[andrewriley.info](https://github.com/andrewkriley/www-andrewriley-info): cobalt/sky/lime/growth
palette, Inter typography, pill-shaped buttons, `2rem`/`2.5rem` card/hero radii, and a full light +
dark mode pair (`design-system/tokens/personal.json`'s `dark` branch). `business-primary` and
`business-venture` are still the original exploratory placeholders.

## 2026-09-19 — Dark mode for all three profiles

Every token file now has a `dark` branch, so all three profiles expose the demo's light/dark
toggle, not just `personal`. `business-primary` and `business-venture` are still exploratory
placeholders with no external source to mirror, so their dark surfaces/text reuse the existing
shared neutral ramp (`color.neutral.0`/`50`/`500`/`900`) rather than inventing new hex values; only
`primary`/`primaryMuted` get bespoke brightened tints (chosen to keep white button text passing
contrast). `accent`/`accentSoft` are unchanged between modes for every profile, matching the
convention `personal` inherited from the live site.

Also added `color.semantic.onPrimary` and `onAccent` to all three profiles and wired them into the
demo's `.btn-primary`, `.badge`, and active-profile-tab styles — fixes a real contrast bug where
`personal`'s light lime accent and dark-mode sky primary were getting hardcoded white text.
