# Implementation status: 0.1.0

Date: 19 October 2026. This is the first working implementation slice, not completion of every roadmap milestone.

## User decisions applied

- `AGENT.md` is the canonical, agent-neutral entry in this repository and generated workflows.
- `CLAUDE.md` contains only `Read [AGENT.md](AGENT.md).` No duplicated instructions.
- All UI, intake questions, diagnostics and generated instructions are English. Third-party agents may need an explicit instruction to open `AGENT.md`.

## Implemented architecture

| Module | Implemented responsibility |
|---|---|
| `src/extension.ts` | VS Code commands, folder selection/scanning, trusted-workspace gating, validated message protocol, local drafts, export review, diffs and recovery snapshots |
| `src/core/model.ts` | Versioned Zod model, intake questions, heuristic recommendation, safe paths and structural validation |
| `src/core/markdown.ts` | Deterministic readable Markdown export and strict reimport of the v1 profile |
| `src/core/storage.ts` | Change planning, stale-preview detection and guarded rollback |
| `src/webview/` | English React forms, React Flow canvas, stage list, undo/redo, validation and file previews |

No backend, model calls, API keys or command execution are involved. The extension writes a workflow description that another agent can read.

## Validation evidence

- TypeScript typecheck passes.
- 34 tests pass: 27 core tests and 7 extension-host orchestration tests using a mocked VS Code API. These cover the AGENT/CLAUDE split, routing and pipeline round-trips, preservation of unsupported Markdown, graph errors, safe paths, absent future artifacts, conflict detection, rollback, recovery, unsaved editor buffers and workspace-trust gating.
- Chromium smoke test passes against the actual compiled Webview and shared core. It exercises a routing export, a two-stage graph, invalid reorder, undo, canvas dragging, draft saving, export/reload, narrow viewport and read-only handling of unsupported edits. Its host-message bridge is simulated.
- The VSIX can be built with `npm run package`; inspect/install it using VS Code's “Install from VSIX…” command.
- Native desktop Extension Host execution, third-party agent walk tests, Windows/macOS and Remote-SSH behavior have **not** been run in this cloud environment.

The browser screenshot is a local test artifact, not a hosted preview. No Marketplace release is published.

## Deliberate first-version limitations

1. **Strict import:** only this editor's exact v1 Markdown profile plus `.icm/editor.json` is editable. Unknown formatting, extra sections or unsupported links make the workflow read-only. Existing user content is never silently discarded.
2. **No migration engine:** stage reordering/renaming exports new paths and retains old folders and output files. Users must inspect/move retained outputs manually. The graph's active routes only describe the current configuration.
3. **Reference scope:** paths are checked against the bounded filename inventory. Section/scope text is documented, but headings and nuanced semantic scope are not verified.
4. **Guidance scope:** the five Field Guide questions and contract fields are present. Domain-specific dynamic questionnaire generation, variable hydration, optional-stage configuration, skill installation and model-assisted suggestions remain planned.
5. **Draft storage:** explicitly saved in VS Code workspace state. Drafts are not a portable canonical workflow and are not automatically committed. Reload requires confirmation before discarding a draft.
6. **Writes:** guarded multi-file writes are not transactions. Recovery snapshots are stored before writes; a failure attempts to restore completed changes. Concurrent modifications are preserved rather than rolled back over. Race-free behavior under hostile concurrent filesystem mutation is not claimed.
7. **Runtime:** no tools or agents execute, and file existence is not treated as proof of successful workflow completion.

## Next implementation work

Prioritize a real VS Code Extension Host smoke run, support for lossless import/editing of standard ICM templates, migration previews that preserve/rebind existing artifacts, and section-aware reference validation. Then add dynamic setup questionnaires and structured checkpoint/audit editing before expanding into additional canonical ICM forms.

The original roadmap remains the target; this status page is the source for what is actually shipped and verified now.
