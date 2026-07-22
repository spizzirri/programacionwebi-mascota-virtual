import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as vm from 'vm';
import { ProblemService } from './services/problem.service';
import { Problem, TestCase } from '../database/schemas/problem.schema';
import { problemSeeds } from './seed.data';

export interface TestResult {
    input: unknown;
    expected: unknown;
    actual: unknown;
    passed: boolean;
    hidden: boolean;
}

export interface RunResponse {
    results: TestResult[];
    allPassed: boolean;
    error: string | null;
}

const OCULTO = '[oculto]';

@Injectable()
export class SandboxService implements OnModuleInit {
    private readonly logger = new Logger(SandboxService.name);

    constructor(private readonly problemService: ProblemService) {}

    async onModuleInit() {
        await this.seedProblems();
    }

    async seedProblems(): Promise<void> {
        const count = await this.problemService.countProblems();
        if (count > 0) {
            return;
        }
        for (const seed of problemSeeds) {
            await this.problemService.createProblem(seed);
        }
        this.logger.log(`Seeded ${problemSeeds.length} problems`);
    }

    async getProblems(): Promise<SanitizedProblem[]> {
        const problems = await this.problemService.getActiveProblems();
        return problems.map((p) => this.sanitize(p));
    }

    async runCode(problemId: string, code: string): Promise<RunResponse> {
        let problem: Problem;
        try {
            problem = await this.problemService.getProblemById(problemId);
        } catch (err: any) {
            return { results: [], allPassed: false, error: err?.message ?? 'Problem not found' };
        }

        const results: TestResult[] = [];
        let allPassed = true;

        for (const tc of problem.testCases) {
            const runOutcome = this.runTestCase(code, tc);
            if (runOutcome.error) {
                return {
                    results: this.withPreviousMasks(results).concat(runOutcome.result),
                    allPassed: false,
                    error: runOutcome.error,
                };
            }
            if (!runOutcome.result.passed) {
                allPassed = false;
            }
            results.push(runOutcome.result);
        }

        return { results, allPassed, error: null };
    }

    private runTestCase(code: string, tc: TestCase): { result: TestResult; error: string | null } {
        try {
            const sandbox: Record<string, unknown> = {};
            const context = vm.createContext(sandbox);
            const script = new vm.Script(code);
            script.runInContext(context, { timeout: 1000 });

            const solve = sandbox.solve;
            if (typeof solve !== 'function') {
                return {
                    result: this.maskedResult(tc, null, false),
                    error: 'solve function not defined',
                };
            }

            const actual = (solve as (...args: unknown[]) => unknown)(...tc.input);
            const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
            return {
                result: {
                    input: tc.sample ? tc.input : OCULTO,
                    expected: tc.sample ? tc.expected : OCULTO,
                    actual,
                    passed,
                    hidden: !tc.sample,
                },
                error: null,
            };
        } catch (err: any) {
            return {
                result: {
                    input: tc.sample ? tc.input : OCULTO,
                    expected: tc.sample ? tc.expected : OCULTO,
                    actual: null,
                    passed: false,
                    hidden: !tc.sample,
                },
                error: err?.message ?? 'Runtime error',
            };
        }
    }

    private withPreviousMasks(results: TestResult[]): TestResult[] {
        return results.map((r) => r.hidden ? { ...r, input: OCULTO, expected: OCULTO } : r);
    }

    private maskedResult(tc: TestCase, actual: unknown, passed: boolean): TestResult {
        return {
            input: tc.sample ? tc.input : OCULTO,
            expected: tc.sample ? tc.expected : OCULTO,
            actual,
            passed,
            hidden: !tc.sample,
        };
    }

    private sanitize(problem: Problem): SanitizedProblem {
        return {
            _id: (problem as any)._id?.toString?.() ?? (problem as any)._id,
            title: problem.title,
            description: problem.description,
            params: problem.params,
            testCases: problem.testCases.map((tc) =>
                tc.sample
                    ? { input: tc.input, expected: tc.expected, sample: true }
                    : { input: OCULTO, expected: OCULTO, sample: false },
            ),
            active: problem.active,
        };
    }
}

export interface SanitizedProblem {
    _id: string;
    title: string;
    description: string;
    params: string[];
    testCases: Array<{ input: unknown; expected: unknown; sample: boolean }>;
    active: boolean;
}