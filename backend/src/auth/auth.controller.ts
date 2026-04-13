import { Controller, Post, Get, Body, Session, HttpException, HttpStatus, UsePipes, ValidationPipe, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { SessionData } from '../common/types/session.types';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Post('login')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @UsePipes(new ValidationPipe({ transform: true }))
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

            const csrfToken = (req as any).csrfToken?.();
            if (csrfToken) {
                res.setHeader('X-CSRF-Token', csrfToken);
            }

            return { success: true, user };
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
                    resolve();
                }
            });
        });

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
