import { test, expect } from '@playwright/test';

test.describe('DesignX App', () => {
  test('should load the authentication page', async ({ page }) => {
    await page.goto('/auth');

    // Check for DesignX branding
    await expect(page.getByText('DesignX')).toBeVisible();

    // Check for sign in form elements
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/auth');

    // Initially on sign in
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Click to switch to sign up
    await page.getByText(/don't have an account/i).click();

    // Now should show sign up button
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();

    // Switch back
    await page.getByText(/already have an account/i).click();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should have remember me checkbox on auth page', async ({ page }) => {
    await page.goto('/auth');

    // Check for remember me checkbox
    const rememberMeCheckbox = page.getByLabel('Remember me');
    await expect(rememberMeCheckbox).toBeVisible();

    // Checkbox should be checked by default
    await expect(rememberMeCheckbox).toBeChecked();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should be mobile-friendly on auth page', async ({ page, isMobile }) => {
    await page.goto('/auth');

    // Check that content is visible
    await expect(page.getByText('DesignX')).toBeVisible();

    // Form should be visible
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Take a screenshot on mobile
    if (isMobile) {
      await page.screenshot({ path: 'tests/screenshots/auth-mobile.png', fullPage: true });
    }
  });
});
