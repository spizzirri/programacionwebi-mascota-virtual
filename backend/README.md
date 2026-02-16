# Backend Tamagotchi - Gestión de Preguntas

## Autenticación y Roles

La aplicación utiliza dos roles principales: **PROFESSOR** y **STUDENT**. La gestión de preguntas está restringida exclusivamente a usuarios con el rol **PROFESSOR**.

## Endpoints de Autenticación

### Registrar Usuario

Permite crear una nueva cuenta. Es necesario especificar el rol.

**Endpoint:** `POST /auth/register`

**Ejemplo de Petición (Profesor):**
```bash
curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "profesor@ejemplo.com",
       "password": "mi-password-seguro",
       "role": "PROFESSOR"
     }'
```

**Ejemplo de Petición (Estudiante):**
```bash
curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "estudiante@ejemplo.com",
       "password": "password-estudiante",
       "role": "STUDENT"
     }'
```

---

### Iniciar Sesión (Login)

Inicia sesión para obtener la cookie de sesión necesaria para otros endpoints.

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

---

### Cerrar Sesión (Logout)

Invalida la sesión actual.

**Endpoint:** `POST /auth/logout`

**Ejemplo de Petición:**
```bash
curl -X POST http://localhost:3000/auth/logout -H "Cookie: connect.sid=..."
```

---

### Obtener Perfil Actual (Me)

Retorna la información del usuario autenticado actualmente.

**Endpoint:** `GET /auth/me`

**Ejemplo de Petición:**
```bash
curl -X GET http://localhost:3000/auth/me -H "Cookie: connect.sid=..."
```

## Cómo obtener la Cookie de Autenticación

Para probar estos endpoints con herramientas como `curl`, necesitas obtener la cookie de sesión (`connect.sid`).

1. **Iniciar Sesión:**
   Realiza una petición al endpoint de login con las credenciales de un usuario con rol **PROFESSOR**.

   ```bash
   curl -v -X POST http://localhost:3000/auth/login \
        -H "Content-Type: application/json" \
        -d '{
          "email": "profesor@ejemplo.com",
          "password": "tu-contraseña"
        }'
   ```

2. **Extraer la Cookie:**
   En la respuesta (gracias al flag `-v`), busca la cabecera `set-cookie`. Se verá algo como esto:
   `set-cookie: connect.sid=s%3A...; Path=/; HttpOnly`

3. **Usar la Cookie:**
   Copia el valor `connect.sid=...` y úsalo en las siguientes peticiones como una cabecera `Cookie`.

## Endpoints

### Carga Inicial de Preguntas (Seeding)

**Endpoint:** `POST /database/seed-questions`

Carga las preguntas por defecto desde `questions.data.ts` en la base de datos si esta se encuentra vacía.

**Ejemplo de Petición:**
```bash
curl -X POST http://localhost:3000/database/seed-questions -H "Cookie: connect.sid=..."
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
curl -G http://localhost:3000/questions -H "Cookie: connect.sid=..."
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
     -H "Cookie: connect.sid=..." \
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
     -H "Cookie: connect.sid=..." \
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
curl -X DELETE http://localhost:3000/questions/65c... -H "Cookie: connect.sid=..."
```

**Respuesta:**
```json
{
  "success": true
}
```
