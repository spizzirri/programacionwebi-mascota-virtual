import { test, expect } from '@playwright/test';

test('debug streak', async ({ page }) => {
    await page.goto('/');
    await page.fill('#login-email', 'estudiante@gmail.com');
    await page.fill('#login-password', '123456');
    await page.click('#login-button');
    await expect(page.locator('#game-page')).toBeVisible({ timeout: 10000 });

    const streakInfo = await page.evaluate(() => {
        const el = document.querySelector('.streak-number');
        return {
            textContent: el?.textContent,
            innerHTML: el?.innerHTML,
            tagName: el?.tagName,
        };
    });
    console.log('streakInfo:', JSON.stringify(streakInfo));

    const locatorText = await page.locator('.streak-number').textContent();
    console.log('locatorText:', JSON.stringify(locatorText));
});
