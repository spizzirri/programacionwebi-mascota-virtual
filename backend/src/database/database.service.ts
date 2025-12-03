import { Injectable } from '@nestjs/common';
import Datastore from 'nedb-promises';

export interface User {
    _id?: string;
    email: string;
    password: string;
    streak: number;
    createdAt: Date;
}

export interface Question {
    _id?: string;
    text: string;
    topic: string;
}

export interface Answer {
    _id?: string;
    userId: string;
    questionId: string;
    questionText: string;
    userAnswer: string;
    rating: 'correct' | 'partial' | 'incorrect';
    feedback: string;
    timestamp: Date;
}

@Injectable()
export class DatabaseService {
    private users: Datastore<User>;
    private questions: Datastore<Question>;
    private answers: Datastore<Answer>;

    constructor() {
        // In-memory databases
        this.users = Datastore.create();
        this.questions = Datastore.create();
        this.answers = Datastore.create();
    }

    // User operations
    async createUser(user: Omit<User, '_id'>): Promise<User> {
        const created = await this.users.insert(user);
        console.log('💾 User created in DB:', { id: created._id, email: created.email });

        // Verify it was saved
        const verify = await this.users.findOne({ _id: created._id });
        console.log('🔍 Verification lookup:', verify ? 'Found' : 'NOT FOUND');

        return created;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return this.users.findOne({ email });
    }

    async findUserById(id: string): Promise<User | null> {
        console.log('🔍 findUserById called with:', id, 'type:', typeof id);
        const allUsers = await this.users.find({});
        console.log('📊 Total users in DB:', allUsers.length);
        if (allUsers.length > 0) {
            console.log('📊 User IDs in DB:', allUsers.map(u => ({ id: u._id, type: typeof u._id })));
        }
        const user = await this.users.findOne({ _id: id });
        console.log('🔍 findUserById result:', user ? 'FOUND' : 'NOT FOUND');
        return user;
    }

    async updateUserStreak(userId: string, streak: number): Promise<void> {
        await this.users.update({ _id: userId }, { $set: { streak } });
    }

    // Question operations
    async createQuestion(question: Omit<Question, '_id'>): Promise<Question> {
        return this.questions.insert(question);
    }

    async getAllQuestions(): Promise<Question[]> {
        return this.questions.find({});
    }

    async getQuestionById(id: string): Promise<Question | null> {
        return this.questions.findOne({ _id: id });
    }

    // Answer operations
    async createAnswer(answer: Omit<Answer, '_id'>): Promise<Answer> {
        return this.answers.insert(answer);
    }

    async getAnswersByUserId(userId: string, limit = 50): Promise<Answer[]> {
        return this.answers
            .find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit);
    }
}
