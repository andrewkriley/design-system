// Live demo: fetches the real manifests + tokens from this repo, resolves token
// references, and renders a themeable style guide. No values are hand-copied —
// edit a JSON file under design-system/ and reload to see it here.

const DEMO_ROOT = new URL(".", import.meta.url); // .../design-system/demo/
const REPO_ROOT = new URL("../../", DEMO_ROOT); // repo root

function repoUrl(repoRelativePath) {
  return new URL(repoRelativePath, REPO_ROOT);
}

async function fetchJson(repoRelativePath) {
  const res = await fetch(repoUrl(repoRelativePath));
  if (!res.ok) throw new Error(`Failed to load ${repoRelativePath}: ${res.status}`);
  return res.json();
}

function esc(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

// ---- Token tree: flatten + resolve {dot.path} references ----------------

function flattenTokens(tree, prefix, out) {
  for (const key of Object.keys(tree)) {
    if (key.startsWith("$")) continue;
    const node = tree[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (node && typeof node === "object" && !Array.isArray(node) && "value" in node) {
      // This repo's own token files: a leaf is an object with an explicit `value`.
      out[path] = { ...node, path };
    } else if (node && typeof node === "object" && !Array.isArray(node)) {
      flattenTokens(node, path, out);
    } else if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
      // Some external token sets (e.g. therileys-team) use bare literals as leaves instead.
      out[path] = { value: node, path };
    }
  }
  return out;
}

// Numeric leaves (e.g. therileys-team's raw px numbers) need a unit when used
// as a CSS value or shown as text; string leaves (e.g. this repo's own
// "1rem") already carry their own unit and pass through unchanged.
function tokenText(node) {
  return typeof node.resolvedValue === "number" ? `${node.resolvedValue}px` : node.resolvedValue;
}

function resolveOne(flat, path, seen) {
  const node = flat[path];
  if (!node) throw new Error(`Unknown token reference: ${path}`);
  if (node.resolvedValue !== undefined) return node.resolvedValue;
  if (seen.has(path)) throw new Error(`Cyclic token reference at ${path}`);
  seen.add(path);
  const match = typeof node.value === "string" && node.value.match(/^\{([\w.]+)\}$/);
  if (!match) {
    node.resolvedValue = node.value;
    return node.value;
  }
  const refPath = match[1];
  const resolved = resolveOne(flat, refPath, seen);
  node.resolvedValue = resolved;
  node.refPath = refPath;
  return resolved;
}

function resolveAllTokens(flat) {
  for (const path of Object.keys(flat)) resolveOne(flat, path, new Set());
  return flat;
}

function deepMerge(a, b) {
  const out = { ...a };
  for (const key of Object.keys(b)) {
    if (
      b[key] &&
      typeof b[key] === "object" &&
      !("value" in b[key]) &&
      a[key] &&
      typeof a[key] === "object"
    ) {
      out[key] = deepMerge(a[key], b[key]);
    } else {
      out[key] = b[key];
    }
  }
  return out;
}

function cssVarName(path) {
  return `--${path.replace(/\./g, "-")}`;
}

// ---- Load everything ------------------------------------------------------

async function loadDesignSystem() {
  const manifestIndex = await fetchJson("design-system/manifests/index.json");
  const manifests = await Promise.all(manifestIndex.profiles.map((p) => fetchJson(p)));

  const tokenIndex = await fetchJson("design-system/tokens/index.json");
  const sharedTokens = await fetchJson(tokenIndex.shared);

  const profiles = [];
  for (const manifest of manifests) {
    const setPath = tokenIndex.sets[manifest.tokenSetId];
    const profileTokens = await fetchJson(setPath);
    const merged = deepMerge(sharedTokens, profileTokens);
    const flat = resolveAllTokens(flattenTokens(merged, "", {}));
    profiles.push({ manifest, tokens: flat });
  }

  return { defaultProfileId: manifestIndex.defaultProfileId, profiles };
}

async function loadPatterns() {
  let index;
  try {
    index = await fetchJson("design-system/patterns/index.json");
  } catch {
    return []; // patterns/ is optional — profiles work fine without it
  }
  const patterns = [];
  for (const entry of index.patterns) {
    const raw = await fetchJson(entry.tokensPath);
    const { meta, $description, ...tokenTree } = raw;
    const tokens = withPatternColorAliases(resolveAllTokens(flattenTokens(tokenTree, "", {})));
    patterns.push({ ...entry, meta, description: $description, tokens });
  }
  return patterns;
}

// ---- Rendering --------------------------------------------------------------

function hasDarkTokens(tokens) {
  return Object.keys(tokens).some((k) => k.startsWith("dark."));
}

// In light mode every flattened path becomes a CSS variable as-is. In dark
// mode, a path whose "dark.<path>" counterpart exists is overridden by it —
// the `dark` branch is a pure lookup table, never itself turned into variables.
function effectiveNode(tokens, path, mode) {
  if (mode === "dark" && tokens[`dark.${path}`]) return tokens[`dark.${path}`];
  return tokens[path];
}

function applyTheme(tokens, mode) {
  const root = document.documentElement;
  // Clear any previously-applied token variables so a profile with fewer keys
  // (or renamed keys) can't inherit a stale value from the last theme.
  for (const name of Array.from(root.style)) {
    if (name.startsWith("--")) root.style.removeProperty(name);
  }
  for (const path of Object.keys(tokens)) {
    if (path.startsWith("dark.")) continue;
    root.style.setProperty(cssVarName(path), tokenText(effectiveNode(tokens, path, mode)));
  }
  document.body.classList.toggle("demo-dark", mode === "dark" && hasDarkTokens(tokens));
}

// Lets a token-only pattern (no color.brand.*/color.semantic.* of its own)
// reuse the existing brand-header/.panel/.btn/.badge CSS, which is written
// against those var names. Purely a rendering-layer convenience — doesn't
// touch the underlying token file, and the pattern's own color section still
// reads its native names directly.
function withPatternColorAliases(tokens) {
  const alias = (aliasPath, sourcePath) => {
    if (tokens[sourcePath]) tokens[aliasPath] = { ...tokens[sourcePath], path: aliasPath };
  };
  alias("color.brand.primary", "color.accent.default");
  alias("color.brand.primaryMuted", "color.accent.cyan");
  alias("color.brand.accent", "color.accent.violet");
  alias("color.brand.surface", "color.bg.panel");
  alias("color.brand.surfaceAlt", "color.bg.canvas");
  alias("color.semantic.text", "color.text.primary");
  alias("color.semantic.textMuted", "color.text.muted");
  alias("color.semantic.link", "color.accent.default");
  alias("color.semantic.linkHover", "color.accent.cyan");
  // accent.default is a mid-bright blue — white text on it fails contrast;
  // the near-black canvas color reads far better, same "flip onX dark when
  // the brand color is light" rule used for personal's dark mode.
  alias("color.semantic.onPrimary", "color.bg.canvas");
  alias("color.semantic.onAccent", "color.bg.canvas");
  return tokens;
}

function assetSrc(repoRelativePath) {
  return repoUrl(repoRelativePath).pathname;
}

function swatch(tokens, path, label) {
  const node = tokens[path];
  if (!node) return "";
  return `
    <button type="button" class="swatch" data-token="${esc(path)}" style="--swatch-color: var(${cssVarName(path)})">
      <span class="swatch-color"></span>
      <span class="swatch-label">${esc(label)}</span>
    </button>`;
}

function list(items) {
  return `<ul>${(items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function renderVoice(manifest) {
  return `
    <section class="panel" aria-labelledby="voice-heading">
      <h2 id="voice-heading">Voice &amp; tone</h2>
      <p class="panel-lede">${esc(manifest.purpose)}</p>
      <div class="voice-grid">
        <div>
          <h3>Values</h3>
          ${list(manifest.values)}
        </div>
        <div>
          <h3>Tone</h3>
          <p><strong>${esc(manifest.tone?.primary)}</strong></p>
          ${list(manifest.tone?.secondary)}
          ${
            manifest.tone?.avoid?.length
              ? `<p class="label-muted">Avoid</p>${list(manifest.tone.avoid)}`
              : ""
          }
        </div>
        <div>
          <h3>Do</h3>
          ${list(manifest.voice?.do)}
        </div>
        <div>
          <h3>Don't</h3>
          ${list(manifest.voice?.dont)}
        </div>
      </div>
      <blockquote class="voice-summary">${esc(manifest.voice?.summary)}</blockquote>
      <p class="family-line"><strong>Family fingerprint —</strong> ${esc(manifest.voice?.theyAllSoundLike)}</p>
    </section>`;
}

function renderColors(tokens) {
  const brandKeys = Object.keys(tokens).filter((k) => k.startsWith("color.brand."));
  const semanticKeys = Object.keys(tokens).filter((k) => k.startsWith("color.semantic."));
  const neutralKeys = Object.keys(tokens).filter((k) => k.startsWith("color.neutral."));

  const short = (k) => k.split(".").pop();

  return `
    <section class="panel" aria-labelledby="color-heading">
      <h2 id="color-heading">Color</h2>
      <p class="panel-lede">Brand colors from this profile's token file, semantic roles resolved through shared neutrals.</p>
      <h3>Brand</h3>
      <div class="swatch-row">${brandKeys.map((k) => swatch(tokens, k, short(k))).join("")}</div>
      <h3>Semantic</h3>
      <div class="swatch-row">${semanticKeys.map((k) => swatch(tokens, k, short(k))).join("")}</div>
      <h3>Shared neutral scale</h3>
      <div class="swatch-row swatch-row-scale">${neutralKeys.map((k) => swatch(tokens, k, short(k))).join("")}</div>
    </section>`;
}

function renderTypography(tokens) {
  const sizeKeys = Object.keys(tokens).filter((k) => k.startsWith("font.size."));
  const headingVar = cssVarName("font.heading");
  const bodyVar = cssVarName("font.body");
  const rows = sizeKeys
    .map((k) => {
      const short = k.split(".").pop();
      const sizeVar = cssVarName(k);
      return `
        <div class="type-row">
          <span class="type-token">font.size.${short} — ${esc(tokens[k].resolvedValue)}</span>
          <span class="type-sample" style="font-family: var(${headingVar}); font-size: var(${sizeVar})">Heading sample Aa</span>
          <span class="type-sample" style="font-family: var(${bodyVar}); font-size: var(${sizeVar})">Body sample Aa</span>
        </div>`;
    })
    .join("");

  const weightKeys = Object.keys(tokens).filter((k) => k.startsWith("font.weight."));
  const weights = weightKeys
    .map((k) => {
      const wVar = cssVarName(k);
      return `<span class="weight-sample" style="font-family: var(${bodyVar}); font-weight: var(${wVar})">${esc(k.split(".").pop())} ${esc(tokens[k].resolvedValue)}</span>`;
    })
    .join("");

  return `
    <section class="panel" aria-labelledby="type-heading">
      <h2 id="type-heading">Typography</h2>
      <p class="panel-lede">
        Heading font: <code>${esc(tokens["font.heading"]?.resolvedValue)}</code> · Body font:
        <code>${esc(tokens["font.body"]?.resolvedValue)}</code>
      </p>
      <div class="type-scale">${rows}</div>
      <div class="weight-row">${weights}</div>
    </section>`;
}

function renderSpacing(tokens) {
  const spaceKeys = Object.keys(tokens).filter((k) => k.startsWith("space."));
  const radiusKeys = Object.keys(tokens).filter((k) => k.startsWith("radius."));

  const spaceBars = spaceKeys
    .map((k) => {
      const short = k.split(".").pop();
      return `
        <div class="scale-row">
          <span class="scale-label">space.${short}</span>
          <span class="scale-bar" style="width: var(${cssVarName(k)})"></span>
          <span class="scale-value">${esc(tokenText(tokens[k]))}</span>
        </div>`;
    })
    .join("");

  const radiusSwatches = radiusKeys
    .map((k) => {
      const short = k.split(".").pop();
      return `
        <div class="radius-sample">
          <span class="radius-box" style="border-radius: var(${cssVarName(k)})"></span>
          <span class="scale-label">radius.${short} — ${esc(tokenText(tokens[k]))}</span>
        </div>`;
    })
    .join("");

  return `
    <section class="panel" aria-labelledby="space-heading">
      <h2 id="space-heading">Spacing &amp; radius</h2>
      <div class="scale-col">${spaceBars}</div>
      <div class="radius-row">${radiusSwatches}</div>
    </section>`;
}

function renderComponents() {
  return `
    <section class="panel" aria-labelledby="components-heading">
      <h2 id="components-heading">Components</h2>
      <div class="component-grid">
        <div class="demo-card">
          <h3>Card title</h3>
          <p>Card body text uses the body font and muted text color at normal line height.</p>
          <div class="demo-actions">
            <button class="btn btn-primary" type="button">Primary</button>
            <button class="btn btn-ghost" type="button">Secondary</button>
          </div>
        </div>
        <form class="demo-form" onsubmit="return false">
          <label for="demo-email">Email</label>
          <input id="demo-email" type="email" placeholder="you@example.com" />
          <label for="demo-msg">Message</label>
          <textarea id="demo-msg" rows="3" placeholder="Say hello"></textarea>
          <button class="btn btn-primary" type="submit">Send</button>
        </form>
        <div class="demo-misc">
          <span class="badge">New</span>
          <a class="link-sample" href="#">A themed link</a>
          <div class="alert">A note using the surface-alt background.</div>
        </div>
      </div>
    </section>`;
}

function renderLogos(manifest) {
  const logomark = manifest.assetPaths?.logomark;
  const wordmark = manifest.assetPaths?.wordmark;
  return `
    <section class="panel" aria-labelledby="logo-heading">
      <h2 id="logo-heading">Logo usage</h2>
      <div class="logo-row">
        <div class="logo-tile">
          ${logomark ? `<img src="${assetSrc(logomark)}" alt="${esc(manifest.name)} logomark" width="64" height="64" />` : "<em>no logomark</em>"}
          <span>Logomark, on surface</span>
        </div>
        <div class="logo-tile logo-tile-alt">
          ${wordmark ? `<img src="${assetSrc(wordmark)}" alt="${esc(manifest.name)} wordmark" height="40" />` : "<em>no wordmark</em>"}
          <span>Wordmark, on surface-alt</span>
        </div>
      </div>
    </section>`;
}

function renderTemplates(manifest) {
  return `
    <section class="panel" aria-labelledby="templates-heading">
      <h2 id="templates-heading">Template preview</h2>
      <p class="panel-lede">
        Rendered from <code>${esc(manifest.assetPaths?.logomark ? "design-system/templates/" : "")}</code> structure
        using this profile's manifest fields.
      </p>
      <div class="template-grid">
        <div class="template-card">
          <p class="template-label">Email signature</p>
          <p><strong>${esc(manifest.name)}</strong></p>
          <p>${esc(manifest.tagline || "Role / Title")}</p>
          <p class="label-muted">[phone] · [email] · [website]</p>
        </div>
        <div class="template-card">
          <p class="template-label">Short bio</p>
          <p>${esc(manifest.tagline || manifest.purpose)}</p>
          <p class="label-muted">Link: [primary URL]</p>
        </div>
      </div>
    </section>`;
}

function renderPatternColors(tokens) {
  const groups = [
    { label: "Background", prefix: "color.bg." },
    { label: "Text", prefix: "color.text." },
    { label: "Border", prefix: "color.border." },
    { label: "Accent", prefix: "color.accent." },
  ];
  const short = (k) => k.split(".").pop();
  const rows = groups
    .map((g) => {
      const keys = Object.keys(tokens).filter((k) => k.startsWith(g.prefix));
      if (!keys.length) return "";
      return `<h3>${esc(g.label)}</h3><div class="swatch-row">${keys.map((k) => swatch(tokens, k, short(k))).join("")}</div>`;
    })
    .join("");
  return `
    <section class="panel" aria-labelledby="pattern-color-heading">
      <h2 id="pattern-color-heading">Color</h2>
      <p class="panel-lede">A single dark palette — this token set has no separate light variant.</p>
      ${rows}
    </section>`;
}

function renderPatternTypography(tokens) {
  const roles = [
    ...new Set(
      Object.keys(tokens)
        .filter((k) => k.startsWith("type."))
        .map((k) => k.split(".")[1]),
    ),
  ];
  const rows = roles
    .map((role) => {
      const size = tokens[`type.${role}.size`]?.resolvedValue;
      const weight = tokens[`type.${role}.weight`]?.resolvedValue;
      const lineHeight = tokens[`type.${role}.lineHeight`]?.resolvedValue;
      return `
        <div class="type-row">
          <span class="type-token">type.${esc(role)} — ${size}px / ${weight} / ${lineHeight}px lh</span>
          <span class="type-sample" style="grid-column: span 2; font-size:${size}px; font-weight:${weight}; line-height:${lineHeight}px">Sample Aa</span>
        </div>`;
    })
    .join("");
  return `
    <section class="panel" aria-labelledby="pattern-type-heading">
      <h2 id="pattern-type-heading">Typography</h2>
      <p class="panel-lede">No font family is specified in this token set — samples use the system UI font.</p>
      <div class="type-scale">${rows}</div>
    </section>`;
}

function renderPattern(pattern) {
  const { tokens } = pattern;
  applyTheme(tokens, "light"); // patterns have no dark branch of their own — they simply are one fixed palette
  // applyTheme only flips the outer chrome dark for a profile's own light->dark
  // toggle. A pattern that's simply always dark (per its own meta.mode) needs
  // the same chrome treatment, or its near-white text won't sit on a matching
  // dark app-header background.
  document.body.classList.toggle("demo-dark", pattern.meta?.mode === "Dark");

  const main = document.getElementById("app-main");
  main.innerHTML = `
    <section class="brand-header">
      <div class="brand-header-text">
        <h2 class="brand-name">${esc(pattern.name)}</h2>
        <p class="brand-tagline">${esc(pattern.tagline || pattern.description || "")}</p>
        <p class="brand-meta">
          Pattern <code>${esc(pattern.id)}</code>
          ${pattern.meta?.mode ? ` · mode <code>${esc(pattern.meta.mode)}</code>` : ""}
          ${pattern.meta?.source ? ` · source <code>${esc(pattern.meta.source)}</code>` : ""}
          ${pattern.meta?.figmaFileUrl ? ` · <a class="link-sample" href="${esc(pattern.meta.figmaFileUrl)}" target="_blank" rel="noopener">Open in Figma</a>` : ""}
        </p>
      </div>
    </section>
    ${renderPatternColors(tokens)}
    ${renderPatternTypography(tokens)}
    ${renderSpacing(tokens)}
    ${renderComponents()}
  `;

  wireTokenPopovers(tokens, "light");
}

function renderProfile(profile, mode, onToggleMode) {
  const { manifest, tokens } = profile;
  applyTheme(tokens, mode);

  const main = document.getElementById("app-main");
  const canDark = hasDarkTokens(tokens);
  main.innerHTML = `
    <section class="brand-header">
      <img class="brand-logo" src="${assetSrc(manifest.assetPaths?.logomark || "")}" alt="" width="56" height="56" />
      <div class="brand-header-text">
        <h2 class="brand-name">${esc(manifest.name)}</h2>
        <p class="brand-tagline">${esc(manifest.tagline)}</p>
        <p class="brand-meta">Profile <code>${esc(manifest.id)}</code> · token set <code>${esc(manifest.tokenSetId)}</code></p>
      </div>
      ${
        canDark
          ? `<button type="button" class="mode-toggle" id="mode-toggle">${mode === "dark" ? "Switch to light" : "Switch to dark"}</button>`
          : ""
      }
    </section>
    ${renderVoice(manifest)}
    ${renderColors(tokens)}
    ${renderTypography(tokens)}
    ${renderSpacing(tokens)}
    ${renderComponents()}
    ${renderLogos(manifest)}
    ${renderTemplates(manifest)}
  `;

  if (canDark) {
    document.getElementById("mode-toggle").addEventListener("click", () => onToggleMode());
  }

  wireTokenPopovers(tokens, mode);
}

function wireTokenPopovers(tokens, mode) {
  const popover = document.getElementById("token-popover");
  document.querySelectorAll(".swatch").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const path = btn.dataset.token;
      const node = effectiveNode(tokens, path, mode);
      popover.innerHTML = `
        <p class="token-path">${esc(path)}${mode === "dark" && node !== tokens[path] ? " (dark)" : ""}</p>
        <p class="token-value">${esc(tokenText(node))}</p>
        ${node.refPath ? `<p class="token-ref">resolved from <code>{${esc(node.refPath)}}</code></p>` : ""}
        ${node.description ? `<p class="token-desc">${esc(node.description)}</p>` : ""}
      `;
      const rect = btn.getBoundingClientRect();
      popover.style.left = `${rect.left + window.scrollX}px`;
      popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
      popover.hidden = false;
    });
  });
  document.addEventListener("click", () => {
    popover.hidden = true;
  });
}

function renderSwitcher(entries, activeId, onSelect) {
  const nav = document.getElementById("profile-switcher");
  nav.innerHTML = entries
    .map(
      (entry) => `
      <button type="button" class="profile-tab${entry.id === activeId ? " active" : ""}" data-id="${esc(entry.id)}">
        ${esc(entry.name)}
      </button>`,
    )
    .join("");
  nav.querySelectorAll(".profile-tab").forEach((btn) => {
    btn.addEventListener("click", () => onSelect(btn.dataset.id));
  });
}

async function main() {
  let data, patterns;
  try {
    [data, patterns] = await Promise.all([loadDesignSystem(), loadPatterns()]);
  } catch (err) {
    document.getElementById("app-main").innerHTML =
      `<p class="error">Could not load the design system: ${esc(err.message)}. Serve this app with <code>npm run demo</code> from the repo root (fetch of local JSON needs an http server, not file://).</p>`;
    return;
  }

  const unordered = [
    ...data.profiles.map((p) => ({
      kind: "profile",
      id: p.manifest.id,
      name: p.manifest.name,
      data: p,
    })),
    ...patterns.map((p) => ({ kind: "pattern", id: p.id, name: p.name, data: p })),
  ];

  // A pattern's own `default: true` wins over manifests/index.json's
  // defaultProfileId — lets the demo (and README's example prompt) lead with
  // a token-only pattern like therileys-team when that's the primary one.
  const defaultId = patterns.find((p) => p.default)?.id || data.defaultProfileId || unordered[0].id;
  const entries = [
    ...unordered.filter((e) => e.id === defaultId),
    ...unordered.filter((e) => e.id !== defaultId),
  ];

  const params = new URLSearchParams(location.search);
  const stored = localStorage.getItem("ds-demo-profile");
  const initialId =
    params.get("profile") || (entries.some((e) => e.id === stored) ? stored : null) || defaultId;

  let mode = "light";

  function select(id) {
    const entry = entries.find((e) => e.id === id) || entries[0];
    mode = "light"; // reset on switch; each profile's own toggle governs its own mode
    localStorage.setItem("ds-demo-profile", entry.id);
    const url = new URL(location.href);
    url.searchParams.set("profile", entry.id);
    history.replaceState(null, "", url);
    renderSwitcher(entries, entry.id, select);

    if (entry.kind === "pattern") {
      renderPattern(entry.data);
      return;
    }

    function toggleMode() {
      mode = mode === "dark" ? "light" : "dark";
      renderProfile(entry.data, mode, toggleMode);
    }
    renderProfile(entry.data, mode, toggleMode);
  }

  select(initialId);
}

main();
