import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import { calculateTreePrice } from '../shared/pricing.ts';
import type { OrderRecord } from '../shared/types.ts';

export function CheckoutDemoPage({ treeId }: { treeId: string }) {
  const { user, navigate, currency, setCurrency } = useApp();
  const [treeName, setTreeName] = useState('');
  const [peopleCount, setPeopleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    apiClient
      .getTree(treeId)
      .then((res) => {
        setTreeName(res.tree.name);
        setPeopleCount(res.people.length);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load order summary.');
      })
      .finally(() => setLoading(false));
  }, [treeId, user, navigate]);

  if (!user) return null;

  const estimate = calculateTreePrice(peopleCount, currency);

  const handleCreateDemoOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.createDemoCheckoutOrder(treeId, currency);
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create demo order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(`/trees/${treeId}/preview`)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E6660] hover:text-[#1B4332] cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to preview</span>
      </button>

      {/* Mandatory clear Demo Payment Notice */}
      <div className="mt-4 rounded-xl border border-[#B08D57] bg-[#FAF3E6] p-4 text-sm text-[#6B4F24]">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Demo payment — no money will be charged.</p>
            <p className="mt-1 text-xs leading-relaxed">
              No payment gateway credentials or verified provider webhooks are active in this build.
              Submitting this form records a <code className="font-mono">demo_preview</code> order
              only and does not mark a real order as paid.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#DCD4BE] bg-white p-6 sm:p-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1B4332]">
          Checkout preview
        </h1>

        {loading ? (
          <div className="mt-6 h-36 animate-pulse rounded-xl bg-[#F2EDE2]" />
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E5DEC9] bg-[#FAF7F0] p-4">
              <div>
                <p className="text-xs text-[#5E6660]">Family tree</p>
                <p className="font-display text-lg font-semibold text-[#1F2421]">{treeName}</p>
                <p className="text-xs text-[#5E6660] tabular-nums">
                  {peopleCount} {peopleCount === 1 ? 'person' : 'people'} included
                </p>
              </div>

              <div className="inline-flex rounded-lg border border-[#DCD4BE] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                    currency === 'INR' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C]'
                  }`}
                >
                  INR (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                    currency === 'USD' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C]'
                  }`}
                >
                  USD (US$)
                </button>
              </div>
            </div>

            <dl className="mt-6 space-y-3 border-b border-[#E5DEC9] pb-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#5E6660]">Base design package (1–12 people)</dt>
                <dd className="font-medium tabular-nums">
                  {peopleCount === 0 ? estimate.formattedTotal : estimate.formattedBase}
                </dd>
              </div>
              {estimate.additionalPeople > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[#5E6660]">
                    Additional people ({estimate.additionalPeople} × {estimate.formattedPerExtra})
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {currency === 'INR'
                      ? `₹${estimate.additionalAmount.toLocaleString('en-US')}`
                      : `US$${estimate.additionalAmount.toLocaleString('en-US')}`}
                  </dd>
                </div>
              )}
              <div className="flex justify-between pt-2 text-base font-semibold text-[#1B4332]">
                <dt>Estimated one-time total ({currency})</dt>
                <dd className="font-display text-2xl tabular-nums">{estimate.formattedTotal}</dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-[#5E6660]">
              Final taxes and payment-provider fees may affect the amount collected once a live
              payment processor is connected. No subscriptions or recurring charges apply.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            {order ? (
              <div className="mt-6 rounded-xl border border-[#6B8E78]/50 bg-[#EAF0EC] p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" />
                  <div>
                    <p className="font-semibold text-[#1B4332]">
                      Demo order preview recorded ({order.status})
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#3A413C] tabular-nums">
                      Order ID: {order.id} · Calculated total: {estimate.formattedTotal} ({order.currency})
                    </p>
                    <p className="mt-1.5 text-xs text-[#3A413C]">{order.note}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCreateDemoOrder}
                  className="min-h-[44px] rounded-lg bg-[#1B4332] px-6 py-2.5 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Creating demo preview…' : 'Create Demo Order Preview (No Charge)'}
                </button>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-[#E5DEC9] bg-[#FAF7F0] p-4 text-xs text-[#5E6660]">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
                <p>
                  <strong>Future payment integration design:</strong> In production, clicking
                  checkout creates a server-side order via Razorpay or Stripe secret keys stored in
                  server environment variables, and unlocks paid orders only after verifying the
                  provider’s signed webhook at <code className="font-mono">/api/payments/webhook</code>.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
