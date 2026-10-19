import * as vscode from "vscode";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  createWorkflow,
  workflowSchema,
  validate,
  safePath,
  type Inventory,
  type Workflow,
} from "./core/model";
import { generate, parseExport } from "./core/markdown";
import {
  preview,
  applyChanges,
  type FileStore,
  type Change,
} from "./core/storage";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const excluded = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".venv",
  "venv",
  ".aws",
  ".ssh",
  ".icm",
]);
const sensitive = (name: string) =>
  /^(\.env($|\.)|credentials($|\.)|id_rsa|id_ed25519)|\.(pem|key|p12|pfx)$/i.test(
    name,
  );
const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready") }),
  z.object({ type: z.literal("save"), workflow: workflowSchema }),
  z.object({ type: z.literal("preview"), workflow: workflowSchema }),
  z.object({ type: z.literal("apply"), token: z.string().max(100) }),
  z.object({
    type: z.literal("diff"),
    token: z.string().max(100),
    path: z.string().max(240),
  }),
  z.object({ type: z.literal("reload") }),
]);
async function scan(root: vscode.Uri): Promise<Inventory> {
  const inventory: Inventory = { files: [], suggestions: [], truncated: false };
  let count = 0;
  async function visit(uri: vscode.Uri, prefix: string, depth: number) {
    if (depth > 20 || count >= 10000) {
      inventory.truncated = true;
      return;
    }
    let children: [string, vscode.FileType][];
    try {
      children = await vscode.workspace.fs.readDirectory(uri);
    } catch {
      inventory.truncated = true;
      return;
    }
    for (const [name, type] of children.sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (++count > 10000) {
        inventory.truncated = true;
        return;
      }
      if (
        excluded.has(name) ||
        sensitive(name) ||
        type & vscode.FileType.SymbolicLink
      )
        continue;
      const path = prefix + name;
      if (!safePath(path)) continue;
      if (type & vscode.FileType.Directory)
        await visit(vscode.Uri.joinPath(uri, name), `${path}/`, depth + 1);
      else if (type & vscode.FileType.File) inventory.files.push(path);
    }
  }
  await visit(root, "", 0);
  if (inventory.files.some((f) => f.endsWith("package.json")))
    inventory.suggestions.push(
      "package.json found: Node.js may be relevant. This does not verify installation.",
    );
  if (
    inventory.files.some((f) =>
      /(^|\/)(pyproject.toml|requirements.txt)$/.test(f),
    )
  )
    inventory.suggestions.push(
      "Python manifest found: consider documenting Python prerequisites.",
    );
  if (inventory.files.some((f) => f.endsWith("CONTEXT.md")))
    inventory.suggestions.push(
      "Existing CONTEXT.md found: preserve useful routing before adding new stages.",
    );
  if (inventory.files.some((f) => f.endsWith("SKILL.md")))
    inventory.suggestions.push(
      "Skill entry points found: reference only the skills needed by each stage.",
    );
  return inventory;
}
function fileStore(root: vscode.Uri): FileStore {
  async function target(path: string) {
    if (!safePath(path)) throw new Error(`Unsafe path: ${path}`);
    let uri = root;
    const parts = path.split("/");
    for (let index = 0; index < parts.length; index++) {
      uri = vscode.Uri.joinPath(uri, parts[index]);
      try {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.type & vscode.FileType.SymbolicLink)
          throw new Error(`Symlink access is not allowed: ${path}`);
        if (
          index < parts.length - 1 &&
          !(stat.type & vscode.FileType.Directory)
        )
          throw new Error(`Not a directory: ${uri.path}`);
        if (index === parts.length - 1 && !(stat.type & vscode.FileType.File))
          throw new Error(`Not a regular file: ${path}`);
      } catch (error) {
        if (!(
          error instanceof vscode.FileSystemError &&
          error.code === "FileNotFound"
        ))
          throw error;
      }
    }
    return uri;
  }
  return {
    async read(path) {
      const uri = await target(path);
      try {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.size > 1024 * 1024)
          throw new Error(`File too large to review safely: ${path}`);
        return decoder.decode(await vscode.workspace.fs.readFile(uri));
      } catch (error) {
        if (
          error instanceof vscode.FileSystemError &&
          error.code === "FileNotFound"
        )
          return undefined;
        throw error;
      }
    },
    async write(path, content) {
      const uri = await target(path);
      // workspace.fs may create directories but never follows a known symlink here.
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, ".."));
      await target(path);
      await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
    },
    async remove(path) {
      await vscode.workspace.fs.delete(await target(path));
    },
  };
}
async function chooseRoot(uri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  if (
    uri &&
    (await vscode.workspace.fs.stat(uri)).type & vscode.FileType.Directory
  )
    return uri;
  const active = vscode.window.activeTextEditor?.document.uri;
  if (active && vscode.workspace.getWorkspaceFolder(active))
    return vscode.Uri.joinPath(active, "..");
  const folders = vscode.workspace.workspaceFolders || [];
  if (folders.length === 1) return folders[0].uri;
  if (folders.length > 1)
    return (
      await vscode.window.showWorkspaceFolderPick({
        placeHolder: "Choose a folder for the ICM workflow",
      })
    )?.uri;
  return (
    await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: "Open ICM Builder",
    })
  )?.[0];
}
async function loadExport(store: FileStore): Promise<Workflow | undefined> {
  const metadata = await store.read(".icm/editor.json");
  if (metadata === undefined) return undefined;
  const schema = z.object({
    version: z.literal(1),
    profile: z.literal("icm-builder-v1"),
    stages: z
      .array(
        z.object({
          id: z.string(),
          path: z.string(),
          position: z.object({ x: z.number(), y: z.number() }),
        }),
      )
      .max(100),
  });
  const meta = schema.parse(JSON.parse(metadata));
  const paths = [
    "AGENT.md",
    "CLAUDE.md",
    "CONTEXT.md",
    "setup/decision.md",
    ".icm/editor.json",
    ...meta.stages.map((s) => `${s.path}/CONTEXT.md`),
  ];
  const entries = [];
  for (const path of paths) {
    const content = await store.read(path);
    if (content === undefined)
      throw new Error(`Missing workflow file: ${path}`);
    entries.push({ path, content });
  }
  return parseExport(entries);
}
function html(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const nonce = randomBytes(24).toString("base64");
  const asset = (name: string) =>
    webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "dist", name));
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource};"><link rel="stylesheet" href="${asset("webview.css")}"><title>ICM Workflow Builder</title></head><body><div id="root"></div><script nonce="${nonce}" src="${asset("webview.js")}"></script></body></html>`;
}
export function activate(context: vscode.ExtensionContext) {
  const panels = new Map<string, vscode.WebviewPanel>();
  const diffs = new Map<string, string>();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("icm-preview", {
      provideTextDocumentContent(uri) {
        return diffs.get(uri.toString()) || "";
      },
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "icm.openBuilder",
      async (uri?: vscode.Uri) => {
        if (!vscode.workspace.isTrusted) {
          void vscode.window.showWarningMessage(
            "Trust this workspace before editing workflows.",
          );
          return;
        }
        try {
          const chosenRoot = await chooseRoot(uri);
          if (!chosenRoot) return;
          const root: vscode.Uri = chosenRoot;
          for (
            let ancestor = root;
            ;
            ancestor = vscode.Uri.joinPath(ancestor, "..")
          ) {
            if (
              (await vscode.workspace.fs.stat(ancestor)).type &
              vscode.FileType.SymbolicLink
            )
              throw new Error(
                "Choose a real folder without symlink ancestors.",
              );
            if (vscode.Uri.joinPath(ancestor, "..").path === ancestor.path)
              break;
          }
          const key = root.toString();
          const existing = panels.get(key);
          if (existing) {
            existing.reveal();
            return;
          }
          const panel = vscode.window.createWebviewPanel(
            "icm.builder",
            "ICM Workflow Builder",
            vscode.ViewColumn.One,
            {
              enableScripts: true,
              retainContextWhenHidden: true,
              localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, "dist"),
              ],
            },
          );
          panels.set(key, panel);
          const disposables: vscode.Disposable[] = [];
          const diffKeys = new Set<string>();
          panel.onDidDispose(() => {
            panels.delete(key);
            disposables.forEach((d) => d.dispose());
            diffKeys.forEach((k) => diffs.delete(k));
          });
          const store = fileStore(root);
          function assertSavedBuffers(paths: string[]) {
            const targets = new Set(
              paths.map((path) => vscode.Uri.joinPath(root, path).toString()),
            );
            const dirty = vscode.workspace.textDocuments.find(
              (doc) => doc.isDirty && targets.has(doc.uri.toString()),
            );
            if (dirty)
              throw new Error(
                `Save or discard unsaved text-editor changes first: ${dirty.uri.path}`,
              );
          }
          let pending:
            | { token: string; changes: Change[]; workflow: Workflow }
            | undefined;
          let busy = false;
          let readOnly = false;
          let loadedBaseline: Map<string, string | undefined> | undefined;
          const draftKey = `icm.draft.${key}`;
          async function initialize(useDraft: boolean) {
            readOnly = false;
            loadedBaseline = undefined;
            let workflow: Workflow | undefined;
            let notice = "";
            try {
              workflow = await loadExport(store);
            } catch (error) {
              readOnly = true;
              notice = `${error instanceof Error ? error.message : error} Read-only mode: no files can be exported.`;
            }
            if (workflow) {
              loadedBaseline = new Map();
              for (const file of generate(workflow))
                loadedBaseline.set(file.path, await store.read(file.path));
            }
            const draft = workflowSchema.safeParse(
              context.workspaceState.get(draftKey),
            );
            if (useDraft && draft.success && !readOnly) {
              workflow = draft.data;
              notice =
                "Restored a local editing draft. Exported Markdown remains unchanged until you apply a preview.";
            }
            const inventory = await scan(root);
            await panel.webview.postMessage({
              type: "init",
              root: root.path,
              workflow:
                workflow ||
                createWorkflow(
                  root.path.split("/").filter(Boolean).pop() || "Workspace",
                ),
              inventory,
              readOnly,
              notice,
            });
          }
          disposables.push(
            panel.webview.onDidReceiveMessage(async (raw) => {
              const parsed = messageSchema.safeParse(raw);
              if (!parsed.success) {
                await panel.webview.postMessage({
                  type: "error",
                  message: "Invalid editor message.",
                });
                return;
              }
              const message = parsed.data;
              if (busy) {
                await panel.webview.postMessage({
                  type: "error",
                  message:
                    "Another operation is in progress. Try again when it finishes.",
                });
                return;
              }
              busy = true;
              try {
                if (message.type === "ready") await initialize(true);
                if (message.type === "reload") {
                  const answer = await vscode.window.showWarningMessage(
                    "Reload exported files and discard the local editing draft?",
                    { modal: true },
                    "Reload",
                  );
                  if (answer === "Reload") {
                    pending = undefined;
                    await context.workspaceState.update(draftKey, undefined);
                    await initialize(false);
                  } else
                    await panel.webview.postMessage({
                      type: "notice",
                      message: "Reload cancelled. Your draft is unchanged.",
                    });
                }
                if (message.type === "save") {
                  if (readOnly) throw new Error("This workflow is read-only.");
                  pending = undefined;
                  await context.workspaceState.update(
                    draftKey,
                    message.workflow,
                  );
                  await panel.webview.postMessage({
                    type: "notice",
                    message:
                      "Draft saved in VS Code workspace storage. No project files were changed.",
                  });
                }
                if (message.type === "preview") {
                  pending = undefined;
                  if (readOnly)
                    throw new Error(
                      "Unsupported existing workflow. Edit its files directly.",
                    );
                  const inventory = await scan(root);
                  const errors = validate(message.workflow, inventory).filter(
                    (d) => d.severity === "error",
                  );
                  if (errors.length)
                    throw new Error(errors.map((d) => d.message).join("\n"));
                  const generated = generate(message.workflow);
                  if (loadedBaseline)
                    for (const [path, content] of loadedBaseline) {
                      if ((await store.read(path)) !== content)
                        throw new Error(
                          `${path} changed outside this editor. Save your draft, then reload exported files before continuing.`,
                        );
                    }
                  assertSavedBuffers(generated.map((f) => f.path));
                  const changes = await preview(store, generated);
                  pending = {
                    token: randomBytes(18).toString("hex"),
                    changes,
                    workflow: message.workflow,
                  };
                  await panel.webview.postMessage({
                    type: "preview",
                    token: pending.token,
                    changes,
                    warnings: validate(message.workflow, inventory).filter(
                      (d) => d.severity === "warning",
                    ),
                  });
                }
                if (message.type === "diff") {
                  if (!pending || pending.token !== message.token)
                    throw new Error("Preview expired. Generate a new preview.");
                  const file = pending.changes.find(
                    (c) => c.path === message.path,
                  );
                  if (!file) throw new Error("File is not in this preview.");
                  const before = vscode.Uri.parse(
                    `icm-preview:/${pending.token}/before/${file.path}`,
                  );
                  const after = vscode.Uri.parse(
                    `icm-preview:/${pending.token}/after/${file.path}`,
                  );
                  diffs.set(before.toString(), file.before || "");
                  diffs.set(after.toString(), file.content);
                  diffKeys.add(before.toString());
                  diffKeys.add(after.toString());
                  await vscode.commands.executeCommand(
                    "vscode.diff",
                    before,
                    after,
                    `ICM: ${file.path}`,
                    { preview: true },
                  );
                }
                if (message.type === "apply") {
                  if (!vscode.workspace.isTrusted || readOnly)
                    throw new Error(
                      "Workspace is not writable by this editor.",
                    );
                  if (!pending || pending.token !== message.token)
                    throw new Error("Preview expired. Generate a new preview.");
                  const plan = pending;
                  const overwrite = plan.changes.filter(
                    (c) => c.before !== undefined,
                  );
                  if (overwrite.length) {
                    const answer = await vscode.window.showWarningMessage(
                      `Replace ${overwrite.length} existing file(s)? Check their diffs first. Existing stage output files are preserved.`,
                      { modal: true },
                      "Apply reviewed changes",
                    );
                    if (answer !== "Apply reviewed changes") {
                      await panel.webview.postMessage({
                        type: "notice",
                        message: "Export cancelled. No files changed.",
                      });
                      return;
                    }
                  }
                  const recovery = vscode.Uri.joinPath(
                    context.storageUri || context.globalStorageUri,
                    "recovery",
                    `${Date.now()}-${plan.token}.json`,
                  );
                  await vscode.workspace.fs.createDirectory(
                    vscode.Uri.joinPath(recovery, ".."),
                  );
                  await vscode.workspace.fs.writeFile(
                    recovery,
                    encoder.encode(
                      JSON.stringify(
                        { root: key, changes: plan.changes },
                        null,
                        2,
                      ),
                    ),
                  );
                  try {
                    assertSavedBuffers(plan.changes.map((c) => c.path));
                    await applyChanges(store, plan.changes);
                  } catch (error) {
                    throw new Error(
                      `${error instanceof Error ? error.message : error}\nRecovery snapshot: ${recovery.toString()}`,
                    );
                  }
                  pending = undefined;
                  loadedBaseline = new Map();
                  for (const file of generate(plan.workflow))
                    loadedBaseline.set(file.path, await store.read(file.path));
                  await context.workspaceState.update(draftKey, undefined);
                  await panel.webview.postMessage({
                    type: "applied",
                    message: `Exported ${plan.changes.length} file change(s). AGENT.md is canonical; CLAUDE.md only links to it. Old stage folders are preserved when stages are renamed or removed.`,
                  });
                }
              } catch (error) {
                await panel.webview.postMessage({
                  type: "error",
                  message:
                    error instanceof Error ? error.message : String(error),
                });
              } finally {
                busy = false;
              }
            }),
          );
          panel.webview.html = html(panel.webview, context.extensionUri);
        } catch (error) {
          void vscode.window.showErrorMessage(
            `ICM: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    ),
  );
}
export function deactivate() {}
