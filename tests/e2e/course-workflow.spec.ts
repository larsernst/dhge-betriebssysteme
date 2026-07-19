import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

// Kurs-Workflow (Phase E4): Einstellungen (Slug), Duplizieren, Export,
// Import (Dry-Run + Anwenden), Kursbild. Läuft im Projekt "editor-chromium".

// 1x1 transparentes PNG (67 Bytes) – erfüllt die Magic-Bytes-Prüfung.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function createCourse(page: Page, title: string) {
  await page.goto("/editor");
  await page.getByText("Neuen Kurs anlegen").first().click();
  await page.getByPlaceholder("z. B. Algorithmen und Datenstrukturen").fill(title);
  await page.getByRole("button", { name: "Kurs anlegen & zum Curriculum" }).click();
  await page.waitForURL(/\/editor\/kurs\/[^/]+$/);
  return page.url().split("/editor/kurs/")[1];
}

async function addRecallQuestion(page: Page, questionText: string) {
  await page.getByPlaceholder("Neues Kapitel …").fill("Kapitel Eins");
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: "Neue Frage" }).click();
  await page.getByPlaceholder(/Welche Aufgaben hat ein Betriebssystem/).fill(questionText);
  await page
    .locator("div.field", { has: page.locator("label", { hasText: /^Musterantwort$/ }) })
    .locator("textarea")
    .fill("Antwort.");
  await page.getByPlaceholder("z. B. skript.md, Folie 12").fill("e4.md");
  await page.getByRole("button", { name: "Frage speichern" }).click();
  await expect(page.getByText("Frage hinzugefügt.")).toBeVisible();
}

test("Einstellungen: Slug ändern und Kollisions-Fehler", async ({ page }) => {
  await createCourse(page, `E4-Settings ${Date.now()}`);
  await page.getByRole("link", { name: "Einstellungen" }).click();
  await page.waitForURL(/\/einstellungen$/);

  // Slug ändern -> Erfolg
  await page.locator("input[placeholder='mein-kurs']").fill(`e4-slug-${Date.now()}`);
  await page.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByText("Kurs aktualisiert.")).toBeVisible();

  // Kollision mit dem Seed-Kurs "betriebssysteme" -> 409
  await page.locator("input[placeholder='mein-kurs']").fill("betriebssysteme");
  await page.getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByText("Slug wird bereits verwendet.")).toBeVisible();
});

test("Kurs duplizieren: Kopie als Entwurf mit Kapiteln und Fragen", async ({ page }) => {
  await createCourse(page, `E4-Dup ${Date.now()}`);
  await addRecallQuestion(page, "Originalfrage?");

  await page.getByRole("link", { name: "Einstellungen" }).click();
  await page.getByRole("button", { name: "Kurs duplizieren" }).click();

  // Direkt im Curriculum der Kopie
  await page.waitForURL(/\/editor\/kurs\/[^/]+$/);
  await expect(page.getByRole("heading", { name: /\(Kopie\)$/ })).toBeVisible();
  await expect(page.getByText("Entwurf").first()).toBeVisible();
  await expect(page.locator("div[draggable='true'] span", { hasText: "1. Kapitel Eins" }).first()).toBeVisible();
  await expect(page.getByText("Originalfrage?")).toBeVisible();
});

test("Export liefert JSON-Datei mit Fragen", async ({ page }) => {
  await createCourse(page, `E4-Export ${Date.now()}`);
  await addRecallQuestion(page, "Exportfrage?");

  await page.getByRole("link", { name: "Einstellungen" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Als JSON exportieren" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const json = JSON.parse(await readFile(path!, "utf8"));
  expect(json.format).toBe("lernapp-course@1");
  expect(json.chapters.length).toBeGreaterThan(0);
  expect(json.questions.some((q: { question: string }) => q.question === "Exportfrage?")).toBe(true);
});

test("Import: Dry-Run-Report und Anwenden", async ({ page }) => {
  const courseId = await createCourse(page, `E4-Import ${Date.now()}`);
  await page.getByRole("link", { name: "Einstellungen" }).click();

  // Ungültiges JSON (fehlende Antwort) -> Fehlerreport
  const bad = { questions: [{ id: "imp-bad", question: "Ohne Antwort?", sourceRef: "x" }] };
  await page.locator("input[accept*='json']").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  await expect(page.getByText(/Problem\(e\) gefunden/)).toBeVisible();

  // Gültiger Import -> Dry-Run OK -> anwenden
  const good = {
    questions: [
      { id: "imp-good-1", question: "Importierte Frage?", answer: "Antwort.", sourceRef: "imp.md", chapterSlug: "importiert" },
    ],
  };
  await page.locator("input[accept*='json']").setInputFiles({
    name: "good.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(good)),
  });
  await expect(page.getByText(/wären importierbar/)).toBeVisible();
  await page.getByRole("button", { name: /Fragen importieren/ }).click();
  await expect(page.getByText(/Import abgeschlossen/)).toBeVisible();

  // Frage erscheint im Curriculum
  await page.goto(`/editor/kurs/${courseId}`);
  await expect(page.getByText("Importierte Frage?")).toBeVisible();
  await expect(page.locator("div[draggable='true'] span", { hasText: "1. Importiert" }).first()).toBeVisible();
});

test("Kursbild: Upload, Anzeige auf Dashboard, Entfernen", async ({ page }) => {
  const courseId = await createCourse(page, `E4-Bild ${Date.now()}`);
  await page.goto(`/editor/kurs/${courseId}/einstellungen`);

  await page.locator("input[accept*='image']").setInputFiles({
    name: "bild.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_BASE64, "base64"),
  });
  await expect(page.getByText("Kursbild aktualisiert.")).toBeVisible();
  await expect(page.locator("img[alt='Kursbild']")).toBeVisible();

  // Editor-Dashboard zeigt das Bild auf der Kurs-Karte
  await page.goto("/editor");
  const card = page.locator(".card", { hasText: /E4-Bild/ }).first();
  await expect(card.locator("img")).toBeVisible();

  // Entfernen -> Platzhalter wieder da
  await page.goto(`/editor/kurs/${courseId}/einstellungen`);
  await page.getByRole("button", { name: "Bild entfernen" }).click();
  await expect(page.getByText("Kein Bild")).toBeVisible();
});
