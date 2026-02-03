import { Controller, Get, Post, Patch, Delete, Param, Session, HttpException, HttpStatus, Query, Body } from '@nestjs/common';
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
    async getAllUsers(@Session() session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const currentUser = await this.usersService.getProfile(session.userId);
        if (currentUser.role !== 'PROFESSOR') {
            throw new HttpException('Forbidden: Only professors can access this resource', HttpStatus.FORBIDDEN);
        }

        const users = await this.usersService.getAllUsers();
        return { users };
    }

    @Post()
    async createUser(@Session() session: SessionData, @Body() body: any) {
        this.checkProfessor(session);
        const user = await this.usersService.createUser(body);
        return { user };
    }

    @Patch(':id')
    async updateUser(@Session() session: SessionData, @Param('id') id: string, @Body() body: any) {
        this.checkProfessor(session);
        const user = await this.usersService.updateUser(id, body);
        return { user };
    }

    @Delete(':id')
    async deleteUser(@Session() session: SessionData, @Param('id') id: string) {
        this.checkProfessor(session);
        await this.usersService.deleteUser(id);
        return { success: true };
    }

    @Get(':id/profile')
    async getUserProfile(@Session() session: SessionData, @Param('id') id: string) {
        this.checkProfessor(session);
        const profile = await this.usersService.getProfile(id);
        return { profile };
    }

    @Get(':id/history')
    async getUserHistory(
        @Session() session: SessionData,
        @Param('id') id: string,
        @Query('limit') limit?: string,
    ) {
        this.checkProfessor(session);
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const history = await this.usersService.getHistory(id, parsedLimit);
        return { history };
    }

    private async checkProfessor(session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }
        const currentUser = await this.usersService.getProfile(session.userId);
        if (currentUser.role !== 'PROFESSOR') {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }
    }
}
