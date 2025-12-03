import { Controller, Get, Session, HttpException, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service';

interface SessionData {
    userId?: string;
}

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
}
