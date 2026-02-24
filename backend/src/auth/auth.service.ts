import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { SafeUser } from '../database/schemas/user.schema';

@Injectable()
export class AuthService {
    constructor(private readonly db: DatabaseService) { }


    async login(email: string, password: string): Promise<SafeUser> {
        const user = await this.db.findUserByEmail(email);

        // Constant-time check mitigation
        const dummyHash = '$2b$10$fV2sc6eY0V8fW.K0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X'; // A valid-looking bcrypt hash
        const hashToCompare = user ? user.password : dummyHash;
        const isPasswordValid = await compare(password, hashToCompare);

        if (!user || !isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

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
