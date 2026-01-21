import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { DatabaseService, User } from '../database/database.service';

@Injectable()
export class AuthService {
    constructor(private readonly db: DatabaseService) { }

    async register(email: string, password: string): Promise<Omit<User, 'password'> & { _id: any }> {
        // Check if user already exists
        const existingUser = await this.db.findUserByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const hashedPassword = await hash(password, 10);

        // Create user
        const user = await this.db.createUser({
            email,
            password: hashedPassword,
            streak: 0,
            createdAt: new Date(),
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async login(email: string, password: string): Promise<Omit<User, 'password'> & { _id: any }> {
        // Find user
        const user = await this.db.findUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async getUserById(id: string): Promise<(Omit<User, 'password'> & { _id: any }) | null> {
        const user = await this.db.findUserById(id);
        if (!user) {
            return null;
        }

        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }
}
