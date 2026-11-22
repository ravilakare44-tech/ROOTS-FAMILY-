import { useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { calculateTreePrice } from '../shared/pricing.ts';
import { TREE_LIMITS } from '../shared/treeLimits.ts';

const PRICING_EXAMPLES = [1, 12, 13, 25, 50, 100];

export function PricingPage() {
  const { currency, setCurrency, navigate, user } = useApp();
  const [peopleCount, setPeopleCount] = useState<number>(13);

  const estimate = calculateTreePrice(peopleCount, currency);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-[#6B8E78]">Transparent pricing</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#1B4332]">
          Simple one-time pricing per family tree
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#3A413C]">
          Start building for free. When you are ready to unlock finished exports, pay once based on
          how many people are in your tree—no subscriptions or hidden recurring charges.
        </p>
      </div>

      {/* Manual Currency Selector */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DCD4BE] bg-white p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold text-[#1F2421]">Select your billing currency</p>
          <p className="text-xs text-[#5E6660]">
            Choose India (INR) or International (USD) manually—we never guess your location.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] p-1">
          <button
            type="button"
            onClick={() => setCurrency('INR')}
            className={`min-h-[38px] rounded-md px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors ${
              currency === 'INR' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C] hover:bg-[#EAE4D3]'
            }`}
          >
            India · INR (₹)
          </button>
          <button
            type="button"
            onClick={() => setCurrency('USD')}
            className={`min-h-[38px] rounded-md px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors ${
              currency === 'USD' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C] hover:bg-[#EAE4D3]'
            }`}
          >
            International · USD (US$)
          </button>
        </div>
      </div>

      {/* Side-by-side plan rules + interactive calculator */}
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-[#DCD4BE] bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-[#1B4332]">
            {currency === 'INR' ? 'India (INR ₹) Pricing' : 'International (USD $) Pricing'}
          </h2>
          <p className="mt-2 text-sm text-[#3A413C]">
            {currency === 'INR'
              ? '₹30 total for 1–12 people. Add ₹10 for every person above 12.'
              : 'US$1 total for 1–12 people. Add US$1 for every person above 12.'}
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="pricing-people-input" className="text-sm font-medium text-[#1F2421]">
                People in your tree (1–{TREE_LIMITS.MAX_PEOPLE_PER_TREE})
              </label>
              <input
                id="pricing-people-input"
                type="number"
                min={1}
                max={TREE_LIMITS.MAX_PEOPLE_PER_TREE}
                value={peopleCount}
                onChange={(e) => {
                  const val = Math.max(
                    1,
                    Math.min(TREE_LIMITS.MAX_PEOPLE_PER_TREE, Number(e.target.value) || 1)
                  );
                  setPeopleCount(val);
                }}
                className="w-24 rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] px-3 py-1.5 text-right text-sm font-semibold text-[#1B4332] tabular-nums"
              />
            </div>
            <input
              type="range"
              aria-label="People in your tree slider"
              min={1}
              max={TREE_LIMITS.MAX_PEOPLE_PER_TREE}
              value={peopleCount}
              onChange={(e) => setPeopleCount(Number(e.target.value))}
              className="mt-3 w-full accent-[#1B4332]"
            />
          </div>

          <div className="mt-6 rounded-xl border border-[#E5DEC9] bg-[#FAF7F0] p-5">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#5E6660]">
                  Calculated total for <span className="tabular-nums">{peopleCount}</span>{' '}
                  {peopleCount === 1 ? 'person' : 'people'}
                </p>
                <p className="mt-1 text-xs text-[#5E6660]">
                  Includes 1–12 people ({estimate.formattedBase})
                  {estimate.additionalPeople > 0
                    ? ` + ${estimate.additionalPeople} extra × ${estimate.formattedPerExtra}`
                    : ''}
                </p>
              </div>
              <p className="font-display text-4xl font-semibold text-[#1B4332] tabular-nums">
                {estimate.formattedTotal}
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-2.5 text-sm text-[#3A413C]">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
              <span>All 5 design styles (Classic, Portrait, Landscape, Green Tree, Photo Cards)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
              <span>Private contributor invite link with owner approval inbox</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
              <span>Supports up to {TREE_LIMITS.MAX_PEOPLE_PER_TREE} people per tree</span>
            </li>
          </ul>

          <p className="mt-5 text-xs leading-relaxed text-[#5E6660]">
            Note: Final taxes and payment-provider fees may affect the amount collected when real
            payments are enabled. Currently this preview supports Demo Checkout with no real charge.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="min-h-[44px] rounded-lg bg-[#1B4332] px-6 py-2.5 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
            >
              {user ? 'Open my trees' : 'Start your family tree'}
            </button>
          </div>
        </div>

        {/* Exact Examples Table */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DCD4BE] bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-[#1B4332]">Quick reference</h2>
          <p className="mt-1 text-xs text-[#5E6660]">
            Both currencies shown side by side for clarity.
          </p>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5DEC9] text-left text-xs text-[#5E6660]">
                <th className="py-2 font-medium">People</th>
                <th className="py-2 text-right font-medium">India (INR)</th>
                <th className="py-2 text-right font-medium">International (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE2]">
              {PRICING_EXAMPLES.map((count) => {
                const inr = calculateTreePrice(count, 'INR');
                const usd = calculateTreePrice(count, 'USD');
                return (
                  <tr
                    key={count}
                    onClick={() => setPeopleCount(count)}
                    className={`cursor-pointer hover:bg-[#FAF7F0] ${
                      peopleCount === count ? 'bg-[#EAF0EC]/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 tabular-nums text-[#1F2421]">
                      {count} {count === 1 ? 'person' : 'people'}
                    </td>
                    <td className="py-3 text-right tabular-nums text-[#1B4332]">
                      {inr.formattedTotal}
                    </td>
                    <td className="py-3 text-right tabular-nums text-[#1B4332]">
                      {usd.formattedTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
