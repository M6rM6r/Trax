import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("login page renders with RTL Arabic", async ({ page }) => {
    await page.goto("/ar/login");
    await expect(page.locator("h1")).toContainText("تسجيل الدخول");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("role selector switches between boss and employee", async ({ page }) => {
    await page.goto("/ar/login");
    const bossBtn = page.locator("button", { hasText: "مدير" });
    const employeeBtn = page.locator("button", { hasText: "موظف" });
    await employeeBtn.click();
    await expect(page.locator('input[type="email"]')).toHaveValue("employee@trax.com");
    await bossBtn.click();
    await expect(page.locator('input[type="email"]')).toHaveValue("boss@trax.com");
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/ar/login");
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute("type", "password");
    const toggleBtn = page.locator('button[aria-label*="إظهار"]');
    await toggleBtn.click();
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/ar/login");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/ar", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/ar$/);
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ar/login");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/ar", { timeout: 10_000 });
  });

  test("dashboard renders stat cards", async ({ page }) => {
    await expect(
      page
        .locator("text=إجمالي الموظفين")
        .or(page.locator("text=الحضور اليوم"))
        .or(page.locator("[data-testid='stat-card']").first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test("command palette opens with Ctrl+K", async ({ page }) => {
    await page.keyboard.press("Control+k");
    await expect(page.locator('input[placeholder*="ابحث"]')).toBeVisible({ timeout: 5_000 });
  });

  test("mobile bottom nav is visible on mobile viewport", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only test");
    await expect(page.locator('nav[aria-label="التنقل السفلي"]')).toBeVisible();
  });
});
