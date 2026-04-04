# Andrew Riley design system

Central **brand profiles**, **design tokens**, **logos**, **templates**, and **tooling hooks** for Andrew Riley’s personal brand and related business entities.

## Quick start

- Human-readable rules: [`design-system/GUIDELINES.md`](design-system/GUIDELINES.md)
- Machine-readable profiles: [`design-system/manifests/index.json`](design-system/manifests/index.json)
- Tokens (colour, type, space): [`design-system/tokens/`](design-system/tokens/)
- Tool integration: [`design-system/tooling/CONSUME.md`](design-system/tooling/CONSUME.md)
- Visual mockups (browser): open [`design-system/mockups/index.html`](design-system/mockups/index.html)
- Figma: token JSON in [`design-system/figma/`](design-system/figma/) and [`design-system/tooling/FIGMA.md`](design-system/tooling/FIGMA.md)
- MCP (Figma + Stitch readiness): [`design-system/tooling/MCP.md`](design-system/tooling/MCP.md), template [`.cursor/mcp.json.example`](.cursor/mcp.json.example)

## Validate manifests

```bash
node scripts/validate-manifests.mjs
```

## Local checks (lint + format + manifests)

```bash
npm ci
npm run ci
```

`npm run format` applies Prettier. ESLint targets `scripts/**/*.mjs`.

## CI

On push and pull requests to `main`, GitHub Actions runs **Gitleaks** and **npm run ci**. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Replace placeholder names, colours, and copy in manifests and SVG wordmarks to match your real entities.

## Status

Progress log and open recommendations: [`design-system/STATUS.md`](design-system/STATUS.md).
