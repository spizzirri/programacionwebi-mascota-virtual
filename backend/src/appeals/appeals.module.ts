import { Module } from '@nestjs/common';
import { AppealsService } from './appeals.service';
import { AppealsController } from './appeals.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [AppealsService],
    controllers: [AppealsController],
    exports: [AppealsService],
})
export class AppealsModule { }
