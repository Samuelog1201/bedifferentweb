import { expect, test } from "@playwright/test";
import {
  approvedProductionWhatsAppNumber,
  buildProductInquiryMessage,
  buildWhatsAppUrl,
  getProductInquirySelectionError,
} from "../src/lib/whatsapp";

test("home links to the public collection", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/BeDifferent/);
  await expect(page.locator(".contact-band").getByText("MORE THAN CLOTHING.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Explorar/ }).first().click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole("heading", { name: /Vístete diferente/ })).toBeVisible();
});

test("official BD favicon metadata and icon assets are served without Next.js defaults", async ({ page, request }) => {
  await page.goto("/");
  const iconLinks = await page.locator('head link[rel~="icon"]').evaluateAll((links) =>
    links.map((link) => (link as HTMLLinkElement).getAttribute("href")),
  );
  const appleIcon = await page.locator('head link[rel="apple-touch-icon"]').getAttribute("href");

  expect(iconLinks).toContain("/icons/bedifferent-favicon-v1.ico");
  expect(iconLinks).toContain("/icons/bedifferent-192.png");
  expect(iconLinks).toContain("/icons/bedifferent-512.png");
  expect(appleIcon).toBe("/icons/bedifferent-180.png");
  expect(iconLinks?.some((href) => href?.includes("next.svg"))).toBe(false);

  for (const [path, contentType] of [
    ["/favicon.ico", /image\/x-icon|image\/vnd\.microsoft\.icon/],
    ["/icons/bedifferent-favicon-v1.ico", /image\/x-icon|image\/vnd\.microsoft\.icon/],
    ["/icons/bedifferent-180.png", /image\/png/],
    ["/icons/bedifferent-192.png", /image\/png/],
    ["/icons/bedifferent-512.png", /image\/png/],
  ] as const) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should load`).toBe(true);
    expect(response.headers()["content-type"]).toMatch(contentType);
    expect((await response.body()).byteLength).toBeGreaterThan(100);
  }
});

test("the public pages are reachable without a customer account", async ({ page }) => {
  for (const [path, heading] of [["/nosotros", /La diferencia/], ["/contacto", /Tienes algo en mente/]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    if (path === "/contacto") {
      await expect(page.getByRole("link", { name: /Conversemos/ })).toHaveAttribute("href", `https://wa.me/${approvedProductionWhatsAppNumber}`);
      await expect(page.getByRole("link", { name: /@bedifferentofficial_/ })).toHaveAttribute("href", "https://www.instagram.com/bedifferentofficial_/");
    }
  }
});

test("WhatsApp inquiry composes current product, variant, size, price, and an encoded click-to-chat URL", () => {
  const firstMessage = buildProductInquiryMessage({
    productName: "Originals Oversized Tee",
    color: "Beige",
    size: "L",
    price: "$69.000 COP",
    productUrl: "https://bedifferent.example/producto/originals-oversized-tee",
  });
  expect(firstMessage).toContain("Producto: Originals Oversized Tee");
  expect(firstMessage).toContain("Color: Beige");
  expect(firstMessage).toContain("Talla: L");
  expect(firstMessage).toContain("Precio: $69.000 COP");
  expect(decodeURIComponent(buildWhatsAppUrl(approvedProductionWhatsAppNumber, firstMessage))).toContain(firstMessage);
  expect(buildWhatsAppUrl(approvedProductionWhatsAppNumber, firstMessage)).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);

  const changedSelection = buildProductInquiryMessage({
    productName: "Originals Oversized Tee",
    color: "Negro",
    size: "M",
    price: "$69.000 COP",
  });
  expect(changedSelection).toContain("Color: Negro");
  expect(changedSelection).toContain("Talla: M");
  expect(getProductInquirySelectionError({ hasVariants: true, hasSizes: true, color: null, size: "" })).toMatch(/color/i);
  expect(getProductInquirySelectionError({ hasVariants: true, hasSizes: true, color: "Beige", size: "" })).toMatch(/talla/i);
  expect(getProductInquirySelectionError({ hasVariants: false, hasSizes: false, color: null, size: "" })).toBe("");
});

test("product detail images fit fully and open a navigable lightbox by click or tap", async ({ page }, testInfo) => {
  await page.goto("/catalogo");
  const firstProduct = page.locator(".product-card h3 a").first();
  test.skip(!(await firstProduct.count()), "Requires at least one published product.");
  await firstProduct.click();

  const mainImage = page.locator(".gallery-main-trigger");
  test.skip(!(await mainImage.count()), "This published product has no available product photograph.");
  const image = page.locator(".gallery-image");
  await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(image).toHaveCSS("object-fit", "contain");

  const bounds = await mainImage.boundingBox();
  if (testInfo.project.name.includes("mobile") && bounds) {
    await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  } else {
    await mainImage.click();
  }
  const dialog = page.getByRole("dialog", { name: /Fotografías de/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".lightbox-image")).toHaveCSS("object-fit", "contain");
  await expect.poll(() => dialog.locator(".lightbox-image").evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

  const thumbnailCount = await page.locator(".gallery-thumbnail").count();
  if (thumbnailCount > 1) {
    await dialog.getByRole("button", { name: "Fotografía siguiente" }).click();
    await expect(dialog.locator(".lightbox-caption")).toContainText(`02 / ${String(thumbnailCount).padStart(2, "0")}`);
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.locator(".lightbox-caption")).toContainText(`01 / ${String(thumbnailCount).padStart(2, "0")}`);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("WhatsApp product inquiry validates choices and follows selected color, size, and price without sending", async ({ page }) => {
  await page.goto("/catalogo");
  const firstProduct = page.locator(".product-card h3 a").first();
  test.skip(!(await firstProduct.count()), "Requires at least one published product.");
  await firstProduct.click();

  const productName = (await page.locator(".product-info h1").textContent())?.trim() ?? "";
  const colorButtons = page.locator(".variant-picker button");
  const sizeButtons = page.locator(".size-button:not(:disabled)");
  const hasVariants = await colorButtons.count() > 0;
  const hasSizes = await sizeButtons.count() > 0;
  const whatsappButton = page.getByRole("link", { name: /Consultar por WhatsApp/ });

  if (hasVariants) {
    await colorButtons.nth(Math.min(1, (await colorButtons.count()) - 1)).click();
  }
  if (hasSizes) {
    await whatsappButton.click();
    await expect(page.locator(".inquiry-notice")).toContainText(/talla/i);
    expect(await page.locator("html").getAttribute("data-whatsapp-test-url")).toBeNull();
    await page.locator(".size-button:not(:disabled)").first().click();
  }

  await page.evaluate(() => {
    window.open = (url?: string | URL) => {
      document.documentElement.dataset.whatsappTestUrl = String(url ?? "");
      return null;
    };
  });
  await whatsappButton.click();

  const whatsappUrl = await page.locator("html").getAttribute("data-whatsapp-test-url");
  expect(whatsappUrl).toMatch(new RegExp(`^https://wa\\.me/${approvedProductionWhatsAppNumber}\\?text=`));
  const url = new URL(whatsappUrl!);
  const message = url.searchParams.get("text") ?? "";
  expect(message).toContain(`Producto: ${productName}`);
  expect(message).toContain(`Precio: ${(await page.locator(".detail-price").textContent())?.trim()} COP`);
  if (hasVariants) expect(message).toContain(`Color: ${await page.locator('.variant-picker button[aria-pressed="true"]').innerText()}`);
  if (hasSizes) expect(message).toContain(`Talla: ${await page.locator(".size-button[aria-pressed='true']").innerText()}`);
  expect(message).toContain("Me gustaría recibir más información");
});

test("core routes load without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const path of [
    "/",
    "/catalogo",
    "/nosotros",
    "/contacto",
    "/terminos-y-condiciones",
    "/politica-de-tratamiento-de-datos-personales",
    "/politica-de-envios-y-entregas",
    "/politica-de-cambios-devoluciones-y-garantias",
    "/politica-de-cookies",
    "/admin/login",
  ]) await page.goto(path);
  expect(errors).toEqual([]);
});

test("brand fonts resolve to their configured families and load their WOFF2 files", async ({ page }) => {
  const fontResponses: number[] = [];
  page.on("response", (response) => {
    if (/_next\/static\/media\/.*\.woff2(?:\?|$)/i.test(response.url())) fontResponses.push(response.status());
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const fontState = await page.evaluate(() => {
    const family = (selector: string) => getComputedStyle(document.querySelector(selector)!).fontFamily;
    const variables = getComputedStyle(document.documentElement);
    const faces = [...document.fonts];
    return {
      displayVariable: variables.getPropertyValue("--font-display").trim(),
      condensedVariable: variables.getPropertyValue("--font-condensed").trim(),
      bodyVariable: variables.getPropertyValue("--font-body").trim(),
      heroDisplay: family(".hero-wordmark-be"),
      heroHeading: family(".hero-wordmark-different"),
      collectionHeading: family(".collection-editorial-meta h3"),
      bodyText: family(".hero-bottom p"),
      checks: {
        karantina: document.fonts.check('700 100px "Karantina"'),
        leagueGothic: document.fonts.check('400 40px "League Gothic"'),
        inter300: document.fonts.check('300 16px "Inter"'),
        inter500: document.fonts.check('500 16px "Inter"'),
      },
      loadedFaces: faces.filter((face) => face.status === "loaded").map((face) => `${face.family}:${face.weight}`),
    };
  });

  expect(fontState.displayVariable).toContain("Karantina");
  expect(fontState.condensedVariable).toContain("League Gothic");
  expect(fontState.bodyVariable).toContain("Inter");
  expect(fontState.heroDisplay).toMatch(/^Karantina,/);
  expect(fontState.heroHeading).toMatch(/^"League Gothic",/);
  expect(fontState.collectionHeading).toMatch(/^"League Gothic",/);
  expect(fontState.bodyText).toMatch(/^Inter,/);
  expect(fontState.checks).toEqual({
    karantina: true,
    leagueGothic: true,
    inter300: true,
    inter500: true,
  });
  expect(fontState.loadedFaces).toContain("Karantina:700");
  expect(fontState.loadedFaces).toContain("League Gothic:400");
  expect(fontState.loadedFaces).toContain("Inter:300");
  expect(fontState.loadedFaces).toContain("Inter:500");
  expect(fontResponses.length).toBeGreaterThanOrEqual(3);
  expect(fontResponses.every((status) => status === 200)).toBe(true);
});

test("philosophy brand images load without cropping or color filters", async ({ page }) => {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/nosotros");

    const images = page.locator(".philosophy-origin-image img, .philosophy-photo img");
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => (element as HTMLImageElement).decode());
      const state = await image.evaluate((element) => {
        const imageElement = element as HTMLImageElement;
        const style = getComputedStyle(imageElement);
        return {
          naturalWidth: imageElement.naturalWidth,
          naturalHeight: imageElement.naturalHeight,
          objectFit: style.objectFit,
          filter: style.filter,
        };
      });
      expect(state.naturalWidth).toBeGreaterThan(0);
      expect(state.naturalHeight).toBeGreaterThan(0);
      expect(state.naturalWidth / state.naturalHeight).toBeCloseTo(1.5, 1);
      expect(state.objectFit).toBe("contain");
      expect(state.filter).toBe("none");
    }
  }
});

test("collection image labels do not overlap the editorial index", async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overlaps = await page.locator(".collection-editorial-image").evaluateAll((cards) => cards.map((card) => {
      const index = card.querySelector(".collection-image-number")!.getBoundingClientRect();
      return [...card.querySelectorAll(".collection-image-side > span")].some((label) => {
        const rect = label.getBoundingClientRect();
        return index.left < rect.right && index.right > rect.left && index.top < rect.bottom && index.bottom > rect.top;
      });
    }));
    expect(overlaps, `collection labels overlap at ${width}px`).toEqual([false, false]);
  }
});

test("admin login uses an ink canvas and light, readable fields", async ({ page }) => {
  await page.goto("/admin/login");
  const colors = await page.evaluate(() => {
    const shell = getComputedStyle(document.querySelector(".admin-login-shell")!);
    const input = getComputedStyle(document.querySelector(".admin-form input")!);
    const label = getComputedStyle(document.querySelector(".admin-form label")!);
    return { background: shell.backgroundColor, fieldBackground: input.backgroundColor, fieldText: input.color, label: label.color };
  });
  expect(colors).toEqual({
    background: "rgb(10, 10, 10)",
    fieldBackground: "rgb(246, 244, 239)",
    fieldText: "rgb(10, 10, 10)",
    label: "rgb(201, 188, 166)",
  });
});

test("legal pages keep the introduction separate from pending final copy", async ({ page }) => {
  const pages = [
    ["/terminos-y-condiciones", "Términos y condiciones"],
    ["/politica-de-tratamiento-de-datos-personales", "Política de tratamiento de datos personales"],
    ["/politica-de-envios-y-entregas", "Política de envíos y entregas"],
    ["/politica-de-cambios-devoluciones-y-garantias", "Política de cambios, devoluciones y garantías"],
    ["/politica-de-cookies", "Política de cookies"],
  ] as const;

  for (const [path, title] of pages) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("CONTENIDO EN PREPARACIÓN")).toBeVisible();
  }
});

test("philosophy and legal routes fit phone, tablet, and desktop widths", async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/nosotros", "/politica-de-cookies"]) {
      await page.goto(path);
      const dimensions = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(dimensions.documentWidth, `${path} overflows at ${width}px`).toBeLessThanOrEqual(dimensions.viewportWidth);
    }
  }
});

test("catalog search is available with published products or the empty state", async ({ page }) => {
  await page.goto("/catalogo");
  await expect(page.getByRole("searchbox", { name: "Buscar por nombre" })).toBeVisible();
  if (await page.locator(".product-card").count()) {
    await expect(page.locator(".product-card").first()).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "No hay productos publicados." })).toBeVisible();
  }
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
  await page.getByRole("link", { name: "Oversized", exact: true }).click();
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
