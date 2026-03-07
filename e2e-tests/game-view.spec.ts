import { test, expect, Page } from '@playwright/test';

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

test.describe('game-view', () => {

    test.beforeEach(async ({ request }) => {
        const usersResponse = await request.get('http://localhost:3000/users', {
            headers: { 'x-api-key': 'e2e-secret-key' }
        });
        const { users } = await usersResponse.json();
        const student = users.find((u: any) => u.email === 'estudiante@gmail.com');
        console.log(student);
        if (student) {
            await request.patch(`http://localhost:3000/users/${student._id}`, {
                headers: { 'x-api-key': 'e2e-secret-key' },
                data: {
                    streak: 0,
                    currentQuestionId: null,
                    lastQuestionAssignedAt: null,
                    lastQuestionAnsweredCorrectly: null,
                    currentQuestionText: null
                }
            });
        }

        const usersResponse2 = await request.get('http://localhost:3000/users', {
            headers: { 'x-api-key': 'e2e-secret-key' }
        });
        const { users: users2 } = await usersResponse2.json();
        const professor = users2.find((u: any) => u.email === 'estudiante@gmail.com');
        console.log(professor);
    })


    test.only('debería mostrar racha de 1 cuando el estudiante responde correctamente y no puede volver a responder', async ({ page }) => {
        await login(page, 'estudiante@gmail.com', '123456');

        expect(await getStreak(page)).toBe('0');

        await answerQuestion(page, 'Mi respuesta');

        expect(await getStreak(page)).toBe('1');

        await page.reload();

        await expect(page.locator('#question-text')).toHaveText('Ya has respondido la pregunta del día, vuelve mañana', { timeout: 10000 });
    });

    test('debería permitir apelar una respuesta incorrecta y que el profesor la acepte actualizando la racha del estudiante', async ({ page }) => {
        await login(page, 'estudiante@gmail.com', '123456');

        expect(await getStreak(page)).toBe('0');

        await answerQuestion(page, 'Mi respuesta');

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

        await expect(page.locator('#appeal-modal')).toHaveClass(/hidden/, { timeout: 5000 });
        await expect(page.locator('#admin-appeals-table-body .accepted')).toBeVisible({ timeout: 5000 });

        await logout(page);

        await login(page, 'estudiante@gmail.com', '123456');
        expect(await getStreak(page)).toBe('1');

        await page.goto('/my-appeals');
        await expect(page.locator('#appeals-table-body .accepted')).toBeVisible({ timeout: 5000 });
    });

    test('debería permitir apelar una respuesta incorrecta y que el profesor la rechace manteniendo la racha en 0', async ({ page }) => {
        await login(page, 'estudiante@gmail.com', '123456');

        expect(await getStreak(page)).toBe('0');

        await answerQuestion(page, 'Mi respuesta');

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

        await expect(page.locator('#appeal-modal')).toHaveClass(/hidden/, { timeout: 5000 });
        await expect(page.locator('#admin-appeals-table-body .rejected')).toBeVisible({ timeout: 5000 });

        await logout(page);

        await login(page, 'estudiante@gmail.com', '123456');
        expect(await getStreak(page)).toBe('0');

        await page.goto('/my-appeals');
        await expect(page.locator('#appeals-table-body .rejected')).toBeVisible({ timeout: 5000 });
    });

    test('debería permitir que un profesor responda varias preguntas acumulando racha', async ({ page }) => {
        await login(page, 'admin@gmail.com', '123456');

        expect(await getStreak(page)).toBe('0');

        await answerQuestion(page, 'Mi primera respuesta');

        expect(await getStreak(page)).toBe('1');

        await page.click('#next-question-btn');

        await answerQuestion(page, 'Mi segunda respuesta');

        expect(await getStreak(page)).toBe('2');
    });
})