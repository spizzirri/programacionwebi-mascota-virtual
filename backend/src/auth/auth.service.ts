import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { SafeUser } from '../database/schemas/user.schema';

@Injectable()
export class AuthService {
    constructor(private readonly db: DatabaseService) { }


    async login(email: string, password: string): Promise<SafeUser> {
        const user = await this.db.findUserByEmail(email);

        if (user && user.failedLoginAttempts >= 3) {
            if (user.lockedUntil && new Date() < user.lockedUntil) {
                const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
                throw new UnauthorizedException(`usuario bloqueado, intente nuevamente en ${minutesLeft} minutos`);
            }
            // Lock has expired, auto-unlock
            await this.db.unlockUser(email);
        }

        const dummyHash = '$2b$10$fV2sc6eY0V8fW.K0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X';
        const hashToCompare = user ? user.password : dummyHash;
        const isPasswordValid = await compare(password, hashToCompare);

        if (!user || !isPasswordValid) {
            if (user) {
                const updatedUser = await this.db.incrementFailedLoginAttempts(email);
                if (updatedUser && updatedUser.failedLoginAttempts >= 3) {
                    await this.db.lockUser(email, 15);
                    throw new UnauthorizedException('usuario bloqueado por 15 minutos');
                }
            }
            throw new UnauthorizedException('usuario o contraseña incorrectos');
        }

        await this.db.resetFailedLoginAttempts(email);

        if (user.lastQuestionAnsweredCorrectly) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (new Date(user.lastQuestionAnsweredCorrectly) < yesterday) {
                await this.db.updateUserStreak(user._id.toString(), 0);
                user.streak = 0;
            }
        }

        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async getUserById(id: string): Promise<SafeUser | null> {
        const user = await this.db.findUserById(id);
        if (!user) {
            return null;
        }

        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }
}
