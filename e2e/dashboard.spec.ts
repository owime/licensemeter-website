import { expect, test } from "@playwright/test";

test("sample dashboard exposes the action-first overview and renewal calendar", async ({
  page,
}) => {
  // Next's dev server canonicalizes form redirects to localhost. Starting on
  // that host keeps the demo session cookie on the same origin.
  await page.goto("http://localhost:3100/");
  await page
    .getByRole("button", { name: "Open the sample tenant" })
    .first()
    .click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Overview" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", {
        name: "Verified savings (30d): show how this is calculated",
      })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Next best actions" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Renewals" }).first().click();
  await expect(page).toHaveURL(/\/app\/renewals$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Renewals" }),
  ).toBeVisible();
  await expect(
    page.getByText("No contract renewals recorded yet."),
  ).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
