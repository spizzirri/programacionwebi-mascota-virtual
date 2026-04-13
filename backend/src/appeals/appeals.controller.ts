import { Controller, Post, Get, Patch, Body, Param, Session, HttpException, HttpStatus, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { AppealsService } from './appeals.service';
import { DatabaseService } from '../database/database.service';
import { AppealCreateDto } from './dto/appeal-create.dto';
import { AppealResolveDto } from './dto/appeal-resolve.dto';
import { SessionData } from '../common/types/session.types';
import { paginate } from '../common/types/pagination.types';

@Controller('appeals')
export class AppealsController {
    constructor(
        private readonly appealsService: AppealsService,
        private readonly db: DatabaseService
    ) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Session() session: SessionData, @Body() body: AppealCreateDto) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const user = await this.db.findUserById(session.userId);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        return this.appealsService.createAppeal(session.userId, user.email, body.answerId);
    }

    @Get('my')
    async getMy(@Session() session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }
        return this.appealsService.getMyAppeals(session.userId);
    }

    @Get()
    async getAll(
        @Session() session: SessionData,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        await this.validateProfessor(session);

        const pageNum = Math.max(1, parseInt(page || '1', 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

        const { data: appeals, total } = await this.appealsService.getAllAppealsPaginated(pageNum, limitNum);
        return {
            appeals: paginate(appeals, total, pageNum, limitNum),
        };
    }

    @Patch(':id/resolve')
    @UsePipes(new ValidationPipe({ transform: true }))
    async resolve(
        @Session() session: SessionData,
        @Param('id') id: string,
        @Body() body: AppealResolveDto
    ) {
        await this.validateProfessor(session);
        return this.appealsService.resolveAppeal(id, body.status, body.feedback);
    }

    private async validateProfessor(session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const user = await this.db.findUserById(session.userId);
        if (!user || user.role !== 'PROFESSOR') {
            throw new HttpException('Forbidden: Professor access required', HttpStatus.FORBIDDEN);
        }
    }
}
