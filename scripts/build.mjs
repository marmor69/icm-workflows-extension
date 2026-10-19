import { build, context } from "esbuild";
import { mkdir } from "node:fs/promises";
await mkdir("dist", { recursive: true });
const configs = [
  {
    entryPoints: ["src/extension.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    external: ["vscode"],
    outfile: "dist/extension.cjs",
    target: "node20",
  },
  {
    entryPoints: ["src/webview/index.tsx"],
    bundle: true,
    platform: "browser",
    format: "iife",
    outfile: "dist/webview.js",
    target: "es2022",
  },
];
for (const config of configs) {
  if (process.argv.includes("--watch")) await (await context(config)).watch();
  else await build(config);
}
