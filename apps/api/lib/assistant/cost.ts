export type TokenUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
};

export type ModelRates = {
  inputUsdPerMillion: number;
  cachedInputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

export const GPT_6_LUNA_STANDARD: ModelRates = {
  inputUsdPerMillion: 0.1,
  cachedInputUsdPerMillion: 0.01,
  outputUsdPerMillion: 0.5,
};

export const DEFAULT_MONTHLY_BUDGET_USD = 20;
const MICRO_USD = 1_000_000;

export function costMicroUsd(usage: TokenUsage, rates: ModelRates): number {
  const uncached = usage.inputTokens - usage.cachedInputTokens;
  return (
    Math.round(uncached * rates.inputUsdPerMillion) +
    Math.round(usage.cachedInputTokens * rates.cachedInputUsdPerMillion) +
    Math.round(usage.outputTokens * rates.outputUsdPerMillion)
  );
}

export function usdToMicroUsd(usd: number): number {
  return Math.round(usd * MICRO_USD);
}

export function budgetAllows(spentMicroUsd: number, limitMicroUsd: number): boolean {
  return spentMicroUsd < limitMicroUsd;
}
