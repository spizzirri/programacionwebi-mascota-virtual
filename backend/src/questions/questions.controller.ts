import { Controller, Get, Post, Patch, Delete, Param, Body, Session, HttpException, HttpStatus } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { DatabaseService } from '../database/database.service';

interface SessionData {
    userId?: string;
}

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
    async getAllQuestions(@Session() session: SessionData) {
        await this.checkProfessor(session);
        const questions = await this.db.getAllQuestions();
        return { questions };
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
