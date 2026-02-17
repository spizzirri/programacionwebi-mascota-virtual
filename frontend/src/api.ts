// API Client for backend communication

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:3000';

interface User {
    _id: string;
    email: string;
    role: 'PROFESSOR' | 'STUDENT';
    streak: number;
    currentQuestionId: string | null;
    lastQuestionAssignedAt: string | null;
    password?: string;
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
    async register(email: string, password: string, role: string): Promise<User> {
        const data = await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify({ email, password, role }),
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
    async getRandomQuestion(): Promise<{ question: Question; hasAnswered: boolean }> {
        const data = await apiRequest('/questions/random');
        return data;
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
    async getProfile(userId?: string): Promise<User> {
        const endpoint = userId ? `/users/${userId}/profile` : '/users/profile';
        const data = await apiRequest(endpoint);
        return data.profile!;
    },

    async getHistory(limit = 50, userId?: string): Promise<Answer[]> {
        const endpoint = userId
            ? `/users/${userId}/history?limit=${limit}`
            : `/users/history?limit=${limit}`;
        const data = await apiRequest(endpoint);
        return data.history!;
    },

    async getAllUsers(): Promise<(User & { currentQuestionText: string })[]> {
        const data = await apiRequest('/users');
        return data.users!;
    },

    async createUser(user: Partial<User>): Promise<User> {
        const data = await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(user),
        });
        return data.user!;
    },

    async updateUser(id: string, user: Partial<User>): Promise<User> {
        const data = await apiRequest(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(user),
        });
        return data.user!;
    },

    async deleteUser(id: string): Promise<void> {
        await apiRequest(`/users/${id}`, { method: 'DELETE' });
    },
};

export type { User, Question, Answer };
