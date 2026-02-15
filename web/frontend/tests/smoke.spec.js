import { test, expect } from '@playwright/test';

test.describe('SoapBuddy Landing Page', () => {
  test('landing page loads and shows hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SoapBuddy|Soap/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('FAQ accordion toggles open and closed', async ({ page }) => {
    await page.goto('/');
    // Scroll to FAQ section
    await page.locator('#faq').scrollIntoViewIfNeeded();
    // Find first FAQ question button
    const firstFaq = page.locator('.landing-faq-question').first();
    await firstFaq.click();
    // Answer should now be visible
    await expect(page.locator('.landing-faq-answer').first()).toBeVisible();
    // Click again to close
    await firstFaq.click();
    await expect(page.locator('.landing-faq-answer').first()).not.toBeVisible();
  });

  test('pricing section shows 3 plans', async ({ page }) => {
    await page.goto('/');
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    const planCards = page.locator('.landing-plan-card');
    await expect(planCards).toHaveCount(3);
  });

  test('pricing paid plans show 14-day trial note', async ({ page }) => {
    await page.goto('/');
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    const trialNotes = page.locator('.landing-plan-trial');
    // Should have 2 trial notes (Maker + Manufacturer plans)
    await expect(trialNotes).toHaveCount(2);
  });

  test('Sign In button navigates to auth page', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Sign In")').first().click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('Get Started button navigates to sign up', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Get Started Free")').first().click();
    await expect(page).toHaveURL(/\/auth/);
  });
});
