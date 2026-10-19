import { z } from "zod";

const text = z.string().max(12000);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
export const intakeQuestions = [
  "What repeats? Name one concrete unit of work.",
  "What must stay editable for a person to review?",
  "What changes hands between steps or people?",
  "Which system owns the facts or actions?",
  "What would make folders insufficient (concurrency, branching, sensitive data or transactions)?",
];
export const mechanisms = [
  "Undecided",
  "Files or checklist",
  "Saved prompt or skill",
  "ICM",
  "Deterministic software",
  "Hybrid",
] as const;
export const stageSchema = z.object({
  id,
  name: text,
  purpose: text,
  process: text,
  output: text,
  format: text,
  inputs: z.array(z.object({ stageId: id })).max(100),
  references: z
    .array(z.object({ path: text, scope: text, why: text }))
    .max(100),
  tools: z.array(z.object({ name: text, purpose: text, guide: text })).max(50),
  checkpoint: text,
  audit: text,
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
});
export const workflowSchema = z.object({
  version: z.literal(1),
  mode: z.enum(["routing", "pipeline"]),
  name: text,
  purpose: text,
  intake: z.array(text).length(5),
  mechanism: z.enum(mechanisms),
  rationale: text,
  humanCheck: text,
  boundary: text,
  revisit: text,
  routes: z
    .array(z.object({ task: text, path: text, scope: text, tool: text }))
    .max(200),
  stages: z.array(stageSchema).max(100),
});
export type Workflow = z.infer<typeof workflowSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type Diagnostic = {
  severity: "error" | "warning";
  message: string;
  stageId?: string;
};
export type Inventory = {
  files: string[];
  suggestions: string[];
  truncated: boolean;
};
export type GeneratedFile = { path: string; content: string };
export function createWorkflow(name: string): Workflow {
  return {
    version: 1,
    mode: "routing",
    name,
    purpose: "",
    intake: ["", "", "", "", ""],
    mechanism: "Undecided",
    rationale: "",
    humanCheck: "",
    boundary: "",
    revisit: "",
    routes: [],
    stages: [],
  };
}
export function newStage(id: string, index: number): Stage {
  return {
    id,
    name: `Stage ${index + 1}`,
    purpose: "",
    process: "",
    output: "result.md",
    format: "Markdown",
    inputs: [],
    references: [],
    tools: [],
    checkpoint: "",
    audit: "",
    position: { x: index * 280, y: 100 },
  };
}
export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "stage";
export function stageFolder(stage: Stage, index: number): string {
  return `stages/${String(index + 1).padStart(2, "0")}-${slug(stage.name)}`;
}
export function safePath(path: string): boolean {
  return (
    !!path &&
    path.length <= 240 &&
    !/[\\\x00-\x1f<>:"|?*#%]/.test(path) &&
    !path.startsWith("/") &&
    path
      .split("/")
      .every(
        (p) =>
          p !== "" &&
          p !== "." &&
          p !== ".." &&
          !/[. ]$/.test(p) &&
          !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p),
      ) &&
    !path.split("/").some((p) => p.toLowerCase() === ".git")
  );
}
export function validate(
  workflow: Workflow,
  inventory?: Inventory,
): Diagnostic[] {
  const result: Diagnostic[] = [];
  const add = (
    message: string,
    stageId?: string,
    severity: "error" | "warning" = "error",
  ) => result.push({ message, stageId, severity });
  if (!workflow.name.trim() || !workflow.purpose.trim())
    add("Add a workflow name and purpose.");
  if (workflow.intake.some((a) => !a.trim()))
    add(
      "Answer all five intake questions (use “None” where appropriate).",
      undefined,
      "warning",
    );
  if (workflow.mechanism === "Undecided")
    add("Record the smallest sufficient mechanism.", undefined, "warning");
  if (
    workflow.mode === "pipeline" &&
    !["ICM", "Hybrid"].includes(workflow.mechanism)
  )
    add(
      "Review whether a pipeline is the smallest sufficient mechanism.",
      undefined,
      "warning",
    );
  if (/{{[A-Z_][A-Z0-9_]*}}/.test(JSON.stringify(workflow)))
    add("Resolve the remaining template placeholders before export.");
  const known = new Set(inventory?.files);
  const checkReference = (path: string, stageId?: string) => {
    if (!safePath(path))
      add(`Use a safe workspace-relative path: ${path || "(empty)"}`, stageId);
    else if (inventory && !known.has(path))
      add(
        `Reference not found in scanned files: ${path}${inventory.truncated ? " (scan was incomplete)" : ""}`,
        stageId,
        inventory.truncated ? "warning" : "error",
      );
  };
  if (workflow.mode === "routing") {
    if (!workflow.routes.length) add("Add at least one task route.");
    for (const route of workflow.routes) {
      if (!route.task.trim() || !route.scope.trim())
        add("Every route needs a task and section/scope.");
      checkReference(route.path);
    }
  } else {
    if (!workflow.stages.length) add("Add at least one stage.");
    const ids = new Set(workflow.stages.map((s) => s.id));
    if (ids.size !== workflow.stages.length) add("Stage IDs must be unique.");
    workflow.stages.forEach((s, index) => {
      if (
        !s.name.trim() ||
        !s.purpose.trim() ||
        !s.process.trim() ||
        !s.format.trim()
      )
        add("Add a name, purpose, process and output format.", s.id);
      if (
        !safePath(s.output) ||
        s.output.includes("/") ||
        s.output.startsWith(".")
      )
        add(
          "Output must be one portable file name, such as research.md.",
          s.id,
        );
      if (new Set(s.inputs.map((i) => i.stageId)).size !== s.inputs.length)
        add("Remove duplicate artifact inputs.", s.id);
      for (const input of s.inputs) {
        const producer = workflow.stages.findIndex(
          (p) => p.id === input.stageId,
        );
        if (producer < 0 || producer >= index)
          add(
            "An artifact input must come from an earlier stage (no cycles or forward dependencies).",
            s.id,
          );
      }
      for (const ref of s.references) {
        checkReference(ref.path, s.id);
        if (!ref.scope.trim() || !ref.why.trim())
          add("Reference inputs need a section/scope and purpose.", s.id);
      }
      for (const tool of s.tools) {
        if (!tool.name.trim() || !tool.purpose.trim())
          add("Tools need a name and purpose.", s.id);
        checkReference(tool.guide, s.id);
      }
      if (!s.checkpoint.trim())
        add("Consider a human checkpoint for creative work.", s.id, "warning");
      if (!s.audit.trim())
        add(
          "Consider a specific pass/fail audit before saving output.",
          s.id,
          "warning",
        );
    });
  }
  return result;
}
export function recommendation(w: Workflow): string {
  if (w.intake.every((a) => !a.trim()))
    return "Start with a real job. A checklist or existing router may be enough.";
  if (/concurren|transaction|automat.*branch|payment/i.test(w.intake[4]))
    return "Consider software or a hybrid for system actions. Markdown does not provide locks, permissions or transactions.";
  if (w.intake[1].trim() && w.intake[2].trim())
    return "Editable artifacts and handoffs may benefit from ICM. Confirm that they actually repeat before adding stages.";
  return "Consider ordinary files, a checklist or a saved prompt first. Record your choice below.";
}
