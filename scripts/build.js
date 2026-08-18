#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "bundle");
const DIST_DIR = path.join(ROOT, "dist");
const ORDER = ["entry.js", "metro.js", "patcher.js", "storage.js", "prefs.js", "ui.js", "exporter.js", "settings.js"];
const OUT = path.join(DIST_DIR, "spine.js");

function main() {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  let parts = [];
  for (const file of ORDER) {
    const p = path.join(SRC_DIR, file);
    if (!fs.existsSync(p)) {
      console.error("Faltando: " + p);
      process.exit(1);
    }
    const src = fs.readFileSync(p, "utf8");
    parts.push("/* ===== " + file + " ===== */\n" + src);
  }
  const bundle = parts.join("\n\n") + "\n\ntry {\n  setTimeout(function () { SPINE.boot && SPINE.boot(); }, 500);\n} catch (e) {}\n";
  fs.writeFileSync(OUT, bundle);
  console.log("spine bundle -> " + OUT + " (" + bundle.length + " bytes)");

  try {
    const { execSync } = require("child_process");
    execSync("npx --no-install hermes-compiler " + JSON.stringify(OUT) + " -out " + JSON.stringify(path.join(DIST_DIR, "spine.hbc")) + " -O", { stdio: "pipe", cwd: ROOT });
    console.log("spine hbc    -> " + path.join(DIST_DIR, "spine.hbc"));
  } catch (e) {
    console.log("hermes-compiler indisponivel; somente JS gerado (ok p/ runtime).");
  }
}

main();