import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { SafeUser } from '../database/schemas/user.schema';

@Injectable()
export class AuthService {
    constructor(private readonly db: DatabaseService) { }


    async login(email: string, password: string): Promise<SafeUser> {
        const user = await this.db.findUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
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
