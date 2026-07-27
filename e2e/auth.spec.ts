import { test, expect } from "@playwright/test";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;
const hasE2ECredentials = Boolean(e2eEmail && e2ePassword);

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/ar/login");
  await page.locator('input[name="identifier"]').fill(e2eEmail!);
  await page.locator('input[name="password"]').fill(e2ePassword!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/ar", { timeout: 10_000 });
}

test.describe("Authentication Flow", () => {
  test("login page renders with RTL Arabic", async ({ page }) => {
    await page.goto("/ar/login");
    await expect(page.locator("h1")).toContainText("تسجيل الدخول");
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("login has unified identifier field", async ({ page }) => {
    await page.goto("/ar/login");
    await expect(page.locator('input[name="identifier"]')).toHaveAttribute(
      "placeholder",
      "email@trax.com"
    );
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/ar/login");
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute("type", "password");
    const toggleBtn = page.locator('button[aria-label="Show password"]');
    await toggleBtn.click();
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test("login validates required credentials", async ({ page }) => {
    await page.goto("/ar/login");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/ar\/login$/);
    await expect(page.getByText("البريد الإلكتروني مطلوب")).toBeVisible();
    await expect(page.getByText("كلمة المرور مطلوبة")).toBeVisible();
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    test.skip(
      !hasE2ECredentials,
      "Set E2E_EMAIL and E2E_PASSWORD to run authenticated browser tests."
    );
    await signIn(page);
    await expect(page).toHaveURL(/\/ar$/);
  });
});

test.describe("Dashboard", () => {
  test.skip(
    !hasE2ECredentials,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated browser tests."
  );

  test.beforeEach(async ({ page }) => {
    await signIn(page);
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
