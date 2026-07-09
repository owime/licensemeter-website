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
});

test("pricing interval is keyboard-accessible and updates its state", async ({
  page,
}) => {
  await page.goto("/pricing");

  const monthly = page.getByRole("button", { name: "Monthly" });
  const annual = page.getByRole("button", { name: /Annual/ });
  await expect(monthly).toHaveAttribute("aria-pressed", "true");
  await annual.focus();
  await page.keyboard.press("Enter");
  await expect(annual).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/billed annually/).first()).toBeVisible();
});

test("feature tabs support arrow keys and the modal restores focus", async ({
  page,
}) => {
  await page.goto("/");

  const tabs = page.getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");

  const trigger = page.getByRole("button", {
    name: /Enlarge demo: Act on findings in bulk/,
  });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close video" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("ROI calculator responds to user assumptions", async ({ page }) => {
  await page.goto("/roi");

  const output = page.getByText(/estimated monthly waste/);
  const before = await output.textContent();
  await page.getByLabel("Paid seats").fill("500");
  await expect(output).not.toHaveText(before ?? "");
  await expect(page.getByText(/At 500 seats/)).toBeVisible();
});
