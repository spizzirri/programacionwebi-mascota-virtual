# Environment Variables Configuration

This document explains how to configure environment variables for the frontend application.

## Local Development

For local development, the frontend uses a `.env` file to configure the API base URL.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. The `.env` file contains:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```

This configuration points to the local backend server.

## Production

For production builds, the frontend uses `.env.production`:

```
VITE_API_BASE_URL=https://mascota-virtual-backend-production.up.railway.app:443
```

When you run `npm run build`, Vite automatically uses the `.env.production` file.

## Environment Variables

- **VITE_API_BASE_URL**: The base URL for the backend API
  - Local: `http://localhost:3000`
  - Production: `https://mascota-virtual-backend-production.up.railway.app:443`

## How It Works

The frontend uses Vite's built-in environment variable system. Variables prefixed with `VITE_` are exposed to the client-side code via `import.meta.env`.

In `src/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
```

This ensures the correct API endpoint is used based on the environment.
