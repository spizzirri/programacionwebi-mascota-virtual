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
import { ProfessorGuard } from './common/guards/professor.guard';
import {
    DEFAULT_THROTTLE_TTL_MS,
    DEFAULT_THROTTLE_LIMIT,
    E2E_THROTTLE_LIMIT,
} from './common/constants/auth.constants';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                ttl: DEFAULT_THROTTLE_TTL_MS,
                limit: process.env.NODE_ENV === 'e2e-local' ? E2E_THROTTLE_LIMIT : DEFAULT_THROTTLE_LIMIT,
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
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CsrfMiddleware).forRoutes('*');
    }
}
