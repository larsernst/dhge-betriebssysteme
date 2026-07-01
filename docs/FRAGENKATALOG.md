# Fragenkatalog

Die App basiert auf dem **Fragenkatalog 2026 Betriebssysteme – Grundlagen**
von Ing. Leonard Zeh. Die Fragen sind in `prisma/seed-data/fragenkatalog.ts`
als typisiertes Array abgelegt und werden beim Seed in die Tabelle
`Question` geschrieben.

## Struktur

```ts
interface CatalogQuestion {
  id: string;           // stabiler Slug, z. B. "2-round-robin"
  chapter: number;      // 1..6
  chapterTitle: string; // z. B. "Prozesse und Threads"
  question: string;     // bereinigte Frage
  answer: string;       // Modellantwort aus den Vorlesungsfolien
  sourceRef: string;    // Dateiname der Quelldatei
}
```

## Kapitelübersicht

| Kapitel | Titel | Fragen |
|---|---|---|
| 1 | Einführung | 9 |
| 2 | Prozesse und Threads | 35 |
| 3 | Ein- und Ausgabegeräte | 7 |
| 4 | Speicherverwaltung | 19 |
| 5 | Datensicherung | 7 |
| 6 | Sicherheit in Betriebssystemen | 23 |
| **Σ** | | **100** |

Einige Katalog-Einträge bestehen im Original aus zwei Sätzen mit eigenem
`?`/`!` (z. B. „Was ist ein Systemprüfpunkt? Welche Informationen werden
dabei nicht gesichert?"). Diese wurden in zwei separate Fragen
aufgeteilt, damit SM-2 jede Teilfrage eigenständig bewerten kann. Die
Gesamtzahl liegt daher leicht über der Anzahl der rohen Katalog-Bullets.

## Quellen-Zuordnung

`sourceRef` verweist auf die jeweilige Vorlesungsfolie:

- `_MConverter.eu_Betriebssysteme_Kapitel 1_share.md` → Kapitel 1
- `_MConverter.eu_Betriebssysteme_Kapitel 3_gesamt.md` → Kapitel 2 (Prozesse/Threads)
- `_MConverter.eu_Betriebssysteme_Kapitel 2_share.md` → Kapitel 3 (E/A)
- `_MConverter.eu_Folien - Speicherverwaltung.md` → Kapitel 4
- `_MConverter.eu_Folien - Kapitel 4 - Datensicherung.md` → Kapitel 5
- `_MConverter.eu_Betriebssysteme_Kapitel 6 gesamt.md` → Kapitel 6

(Die Dateinamen der Vorlesung sind inkonsistent nummeriert – die Zuordnung
erfolgt inhaltlich.)

## Antworten ändern

Antworten sind bewusst knapp gehalten (meist 1–4 Sätze). Um eine Antwort
zu korrigieren oder zu ergänzen, editiere den Eintrag in
`prisma/seed-data/fragenkatalog.ts` und führe `npm run db:seed` erneut aus
(der Seed verwendet `upsert`, ist also idempotent).