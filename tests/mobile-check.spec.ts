import { test, expect } from '@playwright/test';

test.describe('Mobile Layout Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('Auth page - mobile view', async ({ page }) => {
    await page.goto('/auth');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take full page screenshot
    await page.screenshot({
      path: 'tests/screenshots/mobile-auth.png',
      fullPage: true
    });

    // Check if elements are visible
    const title = page.getByText('DesignX').first();
    await expect(title).toBeVisible();

    // Check if form is visible
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Browse page - mobile swipe view', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/mobile-browse.png',
      fullPage: true
    });

    // Check header
    const header = page.getByText('DesignX').first();
    await expect(header).toBeVisible();
  });

  test('Check viewport overflow', async ({ page }) => {
    await page.goto('/auth');

    // Check if there's horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    console.log(`Body width: ${bodyWidth}px, Viewport width: ${viewportWidth}px`);

    // Body should not be wider than viewport (no horizontal scroll)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('Test all major pages for mobile', async ({ page }) => {
    const pages = [
      { url: '/auth', name: 'auth' },
      { url: '/', name: 'browse' },
    ];

    for (const testPage of pages) {
      await page.goto(testPage.url);
      await page.waitForLoadState('networkidle');

      // Screenshot
      await page.screenshot({
        path: `tests/screenshots/mobile-${testPage.name}-full.png`,
        fullPage: true
      });

      // Check for overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      console.log(`${testPage.name} page overflow: ${hasOverflow}`);
    }
  });
});
