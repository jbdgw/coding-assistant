/**
 * Type definitions for the routing system
 */

export enum TaskComplexity {
  SIMPLE = 'SIMPLE',
  MODERATE = 'MODERATE',
  COMPLEX = 'COMPLEX',
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface RoutingDecision {
  model: string;
  complexity: TaskComplexity;
  reason: string;
  estimatedCost?: number;
}

export interface ModelCandidate {
  model: string;
  cost: number;
  priority: number;
}

export interface RoutingConfig {
  [TaskComplexity.SIMPLE]: ModelCandidate[];
  [TaskComplexity.MODERATE]: ModelCandidate[];
  [TaskComplexity.COMPLEX]: ModelCandidate[];
}

export type RoutingStrategy = 'cost' | 'performance' | 'balanced';

export interface UsageLog {
  id?: number;
  timestamp?: Date;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  taskComplexity: TaskComplexity;
  sessionId: string;
  success: boolean;
}

export interface FailureLog {
  id?: number;
  timestamp?: Date;
  model: string;
  errorMessage: string;
  fallbackModel?: string;
  fallbackSucceeded: boolean;
}

export interface BudgetConfig {
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  updatedAt?: Date;
}

export interface ModelStats {
  model: string;
  totalCalls: number;
  successRate: number;
  avgCost: number;
  totalCost: number;
}
