import { Controller, Post, Get, Body, Session, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import Tokens from 'csrf';
import type { SessionData } from '../common/types/session.types';
import { DEFAULT_THROTTLE_TTL_MS } from '../common/constants/auth.constants';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    private tokens = new Tokens();

    @Post('login')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 1000, ttl: DEFAULT_THROTTLE_TTL_MS } })
    @UsePipes(new ValidationPipe({
        transform: true,
        exceptionFactory: (errors) => {
            const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
            return new Error('Validation failed');
        },
    }))
    async login(
        @Body() loginDto: LoginDto,
        @Session() session: SessionData,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        try {
            await new Promise<void>((resolve, reject) => {
                req.session.regenerate((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            const user = await this.authService.login(loginDto.email, loginDto.password);
            const sessionWithUser = req.session as unknown as SessionData & { userId: string };
            sessionWithUser.userId = user._id;

            const csrfSecret = this.tokens.secretSync();
            const sessionWithCsrf = req.session as unknown as SessionData & { _csrfSecret: string };
            sessionWithCsrf._csrfSecret = csrfSecret;
            const csrfToken = this.tokens.create(csrfSecret);
            res.setHeader('X-CSRF-Token', csrfToken);

            res.json({ success: true, user });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    @Post('logout')
    async logout(@Session() session: SessionData, @Req() req: Request, @Res() res: Response) {
        await new Promise<void>((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) reject(err);
                else {
                    res.clearCookie('tamagotchi.sid');
                    res.json({ success: true });
                    resolve();
                }
            });
        });
    }

    @Get('me')
    async getCurrentUser(@Session() session: SessionData) {
        if (!session.userId) {
            throw new Error('Not authenticated');
        }

        const user = await this.authService.getUserById(session.userId);
        if (!user) {
            throw new Error('User not found');
        }

        return { user };
    }
}
