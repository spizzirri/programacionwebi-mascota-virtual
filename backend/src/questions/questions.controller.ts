import { Controller, Get, Post, Patch, Delete, Param, Body, Session, HttpException, HttpStatus, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { DatabaseService } from '../database/database.service';
import { SessionData } from '../common/types/session.types';
import { paginate } from '../common/types/pagination.types';

@Controller('questions')
export class QuestionsController {
    constructor(
        private readonly questionsService: QuestionsService,
        private readonly db: DatabaseService,
    ) { }

    @Get('random')
    async getRandomQuestion(@Session() session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }

        const result = await this.questionsService.getRandomQuestion(session.userId);
        return result;
    }

    @Get()
    async getAllQuestions(
        @Session() session: SessionData,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        await this.checkProfessor(session);

        const pageNum = Math.max(1, parseInt(page || '1', 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

        const { data: questions, total } = await this.db.getAllQuestionsPaginated(pageNum, limitNum);
        return {
            questions: paginate(questions, total, pageNum, limitNum),
        };
    }

    @Post()
    async createQuestion(@Session() session: SessionData, @Body() body: any) {
        await this.checkProfessor(session);
        const question = await this.db.createQuestion(body);
        return { question };
    }

    @Patch(':id')
    async updateQuestion(@Session() session: SessionData, @Param('id') id: string, @Body() body: any) {
        await this.checkProfessor(session);
        const question = await this.db.updateQuestion(id, body);
        if (!question) {
            throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
        }
        return { question };
    }

    @Delete(':id')
    async deleteQuestion(@Session() session: SessionData, @Param('id') id: string) {
        await this.checkProfessor(session);
        await this.db.deleteQuestion(id);
        return { success: true };
    }

    @Post('bulk')
    async createQuestionsBulk(@Session() session: SessionData, @Body() body: { questions: { text: string, topic: string }[] }) {
        await this.checkProfessor(session);
        if (!body.questions || !Array.isArray(body.questions)) {
            throw new HttpException('Invalid questions data', HttpStatus.BAD_REQUEST);
        }
        const questions = await this.db.createQuestions(body.questions);
        return { questions };
    }

    @Get('topics')
    async getAllTopics(@Session() session: SessionData) {
        await this.checkProfessor(session);
        const topics = await this.db.getAllTopics();
        return { topics };
    }

    @Patch('topics/:name')
    async updateTopic(@Session() session: SessionData, @Param('name') name: string, @Body() body: any) {
        await this.checkProfessor(session);
        const topic = await this.db.updateTopic(name, body);
        if (!topic) {
            throw new HttpException('Topic not found', HttpStatus.NOT_FOUND);
        }
        return { topic };
    }

    @Delete()
    async deleteAllQuestions(@Session() session: SessionData) {
        await this.checkProfessor(session);
        await this.db.deleteAllQuestions();
        return { success: true };
    }

    private async checkProfessor(session: SessionData) {
        if (!session.userId) {
            throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
        }
        const user = await this.db.findUserById(session.userId);
        if (!user || user.role !== 'PROFESSOR') {
            throw new HttpException('Forbidden: Only professors can access this resource', HttpStatus.FORBIDDEN);
        }
    }
}
