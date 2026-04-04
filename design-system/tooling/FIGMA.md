# Figma integration

You can connect this repo to Figma in three practical ways. They stack: tokens for colour/type, SVG assets for logos, HTML mockups as reference frames.

## 1. Tokens Studio for Figma (recommended for sync)

[Tokens Studio](https://tokens.studio/) reads JSON token files and can push to Figma **Variables** (and styles, depending on plan and settings).

1. In Figma, install **Tokens Studio for Figma**.
2. In the plugin, add a **JSON** token source pointing at this repo (sync via Git, or paste/import files).
3. Import these files from `design-system/figma/`:
   - `tokens-shared.json` — neutrals, shared sizes, radii, spacing
   - `tokens-personal.json` — personal brand colours and fonts
   - `tokens-business-primary.json` — primary business
   - `tokens-business-venture.json` — venture
4. Map each top-level group (`Shared`, `Personal`, etc.) to a **Token set**; enable the set that matches the file you are designing.
5. Use **Apply to document** / **Create variables** so components bind to variables.

When you change hex values in the repo, re-import or pull in Tokens Studio and update variables.

**Note:** Font tokens list family names; install **Source Sans 3**, **Source Serif 4**, and **JetBrains Mono** in Figma (Google Fonts in the font picker, or your org’s font library).

## 2. Native Figma Variables (manual, no plugin)

1. Open **Local variables** → create collections, e.g. `Shared`, `Personal`, `Business primary`, `Business venture`.
2. Copy hex values from `design-system/tokens/*.json` into colour variables; mirror naming (`brand/primary`, etc.).
3. For typography, create **text styles** that use the same font families as the token files.

Good when you want zero plugin dependency; you maintain parity by hand when tokens change.

## 3. Assets and layout reference

- **Logos:** drag `design-system/assets/logos/**/*.svg` into Figma or use **Place image**. Keep components per profile (`Logo / Personal`, etc.).
- **Mockups:** open `design-system/mockups/index.html` in a browser, screenshot or use a browser-to-Figma workflow for rough layout reference. Alternatively, recreate the three cards as Figma frames using the same variables.

## Optional: CI and “single source of truth”

If Tokens Studio is connected to the same Git branch as this repo, designers and developers share one token definition. For stricter pipelines, add a small script later that emits Figma-compatible JSON from `design-system/tokens/` so you never duplicate hex values by hand.

## Limits

- Figma’s REST API does not replace Variables for day-to-day token editing; plugins or manual variable setup remain the norm.
- Enterprise features (e.g. org-wide libraries) are configured in Figma, not in this repo.
