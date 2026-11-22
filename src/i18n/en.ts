/**
 * Structured English UI copy dictionary.
 * Keeping user-facing strings organized here makes adding Hindi (hi.ts) and other languages straightforward.
 */
export const EN_COPY = {
  nav: {
    howItWorks: 'How it works',
    designs: 'Designs',
    pricing: 'Pricing',
    help: 'Help',
    startCta: 'Start your family tree',
    dashboardCta: 'My family trees',
  },
  demoBanner:
    'Local Demo Mode: Firebase cloud sync is not configured for this preview. Changes are saved locally on this app server across restarts, and you can also download a JSON backup from your dashboard or preview page.',
  hero: {
    kicker: 'Heirloom Family Trees · India & International',
    headline: 'Preserve your family’s names, dates, and portraits across generations.',
    subheadline:
      'Build a private family tree at your own pace, invite relatives to add their branches without creating an account, and prepare warm, print-ready designs.',
    primaryCta: 'Start your family tree',
    secondaryCta: 'Explore sample tree',
  },
  steps: {
    heading: 'Three quiet steps from scattered notes to a finished heirloom',
    items: [
      {
        num: '01.',
        title: 'Create your tree',
        body: 'Add parents, partners, children, and custom relationships. Mark dates as exact, approximate, year-only, or unknown.',
      },
      {
        num: '02.',
        title: 'Invite family privately',
        body: 'Share a private contributor link so aunts, uncles, and cousins can submit details and photos—no login needed, and nothing publishes until you approve.',
      },
      {
        num: '03.',
        title: 'Design and preview',
        body: 'Choose Classic, Portrait, Landscape, upward-growing Green Tree, or Photo Cards. Adjust fonts, colors, and text size before downloading.',
      },
    ],
  },
} as const;
