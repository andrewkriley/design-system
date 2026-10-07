import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = fs.readFileSync("VERSION", "utf8").trim();
const changelog = fs.readFileSync("CHANGELOG.md", "utf8");
const tag = `v${version}`;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`VERSION must be MAJOR.MINOR.PATCH, got ${version}`);
}

if (pkg.version !== version) {
  throw new Error(`package.json version ${pkg.version} does not match VERSION ${version}`);
}

if (!changelog.includes(`## [${version}]`)) {
  throw new Error(`CHANGELOG.md is missing an entry for ${version}`);
}

if (!changelog.includes("vMAJOR.MINOR.PATCH")) {
  throw new Error("CHANGELOG.md must document the vMAJOR.MINOR.PATCH tag format");
}

console.log(`version metadata ok: ${version} (${tag})`);
