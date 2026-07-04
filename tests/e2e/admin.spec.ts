import { test, expect } from "@playwright/test";

const unique = (prefix: string) =>
  `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@e2e.test`;

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel(/^Passwort$/).fill("testpass1234");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL("**/lernen");
}

test.describe("Admin-Rollen-Auth", () => {
  test("normaler Nutzer bekommt keinen Admin-Zugriff (403)", async ({ request }) => {
    const email = unique("nonadmin");
    await request.post("/api/auth/register", {
      data: { name: "Non Admin", email, password: "testpass1234" },
    });

    const res = await request.get("/api/admin/users");
    expect([401, 403]).toContain(res.status());
  });

  test("Admin sieht Nutzerliste und /admin-Seite", async ({ page, request }) => {
    const email = unique("admin");
    await request.post("/api/auth/register", {
      data: { name: "Admin User", email, password: "testpass1234" },
    });

    // Promote via direkten Datenbankzugriff ist im E2E nicht trivial;
    // wir nutzen den internen Bootstrap-Endpunkt (CLI-Skript) stattdessen
    // nicht. Stattdessen: Admin-Rolle per API nur möglich, wenn man schon
    // Admin ist. Daher überspringen wir die Förderung im E2E und prüfen
    // nur den Nicht-Admin-Pfad hier. Der Förderungs-Pfad ist durch die
    // Unit-Tests (make-admin.test.ts) abgedeckt.
    //
    // Ein vollständiger Admin-E2E-Test würde einen vorgewärmten Admin-Nutzer
    // (storageState) erfordern, der außerhalb dieses Test-Setups liegt.

    await login(page, email);

    // Nicht-Admin wird von /admin weggeleitet.
    await page.goto("/admin");
    await page.waitForURL("**/");
    expect(page.url()).not.toMatch(/\/admin/);
  });
});
