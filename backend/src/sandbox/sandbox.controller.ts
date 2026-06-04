import { Controller, Get, Post, Body } from '@nestjs/common';
import { SandboxService, RunResponse } from './sandbox.service';
import { Problem } from './problems.data';

@Controller('sandbox')
export class SandboxController {
  constructor(private readonly sandboxService: SandboxService) {}

  @Get('problems')
  getProblems(): Problem[] {
    return this.sandboxService.getProblems();
  }

  @Post('run')
  runCode(@Body() body: { problemId: number; code: string }): RunResponse {
    return this.sandboxService.runCode(body.problemId, body.code);
  }
}
