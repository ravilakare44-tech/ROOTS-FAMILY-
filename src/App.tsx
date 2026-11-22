/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { CheckoutDemoPage } from './pages/CheckoutDemoPage.tsx';
import { ContributorPage } from './pages/ContributorPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ContactPage, HelpPage, PrivacyPage, TermsPage } from './pages/InfoPages.tsx';
import { PreviewExportPage } from './pages/PreviewExportPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { ReviewInboxPage } from './pages/ReviewInboxPage.tsx';
import { TreeEditorPage } from './pages/TreeEditorPage.tsx';

function AppRouter() {
  const { currentPath } = useApp();
  const path = currentPath.replace(/\/+$/, '') || '/';

  const contributeMatch = path.match(/^\/contribute\/([^/]+)$/);
  if (contributeMatch) {
    return <ContributorPage token={decodeURIComponent(contributeMatch[1])} />;
  }

  const editMatch = path.match(/^\/trees\/([^/]+)\/edit$/);
  if (editMatch) {
    return <TreeEditorPage treeId={decodeURIComponent(editMatch[1])} />;
  }

  const reviewMatch = path.match(/^\/trees\/([^/]+)\/review$/);
  if (reviewMatch) {
    return <ReviewInboxPage treeId={decodeURIComponent(reviewMatch[1])} />;
  }

  const previewMatch = path.match(/^\/trees\/([^/]+)\/preview$/);
  if (previewMatch) {
    return <PreviewExportPage treeId={decodeURIComponent(previewMatch[1])} />;
  }

  const checkoutMatch = path.match(/^\/checkout\/([^/]+)$/);
  if (checkoutMatch) {
    return <CheckoutDemoPage treeId={decodeURIComponent(checkoutMatch[1])} />;
  }

  switch (path) {
    case '/pricing':
      return <PricingPage />;
    case '/auth':
      return <AuthPage />;
    case '/dashboard':
      return <DashboardPage />;
    case '/privacy':
      return <PrivacyPage />;
    case '/terms':
      return <TermsPage />;
    case '/contact':
      return <ContactPage />;
    case '/help':
      return <HelpPage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex min-h-screen flex-col bg-[#FAF7F0] text-[#1F2421]">
        <Header />
        <div className="flex-1">
          <AppRouter />
        </div>
        <Footer />
      </div>
    </AppProvider>
  );
}
