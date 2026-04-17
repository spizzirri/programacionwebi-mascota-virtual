# Mascota Virtual - Programación Web I

## Inicio y Parada del Proyecto

El proyecto está configurado como un monorepo utilizando **npm workspaces**. Esto significa que puedes iniciar tanto el frontend como el backend simultáneamente desde la raíz del proyecto.

### Todas las aplicaciones a la vez
Para iniciar tanto el frontend como el backend concurrentemente, sitúate en la **raíz del proyecto** y ejecuta:
- **Instalar dependencias globales:** `npm install`
- **Iniciar frontend y backend concurrentemente:** `npm run dev`

### Por separado

#### Backend
Para el backend, navega a la carpeta `/backend` o usa los comandos de npm workspaces desde la raíz:
- **Iniciar base de datos (Docker):** `npm run db:up` (o `npm run db:up --workspace=backend` desde la raíz)
- **Frenar base de datos:** `npm run db:down` (o `npm run db:down --workspace=backend` desde la raíz)
- **Iniciar servidor (Desarrollo):** `npm run dev` (o `npm run dev:backend` desde la raíz)
- **Iniciar servidor (Producción):** `node dist/main.js` (requiere `npm run build`)

## Pruebas de Sistema

Para ejecutar las pruebas End-to-End con Playwright:

1. **Levantar el entorno E2E (contenedores)**:
   ```bash
   npm run start:e2e:env
   ```

2. **Levantar backend y frontend con configuración E2E**:
   ```bash
   npm run dev:e2e
   ```

3. **Ejecutar las pruebas E2E**:
   ```bash
   npm run test:e2e
   ```

4. **Detener y limpiar los contenedores E2E**:
   ```bash
   npm run stop:e2e:env -- --rmi local
   ```

#### Frontend
Para el frontend, navega a la carpeta `/frontend` o usa los comandos de npm workspaces desde la raíz:
- **Iniciar aplicación:** `npm run dev` (o `npm run dev:frontend` desde la raíz)

---

## Variables de Entorno Obligatorias

### Backend (`/backend/.env`)
- `GEMINI_API_KEY`: Clave de API para el servicio de inteligencia artificial.
- `SESSION_SECRET`: Secreto para la firma de cookies de sesión.
- `MONGODB_URI`: URI de conexión a MongoDB.

### Frontend (`/frontend/.env`)
- `VITE_API_BASE_URL`: URL base donde se encuentra corriendo el backend (ej. `http://localhost:3000`).
