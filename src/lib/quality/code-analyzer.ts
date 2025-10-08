import { ESLint } from 'eslint';

export interface CodeIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  ruleId: string | null;
  fixable: boolean;
}

export interface CodeSmell {
  type: string;
  file: string;
  line?: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface AnalysisResult {
  issues: CodeIssue[];
  smells: CodeSmell[];
  totalErrors: number;
  totalWarnings: number;
  filesAnalyzed: number;
}

/**
 * Code quality analyzer using ESLint
 */
export class CodeAnalyzer {
  private eslint: ESLint;
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    this.eslint = new ESLint({
      cwd,
      fix: false, // Don't auto-fix by default
    });
  }

  /**
   * Analyze code quality in files or directories
   */
  async analyze(patterns: string[]): Promise<AnalysisResult> {
    const results = await this.eslint.lintFiles(patterns);

    const issues: CodeIssue[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const result of results) {
      if (result.errorCount === 0 && result.warningCount === 0) {
        continue;
      }

      totalErrors += result.errorCount;
      totalWarnings += result.warningCount;

      for (const message of result.messages) {
        issues.push({
          file: result.filePath,
          line: message.line,
          column: message.column,
          severity: message.severity === 2 ? 'error' : message.severity === 1 ? 'warning' : 'info',
          message: message.message,
          ruleId: message.ruleId,
          fixable: message.fix !== undefined,
        });
      }
    }

    // Detect code smells
    const smells = this.detectCodeSmells(results);

    return {
      issues,
      smells,
      totalErrors,
      totalWarnings,
      filesAnalyzed: results.length,
    };
  }

  /**
   * Auto-fix issues that can be automatically fixed
   */
  async fix(patterns: string[]): Promise<number> {
    const eslintWithFix = new ESLint({
      cwd: this.cwd,
      fix: true,
    });

    const results = await eslintWithFix.lintFiles(patterns);
    await ESLint.outputFixes(results);

    // Count fixed issues
    return results.reduce((count, result) => count + (result.output ? 1 : 0), 0);
  }

  /**
   * Detect code smells from ESLint results
   */
  private detectCodeSmells(results: ESLint.LintResult[]): CodeSmell[] {
    const smells: CodeSmell[] = [];

    for (const result of results) {
      // Long files
      if (result.source && result.source.split('\n').length > 500) {
        smells.push({
          type: 'long-file',
          file: result.filePath,
          description: `File has ${result.source.split('\n').length} lines (>500)`,
          severity: 'medium',
          suggestion: 'Consider splitting this file into smaller, more focused modules',
        });
      }

      // Too many errors in one file
      if (result.errorCount > 10) {
        smells.push({
          type: 'error-prone',
          file: result.filePath,
          description: `File has ${result.errorCount} errors`,
          severity: 'high',
          suggestion: 'This file needs significant refactoring or review',
        });
      }

      // Check for specific rule violations that indicate smells
      const complexityIssues = result.messages.filter(m => m.ruleId === 'complexity');
      if (complexityIssues.length > 0) {
        for (const issue of complexityIssues) {
          smells.push({
            type: 'high-complexity',
            file: result.filePath,
            line: issue.line,
            description: issue.message,
            severity: 'medium',
            suggestion: 'Consider refactoring to reduce cyclomatic complexity',
          });
        }
      }

      // Long functions
      const maxLinesIssues = result.messages.filter(m => m.ruleId === 'max-lines-per-function');
      if (maxLinesIssues.length > 0) {
        for (const issue of maxLinesIssues) {
          smells.push({
            type: 'long-function',
            file: result.filePath,
            line: issue.line,
            description: issue.message,
            severity: 'low',
            suggestion: 'Consider breaking this function into smaller functions',
          });
        }
      }
    }

    return smells;
  }

  /**
   * Get summary of analysis results
   */
  getSummary(result: AnalysisResult): string {
    const lines: string[] = [];

    lines.push(`Analyzed ${result.filesAnalyzed} files`);
    lines.push(`Found ${result.totalErrors} errors and ${result.totalWarnings} warnings`);

    if (result.smells.length > 0) {
      lines.push(`\nDetected ${result.smells.length} code smells:`);

      const smellsByType = result.smells.reduce(
        (acc, smell) => {
          acc[smell.type] = (acc[smell.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      for (const [type, count] of Object.entries(smellsByType)) {
        lines.push(`  - ${type}: ${count}`);
      }
    }

    const fixableIssues = result.issues.filter(i => i.fixable).length;
    if (fixableIssues > 0) {
      lines.push(`\n${fixableIssues} issues can be automatically fixed`);
    }

    return lines.join('\n');
  }
}
