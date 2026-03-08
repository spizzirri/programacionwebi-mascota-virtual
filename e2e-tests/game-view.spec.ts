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

    await db.collection('questions').deleteMany({})
    await db.collection('topic').deleteMany({})
    await db.collection('questions').insertMany([
        {
            text: "¿Qué es el DOM?",
            topic: "html_semantico",
        },
        {
            text: "¿Por qué deberíamos usar const y let en lugar de var en JavaScript moderno?",
            topic: "javascript"
        },
        {
            text: "¿Por qué es importante entender el modelo de caja (box model) en CSS?",
            topic: "css_modelo_caja"
        }
    ]);
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

    test.describe('estudiante navega al perfil', () => {
        test('[wiremock 001] estudiante navega al perfil y ve el historial de sus preguntas mostrando la respuesta dada y la fecha en la que la respondió y su email en el header', async ({ page }) => {
            await login(page, 'estudiante@gmail.com', '123456');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta buena');

            expect(await getStreak(page)).toBe('1');

            await page.click('#profile-nav-btn');
            await expect(page.locator('#profile-page')).toBeVisible({ timeout: 5000 });
            await expect(page.locator('#profile-email')).toHaveText('estudiante@gmail.com');
            await expect(page.locator('.history-item')).toHaveCount(1, { timeout: 5000 });
            await expect(page.locator('.history-item .history-answer')).toHaveText('Tu respuesta: Mi respuesta buena');
            await expect(page.locator('.history-item .history-rating')).toHaveText('Correcta');

            await expect(page.locator('.history-item .history-timestamp')).toHaveText('Hace un momento');

            await page.click('#game-nav-btn');
            await expect(page.locator('#question-text')).toHaveText('Ya has respondido la pregunta del día, vuelve mañana', { timeout: 10000 });
            expect(await getStreak(page)).toBe('1');

            await logout(page);
        })
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

    test.describe('profesor navega al perfil', () => {
        test('[wiremock 001] profesor navega al perfil y ve el historial de sus preguntas mostrando la respuesta dada y la fecha en la que la respondió y su email en el header', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta mala');

            expect(await getStreak(page)).toBe('0');

            await page.click('#profile-nav-btn');
            await expect(page.locator('#profile-page')).toBeVisible({ timeout: 5000 });
            await expect(page.locator('#profile-email')).toHaveText('admin@gmail.com');
            await expect(page.locator('.history-item')).toHaveCount(1, { timeout: 5000 });
            await expect(page.locator('.history-item .history-answer')).toHaveText('Tu respuesta: Mi respuesta mala');
            await expect(page.locator('.history-item .history-rating')).toHaveText('Incorrecta');

            await expect(page.locator('.history-item .history-timestamp')).toHaveText('Hace un momento');

            await page.click('#game-nav-btn');
            await expect(page.locator('#question-text')).toBeVisible();
            expect(await getStreak(page)).toBe('0');

            await logout(page);
        })
    })

    test.describe('profesor administra preguntas', () => {

        test('El profesor navega a la pantalla de administración de preguntas y ve la lista de preguntas actuales. Agrega la pregunta "¿Que es CSS?" con el topico CSS y la guarda. El usuario ahora visualiza "¿Que es CSS?" en la lista de preguntas.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456');

            await page.click('#admin-questions-nav-btn');
            await expect(page.locator('.admin-questions-layout')).toBeVisible({ timeout: 5000 });

            await page.click('#add-question-btn');
            await expect(page.locator('#question-modal')).not.toHaveClass(/hidden/);

            await page.fill('#question-modal #question-text', '¿Que es CSS?');
            await page.fill('#question-modal #question-topic', 'css_modelo_caja');
            await page.click('#question-modal #question-form button[type="submit"]');

            await expect(page.locator('#question-modal')).toHaveClass(/hidden/);
            await expect(page.locator('#questions-table-body')).toContainText('¿Que es CSS?');

            await logout(page);
        });

        test('El profesor elimina la pregunta "¿Por qué deberíamos usar const y let en lugar de var en JavaScript moderno?" y ahora el usuario no visualiza la pregunta en la lista de preguntas.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456');

            await page.click('#admin-questions-nav-btn');
            await expect(page.locator('.admin-questions-layout')).toBeVisible({ timeout: 5000 });

            const textToFind = '¿Por qué deberíamos usar const y let en lugar de var en JavaScript moderno?';
            await expect(page.locator('#questions-table-body')).toContainText(textToFind);

            const row = page.locator('#questions-table-body tr', { hasText: textToFind }).first();
            await row.locator('button', { hasText: '🗑️' }).click();

            await expect(page.locator('#delete-modal')).not.toHaveClass(/hidden/);
            await page.click('#confirm-delete');

            await expect(page.locator('#delete-modal')).toHaveClass(/hidden/);
            await expect(page.locator('#questions-table-body')).not.toContainText(textToFind);

            await logout(page);
        });

        test('El profesor edita la pregunta "¿Qué es el DOM?" y cambia su texto a "¿Qué es el DOMO?" y ahora el usuario visualiza "¿Qué es el DOMO?" en la lista de preguntas y no visualiza "¿Qué es el DOM?".', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456');

            await page.click('#admin-questions-nav-btn');
            await expect(page.locator('.admin-questions-layout')).toBeVisible({ timeout: 5000 });

            const row = page.locator('#questions-table-body tr').filter({ hasText: '¿Qué es el DOM?' });
            // Clickeamos el botón de editar
            await row.locator('button', { hasText: '✏️' }).click();

            await expect(page.locator('#question-modal')).not.toHaveClass(/hidden/);
            await page.fill('#question-modal #question-text', '¿Qué es el DOMO?');
            await page.click('#question-modal #question-form button[type="submit"]');

            await expect(page.locator('#question-modal')).toHaveClass(/hidden/);
            await expect(page.locator('#questions-table-body')).toContainText('¿Qué es el DOMO?');

            // To check it doesn't contain the exact old text, but checking without exact might fail since DOMO contains DOM. Thus we check exact text:
            const allTexts = await page.locator('#questions-table-body td:first-child').allInnerTexts();
            expect(allTexts).not.toContain('¿Qué es el DOM?');

            await logout(page);
        });

        test('El profesor visualiza los topicos "css_modelo_caja", "html_semantico" y "javascript" en la vista y todos estan activos.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456');

            await page.click('#admin-questions-nav-btn');
            await expect(page.locator('.admin-questions-layout')).toBeVisible({ timeout: 5000 });

            await expect(page.locator('#topics-list .topic-item', { hasText: 'css_modelo_caja' })).toBeVisible();
            await expect(page.locator('#topics-list .topic-item', { hasText: 'css_modelo_caja' })).toContainText('Activo');

            await expect(page.locator('#topics-list .topic-item', { hasText: 'html_semantico' })).toBeVisible();
            await expect(page.locator('#topics-list .topic-item', { hasText: 'html_semantico' })).toContainText('Activo');

            await expect(page.locator('#topics-list .topic-item', { hasText: 'javascript' })).toBeVisible();
            await expect(page.locator('#topics-list .topic-item', { hasText: 'javascript' })).toContainText('Activo');

            await logout(page);
        });
    })

    test.describe('profesor administra usuarios', () => {

    })
})