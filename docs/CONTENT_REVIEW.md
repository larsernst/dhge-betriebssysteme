# Content Review – Antworten mit niedriger Vertrauensstufe

Fünf Modellantworten basieren auf sehr dünnen oder indirekt relevanten
Vorlesungsfolien; die Antwort ist eine Synthese oder Inferenz.
Vor der finalen Prüfungsvorbereitung sollten diese Einträge gegen die
Originalfolien bzw. mit dem Dozenten gegengeprüft werden.

| ID | Frage | Grund | Empfehlung |
|---|---|---|---|
| `4-ohne-l3-cache` | Welche Systeme verfügen nicht über L3-Cache? | Folien enthalten nur die generelle Cache-Struktur; keine explizite Liste von Systemen ohne L3-Cache. | Mit dem Dozenten klären, ob die Antwort so akzeptiert würde. |
| `2-round-robin-risiko` | Welches Risiko birgt das Round-Robin-Verfahren? | Round Robin wird in den Folien nicht namentlich genannt (nur Zeitscheiben-/präemptives Scheduling); die Risiko-Argumentation ist allgemein abgeleitet. | Evtl. auf die tatsächliche Benennung in der Vorlesung anpassen. |
| `6-drei-sicherheitspolitiken` | Erläutern Sie das Prinzip der drei … Sicherheitspolitiken | Folien zeigen die drei Strategien als Konzepte, aber die Vor-/Nachteile sind nicht explizit pro Strategie aufgeschlüsselt; die Antwort ist eine Synthese. | Prüfen, ob die Drei-Einteilung (konfiguriert/restriktiv/permissiv) der Vorlesungsnomenklatur entspricht. |
| `2-thread-beispiele` | Nennen Sie je ein Beispiel für Kernel- und User-Threads | Die Beispiele (Linux-Pthreads, POSIX-User-Thread-Bibliothek) sind aus dem Kontext der Folien abgeleitet, nicht explizit als „Beispiel X" genannt. | Ggf. durch die tatsächlich in der Vorlesung genannten Beispiele ersetzen. |
| `6-authentifizierung-fragen` | Welche Fragen können bei einer Authentifizierung gestellt werden? | Die Folie listet die drei Faktoren (Wissen/Besitz/Biometrie); die Frageformulierung als „Fragen" ist eine freie Interpretation. | Sicherstellen, dass der Dozent die Frage tatsächlich im Sinne der drei Faktoren meint. |

## Wie prüfen?

Öffne die jeweilige `sourceRef`-Datei im `resources/`-Ordner und vergleiche die
Folien mit der Modellantwort. Korrekturen nur in
`prisma/seed-data/fragenkatalog.ts` vornehmen, danach `npm run db:seed`.

## Kennzeichnung in der App

Im Katalog (`/katalog`) werden Fragen mit `confidence: "low"` mit einem
„prüfen"-Badge markiert, damit du sie beim Lernen identifizieren kannst.