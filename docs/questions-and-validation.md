# Geführte Erstellung, Fragen und Validierung

Status: vorläufiger Fragenkatalog aus dem offiziellen ICM-Workspace-Builder. Die Fragen des angeforderten Field Guides konnten noch nicht gelesen werden und werden hier nicht als bekannt dargestellt. Vor Umsetzung erfolgt der Abgleich gemäß [Quellenprotokoll](sources-and-decisions.md).

## 1. Führung und Vorschläge

Die Oberfläche kombiniert eine optionale Schrittführung mit einer vollständigen, flachen Fragenliste. Nutzer können alles in einem Durchgang beantworten, später gezielt korrigieren und Entwürfe speichern. Eine Fortschrittsanzeige zeigt offene Pflichtangaben, optionale Verbesserungen und begründet übersprungene Fragen getrennt; sie ist kein Qualitätsversprechen.

Vorschläge enthalten Herkunft und Begründung, beispielsweise „`package.json` gefunden: Node.js könnte für diese Stage relevant sein“. Die Extension unterscheidet beobachtete Dateien, abgeleitete Vorschläge und bestätigte Angaben. Bestätigen oder Bearbeiten ist jederzeit möglich; ein erkannter Ordnername erzeugt noch keine verbindliche Stage.

Quellgrundlage: `workspaces/workspace-builder/setup/questionnaire.md` Q1–Q4, Discovery-Prozess Schritte 1–9 und `_core/CONVENTIONS.md` Patterns 1, 4, 7, 8, 11–13. Diese Fragen werden für die Oberfläche auf Deutsch paraphrasiert und um konkrete Editorfelder ergänzt.

## 2. Fragen beim Entwerfen des Workflows

Die folgende Liste wird insgesamt angezeigt. Stage-Fragen wiederholen sich als Formular je Stage, nicht als wiederholtes Onboarding beim Öffnen.

| ID | Frage | Beispiel/Default | Verwendung und Quelle |
|---|---|---|---|
| D01 | Für welches Arbeitsgebiet ist dieser Ordner gedacht? | „Recherche und Fachartikel“; Ordnername als unbestätigter Vorschlag | Workspace-Zweck; offizielles Setup Q1 |
| D02 | Was beginnt den Ablauf, und welches Ergebnis soll am Ende vorliegen? | „Quellen zu einem Thema in einen geprüften Artikel verwandeln“ | Workflowgrenze; Setup Q2, Discovery 1 |
| D03 | Wer nutzt den Workflow, mit welchen KI-Kenntnissen und Werkzeugen? | „Einzelperson mit VS Code und dateilesendem Agenten“ | Hilfetiefe und Toolbedarf; Setup Q3 |
| D04 | Welche Schritte gibt es, und welche sind optional? | „Recherche, Entwurf, Prüfung“; keine Stage ohne Bestätigung übernehmen | Stufenfolge; Setup Q4, Discovery 2/6 |
| D05 | Welche eine Aufgabe übernimmt diese Stage? | „Aus Quellen eine belegte Übersicht erstellen“ | Stage-Beschreibung; Pattern 1 |
| D06 | Welche Eingaben braucht die Stage, aus welcher Datei und welchem Abschnitt? | `shared/style.md`, Abschnitt „Ton“; „Full file“ nur bewusst | Inputs und Scope; Discovery 3, Pattern 4 |
| D07 | Welche konkreten Arbeitsschritte soll der Agent ausführen? | „Quellen lesen, Aussagen vergleichen, Belege zuordnen“ | Process; Stage-Template |
| D08 | Welches Artefakt entsteht, wo und in welchem Format? | `output/[topic-slug]-research.md`, Markdown | Outputs und Übergaben; Discovery 3, Pattern 2 |
| D09 | Welche Regeln gelten dauerhaft, und wo ist ihre maßgebliche Quelle? | Gemeinsame Regeln in `shared/quality-rules.md` | Layer 3, kanonische Quellen; Discovery 4, Pattern 5 |
| D10 | Welche Tools oder Skills benötigt die Stage wofür? | Datei lesen, Websuche oder `ffmpeg`; „keine zusätzlichen Tools“ explizit möglich | Toolbedarf, Pflicht/optional, Setup-Verweis; Discovery 7/8 |
| D11 | Wo soll ein Mensch prüfen oder eine Richtung auswählen? | Nach Gliederungsentwurf; bei rein linearer Konvertierung optional | Checkpoints mit Prozessschritt; Pattern 11 |
| D12 | Woran erkennt man, dass das Ergebnis die Anforderungen erfüllt? | „Jede Tatsachenbehauptung besitzt eine Quellenangabe“ | Audit mit Pass-Kriterium; Pattern 12 |
| D13 | Welchen konkreten Nutzen soll eine Inhaltsstage liefern? | „Eine direkt anwendbare Handlungsempfehlung“ | Value-Framework-Referenz; nur bei Inhaltsproduktion, Pattern 13 |
| D14 | Was bleibt zwischen Läufen konstant und was wird pro Lauf neu eingegeben? | Dauerhaft: Stil; pro Lauf: Thema und Quellen | Setup-/Lauftrennung; Discovery 5, Pattern 8 |

Das Toolformular fragt Name/Fähigkeit, Zweck, zugehörige Prozessschritte, Pflichtstatus, Verfügbarkeit („unbekannt“, „vom Nutzer bestätigt“), Setup-Dokument und Verifikationsanweisung ab. Bei MCP-Tools kann ein Server-/Toolname dokumentiert werden; die Extension behauptet dadurch keine bestehende Verbindung. Zugangsdaten gehören nicht in Markdown oder den Fragebogen.

## 3. Setup-Fragen des später erzeugten Workspaces

Dies sind Fragen an zukünftige Nutzer des erzeugten Workflows, getrennt von der Gestaltung des Workflows selbst. Sie konfigurieren das wiederverwendbare System. Der Builder leitet sie aus benötigten dauerhaften Variablen ab und erzeugt `setup/questionnaire.md` als flache Liste.

| ID | Frage, wenn für die Domäne relevant | Beispiel/Default | Ziel |
|---|---|---|---|
| S01 | Für welche Identität oder Organisation produziert das System? | Neutral ohne Markenbezug | Kanonische Identitätsreferenz |
| S02 | Welche konkreten Formulierungen passen zum gewünschten Stil, welche nicht? | Je zwei positive/negative Sätze; neutraler Stil als Auswahl | Stilregeln mit anschließendem Review abgeleiteter Regeln |
| S03 | Welche dauerhaften Gestaltungs-, Qualitäts- oder Compliance-Regeln gelten? | Vorhandenes Regelwerk referenzieren; zusätzliche Regeln optional | Referenzdateien, Audit-Grundlage |
| S04 | Welche Werkzeuge und Ausgabeformate sollen standardmäßig vorgesehen sein? | Markdown und vorhandene dateilesende Werkzeuge | Tool-Anleitungen und dauerhafte Formatwahl |
| S05 | Welche angebotenen optionalen Stufen sollen dauerhaft aktiv sein? | Alle Pflichtstufen, optionale ausdrücklich auswählen | Statische Konfiguration nach Prüfung der Übergaben |
| S06 | Welche gemeinsamen Werte werden bei Codeausgaben benötigt? | Farben, Schriften oder andere domänenspezifische Konstanten | Verweis auf gemeinsame Konstantendatei; nur bei Codeproduktion |

Jede Frage besitzt ID, Quellbezug, Typ, Pflichtstatus, Default oder Beispiel, zugeordnete Variable und Zielfelder. Ableitbare Werte werden nicht erneut abgefragt. Änderungen bleiben später über „Konfiguration bearbeiten“ möglich. Ein Default darf keine erfundene Identität, Regel oder Toolverfügbarkeit behaupten.

Thema, aktueller Projektname, konkrete Quellen und Umfang eines einzelnen Durchlaufs werden im Einstieg der ersten Stage erfasst. Eine Zielgruppe kann dauerhaft oder laufabhängig sein; diese Entscheidung wird ausdrücklich getroffen. Solche Laufparameter dürfen nicht irrtümlich als dauerhafte Setup-Platzhalter festgeschrieben werden.

## 4. Diagnosen und Grenzen

| Regel | Befund | Wirkung | Lösungsvorschlag |
|---|---|---|---|
| CONTRACT-01 | Inputs, Process oder Outputs fehlen; Pflichtfeld leer | Fehler | Fehlenden Vertragsteil öffnen |
| ROUTE-01 | Aufgabe ohne eindeutiges Ziel oder Ziel außerhalb erlaubten Bereichs | Fehler | Ziel wählen oder Scope korrigieren |
| PATH-01 | Referenzdatei oder gewählter Abschnitt fehlt | Fehler | Vorhandenen Pfad/Abschnitt auswählen |
| ARTIFACT-01 | Erwartetes Output existiert noch nicht, ist aber durch vorherige Stage definiert | Information | Als geplant anzeigen; keine leere Fake-Datei erzeugen |
| HANDOFF-01 | Konsument erwartet unvereinbaren Pfad oder Format | Fehler | Artefaktbindung korrigieren |
| GRAPH-01 | Zyklus, Selbstreferenz oder Abhängigkeit auf spätere Stage | Fehler | Verbindung oder Reihenfolge ändern |
| GRAPH-02 | Nichtfinales Output hat keinen Konsumenten | Hinweis | Übergabe ergänzen oder als bewusstes Endartefakt markieren |
| TOOL-01 | Erforderliches Tool ohne Zweck oder Setup-/Nutzungsreferenz | Fehler | Toolbeschreibung ergänzen |
| TOOL-02 | Verfügbarkeit nicht bestätigt | Hinweis | Manuelle Prüfung anhand dokumentierter Anweisung |
| CONFIG-01 | Zielplatzhalter ohne Frage oder unbeantworteter Pflichtwert | Fehler für vollständigen Export | Antwort ergänzen; Template-Entwurf weiterhin speicherbar |
| CONFIG-02 | Laufparameter im dauerhaften Setup | Hinweis zur Prüfung | In erste Stage verschieben |
| CONFIG-03 | Ungültiger oder unvollständiger bedingter Abschnitt | Fehler | Ganzen Abschnitt kapseln und Paarung korrigieren |
| REVIEW-01 | Kreative Stage ohne Checkpoint oder kreative/Build-Stage ohne Audit | Hinweis | Vorschlag ergänzen oder Ausnahme begründen |
| REVIEW-02 | Checkpoint referenziert keinen gültigen Prozessschritt | Fehler | Schritt zuordnen |
| CONTEXT-01 | Routingdatei länger als 80 Zeilen oder Referenz länger als 200 | Hinweis | Inhalt in separate Referenz verschieben oder aufteilen |
| CONTEXT-02 | Umfangreiche Regeln direkt im Routing oder doppelte maßgebliche Inhalte | Heuristischer Hinweis | Kanonische Quelle festlegen; keine automatische Löschung |
| NAME-01 | Ungültige Stage-Nummer, kollidierender oder nicht portabler Dateiname | Fehler | Sicheren Namen vorschlagen; Standarddateien wie `CONTEXT.md` ausnehmen |
| CONFLICT-01 | Datei seit Vorschau extern verändert | Schreibblockade | Diff erneut prüfen und Änderungen zusammenführen |

Semantische Aussagen wie „diese Stage hat genau eine Verantwortung“ oder „dieses Audit ist sinnvoll“ sind nur teilweise automatisierbar. Sie werden als Review-Fragen oder begründete Hinweise gezeigt, nicht als sichere maschinelle Beweise.

## 5. Abgleich mit dem Field Guide

Sobald die Quelle erreichbar ist: Commit pinnen, Workflowphasen und Fragen erfassen, jede Frage D/S einer konkreten Guide-Stelle zuordnen, zusätzliche Fragen kenntlich machen, Widersprüche zum offiziellen ICM dokumentieren und den Katalog aktualisieren. Abnahme: keine als Guide-basiert bezeichnete Frage ohne belegten Quellbezug; alle wesentlichen Guide-Schritte sind berücksichtigt oder mit Begründung außerhalb des Umfangs.
