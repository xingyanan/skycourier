import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const outfile = resolve("node_modules/.cache/sky-selftest.mjs");
mkdirSync(dirname(outfile), { recursive: true });
await build({
  entryPoints: ["src/game/selftest.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile,
  logLevel: "warning",
});

const mod = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
const result = mod.runSelfTest();
console.log(result.report);
process.exit(result.ok ? 0 : 1);
