import { describe, expect, it } from "vitest";
import {
  createWorkflow,
  newStage,
  safePath,
  validate,
  type Workflow,
} from "../src/core/model";
import { generate, parseExport } from "../src/core/markdown";
import { applyChanges, preview, type FileStore } from "../src/core/storage";

function pipeline(): Workflow {
  const w = createWorkflow("Research & writing");
  w.mode = "pipeline";
  w.purpose = "Produce a reviewed report";
  w.mechanism = "ICM";
  w.intake = [
    "Weekly research",
    "Draft",
    "Research to writing",
    "Repository",
    "None",
  ];
  w.rationale = "Editable handoffs";
  w.humanCheck = "Editor reviews draft";
  w.boundary = "No publishing";
  w.revisit = "Concurrent writers";
  w.stages = [
    newStage("research", 0),
    newStage("draft", 1),
    newStage("review", 2),
  ].map((s, i) => ({
    ...s,
    name: ["Research", "Draft", "Review"][i],
    purpose: "One job",
    process: "Read inputs\nProduce the result",
    checkpoint: "After step 1: editor approves direction",
    audit: "Every claim cites a source",
  }));
  w.stages[1].inputs = [{ stageId: "research" }];
  w.stages[2].inputs = [{ stageId: "draft" }];
  return w;
}
function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const store: FileStore = {
    read: async (p) => data.get(p),
    write: async (p, s) => {
      data.set(p, s);
    },
    remove: async (p) => {
      data.delete(p);
    },
  };
  return { data, store };
}
describe("ICM contracts and agent routing", () => {
  it("exports AGENT.md as canonical and CLAUDE.md solely as a pointer", () => {
    const files = generate(pipeline());
    expect(files.find((f) => f.path === "CLAUDE.md")?.content).toBe(
      "Read [AGENT.md](AGENT.md).\n",
    );
    expect(files.find((f) => f.path === "AGENT.md")?.content).toContain(
      "[CONTEXT.md](CONTEXT.md)",
    );
    expect(
      files.find((f) => f.path === "stages/02-draft/CONTEXT.md")?.content,
    ).toContain("../01-research/output/result.md");
    expect(files.some((f) => f.path.endsWith("/output/result.md"))).toBe(false);
  });
  it("round-trips all stage fields, references, tools, intake and canvas positions", () => {
    const w = pipeline();
    w.stages[0].references = [
      {
        path: "shared/rules.md",
        scope: "Rules",
        why: "Style | examples <br> & more\nsecond line",
      },
    ];
    w.stages[0].tools = [
      { name: "Node.js", purpose: "Build assets", guide: "shared/tools.md" },
    ];
    w.stages[0].process =
      "Read <script> as data\nPreserve | tables & strings\n";
    w.rationale = "  Preserve boundary spaces  ";
    expect(parseExport(generate(w))).toEqual(w);
  });
  it("round-trips a routing-only workspace without introducing stages", () => {
    const w = createWorkflow("Library");
    w.purpose = "Locate resources";
    w.routes = [
      {
        task: "Read rules",
        path: "rules.md",
        scope: "Full file",
        tool: "Text editor",
      },
    ];
    expect(parseExport(generate(w))).toEqual(w);
    expect(generate(w).some((f) => f.path.startsWith("stages/"))).toBe(false);
  });
  it("rejects unknown Markdown rather than dropping user content", () => {
    const files = generate(pipeline());
    files.find((f) => f.path === "CONTEXT.md")!.content +=
      "\n## Manual notes\n\nKeep this.\n";
    expect(() => parseExport(files)).toThrow("Unsupported edits");
  });
  it("rejects changed artifact binding instead of silently reverting it", () => {
    const files = generate(pipeline());
    const file = files.find((f) => f.path === "stages/02-draft/CONTEXT.md")!;
    file.content = file.content.replace("output/result.md", "output/other.md");
    expect(() => parseExport(files)).toThrow("Unsupported edits");
  });
});
describe("structural validation", () => {
  it("accepts declared future artifacts without fake output files", () => {
    expect(
      validate(pipeline(), {
        files: [],
        suggestions: [],
        truncated: false,
      }).filter((d) => d.severity === "error"),
    ).toEqual([]);
  });
  it("rejects cycles and reordered consumers", () => {
    const w = pipeline();
    w.stages[0].inputs = [{ stageId: "draft" }];
    expect(validate(w).some((d) => d.message.includes("earlier stage"))).toBe(
      true,
    );
  });
  it("flags missing references and missing tool guides", () => {
    const w = pipeline();
    w.stages[0].references = [
      { path: "absent.md", scope: "Full file", why: "Rules" },
    ];
    w.stages[0].tools = [{ name: "Python", purpose: "Convert", guide: "" }];
    const errors = validate(w, {
      files: [],
      suggestions: [],
      truncated: false,
    }).filter((d) => d.severity === "error");
    expect(errors).toHaveLength(2);
    expect(errors.every((d) => d.stageId === "research")).toBe(true);
  });
  it("distinguishes incomplete inventory from confirmed missing files", () => {
    const w = pipeline();
    w.stages[0].references = [
      { path: "rules.md", scope: "Rules", why: "Style" },
    ];
    expect(
      validate(w, { files: [], suggestions: [], truncated: true }).find((d) =>
        d.message.includes("not found"),
      )?.severity,
    ).toBe("warning");
  });
  it.each([
    "../outside",
    "/absolute",
    "a/../../secret",
    "a\\..\\b",
    ".git/config",
    "CON.txt",
    "a//b",
    "a/./b",
    "trailing.",
    "a%2fb",
    "a\u0000b",
  ])("rejects unsafe path %s", (path) => {
    expect(safePath(path)).toBe(false);
  });
  it("permits output paths and editor metadata", () => {
    expect(safePath("stages/01-research/output/.gitkeep")).toBe(true);
    expect(safePath(".icm/editor.json")).toBe(true);
  });
});
describe("reviewed filesystem writes", () => {
  it("preview never mutates files; apply writes exactly reviewed content", async () => {
    const { store, data } = memory({ "AGENT.md": "old" });
    const changes = await preview(store, [
      { path: "AGENT.md", content: "new" },
      { path: "CONTEXT.md", content: "routing" },
    ]);
    expect(data.get("AGENT.md")).toBe("old");
    expect(data.has("CONTEXT.md")).toBe(false);
    await applyChanges(store, changes);
    expect(data.get("AGENT.md")).toBe("new");
    expect(
      await preview(store, [{ path: "AGENT.md", content: "new" }]),
    ).toEqual([]);
  });
  it("blocks all writes when one file changed after preview", async () => {
    const { store, data } = memory({ "AGENT.md": "old" });
    const changes = await preview(store, [
      { path: "CONTEXT.md", content: "new" },
      { path: "AGENT.md", content: "updated" },
    ]);
    data.set("AGENT.md", "human edit");
    await expect(applyChanges(store, changes)).rejects.toThrow(
      "changed since preview",
    );
    expect(data.has("CONTEXT.md")).toBe(false);
    expect(data.get("AGENT.md")).toBe("human edit");
  });
  it("rolls back a completed write if the next provider write fails", async () => {
    const { store, data } = memory({ "AGENT.md": "old" });
    const changes = await preview(store, [
      { path: "AGENT.md", content: "new" },
      { path: "CONTEXT.md", content: "new" },
    ]);
    const original = store.write;
    store.write = async (p, c) => {
      if (p === "CONTEXT.md") throw new Error("Disk full");
      await original(p, c);
    };
    await expect(applyChanges(store, changes)).rejects.toThrow("rolled back");
    expect(data.get("AGENT.md")).toBe("old");
  });
  it("preserves concurrent edits during rollback and reports recovery need", async () => {
    const { store, data } = memory({ "AGENT.md": "old" });
    const changes = await preview(store, [
      { path: "AGENT.md", content: "new" },
      { path: "CONTEXT.md", content: "new" },
    ]);
    const original = store.write;
    store.write = async (p, c) => {
      if (p === "CONTEXT.md") {
        data.set("AGENT.md", "concurrent human edit");
        throw new Error("Failure");
      }
      await original(p, c);
    };
    await expect(applyChanges(store, changes)).rejects.toThrow(
      "Restore manually",
    );
    expect(data.get("AGENT.md")).toBe("concurrent human edit");
  });
  it("does not overwrite artifact files or existing placeholders", async () => {
    const { store, data } = memory({
      "stages/01-research/output/result.md": "human revision",
      "stages/01-research/output/.gitkeep": "retain",
    });
    await applyChanges(store, await preview(store, generate(pipeline())));
    expect(data.get("stages/01-research/output/result.md")).toBe(
      "human revision",
    );
    expect(data.get("stages/01-research/output/.gitkeep")).toBe("retain");
  });
  it("rejects case-insensitive collisions before any write", async () => {
    await expect(
      preview(memory().store, [
        { path: "AGENT.md", content: "" },
        { path: "agent.md", content: "" },
      ]),
    ).rejects.toThrow("colliding");
  });
});
