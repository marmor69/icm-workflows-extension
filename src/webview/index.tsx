import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./style.css";
import {
  type Workflow,
  type Stage,
  type Inventory,
  type Diagnostic,
  intakeQuestions,
  mechanisms,
  newStage,
  validate,
  recommendation,
} from "../core/model";
import type { Change } from "../core/storage";

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };
const vscode = acquireVsCodeApi();
type StageNode = Node<
  {
    name: string;
    number: number;
    purpose: string;
    errors: number;
    selected: boolean;
  },
  "stage"
>;
function StageCard({ data }: NodeProps<StageNode>) {
  return (
    <div className={`stage-node ${data.selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <span className="node-number">
        {String(data.number).padStart(2, "0")}
      </span>
      <strong>{data.name || "Untitled stage"}</strong>
      <p>{data.purpose || "Describe this stage’s one job"}</p>
      <span className={data.errors ? "badge error" : "badge"}>
        {data.errors ? `${data.errors} issue(s)` : "Contract ready"}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { stage: StageCard };
function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  list,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  multiline?: boolean;
  placeholder?: string;
  list?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          list={list}
        />
      )}
    </label>
  );
}
function App() {
  const [workflow, setWorkflow] = useState<Workflow>();
  const [root, setRoot] = useState("");
  const [inventory, setInventory] = useState<Inventory>({
    files: [],
    suggestions: [],
    truncated: false,
  });
  const [readOnly, setReadOnly] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [tab, setTab] = useState<"discover" | "design" | "review">("discover");
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<Workflow[]>([]);
  const [future, setFuture] = useState<Workflow[]>([]);
  const [preview, setPreview] = useState<{
    token: string;
    changes: Change[];
  }>();
  const [previewPath, setPreviewPath] = useState("");
  const [previewView, setPreviewView] = useState<"before" | "after">("after");
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const m = event.data;
      if (!m || typeof m.type !== "string") return;
      setBusy(false);
      if (m.type === "init") {
        setWorkflow(m.workflow);
        setInventory(m.inventory);
        setRoot(m.root);
        setReadOnly(m.readOnly);
        setNotice(m.notice);
        setFailure(m.readOnly);
        setHistory([]);
        setFuture([]);
        setDirty(false);
        setPreview(undefined);
        setSelected(m.workflow.stages[0]?.id);
      } else if (m.type === "preview") {
        setPreview(m);
        setPreviewPath(m.changes[0]?.path || "");
        setPreviewView("after");
        setTab("review");
        setFailure(false);
        setNotice(
          m.changes.length
            ? "Review each file below. Export writes only after you apply this preview."
            : "Exported files are already up to date.",
        );
      } else if (["notice", "error", "applied"].includes(m.type)) {
        setNotice(m.message);
        setFailure(m.type === "error");
        if (m.type === "applied") {
          setPreview(undefined);
          setDirty(false);
        }
        if (m.type === "notice" && m.message.startsWith("Draft saved"))
          setDirty(false);
      }
    };
    window.addEventListener("message", receive);
    vscode.postMessage({ type: "ready" });
    return () => window.removeEventListener("message", receive);
  }, []);
  const diagnostics = useMemo(
    () => (workflow ? validate(workflow, inventory) : []),
    [workflow, inventory],
  );
  if (!workflow)
    return <main className="loading">Opening your workspace…</main>;
  const w = workflow;
  function update(next: Workflow) {
    setHistory((h) => [...h.slice(-49), w]);
    setFuture([]);
    setWorkflow(next);
    setPreview(undefined);
    setDirty(true);
  }
  function patch(values: Partial<Workflow>) {
    update({ ...w, ...values });
  }
  function patchStage(values: Partial<Stage>) {
    patch({
      stages: w.stages.map((s) =>
        s.id === selected ? { ...s, ...values } : s,
      ),
    });
  }
  function undo() {
    const previous = history.at(-1);
    if (previous) {
      setFuture([w, ...future]);
      setWorkflow(previous);
      setHistory(history.slice(0, -1));
      setPreview(undefined);
      setDirty(true);
    }
  }
  function redo() {
    const next = future[0];
    if (next) {
      setHistory([...history, w]);
      setWorkflow(next);
      setFuture(future.slice(1));
      setPreview(undefined);
      setDirty(true);
    }
  }
  function request(type: "save" | "preview" | "reload") {
    setBusy(true);
    setFailure(false);
    vscode.postMessage(type === "reload" ? { type } : { type, workflow: w });
  }
  function addStage() {
    const s = newStage(crypto.randomUUID(), w.stages.length);
    patch({ stages: [...w.stages, s] });
    setSelected(s.id);
  }
  const stage = w.stages.find((s) => s.id === selected);
  const errors = diagnostics.filter((d) => d.severity === "error");
  const nodes: StageNode[] = w.stages.map((s, i) => ({
    id: s.id,
    type: "stage",
    position: s.position,
    data: {
      name: s.name,
      purpose: s.purpose,
      number: i + 1,
      selected: s.id === selected,
      errors: diagnostics.filter(
        (d) => d.stageId === s.id && d.severity === "error",
      ).length,
    },
  }));
  const edges = w.stages.flatMap((s) =>
    s.inputs.map((input) => ({
      id: `${input.stageId}:${s.id}`,
      source: input.stageId,
      target: s.id,
      label:
        w.stages.find((p) => p.id === input.stageId)?.output ||
        "Missing artifact",
    })),
  );
  function connect(c: Connection) {
    if (readOnly || busy) return;
    const from = w.stages.findIndex((s) => s.id === c.source);
    const to = w.stages.findIndex((s) => s.id === c.target);
    if (from < 0 || to <= from) {
      setNotice(
        "Connect an earlier stage to a later stage. Cycles and forward inputs are not allowed.",
      );
      setFailure(true);
      return;
    }
    const target = w.stages[to];
    if (target.inputs.some((i) => i.stageId === c.source)) return;
    patch({
      stages: w.stages.map((s) =>
        s.id === target.id
          ? { ...s, inputs: [...s.inputs, { stageId: c.source! }] }
          : s,
      ),
    });
  }
  const focusDiagnostic = (d: Diagnostic) => {
    setTab("design");
    if (d.stageId) setSelected(d.stageId);
  };
  const activeChange = preview?.changes.find((c) => c.path === previewPath);
  return (
    <div className="app">
      <header>
        <div>
          <span className="eyebrow">
            FOLDER STRUCTURE AS AGENT ARCHITECTURE
          </span>
          <h1>ICM Workflow Builder</h1>
          <p className="root-path">{root}</p>
        </div>
        <div className="actions">
          <span className="save-state">
            {dirty ? "Unsaved draft" : "Draft unchanged"}
          </span>
          <button onClick={() => request("reload")} disabled={busy}>
            Reload files
          </button>
          <button onClick={() => request("save")} disabled={readOnly || busy}>
            Save draft
          </button>
          <button
            className="primary"
            onClick={() => request("preview")}
            disabled={readOnly || busy || errors.length > 0}
          >
            Preview export
          </button>
        </div>
      </header>
      {notice && (
        <div
          role={failure ? "alert" : "status"}
          className={`notice ${failure ? "failure" : ""}`}
        >
          {notice}
        </div>
      )}
      <nav aria-label="Builder steps">
        {(["discover", "design", "review"] as const).map((t, i) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {i + 1}. {t[0].toUpperCase() + t.slice(1)}
            {t === "review" && ` · ${errors.length} errors`}
          </button>
        ))}
      </nav>
      <datalist id="workspace-files">
        {inventory.files.slice(0, 1500).map((f) => (
          <option value={f} key={f} />
        ))}
      </datalist>
      <fieldset disabled={readOnly || busy} className="editor-body">
        {tab === "discover" && (
          <div className="discovery">
            <section>
              <h2>Start with a real job</h2>
              <p>
                Choose the smallest useful structure. All questions are visible;
                answer them in any order.
              </p>
              <div className="two-col">
                <Field
                  label="Workflow name"
                  value={w.name}
                  onChange={(name) => patch({ name })}
                />
                <label className="field">
                  <span>Editor mode</span>
                  <select
                    value={w.mode}
                    onChange={(e) =>
                      patch({ mode: e.target.value as Workflow["mode"] })
                    }
                  >
                    <option value="routing">Folder routing</option>
                    <option value="pipeline">Sequential workflow</option>
                  </select>
                </label>
              </div>
              <Field
                label="Purpose and final outcome"
                multiline
                value={w.purpose}
                onChange={(purpose) => patch({ purpose })}
                placeholder="Turn research sources into a reviewed article."
              />
              {intakeQuestions.map((q, i) => (
                <Field
                  key={q}
                  label={`${i + 1}. ${q}`}
                  value={w.intake[i]}
                  onChange={(answer) =>
                    patch({
                      intake: w.intake.map((a, n) => (n === i ? answer : a)),
                    })
                  }
                  placeholder={
                    i === 4
                      ? "None, or describe the boundary."
                      : "Describe the observed need."
                  }
                />
              ))}
              <aside className="recommendation">
                <strong>A starting recommendation</strong>
                <p>{recommendation(w)}</p>
                <small>
                  This is a heuristic, not an automatic architecture decision.
                </small>
              </aside>
              <label className="field">
                <span>Smallest sufficient mechanism</span>
                <select
                  value={w.mechanism}
                  onChange={(e) =>
                    patch({
                      mechanism: e.target.value as Workflow["mechanism"],
                    })
                  }
                >
                  {mechanisms.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <Field
                label="Why is this the smallest sufficient choice?"
                value={w.rationale}
                onChange={(rationale) => patch({ rationale })}
              />
              <Field
                label="Human check: who reviews which artifact?"
                value={w.humanCheck}
                onChange={(humanCheck) => patch({ humanCheck })}
              />
              <Field
                label="What does this workflow not own?"
                value={w.boundary}
                onChange={(boundary) => patch({ boundary })}
                placeholder="The CRM owns customer records; this folder holds drafts."
              />
              <Field
                label="When should this choice be revisited?"
                value={w.revisit}
                onChange={(revisit) => patch({ revisit })}
              />
              <button className="primary" onClick={() => setTab("design")}>
                Continue to design
              </button>
            </section>
            <aside className="inventory">
              <h2>Folder evidence</h2>
              <p>
                {inventory.files.length} file(s) discovered. File names are
                evidence, not instructions.
              </p>
              {inventory.truncated && (
                <p role="alert">
                  Scan incomplete. Some files could not be inspected or the scan
                  limit was reached.
                </p>
              )}
              {inventory.suggestions.map((s) => (
                <p className="suggestion" key={s}>
                  {s}
                </p>
              ))}
              <details>
                <summary>Browse discovered files</summary>
                <ul>
                  {inventory.files.slice(0, 300).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {inventory.files.length > 300 && (
                  <p>Showing the first 300 files.</p>
                )}
              </details>
              <p className="muted">
                Secrets, dependencies, build folders and symbolic links are
                excluded. Nothing is sent to an AI provider.
              </p>
            </aside>
          </div>
        )}
        {tab === "design" && (
          <>
            <div className="toolbar">
              <h2>
                {w.mode === "routing" ? "Task routes" : "Stage contracts"}
              </h2>
              <div className="actions">
                <button onClick={undo} disabled={!history.length}>
                  Undo
                </button>
                <button onClick={redo} disabled={!future.length}>
                  Redo
                </button>
                {w.mode === "pipeline" && (
                  <>
                    <button
                      onClick={() =>
                        patch({
                          stages: w.stages.map((s, i) => ({
                            ...s,
                            position: { x: i * 280, y: 100 },
                          })),
                        })
                      }
                    >
                      Arrange
                    </button>
                    <button className="primary" onClick={addStage}>
                      Add stage
                    </button>
                  </>
                )}
              </div>
            </div>
            {w.mode === "routing" ? (
              <section>
                <p>
                  Route a task to an existing workspace file. Tool guidance
                  describes what to use; it never executes a command.
                </p>
                {w.routes.map((r, i) => (
                  <div className="route-card" key={i}>
                    <h3>Route {i + 1}</h3>
                    <div className="two-col">
                      <Field
                        label="Task"
                        value={r.task}
                        onChange={(task) =>
                          patch({
                            routes: w.routes.map((v, n) =>
                              n === i ? { ...v, task } : v,
                            ),
                          })
                        }
                      />
                      <Field
                        label="Workspace-relative file"
                        list="workspace-files"
                        value={r.path}
                        onChange={(path) =>
                          patch({
                            routes: w.routes.map((v, n) =>
                              n === i ? { ...v, path } : v,
                            ),
                          })
                        }
                      />
                      <Field
                        label="Section / scope"
                        value={r.scope}
                        onChange={(scope) =>
                          patch({
                            routes: w.routes.map((v, n) =>
                              n === i ? { ...v, scope } : v,
                            ),
                          })
                        }
                      />
                      <Field
                        label="Tool guidance (optional)"
                        value={r.tool}
                        onChange={(tool) =>
                          patch({
                            routes: w.routes.map((v, n) =>
                              n === i ? { ...v, tool } : v,
                            ),
                          })
                        }
                      />
                    </div>
                    <button
                      onClick={() =>
                        patch({ routes: w.routes.filter((_, n) => n !== i) })
                      }
                    >
                      Remove route
                    </button>
                  </div>
                ))}
                <button
                  className="primary"
                  onClick={() =>
                    patch({
                      routes: [
                        ...w.routes,
                        { task: "", path: "", scope: "Full file", tool: "" },
                      ],
                    })
                  }
                >
                  Add route
                </button>
              </section>
            ) : (
              <>
                <p className="canvas-hint">
                  Drag nodes to arrange the canvas. Connect an output handle to
                  a later stage to pass its artifact. Use the stage list to
                  change execution order.
                </p>
                <div className="canvas">
                  <ReactFlow<StageNode>
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ maxZoom: 1.2, padding: 0.25 }}
                    onNodeClick={(_, node) => setSelected(node.id)}
                    onNodeDragStart={() => {
                      setHistory((h) => [...h.slice(-49), w]);
                      setFuture([]);
                      setPreview(undefined);
                      setDirty(true);
                    }}
                    onNodesChange={(changes) => {
                      const positions = changes.filter(
                        (c) => c.type === "position" && c.position,
                      );
                      if (positions.length)
                        setWorkflow(
                          (current) =>
                            current && {
                              ...current,
                              stages: current.stages.map((s) => {
                                const change = positions.find(
                                  (c) => c.type === "position" && c.id === s.id,
                                );
                                return change?.type === "position" &&
                                  change.position
                                  ? { ...s, position: change.position }
                                  : s;
                              }),
                            },
                        );
                    }}
                    onConnect={connect}
                    nodesDraggable={!readOnly && !busy}
                    nodesConnectable={!readOnly && !busy}
                    deleteKeyCode={null}
                  >
                    <Background />
                    <Controls showInteractive={false} />
                  </ReactFlow>
                  {!nodes.length && (
                    <div className="canvas-empty">
                      Add your first stage to define one job and one editable
                      artifact.
                    </div>
                  )}
                </div>
                <div className="stage-layout">
                  <aside>
                    <h3>Stages in order</h3>
                    <ol className="stage-list">
                      {w.stages.map((s, i) => (
                        <li key={s.id}>
                          <button
                            className={selected === s.id ? "active" : ""}
                            onClick={() => setSelected(s.id)}
                          >
                            {i + 1}. {s.name}
                          </button>
                          <div className="actions">
                            <button
                              aria-label={`Move ${s.name} up`}
                              disabled={!i}
                              onClick={() => {
                                const stages = [...w.stages];
                                [stages[i - 1], stages[i]] = [
                                  stages[i],
                                  stages[i - 1],
                                ];
                                patch({ stages });
                              }}
                            >
                              ↑
                            </button>
                            <button
                              aria-label={`Move ${s.name} down`}
                              disabled={i === w.stages.length - 1}
                              onClick={() => {
                                const stages = [...w.stages];
                                [stages[i + 1], stages[i]] = [
                                  stages[i],
                                  stages[i + 1],
                                ];
                                patch({ stages });
                              }}
                            >
                              ↓
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="muted">
                      Reordering changes generated folder paths. Existing
                      folders and outputs are kept; review obsolete folders
                      manually.
                    </p>
                  </aside>
                  <section>
                    {stage ? (
                      <>
                        <h2>Edit {stage.name}</h2>
                        <div className="two-col">
                          <Field
                            label="Stage name"
                            value={stage.name}
                            onChange={(name) => patchStage({ name })}
                          />
                          <Field
                            label="One job / purpose"
                            value={stage.purpose}
                            onChange={(purpose) => patchStage({ purpose })}
                          />
                        </div>
                        <Field
                          label="Process (one action per line)"
                          multiline
                          value={stage.process}
                          onChange={(process) => patchStage({ process })}
                        />
                        <div className="two-col">
                          <Field
                            label="Output file name"
                            value={stage.output}
                            onChange={(output) => patchStage({ output })}
                          />
                          <Field
                            label="Output format"
                            value={stage.format}
                            onChange={(format) => patchStage({ format })}
                          />
                        </div>
                        <h3>Artifact inputs</h3>
                        <p>
                          Choose earlier stages. Their current output files will
                          be read, including human edits.
                        </p>
                        {w.stages
                          .filter((s) => s.id !== stage.id)
                          .map((s) => (
                            <label className="checkbox" key={s.id}>
                              <input
                                type="checkbox"
                                checked={stage.inputs.some(
                                  (i) => i.stageId === s.id,
                                )}
                                disabled={
                                  !stage.inputs.some(
                                    (i) => i.stageId === s.id,
                                  ) &&
                                  w.stages.indexOf(s) >= w.stages.indexOf(stage)
                                }
                                onChange={(e) =>
                                  patchStage({
                                    inputs: e.target.checked
                                      ? [...stage.inputs, { stageId: s.id }]
                                      : stage.inputs.filter(
                                          (i) => i.stageId !== s.id,
                                        ),
                                  })
                                }
                              />
                              {s.name} → {s.output}
                            </label>
                          ))}
                        <h3>Reference inputs</h3>
                        {stage.references.map((r, i) => (
                          <div className="entry" key={i}>
                            <Field
                              label="Reference file (relative to workspace)"
                              list="workspace-files"
                              value={r.path}
                              onChange={(path) =>
                                patchStage({
                                  references: stage.references.map((v, n) =>
                                    n === i ? { ...v, path } : v,
                                  ),
                                })
                              }
                            />
                            <div className="two-col">
                              <Field
                                label="Section / scope"
                                value={r.scope}
                                onChange={(scope) =>
                                  patchStage({
                                    references: stage.references.map((v, n) =>
                                      n === i ? { ...v, scope } : v,
                                    ),
                                  })
                                }
                              />
                              <Field
                                label="Why load this reference?"
                                value={r.why}
                                onChange={(why) =>
                                  patchStage({
                                    references: stage.references.map((v, n) =>
                                      n === i ? { ...v, why } : v,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <button
                              onClick={() =>
                                patchStage({
                                  references: stage.references.filter(
                                    (_, n) => n !== i,
                                  ),
                                })
                              }
                            >
                              Remove reference
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            patchStage({
                              references: [
                                ...stage.references,
                                { path: "", scope: "Full file", why: "" },
                              ],
                            })
                          }
                        >
                          Add reference
                        </button>
                        <h3>Tools</h3>
                        <p>
                          Document prerequisites. Tool availability is not
                          verified.
                        </p>
                        {stage.tools.map((t, i) => (
                          <div className="entry" key={i}>
                            <div className="two-col">
                              <Field
                                label="Tool name"
                                value={t.name}
                                onChange={(name) =>
                                  patchStage({
                                    tools: stage.tools.map((v, n) =>
                                      n === i ? { ...v, name } : v,
                                    ),
                                  })
                                }
                              />
                              <Field
                                label="Tool purpose"
                                value={t.purpose}
                                onChange={(purpose) =>
                                  patchStage({
                                    tools: stage.tools.map((v, n) =>
                                      n === i ? { ...v, purpose } : v,
                                    ),
                                  })
                                }
                              />
                            </div>
                            <Field
                              label="Setup / usage guide file"
                              list="workspace-files"
                              value={t.guide}
                              onChange={(guide) =>
                                patchStage({
                                  tools: stage.tools.map((v, n) =>
                                    n === i ? { ...v, guide } : v,
                                  ),
                                })
                              }
                            />
                            <button
                              onClick={() =>
                                patchStage({
                                  tools: stage.tools.filter((_, n) => n !== i),
                                })
                              }
                            >
                              Remove tool
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            patchStage({
                              tools: [
                                ...stage.tools,
                                { name: "", purpose: "", guide: "" },
                              ],
                            })
                          }
                        >
                          Add tool
                        </button>
                        <Field
                          label="Human checkpoint: when to pause, what to show, who decides"
                          multiline
                          value={stage.checkpoint}
                          onChange={(checkpoint) => patchStage({ checkpoint })}
                        />
                        <Field
                          label="Audit: explicit pass condition before saving output"
                          multiline
                          value={stage.audit}
                          onChange={(audit) => patchStage({ audit })}
                        />
                        <button
                          className="danger"
                          disabled={w.stages.some((s) =>
                            s.inputs.some((i) => i.stageId === stage.id),
                          )}
                          onClick={() => {
                            patch({
                              stages: w.stages.filter((s) => s.id !== stage.id),
                            });
                            setSelected(undefined);
                          }}
                        >
                          Remove stage
                        </button>
                        <p className="muted">
                          Disconnect consumers before removing a stage. Existing
                          files are never deleted by removing a node.
                        </p>
                      </>
                    ) : (
                      <p>Select a stage to edit its contract.</p>
                    )}
                  </section>
                </div>
              </>
            )}
          </>
        )}
        {tab === "review" && (
          <section>
            <h2>Review before writing</h2>
            <p>
              Structural checks do not prove tool availability or agent
              execution. AGENT.md is the canonical entry; CLAUDE.md only points
              to it.
            </p>
            <ul className="diagnostics">
              {diagnostics.map((d, i) => (
                <li key={i} className={d.severity}>
                  <button onClick={() => focusDiagnostic(d)}>
                    <strong>
                      {d.severity === "error" ? "Fix" : "Consider"}
                    </strong>{" "}
                    {d.stageId &&
                      `${w.stages.find((s) => s.id === d.stageId)?.name}: `}
                    {d.message}
                  </button>
                </li>
              ))}
            </ul>
            {!errors.length && (
              <p className="success">
                No structural errors. You can preview the generated files.
              </p>
            )}
            <button
              onClick={() => request("preview")}
              disabled={errors.length > 0}
              className="primary"
            >
              Generate preview
            </button>
            {preview && (
              <>
                <div className="preview-header">
                  <h3>{preview.changes.length} file change(s)</h3>
                  <button
                    className="primary"
                    disabled={!preview.changes.length}
                    onClick={() => {
                      setBusy(true);
                      vscode.postMessage({
                        type: "apply",
                        token: preview.token,
                      });
                    }}
                  >
                    Apply reviewed changes
                  </button>
                </div>
                <div className="preview-layout">
                  <aside>
                    {preview.changes.map((c) => (
                      <button
                        className={previewPath === c.path ? "active" : ""}
                        key={c.path}
                        onClick={() => setPreviewPath(c.path)}
                      >
                        {c.before === undefined ? "+ " : "~ "}
                        {c.path}
                      </button>
                    ))}
                  </aside>
                  <div>
                    {activeChange && (
                      <>
                        <div className="actions">
                          <button onClick={() => setPreviewView("before")}>
                            Before
                          </button>
                          <button onClick={() => setPreviewView("after")}>
                            After
                          </button>
                          <button
                            onClick={() =>
                              vscode.postMessage({
                                type: "diff",
                                token: preview.token,
                                path: activeChange.path,
                              })
                            }
                          >
                            Open VS Code diff
                          </button>
                        </div>
                        <p>
                          {activeChange.path} · {previewView}
                        </p>
                        <pre>
                          {previewView === "before"
                            ? (activeChange.before ?? "(New file)")
                            : activeChange.content || "(Empty file)"}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </fieldset>
      <footer>
        <span>
          {errors.length} error(s) · {diagnostics.length - errors.length}{" "}
          suggestion(s)
        </span>
        <span>Local-first · No AI provider · No tool execution</span>
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
