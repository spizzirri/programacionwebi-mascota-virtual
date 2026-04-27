import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { UserService } from '../users/services/user.service';
import { SafeUser } from '../database/schemas/user.schema';
import { MAX_LOGIN_ATTEMPTS } from '../common/constants/auth.constants';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) {}

    async login(email: string, password: string): Promise<SafeUser> {
        const user = await this.userService.findUserByEmail(email);

        if (user) {
            const lockStatus = await this.userService.isUserLocked(user);
            if (lockStatus.isLocked) {
                throw new UnauthorizedException(
                    `usuario bloqueado, intente nuevamente en ${lockStatus.minutesLeft} minutos`,
                );
            }

            if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS && !lockStatus.isLocked) {
                await this.userService.autoUnlockUser(email);
            }
        }

        const dummyHash = '$2b$10$fV2sc6eY0V8fW.K0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X';
        const hashToCompare = user ? user.password : dummyHash;
        const isPasswordValid = await compare(password, hashToCompare);

        if (!user || !isPasswordValid) {
            if (user) {
                const updatedUser = await this.userService.incrementFailedLoginAttempts(email);
                if (updatedUser && updatedUser.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                    await this.userService.lockUser(email);
                    throw new UnauthorizedException('usuario bloqueado por 15 minutos');
                }
            }
            throw new UnauthorizedException('usuario o contraseña incorrectos');
        }

        await this.userService.resetFailedLoginAttempts(email);

        if (user.lastQuestionAnsweredCorrectly) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (new Date(user.lastQuestionAnsweredCorrectly) < yesterday) {
                await this.userService.updateUserStreak(user._id.toString(), 0);
                user.streak = 0;
            }
        }

        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async getUserById(id: string): Promise<SafeUser | null> {
        const user = await this.userService.findUserById(id);
        if (!user) {
            return null;
        }

        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }
}
