#!/usr/bin/env node
/**
 * Lightweight manifest checks: JSON parse + required top-level keys from schema.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const required = ["id", "type", "name", "purpose", "values", "tone", "voice"];

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function validateManifest(data, file) {
  const missing = required.filter((k) => !(k in data));
  if (missing.length) {
    throw new Error(`${file}: missing keys: ${missing.join(", ")}`);
  }
  if (!["personal", "business"].includes(data.type)) {
    throw new Error(`${file}: invalid type`);
  }
  const t = data.tone;
  if (!t?.primary || !Array.isArray(t.secondary)) {
    throw new Error(`${file}: tone.primary and tone.secondary[] required`);
  }
  const v = data.voice;
  if (!v?.summary || !v?.theyAllSoundLike) {
    throw new Error(`${file}: voice.summary and voice.theyAllSoundLike required`);
  }
}

const indexPath = join(root, "design-system/manifests/index.json");
const index = loadJson(indexPath);

for (const rel of index.profiles) {
  const full = join(root, rel);
  const data = loadJson(full);
  validateManifest(data, rel);
}

const schemaDir = join(root, "design-system/manifests");
const loose = readdirSync(schemaDir).filter((f) => f.endsWith(".json") && f !== "index.json");
for (const f of loose) {
  const full = join(schemaDir, f);
  const data = loadJson(full);
  if (data.id) validateManifest(data, `design-system/manifests/${f}`);
}

console.log("All brand manifests OK.");
