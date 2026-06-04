import { Injectable } from '@nestjs/common';
import * as vm from 'vm';
import { problems, Problem } from './problems.data';

interface TestResult {
  input: number[];
  expected: any;
  actual: any;
  passed: boolean;
}

export interface RunResponse {
  results: TestResult[];
  allPassed: boolean;
  error: string | null;
}

@Injectable()
export class SandboxService {
  getProblems(): Problem[] {
    return problems;
  }

  runCode(problemId: number, code: string): RunResponse {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) {
      return { results: [], allPassed: false, error: 'Problem not found' };
    }

    const results: TestResult[] = [];
    let allPassed = true;

    for (const tc of problem.testCases) {
      try {
        const sandbox: any = {};
        const context = vm.createContext(sandbox);
        const script = new vm.Script(code);
        script.runInContext(context, { timeout: 5000 });

        if (typeof sandbox.solve !== 'function') {
          return { results: [], allPassed: false, error: 'solve function not defined' };
        }

        const actual = sandbox.solve(...tc.input);
        const passed = JSON.stringify(actual) === JSON.stringify(tc.expected);
        if (!passed) allPassed = false;
        results.push({ input: tc.input, expected: tc.expected, actual, passed });
      } catch (err: any) {
        allPassed = false;
        results.push({ input: tc.input, expected: tc.expected, actual: null, passed: false });
        return { results, allPassed: false, error: err.message };
      }
    }

    return { results, allPassed, error: null };
  }
}
