import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    UsePipes,
    ValidationPipe,
    NotFoundException,
} from '@nestjs/common';
import { SandboxService } from './sandbox.service';
import { ProblemService } from './services/problem.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { ProfessorGuard } from '../common/guards/professor.guard';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { RunCodeDto } from './dto/run-code.dto';

@Controller('sandbox')
export class SandboxController {
    constructor(
        private readonly sandboxService: SandboxService,
        private readonly problemService: ProblemService,
    ) {}

    @Get('problems')
    @UseGuards(AuthGuard)
    async getProblems() {
        return this.sandboxService.getProblems();
    }

    @Get('problems/admin')
    @UseGuards(ProfessorGuard)
    async getAllForAdmin() {
        const problems = await this.problemService.getAllProblemsForAdmin();
        return { problems };
    }

    @Get('problems/:id')
    @UseGuards(AuthGuard)
    async getProblem(@Param('id') id: string) {
        const problem = await this.problemService.getProblemById(id);
        return { problem };
    }

    @Post('run')
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async runCode(@Body() body: RunCodeDto) {
        return this.sandboxService.runCode(body.problemId, body.code);
    }

    @Post('problems')
    @UseGuards(ProfessorGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async createProblem(@Body() body: CreateProblemDto) {
        const problem = await this.problemService.createProblem(body);
        return { problem };
    }

    @Patch('problems/:id')
    @UseGuards(ProfessorGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateProblem(@Param('id') id: string, @Body() body: UpdateProblemDto) {
        const problem = await this.problemService.updateProblem(id, body);
        if (!problem) {
            throw new NotFoundException('Problem not found');
        }
        return { problem };
    }

    @Delete('problems/:id')
    @UseGuards(ProfessorGuard)
    async deleteProblem(@Param('id') id: string) {
        await this.problemService.deleteProblem(id);
        return { success: true };
    }
}