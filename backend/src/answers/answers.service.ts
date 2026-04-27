import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { QuestionService } from '../questions/services/question.service';
import { UserService } from '../users/services/user.service';
import { AnswerService } from './services/answer.service';
import { Answer } from '../database/schemas/answer.schema';
import {
    GEMINI_SYSTEM_INSTRUCTION,
    GEMINI_MODEL,
    GEMINI_RESPONSE_MIME_TYPE,
} from '../common/constants/gemini.constants';
import { PROFESSOR_ROLE } from '../common/constants/roles.constants';

interface ValidationResult {
    rating: 'correct' | 'partial' | 'incorrect';
    feedback: string;
    suggestedAnswer?: string;
}

export interface SubmitAnswerResult {
    answer: Answer;
    newStreak: number;
}

@Injectable()
export class AnswersService {
    private client: GoogleGenAI;

    constructor(
        private readonly answerService: AnswerService,
        private readonly questionService: QuestionService,
        private readonly userService: UserService,
    ) {
        const apiKey = process.env.GEMINI_API_KEY;
        const baseUrl = process.env.GEMINI_BASE_URL;

        if (!apiKey) {
            console.error('GEMINI_API_KEY not set. Answer validation will fail.');
        } else {
            const options: any = { apiKey };
            if (baseUrl) {
                options.httpOptions = { baseUrl };
            }
            this.client = new GoogleGenAI(options);
        }
    }

    async validateAnswer(questionText: string, userAnswer: string): Promise<ValidationResult> {
        if (!this.client) {
            throw new InternalServerErrorException('Gemini API not configured');
        }

        const userMessage = `Pregunta oficial: "${questionText}"
        Respuesta del estudiante: <answer>${userAnswer}</answer>`;

        try {
            const response = await this.client.models.generateContent({
                model: GEMINI_MODEL,
                contents: userMessage,
                config: {
                    systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
                    responseMimeType: GEMINI_RESPONSE_MIME_TYPE,
                },
            });

            if (!response.text) {
                throw new Error('No response text from Gemini API');
            }

            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```\n?/g, '');
            }

            const parsed = JSON.parse(cleanText);

            return {
                rating: parsed.rating,
                feedback: parsed.feedback,
            };
        } catch (error) {
            console.error('Error validating answer:', error);
            throw new InternalServerErrorException('LLM_CONNECTION_ERROR');
        }
    }

    async submitAnswer(userId: string, questionId: string, userAnswer: string): Promise<SubmitAnswerResult> {
        const question = await this.questionService.getQuestionById(questionId);

        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const existingAnswer = await this.answerService.getAnswerForQuestionToday(userId, questionId);
        if (existingAnswer && user.role !== PROFESSOR_ROLE) {
            throw new Error('Ya has respondido la pregunta del día, vuelve mañana');
        }

        const validation = await this.validateAnswer(question.text, userAnswer);

        let newStreak = user.streak;

        if (validation.rating === 'correct') {
            newStreak += 1;
        } else if (validation.rating === 'partial') {
            newStreak += 0.5;
        } else {
            newStreak = 0;
        }

        const updateLastCorrectDate = validation.rating === 'correct' || validation.rating === 'partial';
        await this.userService.updateUserStreak(userId, newStreak, updateLastCorrectDate);

        const answer = await this.answerService.createAnswer({
            userId,
            questionId,
            questionText: question.text,
            userAnswer,
            rating: validation.rating,
            feedback: validation.feedback,
            suggestedAnswer: question.answer,
            timestamp: new Date(),
            streakAtMoment: user.streak,
        });

        return { answer, newStreak };
    }
}
