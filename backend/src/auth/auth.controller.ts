import { Controller, Post, Get, Body, Session, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

interface SessionData {
    userId?: string;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Post('login')
    async login(
        @Body() body: { email: string; password: string },
        @Session() session: SessionData,
    ) {
        try {
            const user = await this.authService.login(body.email, body.password);
            session.userId = user._id;
            return { success: true, user };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
        }
    }

    @Post('logout')
    async logout(@Session() session: SessionData) {
        session.userId = undefined;
        return { success: true };
    }

    @Get('me')
    async getCurrentUser(@Session() session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const user = await this.authService.getUserById(session.userId);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        return { user };
    }
}
