import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

/**
 * Registriert einen Nutzer via API und setzt das Session-Cookie im
 * Browser-Kontext, um die rate-limit-anfällige Login-Form zu umgehen.
 * Die Tests laufen sequenziell; bei vielen Logins erschöpft sich der
 * Auth-Rate-Limit-Bucket (10/60s) und spätere Tests bekommen 429.
 */
async function registerAndLogin(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
  name: string
) {
  const res = await request.post("/api/auth/register", {
    data: { name, email: unique(name), password: "testpass1234" },
  });
  expect(res.ok()).toBeTruthy();

  const setCookie = res.headers()["set-cookie"];
  const match = /bs_lernapp_session=([^;]+)/.exec(setCookie);
  const sessionValue = match ? match[1] : "";

  // Erst eine Page-URL aufrufen, damit der Kontext eine Domain hat,
  // dann das Session-Cookie setzen.
  await page.goto("/");
  await page.context().addCookies([
    {
      name: "bs_lernapp_session",
      value: sessionValue,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

test.describe("Mobile (iPhone 12 – 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Hamburger oeffnet und navigiert zur Uebersicht", async ({ page, request }) => {
    await registerAndLogin(page, request, "mobile");

    await page.goto("/lernen");
    await page.waitForURL("**/lernen");

    // Hamburger sollte sichtbar sein, Topnav-Links versteckt.
    await expect(page.locator(".mobile-nav-toggle")).toBeVisible();
    await expect(page.locator(".topnav__links")).toBeHidden();

    // Hamburger oeffnen
    await page.locator(".mobile-nav-toggle").click();
    await expect(page.locator(".mobile-nav-panel")).toBeVisible();

    // Ueber Menue zur Uebersicht (Startseite) navigieren
    await page.locator(".mobile-nav-link", { hasText: "Übersicht" }).click();
    await page.waitForURL("**/");
    // Panel ist nach Klick geschlossen
    await expect(page.locator(".mobile-nav-panel")).toBeHidden();
  });

  test("Lern-Sitzung ist auf Mobile nutzbar (kein horizontaler Overflow)", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page, request, "mobsess");

    await page.goto("/lernen");
    await page.waitForURL("**/lernen");

    // Pruefe auf horizontalen Overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // Eine Karte anzeigen lassen – Freie-Erinnerung (Musterantwort zeigen)
    // oder MCQ (.mcq-option, checkbox oder radio) oder "erledigt"-Screen.
    const reveal = page.getByRole("button", { name: "Musterantwort zeigen" });
    const mcqOpts = page.locator(".mcq-option input");
    const done = page.getByRole("heading", { name: /erledigt/ });
    await expect(
      reveal.or(mcqOpts.first()).or(done)
    ).toBeVisible({ timeout: 10000 });
  });

  test("Homepage ohne horizontalen Overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("Registrierungsseite ohne horizontalen Overflow", async ({ page }) => {
    await page.goto("/registrieren");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
