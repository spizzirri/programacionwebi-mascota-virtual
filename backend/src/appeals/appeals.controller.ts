import { Controller, Post, Get, Patch, Body, Param, Session, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppealsService } from './appeals.service';
import { UserService } from '../users/services/user.service';
import { AppealCreateDto } from './dto/appeal-create.dto';
import { AppealResolveDto } from './dto/appeal-resolve.dto';
import type { SessionData } from '../common/types/session.types';
import { paginate } from '../common/types/pagination.types';
import { DEFAULT_PAGINATION_PAGE, DEFAULT_PAGINATION_LIMIT, MAX_PAGINATION_LIMIT, MIN_PAGINATION_LIMIT } from '../common/constants/pagination.constants';
import { ProfessorGuard } from '../common/guards/professor.guard';

@Controller('appeals')
export class AppealsController {
    constructor(
        private readonly appealsService: AppealsService,
        private readonly userService: UserService,
    ) {}

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Session() session: SessionData, @Body() body: AppealCreateDto) {
        if (!session.userId) {
            throw new Error('Not authenticated');
        }

        const user = await this.userService.findUserById(session.userId);
        if (!user) {
            throw new Error('User not found');
        }

        return this.appealsService.createAppeal(session.userId, user.email, body.answerId);
    }

    @Get('my')
    async getMy(@Session() session: SessionData) {
        if (!session.userId) {
            throw new Error('Not authenticated');
        }
        return this.appealsService.getMyAppeals(session.userId);
    }

    @Get()
    @UseGuards(ProfessorGuard)
    async getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
        const pageNum = Math.max(MIN_PAGINATION_LIMIT, parseInt(page || String(DEFAULT_PAGINATION_PAGE), 10));
        const limitNum = Math.min(MAX_PAGINATION_LIMIT, Math.max(MIN_PAGINATION_LIMIT, parseInt(limit || String(DEFAULT_PAGINATION_LIMIT), 10)));

        const { data: appeals, total } = await this.appealsService.getAllAppealsPaginated(pageNum, limitNum);
        return {
            appeals: paginate(appeals, total, pageNum, limitNum),
        };
    }

    @Patch(':id/resolve')
    @UseGuards(ProfessorGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async resolve(@Param('id') id: string, @Body() body: AppealResolveDto) {
        return this.appealsService.resolveAppeal(id, body.status, body.feedback);
    }
}
