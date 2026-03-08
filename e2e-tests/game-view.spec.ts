import { test, expect, Page } from '@playwright/test';
import { MongoClient } from 'mongodb';

async function login(page: Page, email: string, password: string) {
    await page.goto('/');
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('#login-button');
    await expect(page.locator('#game-page')).toBeVisible({ timeout: 10000 });
}

async function logout(page: Page) {
    await page.click('#logout-btn');
    await expect(page.locator('#auth-page')).toBeVisible({ timeout: 5000 });
}

async function answerQuestion(page: Page, answer: string) {
    await expect(page.locator('#question-text')).not.toHaveText('Cargando pregunta...', { timeout: 8000 });
    await page.fill('#answer-input', answer);
    await page.click('#submit-answer-btn');
    await expect(page.locator('#feedback-section')).not.toHaveClass(/hidden/, { timeout: 10000 });
}

async function getStreak(page: Page): Promise<string> {
    return (await page.locator('.streak-number').textContent()) ?? '0';
}

async function cleanDatabase() {
    const client = new MongoClient('mongodb://localhost:27018');

    await client.connect();
    const db = client.db('tamagotchi_e2e');

    await db.collection('users').updateOne(
        { email: 'estudiante@gmail.com' },
        {
            $set: {
                streak: 0,
                currentQuestionId: null,
                lastQuestionAssignedAt: null,
                lastQuestionAnsweredCorrectly: null,
                currentQuestionText: null
            }
        }
    );

    await db.collection('users').updateOne(
        { email: 'admin@gmail.com' },
        {
            $set: {
                streak: 0,
                currentQuestionId: null,
                lastQuestionAssignedAt: null,
                lastQuestionAnsweredCorrectly: null,
                currentQuestionText: null
            }
        }
    );

    await db.collection('answers').deleteMany({});
    await db.collection('appeals').deleteMany({});
}

test.describe('game-view', () => {

    test.beforeEach(async () => {
        await cleanDatabase();
    });

    test.describe('estudiante responde', () => {

        test('[wiremock 001] debería mostrar racha de 1 cuando el estudiante responde correctamente y no puede volver a responder', async ({ page }) => {
            await login(page, 'estudiante@gmail.com', '123456');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta buena');

            expect(await getStreak(page)).toBe('1');

            await page.reload();

            await expect(page.locator('#question-text')).toHaveText('Ya has respondido la pregunta del día, vuelve mañana', { timeout: 10000 });

            await logout(page);
        });

        test('[wiremock 003] debería mostrar racha de 0.5 cuando el estudiante responde parcialmente y no puede volver a responder', async ({ page }) => {
            await login(page, 'estudiante@gmail.com', '123456');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta parcial');

            expect(await getStreak(page)).toBe('0.5');

            await page.reload();

            await expect(page.locator('#question-text')).toHaveText('Ya has respondido la pregunta del día, vuelve mañana', { timeout: 10000 });

            await logout(page);
        });
    })

    test.describe('estudiante apela', () => {

        test('[wiremock 001] debería permitir apelar una respuesta incorrecta y que el profesor la acepte actualizando la racha del estudiante', async ({ page }) => {
            await login(page, 'estudiante@gmail.com', '123456');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta mala');

            expect(await getStreak(page)).toBe('0');

            await page.click('#appeal-btn');
            await expect(page.locator('#appeal-btn')).toHaveText('Revision Solicitada', { timeout: 5000 });

            await page.goto('/my-appeals');
            await expect(page.locator('#my-appeals-page')).toBeVisible({ timeout: 5000 });
            await expect(page.locator('#appeals-table-body tr')).toHaveCount(1, { timeout: 5000 });
            await expect(page.locator('#appeals-table-body .pending')).toBeVisible();

            await logout(page);

            await login(page, 'admin@gmail.com', '123456');

            await page.goto('/admin-appeals');
            await expect(page.locator('#admin-appeals-page')).toBeVisible({ timeout: 5000 });
            await expect(page.locator('#admin-appeals-table-body tr')).toHaveCount(1, { timeout: 5000 });

            await page.click('.view-appeal-btn');
            await expect(page.locator('#appeal-modal')).not.toHaveClass(/hidden/, { timeout: 5000 });

            await page.fill('#professor-feedback', 'La respuesta es correcta, acepto la apelación.');
            await page.click('#accept-appeal-btn');

            await expect(page.locator('.alert-modal-container .alert-modal-content p')).toHaveText('Apelación aceptada correctamente.', { timeout: 5000 });
            await page.click('.alert-modal-container .alert-modal-content .btn-primary');

            await expect(page.locator('#appeal-modal')).toHaveClass(/hidden/, { timeout: 5000 });
            await expect(page.locator('#admin-appeals-table-body .accepted')).toBeVisible({ timeout: 5000 });

            await logout(page);

            await login(page, 'estudiante@gmail.com', '123456');
            expect(await getStreak(page)).toBe('1');

            await page.goto('/my-appeals');
            await expect(page.locator('#appeals-table-body .accepted')).toBeVisible({ timeout: 5000 });

            await logout(page);
        });

        test('[wiremock 002] debería permitir apelar una respuesta incorrecta y que el profesor la rechace manteniendo la racha en 0', async ({ page }) => {
            await login(page, 'estudiante@gmail.com', '123456');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta mala');

            expect(await getStreak(page)).toBe('0');

            await page.click('#appeal-btn');
            await expect(page.locator('#appeal-btn')).toHaveText('Revision Solicitada', { timeout: 5000 });

            await page.goto('/my-appeals');
            await expect(page.locator('#appeals-table-body tr')).toHaveCount(1, { timeout: 5000 });

            await logout(page);

            await login(page, 'admin@gmail.com', '123456');

            await page.goto('/admin-appeals');
            await expect(page.locator('#admin-appeals-table-body tr')).toHaveCount(1, { timeout: 5000 });

            await page.click('.view-appeal-btn');
            await expect(page.locator('#appeal-modal')).not.toHaveClass(/hidden/, { timeout: 5000 });

            await page.fill('#professor-feedback', 'La respuesta es incorrecta, rechazo la apelación.');
            await page.click('#reject-appeal-btn');

            await expect(page.locator('.alert-modal-container .alert-modal-content p')).toHaveText('Apelación rechazada correctamente.', { timeout: 5000 });
            await page.click('.alert-modal-container .alert-modal-content .btn-primary');

            await expect(page.locator('#appeal-modal')).toHaveClass(/hidden/, { timeout: 5000 });
            await expect(page.locator('#admin-appeals-table-body .rejected')).toBeVisible({ timeout: 5000 });

            await logout(page);

            await login(page, 'estudiante@gmail.com', '123456');
            expect(await getStreak(page)).toBe('0');

            await page.goto('/my-appeals');
            await expect(page.locator('#appeals-table-body .rejected')).toBeVisible({ timeout: 5000 });

            await logout(page);
        });
    })

    test.describe('profesor responde', () => {
        test('[wiremock 001] [wiremock 002] [wiremock 003] debería permitir que un profesor responda varias preguntas alternando entre bien, mal y regular y acumulando racha. Al responder mal la racha vuelve a cero', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta buena');

            expect(await getStreak(page)).toBe('1');

            await page.click('#next-question-btn');

            await answerQuestion(page, 'Mi respuesta parcial');

            expect(await getStreak(page)).toBe('1.5');

            await page.click('#next-question-btn');

            await answerQuestion(page, 'Mi respuesta buena');

            expect(await getStreak(page)).toBe('2.5');

            await page.click('#next-question-btn');

            await answerQuestion(page, 'Mi respuesta mala');

            expect(await getStreak(page)).toBe('0');

        });
    })
})