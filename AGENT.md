# Agent instructions

This repository implements the ICM Workflow Builder VS Code extension.

- Read `README.md` for development commands and the current supported scope.
- Read `docs/implementation-plan.md` for the target architecture and `docs/questions-and-validation.md` for the English question catalog.
- Use English for UI strings, generated workflow instructions, questions, and developer documentation added during implementation.
- `AGENT.md` is the canonical agent entry. `CLAUDE.md` must contain only a pointer to `AGENT.md`. Do not duplicate agent instructions there.
- Keep exported Markdown readable without the extension. Tool requirements do not grant execution authority or establish availability.
- Preserve existing workspace files and intermediate artifacts. Require reviewed previews and detect changes before replacing files.
- Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:ui` for relevant implementation changes. Package with `npm run package` when changing the shipped extension.
- The cloud workspace is already isolated. Use this checkout; do not create worktrees unless explicitly requested.
