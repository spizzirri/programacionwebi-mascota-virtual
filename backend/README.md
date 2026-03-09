# Backend Tamagotchi - Gestión de Preguntas y Usuarios

## Autenticación y Seguridad

La aplicación utiliza un modelo de seguridad híbrido para proteger sus recursos:

1. **Vía Web (Sesión):** Utiliza cookies de sesión. Las operaciones sensibles están restringidas a usuarios con el rol **PROFESSOR**.
2. **Vía API Directa (API Key):** Para herramientas externas o scripts, se puede utilizar un encabezado `x-api-key` que coincida con la `API_KEY` configurada en el servidor.

---

## Endpoints de Autenticación

### Iniciar Sesión

**Endpoint:** `POST /auth/login`

```bash
curl -v -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "profesor@ejemplo.com", "password": "mi-password"}'
```

**Nota:** El login exitoso devuelve `set-cookie: connect.sid=...`. Pasar `>=3` contraseñas incorrectas bloquea la cuenta. Un usuario bloqueado no puede loguearse aunque ingrese la contraseña correcta.

### Cerrar Sesión

**Endpoint:** `POST /auth/logout`

```bash
curl -X POST http://localhost:3000/auth/logout -H "Cookie: connect.sid=..."
```

### Obtener Usuario Actual

**Endpoint:** `GET /auth/me`

```bash
curl http://localhost:3000/auth/me -H "Cookie: connect.sid=..."
```

---

## Endpoints de Usuarios

Todos los endpoints de gestión de usuarios requieren ser **PROFESSOR** (sesión) o enviar la **API_KEY**.

### Crear Usuario

**Endpoint:** `POST /users`

Campos disponibles:

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `email` | string | ✅ | Email único del usuario |
| `password` | string | ✅ | Contraseña en texto plano (se hashea en el servidor) |
| `role` | `PROFESSOR` \| `STUDENT` | ✅ | Rol del usuario |
| `commission` | `MAÑANA` \| `NOCHE` | ❌ | Comisión del usuario |

```bash
curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{
       "email": "estudiante@ejemplo.com",
       "password": "mi-password",
       "role": "STUDENT",
       "commission": "NOCHE"
     }'
```

**Respuesta:**
```json
{
  "user": {
    "_id": "65b...",
    "email": "estudiante@ejemplo.com",
    "role": "STUDENT",
    "streak": 0,
    "commission": "NOCHE",
    "createdAt": "2026-03-08T20:00:00.000Z"
  }
}
```

### Listar Todos los Usuarios

**Endpoint:** `GET /users`

```bash
curl http://localhost:3000/users -H "x-api-key: tu_api_key_aqui"
```

**Respuesta:** Incluye `currentQuestionText` (texto de la pregunta asignada actualmente).

```json
{
  "users": [
    {
      "_id": "65b...",
      "email": "estudiante@ejemplo.com",
      "role": "STUDENT",
      "streak": 3,
      "commission": "MAÑANA",
      "currentQuestionId": "65c...",
      "currentQuestionText": "¿Qué es el DOM?",
      "lastQuestionAssignedAt": "2026-03-08T10:00:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### Actualizar Usuario

**Endpoint:** `PATCH /users/:id`

Campos actualizables: `email`, `password`, `role`, `streak`, `currentQuestionId`, `lastQuestionAssignedAt`, `lastQuestionAnsweredCorrectly`, `commission`.

```bash
curl -X PATCH http://localhost:3000/users/65b... \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"commission": "NOCHE"}'
```

### Ver Perfil de un Usuario

**Endpoint:** `GET /users/:id/profile`

```bash
curl http://localhost:3000/users/65b.../profile -H "x-api-key: tu_api_key_aqui"
```

### Ver Historial de Respuestas de un Usuario

**Endpoint:** `GET /users/:id/history?limit=50`

```bash
curl "http://localhost:3000/users/65b.../history?limit=10" -H "x-api-key: tu_api_key_aqui"
```

### Eliminar Usuario

**Endpoint:** `DELETE /users/:id`

```bash
curl -X DELETE http://localhost:3000/users/65b... -H "x-api-key: tu_api_key_aqui"
```

---

## Endpoints de Preguntas

Los endpoints de gestión de preguntas requieren ser **PROFESSOR** (sesión) o enviar la **API_KEY**.

### Obtener Todas las Preguntas

**Endpoint:** `GET /questions`

```bash
curl http://localhost:3000/questions -H "x-api-key: tu_api_key_aqui"
```

**Respuesta:**
```json
{
  "questions": [
    { "_id": "65c...", "text": "¿Qué es el DOM?", "topic": "html_semantico" }
  ]
}
```

### Crear Pregunta

**Endpoint:** `POST /questions`

```bash
curl -X POST http://localhost:3000/questions \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"text": "¿Qué es CSS?", "topic": "css_modelo_caja"}'
```

### Crear Preguntas en Lote (CSV)

**Endpoint:** `POST /questions/bulk`

Formato del cuerpo: array de objetos `{text, topic}`.

```bash
curl -X POST http://localhost:3000/questions/bulk \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"questions": [{"text": "¿Qué es CSS?", "topic": "CSS"}, {"text": "¿Qué es HTML?", "topic": "HTML"}]}'
```

### Actualizar Pregunta

**Endpoint:** `PATCH /questions/:id`

```bash
curl -X PATCH http://localhost:3000/questions/65c... \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"text": "¿Texto actualizado?"}'
```

### Eliminar Pregunta

**Endpoint:** `DELETE /questions/:id`

```bash
curl -X DELETE http://localhost:3000/questions/65c... -H "x-api-key: tu_api_key_aqui"
```

### Eliminar Todas las Preguntas

**Endpoint:** `DELETE /questions`

```bash
curl -X DELETE http://localhost:3000/questions -H "x-api-key: tu_api_key_aqui"
```

### Obtener Todos los Tópicos

**Endpoint:** `GET /questions/topics`

```bash
curl http://localhost:3000/questions/topics -H "x-api-key: tu_api_key_aqui"
```

**Respuesta:**
```json
{
  "topics": [
    { "name": "html_semantico", "enabled": true, "startDate": null, "endDate": null }
  ]
}
```

### Actualizar Tópico

**Endpoint:** `PATCH /questions/topics/:name`

```bash
curl -X PATCH "http://localhost:3000/questions/topics/html_semantico" \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"enabled": false, "startDate": "2026-01-01", "endDate": "2026-06-30"}'
```

### Carga Inicial de Preguntas (Seed)

**Endpoint:** `POST /database/seed-questions`

Carga las preguntas por defecto en la base de datos si está vacía.

```bash
curl -X POST http://localhost:3000/database/seed-questions -H "x-api-key: tu_api_key_aqui"
```

---

## Resumen de Autenticación

Todos los endpoints protegidos aceptan **cualquiera** de estas dos formas:

| Método | Cabecera |
|---|---|
| API Key | `-H "x-api-key: tu_api_key"` |
| Sesión | `-H "Cookie: connect.sid=..."` (requiere login previo con rol PROFESSOR) |
