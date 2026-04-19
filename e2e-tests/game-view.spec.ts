import { test, expect, Page } from '@playwright/test';
import { MongoClient } from 'mongodb';

async function login(page: Page, email: string, password: string) {
    await page.goto('/');
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('#login-button');

    // Si es admin o profesor, redirigimos a /admin-users por defecto en el front, 
    // pero los tests suelen esperar estar en la página del juego o al menos haber logueado.
    if (email.includes('admin')) {
        await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 });
        // Si el test continúa con acciones de juego, forzamos navegación a /game
        await page.goto('/game');
        await expect(page.locator('#game-page')).toBeVisible({ timeout: 10000 });
    } else {
        await expect(page.locator('#game-page')).toBeVisible({ timeout: 10000 });
    }
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

    await db.collection('users').deleteMany({});
    const passwordHash = "$2b$12$4QX2.DQYp9RgqiOnSoVI2OuE2y1aK92ZBoOfxoSuizRjNFhsQW6E2";
    await db.collection('users').insertMany([
        {
            email: 'admin@gmail.com',
            password: passwordHash,
            role: 'PROFESSOR',
            streak: 0,
            commission: 'MAÑANA',
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            lastQuestionAnsweredCorrectly: null,
            currentQuestionText: null,
            createdAt: new Date(),
            __v: 0
        },
        {
            email: 'estudiante@gmail.com',
            password: passwordHash,
            role: 'STUDENT',
            streak: 0,
            commission: 'MAÑANA',
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            lastQuestionAnsweredCorrectly: null,
            currentQuestionText: null,
            createdAt: new Date(),
            __v: 0
        },
        {
            email: 'estudiantenoche@gmail.com',
            password: passwordHash,
            role: 'STUDENT',
            streak: 0,
            commission: 'NOCHE',
            currentQuestionId: null,
            lastQuestionAssignedAt: null,
            lastQuestionAnsweredCorrectly: null,
            currentQuestionText: null,
            createdAt: new Date(),
            __v: 0
        }
    ]);

    await db.collection('questions').deleteMany({})
    await db.collection('topics').deleteMany({})
    await db.collection('topics').insertMany([
        { name: "html", enabled: true },
        { name: "javascript", enabled: true },
        { name: "css", enabled: true }
    ]);
    await db.collection('questions').insertMany([
        {
            text: "¿Qué es el DOM?",
            topic: "html",
        },
        {
            text: "¿Por qué deberíamos usar const y let en lugar de var en JavaScript moderno?",
            topic: "javascript"
        },
        {
            text: "¿Por qué es importante entender el modelo de caja (box model) en CSS?",
            topic: "css"
        }
    ]);
    await db.collection('answers').deleteMany({});
    await db.collection('appeals').deleteMany({});
    await client.close();
}

test.describe('game-view', () => {

    test.beforeEach(async () => {
        await cleanDatabase();
    });


    test.describe('usuario se loguea', () => {

        test('el usuario estudiante@gmail se bloquea luego de 3 intentos fallidos de inicio de sesión', async ({ page }) => {
            await page.goto('/');

            for (let i = 0; i < 2; i++) {
                await page.fill('#login-email', 'estudiante@gmail.com');
                await page.fill('#login-password', 'wrong-password');
                await page.click('#login-button');
                await expect(page.locator('#login-error')).toHaveText('usuario o contraseña incorrectos');
            }

            await page.fill('#login-email', 'estudiante@gmail.com');
            await page.fill('#login-password', 'wrong-password');
            await page.click('#login-button');
            await expect(page.locator('#login-error')).toHaveText(/usuario bloqueado por 15 minutos/);

            await page.fill('#login-email', 'estudiante@gmail.com');
            await page.fill('#login-password', '123456789');
            await page.click('#login-button');
            await expect(page.locator('#login-error')).toHaveText(/usuario bloqueado, intente nuevamente en \d+ minutos/);
        });
    });

    test.describe('estudiante responde', () => {

        test('[wiremock 001] debería mostrar racha de 1 cuando el estudiante responde correctamente y no puede volver a responder', async ({ page }) => {
            await login(page, 'estudiante@gmail.com', '123456789');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta buena');

            expect(await getStreak(page)).toBe('1');

            await page.reload();

            await expect(page.locator('#question-text')).toHaveText('Ya has respondido la pregunta del día, vuelve mañana', { timeout: 10000 });

            await logout(page);
        });

        test('[wiremock 003] debería mostrar racha de 0.5 cuando el estudiante responde parcialmente y no puede volver a responder', async ({ page }) => {
            await login(page, 'estudiante@gmail.com', '123456789');

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
            await login(page, 'estudiante@gmail.com', '123456789');

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
            await login(page, 'estudiante@gmail.com', '123456789');

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

            await login(page, 'admin@gmail.com', '123456789');

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

            await login(page, 'estudiante@gmail.com', '123456789');
            expect(await getStreak(page)).toBe('1');

            await page.goto('/my-appeals');
            await expect(page.locator('#appeals-table-body .accepted')).toBeVisible({ timeout: 5000 });

            await logout(page);
        });

        test('[wiremock 002] debería permitir apelar una respuesta incorrecta y que el profesor la rechace manteniendo la racha en 0', async ({ page }) => {
            await login(page, 'estudiante@gmail.com', '123456789');

            expect(await getStreak(page)).toBe('0');

            await answerQuestion(page, 'Mi respuesta mala');

            expect(await getStreak(page)).toBe('0');

            await page.click('#appeal-btn');
            await expect(page.locator('#appeal-btn')).toHaveText('Revision Solicitada', { timeout: 5000 });

            await page.goto('/my-appeals');
            await expect(page.locator('#appeals-table-body tr')).toHaveCount(1, { timeout: 5000 });

            await logout(page);

            await login(page, 'admin@gmail.com', '123456789');

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

            await login(page, 'estudiante@gmail.com', '123456789');
            expect(await getStreak(page)).toBe('0');

            await page.goto('/my-appeals');
            await expect(page.locator('#appeals-table-body .rejected')).toBeVisible({ timeout: 5000 });

            await logout(page);
        });
    })

    test.describe('profesor responde', () => {
        test('[wiremock 001] [wiremock 002] [wiremock 003] debería permitir que un profesor responda varias preguntas alternando entre bien, mal y regular y acumulando racha. Al responder mal la racha vuelve a cero', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

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
            await login(page, 'admin@gmail.com', '123456789');

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
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-questions-nav-btn');
            await expect(page.locator('.admin-questions-layout')).toBeVisible({ timeout: 5000 });

            await page.click('#add-question-btn');
            await expect(page.locator('#question-modal')).not.toHaveClass(/hidden/);

            await page.fill('#question-modal #question-text', '¿Que es CSS?');
            await page.fill('#question-modal #question-topic', 'css');
            await page.click('#question-modal #question-form button[type="submit"]');

            await expect(page.locator('#question-modal')).toHaveClass(/hidden/);
            await expect(page.locator('#questions-table-body')).toContainText('¿Que es CSS?');

            await logout(page);
        });

        test('El profesor elimina la pregunta "¿Por qué deberíamos usar const y let en lugar de var en JavaScript moderno?" y ahora el usuario no visualiza la pregunta en la lista de preguntas.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

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
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-questions-nav-btn');
            await expect(page.locator('.admin-questions-layout')).toBeVisible({ timeout: 5000 });

            const row = page.locator('#questions-table-body tr').filter({ hasText: '¿Qué es el DOM?' });
            await row.locator('button', { hasText: '✏️' }).click();

            await expect(page.locator('#question-modal')).not.toHaveClass(/hidden/);
            await page.fill('#question-modal #question-text', '¿Qué es el DOMO?');
            await page.click('#question-modal #question-form button[type="submit"]');

            await expect(page.locator('#question-modal')).toHaveClass(/hidden/);
            await expect(page.locator('#questions-table-body')).toContainText('¿Qué es el DOMO?');

            const allTexts = await page.locator('#questions-table-body td:first-child').allInnerTexts();
            expect(allTexts).not.toContain('¿Qué es el DOM?');

            await logout(page);
        });

        test('El profesor visualiza los topicos "css", "html" y "javascript" en la vista y todos estan activos.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-questions-nav-btn');
            await expect(page.locator('.admin-questions-layout')).toBeVisible({ timeout: 5000 });

            await expect(page.locator('#topics-list .topic-item', { hasText: 'css' })).toBeVisible();
            await expect(page.locator('#topics-list .topic-item', { hasText: 'css' })).toContainText('Activo');

            await expect(page.locator('#topics-list .topic-item', { hasText: 'html' })).toBeVisible();
            await expect(page.locator('#topics-list .topic-item', { hasText: 'html' })).toContainText('Activo');

            await expect(page.locator('#topics-list .topic-item', { hasText: 'javascript' })).toBeVisible();
            await expect(page.locator('#topics-list .topic-item', { hasText: 'javascript' })).toContainText('Activo');

            await logout(page);
        });
    });

    test.describe('profesor administra usuarios', () => {

        test('El profesor navega a administracion de usuario y visualiza estudiante@gmail.com, estudiantenoche@gmail.com y admin@gmail.com. Ve las columnas "Email, Rol, Racha, Comisión, Pregunta Actual, Fecha Asignación y Acciones". Acciones tiene tres botones, uno para ver el perfil, otro para editar y otro para eliminar.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-nav-btn');
            await expect(page.locator('.profile-container')).toBeVisible({ timeout: 5000 });

            await expect(page.locator('.admin-table thead th').nth(0)).toHaveText(/Email/);
            await expect(page.locator('.admin-table thead th').nth(1)).toHaveText('Rol');
            await expect(page.locator('.admin-table thead th').nth(2)).toHaveText(/Racha/);
            await expect(page.locator('.admin-table thead th').nth(3)).toHaveText('Comisión');
            await expect(page.locator('.admin-table thead th').nth(4)).toHaveText('Pregunta Actual');
            await expect(page.locator('.admin-table thead th').nth(5)).toHaveText('Fecha Asignación');
            await expect(page.locator('.admin-table thead th').nth(6)).toHaveText('Acciones');

            const rowStudent = page.locator('#users-table-body tr').filter({ hasText: 'estudiante@gmail.com' });
            await expect(rowStudent).toBeVisible();
            await expect(rowStudent.locator('button', { hasText: '👤' })).toBeVisible();
            await expect(rowStudent.locator('button', { hasText: '✏️' })).toBeVisible();
            await expect(rowStudent.locator('button', { hasText: '🗑️' })).toBeVisible();

            const rowAdmin = page.locator('#users-table-body tr').filter({ hasText: 'admin@gmail.com' });
            await expect(rowAdmin).toBeVisible();

            await logout(page);
        });

        test('El profesor navega a administracion de usuario, agrega un nuevo usuario (estudiante2@gmail.com con password 123456 y rol estudiante y comision NOCHE) y verifica que este en la tabla. Se desloguea e intenta loguear con el usuario recien creado.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-nav-btn');
            await expect(page.locator('.profile-container')).toBeVisible({ timeout: 5000 });

            await page.click('#add-user-btn');
            await expect(page.locator('#user-modal')).not.toHaveClass(/hidden/);

            await page.fill('#user-email', 'estudiante2@gmail.com');
            await page.fill('#user-password', '123456789');
            await page.selectOption('#user-role', 'STUDENT');
            await page.selectOption('#user-commission', 'NOCHE');
            await page.click('#user-form button[type="submit"]');

            await expect(page.locator('#user-modal')).toHaveClass(/hidden/);
            await expect(page.locator('#users-table-body')).toContainText('estudiante2@gmail.com');

            await logout(page);

            await login(page, 'estudiante2@gmail.com', '123456789');
            await expect(page.locator('#game-page')).toBeVisible();

            await logout(page);
        });

        test('El profesor navega a administracion de usuario, agrega un nuevo usuario (estudiante2@gmail.com con password 123456 y rol estudiante) y luego modifica el email de estudiante2 a otroestudiante. Verifica que el cambio se vea reflejado en la tabla. Elimina el usuario otroestudiante y verifica que no este en la lista.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-nav-btn');
            await expect(page.locator('.profile-container')).toBeVisible({ timeout: 5000 });

            await page.click('#add-user-btn');
            await page.fill('#user-email', 'estudiante3@gmail.com');
            await page.fill('#user-password', '123456789');
            await page.selectOption('#user-role', 'STUDENT');
            await page.click('#user-form button[type="submit"]');
            await expect(page.locator('#user-modal')).toHaveClass(/hidden/);

            const rowStudent2 = page.locator('#users-table-body tr').filter({ hasText: 'estudiante3@gmail.com' });
            await rowStudent2.locator('button', { hasText: '✏️' }).click();

            await expect(page.locator('#user-modal')).not.toHaveClass(/hidden/);
            await page.fill('#user-email', 'otroestudiante@gmail.com');
            await page.click('#user-form button[type="submit"]');

            await expect(page.locator('#user-modal')).toHaveClass(/hidden/);
            await expect(page.locator('#users-table-body')).toContainText('otroestudiante@gmail.com');
            await expect(page.locator('#users-table-body')).not.toContainText('estudiante3@gmail.com');

            const rowEdited = page.locator('#users-table-body tr').filter({ hasText: 'otroestudiante@gmail.com' });
            await rowEdited.locator('button', { hasText: '🗑️' }).click();

            await expect(page.locator('#delete-modal')).not.toHaveClass(/hidden/);
            await page.click('#confirm-delete');

            await expect(page.locator('#delete-modal')).toHaveClass(/hidden/);
            await expect(page.locator('#users-table-body')).not.toContainText('otroestudiante@gmail.com');

            await logout(page);
        });

        test('El profesor navega a administracion de usuario, y navega al perfil del usuario estudiante@gmail.com.', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-nav-btn');
            await expect(page.locator('.profile-container')).toBeVisible({ timeout: 5000 });

            const rowStudent = page.locator('#users-table-body tr').filter({ hasText: 'estudiante@gmail.com' });
            await rowStudent.locator('button', { hasText: '👤' }).click();

            await expect(page.locator('#profile-page')).toBeVisible({ timeout: 5000 });
            await logout(page);
        });

        test('debería mostrar solo usuarios de la comision manana al seleccionar la pestaña Mañana', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-nav-btn');
            await expect(page.locator('.profile-container')).toBeVisible({ timeout: 5000 });

            await page.click('#tab-manana');

            await expect(page.locator('#users-table-body tr').filter({ hasText: 'estudiante@gmail.com' })).toBeVisible();
            await expect(page.locator('#users-table-body tr').filter({ hasText: 'admin@gmail.com' })).toBeVisible();
            await expect(page.locator('#users-table-body tr').filter({ hasText: 'estudiantenoche@gmail.com' })).not.toBeVisible();

            await logout(page);
        });

        test('debería mostrar solo usuarios de la comision noche al seleccionar la pestaña Noche', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-nav-btn');
            await expect(page.locator('.profile-container')).toBeVisible({ timeout: 5000 });

            await page.click('#tab-noche');

            await expect(page.locator('#users-table-body tr').filter({ hasText: 'estudiantenoche@gmail.com' })).toBeVisible();
            await expect(page.locator('#users-table-body tr').filter({ hasText: 'estudiante@gmail.com' })).not.toBeVisible();
            await expect(page.locator('#users-table-body tr').filter({ hasText: 'admin@gmail.com' })).not.toBeVisible();

            await logout(page);
        });

        test('debería filtrar usuarios sin distincion de mayusculas ni tildes al escribir en el campo de busqueda', async ({ page }) => {
            await login(page, 'admin@gmail.com', '123456789');

            await page.click('#admin-nav-btn');
            await expect(page.locator('.profile-container')).toBeVisible({ timeout: 5000 });

            await page.fill('#user-filter-text', 'ESTUDIANTE');

            await expect(page.locator('#users-table-body tr').filter({ hasText: 'estudiante@gmail.com' })).toBeVisible();
            await expect(page.locator('#users-table-body tr').filter({ hasText: 'estudiantenoche@gmail.com' })).toBeVisible();
            await expect(page.locator('#users-table-body tr').filter({ hasText: 'admin@gmail.com' })).not.toBeVisible();

            await logout(page);
        });
    });
});