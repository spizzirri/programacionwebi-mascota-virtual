import { Controller, Get, Post, Patch, Delete, Param, Body, Session, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionService } from './services/question.service';
import type { SessionData } from '../common/types/session.types';
import { ProfessorGuard } from '../common/guards/professor.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { BulkCreateQuestionsDto } from './dto/bulk-create-questions.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Controller('questions')
export class QuestionsController {
    constructor(
        private readonly questionsService: QuestionsService,
        private readonly questionService: QuestionService,
    ) {}

    @Get('random')
    async getRandomQuestion(@Session() session: SessionData) {
        if (!session.userId) {
            throw new Error('Not authenticated');
        }

        const result = await this.questionsService.getRandomQuestion(session.userId);
        return result;
    }

    @Get()
    @UseGuards(ProfessorGuard)
    async getAllQuestions() {
        const questions = await this.questionService.getAllQuestions();
        return { questions };
    }

    @Post()
    @UseGuards(ProfessorGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createQuestion(@Body() body: CreateQuestionDto) {
        const question = await this.questionService.createQuestion(body);
        return { question };
    }

    @Patch(':id')
    @UseGuards(ProfessorGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateQuestion(@Param('id') id: string, @Body() body: UpdateQuestionDto) {
        const question = await this.questionService.updateQuestion(id, body);
        if (!question) {
            throw new Error('Question not found');
        }
        return { question };
    }

    @Delete(':id')
    @UseGuards(ProfessorGuard)
    async deleteQuestion(@Param('id') id: string) {
        await this.questionService.deleteQuestion(id);
        return { success: true };
    }

    @Post('bulk')
    @UseGuards(ProfessorGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createQuestionsBulk(@Body() body: BulkCreateQuestionsDto) {
        const questions = await this.questionService.createQuestions(body.questions);
        return { questions };
    }

    @Get('topics')
    @UseGuards(ProfessorGuard)
    async getAllTopics() {
        const topics = await this.questionService.getAllTopics();
        return { topics };
    }

    @Patch('topics/:name')
    @UseGuards(ProfessorGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateTopic(@Param('name') name: string, @Body() body: UpdateTopicDto) {
        const topic = await this.questionService.updateTopic(name, body);
        if (!topic) {
            throw new Error('Topic not found');
        }
        return { topic };
    }

    @Delete()
    @UseGuards(ProfessorGuard)
    async deleteAllQuestions() {
        await this.questionService.deleteAllQuestions();
        return { success: true };
    }
}
