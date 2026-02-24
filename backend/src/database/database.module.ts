import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { User, UserSchema } from './schemas/user.schema';
import { Question, QuestionSchema } from './schemas/question.schema';
import { Answer, AnswerSchema } from './schemas/answer.schema';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DatabaseController } from './database.controller';
import { QuestionsService } from '../questions/questions.service';

@Global()
@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: async () => {
                if (process.env.USE_IN_MEMORY_DB === 'true') {
                    console.log('Starting MongoDB in-memory server...');
                    const mongod = await MongoMemoryServer.create({
                        binary: {
                            version: '6.0.11',
                        },
                    });
                    const uri = mongod.getUri();
                    console.log(`MongoDB in-memory server started at ${uri}`);
                    return {
                        uri,
                    };
                } else {
                    return {
                        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tamagotchi',
                    };
                }
            },
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Question.name, schema: QuestionSchema },
            { name: Answer.name, schema: AnswerSchema },
        ]),
    ],
    controllers: [DatabaseController],
    providers: [DatabaseService, QuestionsService],
    exports: [DatabaseService],
})
export class DatabaseModule { }

