# Andrew Riley design system

Central **brand profiles**, **design tokens**, **logos**, **templates**, and **tooling hooks** for
Andrew Riley's personal brand, related business entities, and standalone product/tool UIs.

This README focuses on **how to use it**. For what's finished vs. still placeholder, see
[`design-system/STATUS.md`](design-system/STATUS.md).

## Using this from another application

This repo is meant to be pointed at, not published as a package — anything that can fetch a public
GitHub URL can consume it directly: `https://github.com/andrewkriley/design-system`.

**From an AI coding agent (Claude Code, Cursor, etc.):** the fastest path for a one-off styling task
is just giving it the repo link. `therileys-team` is the primary/default entry
(`design-system/patterns/index.json`'s `default: true`) — lead with it unless you specifically need
one of the brand-voice profiles instead. For example:

```
Style this app using the Andrew Riley design system: https://github.com/andrewkriley/design-system

- Default/primary token set: therileys-team (design-system/tokens/therileys-team.json)
- This is a token-only pattern, not a brand-voice profile — there's no manifest/voice to apply,
  just its own bg/text/border/accent color roles, space/radius scale, and type styles
- It does not merge with design-system/tokens/shared.json — it's self-contained
- Resolve any "{a.b.c}" values as references to another token's dot-path — see
  design-system/tooling/CONSUME.md, or design-system/demo/app.js's flattenTokens/resolveOne for a
  ~40-line reference implementation
- Its accent colors are mid-bright — filled surfaces need dark (bg.canvas) text, not white; see
  withPatternColorAliases in design-system/demo/app.js for the exact mapping this repo uses
- It's dark-only (meta.mode: "Dark" in the token file) — no light variant to support
```

If you instead need a brand voice — `personal`, `business-primary`, or `business-venture` — point at
that manifest (`design-system/manifests/<id>.json`) plus its matching token file merged with
`design-system/tokens/shared.json`, apply `purpose`/`values`/`tone`/`voice` to any copy you write,
and support light + dark mode if that token file has a top-level `dark` key.

**From a build pipeline or app at runtime**, without an agent in the loop: fetch the specific JSON
files you need (raw GitHub URLs, a shallow clone, or a git submodule all work — there's no build
step or package registry involved), then resolve tokens the same way CONSUME.md describes. That's
also how the [demo](design-system/demo/) itself works, just with `fetch()` against a local checkout
instead of a remote URL — its `app.js` is a working reference for the whole load → merge → resolve →
apply-as-CSS-variables pipeline if you'd rather copy code than reimplement it from the docs.

## See it first

```bash
npm run demo
```

Opens a local, live-rendered style guide at `http://localhost:4173/design-system/demo/` (auto-opens
on macOS). It fetches the real manifests and token files at load time and resolves `{a.b.c}` token
references itself — nothing shown there is hand-copied, so it's always in sync with the JSON. Switch
between the tabs to compare profiles, click any color swatch for its token path and resolved value,
and use the light/dark toggle where one appears.

This is the fastest way to answer "what does this actually look like" before touching any files.

## Two kinds of entry: profiles and patterns

|                  | **Profile** (`design-system/manifests/`)                   | **Pattern** (`design-system/patterns/`)                      |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| What it is       | A brand identity: voice, tone, values, plus its own tokens | A standalone UI's token set only                             |
| Has a manifest?  | Yes — required `purpose`/`values`/`tone`/`voice`           | No                                                           |
| Current examples | `personal`, `business-primary`, `business-venture`         | `therileys-team` (the default entry)                         |
| Dark mode        | Optional `dark` branch in its token file                   | Whatever the source declares (`therileys-team` is dark-only) |

Use a **profile** when you're producing something that speaks in Andrew Riley's or a business
entity's voice (a post, a proposal, a page, a signature). Use a **pattern** when you just need a
project's visual language (colors/type/spacing) with no voice attached — don't invent voice/tone
content to force something into the profile shape if it doesn't have any.

## Using it to write or design something

1. **Pick a profile.** Read [`design-system/GUIDELINES.md`](design-system/GUIDELINES.md) for the
   short version, or open the manifest directly:
   [`personal`](design-system/manifests/personal.json) ·
   [`business-primary`](design-system/manifests/business-primary.json) ·
   [`business-venture`](design-system/manifests/business-venture.json).
2. **Match the voice.** Apply `purpose`, `values`, and `tone` to every headline and body block.
   `voice.theyAllSoundLike` is the one rule that must hold across _all_ profiles — formality and
   energy can shift, integrity of voice can't.
3. **Use its tokens, not eyeballed values**, for anything visual: colors from
   `design-system/tokens/<profile>.json`, shared type/spacing/radius scale from
   [`design-system/tokens/shared.json`](design-system/tokens/shared.json). The demo's color swatches
   show you the exact token path to reference.
4. **Start from a template** for common formats:
   [`design-system/templates/`](design-system/templates/) has an email signature, social bios, a
   long-form article, and a deck outline — each notes which profile it suits.
5. **Follow logo usage rules** in GUIDELINES.md — logomark vs. wordmark, clear space, no
   recoloring outside the defined tokens.

## Using it from a tool, agent, or build pipeline

The discovery path is documented in full in
[`design-system/tooling/CONSUME.md`](design-system/tooling/CONSUME.md); short version:

1. Read [`design-system/manifests/index.json`](design-system/manifests/index.json) for the list of
   profiles and the default one.
2. Load a profile's manifest, and merge `voice.theyAllSoundLike` from `relatedProfileIds` if you're
   generating co-branded material.
3. Read [`design-system/tokens/index.json`](design-system/tokens/index.json) to find that profile's
   token file (keyed by the manifest's `tokenSetId`), plus
   [`shared.json`](design-system/tokens/shared.json).
4. Resolve `{color.neutral.0}`-style references yourself — a token's `value` may point at another
   token's dot-path instead of a literal. See `design-system/demo/app.js`'s `resolveOne`/
   `flattenTokens` for a ~40-line reference implementation, or plug into Style Dictionary/Theo.
5. For dark mode, check whether the token file has a top-level `dark` key. If so, every path under
   it (e.g. `dark.color.brand.primary`) overrides that same path's light value — a pure lookup
   table, not itself rendered. Not every profile has one yet (see the table above).

For prompt-injecting an LLM specifically, CONSUME.md has a ready-made instruction block.

## Design tokens at a glance

- **Shared** (`design-system/tokens/shared.json`): neutral color scale, type scale, font families,
  spacing, radii, motion — the same across every profile.
- **Per-profile** (`design-system/tokens/<id>.json`): `color.brand.*` (primary/accent/surface),
  `color.semantic.*` (text/link/onPrimary/onAccent, usually referencing brand or shared-neutral
  tokens), and `font.heading`/`font.body` (referencing a shared family, or overriding it — `personal`
  runs on Inter instead of the shared Source Sans 3).
- **`onPrimary`/`onAccent`**: the text color to use _on top of_ a filled brand/accent surface. Don't
  assume white — `personal`'s lime accent and dark-mode sky primary both need dark text instead, and
  this token tells you which.
- **Figma-oriented mirrors** live in [`design-system/figma/`](design-system/figma/) for Tokens
  Studio import — see [`tooling/FIGMA.md`](design-system/tooling/FIGMA.md).

## Figma & MCP

- Figma: token JSON in [`design-system/figma/`](design-system/figma/), workflow in
  [`tooling/FIGMA.md`](design-system/tooling/FIGMA.md).
- MCP (Figma + Stitch readiness): [`tooling/MCP.md`](design-system/tooling/MCP.md), template
  [`.cursor/mcp.json.example`](.cursor/mcp.json.example).
- Static (non-interactive) mockups: [`design-system/mockups/index.html`](design-system/mockups/index.html) —
  superseded by the live demo above for anything you're actively working from.

## Adding to the system

- **New business profile**: copy `business-venture.json` in both `manifests/` and `tokens/`, give it
  a new `id`/`tokenSetId`, add logos under `assets/logos/<id>/`, and register the manifest path in
  `manifests/index.json`.
- **New pattern** (token-only, no voice): drop a token file under `design-system/tokens/`, then add
  `{ id, name, tagline, tokensPath }` to `design-system/patterns/index.json` (add `"default": true`
  if it should become the demo's initial tab and README's leading example, replacing
  `therileys-team`). The demo picks it up automatically — no code changes needed unless its token
  shape doesn't already use `color.brand.*`/`color.semantic.*`/`space.*`/`radius.*` naming (see
  `withPatternColorAliases` in `design-system/demo/app.js` for how `therileys-team`'s different
  naming was mapped in).

## Validate, lint, and CI

```bash
npm ci
npm run ci              # lint + format:check + validate:manifests
node scripts/validate-manifests.mjs   # manifests only
```

`npm run format` applies Prettier. ESLint targets `scripts/**/*.mjs`. On push and pull requests to
`main`, GitHub Actions runs **Gitleaks** and `npm run ci` — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Replace placeholder names, colours, and copy in manifests and SVG wordmarks to match your real
entities — see [`design-system/STATUS.md`](design-system/STATUS.md) for what's still outstanding.
