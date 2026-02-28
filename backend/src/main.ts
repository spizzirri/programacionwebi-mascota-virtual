import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import session from 'express-session';
import dotenv from 'dotenv';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';

dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.use(helmet());

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
        allowedHeaders: ['Content-Type', 'Authorization'],
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

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret && process.env.NODE_ENV === 'production') {
        throw new Error('SESSION_SECRET must be set in production');
    }

    app.use(
        session({
            store: sessionStore,
            secret: sessionSecret || 'tamagotchi-secret-key-development-only',
            resave: false,
            saveUninitialized: false,
            name: 'tamagotchi.sid',
            cookie: {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            },
        }),
    );

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();
