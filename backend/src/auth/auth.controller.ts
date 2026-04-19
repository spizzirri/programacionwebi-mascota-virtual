import { Controller, Post, Get, Body, Session, HttpException, HttpStatus, UsePipes, ValidationPipe, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import Tokens from 'csrf';
import { SessionData } from '../common/types/session.types';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    private tokens = new Tokens();

    @Post('login')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 1000, ttl: 60000 } })
    @UsePipes(new ValidationPipe({
        transform: true,
        exceptionFactory: (errors) => {
            const messages = errors.flatMap(e => Object.values(e.constraints || {}));
            return new HttpException(
                { success: false, message: 'Validation failed', errors: messages },
                HttpStatus.BAD_REQUEST
            );
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
            (req.session as any).userId = user._id;

            // Generate CSRF token for the new session
            const csrfSecret = this.tokens.secretSync();
            (req.session as any)._csrfSecret = csrfSecret;
            const csrfToken = this.tokens.create(csrfSecret);
            res.setHeader('X-CSRF-Token', csrfToken);

            res.json({ success: true, user });
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
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
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const user = await this.authService.getUserById(session.userId);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        return { user };
    }
}
