import { api } from '../api';
import { DOMManager } from '../dom-manager';

interface Problem {
  id: number;
  title: string;
  description: string;
  params: string[];
  testCases: { input: number[]; expected: any }[];
}

export class SandboxView extends DOMManager {
  private problems: Problem[] = [];
  private currentProblem: Problem | null = null;
  private syntaxValid: boolean = false;
  private isRunning: boolean = false;

  private problemSelector: HTMLSelectElement;
  private problemDescription: HTMLElement;
  private codeEditor: HTMLTextAreaElement;
  private editorHighlight: HTMLElement;
  private syntaxStatus: HTMLElement;
  private runBtn: HTMLButtonElement;
  private resultsContainer: HTMLElement;
  private resultsBanner: HTMLElement;
  private resultsBody: HTMLElement;
  private highlightCode: HTMLElement;

  private readonly KEYWORDS = /\b(function|return|const|let|var|if|else|for|while|true|false|null|undefined|new|typeof|class|this)\b/g;
  private readonly NUMBERS = /\b(-?\d+\.?\d*)\b/g;

  constructor() {
    super();
    this.problemSelector = this.getElementSafe<HTMLSelectElement>('#problem-selector');
    this.problemDescription = this.getElementSafe<HTMLElement>('#problem-description');
    this.codeEditor = this.getElementSafe<HTMLTextAreaElement>('#code-editor');
    this.editorHighlight = this.getElementSafe<HTMLElement>('#editor-highlight');
    this.syntaxStatus = this.getElementSafe<HTMLElement>('#syntax-status');
    this.runBtn = this.getElementSafe<HTMLButtonElement>('#run-btn');
    this.resultsContainer = this.getElementSafe<HTMLElement>('#results-container');
    this.resultsBanner = this.getElementSafe<HTMLElement>('#results-banner');
    this.resultsBody = this.getElementSafe<HTMLElement>('#results-body');
    this.highlightCode = this.getElementSafe<HTMLElement>('#editor-highlight code');

    this.setupEventListeners();
    this.loadProblems();
  }

  destroy(): void {
    super.destroy();
  }

  private setupEventListeners(): void {
    this.attachEvent(this.problemSelector, 'change', () => this.onProblemChange());
    this.attachEvent(this.codeEditor, 'input', () => this.onCodeChange());
    this.attachEvent(this.codeEditor, 'keydown', (e) => this.handleKeyDown(e));
    this.attachEvent(this.codeEditor, 'scroll', () => {
      this.editorHighlight.scrollTop = this.codeEditor.scrollTop;
      this.editorHighlight.scrollLeft = this.codeEditor.scrollLeft;
    });
    this.attachEvent(this.runBtn, 'click', () => this.handleRun());
  }

  private async loadProblems(): Promise<void> {
    try {
      this.problems = await api.getSandboxProblems();
      this.problemSelector.innerHTML = '<option value="">Seleccioná un problema...</option>' +
        this.problems.map(p =>
          `<option value="${p.id}">${p.title}</option>`
        ).join('');
    } catch {
      this.showAlert('Error al cargar problemas');
    }
  }

  private onProblemChange(): void {
    const id = parseInt(this.problemSelector.value);
    this.currentProblem = this.problems.find(p => p.id === id) || null;

    if (this.currentProblem) {
      this.problemDescription.textContent = this.currentProblem.description;
      this.codeEditor.value = '';
      this.syntaxStatus.textContent = '';
      this.syntaxStatus.className = 'syntax-status';
      this.addClass(this.resultsContainer, 'hidden');
      this.runBtn.disabled = true;
      this.syntaxValid = false;
      this.highlightCode.innerHTML = '';
    } else {
      this.problemDescription.textContent = 'Seleccioná un problema para empezar.';
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.codeEditor.selectionStart;
      const end = this.codeEditor.selectionEnd;
      const value = this.codeEditor.value;
      this.codeEditor.value = value.substring(0, start) + '  ' + value.substring(end);
      this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + 2;
      this.onCodeChange();
    }
  }

  private onCodeChange(): void {
    this.highlight();
    this.validateSyntax();
    if (this.currentProblem) {
      this.addClass(this.resultsContainer, 'hidden');
    }
  }

  private highlight(): void {
    const code = this.codeEditor.value;
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const { text: tokenized, tokens } = this.extractStringAndCommentTokens(escaped);

    let highlighted = tokenized
      .replace(this.KEYWORDS, '<span class="keyword">$1</span>')
      .replace(this.NUMBERS, '<span class="number">$1</span>');

    tokens.forEach(({ id, html }) => {
      highlighted = highlighted.replace(id, html);
    });

    // El textarea siempre reserva una línea vacía final cuando el valor
    // termina en '\n', pero el <pre> no la renderiza. Agregamos un <br>
    // extra para mantener la altura de scroll sincronizada con el cursor.
    if (code.endsWith('\n')) {
      highlighted += '<br>';
    }

    this.highlightCode.innerHTML = highlighted;
  }

  private extractStringAndCommentTokens(text: string): { text: string; tokens: { id: string; html: string }[] } {
    const tokens: { id: string; html: string }[] = [];
    const combinedRegex = /(\/\/.*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;

    const tokenized = text.replace(combinedRegex, (match) => {
      const id = `__TOKEN_${tokens.length}__`;
      const cssClass = match.startsWith('//') || match.startsWith('/*') ? 'comment' : 'string';
      tokens.push({ id, html: `<span class="${cssClass}">${match}</span>` });
      return id;
    });

    return { text: tokenized, tokens };
  }

  private validateSyntax(): void {
    const code = this.codeEditor.value.trim();
    if (!code) {
      this.syntaxStatus.textContent = '';
      this.syntaxStatus.className = 'syntax-status';
      this.runBtn.disabled = true;
      this.syntaxValid = false;
      return;
    }

    try {
      new Function('solve', code);
      this.syntaxStatus.textContent = '✓ Sintaxis válida';
      this.syntaxStatus.className = 'syntax-status valid';
      this.runBtn.disabled = false;
      this.syntaxValid = true;
    } catch (e: any) {
      this.syntaxStatus.textContent = `✗ ${e.message}`;
      this.syntaxStatus.className = 'syntax-status invalid';
      this.runBtn.disabled = true;
      this.syntaxValid = false;
    }
  }

  private async handleRun(): Promise<void> {
    if (!this.currentProblem || !this.syntaxValid || this.isRunning) return;

    this.isRunning = true;
    this.runBtn.disabled = true;
    this.runBtn.textContent = 'Ejecutando...';

    try {
      const result = await api.runSandboxCode(this.currentProblem.id, this.codeEditor.value);

      this.removeClass(this.resultsContainer, 'hidden');

      if (result.error) {
        this.resultsBanner.textContent = `❌ Error: ${result.error}`;
        this.resultsBanner.className = 'results-banner error';
        this.resultsBody.innerHTML = '';
        return;
      }

      this.resultsBanner.textContent = result.allPassed
        ? '✅ Todos los tests pasaron'
        : `❌ Fallaron ${result.results.filter(r => !r.passed).length} tests`;
      this.resultsBanner.className = `results-banner ${result.allPassed ? 'all-passed' : 'some-failed'}`;

      this.resultsBody.innerHTML = result.results.map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>(${r.input.join(', ')})</td>
          <td>${JSON.stringify(r.expected)}</td>
          <td>${JSON.stringify(r.actual)}</td>
          <td class="${r.passed ? 'status-pass' : 'status-fail'}">${r.passed ? '✓' : '✗'}</td>
        </tr>
      `).join('');
    } catch (err: any) {
      this.showAlert(err.message || 'Error al ejecutar código');
    } finally {
      this.isRunning = false;
      this.runBtn.textContent = '▶ Ejecutar';
      this.runBtn.disabled = false;
      this.validateSyntax();
    }
  }
}
