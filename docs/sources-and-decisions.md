# Quellen, Architekturentscheidungen und offene Punkte

## Quellenstand

Recherche am 19. Oktober 2026.

| Quelle | Ergebnis | Nutzung |
|---|---|---|
| [rindig/interpretable-context-methodology](https://github.com/rindig/interpretable-context-methodology) | Gelesen; Commit `02ba5d85c7871b75c7c702a2d8da6524723d53d4` | Grundlage des gewählten Architekturprofils und der D-/S-Fragen |
| [jonathanmalkin/icm-field-guide](https://github.com/jonathanmalkin/icm-field-guide) | Gelesen; Commit `b2dd8131249eea6277376600fdbb1e2149247bd6` | Fünf Einstiegsfragen, Mechanismusentscheidung, Grenzen, Übergabe und spätere Laufzeitprüfung |

Die zuvor angegebene Schreibweise `jonathanmalkik` wurde durch die Nutzerkorrektur `jonathanmalkin` ersetzt; der Quellenzugriff ist damit geklärt. Der Field Guide ist Jonathan Malkins inoffizielle Community-Ergänzung. Seine README/NOTICE nennen Jake Van Clief und David McDermott als Autoren des Methodik-Papers. Architekturgrundlage dieses Projekts bleibt das ausdrücklich gewünschte offizielle Repository am oben genannten Commit.

## Konkret geprüfte ICM-Dateien

Alle folgenden Links sind auf den gelesenen Commit fixiert:

- [README](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/README.md): Urheber Jake Van Clief, fünf Ebenen, Grenzen sequenzieller Workflows.
- [Konventionen](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/_core/CONVENTIONS.md): Stage Contracts, Übergaben, kanonische Quellen, Toolbedarf, Setup, Checkpoints und Audits.
- [Platzhalter](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/_core/placeholder-syntax.md): Variablen und bedingte Abschnitte.
- [Stage-Template](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/_core/templates/stage-context-template.md): Eingaben, Prozess, Checkpoints, Audit und Ausgaben.
- [Workspace-Routing](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/_core/templates/workspace-context-template.md) und [Agent-Einstieg](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/_core/templates/workspace-claude-template.md).
- [Fragebogen-Template](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/_core/templates/questionnaire-template.md) und [Workspace-Builder-Fragen](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/workspaces/workspace-builder/setup/questionnaire.md).
- [Discovery](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/workspaces/workspace-builder/stages/01-discovery/CONTEXT.md), [Mapping](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/workspaces/workspace-builder/stages/02-mapping/CONTEXT.md), [Scaffolding](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/workspaces/workspace-builder/stages/03-scaffolding/CONTEXT.md), [Questionnaire Design](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/workspaces/workspace-builder/stages/04-questionnaire-design/CONTEXT.md), [Validation](https://github.com/rindig/interpretable-context-methodology/blob/02ba5d85c7871b75c7c702a2d8da6524723d53d4/workspaces/workspace-builder/stages/05-validation/CONTEXT.md).

Teile des offiziellen Repositories verwenden noch die Bezeichnung MWP. Der Plan verwendet den Produktnamen ICM und übernimmt die tatsächlich dokumentierten Strukturen. Der README nennt MIT als Lizenz; vor späterem Kopieren von Templates oder Skills sind die jeweiligen Lizenztexte einschließlich eingebundener Drittmaterialien zu prüfen und Hinweise zu erhalten. Dieser Plan paraphrasiert die Methodik und kopiert keine Skill-Pakete.

## Konkret geprüfte Field-Guide-Dateien und Architekturgrenze

Der [gelesene Quellenstand](https://github.com/jonathanmalkin/icm-field-guide/tree/b2dd8131249eea6277376600fdbb1e2149247bd6) umfasst README, SKILL und NOTICE sowie diese gezielt ausgewählten Hilfen:

- [Eignung und fünf Intake-Fragen](https://github.com/jonathanmalkin/icm-field-guide/blob/b2dd8131249eea6277376600fdbb1e2149247bd6/references/decision-aids/should-this-be-icm.md).
- [Handoff-Brief](https://github.com/jonathanmalkin/icm-field-guide/blob/b2dd8131249eea6277376600fdbb1e2149247bd6/references/decision-aids/field-guide-to-architect-handoff.md).
- [Beispielentscheidungen](https://github.com/jonathanmalkin/icm-field-guide/blob/b2dd8131249eea6277376600fdbb1e2149247bd6/references/decision-aids/worked-decisions.md).
- [Cold-Test-Karte](https://github.com/jonathanmalkin/icm-field-guide/blob/b2dd8131249eea6277376600fdbb1e2149247bd6/references/decision-aids/current-runtime-cold-test-card.md).
- [Repository-Änderungsanalyse](https://github.com/jonathanmalkin/icm-field-guide/blob/b2dd8131249eea6277376600fdbb1e2149247bd6/references/entities/application-patterns/repository-workspace-change-impact.md).
- Die Overlays `authority-system-boundary.md`, `untrusted-content-boundary.md`, `orchestration-threshold.md`, `deployment-lifecycle.md` und `portability-layers.md` unter [`references/entities/overlays/`](https://github.com/jonathanmalkin/icm-field-guide/tree/b2dd8131249eea6277376600fdbb1e2149247bd6/references/entities/overlays).
- [Upstream-Abgrenzung](https://github.com/jonathanmalkin/icm-field-guide/blob/b2dd8131249eea6277376600fdbb1e2149247bd6/references/upstream-boundary.md) und [NOTICE](https://github.com/jonathanmalkin/icm-field-guide/blob/b2dd8131249eea6277376600fdbb1e2149247bd6/NOTICE.md).

Der aktuelle Field Guide delegiert kanonische Formen, Templates und Workspace-Bau an **ICM Architect**, dessen Quellenstand er in seiner SKILL.md pinnt. Das ist eine relevante Weiterentwicklung gegenüber dem hier ausgewählten sequenziellen Protokoll-Repository. Dieser Plan behauptet deshalb keine vollständige Kompatibilität mit allen Architect-Formen: Der MVP bleibt beim ausdrücklich geplanten Routing-/Pipeline-Profil. Ein „System Map“ oder andere Architect-Formen benötigen vor Aufnahme eine eigene Prüfung der dortigen kanonischen Verträge. Architect wurde im Rahmen dieses Abgleichs weder installiert noch ausgeführt; die Field-Guide-Dateien wurden als Recherchequelle gelesen.

Die fünf Intake-Fragen sind Entscheidungshilfen, keine generischen Stage-Verträge. D-/S-Fragen bleiben ausdrücklich Ableitungen aus dem offiziellen Workspace-Builder. Der Field Guide wählt keine kanonische Form vor der Bedarfsklärung; entsprechend ist die Stufenfolge eine bewusst begrenzte Produktfähigkeit und keine Behauptung, jede ICM-Anwendung sei eine Pipeline.

Der Plan paraphrasiert öffentliche Empfehlungen und verlinkt deren Quellen. Falls später Field-Guide-Material mit der Extension ausgeliefert wird, sind dessen MIT-Lizenz und NOTICE sowie getrennte Upstream-/Drittrechte zu beachten. Private Lehrmaterialien und Community-Beispiele werden nicht als Templates übernommen.

## Entscheidungsprotokoll

| Entscheidung | Begründung | Folge |
|---|---|---|
| Markdown bleibt maßgeblich | ICM verlangt ein offenes, editierbares Dateisystem | Kein proprietäres Workflow-JSON als Voraussetzung für Agenten |
| Metadaten nur für Editorfunktionen | Canvas benötigt IDs und Layout, Agenten benötigen Verträge | `.icm/editor.json` ist entbehrlich für die Ausführung |
| Sequenzielle Stages mit azyklischen Artefaktabhängigkeiten | Offizielles ICM grenzt komplexe automatische Verzweigungen aus | Keine n8n-Laufzeitsemantik trotz ähnlicher Darstellung |
| Geführter Editor plus Gesamtformular | Nutzer wünscht Führung; ICM verlangt Setup in einem Durchgang | Schrittführung darf Fragen nicht zwingend einzeln freischalten |
| Regelbasierte Vorschläge zuerst | Grundfunktion soll ohne externe Modelle nutzbar sein | KI-Unterstützung ist optional und später integrierbar |
| Offizielle Stage-Verträge als Importprofil | Freies Markdown ist nicht verlustfrei beliebig strukturierbar | Nicht unterstützte Dateien erhalten Diagnosen und Lesemodus |
| Ordner-Routing als eigener einfacher Modus | Nicht jeder vorhandene Ordner braucht künstliche Produktionsstufen | Routing-only ist ein Produktzusatz, kein vollständiger offizieller Workspace |
| Artefakt vorhanden ist nicht gleich erfolgreich | Offizielles `status` bezeichnet nichtleere Outputs als COMPLETE | UI macht Existenz und menschliche Prüfung getrennt sichtbar |
| Keine automatische Ausführung im MVP | Angefordert ist ein Builder, keine Laufzeitplattform | Toolangaben und Agenten-Routings werden erzeugt, nicht ausgeführt |

## Offene Punkte und empfohlene Ausgangswerte

1. **Quellenabgleich abgeschlossen:** Field Guide gelesen, fünf Intake-Fragen und Entscheidungshilfen zugeordnet. Offen bleibt in M0 die praktische UX- und Parser-Validierung; der aktuelle Stand ist in [Implementation status](implementation-status.md) dokumentiert.
2. **Agent target (updated by user):** `AGENT.md` is canonical; `CLAUDE.md` contains only `Read [AGENT.md](AGENT.md).`. Other agents can read the canonical file when directed to it; automatic filename discovery is runtime-specific.
3. **Language (updated by user):** English UI, questions, diagnostics and generated instructions. The question catalog has been translated accordingly.
4. **Umgang mit bestehenden Workspaces:** MVP unterstützt offizielle Templates und eigene Exporte; freie Altbestände zuerst nur analysieren und mit expliziter Vorschau migrieren.
5. **Optionale KI:** Anbieter und Modellwahl erst bei Beauftragung dieser Funktion entscheiden; kein API-Key für den MVP nötig.
6. **Technische Mindestversionen und Aufwand:** In M0 anhand stabiler VS-Code-APIs, React-Flow-Kompatibilität und Parser-Prototyp bestätigen. Die Aufwandsspanne im Plan ist eine Schätzung, keine Lieferzusage.

Implementation has now been authorized and started. This document records source research and decisions; [Implementation status](implementation-status.md) records the shipped subset and validation evidence.
