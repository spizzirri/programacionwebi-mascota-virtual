// API Client for backend communication

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:3000';

interface User {
    _id: string;
    email: string;
    streak: number;
    createdAt: string;
}

interface Question {
    _id: string;
    text: string;
    topic: string;
}

interface Answer {
    _id: string;
    userId: string;
    questionId: string;
    questionText: string;
    userAnswer: string;
    rating: 'correct' | 'partial' | 'incorrect';
    feedback: string;
    timestamp: string;
}

async function apiRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include', // Important for session cookies
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Request failed');
    }

    return response.json();
}

export const api = {
    // Auth endpoints
    async register(email: string, password: string): Promise<User> {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        return data.user!;
    },

    async login(email: string, password: string): Promise<User> {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        return data.user!;
    },

    async logout(): Promise<void> {
        await apiRequest('/auth/logout', { method: 'POST' });
    },

    async getCurrentUser(): Promise<User> {
        const data = await apiRequest('/auth/me');
        return data.user!;
    },

    // Questions endpoints
    async getRandomQuestion(): Promise<Question> {
        const data = await apiRequest('/questions/random');
        return data.question!;
    },

    // Answers endpoints
    async submitAnswer(
        questionId: string,
        questionText: string,
        userAnswer: string
    ): Promise<{
        rating: 'correct' | 'partial' | 'incorrect';
        feedback: string;
        newStreak: number;
    }> {
        const data = await apiRequest('/answers/submit', {
            method: 'POST',
            body: JSON.stringify({ questionId, questionText, userAnswer }),
        });
        return {
            rating: data.rating!,
            feedback: data.feedback!,
            newStreak: data.newStreak!,
        };
    },

    // Users endpoints
    async getProfile(): Promise<User> {
        const data = await apiRequest('/users/profile');
        return data.profile!;
    },

    async getHistory(limit = 50): Promise<Answer[]> {
        const data = await apiRequest(
            `/users/history?limit=${limit}`
        );
        return data.history!;
    },
};

export type { User, Question, Answer };
