
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:3000';

let csrfToken: string | null = null;

interface User {
    _id: string;
    email: string;
    role: 'PROFESSOR' | 'STUDENT';
    streak: number;
    currentQuestionId: string | null;
    lastQuestionAssignedAt: string | null;
    password?: string;
    createdAt: string;
    commission?: 'MAÑANA' | 'NOCHE';
}

interface Question {
    _id: string;
    text: string;
    topic: string;
}

interface Topic {
    name: string;
    enabled: boolean;
    startDate?: string;
    endDate?: string;
}

interface Answer {
    _id: string;
    userId: string;
    questionId: string;
    questionText: string;
    userAnswer: string;
    rating: 'correct' | 'partial' | 'incorrect';
    feedback: string;
    suggestedAnswer?: string;
    timestamp: string;
}

interface Appeal {
    _id: string;
    userId: string;
    userName: string;
    answerId: string;
    questionId: string;
    questionText: string;
    userAnswer: string;
    originalRating: 'correct' | 'partial' | 'incorrect';
    originalFeedback: string;
    status: 'pending' | 'accepted' | 'rejected';
    professorFeedback?: string;
    createdAt: string;
    resolvedAt?: string;
}

async function apiRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (csrfToken && options.method && options.method !== 'GET') {
        headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers,
    });

    if (response.headers.has('X-CSRF-Token')) {
        csrfToken = response.headers.get('X-CSRF-Token');
    }

    if (!response.ok) {
        if (response.status === 401 && endpoint !== '/auth/login') {
            window.dispatchEvent(new CustomEvent('session-expired'));
            throw new Error('Sesión vencida');
        }

        const errorText = await response.text();
        let errorMessage = errorText || 'Request failed';
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
                errorMessage = errorJson.message;
            }
        } catch {
        }
        throw new Error(errorMessage);
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

    async getRandomQuestion(): Promise<{
        question: Question;
        hasAnswered: boolean;
        answerId?: string;
        rating?: string;
    }> {
        const data = await apiRequest('/questions/random');
        return data;
    },

    async getAllQuestions(): Promise<Question[]> {
        const data = await apiRequest('/questions');
        return data.questions.data;
    },

    async createQuestion(question: Partial<Question>): Promise<Question> {
        const data = await apiRequest('/questions', {
            method: 'POST',
            body: JSON.stringify(question),
        });
        return data.question!;
    },

    async updateQuestion(id: string, question: Partial<Question>): Promise<Question> {
        const data = await apiRequest(`/questions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(question),
        });
        return data.question!;
    },

    async deleteQuestion(id: string): Promise<void> {
        await apiRequest(`/questions/${id}`, { method: 'DELETE' });
    },

    async deleteAllQuestions(): Promise<void> {
        await apiRequest('/questions', { method: 'DELETE' });
    },

    async createQuestionsBulk(questions: { text: string, topic: string }[]): Promise<Question[]> {
        const data = await apiRequest('/questions/bulk', {
            method: 'POST',
            body: JSON.stringify({ questions }),
        });
        return data.questions!;
    },

    async getAllTopics(): Promise<Topic[]> {
        const data = await apiRequest('/questions/topics');
        return data.topics!;
    },

    async updateTopic(name: string, topic: Partial<Topic>): Promise<Topic> {
        const data = await apiRequest(`/questions/topics/${name}`, {
            method: 'PATCH',
            body: JSON.stringify(topic),
        });
        return data.topic!;
    },

    async submitAnswer(
        questionId: string,
        userAnswer: string
    ): Promise<{
        rating: 'correct' | 'partial' | 'incorrect';
        feedback: string;
        suggestedAnswer?: string;
        newStreak: number;
        answerId: string;
    }> {
        const data = await apiRequest('/answers/submit', {
            method: 'POST',
            body: JSON.stringify({ questionId, userAnswer }),
        });
        return {
            rating: data.rating!,
            feedback: data.feedback!,
            suggestedAnswer: data.suggestedAnswer,
            newStreak: data.newStreak!,
            answerId: data.answer?._id || data.answerId,
        };
    },

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
        return data.users.data;
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

    async updateProfilePassword(currentPassword: string, newPassword: string): Promise<void> {
        await apiRequest('/users/profile/password', {
            method: 'PATCH',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    async createAppeal(answerId: string): Promise<Appeal> {
        return apiRequest('/appeals', {
            method: 'POST',
            body: JSON.stringify({ answerId }),
        });
    },

    async getMyAppeals(): Promise<Appeal[]> {
        return apiRequest('/appeals/my');
    },

    async getAllAppeals(): Promise<Appeal[]> {
        const data = await apiRequest('/appeals');
        return data.appeals.data;
    },

    async resolveAppeal(id: string, status: 'accepted' | 'rejected', feedback: string): Promise<Appeal> {
        return apiRequest(`/appeals/${id}/resolve`, {
            method: 'PATCH',
            body: JSON.stringify({ status, feedback }),
        });
    },
};

export type { User, Question, Answer, Appeal, Topic };
