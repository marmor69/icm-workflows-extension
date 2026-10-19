# Quellen, Architekturentscheidungen und offene Punkte

## Quellenstand

Recherche am 19. Oktober 2026.

| Quelle | Ergebnis | Nutzung |
|---|---|---|
| [rindig/interpretable-context-methodology](https://github.com/rindig/interpretable-context-methodology) | Gelesen; Commit `02ba5d85c7871b75c7c702a2d8da6524723d53d4` | Normative Grundlage für Workflowarchitektur und vorläufige Fragen |
| [jonathanmalkik/icm-field-guide](https://github.com/jonathanmalkik/icm-field-guide) | HTTPS-Git-Zugriff meldet „Repository not found“ | Gewünschte Grundlage für Führung und Fragen; noch nicht verifiziert |

„Repository not found“ unterscheidet nicht sicher zwischen falschem Namen, privatem Repository und fehlender Freigabe. Deshalb wird weder ein Inhalt erfunden noch eine endgültige Ursache behauptet. Eine alternative Schreibweise wurde ebenfalls erfolglos geprüft. Für den Abschluss des Quellenabgleichs wird die korrekte URL oder Zugriff auf die genannte Quelle benötigt.

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

1. **Field Guide:** korrekte URL/Zugriff klären; vor M0-Abnahme Workflowführung und Fragen ergänzen. Dies ist die einzige fehlende inhaltliche Pflichtquelle dieses Plans.
2. **Agent-Ziel:** zunächst offizielles `CLAUDE.md` plus portable `CONTEXT.md`; spätere Adapter separat testen.
3. **UI-Sprache:** Deutsch zuerst; generierte Inhalte in einer pro Workspace gewählten Sprache. Technische Überschriften wie Inputs/Process/Outputs bleiben für den ersten Parser kanonisch.
4. **Umgang mit bestehenden Workspaces:** MVP unterstützt offizielle Templates und eigene Exporte; freie Altbestände zuerst nur analysieren und mit expliziter Vorschau migrieren.
5. **Optionale KI:** Anbieter und Modellwahl erst bei Beauftragung dieser Funktion entscheiden; kein API-Key für den MVP nötig.
6. **Technische Mindestversionen und Aufwand:** In M0 anhand stabiler VS-Code-APIs, React-Flow-Kompatibilität und Parser-Prototyp bestätigen. Die Aufwandsspanne im Plan ist eine Schätzung, keine Lieferzusage.

Die Dokumentation beschreibt eine geplante Umsetzung. Sie installiert keine Abhängigkeiten, erzeugt keine Extension und startet keinen Workflow.
