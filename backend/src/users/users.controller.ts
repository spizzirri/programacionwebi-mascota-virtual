import { Controller, Get, Post, Patch, Delete, Param, Session, HttpException, HttpStatus, Query, Body, Headers } from '@nestjs/common';
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

    @Get()
    async getAllUsers(@Session() session: SessionData, @Headers('x-api-key') apiKey?: string) {
        await this.validateAccess(session, apiKey);
        const users = await this.usersService.getAllUsers();
        return { users };
    }

    @Post()
    async createUser(@Body() body: any, @Session() session: SessionData, @Headers('x-api-key') apiKey?: string) {
        console.log(session);
        console.log(apiKey);
        await this.validateAccess(session, apiKey);
        const user = await this.usersService.createUser(body);
        return { user };
    }

    @Patch(':id')
    async updateUser(@Session() session: SessionData, @Param('id') id: string, @Body() body: any, @Headers('x-api-key') apiKey?: string) {
        await this.validateAccess(session, apiKey);
        const user = await this.usersService.updateUser(id, body);
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

    private async validateAccess(session: SessionData, apiKey?: string) {
        // 1. Check API KEY first (Programmatic access)
        if (apiKey && process.env.API_KEY && apiKey === process.env.API_KEY) {
            return; // Authorized
        }

        // 2. Check Session (Web access)
        if (session.userId) {
            try {
                const currentUser = await this.usersService.getProfile(session.userId);
                if (currentUser.role === 'PROFESSOR') {
                    return; // Authorized
                }
            } catch (e) {
                // User not found or other error
            }
        }

        throw new HttpException('Forbidden: Invalid session or API Key', HttpStatus.FORBIDDEN);
    }
}
