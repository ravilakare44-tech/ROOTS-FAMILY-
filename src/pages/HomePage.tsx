import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Lock, Smartphone, Users, Image as ImageIcon, Download } from 'lucide-react';
import { TreeVisualizer } from '../components/TreeVisualizer.tsx';
import { useApp } from '../context/AppContext.tsx';
import { EN_COPY } from '../i18n/en.ts';
import { apiClient } from '../services/apiClient.ts';
import { calculateTreePrice } from '../shared/pricing.ts';
import {
  DEFAULT_DESIGN_CONFIG,
  SAMPLE_PEOPLE,
  SAMPLE_RELATIONSHIPS,
  SAMPLE_TREE,
  SEATING_MODELS,
} from '../shared/sampleData.ts';
import type {
  Person,
  Relationship,
  SeatingModelId,
  TreeDesignConfig,
  TreeVisualStyle,
} from '../shared/types.ts';
import { formatLifeSpan } from '../utils/dateFormat.ts';

const STYLE_OPTIONS: { id: TreeVisualStyle; label: string; desc: string }[] = [
  { id: 'classic', label: 'Classic', desc: 'Balanced archival chart with serif typography and neat branches.' },
  { id: 'portrait', label: 'Portrait', desc: 'Vertical layout tailored for tall frames and hallways.' },
  { id: 'landscape', label: 'Landscape', desc: 'Wide generational spread suited for horizontal prints.' },
  { id: 'green_tree', label: 'Green Tree', desc: 'Roots at the base growing upward into a leafy canopy.' },
  { id: 'photo_cards', label: 'Photo Gallery', desc: 'Portrait-forward cards arranged by generation.' },
];

const FAQS = [
  {
    q: 'Do my relatives need an account to submit their family details?',
    a: 'No. When you generate a private invite link, relatives can open it on their phone or laptop, add one or more people, attach photos, and submit without signing up. Everything waits in your review inbox until you approve it.',
  },
  {
    q: 'Can I keep family trees private and not searchable online?',
    a: 'Yes. Family trees are private to their owner by default and are never listed in a public directory. A contributor invite link only opens the submission form for that specific tree.',
  },
  {
    q: 'What if we do not know an exact birth or death date?',
    a: 'Every date field lets you mark whether the date is exact, approximate, year-only, or unknown so older generations can be recorded honestly without guessing.',
  },
  {
    q: 'How does pricing work in India and internationally?',
    a: 'For India (INR), a tree with 1 to 12 people is ₹30 total, plus ₹10 for each additional person above 12. Internationally (USD), 1 to 12 people is US$1 total, plus US$1 for each additional person above 12. There are no subscriptions.',
  },
  {
    q: 'Can this app support Hindi or other languages later?',
    a: 'Yes. The interface copy is structured for localization so Hindi and additional languages can be added cleanly in upcoming versions.',
  },
];

export function HomePage() {
  const { navigate, user, currency, setCurrency } = useApp();
  const [samplePeople, setSamplePeople] = useState<Person[]>(SAMPLE_PEOPLE);
  const [sampleRels, setSampleRels] = useState<Relationship[]>(SAMPLE_RELATIONSHIPS);
  const [sampleDesign, setSampleDesign] = useState<TreeDesignConfig>(() => {
    try {
      const saved = localStorage.getItem('rb_sample_design');
      if (saved) {
        return { ...DEFAULT_DESIGN_CONFIG, ...(JSON.parse(saved) as Partial<TreeDesignConfig>) };
      }
    } catch {
      // Ignore storage read errors
    }
    return DEFAULT_DESIGN_CONFIG;
  });
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(SAMPLE_PEOPLE[1]);
  const [calcCount, setCalcCount] = useState<number>(15);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    try {
      localStorage.setItem('rb_sample_design', JSON.stringify(sampleDesign));
    } catch {
      // Ignore storage write errors
    }
  }, [sampleDesign]);

  useEffect(() => {
    apiClient
      .getSampleTree()
      .then((res) => {
        setSamplePeople(res.people);
        setSampleRels(res.relationships);
      })
      .catch(() => {
        // Fallback to local sample data already loaded
      });
  }, []);

  const priceEstimate = calculateTreePrice(calcCount, currency);

  const handleStyleSwitch = (style: TreeVisualStyle) => {
    setSampleDesign((prev) => ({
      ...prev,
      style,
      orientation: style === 'portrait' ? 'portrait' : 'landscape',
    }));
  };

  return (
    <div className="bg-[#FAF7F0] text-[#1F2421]">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 lg:pt-16 lg:pb-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wide text-[#6B8E78]">
              {EN_COPY.hero.kicker}
            </p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold leading-[1.14] tracking-tight text-[#1B4332] text-balance">
              {EN_COPY.hero.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-[17px] leading-relaxed text-[#3A413C]">
              {EN_COPY.hero.subheadline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1B4332] px-6 py-3 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
              >
                <span>{user ? 'Open my family trees' : EN_COPY.hero.primaryCta}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('sample-tree');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-[#DCD4BE] bg-white px-5 py-3 text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] transition-colors cursor-pointer"
              >
                {EN_COPY.hero.secondaryCta}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5DEC9] flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#5E6660]">
              <span>Up to 100 people per tree</span>
              <span aria-hidden="true">·</span>
              <span>Private owner-reviewed invites</span>
              <span aria-hidden="true">·</span>
              <span>One-time design pricing from ₹30 / US$1</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] overflow-hidden rounded-2xl border border-[#DCD4BE] bg-[#EAE4D3]">
              <img
                src="/src/assets/images/hero_botanical_heirloom_1795308574738.jpg"
                alt="An open linen-bound family archive album beside pressed botanical leaves and framed heritage portraits"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sample Family Tree Preview */}
      <section id="sample-tree" className="border-y border-[#E5DEC9] bg-[#F2EDE2]/55 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium text-[#5E6660]">
                Interactive preview · Fictional sample family data
              </p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#1B4332]">
                Explore a living three-generation tree
              </h2>
            </div>

            {/* Interactive style switcher */}
            <div
              role="tablist"
              aria-label="Preview tree visual styles"
              className="flex flex-wrap items-center gap-1 rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] p-1"
            >
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={sampleDesign.style === opt.id}
                  onClick={() => handleStyleSwitch(opt.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sampleDesign.style === opt.id
                      ? 'bg-[#1B4332] text-[#FAF7F0]'
                      : 'text-[#3A413C] hover:bg-[#EAE4D3]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Family Gathering Seating Selector: 3 Indoor + 3 Outdoor */}
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-[#DCD4BE] bg-[#FAF7F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="shrink-0">
              <span className="text-xs font-semibold text-[#1B4332]">
                Family gathering seating
              </span>
              <span className="ml-2 text-xs text-[#5E6660]">3 Indoor · 3 Outdoor</span>
            </div>
            <div
              role="group"
              aria-label="Choose botanical seating illustration (3 indoor and 3 outdoor models)"
              className="flex flex-wrap items-center gap-1.5"
            >
              {(['indoor', 'outdoor'] as const).map((cat) => (
                <div key={cat} className="flex flex-wrap items-center gap-1">
                  <span className="px-1.5 text-[11px] font-medium uppercase tracking-wider text-[#6B8E78]">
                    {cat}:
                  </span>
                  {SEATING_MODELS.filter((m) => m.category === cat).map((model) => {
                    const active = (sampleDesign.seatingModel ?? 'indoor_heirloom_sofa') === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        aria-pressed={active}
                        title={model.subtitle}
                        onClick={() =>
                          setSampleDesign((prev) => ({
                            ...prev,
                            seatingModel: model.id as SeatingModelId,
                          }))
                        }
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#1B4332] text-[#FAF7F0]'
                            : 'border border-[#DCD4BE] bg-white text-[#3A413C] hover:bg-[#EAE4D3]'
                        }`}
                      >
                        {model.name}
                      </button>
                    );
                  })}
                </div>
              ))}
              <button
                type="button"
                aria-pressed={sampleDesign.seatingModel === 'none'}
                onClick={() =>
                  setSampleDesign((prev) => ({
                    ...prev,
                    seatingModel: 'none',
                  }))
                }
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  sampleDesign.seatingModel === 'none'
                    ? 'bg-[#1B4332] text-[#FAF7F0]'
                    : 'border border-[#DCD4BE] bg-white text-[#5E6660] hover:bg-[#EAE4D3]'
                }`}
              >
                None
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-9">
              <TreeVisualizer
                treeName={SAMPLE_TREE.name}
                people={samplePeople}
                relationships={sampleRels}
                design={sampleDesign}
                selectedPersonId={selectedPerson?.id}
                onSelectPerson={setSelectedPerson}
                minHeightClass="h-[460px] sm:h-[520px]"
              />
            </div>

            {/* Person inspector card */}
            <div className="lg:col-span-3 flex flex-col justify-between rounded-xl border border-[#DCD4BE] bg-white p-5">
              {selectedPerson ? (
                <div>
                  <p className="text-xs font-medium text-[#6B8E78]">Selected person</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#DCD4BE] bg-[#EAF0EC] flex items-center justify-center">
                      {selectedPerson.photoUrl ? (
                        <img
                          src={selectedPerson.photoUrl}
                          alt={selectedPerson.fullName}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-lg font-semibold text-[#1B4332]">
                          {selectedPerson.fullName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-[#1F2421] leading-snug">
                        {selectedPerson.fullName}
                      </h3>
                      {selectedPerson.alternateName && (
                        <p className="text-xs text-[#6B8E78]">{selectedPerson.alternateName}</p>
                      )}
                    </div>
                  </div>

                  <dl className="mt-5 space-y-3 border-t border-[#E5DEC9] pt-4 text-sm">
                    <div>
                      <dt className="text-xs text-[#5E6660]">Dates</dt>
                      <dd className="mt-0.5 font-medium text-[#1F2421] tabular-nums">
                        {formatLifeSpan(selectedPerson) || 'Dates unknown'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#5E6660]">Birth date precision</dt>
                      <dd className="mt-0.5 capitalize text-[#3A413C]">
                        {selectedPerson.birthDatePrecision.replace('_', ' ')}
                      </dd>
                    </div>
                    {selectedPerson.notes && (
                      <div>
                        <dt className="text-xs text-[#5E6660]">Family note</dt>
                        <dd className="mt-0.5 text-sm leading-relaxed text-[#3A413C]">
                          {selectedPerson.notes}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              ) : (
                <p className="text-sm text-[#5E6660]">
                  Click any person in the sample tree to inspect their details.
                </p>
              )}

              <div className="mt-6 border-t border-[#E5DEC9] pt-4">
                <p className="text-xs text-[#5E6660] mb-3">
                  Want to edit a tree like this or add your own family?
                </p>
                <button
                  type="button"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                  className="w-full min-h-[40px] rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] transition-colors cursor-pointer"
                >
                  {user ? 'Go to dashboard' : 'Sign in to try editor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three-Step Create, Invite, Design */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#6B8E78]">How it works</p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#1B4332] text-balance">
            {EN_COPY.steps.heading}
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {EN_COPY.steps.items.map((step) => (
            <div
              key={step.num}
              className="rounded-xl border border-[#DCD4BE] bg-white p-6 flex flex-col justify-between"
            >
              <div>
                <p className="font-display text-sm font-semibold text-[#B08D57] tabular-nums">
                  {step.num}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-[#1F2421]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#3A413C]">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Design Previews Gallery */}
      <section id="designs" className="border-y border-[#E5DEC9] bg-[#F2EDE2]/55 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B8E78]">Five visual styles</p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#1B4332]">
                Designed to look calm on screen and dignified in print
              </h2>
            </div>
            <p className="text-sm text-[#5E6660] max-w-md">
              Switch styles, serif or sans fonts, text sizes, and accessible color palettes anytime
              without re-entering your family data.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {STYLE_OPTIONS.map((item) => {
              const isSelected = sampleDesign.style === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    handleStyleSwitch(item.id);
                    const el = document.getElementById('sample-tree');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`group text-left rounded-xl border p-4 transition-colors cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#1B4332] ring-1 ring-[#1B4332]'
                      : 'border-[#DCD4BE] hover:border-[#6B8E78]'
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-lg border border-[#E5DEC9] bg-[#FAF7F0] flex items-center justify-center">
                    {item.id === 'green_tree' ? (
                      <img
                        src="/src/assets/images/botanical_emblem_art_1795308574547.jpg"
                        alt="Botanical green tree preview"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : item.id === 'photo_cards' ? (
                      <img
                        src="/src/assets/images/portrait_elder_sample_1795308575639.jpg"
                        alt="Photo gallery card preview"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : item.id === 'landscape' ? (
                      <img
                        src="/src/assets/images/family_courtyard_sample_1795308575329.jpg"
                        alt="Landscape family chart preview"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 w-full">
                        <div className="h-5 w-20 rounded border border-[#6B8E78] bg-white" />
                        <div className="h-3 w-px bg-[#6B8E78]" />
                        <div className="flex gap-2">
                          <div className="h-5 w-14 rounded border border-[#6B8E78] bg-white" />
                          <div className="h-5 w-14 rounded border border-[#6B8E78] bg-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-[#1F2421] group-hover:text-[#1B4332]">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#5E6660]">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features & Family Sofa Showcase */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-[#DCD4BE] bg-white">
              <div className="aspect-[4/3] overflow-hidden bg-[#EAE4D3]">
                <img
                  src="/src/assets/images/family_sofa_portrait_1795309703401.jpg"
                  alt="Multigenerational family—grandparents, parents, and children—seated happily together on one cream linen sofa"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="border-t border-[#E5DEC9] p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#6B8E78]">
                      Featured family portrait layout
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold text-[#1B4332]">
                      Together on One Sofa — Family Gathering
                    </h3>
                  </div>
                  <p className="font-display text-2xl font-semibold text-[#1B4332] tabular-nums shrink-0">
                    ₹300
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#3A413C]">
                  Seat grandparents, parents, and children together in one warm heirloom portrait
                  paired with your full family tree. Preview pricing for this curated keepsake
                  edition is ₹300 (demo preview; no real charge).
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => navigate(user ? '/dashboard' : '/auth')}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-xs sm:text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] transition-colors cursor-pointer"
                  >
                    <span>Start with this family edition</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-[#DCD4BE] bg-white p-5">
              <Users className="h-5 w-5 text-[#1B4332]" />
              <h3 className="mt-3 font-display text-lg font-semibold text-[#1F2421]">
                Private family submissions
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3A413C]">
                Send an unguessable private invite link. Relatives add multiple family members in one
                form, and you approve or edit before anything joins the tree.
              </p>
            </div>

            <div className="rounded-xl border border-[#DCD4BE] bg-white p-5">
              <ImageIcon className="h-5 w-5 text-[#1B4332]" />
              <h3 className="mt-3 font-display text-lg font-semibold text-[#1F2421]">
                Photo crop &amp; gentle defaults
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3A413C]">
                Upload and crop family portraits right in the browser. Missing photos get calm
                initials avatars rather than broken frames.
              </p>
            </div>

            <div className="rounded-xl border border-[#DCD4BE] bg-white p-5">
              <Smartphone className="h-5 w-5 text-[#1B4332]" />
              <h3 className="mt-3 font-display text-lg font-semibold text-[#1F2421]">
                Built for phones and laptops
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3A413C]">
                On smaller screens, switch effortlessly between a clean list editor and a zoomable
                tree preview with touch-friendly controls.
              </p>
            </div>

            <div className="rounded-xl border border-[#DCD4BE] bg-white p-5">
              <Download className="h-5 w-5 text-[#1B4332]" />
              <h3 className="mt-3 font-display text-lg font-semibold text-[#1F2421]">
                Downloadable previews
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3A413C]">
                Export a PNG image of your customized tree directly from the studio, or open a print
                view to save as PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Summary */}
      <section className="border-y border-[#E5DEC9] bg-[#F2EDE2]/55 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <p className="text-xs font-medium text-[#6B8E78]">Simple one-time pricing</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#1B4332]">
                Pay per tree, with no subscriptions
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#3A413C]">
                Choose your currency manually below. Building and editing your tree is free to
                explore; pricing scales gently only when your tree grows past 12 people.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-[#1F2421]">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
                  <span>
                    <strong>India (INR):</strong> ₹30 total for 1–12 people, plus ₹10 for each
                    person above 12.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
                  <span>
                    <strong>International (USD):</strong> US$1 total for 1–12 people, plus US$1 for
                    each person above 12.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" />
                  <span>
                    Demo checkout preview only in this build—no money will be charged.
                  </span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 rounded-2xl border border-[#DCD4BE] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#1F2421]">Estimate your tree</span>
                <div className="inline-flex rounded-lg border border-[#DCD4BE] bg-[#FAF7F0] p-1">
                  <button
                    type="button"
                    onClick={() => setCurrency('INR')}
                    className={`rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                      currency === 'INR' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C]'
                    }`}
                  >
                    India (₹ INR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                      currency === 'USD' ? 'bg-[#1B4332] text-[#FAF7F0]' : 'text-[#3A413C]'
                    }`}
                  >
                    International ($ USD)
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="home-people-slider" className="text-[#3A413C]">
                    Number of people in tree
                  </label>
                  <span className="font-semibold text-[#1B4332] tabular-nums">
                    {calcCount} {calcCount === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <input
                  id="home-people-slider"
                  type="range"
                  min={1}
                  max={100}
                  value={calcCount}
                  onChange={(e) => setCalcCount(Number(e.target.value))}
                  className="mt-2 w-full accent-[#1B4332]"
                />
                <div className="mt-1 flex justify-between text-xs text-[#5E6660] tabular-nums">
                  <span>1</span>
                  <span>12 (base)</span>
                  <span>50</span>
                  <span>100 (max)</span>
                </div>
              </div>

              <div className="mt-6 flex items-baseline justify-between border-t border-[#E5DEC9] pt-5">
                <div>
                  <p className="text-xs text-[#5E6660]">Estimated one-time price</p>
                  <p className="mt-1 text-xs text-[#5E6660]">
                    Base {priceEstimate.formattedBase} (1–12)
                    {priceEstimate.additionalPeople > 0
                      ? ` + ${priceEstimate.additionalPeople} × ${priceEstimate.formattedPerExtra}`
                      : ''}
                  </p>
                </div>
                <p className="font-display text-3xl font-semibold text-[#1B4332] tabular-nums">
                  {priceEstimate.formattedTotal}
                </p>
              </div>

              <p className="mt-4 text-xs text-[#5E6660]">
                Final taxes and payment-provider fees may affect the amount collected at checkout.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="min-h-[40px] rounded-lg border border-[#DCD4BE] px-4 py-2 text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2] cursor-pointer"
                >
                  Full pricing details
                </button>
                <button
                  type="button"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                  className="min-h-[40px] rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] cursor-pointer"
                >
                  Start your family tree
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1B4332] text-center">
          Frequently asked questions
        </h2>

        <div className="mt-8 divide-y divide-[#E5DEC9] rounded-xl border border-[#DCD4BE] bg-white">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm sm:text-base font-medium text-[#1F2421] hover:bg-[#FAF7F0]/60 cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#5E6660] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-[#3A413C]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
