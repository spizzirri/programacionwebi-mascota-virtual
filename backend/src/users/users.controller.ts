import { Controller, Get, Post, Patch, Delete, Param, Session, HttpException, HttpStatus, Query, Body, Headers, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { PasswordUpdateDto } from './dto/password-update.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { SessionData } from '../common/types/session.types';
import { paginate } from '../common/types/pagination.types';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    async getProfile(@Session() session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        try {
            const profile = await this.usersService.getProfile(session.userId);
            return { profile };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }

    @Patch('profile/password')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateProfilePassword(@Session() session: SessionData, @Body() body: PasswordUpdateDto) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        try {
            await this.usersService.updateProfilePassword(session.userId, body.currentPassword, body.newPassword);
            return { success: true };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get('history')
    async getHistory(
        @Session() session: SessionData,
        @Query('limit') limit?: string,
    ) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const history = await this.usersService.getHistory(session.userId, parsedLimit);
        return { history };
    }

    @Get()
    async getAllUsers(
        @Session() session: SessionData,
        @Headers('x-api-key') apiKey?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        await this.validateAccess(session, apiKey);

        const pageNum = Math.max(1, parseInt(page || '1', 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

        const { data: users, total } = await this.usersService.getAllUsersPaginated(pageNum, limitNum);
        return {
            users: paginate(users, total, pageNum, limitNum),
        };
    }

    @Post()
    async createUser(@Body() body: any, @Session() session: SessionData, @Headers('x-api-key') apiKey?: string) {
        await this.validateAccess(session, apiKey);

        const { email, password, role } = body;
        const userData = { email, password, role };

        const user = await this.usersService.createUser(userData);
        return { user };
    }

    @Patch(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateUser(
        @Session() session: SessionData,
        @Param('id') id: string,
        @Body() body: UserUpdateDto,
        @Headers('x-api-key') apiKey?: string,
    ) {
        await this.validateAccess(session, apiKey);

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
    async deleteUser(@Session() session: SessionData, @Param('id') id: string, @Headers('x-api-key') apiKey?: string) {
        await this.validateAccess(session, apiKey);
        await this.usersService.deleteUser(id);
        return { success: true };
    }

    @Get(':id/profile')
    async getUserProfile(@Session() session: SessionData, @Param('id') id: string, @Headers('x-api-key') apiKey?: string) {
        await this.validateAccess(session, apiKey);
        const profile = await this.usersService.getProfile(id);
        return { profile };
    }

    @Get(':id/history')
    async getUserHistory(
        @Session() session: SessionData,
        @Param('id') id: string,
        @Headers('x-api-key') apiKey?: string,
        @Query('limit') limit?: string,
    ) {
        await this.validateAccess(session, apiKey);
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const history = await this.usersService.getHistory(id, parsedLimit);
        return { history };
    }

    @Post(':id/unlock')
    async unlockUser(
        @Session() session: SessionData,
        @Param('id') id: string,
        @Headers('x-api-key') apiKey?: string,
    ) {
        await this.validateAccess(session, apiKey);
        await this.usersService.unlockUser(id);
        return { success: true, message: 'User unlocked successfully' };
    }

    private async validateAccess(session: SessionData, apiKey?: string) {
        if (apiKey && process.env.API_KEY && apiKey === process.env.API_KEY) {
            return;
        }
        if (session.userId) {
            try {
                const currentUser = await this.usersService.getProfile(session.userId);
                if (currentUser.role === 'PROFESSOR') {
                    return;
                }
            } catch (e) {
            }
        }

        throw new HttpException('Forbidden: Invalid session or API Key', HttpStatus.FORBIDDEN);
    }
}
