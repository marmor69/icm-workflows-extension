# ICM Workflow Builder for VS Code

An early, working implementation of a graphical editor for folder-based AI workflows using the Interpretable Context Methodology (ICM). The interface, questions, diagnostics and generated instructions are in English.

**Agent entry:** `AGENT.md` is canonical. `CLAUDE.md` contains only `Read [AGENT.md](AGENT.md).` Agents that do not automatically recognize either filename must be explicitly directed to `AGENT.md`; this extension does not configure third-party agents.

## Try it

Requires VS Code 1.96 or newer and a trusted workspace.

1. Install the generated VSIX using **Extensions: Install from VSIX…**. For development, follow the instructions below and press **F5**.
2. Right-click a folder and choose **ICM: Open Workflow Builder**, or run that command from the Command Palette.
3. Answer the five Field Guide intake questions and choose **Folder routing** or **Sequential workflow**.
4. Add task routes or stages. In a pipeline, connect stage outputs to later stages using canvas handles or the artifact-input checkboxes.
5. Resolve structural errors, select **Preview export**, inspect the before/after contents or open a VS Code diff, then choose **Apply reviewed changes**.

No model provider, API key, backend or tool execution is required. Package installation is not part of using the extension.

## Implemented in 0.1.0

- Folder selection from Explorer, the active file's folder, workspace roots or a folder picker.
- Bounded filename discovery with tool-manifest suggestions; excludes common secret files, dependencies, build folders and symbolic links.
- All five Field Guide intake questions, an editable mechanism decision, rationale, human review and authority boundaries.
- Existing-file routing with task, path, section/scope and tool guidance.
- React Flow canvas with draggable nodes, artifact edges, zoom, arrangement and a keyboard-accessible stage list.
- Stage contracts: purpose, ordered actions, output file/format, earlier-stage inputs, reference files, tool guides, checkpoints and audits.
- Undo/redo, explicit local draft saving, and reloading exported workflows.
- Validation for required fields, safe paths, missing scanned files, invalid dependencies and unresolved placeholder values.
- Reviewed Markdown export, explicit confirmation before replacing existing files, change detection and recovery snapshots on export.
- Strict reimport of this version's own Markdown profile. Unsupported edits switch to read-only mode rather than being discarded.

Exports include `AGENT.md`, a pointer-only `CLAUDE.md`, `CONTEXT.md`, `setup/decision.md`, stage contracts and empty directory placeholders. `.icm/editor.json` holds version, IDs, stage paths and canvas positions, not duplicated prompts. Stage outputs are left to the agent and human to produce.

## Current boundaries

This is the first implementation slice, not the entire roadmap:

- Import requires `.icm/editor.json` and the exact supported Markdown profile. Arbitrary existing ICM files, unknown sections and formatting edits are not merged. They remain untouched and can be edited in VS Code.
- Section/scope strings are recorded; semantic section existence is not yet checked. Tool availability and agent execution are not verified.
- Renaming, reordering or removing stages does not migrate or delete old stage folders. The preview shows new files; existing artifacts remain in the old folders and must be reviewed/moved manually. Active routing references only the current stages.
- Drafts must be saved explicitly. Reload discards the local draft after confirmation. They are kept in VS Code workspace storage, not committed to the project.
- Multi-file writes are not a filesystem transaction. The extension checks for intervening changes, stores a recovery snapshot in extension storage, and rolls back completed writes when possible. Concurrent external edits are preserved and reported for manual recovery. Providers must support ordinary file reads/writes; hostile concurrent symlink replacement is outside this local-editor model.
- Generated workflows do not execute agents or tools. No branching engine, automatic Skill installation, advanced setup-questionnaire generation or model-assisted suggestions are included yet.
- Browser tests use a simulated VS Code message bridge. A desktop Extension Host run and Windows/macOS/Remote-SSH compatibility have not yet been verified in this cloud environment.

## Development

Use Node.js 20.19+ (Node 24 was used here) and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run test:ui
npm run package
```

`npm run test:ui` uses an installed Chromium via `/usr/bin/chromium`, or the executable specified by `CHROMIUM_PATH`. It runs the real compiled Webview and shared core with a simulated host bridge. The smoke test covers routing, a two-stage dependency, invalid reorder, undo, draft saving, export/reimport, narrow layout and read-only handling of unsupported edits.

If your cloud account cannot write its default npm cache, use `npm ci --cache /tmp/icm-npm-cache`. Press **F5** in VS Code to launch the extension development host; `npm run watch` rebuilds assets while developing. Reopen the builder after rebuilding Webview assets.

Packaging produces `dist/icm-workflow-builder-0.1.0.vsix`. It is a local development package, not a Marketplace publication. Project licensing has not been selected (`UNLICENSED`); dependency license notices are shipped separately.

## Design and sources

- [Implementation roadmap](docs/implementation-plan.md)
- [English question catalog and validation design](docs/questions-and-validation.md)
- [Pinned source research and decisions](docs/sources-and-decisions.md)
- [Implementation status and validation](docs/implementation-status.md)

The architecture draws on [ICM by Jake Van Clief](https://github.com/rindig/interpretable-context-methodology). The five intake questions and decision orientation draw on [Jonathan Malkin's ICM Field Guide](https://github.com/jonathanmalkin/icm-field-guide). The guide is advisory; this extension implements a deliberately limited routing/pipeline profile and does not claim compatibility with every ICM Architect form.
