import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';
import dotenv from 'dotenv';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

dotenv.config();

function parseCorsOrigins(envVar: string | undefined, fallback: string[]): string[] {
    if (!envVar) return fallback;
    return envVar.split(',').map(origin => origin.trim()).filter(Boolean);
}

function maskMongoUri(uri: string): string {
    try {
        const url = new URL(uri);
        if (url.username || url.password) {
            url.username = '***';
            url.password = '***';
        }
        return url.toString();
    } catch {
        return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    }
}

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useGlobalFilters(new GlobalExceptionFilter());

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

    const devOrigins = parseCorsOrigins(process.env.CORS_ORIGINS_DEV, [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3001',
    ]);

    const prodOrigins = parseCorsOrigins(process.env.CORS_ORIGINS_PROD, [
        'https://mascota-virtual-frontend-production.up.railway.app',
    ]);

    const corsOrigins = isProduction ? prodOrigins : [...devOrigins, ...prodOrigins];

    app.set('trust proxy', 1);
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
        exposedHeaders: ['X-CSRF-Token'],
    });

    let sessionStore: any;
    if (process.env.USE_IN_MEMORY_DB !== 'true') {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamagotchi';
        const maskedUri = maskMongoUri(mongoUri);
        console.log(`Attempting MongoDB session store with URI: ${maskedUri}`);

        // Test MongoDB connection with a timeout before using it
        try {
            const { MongoClient } = await import('mongodb');
            const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 3000 });
            await client.connect();
            await client.db().command({ ping: 1 });
            console.log('MongoDB connection successful, using MongoStore for sessions');
            await client.close();

            sessionStore = MongoStore.create({
                mongoUrl: mongoUri,
                collectionName: 'sessions',
                ttl: 24 * 60 * 60,
            });
        } catch (error) {
            console.warn(`MongoDB not available (${(error as Error).message}), falling back to in-memory session store`);
            console.warn('Note: Sessions will be lost on server restart. Set USE_IN_MEMORY_DB=true or start MongoDB for persistence.');
        }
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
