import { chromium } from "playwright-core";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const temp = await mkdtemp(join(tmpdir(), "icm-ui-"));
await build({
  stdin: {
    contents:
      "export * from './src/core/model'; export * from './src/core/markdown'; export * from './src/core/storage';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: join(temp, "core.cjs"),
});
const core = createRequire(import.meta.url)(join(temp, "core.cjs"));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1000 },
  });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const files = new Map([["source.md", "# Source\n\nA source."]]);
  const store = {
    read: async (p) => files.get(p),
    write: async (p, content) => {
      files.set(p, content);
    },
    remove: async (p) => {
      files.delete(p);
    },
  };
  let workflow = core.createWorkflow("UI smoke");
  let pending;
  let saved;
  const send = (data) =>
    page.evaluate(
      (data) => window.dispatchEvent(new MessageEvent("message", { data })),
      data,
    );
  await page.exposeFunction("hostBridge", async (message) => {
    try {
      if (message.type === "ready" || message.type === "reload") {
        let readOnly = false;
        let notice = "";
        if (message.type === "reload") {
          try {
            workflow = core.parseExport(
              [...files].map(([path, content]) => ({ path, content })),
            );
          } catch (e) {
            readOnly = true;
            notice = e.message;
          }
        }
        await send({
          type: "init",
          root: "/synthetic/workspace",
          workflow,
          inventory: {
            files: [...files.keys()],
            suggestions: [],
            truncated: false,
          },
          readOnly,
          notice,
        });
      }
      if (message.type === "save") {
        saved = message.workflow;
        await send({
          type: "notice",
          message: "Draft saved in VS Code workspace storage.",
        });
      }
      if (message.type === "preview") {
        workflow = core.workflowSchema.parse(message.workflow);
        assert.equal(
          core
            .validate(workflow, {
              files: [...files.keys()],
              suggestions: [],
              truncated: false,
            })
            .filter((d) => d.severity === "error").length,
          0,
        );
        pending = await core.preview(store, core.generate(workflow));
        await send({
          type: "preview",
          token: "ui-test-token",
          changes: pending,
        });
      }
      if (message.type === "apply") {
        await core.applyChanges(store, pending);
        await send({ type: "applied", message: "Exported files." });
      }
    } catch (e) {
      await send({ type: "error", message: e.message });
      throw e;
    }
  });
  await page.route("http://localhost/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html lang="en"><body><div id="root"></div></body></html>',
    }),
  );
  await page.goto("http://localhost/");
  await page.evaluate(() => {
    window.acquireVsCodeApi = () => ({
      postMessage: (message) => {
        void window.hostBridge(message);
      },
    });
  });
  await page.addStyleTag({
    content: await readFile("dist/webview.css", "utf8"),
  });
  await page.addScriptTag({
    content: await readFile("dist/webview.js", "utf8"),
  });
  await page.getByRole("heading", { name: "ICM Workflow Builder" }).waitFor();
  await page
    .getByLabel("Purpose and final outcome")
    .fill("Find sources for a report");
  await page.getByRole("button", { name: "Continue to design" }).click();
  await page.getByRole("button", { name: "Add route", exact: true }).click();
  await page.getByLabel("Task", { exact: true }).fill("Read source");
  await page.getByLabel("Workspace-relative file").fill("source.md");
  await page
    .getByRole("button", { name: "Preview export", exact: true })
    .click();
  await page.getByRole("heading", { name: "5 file change(s)" }).waitFor();
  assert.equal(files.has("AGENT.md"), false, "Preview must not write files");
  await page
    .getByRole("button", { name: "Apply reviewed changes", exact: true })
    .click();
  await page.getByText("Exported files.", { exact: true }).waitFor();
  assert.equal(files.get("CLAUDE.md"), "Read [AGENT.md](AGENT.md).\n");
  assert.match(files.get("CONTEXT.md"), /Read source/);
  await page.getByRole("button", { name: "Reload files" }).click();
  await page.getByRole("button", { name: "1. Discover" }).click();
  await page.getByLabel("Editor mode").selectOption("pipeline");
  await page.getByLabel("Smallest sufficient mechanism").selectOption("ICM");
  await page.getByRole("button", { name: "Continue to design" }).click();
  await page.getByRole("button", { name: "Add stage", exact: true }).click();
  await page.getByLabel("Stage name", { exact: true }).fill("Research");
  await page.getByLabel("One job / purpose").fill("Collect evidence");
  await page
    .getByLabel("Process (one action per line)")
    .fill("Read sources\nSave notes");
  await page.getByRole("button", { name: "Add stage", exact: true }).click();
  await page.getByLabel("Stage name", { exact: true }).fill("Write");
  await page.getByLabel("One job / purpose").fill("Produce a draft");
  await page
    .getByLabel("Process (one action per line)")
    .fill("Read notes\nWrite draft");
  await page.getByRole("checkbox", { name: "Research → result.md" }).check();
  assert.equal(await page.locator(".react-flow__edge").count(), 1);
  await page.getByRole("button", { name: "Move Write up" }).click();
  await page.getByRole("button", { name: /3. Review/ }).click();
  await page
    .getByText(/An artifact input must come from an earlier stage/)
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Preview export", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "2. Design" }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByText("Draft saved in VS Code workspace storage.", { exact: true })
    .waitFor();
  // Exercise actual canvas dragging, then verify its persisted position.
  const initialPosition = { ...saved.stages[0].position };
  const nodeTitle = page.locator(".react-flow__node").first().locator("strong");
  const box = await nodeTitle.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 45,
    box.y + box.height / 2 + 20,
    { steps: 8 },
  );
  await page.mouse.up();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(".save-state")?.textContent === "Draft unchanged",
  );
  assert.notDeepEqual(saved.stages[0].position, initialPosition);
  assert.equal(saved.stages[0].name, "Research");
  assert.equal(saved.stages[1].inputs[0].stageId, saved.stages[0].id);
  await page
    .getByRole("button", { name: "Preview export", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply reviewed changes", exact: true })
    .click();
  await page.getByText("Exported files.", { exact: true }).waitFor();
  assert.match(
    files.get("stages/02-write/CONTEXT.md"),
    /\.\.\/01-research\/output\/result.md/,
  );
  await page.getByRole("button", { name: "Reload files" }).click();
  await page.getByRole("button", { name: "2. Design" }).click();
  await page
    .getByRole("button", { name: "1. Research", exact: true })
    .waitFor();
  await page.screenshot({
    path: "/tmp/icm-workflow-builder.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 700, height: 1000 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 2,
    ),
    true,
    "Narrow layout must not overflow",
  );
  files.set(
    "CONTEXT.md",
    files.get("CONTEXT.md") + "\n## User notes\nDo not lose these.\n",
  );
  await page.getByRole("button", { name: "Reload files" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Unsupported edits" })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Preview export", exact: true })
      .isDisabled(),
    true,
  );
  assert.deepEqual(pageErrors, []);
  console.log(
    "Browser smoke passed: routing, 2-stage graph, dependency validation, undo, save draft, reviewed export, round-trip reload, narrow layout, unsupported-edit protection. Host bridge is simulated; the real Webview bundle and core are exercised.",
  );
} finally {
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
