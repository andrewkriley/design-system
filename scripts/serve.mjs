#!/usr/bin/env node
/**
 * Zero-dependency static file server for the design system demo.
 * Serves the repo root so the demo app can fetch manifests/tokens by their real repo-relative paths.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const port = Number(process.env.PORT) || 4173;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let relPath = normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  if (relPath === "/") relPath = "/design-system/demo/index.html";

  let filePath = join(root, relPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }
  if (!existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(`Not found: ${relPath}`);
    return;
  }

  const type = contentTypes[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  const url = `http://localhost:${port}/design-system/demo/`;
  console.log(`Design system demo running at ${url}`);
  console.log("Press Ctrl+C to stop.");
  if (process.platform === "darwin" && !process.env.CI) {
    exec(`open "${url}"`, () => {});
  }
});
