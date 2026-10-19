import { execFileSync } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
const paths = execFileSync(
  "npm",
  ["ls", "--omit=dev", "--all", "--parseable"],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .slice(1);
const notices = [
  "# Third-party dependency notices",
  "",
  "License texts for the dependency closure of the bundled runtime packages. Type-only packages may also appear. The project itself is UNLICENSED.",
  "",
];
for (const path of paths) {
  const pkg = JSON.parse(await readFile(join(path, "package.json"), "utf8"));
  const candidates = (await readdir(path)).filter((name) =>
    /^(licen[sc]e|copying)(\.|$)/i.test(name),
  );
  if (!candidates.length)
    throw new Error(`No license text found for ${pkg.name}`);
  notices.push(
    `## ${pkg.name} ${pkg.version}`,
    "",
    `Declared license: ${pkg.license || "See text below"}`,
    "",
  );
  for (const name of candidates)
    notices.push(
      "```text",
      (await readFile(join(path, name), "utf8")).trim(),
      "```",
      "",
    );
}
await writeFile("THIRD_PARTY_NOTICES.md", notices.join("\n"));
