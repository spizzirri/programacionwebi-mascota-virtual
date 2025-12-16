import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { DatabaseService, Answer } from '../database/database.service';

interface ValidationResult {
    rating: 'correct' | 'partial' | 'incorrect';
    feedback: string;
}

@Injectable()
export class AnswersService {
    private client: GoogleGenAI;

    constructor(private readonly db: DatabaseService) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY not set. Answer validation will fail.');
        } else {
            this.client = new GoogleGenAI({ apiKey });
            console.log('✅ Gemini AI initialized with new @google/genai library');
        }
    }

    async validateAnswer(
        questionText: string,
        userAnswer: string,
    ): Promise<ValidationResult> {
        if (!this.client) {
            throw new Error('Gemini API not configured');
        }

        const prompt = `Eres un profesor de Programación Web I evaluando la respuesta de un estudiante.
        El nivel de la materia es básico, para principiantes que nunca han programado paginas web antes, por lo que no se espera que la respuesta sea compleja con un alto nivel de detalle.

        Pregunta: ${questionText}
        Respuesta del estudiante: ${userAnswer}

        Evalúa la respuesta y clasifícala en una de estas categorías:
        - "correct": La respuesta explica correctamente el concepto y es correcta y completa según el nivel de la materia
        - "partial": La respuesta explica parcialmente el concepto o no da ejemplos claros
        - "incorrect": La respuesta es incorrecta

        Responde ÚNICAMENTE en el siguiente formato JSON (sin markdown, sin bloques de código):
        {
        "rating": "correct" | "partial" | "incorrect",
        "feedback": "Breve explicación de no mas de 400 caracteres de por qué la respuesta es correcta/parcial/incorrecta"
        }`;

        try {
            const response = await this.client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            if (!response.text) {
                throw new Error('No response text from Gemini API');
            }

            const text = response.text;

            // Clean the response - remove markdown code blocks if present
            let cleanText = text.trim();
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
            // Fallback to simple validation
            return {
                rating: 'partial',
                feedback: 'No se pudo validar la respuesta automáticamente.',
            };
        }
    }

    async submitAnswer(
        userId: string,
        questionId: string,
        questionText: string,
        userAnswer: string,
    ): Promise<{ answer: Answer; newStreak: number }> {
        // Validate answer with Gemini
        const validation = await this.validateAnswer(questionText, userAnswer);

        // Get current user streak
        console.log('🔍 Looking for user with ID:', userId);
        const user = await this.db.findUserById(userId);
        console.log('🔍 User found:', user ? { id: user._id, email: user.email } : 'null');
        if (!user) {
            throw new Error('User not found');
        }

        let newStreak = user.streak;
        console.log('📊 Current streak:', newStreak, 'Type:', typeof newStreak);
        console.log('🤖 Validation rating:', validation.rating);

        // Update streak based on rating
        if (validation.rating === 'correct') {
            console.log('✅ Rating is correct, adding 1');
            newStreak += 1;
        } else if (validation.rating === 'partial') {
            console.log('⚠️ Rating is partial, adding 0.5');
            newStreak += 0.5;
        } else {
            console.log('❌ Rating is incorrect, resetting to 0');
            newStreak = 0;
        }
        console.log('📊 New calculated streak:', newStreak);

        // Update user streak
        await this.db.updateUserStreak(userId, newStreak);

        // Save answer
        const answer = await this.db.createAnswer({
            userId,
            questionId,
            questionText,
            userAnswer,
            rating: validation.rating,
            feedback: validation.feedback,
            timestamp: new Date(),
        });

        return { answer, newStreak };
    }
}
