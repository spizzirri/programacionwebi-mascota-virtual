# Mascota Virtual - Programación Web I

## Inicio y Parada del Proyecto

### Backend
Para el backend, navega a la carpeta `/backend`:
- **Iniciar base de datos (Docker):** `npm run db:up`
- **Frenar base de datos:** `npm run db:down`
- **Iniciar servidor (Desarrollo):** `npm run dev`
- **Iniciar servidor (Producción):** `node dist/main.js` (requiere `npm run build`)

### Frontend
Para el frontend, navega a la carpeta `/frontend`:
- **Iniciar aplicación:** `npm run dev`

---

## Base de Datos en Memoria

El proyecto soporta el uso de una base de datos en memoria para facilitar el desarrollo sin dependencias externas.

- **Variable de control:** `USE_IN_MEMORY_DB=true` (en el `.env` del backend).

---

## Variables de Entorno Obligatorias

### Backend (`/backend/.env`)
- `GEMINI_API_KEY`: Clave de API para el servicio de inteligencia artificial.
- `SESSION_SECRET`: Secreto para la firma de cookies de sesión.
- `MONGODB_URI`: URI de conexión a MongoDB (solo obligatoria si `USE_IN_MEMORY_DB` es `false`).

### Frontend (`/frontend/.env`)
- `VITE_API_BASE_URL`: URL base donde se encuentra corriendo el backend (ej. `http://localhost:3000`).
