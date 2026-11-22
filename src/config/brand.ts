/**
 * Centralized branding configuration.
 * Update `BRAND_CONFIG.name` in one place to rename the application across the UI.
 */
export const BRAND_CONFIG = {
  name: 'Roots & Branches',
  tagline: 'Preserve family stories across generations.',
  supportEmail: 'hello@rootsandbranches.example',
  defaultLocale: 'en',
  supportedLocales: [
    { code: 'en', label: 'English', ready: true },
    { code: 'hi', label: 'हिन्दी (Hindi — planned)', ready: false },
  ],
} as const;
