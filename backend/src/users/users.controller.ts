import { Controller, Get, Post, Patch, Delete, Param, Session, Query, Body, Headers, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { PasswordUpdateDto } from './dto/password-update.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { CreateUserDto } from './dto/create-user.dto';
import type { SessionData } from '../common/types/session.types';
import { paginate } from '../common/types/pagination.types';
import { DEFAULT_PAGINATION_PAGE, DEFAULT_PAGINATION_LIMIT, MAX_PAGINATION_LIMIT, MIN_PAGINATION_LIMIT } from '../common/constants/pagination.constants';
import { ProfessorGuard } from '../common/guards/professor.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('profile')
    async getProfile(@Session() session: SessionData) {
        if (!session.userId) {
            throw new Error('Not authenticated');
        }

        const profile = await this.usersService.getProfile(session.userId);
        return { profile };
    }

    @Patch('profile/password')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateProfilePassword(@Session() session: SessionData, @Body() body: PasswordUpdateDto) {
        if (!session.userId) {
            throw new Error('Not authenticated');
        }

        await this.usersService.updateProfilePassword(session.userId, body.currentPassword, body.newPassword);
        return { success: true };
    }

    @Get('history')
    async getHistory(@Session() session: SessionData, @Query('limit') limit?: string) {
        if (!session.userId) {
            throw new Error('Not authenticated');
        }

        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const history = await this.usersService.getHistory(session.userId, parsedLimit);
        return { history };
    }

    @Get()
    @UseGuards(ProfessorGuard)
    async getAllUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = Math.max(MIN_PAGINATION_LIMIT, parseInt(page || String(DEFAULT_PAGINATION_PAGE), 10));
        const limitNum = Math.min(MAX_PAGINATION_LIMIT, Math.max(MIN_PAGINATION_LIMIT, parseInt(limit || String(DEFAULT_PAGINATION_LIMIT), 10)));

        const { data: users, total } = await this.usersService.getAllUsersPaginated(pageNum, limitNum);
        return {
            users: paginate(users, total, pageNum, limitNum),
        };
    }

    @Post()
    @UseGuards(ProfessorGuard)
    async createUser(@Body() body: CreateUserDto) {
        const user = await this.usersService.createUser(body);
        return { user };
    }

    @Patch(':id')
    @UseGuards(ProfessorGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateUser(@Param('id') id: string, @Body() body: UserUpdateDto) {
        const updateData: any = {};
        const allowedFields: (keyof UserUpdateDto)[] = [
            'email', 'password', 'role', 'streak', 'currentQuestionId',
            'lastQuestionAssignedAt', 'lastQuestionAnsweredCorrectly', 'commission',
        ];
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const user = await this.usersService.updateUser(id, updateData);
        return { user };
    }

    @Delete(':id')
    @UseGuards(ProfessorGuard)
    async deleteUser(@Param('id') id: string) {
        await this.usersService.deleteUser(id);
        return { success: true };
    }

    @Get(':id/profile')
    @UseGuards(ProfessorGuard)
    async getUserProfile(@Param('id') id: string) {
        const profile = await this.usersService.getProfile(id);
        return { profile };
    }

    @Get(':id/history')
    @UseGuards(ProfessorGuard)
    async getUserHistory(@Param('id') id: string, @Query('limit') limit?: string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const history = await this.usersService.getHistory(id, parsedLimit);
        return { history };
    }

    @Post(':id/unlock')
    @UseGuards(ProfessorGuard)
    async unlockUser(@Param('id') id: string) {
        await this.usersService.unlockUser(id);
        return { success: true, message: 'User unlocked successfully' };
    }
}
