import { expect, test } from "@playwright/test";

test("home page fits a mobile viewport and menu closes with Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  const menuButton = page.getByRole("button", { name: "Open menu" });
  await menuButton.click();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");

  await page.setViewportSize({ width: 320, height: 568 });
  const narrowLayout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    headerHeight: document.querySelector("header")?.getBoundingClientRect()
      .height,
  }));
  expect(narrowLayout.overflow).toBeLessThanOrEqual(1);
  expect(narrowLayout.headerHeight).toBeLessThanOrEqual(90);
});

test("home metadata and conversion labels describe the product consistently", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    "Microsoft 365 License Optimization Software | LicenseMeter",
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "SaaS licenses nobody uses",
  );
  await expect(
    page.getByRole("link", { name: "Run my free scan" }),
  ).toHaveCount(2);

  const openGraphUrl = await page
    .locator('meta[property="og:url"]')
    .getAttribute("content");
  expect(openGraphUrl).toMatch(/^https?:\/\//);
});

test("pricing pages and references are removed", async ({ page }) => {
  for (const path of ["/", "/msp", "/de/security"]) {
    await page.goto(path);
    await expect(page.locator('a[href*="pricing"]')).toHaveCount(0);
    await expect(page.locator("#pricing")).toHaveCount(0);
  }
  const removed = await page.request.get("/pricing");
  expect(removed.status()).toBe(404);
  for (const path of ["/sitemap.xml", "/llms.txt"]) {
    const response = await page.request.get(path);
    expect(response.ok()).toBe(true);
    expect(await response.text()).not.toContain("/pricing");
  }
});

test("feature tabs support arrow keys and the modal restores focus", async ({
  page,
}) => {
  const initialMediaRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/videos/")) {
      initialMediaRequests.push(request.url());
    }
  });
  await page.goto("/");
  await page.waitForTimeout(500);
  expect(initialMediaRequests).toEqual([]);

  const tabs = page.getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");

  const activeVideo = page.locator("#feature-panel video");
  await expect(activeVideo).toHaveCount(1);
  await expect(activeVideo).toHaveAttribute(
    "poster",
    "/videos/feature-findings.webp",
  );
  await expect(activeVideo).not.toHaveAttribute("autoplay", "");

  const trigger = page.getByRole("button", {
    name: /Product demo.*Enlarge: Act on findings in bulk/,
  });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close video" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("product tour honors reduced motion before media playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#product-tour").scrollIntoViewIfNeeded();

  const video = page.locator("#feature-panel video");
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute("controls", "");
  await expect(
    page.getByRole("button", { name: "Pause rotation" }),
  ).toHaveCount(0);
  const paused = await video.evaluate(
    (element) => (element as HTMLVideoElement).paused,
  );
  expect(paused).toBe(true);
});

test("ROI calculator responds to user assumptions", async ({ page }) => {
  await page.goto("/roi");

  const output = page.getByText(/estimated monthly waste/);
  const before = await output.textContent();
  await page.getByLabel("Paid seats").fill("500");
  await expect(output).not.toHaveText(before ?? "");
  await expect(
    page.getByText(/LicenseMeter is free at every seat count/),
  ).toBeVisible();
});

test("German trust pages localize the shell and document language", async ({
  page,
}) => {
  await page.goto("/de/security");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(
    page.getByRole("navigation", { name: "Hauptnavigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Kostenlos starten" }),
  ).toBeVisible();
  await expect(
    page.getByText("In der EU gehostet", { exact: true }),
  ).toBeVisible();
});

test("connector index ends with a clear next step", async ({ page }) => {
  await page.goto("/connectors");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Connect what",
  );
  await expect(
    page.getByRole("link", { name: "Start Free", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Review Security" }),
  ).toBeVisible();
});
