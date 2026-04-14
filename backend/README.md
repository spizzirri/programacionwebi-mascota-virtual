# Backend Tamagotchi - Gestión de Preguntas y Usuarios

## Autenticación y Seguridad

La aplicación utiliza un modelo de seguridad híbrido para proteger sus recursos:

1. **Vía Web (Sesión):** Utiliza cookies de sesión. Las operaciones sensibles están restringidas a usuarios con el rol **PROFESSOR**.
2. **Vía API Directa (API Key):** Para herramientas externas o scripts, se puede utilizar un encabezado `x-api-key` que coincida con la `API_KEY` configurada en el servidor.

### Protección CSRF

Todas las rutas (excepto `POST /auth/login`, `POST /users` y `/health`) están protegidas por **CSRF middleware**. Para cualquier petición `POST`, `PATCH` o `DELETE` autenticada por sesión, **debes incluir el token CSRF**:

1. **Obtener el token CSRF:** Haz una petición `GET` a cualquier endpoint y lee la cabecera `X-CSRF-Token` de la respuesta.
2. **Enviar el token CSRF:** Incluye la cabecera `X-CSRF-Token` en tu petición `POST`/`PATCH`/`DELETE`.

> **Nota:** El token CSRF se devuelve automáticamente en la cabecera `X-CSRF-Token` de **todas las respuestas GET**. El login (`POST /auth/login`) devuelve un nuevo token CSRF en la respuesta que debe usarse en las peticiones siguientes.

### Cabeceras Requeridas - Resumen

| Tipo de petición | Cabeceras requeridas |
|---|---|
| `GET` (públicas) | Ninguna |
| `POST /auth/login` | `Content-Type: application/json` |
| `POST /users` | `Content-Type: application/json` |
| `GET` (autenticadas) | `Cookie: connect.sid=...` **o** `x-api-key: tu_api_key` |
| `POST`/`PATCH`/`DELETE` (autenticadas) | `Cookie: connect.sid=...` **+** `X-CSRF-Token: ...` **o** `x-api-key: tu_api_key` |

### Flujo típico de autenticación

```bash
# 1. Login - obtienes la cookie de sesión y el token CSRF
curl -v -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "profesor@ejemplo.com", "password": "mi-password"}'

# La respuesta incluye:
# - set-cookie: connect.sid=...
# - X-CSRF-Token: <token_para_usar_en_siguientes_peticiones>

# 2. Petición autenticada (ejemplo: crear usuario)
curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=valor_de_cookie" \
     -H "X-CSRF-Token: valor_del_token" \
     -d '{"email": "estudiante@ejemplo.com", "password": "mi-password", "role": "STUDENT"}'
```

> **Con cURL:** Usa `-v` para ver las cabeceras de respuesta (cookie `set-cookie` y `X-CSRF-Token`).

---

## Endpoints de Autenticación

### Iniciar Sesión

**Endpoint:** `POST /auth/login`

**Validaciones del body:**

| Campo | Tipo | Regla |
|---|---|---|
| `email` | string | ✅ Formato email válido |
| `password` | string | ✅ Mínimo 8 caracteres |

```bash
curl -v -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "profesor@ejemplo.com", "password": "mi-password"}'
```

**Respuesta exitosa:**
- `200 OK`
- Cabecera `set-cookie: connect.sid=...`
- Cabecera `X-CSRF-Token: <token>` (usar en siguientes peticiones)
- Body: `{ "success": true, "user": { ... } }`

**Respuesta de error:**
- `400 Bad Request` si las validaciones fallan (email inválido, password < 8 chars)
- `401 Unauthorized` si las credenciales son incorrectas

**Nota:** El login exitoso devuelve `set-cookie: connect.sid=...`. Pasar `>=3` contraseñas incorrectas bloquea la cuenta. Un usuario bloqueado no puede loguearse aunque ingrese la contraseña correcta.

### Cerrar Sesión

**Endpoint:** `POST /auth/logout`

```bash
curl -X POST http://localhost:3000/auth/logout \
     -H "Cookie: connect.sid=..." \
     -H "X-CSRF-Token: ..."
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

> **Nota:** Este endpoint está **excluido de la verificación CSRF**, pero requiere autenticación válida.

Campos disponibles:

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `email` | string | ✅ | Email único del usuario |
| `password` | string | ✅ | Contraseña en texto plano (se hashea en el servidor) |
| `role` | `PROFESSOR` \| `STUDENT` | ✅ | Rol del usuario |
| `commission` | `MAÑANA` \| `NOCHE` | ❌ | Comisión del usuario |

```bash
# Con API Key
curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{
       "email": "estudiante@ejemplo.com",
       "password": "mi-password",
       "role": "STUDENT",
       "commission": "NOCHE"
     }'

# Con sesión (requiere X-CSRF-Token)
curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=..." \
     -H "X-CSRF-Token: ..." \
     -d '{
       "email": "estudiante@ejemplo.com",
       "password": "mi-password",
       "role": "STUDENT"
     }'
```

### Listar Todos los Usuarios

**Endpoint:** `GET /users`

```bash
# Con API Key
curl http://localhost:3000/users -H "x-api-key: tu_api_key_aqui"

# Con sesión
curl http://localhost:3000/users -H "Cookie: connect.sid=..."
```

### Actualizar Usuario

**Endpoint:** `PATCH /users/:id`

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

Campos actualizables: `email`, `password`, `role`, `streak`, `currentQuestionId`, `lastQuestionAssignedAt`, `lastQuestionAnsweredCorrectly`, `commission`.

```bash
# Con API Key
curl -X PATCH http://localhost:3000/users/65b... \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"commission": "NOCHE"}'

# Con sesión
curl -X PATCH http://localhost:3000/users/65b... \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=..." \
     -H "X-CSRF-Token: ..." \
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

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

```bash
# Con API Key
curl -X DELETE http://localhost:3000/users/65b... -H "x-api-key: tu_api_key_aqui"

# Con sesión
curl -X DELETE http://localhost:3000/users/65b... \
     -H "Cookie: connect.sid=..." \
     -H "X-CSRF-Token: ..."
```

---

## Endpoints de Preguntas

Los endpoints de gestión de preguntas requieren ser **PROFESSOR** (sesión) o enviar la **API_KEY**. Todas las peticiones que no sean `GET` requieren `X-CSRF-Token` si se autenticación por sesión.

### Obtener Todas las Preguntas

**Endpoint:** `GET /questions`

```bash
curl http://localhost:3000/questions -H "x-api-key: tu_api_key_aqui"
```

### Crear Pregunta

**Endpoint:** `POST /questions`

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

```bash
# Con API Key
curl -X POST http://localhost:3000/questions \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"text": "¿Qué es CSS?", "topic": "css_modelo_caja"}'

# Con sesión
curl -X POST http://localhost:3000/questions \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=..." \
     -H "X-CSRF-Token: ..." \
     -d '{"text": "¿Qué es CSS?", "topic": "css_modelo_caja"}'
```

### Crear Preguntas en Lote (CSV)

**Endpoint:** `POST /questions/bulk`

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

Formato del cuerpo: array de objetos `{text, topic}`.

```bash
curl -X POST http://localhost:3000/questions/bulk \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"questions": [{"text": "¿Qué es CSS?", "topic": "CSS"}, {"text": "¿Qué es HTML?", "topic": "HTML"}]}'
```

### Actualizar Pregunta

**Endpoint:** `PATCH /questions/:id`

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

```bash
curl -X PATCH http://localhost:3000/questions/65c... \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"text": "¿Texto actualizado?"}'
```

### Eliminar Pregunta

**Endpoint:** `DELETE /questions/:id`

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

```bash
curl -X DELETE http://localhost:3000/questions/65c... -H "x-api-key: tu_api_key_aqui"
```

### Eliminar Todas las Preguntas

**Endpoint:** `DELETE /questions`

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

```bash
curl -X DELETE http://localhost:3000/questions -H "x-api-key: tu_api_key_aqui"
```

### Obtener Todos los Tópicos

**Endpoint:** `GET /questions/topics`

```bash
curl http://localhost:3000/questions/topics -H "x-api-key: tu_api_key_aqui"
```

### Actualizar Tópico

**Endpoint:** `PATCH /questions/topics/:name`

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

```bash
curl -X PATCH "http://localhost:3000/questions/topics/html_semantico" \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{"enabled": false, "startDate": "2026-01-01", "endDate": "2026-06-30"}'
```

### Carga Inicial de Preguntas (Seed)

**Endpoint:** `POST /database/seed-questions`

Carga las preguntas por defecto en la base de datos si está vacía.

> **Requiere `X-CSRF-Token`** si se autenticación por sesión.

```bash
curl -X POST http://localhost:3000/database/seed-questions -H "x-api-key: tu_api_key_aqui"
```

---

## Resumen de Autenticación

Todos los endpoints protegidos aceptan **cualquiera** de estas dos formas:

| Método | Cabeceras |
|---|---|
| API Key | `-H "x-api-key: tu_api_key"` (sin CSRF) |
| Sesión | `-H "Cookie: connect.sid=..."` **+** `-H "X-CSRF-Token: ..."` (para POST/PATCH/DELETE) |

**Excepciones CSRF:** Las rutas `POST /auth/login`, `POST /users` y `/health` **no requieren** el token CSRF.
