import { beforeEach, describe, expect, it, vi } from "vitest";
import * as path from "node:path";
import { createWorkflow, type Workflow } from "../src/core/model";

const state = vi.hoisted(() => ({
  files: new Map<string, Uint8Array>(),
  commands: new Map<string, (...args: any[]) => any>(),
  messages: [] as any[],
  receive: undefined as undefined | ((m: any) => Promise<void>),
  dirty: [] as any[],
  trusted: true,
  confirmations: [] as string[],
  drafts: new Map<string, unknown>(),
  symlinks: new Set<string>(),
}));
vi.mock("vscode", () => {
  class Uri {
    constructor(
      public path: string,
      public scheme = "file",
    ) {}
    toString() {
      return `${this.scheme}://${this.path}`;
    }
    static joinPath(uri: Uri, ...parts: string[]) {
      return new Uri(path.posix.join(uri.path, ...parts), uri.scheme);
    }
    static parse(value: string) {
      const split = value.indexOf(":");
      return new Uri(value.slice(split + 1), value.slice(0, split));
    }
  }
  class FileSystemError extends Error {
    constructor(public code: string) {
      super(code);
    }
  }
  const disposable = { dispose() {} };
  const workspace = {
    get isTrusted() {
      return state.trusted;
    },
    get textDocuments() {
      return state.dirty;
    },
    workspaceFolders: [{ uri: new Uri("/workspace/project") }],
    registerTextDocumentContentProvider: () => disposable,
    getWorkspaceFolder: () => ({ uri: new Uri("/workspace/project") }),
    fs: {
      async stat(uri: Uri) {
        if (state.symlinks.has(uri.path)) return { type: 64 | 2, size: 0 };
        const value = state.files.get(uri.path);
        if (value !== undefined) return { type: 1, size: value.length };
        if (
          uri.path === "/" ||
          ["/workspace", "/workspace/project"].includes(uri.path) ||
          [...state.files.keys()].some((k) => k.startsWith(uri.path + "/"))
        )
          return { type: 2, size: 0 };
        throw new FileSystemError("FileNotFound");
      },
      async readFile(uri: Uri) {
        const v = state.files.get(uri.path);
        if (!v) throw new FileSystemError("FileNotFound");
        return v;
      },
      async writeFile(uri: Uri, content: Uint8Array) {
        state.files.set(uri.path, content);
      },
      async createDirectory() {},
      async delete(uri: Uri) {
        state.files.delete(uri.path);
      },
      async readDirectory(uri: Uri) {
        const entries = new Map<string, number>();
        for (const key of state.files.keys())
          if (key.startsWith(uri.path + "/")) {
            const parts = key.slice(uri.path.length + 1).split("/");
            entries.set(parts[0], parts.length > 1 ? 2 : 1);
          }
        return [...entries.entries()];
      },
    },
  };
  return {
    Uri,
    FileSystemError,
    FileType: { File: 1, Directory: 2, SymbolicLink: 64 },
    ViewColumn: { One: 1 },
    workspace,
    window: {
      activeTextEditor: undefined,
      showWarningMessage: async (
        message: string,
        _options: unknown,
        choice: string,
      ) => {
        state.confirmations.push(message);
        return choice;
      },
      showErrorMessage: async (message: string) => {
        state.messages.push({ type: "error", message });
      },
      createWebviewPanel: () => ({
        reveal() {},
        onDidDispose: () => disposable,
        webview: {
          html: "",
          cspSource: "vscode-webview:",
          asWebviewUri: (uri: Uri) => uri,
          postMessage: async (message: any) => {
            state.messages.push(message);
          },
          onDidReceiveMessage: (fn: (m: any) => Promise<void>) => {
            state.receive = fn;
            return disposable;
          },
        },
      }),
    },
    commands: {
      registerCommand: (name: string, fn: (...args: any[]) => any) => {
        state.commands.set(name, fn);
        return disposable;
      },
      executeCommand: async () => {},
    },
  };
});
import * as vscode from "vscode";
import { activate } from "../src/extension";
const encoder = new TextEncoder();
const contents = (path: string) =>
  new TextDecoder().decode(state.files.get("/workspace/project/" + path));
function validRouting(): Workflow {
  const w = createWorkflow("Project");
  w.purpose = "Find the source";
  w.routes = [
    { task: "Read", path: "source.md", scope: "Full file", tool: "" },
  ];
  return w;
}
async function open() {
  await state.commands.get("icm.openBuilder")!();
  await state.receive!({ type: "ready" });
}
async function preview(w = validRouting()) {
  await state.receive!({ type: "preview", workflow: w });
  return state.messages.at(-1);
}
beforeEach(() => {
  state.files.clear();
  state.messages.length = 0;
  state.commands.clear();
  state.drafts.clear();
  state.dirty.length = 0;
  state.symlinks.clear();
  state.confirmations.length = 0;
  state.trusted = true;
  state.files.set("/workspace/project/source.md", encoder.encode("# Source\n"));
  const uri = vscode.Uri.parse("file:/extension");
  activate({
    extensionUri: uri,
    storageUri: vscode.Uri.parse("file:/storage"),
    globalStorageUri: vscode.Uri.parse("file:/global"),
    subscriptions: [],
    workspaceState: {
      get: (key: string) => state.drafts.get(key),
      update: async (key: string, value: unknown) => {
        state.drafts.set(key, value);
      },
    },
  } as unknown as vscode.ExtensionContext);
});
describe("extension host orchestration with a mocked VS Code API", () => {
  it("scans names, previews, applies and reloads canonical exports", async () => {
    state.files.set("/workspace/project/.env", encoder.encode("DO_NOT_READ"));
    state.files.set(
      "/workspace/project/node_modules/pkg/index.js",
      encoder.encode("ignored"),
    );
    await open();
    expect(state.messages.at(-1).inventory.files).toEqual(["source.md"]);
    const result = await preview();
    expect(result.type).toBe("preview");
    expect(contents("AGENT.md")).toBe("");
    await state.receive!({ type: "apply", token: result.token });
    expect(state.messages.at(-1).type).toBe("applied");
    expect(contents("CLAUDE.md")).toBe("Read [AGENT.md](AGENT.md).\n");
    expect(
      [...state.files.keys()].some((k) => k.startsWith("/storage/recovery/")),
    ).toBe(true);
    await state.receive!({ type: "reload" });
    expect(state.messages.at(-1).workflow).toEqual(validRouting());
    expect(state.messages.at(-1).readOnly).toBe(false);
  });
  it("blocks file changes after preview and preserves the human version", async () => {
    await open();
    const result = await preview();
    state.files.set(
      "/workspace/project/AGENT.md",
      encoder.encode("Human instructions"),
    );
    await state.receive!({ type: "apply", token: result.token });
    expect(state.messages.at(-1).type).toBe("error");
    expect(contents("AGENT.md")).toBe("Human instructions");
    expect(contents("CONTEXT.md")).toBe("");
  });
  it("blocks unsaved text editor buffers before preparing a replacement", async () => {
    await open();
    state.dirty.push({
      isDirty: true,
      uri: vscode.Uri.parse("file:/workspace/project/AGENT.md"),
    });
    const result = await preview();
    expect(result.type).toBe("error");
    expect(result.message).toContain("unsaved");
  });
  it("requires a current host-issued preview token", async () => {
    await open();
    await preview();
    await state.receive!({ type: "apply", token: "invented" });
    expect(state.messages.at(-1).message).toContain("Preview expired");
    expect(contents("AGENT.md")).toBe("");
  });
  it("keeps unsupported edited Markdown read-only", async () => {
    await open();
    const result = await preview();
    await state.receive!({ type: "apply", token: result.token });
    state.files.set(
      "/workspace/project/CONTEXT.md",
      encoder.encode(contents("CONTEXT.md") + "\n## User notes\nKeep.\n"),
    );
    await state.receive!({ type: "reload" });
    expect(state.messages.at(-1).readOnly).toBe(true);
    expect((await preview()).type).toBe("error");
    expect(contents("CONTEXT.md")).toContain("User notes");
  });
  it("rejects symlink destinations and leaves files unchanged", async () => {
    await open();
    state.symlinks.add("/workspace/project/setup");
    const result = await preview();
    expect(result.type).toBe("error");
    expect(result.message).toContain("Symlink");
    expect(contents("AGENT.md")).toBe("");
  });
  it("does not create an editor in an untrusted workspace", async () => {
    state.trusted = false;
    state.receive = undefined;
    await state.commands.get("icm.openBuilder")!();
    expect(state.receive).toBeUndefined();
    expect(state.confirmations[0]).toContain("Trust");
  });
});
