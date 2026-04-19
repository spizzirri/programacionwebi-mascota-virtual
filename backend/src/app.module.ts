import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { AppealsModule } from './appeals/appeals.module';
import { CsrfMiddleware } from './middleware/csrf.middleware';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: process.env.NODE_ENV === 'e2e-local' ? 10000 : 100,
            },
        ]),
        DatabaseModule,
        AuthModule,
        QuestionsModule,
        AnswersModule,
        UsersModule,
        HealthModule,
        AppealsModule,
    ],
    providers: [
        {
            provide: ThrottlerGuard,
            useValue: { canActivate: () => true },
        },
        {
            provide: APP_GUARD,
            useValue: { canActivate: () => true },
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CsrfMiddleware).forRoutes('*');
    }
}
