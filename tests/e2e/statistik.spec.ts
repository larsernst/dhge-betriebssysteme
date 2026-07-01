import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

test.describe("Statistik & schwieriger Stapel", () => {
  test("Eine Bewertung zaehlt als Aktivitaet und Serie in /statistik", async ({ page, request }) => {
    const email = unique("stat");
    await request.post("/api/auth/register", {
      data: { name: "Stat", email, password: "testpass1234" },
    });

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    // Eine Freie-Erinnerungs-Karte mit "Good" bewerten (falls MCQ kommt, "Easy"-Pfad nicht moeglich -> wiederholen).
    let guard = 0;
    while (guard++ < 20) {
      const reveal = page.getByRole("button", { name: "Musterantwort zeigen" });
      const auswerten = page.getByRole("button", { name: "Auswerten" });
      if (await reveal.isVisible().catch(() => false)) {
        await reveal.click();
        await page.getByRole("button", { name: "Good" }).click();
        await page.waitForTimeout(1100);
        break;
      }
      if (await auswerten.isVisible().catch(() => false)) {
        // MCQ-Karte: einfach erste Option ankreuzen und auswerten
        await page.locator(".mcq-option input[type=checkbox]").first().check();
        await auswerten.click();
        await page.waitForTimeout(1700);
        continue;
      }
      await page.waitForTimeout(500);
    }

    await page.goto("/statistik");
    await expect(page.getByRole("heading", { name: "Deine Lern-Statistik" })).toBeVisible();
    await expect(page.getByText("Aktuelle Serie")).toBeVisible();
    await expect(page.locator(".heatmap__cell--1, .heatmap__cell--2, .heatmap__cell--3").first()).toBeVisible();
  });

  test("Schwieriger Stapel zeigt eine mit Again bewertete Karte", async ({ page, request }) => {
    const email = unique("diff");
    await request.post("/api/auth/register", {
      data: { name: "Diff", email, password: "testpass1234" },
    });

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");

    // Erste Freie-Erinnerungs-Karte mit "Again" bewerten -> lapses=1, faellig heute.
    const reveal = page.getByRole("button", { name: "Musterantwort zeigen" });
    await reveal.click();
    await page.getByRole("button", { name: "Again" }).click();
    await page.waitForTimeout(1100);

    // Schwieriger Stapel sollte nun diese Karte liefern.
    await page.goto("/lernen?deck=difficult");
    await expect(page.getByRole("heading", { name: "Schwierige Karten" })).toBeVisible();
    await expect(page.locator("text=/Kapitel \\d/").first()).toBeVisible({ timeout: 5000 });
  });

  test("Statistik ohne Login leitet auf /login um", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/statistik");
    await page.waitForURL("**/login");
  });
});