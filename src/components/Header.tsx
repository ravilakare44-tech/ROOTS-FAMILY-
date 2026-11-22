import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand.ts';
import { useApp } from '../context/AppContext.tsx';
import { EN_COPY } from '../i18n/en.ts';

export function Header() {
  const { currentPath, navigate, user, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isContributorRoute = currentPath.startsWith('/contribute/');

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  if (isContributorRoute) {
    return (
      <header className="no-print border-b border-[#E5DEC9] bg-[#FAF7F0]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => handleNav('/')}
            className="font-display text-lg font-semibold tracking-tight text-[#1B4332] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
          >
            {BRAND_CONFIG.name}
          </button>
          <span className="text-xs text-[#5E6660] whitespace-nowrap">
            Private family contribution form
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-[#E5DEC9] bg-[#FAF7F0]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="font-display text-xl font-semibold tracking-tight text-[#1B4332] whitespace-nowrap shrink-0 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332]"
        >
          {BRAND_CONFIG.name}
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#3A413C]"
        >
          <button
            type="button"
            onClick={() => handleNav('/#how-it-works')}
            className="hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {EN_COPY.nav.howItWorks}
          </button>
          <button
            type="button"
            onClick={() => handleNav('/#designs')}
            className="hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {EN_COPY.nav.designs}
          </button>
          <button
            type="button"
            onClick={() => handleNav('/pricing')}
            className={`hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPath === '/pricing' ? 'text-[#1B4332] underline' : ''
            }`}
          >
            {EN_COPY.nav.pricing}
          </button>
          <button
            type="button"
            onClick={() => handleNav('/help')}
            className={`hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPath === '/help' ? 'text-[#1B4332] underline' : ''
            }`}
          >
            {EN_COPY.nav.help}
          </button>
          {user && (
            <button
              type="button"
              onClick={() => handleNav('/dashboard')}
              className={`hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentPath === '/dashboard' ? 'text-[#1B4332] underline' : ''
              }`}
            >
              {EN_COPY.nav.dashboardCta}
            </button>
          )}
        </nav>

        {/* Zone 3: Single primary action + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => handleNav('/dashboard')}
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              {EN_COPY.nav.dashboardCta}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNav('/auth')}
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F0] hover:bg-[#143326] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              {EN_COPY.nav.startCta}
            </button>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg border border-[#DCD4BE] text-[#1F2421] hover:bg-[#F2EDE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5DEC9] bg-[#FAF7F0] px-4 py-4">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleNav('/#how-it-works')}
              className="min-h-[44px] w-full rounded-lg px-3 text-left text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2]"
            >
              {EN_COPY.nav.howItWorks}
            </button>
            <button
              type="button"
              onClick={() => handleNav('/#designs')}
              className="min-h-[44px] w-full rounded-lg px-3 text-left text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2]"
            >
              {EN_COPY.nav.designs}
            </button>
            <button
              type="button"
              onClick={() => handleNav('/pricing')}
              className="min-h-[44px] w-full rounded-lg px-3 text-left text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2]"
            >
              {EN_COPY.nav.pricing}
            </button>
            <button
              type="button"
              onClick={() => handleNav('/help')}
              className="min-h-[44px] w-full rounded-lg px-3 text-left text-sm font-medium text-[#1F2421] hover:bg-[#F2EDE2]"
            >
              {EN_COPY.nav.help}
            </button>

            <div className="mt-2 pt-3 border-t border-[#E5DEC9] flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleNav('/dashboard')}
                    className="min-h-[44px] w-full rounded-lg bg-[#1B4332] px-4 text-sm font-medium text-[#FAF7F0]"
                  >
                    {EN_COPY.nav.dashboardCta}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="min-h-[44px] w-full rounded-lg border border-[#DCD4BE] px-4 text-sm font-medium text-[#3A413C]"
                  >
                    Sign out ({user.name})
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNav('/auth')}
                  className="min-h-[44px] w-full rounded-lg bg-[#1B4332] px-4 text-sm font-medium text-[#FAF7F0]"
                >
                  {EN_COPY.nav.startCta}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
