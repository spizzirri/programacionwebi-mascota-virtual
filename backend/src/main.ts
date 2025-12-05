import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.set('trust proxy', 1);

    // Enable CORS for frontend
    app.enableCors({
        origin: [
            'http://localhost:5173', // Vite default port
            'http://localhost:5174', // Alternative Vite port
            'http://localhost:3001', // Alternative port
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'https://mascota-virtual-frontend-production.up.railway.app',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Configure session
    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'tamagotchi-secret-key-change-in-production',
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site in production
            },
        }),
    );

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();
