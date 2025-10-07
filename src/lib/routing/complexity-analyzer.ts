/**
 * Task complexity analyzer
 * Analyzes user prompts to determine task complexity for smart routing
 */

import { TaskComplexity } from '../../types/routing.js';
import type { ChatMessage } from '../providers/base-provider.js';

interface ComplexityScore {
  score: number;
  reasons: string[];
}

export class ComplexityAnalyzer {
  /**
   * Analyze task complexity from user message and conversation history
   */
  analyze(userMessage: string, conversationHistory: ChatMessage[] = []): TaskComplexity {
    const { score } = this.calculateComplexityScore(userMessage, conversationHistory);

    // Determine complexity based on score
    if (score <= 2) {
      return TaskComplexity.SIMPLE;
    } else if (score <= 5) {
      return TaskComplexity.MODERATE;
    } else {
      return TaskComplexity.COMPLEX;
    }
  }

  /**
   * Calculate complexity score and reasons
   */
  private calculateComplexityScore(
    userMessage: string,
    conversationHistory: ChatMessage[],
  ): ComplexityScore {
    let score = 0;
    const reasons: string[] = [];

    // 1. Message length analysis
    const messageTokens = this.estimateTokens(userMessage);
    if (messageTokens > 500) {
      score += 2;
      reasons.push('Long prompt (>500 tokens)');
    } else if (messageTokens > 200) {
      score += 1;
      reasons.push('Medium prompt (>200 tokens)');
    }

    // 2. Code size analysis
    const codeBlocks = this.extractCodeBlocks(userMessage);
    const totalLOC = codeBlocks.reduce((sum, block) => sum + block.split('\n').length, 0);

    if (totalLOC > 100) {
      score += 2;
      reasons.push('Large code block (>100 LOC)');
    } else if (totalLOC > 30) {
      score += 1;
      reasons.push('Medium code block (>30 LOC)');
    }

    // 3. Keyword analysis for complex tasks
    const complexKeywords = [
      'architect',
      'architecture',
      'refactor',
      'redesign',
      'optimize',
      'performance',
      'scale',
      'design pattern',
      'system design',
      'migration',
      'rewrite',
    ];

    const foundComplexKeywords = complexKeywords.filter((keyword) =>
      userMessage.toLowerCase().includes(keyword),
    );

    if (foundComplexKeywords.length > 0) {
      score += 2;
      reasons.push(`Complex task keywords: ${foundComplexKeywords.join(', ')}`);
    }

    // 4. Multi-file indicators
    const multiFileIndicators = [
      /\d+\s*(files?|modules?|components?)/i,
      /multiple\s*(files?|modules?|components?)/i,
      /across\s*(files?|modules?)/i,
      /entire\s*(project|codebase|application)/i,
    ];

    if (multiFileIndicators.some((regex) => regex.test(userMessage))) {
      score += 2;
      reasons.push('Multi-file operation');
    }

    // 5. Conversation context length
    if (conversationHistory.length > 10) {
      score += 2;
      reasons.push('Long conversation context (>10 messages)');
    } else if (conversationHistory.length > 5) {
      score += 1;
      reasons.push('Medium conversation context (>5 messages)');
    }

    // 6. Question vs. task indicator
    const isQuestion = /\?$/.test(userMessage.trim()) || userMessage.toLowerCase().startsWith('what') ||
      userMessage.toLowerCase().startsWith('how') ||
      userMessage.toLowerCase().startsWith('why');

    if (!isQuestion && messageTokens < 50) {
      // Short directive commands are usually simple
      score = Math.max(0, score - 1);
    }

    // 7. Simple task keywords (reduce score)
    const simpleKeywords = [
      'fix typo',
      'add comment',
      'rename',
      'change color',
      'update text',
      'quick',
      'simple',
      'small change',
    ];

    const foundSimpleKeywords = simpleKeywords.filter((keyword) =>
      userMessage.toLowerCase().includes(keyword),
    );

    if (foundSimpleKeywords.length > 0) {
      score = Math.max(0, score - 2);
      reasons.push(`Simple task: ${foundSimpleKeywords.join(', ')}`);
    }

    return { score, reasons };
  }

  /**
   * Extract code blocks from message
   */
  private extractCodeBlocks(message: string): string[] {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = message.match(codeBlockRegex) || [];
    return matches.map((block) => block.replace(/```\w*\n?/g, '').replace(/```$/g, ''));
  }

  /**
   * Estimate token count (rough approximation: 4 chars ≈ 1 token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get detailed analysis (for debugging/logging)
   */
  analyzeDetailed(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
  ): {
    complexity: TaskComplexity;
    score: number;
    reasons: string[];
  } {
    const { score, reasons } = this.calculateComplexityScore(userMessage, conversationHistory);
    const complexity = this.analyze(userMessage, conversationHistory);

    return {
      complexity,
      score,
      reasons,
    };
  }
}
