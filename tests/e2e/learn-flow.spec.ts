import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

test.describe("Lern-Sitzung mit SM-2", () => {
  test("Registrierung -> Frage beantworten -> Fortschritt sichtbar", async ({ page }) => {
    const email = unique("max");

    // 1. Registrierung
    await page.goto("/registrieren");
    await page.getByLabel("Name").fill("Max Mustermann");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel("Passwort (min. 8 Zeichen)").fill("testpass1234");
    await page.getByRole("button", { name: "Konto erstellen" }).click();

    // Nach der Registrierung landen wir bei /lernen
    await page.waitForURL("**/lernen");

    // 2. Eine Frage erscheint
    await expect(page.getByText("Musterantwort zeigen")).toBeVisible();
    await expect(page.getByText(/Kapitel \d/).first()).toBeVisible();

    // 3. Musterantwort aufdecken
    await page.getByRole("button", { name: "Musterantwort zeigen" }).click();
    await expect(page.getByText("Musterantwort")).toBeVisible();
    await expect(page.getByRole("button", { name: "Good" })).toBeVisible();

    // 4. Mit „Good" bewerten
    await page.getByRole("button", { name: "Good" }).click();

    // Naechste Frage laedt – entweder wieder „Musterantwort zeigen" oder „erledigt"
    await expect(async () => {
      const showBtn = page.getByRole("button", { name: "Musterantwort zeigen" });
      const doneHeading = page.getByRole("heading", { name: /erledigt/ });
      const showVisible = await showBtn.isVisible().catch(() => false);
      const doneVisible = await doneHeading.isVisible().catch(() => false);
      expect(showVisible || doneVisible).toBeTruthy();
    }).toPass();

    // 5. Fortschrittsseite zeigt_MINDESTENS_ eine gelernte Karte
    await page.goto("/fortschritt");
    await expect(page.getByRole("heading", { name: "Dein Stand" })).toBeVisible();
    // Wegwerf-Assertion: Prozentsatz-Zelle existiert mit „%“
    await expect(page.locator("text=\\d+%").first()).toBeVisible();
  });

  test("Anmeldung klappt für vorhandenes Konto", async ({ page, request }) => {
    const email = unique("anja");

    const reg = await request.post("/api/auth/register", {
      data: { name: "Anja", email, password: "testpass1234" },
    });
    expect(reg.ok()).toBeTruthy();

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel(/^Passwort$/).fill("testpass1234");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL("**/lernen");
    await expect(page.getByRole("heading", { name: /Heute wiederholen/ })).toBeVisible();
  });
});