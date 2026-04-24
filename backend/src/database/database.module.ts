import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { User, UserSchema } from './schemas/user.schema';
import { Question, QuestionSchema } from './schemas/question.schema';
import { Answer, AnswerSchema } from './schemas/answer.schema';
import { Appeal, AppealSchema } from './schemas/appeal.schema';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { DatabaseController } from './database.controller';
import { UserService } from '../users/services/user.service';
import { QuestionService } from '../questions/services/question.service';
import { AnswerService } from '../answers/services/answer.service';
import { AppealService } from '../appeals/services/appeal.service';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: async () => ({
                uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tamagotchi',
            }),
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Question.name, schema: QuestionSchema },
            { name: Answer.name, schema: AnswerSchema },
            { name: Appeal.name, schema: AppealSchema },
            { name: Topic.name, schema: TopicSchema },
        ]),
    ],
    controllers: [DatabaseController],
    providers: [DatabaseService, UserService, QuestionService, AnswerService, AppealService],
    exports: [DatabaseService, UserService, QuestionService, AnswerService, AppealService, MongooseModule],
})
export class DatabaseModule {}
