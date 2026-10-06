import { describe, it, expect } from 'vitest';
import {
  formatPKR,
  calculateRemainingBudget,
  calculateSpentPercentage,
  calculateRemainingPercentage,
  calculateSuggestedDailyPace,
  getBudgetHealthStatus,
  generateSpendingFeedback,
} from './financial';

describe('Financial Calculation Core Logic', () => {
  it('formats PKR properly according to spec', () => {
    expect(formatPKR(30000)).toBe('Rs. 30,000');
    expect(formatPKR(7550)).toBe('Rs. 7,550');
    expect(formatPKR(0)).toBe('Rs. 0');
    expect(formatPKR(-450)).toBe('-Rs. 450');
  });

  it('calculates remaining budget accurately', () => {
    // Spec example: Allocated = 30,000, Spent = 1,600 -> Remaining = 28,400
    expect(calculateRemainingBudget(30000, 1600)).toBe(28400);
    // Over budget scenario
    expect(calculateRemainingBudget(10000, 12500)).toBe(-2500);
  });

  it('calculates spent and remaining percentages correctly', () => {
    // Allocated = 30,000, Spent = 7,500 -> 25%
    expect(calculateSpentPercentage(30000, 7500)).toBe(25);
    expect(calculateRemainingPercentage(30000, 22500)).toBe(75);

    // Over budget percentage
    expect(calculateSpentPercentage(10000, 12000)).toBe(120);
    expect(calculateRemainingPercentage(10000, -2000)).toBe(0);
  });

  it('calculates suggested daily pace', () => {
    // Remaining = 18,450, Days remaining = 30 -> 615 (~620 in spec)
    const pace = calculateSuggestedDailyPace(18600, 30);
    expect(pace).toBe(620);
    expect(calculateSuggestedDailyPace(0, 10)).toBe(0);
    expect(calculateSuggestedDailyPace(5000, 0)).toBe(0);
  });

  it('evaluates budget health status', () => {
    expect(getBudgetHealthStatus(30000, 5000)).toBe('healthy');
    expect(getBudgetHealthStatus(30000, 26000)).toBe('watch'); // > 85%
    expect(getBudgetHealthStatus(30000, 31000)).toBe('over_budget');
  });

  it('generates friendly non-judgmental feedback', () => {
    const healthyFeedback = generateSpendingFeedback(30000, 5000, 25000, 20);
    expect(healthyFeedback.type).toBe('healthy');

    const warningFeedback = generateSpendingFeedback(30000, 28000, 2000, 5);
    expect(warningFeedback.type).toBe('warning');

    const overFeedback = generateSpendingFeedback(30000, 32000, -2000, 5);
    expect(overFeedback.type).toBe('danger');
  });
});
