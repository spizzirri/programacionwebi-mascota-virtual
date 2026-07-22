import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SandboxController } from './sandbox.controller';
import { SandboxService } from './sandbox.service';
import { ProblemService } from './services/problem.service';
import { Problem, ProblemSchema } from '../database/schemas/problem.schema';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [
        DatabaseModule,
        MongooseModule.forFeature([
            { name: Problem.name, schema: ProblemSchema },
        ]),
    ],
    controllers: [SandboxController],
    providers: [SandboxService, ProblemService],
    exports: [ProblemService],
})
export class SandboxModule {}