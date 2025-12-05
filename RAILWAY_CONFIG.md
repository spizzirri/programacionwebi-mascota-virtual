# Configuración de Variables de Ambiente en Railway

## Problema: Error 401 (Unauthorized) en Producción

El error ocurre porque las cookies de sesión no se comparten entre dominios diferentes (frontend y backend en Railway) sin la configuración correcta.

## Solución

### 1. Variables de Ambiente en Railway - Backend

Ve al servicio del **backend** en Railway y configura:

```
NODE_ENV=production
SESSION_SECRET=<genera-un-string-aleatorio-seguro>
```

**Importante**: El `SESSION_SECRET` debe ser una cadena aleatoria y segura. Puedes generar una con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Variables de Ambiente en Railway - Frontend

Ve al servicio del **frontend** en Railway y configura:

```
VITE_API_BASE_URL=https://mascota-virtual-backend-production.up.railway.app
```

**Nota**: No incluyas el puerto `:443` ya que HTTPS usa 443 por defecto.

### 3. Cambios en el Código

Ya se realizaron los cambios necesarios en `backend/src/main.ts`:

```typescript
cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true en producción
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' para cross-site
}
```

Esto permite que las cookies funcionen en producción con:
- `secure: true` - Solo envía cookies por HTTPS
- `sameSite: 'none'` - Permite cookies cross-site (diferentes dominios)

### 4. Verificar CORS

El backend ya tiene configurado el origen del frontend:
```typescript
origin: [
    // ... otros orígenes
    'https://mascota-virtual-frontend-production.up.railway.app',
],
credentials: true,
```

## Pasos para Aplicar los Cambios

1. **Commitea y pushea** los cambios del backend a tu repositorio
2. **Configura las variables** en Railway (backend y frontend)
3. Railway hará **redeploy automático** de ambos servicios
4. **Prueba** registrando un nuevo usuario o haciendo login

## Verificación

Después del deploy, verifica en la consola del navegador que:
- No hay errores 401
- Las cookies se están enviando correctamente (pestaña Network → Headers → Cookie)

## Troubleshooting

Si sigues teniendo problemas:

1. Verifica que `NODE_ENV=production` esté configurado en Railway
2. Verifica que la URL del frontend en CORS coincida exactamente
3. Revisa los logs de Railway para ver si hay errores
4. Limpia las cookies del navegador y vuelve a intentar
