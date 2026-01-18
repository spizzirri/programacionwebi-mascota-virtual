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

    async createUser(user: Omit<User, '_id'>): Promise<User> {
        const created = await this.users.insert(user);
        const verify = await this.users.findOne({ _id: created._id });
        return created;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return this.users.findOne({ email });
    }

    async findUserById(id: string): Promise<User | null> {
        const user = await this.users.findOne({ _id: id });
        return user;
    }

    async updateUserStreak(userId: string, streak: number): Promise<void> {
        await this.users.update({ _id: userId }, { $set: { streak } });
    }

    async createQuestion(question: Omit<Question, '_id'>): Promise<Question> {
        return this.questions.insert(question);
    }

    async getAllQuestions(): Promise<Question[]> {
        return this.questions.find({});
    }

    async getQuestionById(id: string): Promise<Question | null> {
        return this.questions.findOne({ _id: id });
    }

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
