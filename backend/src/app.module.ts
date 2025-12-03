import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { UsersModule } from './users/users.module';

@Module({
    imports: [DatabaseModule, AuthModule, QuestionsModule, AnswersModule, UsersModule],
})
export class AppModule { }
