import { expect, test } from "@playwright/test";

test("home links to the public collection", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/BeDifferent/);
  await expect(page.getByRole("heading", { name: /MORE THAN CLOTHING/ })).toBeVisible();
  await page.getByRole("link", { name: /Explorar/ }).first().click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole("heading", { name: /Vístete diferente/ })).toBeVisible();
});

test("the public pages are reachable without a customer account", async ({ page }) => {
  for (const [path, heading] of [["/nosotros", /La diferencia/], ["/contacto", /Tienes algo en mente/]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    if (path === "/contacto") {
      await expect(page.getByRole("link", { name: /Conversemos/ })).toHaveAttribute("href", "https://wa.me/573053744560");
      await expect(page.getByRole("link", { name: /@bedifferentofficial_/ })).toHaveAttribute("href", "https://www.instagram.com/bedifferentofficial_/");
    }
  }
});

test("core routes load without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const path of ["/", "/catalogo", "/nosotros", "/contacto", "/admin/login"]) await page.goto(path);
  expect(errors).toEqual([]);
});

test("catalog displays the empty state while no products are published", async ({ page }) => {
  await page.goto("/catalogo");
  await expect(page.getByRole("heading", { name: "No hay productos publicados." })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Buscar por nombre" })).toBeVisible();
});

test("empty collection copy avoids unconfirmed launch promises", async ({ page }) => {
  for (const path of ["/", "/catalogo"]) {
    await page.goto(path);
    await expect(page.getByText(/vuelve pronto|llega pronto|coming soon|est\. bd/i)).toHaveCount(0);
  }
});

test("administrator routes redirect visitors to sign in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: /Acceso privado/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Volver al sitio" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Explorar" })).toHaveCount(0);
});

test("layout has no horizontal overflow on a small viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});

test("catalog search and category filters are reflected in the URL", async ({ page }) => {
  await page.goto("/catalogo");
  await page.getByRole("link", { name: "Oversized" }).click();
  await expect(page).toHaveURL(/category=oversized/);
  await page.getByRole("searchbox", { name: "Buscar por nombre" }).fill("SinCoincidencias");
  await page.getByRole("button", { name: "Aplicar búsqueda y filtros" }).click();
  await expect(page).toHaveURL(/q=SinCoincidencias/);
  await expect(page.getByRole("heading", { name: "Sin resultados." })).toBeVisible();
});

test("mobile navigation can be opened from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByText("Menú", { exact: true }).press("Enter");
  await expect(page.getByRole("navigation", { name: "Navegación móvil" }).getByRole("link", { name: "Contacto" })).toBeVisible();
});

test("skip link transfers focus to the main page content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("production response includes nonce-based CSP and security headers", async ({ page }) => {
  const response = await page.goto("/");
  const headers = await response?.allHeaders();
  const contentSecurityPolicy = headers?.["content-security-policy"] ?? "";
  expect(contentSecurityPolicy).toContain("default-src 'self'");
  expect(contentSecurityPolicy).toContain("'strict-dynamic'");
  expect(contentSecurityPolicy).not.toContain("'unsafe-inline'");
  expect(contentSecurityPolicy).not.toContain("'unsafe-eval'");
  const nonce = contentSecurityPolicy.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  const scriptNonces = await page.locator("script:not([src])").evaluateAll((scripts) => scripts.map((script) => (script as HTMLScriptElement).nonce));
  expect(scriptNonces.length).toBeGreaterThan(0);
  expect(scriptNonces.every((scriptNonce) => scriptNonce === nonce)).toBe(true);
  expect(headers?.["x-content-type-options"]).toBe("nosniff");
  expect(headers?.["x-frame-options"]).toBe("DENY");
  expect(headers?.["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  const reloadedResponse = await page.reload();
  const reloadedPolicy = (await reloadedResponse?.allHeaders())?.["content-security-policy"] ?? "";
  const reloadedNonce = reloadedPolicy.match(/'nonce-([^']+)'/)?.[1];
  expect(reloadedNonce).toBeTruthy();
  expect(reloadedNonce).not.toBe(nonce);
});

test("public forms and interactive controls have accessible names", async ({ page }) => {
  await page.goto("/catalogo");
  const unnamedControls = await page.locator("input:not([type=hidden]), select, button").evaluateAll((elements) => elements.filter((element) => {
    const control = element as HTMLInputElement;
    const hasName = control.labels?.length || control.getAttribute("aria-label") || control.getAttribute("aria-labelledby") || control.innerText?.trim();
    return !hasName;
  }).map((element) => element.outerHTML));
  expect(unnamedControls).toEqual([]);
});
