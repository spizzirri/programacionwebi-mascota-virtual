# Backend Tamagotchi - Gestión de Peguntas y Usuarios

## Autenticación y Seguridad

La aplicación utiliza un modelo de seguridad híbrido para proteger sus recursos:

1.  **Vía Web (Sesión):** Utiliza cookies de sesión. Las operaciones sensibles están restringidas a usuarios con el rol **PROFESSOR**.
2.  **Vía API Directa (API Key):** Para herramientas externas o scripts, se puede utilizar un encabezado `x-api-key` que coincida con la `API_KEY` configurada en el servidor.

---

## Endpoints de Usuarios

### Registrar / Crear Usuario

Permite crear una nueva cuenta. Se requiere privilegios de **PROFESSOR** (vía sesión) o una **API_KEY** válida.

**Endpoint:** `POST /users`

**Ejemplo de Petición (vía API con API Key):**
```bash
curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{
       "email": "profesor@ejemplo.com",
       "password": "mi-password-seguro",
       "role": "PROFESSOR"
     }'
```

---

### Iniciar Sesión (Login)

Inicia sesión para obtener la cookie de sesión necesaria para navegar por la web.

**Endpoint:** `POST /auth/login`

**Ejemplo de Petición:**
```bash
curl -v -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "profesor@ejemplo.com",
       "password": "mi-password-seguro"
     }'
```

**Nota:** El login exitoso devolverá una cabecera `set-cookie: connect.sid=...` que debe usarse en peticiones subsecuentes si no se usa la API Key.

---

### Gestión de Usuarios (ABMC)

Todos estos endpoints requieren ser **PROFESSOR** (sesión) o enviar la **API_KEY**.

- `GET /users`: Listar todos los usuarios.
- `GET /users/:id/profile`: Ver perfil de un usuario específico.
- `PATCH /users/:id`: Actualizar datos de un usuario.
- `DELETE /users/:id`: Eliminar un usuario.

**Ejemplo de Listado (vía Sesión):**
```bash
curl http://localhost:3000/users -H "Cookie: connect.sid=..."
```

---

## Resumen de Uso

Todos los endpoints protegidos (Gestión de Usuarios y Preguntas) aceptan **CUALQUIERA** de estas dos formas de autenticación:

1.  **Cabecera de API Key:** `-H "x-api-key: tu_api_key"`
2.  **Cookie de Sesión:** `-H "Cookie: connect.sid=..."` (Requiere login previo)

---

## Endpoints de Preguntas

### Carga Inicial de Preguntas (Seeding)

**Endpoint:** `POST /database/seed-questions`

Carga las preguntas por defecto desde `questions.data.ts` en la base de datos si esta se encuentra vacía.

**Ejemplo de Petición:**
```bash
curl -X POST http://localhost:3000/database/seed-questions -H "x-api-key: tu_api_key_aqui"
```

**Respuesta:**
```json
{
  "message": "Questions seeded successfully"
}
```

---

### Obtener Todas las Preguntas

**Endpoint:** `GET /questions`

Retorna una lista de todas las preguntas en la base de datos.

**Ejemplo de Petición:**
```bash
curl -G http://localhost:3000/questions -H "x-api-key: tu_api_key_aqui"
```

**Respuesta:**
```json
{
  "questions": [
    {
      "_id": "65b...",
      "text": "¿Qué es HTML?",
      "topic": "HTML",
      ...
    }
  ]
}
```

---

### Crear Pregunta

**Endpoint:** `POST /questions`

Crea una nueva pregunta.

**Ejemplo de Petición:**
```bash
curl -X POST http://localhost:3000/questions \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{
       "text": "¿Nueva Pregunta?",
       "options": ["A", "B", "C"],
       "correctAnswer": "A",
       "topic": "CSS",
       "difficulty": "Easy"
     }'
```

**Respuesta:**
```json
{
  "question": {
    "_id": "65c...",
    "text": "¿Nueva Pregunta?",
    ...
  }
}
```

---

### Actualizar Pregunta

**Endpoint:** `PATCH /questions/:id`

Actualiza una pregunta existente por su ID.

**Ejemplo de Petición:**
```bash
curl -X PATCH http://localhost:3000/questions/65c... \
     -H "Content-Type: application/json" \
     -H "x-api-key: tu_api_key_aqui" \
     -d '{
       "text": "¿Texto de la pregunta actualizado?"
     }'
```

---

### Eliminar Pregunta

**Endpoint:** `DELETE /questions/:id`

Elimina una pregunta por su ID.

**Ejemplo de Petición:**
```bash
curl -X DELETE http://localhost:3000/questions/65c... -H "x-api-key: tu_api_key_aqui"
```

**Respuesta:**
```json
{
  "success": true
}
```
