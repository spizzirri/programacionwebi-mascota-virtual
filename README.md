# 🎮 Tamagotchi HTML Learning App

Una aplicación web interactiva que gamifica el aprendizaje de HTML a través de una mascota virtual tipo Tamagotchi. Los usuarios responden preguntas sobre HTML que son validadas por Gemini AI, y la mascota reacciona emocionalmente según la calidad de las respuestas.

## ✨ Características

- 🔐 **Autenticación**: Sistema de registro e inicio de sesión con email y contraseña
- 🐾 **Tamagotchi Interactivo**: Mascota con 3 estados emocionales (neutral, feliz, triste)
- 📚 **Preguntas de HTML**: 25+ preguntas sobre HTML en español
- 🤖 **Validación con IA**: Gemini AI evalúa las respuestas como correctas, parciales o incorrectas
- 🔥 **Sistema de Rachas**: Contador visual que incrementa según el rendimiento
- 📊 **Historial**: Visualiza todas tus respuestas anteriores con calificaciones
- 🎨 **Diseño Moderno**: Tema oscuro con glassmorphism y animaciones suaves

## 🛠️ Tecnologías

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Tipado estático
- **NeDB** - Base de datos NoSQL en memoria
- **Gemini AI** - Validación de respuestas
- **bcrypt** - Hash de contraseñas
- **express-session** - Manejo de sesiones

### Frontend
- **TypeScript** - Código tipado
- **Vite** - Build tool y dev server
- **Vanilla JavaScript** - Sin frameworks
- **CSS3** - Diseño moderno con variables CSS

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Una API key de Gemini AI ([obtener aquí](https://makersuite.google.com/app/apikey))

## 🚀 Instalación y Configuración

### 1. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu GEMINI_API_KEY
```

Edita el archivo `.env`:
```env
GEMINI_API_KEY=tu_api_key_aqui
PORT=3000
SESSION_SECRET=tu_secreto_aqui
```

### 2. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install
```

## ▶️ Ejecutar la Aplicación

### Iniciar el Backend

```bash
cd backend
npm run dev
```

El backend estará disponible en `http://localhost:3000`

### Iniciar el Frontend (en otra terminal)

```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 🎯 Cómo Usar

1. **Registrarse**: Crea una cuenta con tu email y contraseña
2. **Responder Preguntas**: Lee la pregunta sobre HTML y escribe tu respuesta
3. **Ver Reacción**: El Tamagotchi reaccionará según tu respuesta:
   - ✅ **Correcta**: Sonríe y la racha aumenta en 1
   - ⚠️ **Parcial**: Se mantiene neutral y la racha aumenta en 0.5
   - ❌ **Incorrecta**: Se pone triste y la racha vuelve a 0
4. **Ver Historial**: Accede a tu perfil para ver todas tus respuestas anteriores

## 📁 Estructura del Proyecto

```
kinetic-glenn/
├── backend/
│   ├── src/
│   │   ├── auth/          # Módulo de autenticación
│   │   ├── questions/     # Módulo de preguntas
│   │   ├── answers/       # Módulo de respuestas (con Gemini AI)
│   │   ├── users/         # Módulo de usuarios
│   │   ├── database/      # Servicio de base de datos
│   │   ├── app.module.ts  # Módulo raíz
│   │   └── main.ts        # Punto de entrada
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── api.ts         # Cliente API
    │   ├── auth.ts        # Lógica de autenticación
    │   ├── tamagotchi.ts  # Componente Tamagotchi
    │   ├── game.ts        # Lógica del juego
    │   ├── profile.ts     # Página de perfil
    │   ├── main.ts        # Punto de entrada
    │   └── styles.css     # Estilos
    ├── index.html
    ├── package.json
    └── tsconfig.json
```

## 🎨 Sistema de Calificación

- **Correcta** (+1.0): Respuesta completa y precisa
- **Parcial** (+0.5): Respuesta parcialmente correcta o incompleta
- **Incorrecta** (0): Respuesta incorrecta, la racha se reinicia

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Sesiones seguras con express-session
- Validación de entrada en backend
- CORS configurado para desarrollo

## 📝 Notas Importantes

- **Base de Datos en Memoria**: Los datos se pierden al reiniciar el servidor. Para producción, migrar a MongoDB u otra base de datos persistente.
- **API Key de Gemini**: Necesaria para la validación de respuestas. Sin ella, la aplicación no funcionará correctamente.
- **Desarrollo**: Esta es una versión de desarrollo. Para producción, configurar HTTPS, variables de entorno seguras, y base de datos persistente.

## 🐛 Solución de Problemas

### El backend no inicia
- Verifica que tienes Node.js 18+ instalado
- Asegúrate de haber ejecutado `npm install` en la carpeta backend
- Verifica que el archivo `.env` existe y tiene la API key de Gemini

### El frontend no se conecta al backend
- Verifica que el backend esté ejecutándose en el puerto 3000
- Revisa la consola del navegador para errores de CORS
- Asegúrate de que ambos servidores estén corriendo

### Las respuestas no se validan
- Verifica que la API key de Gemini sea válida
- Revisa los logs del backend para errores de la API de Gemini
- Asegúrate de tener conexión a internet

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias o mejoras.


https://aistudio.google.com/app/api-keys
URL Backend:
* https://mascota-virtual-backend-production.up.railway.app:443