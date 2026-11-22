import type { CurrencyCode } from './types.ts';

export const PRICING_CONFIG = {
  baseIncludedPeople: 12,
  INR: {
    currency: 'INR' as const,
    symbol: '₹',
    label: 'India (INR)',
    basePrice: 30,
    perAdditionalPerson: 10,
  },
  USD: {
    currency: 'USD' as const,
    symbol: 'US$',
    label: 'International (USD)',
    basePrice: 1,
    perAdditionalPerson: 1,
  },
};

export interface PriceEstimate {
  currency: CurrencyCode;
  peopleCount: number;
  includedPeople: number;
  additionalPeople: number;
  baseAmount: number;
  additionalAmount: number;
  totalAmount: number;
  formattedTotal: string;
  formattedBase: string;
  formattedPerExtra: string;
}

export function calculateTreePrice(
  peopleCount: number,
  currency: CurrencyCode
): PriceEstimate {
  const safeCount = Math.max(0, Math.floor(Number.isFinite(peopleCount) ? peopleCount : 0));
  const tier = PRICING_CONFIG[currency];

  if (safeCount === 0) {
    return {
      currency,
      peopleCount: 0,
      includedPeople: PRICING_CONFIG.baseIncludedPeople,
      additionalPeople: 0,
      baseAmount: 0,
      additionalAmount: 0,
      totalAmount: 0,
      formattedTotal: formatCurrency(0, currency),
      formattedBase: formatCurrency(tier.basePrice, currency),
      formattedPerExtra: formatCurrency(tier.perAdditionalPerson, currency),
    };
  }

  const additionalPeople = Math.max(0, safeCount - PRICING_CONFIG.baseIncludedPeople);
  const baseAmount = tier.basePrice;
  const additionalAmount = additionalPeople * tier.perAdditionalPerson;
  const totalAmount = baseAmount + additionalAmount;

  return {
    currency,
    peopleCount: safeCount,
    includedPeople: PRICING_CONFIG.baseIncludedPeople,
    additionalPeople,
    baseAmount,
    additionalAmount,
    totalAmount,
    formattedTotal: formatCurrency(totalAmount, currency),
    formattedBase: formatCurrency(tier.basePrice, currency),
    formattedPerExtra: formatCurrency(tier.perAdditionalPerson, currency),
  };
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = PRICING_CONFIG[currency].symbol;
  return `${symbol}${amount.toLocaleString('en-US')}`;
}
