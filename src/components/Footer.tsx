import { BRAND_CONFIG } from '../config/brand.ts';
import { useApp } from '../context/AppContext.tsx';

export function Footer() {
  const { navigate, user, logout } = useApp();

  return (
    <footer className="no-print border-t border-[#E5DEC9] bg-[#F2EDE2]/70 text-[#3A413C]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="font-display text-lg font-semibold text-[#1B4332]">{BRAND_CONFIG.name}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#5E6660]">
              Thoughtful family tree design for families in India and around the world. Built for
              private family collaboration without public profiles or ad tracking.
            </p>
            <p className="mt-3 text-xs text-[#5E6660]">
              Language: English · हिन्दी (Hindi) and additional regional scripts planned
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#1F2421]">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                  className="hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer"
                >
                  {user ? 'Owner dashboard' : 'Owner sign in'}
                </button>
              </li>
              {user && (
                <li>
                  <button
                    type="button"
                    onClick={logout}
                    className="hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer"
                  >
                    Sign out
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#1F2421]">Trust &amp; Support</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer"
                >
                  Privacy policy (Draft)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/terms')}
                  className="hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer"
                >
                  Terms of service (Draft)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/help')}
                  className="hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer"
                >
                  Help &amp; guide
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="hover:text-[#1B4332] hover:underline underline-offset-4 cursor-pointer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#E5DEC9] pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-[#5E6660]">
          <p>{BRAND_CONFIG.name} · Preview build running in Local Demo Mode</p>
          <p>No analytics or third-party tracking active</p>
        </div>
      </div>
    </footer>
  );
}
