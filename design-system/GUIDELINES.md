# Andrew Riley design system — author guidelines

This repository holds **profiles**, **design tokens**, **logo assets**, and **templates** so personal and business communications stay coherent. Treat the JSON manifests as the source of truth for voice; tokens and logos express the same intent visually.

## Profiles

| Profile ID           | Use when |
|----------------------|----------|
| `personal`           | You are the sender: byline, newsletter, LinkedIn as Andrew Riley, speaking intro. |
| `business-primary`   | Flagship company: proposals, contracts, invoices, corporate site, hiring. |
| `business-venture`   | Named product, subsidiary, or vertical with its own offer and palette. |

Add a new business by copying `business-venture.json`, assigning a new `id` and `tokenSetId`, adding a token file and logos, and registering paths in `manifests/index.json`.

## Voice and tone

1. Open `design-system/manifests/<profile>.json`.
2. Apply **purpose**, **values**, and **tone** to every headline, body block, and UI string.
3. The field **`voice.theyAllSoundLike`** is the family rule: sibling profiles may differ in formality, not in integrity or respect for the reader.

Quick checks before publish:

- Would this sentence work on another sibling profile with only entity names swapped? If not, the voice has drifted.
- Have you avoided everything listed under `tone.avoid`?
- Is there a concrete example or proof where you claim expertise?

## Colour and type

- **Shared scale:** neutrals, spacing, radii, and base type scale live in `design-system/tokens/shared.json`.
- **Profile accents:** each profile has `design-system/tokens/<set>.json` for brand primaries and surfaces.
- **Fonts (web):** Source Sans 3, Source Serif 4, JetBrains Mono — load from [Google Fonts](https://fonts.google.com/) or self-host for production.

Personal brand leans **serif for headings**; primary business uses **sans throughout** for a more institutional read. Ventures use sans with a distinct accent colour.

## Logo usage

- Prefer **logomark** in app icons, favicons, and tight spaces; **wordmark** in headers and letterheads.
- Maintain clear space equal to at least half the height of the logomark around lockups.
- Do not stretch, rotate, or change hue outside the defined tokens; for monochrome prints, use neutral-0 on light paper or neutral-900 on dark.

## Visual mockups

Open `design-system/mockups/index.html` in a browser (double-click or serve the repo) to see a simple card layout per profile using current tokens and logos.

## Templates

Start from `design-system/templates/` for email signatures, bios, articles, and decks. Each file notes which profile it suits.

## Reference images

Add licensed photography and mood boards under `design-system/assets/reference/<profile>/`. See `assets/reference/personal/avatar-placeholder.txt` for portrait guidance.
