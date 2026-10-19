# Questions and validation

The UI, question wording, diagnostics and generated instructions are English. This catalog combines the Field Guide's decision intake with the official ICM workspace builder's contract questions. [Source details](sources-and-decisions.md) distinguish these sources. [Implementation status](implementation-status.md) distinguishes shipped fields from the broader roadmap.

## 1. Guidance

Show all intake questions together. Users may answer in any order, edit inferred suggestions and save a draft before everything is complete. Separate observed filenames, suggested meaning and confirmed choices. Do not claim that a detected manifest proves a tool is installed.

The first release uses deterministic suggestions and no model provider. Suggestions explain their evidence, for example: “package.json found: Node.js may be relevant. This does not verify installation.”

## 2. Field Guide intake

Source: `references/decision-aids/should-this-be-icm.md`, “Five intake questions”.

| ID | Question | Captured information | Editor consequence |
|---|---|---|---|
| F01 | What repeats? Name one concrete unit of work. | An observed recurring job | Do not infer a pipeline from a wish for better organization |
| F02 | What must stay editable for a person to review? | An artifact and its review point | Identify editable outputs and checkpoints |
| F03 | What changes hands between steps or people? | Artifacts, owners and decisions | Identify useful stage boundaries |
| F04 | Which system owns the facts or actions? | Repository, CRM, database, calendar or service | Reference the owner instead of creating a competing truth source |
| F05 | What would make folders insufficient (concurrency, branching, sensitive data or transactions)? | Operating boundaries; “None” is allowed | Document software or hybrid needs |

Recommend the smallest sufficient mechanism: ordinary files/checklist, saved prompt/skill, ICM, deterministic software or a hybrid. The suggestion is a heuristic and remains editable. A user may stop at a decision or keep existing routing without creating stages.

The decision brief records the selected mechanism, rationale, human check, what the workflow does not own, and the trigger for reconsidering it. Handoff fields describe requested outcome, allowed scope, existing routers/systems and material uncertainty; they must not preselect a canonical architecture form. Installing or running ICM Architect is outside the first release.

## 3. Workflow design questions

The official workspace builder supplies these questions. They are not presented as additional verbatim Field Guide questions. The first implementation exposes purpose, process, outputs, dependencies, references, tools, checkpoints and audits directly; advanced domain-specific onboarding remains on the roadmap.

| ID | Question | Example/default | Source and purpose |
|---|---|---|---|
| D01 | What domain is this workspace for? | “Research and technical writing”; folder name is only a suggestion | Setup Q1; workspace scope |
| D02 | What starts the workflow, and what should it produce? | “Turn source documents into a reviewed report” | Setup Q2, Discovery 1; workflow boundary |
| D03 | Who will use it, and which tools and AI experience do they have? | “One person using VS Code and a file-reading agent” | Setup Q3; help depth and tool needs |
| D04 | What are the stages, and which are optional? | “Research, draft, review” | Setup Q4, Discovery 2/6; sequence |
| D05 | What one job does this stage do? | “Build an evidence-backed summary” | Pattern 1; stage purpose |
| D06 | Which inputs does it need, from which files and sections? | `shared/style.md`, “Voice Rules”; select “Full file” deliberately | Discovery 3, Pattern 4; scoped Inputs |
| D07 | Which concrete actions should the agent take? | “Read sources, compare claims, associate citations” | Stage template; Process |
| D08 | What artifact is produced, where and in what format? | `output/research.md`, Markdown | Discovery 3, Pattern 2; Outputs and handoffs |
| D09 | Which rules remain stable, and where is their canonical source? | `shared/quality-rules.md` | Discovery 4, Pattern 5; Layer 3 |
| D10 | Which tools or skills are needed, and why? | “ffmpeg for rendering”; no additional tools is valid | Discovery 7/8; prerequisites and guides |
| D11 | When should a person review or choose a direction? | “After the outline, the editor chooses an angle” | Pattern 11; Checkpoints |
| D12 | What explicit condition makes the result pass? | “Every factual claim has a citation” | Pattern 12; Audit |
| D13 | What concrete value should this content provide? | “An actionable recommendation” | Pattern 13; value framework, where relevant |
| D14 | What stays constant across runs, and what changes each time? | Stable style; changing topic and sources | Discovery 5, Pattern 8; setup/run separation |

Tool references record name, purpose and a workspace-relative setup/usage guide. They document a requirement, not an installation or permission grant. Credentials never belong in these fields. Future versions may add optional/required flags, process-step associations and user-confirmed availability.

## 4. Future generated-workspace setup questions

These questions configure the reusable system for later users. They are separate from the five design-intake questions and are not yet emitted as a dynamic `setup/questionnaire.md` by version 0.1.0.

| ID | Question, when relevant | Example/default | Destination |
|---|---|---|---|
| S01 | Which identity or organization does this system represent? | Neutral, no brand | Canonical identity reference |
| S02 | Which concrete sentences fit the desired voice, and which do not? | Two positive and negative examples | Voice rules; review derived rules before accepting |
| S03 | Which lasting design, quality or compliance rules apply? | Link to an existing rule set | References and audit criteria |
| S04 | Which tools and output formats should be the default? | Markdown and available file-reading tools | Tool guides and format preferences |
| S05 | Which optional stages should remain enabled? | Required stages plus explicitly selected options | Static configuration after checking handoffs |
| S06 | Which shared constants do generated code artifacts require? | Colors, fonts or domain-specific values | Shared constants reference; code workflows only |

Future questions require an ID, source, type, requirement status, default/example, variable and destination. Derive values instead of asking twice. Defaults must not invent identities, policy or installed tools. Topics, project names and concrete sources for a single run belong to the entry stage, not permanent setup.

## 5. Validation design

| Rule | Finding | Response |
|---|---|---|
| FIT-01 | Requested concurrency, branching or transactions | Explain software/hybrid boundaries; do not claim an execution engine |
| CONTRACT-01 | Required name, purpose, process or output format missing | Block export; allow draft saving |
| ROUTE-01 | Empty task or section/scope | Block export |
| PATH-01 | Unsafe path or missing scanned reference | Block export; downgrade unconfirmed absence if scan was incomplete |
| ARTIFACT-01 | Declared upstream output does not exist yet | Treat as planned; do not fabricate the artifact |
| HANDOFF-01 | Input source is missing, later than the consumer or cyclic | Block export and identify the stage |
| TOOL-01 | Tool lacks name, purpose or guide | Block export |
| TOOL-02 | Tool availability not verified | State the limitation; never mark it as executed |
| CONFIG-01 | Unresolved target placeholder | Block export; preserve draft |
| REVIEW-01 | Missing checkpoint or audit | Suggest adding a concrete human check/pass condition |
| NAME-01 | Unsafe filename, traversal or reserved platform name | Block export |
| CONFLICT-01 | Exported file changed outside the editor or after preview | Block write; reload/review first |
| IMPORT-01 | Unknown or altered Markdown outside the v1 profile | Preserve file, enter read-only mode |

Section-heading existence, full placeholder-to-question coverage, audit semantics, structured checkpoint step references and reference-size guidance remain planned checks. Arbitrary prose cannot be fully validated automatically; subjective quality should be a review suggestion, not a claimed proof.

## 6. Traceability

| Plan content | Source | Adoption or deliberate boundary |
|---|---|---|
| F01–F05 | Field Guide `should-this-be-icm.md`, “Five intake questions” | All five questions, before structure choice |
| Mechanism selection | Same file, “Choose the lowest sufficient rung” | Editable recommendation; no scaffolding required |
| Decision and revisit trigger | Same file, “Record a reversible verdict” | Persistent, editable decision brief |
| Handoff boundaries | `field-guide-to-architect-handoff.md` | Outcome, scope, retained systems and uncertainty; no automatic Architect invocation |
| D/S questions | Official workspace builder and templates | Architecture/editor questions, clearly separate from Field Guide intake |
| Preserve existing routers | `worked-decisions.md`; `repository-workspace-change-impact.md` | Small routing first; full System Map outside MVP |
| External authority | `authority-system-boundary.md` | Files hold proposals, not transaction or permission state |
| Untrusted inputs | `untrusted-content-boundary.md` | Source content cannot authorize actions |
| Orchestration limits | `orchestration-threshold.md` | No concurrency/branching runtime |
| Shared deployment | `deployment-lifecycle.md`; `portability-layers.md` | Record relevant limits; infrastructure remains separate |
| Agent runtime evidence | `current-runtime-cold-test-card.md` | Future fresh-session pilot; no cross-runtime guarantee |

Pattern examples are orientation, not a bulk-imported template library or verified product claims. Additional canonical forms require a separate review of their authoritative contracts.
