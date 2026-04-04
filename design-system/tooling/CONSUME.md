# Consuming this design system from tools

Use this document to wire agents, linters, site generators, or CI to stay on brand.

## Discovery

1. Read `design-system/manifests/index.json` for the list of profiles and default id.
2. Load each path in `profiles` as JSON; validate against `design-system/manifest.schema.json` if your stack supports JSON Schema.

## Selecting a profile

- Pass **`profileId`** (`personal`, `business-primary`, `business-venture`) into your tool.
- Merge voice rules from the chosen manifest with **`voice.theyAllSoundLike`** from related profiles when generating co-branded material (e.g. “Andrew Riley for [Company]”).

## Design tokens

1. Open `design-system/tokens/index.json`.
2. Load `shared.json` plus the file in `sets[profileTokenSetId]` (see manifest field `tokenSetId`).
3. Token files may use `{path.to.other.token}` references; resolve or flatten according to your pipeline (Style Dictionary, Theo, CSS variables, etc.).

## Assets

Paths are listed per manifest under `assetPaths`. Logos are SVG; swap wordmark text in a vector editor when final names are fixed.

## Validation

From repo root (requires Node.js):

```bash
node scripts/validate-manifests.mjs
```

Exit code `0` means all manifests parse and required keys exist.

## Prompt injection (LLMs)

Prepend or system-inject a short instruction:

> Follow the brand profile in `design-system/manifests/<profileId>.json`. Honour `purpose`, `values`, `tone`, and `voice` including `theyAllSoundLike`. Prefer vocabulary and cadence consistent with related profiles in `relatedProfileIds`.

Optional: load the matching token JSON and state hex codes for any visual output.
