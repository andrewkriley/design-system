# MCP integration (Figma & Google Stitch)

This design system is structured so **Model Context Protocol** clients can stay aligned with repo manifests and tokens while pulling **live design context** from Figma and, when you adopt it, **Google Stitch**.

## What “future capability” means here

- **Today:** JSON manifests, tokens, Figma-oriented exports (`design-system/figma/`), and HTML mockups live in Git — no MCP server runs inside this repo.
- **When you enable MCP:** Your IDE (e.g. Cursor) connects to external MCP servers. Agents can then combine **file context from this repo** with **Figma frames** or **Stitch screens** using the workflows below.

## Figma MCP (official)

Figma hosts a **remote MCP server** (OAuth). It can extract variables, components, layout, generate code from selected frames, and (in supported clients) push live UI back to Figma.

- Documentation: [Figma MCP server](https://developers.figma.com/docs/figma-mcp-server/)
- Remote endpoint: `https://mcp.figma.com/mcp`
- Cursor setup: install via **`/add-plugin figma`** in agent chat, or follow [remote server installation](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/) (includes Cursor-specific steps and authentication).

### Aligning Figma output with this repo

When prompting an agent with Figma MCP enabled:

1. Pass **`profileId`** and paths from [`CONSUME.md`](CONSUME.md) (`manifests/`, `tokens/`).
2. Prefer Figma **Variables** that mirror `design-system/figma/*.json` or native variables derived from `design-system/tokens/`.
3. Paste **frame or layer links** so the server can resolve `node-id` (see Figma docs: _Get design context_).

Optional: record canonical file URLs in `design-system/tooling/integrations.json` (create from `integrations.example.json`).

## Google Stitch MCP

**Stitch** is a Google design/UI product space; MCP access is provided by **community or Google-adjacent MCP server packages**, not by this repository. Typical setup:

1. **Google Cloud** project with Stitch-related APIs enabled (per the server you choose).
2. **Application Default Credentials**, e.g. `gcloud auth application-default login`.
3. An **MCP server** package run via `npx` or a local binary, configured in your client’s MCP settings.

Because package names and env vars differ by implementation, this repo does **not** pin a single npm package. Evaluate options (e.g. search [MCP server directories](https://github.com/modelcontextprotocol/servers) or your org’s approved list) and add the chosen server to `.cursor/mcp.json` (see example file).

### Aligning Stitch output with this repo

- Instruct the agent to apply **`design-system/manifests/<profileId>.json`** voice rules and **`voice.theyAllSoundLike`** when generating or refactoring UI copy.
- Map extracted colours and fonts to **`design-system/tokens/`** naming where possible, or document deltas in a PR.

## Project configuration

| Artifact                                                     | Purpose                                                                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example) | Copy to `.cursor/mcp.json`. Includes Figma’s official HTTP endpoint; add Stitch after you pick a server package. |
| [`integrations.example.json`](integrations.example.json)     | Copy to `integrations.json` for non-secret pointers (Figma file URLs, Stitch project ids).                       |

If Cursor rejects `"type": "http"`, try `"type": "streamableHttp"` for URL-based servers (see current Cursor MCP docs).

### Example: add Google Stitch MCP

After you choose a Stitch MCP implementation (package name and env vars from that project’s README), append an entry such as:

```json
"google-stitch": {
  "command": "npx",
  "args": ["-y", "YOUR_STITCH_MCP_PACKAGE"],
  "env": {}
}
```

Use the exact `command` / `args` / `env` required by that server (many expect Google Application Default Credentials on the machine).

Restart the MCP client after changing MCP config.

## Security

- Do **not** commit OAuth tokens, API keys, or service account JSON.
- `.gitignore` excludes `.cursor/mcp.json` and `integrations.json` if you store local-only values there; keep **examples** committed as templates only.
