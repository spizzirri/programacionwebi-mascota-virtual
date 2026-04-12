import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';
import dotenv from 'dotenv';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { randomBytes } from 'crypto';

dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.use(helmet());

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
        throw new Error('SESSION_SECRET environment variable must be set. Generate one using a random string generator.');
    }

    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
        throw new Error('NODE_ENV environment variable must be set (e.g., "development", "production")');
    }

    const isProduction = nodeEnv === 'production';

    app.set('trust proxy', 1);
    app.enableCors({
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3001',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'https://mascota-virtual-frontend-production.up.railway.app',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    });

    let sessionStore;
    if (process.env.USE_IN_MEMORY_DB !== 'true') {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamagotchi';
        console.log(`Using MongoDB session store with URI: ${mongoUri}`);
        sessionStore = MongoStore.create({
            mongoUrl: mongoUri,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60,
        });
    }

    app.use(
        session({
            store: sessionStore,
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            name: 'tamagotchi.sid',
            cookie: {
                maxAge: 15 * 60 * 60 * 1000,
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
            },
        }),
    );

    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();
