import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Servers } from '@/pages/Servers';
import { LandingPage } from '@/pages/LandingPage';
import { StaticInfoPage } from '@/pages/StaticInfoPage';
import { DocsPage } from '@/docs/DocsPage';
import SupportPage from '@/pages/SupportPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import AdminTicketsPage from '@/pages/admin/AdminTicketsPage';
import StatusPage from '@/pages/StatusPage';
import { useAuth } from '@/contexts/AuthContext';
import { ServerProvider } from '@/contexts/ServerContext';
import { CookieConsentBanner } from '@/components/consent/CookieConsentBanner';
import { CookieSettingsModal } from '@/components/consent/CookieSettingsModal';
import { apiClient } from '@/lib/api-client';
import { appConfig } from '@/lib/app-config';
import { useEffect, useRef, useState } from 'react';

function App() {
  const { authenticated, loading, login, error, status } = useAuth();
  const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/';
  const loginStartedRef = useRef(false);
  const exchangeStartedRef = useRef(false);
  const [exchanging, setExchanging] = useState(false);

  // Handle /auth/callback: exchange token for session cookie
  useEffect(() => {
    if (pathname !== '/auth/callback') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      window.location.replace('/login?error=token_exchange_failed');
      return;
    }

    // Guard against double execution (React StrictMode)
    if (exchangeStartedRef.current) return;
    exchangeStartedRef.current = true;
    setExchanging(true);

    apiClient.post('/auth/exchange', { token })
      .then(async (res) => {
        if (res.ok) {
          // Session cookie is now set – navigate to dashboard via full reload
          // so AuthContext re-checks /auth/me with the new cookie
          window.location.replace('/dashboard');
        } else {
          window.location.replace('/login?error=token_exchange_failed');
        }
      })
      .catch(() => {
        window.location.replace('/login?error=token_exchange_failed');
      });
  }, [pathname]);

  // Handle /login: auto-start OAuth if unauthenticated and no error
  useEffect(() => {
    if (pathname !== '/login') {
      loginStartedRef.current = false;
      return;
    }

    if (loading || loginStartedRef.current) {
      return;
    }

    if (authenticated) {
      window.location.replace('/dashboard');
      return;
    }

    if (!error) {
      loginStartedRef.current = true;
      login();
    }
  }, [pathname, authenticated, loading, error, login]);

  const renderPage = () => {
    if (pathname === '/auth/callback') {
      return (
        <StaticInfoPage
          title="Anmeldung wird abgeschlossen..."
          description="Deine Sitzung wird eingerichtet."
        />
      );
    }

    if (loading && (pathname === '/dashboard' || pathname === '/servers' || pathname === '/login')) {
      return (
        <StaticInfoPage
          title="Wird geladen..."
          description="Deine Sitzung wird überprüft."
        />
      );
    }

    if (pathname === '/dashboard') {
      if (!authenticated) {
        return (
          <StaticInfoPage
            title="Nicht angemeldet"
            description="Du musst dich anmelden, um auf das Dashboard zuzugreifen."
            showHomeActions
          />
        );
      }
      return (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      );
    }

    if (pathname === '/servers') {
      if (!authenticated) {
        return (
          <StaticInfoPage
            title="Nicht angemeldet"
            description="Du musst dich anmelden, um auf die Serverliste zuzugreifen."
            showHomeActions
          />
        );
      }
      return (
        <DashboardLayout>
          <Servers />
        </DashboardLayout>
      );
    }

    if (pathname === '/login') {
      if (error) {
        return (
          <StaticInfoPage
            title="Login-Fehler"
            description={error}
            showHomeActions
          />
        );
      }

      if (status === 'unauthenticated') {
        return (
          <StaticInfoPage
            title="Anmeldung wird gestartet..."
            description="Du wirst zu Discord weitergeleitet. Falls nichts passiert, starte die Anmeldung erneut über die Homepage."
            showHomeActions
          />
        );
      }

      return (
        <StaticInfoPage
          title="Anmeldung läuft..."
          description="Du wirst zu Discord weitergeleitet."
        />
      );
    }

    if (pathname === '/docs' || pathname.startsWith('/docs/')) {
      return <DocsPage />;
    }

    if (pathname === '/support') {
      return <SupportPage />;
    }

    if (pathname.startsWith('/support/ticket/')) {
      const idPart = pathname.replace('/support/ticket/', '').split('/')[0];
      const id = Number(idPart);
      if (!Number.isFinite(id)) {
        return (
          <StaticInfoPage
            title="Ungültige Ticket-ID"
            description="Die angeforderte Ticket-ID ist ungültig."
            showHomeActions
          />
        );
      }
      return <TicketDetailPage ticketId={id} />;
    }

    if (pathname === '/dashboard/tickets') {
      return <AdminTicketsPage />;
    }

    if (pathname === '/status') {
      return <StatusPage />;
    }

    if (pathname === '/invite') {
      window.location.replace(appConfig.botInviteUrl!);
      return (
        <StaticInfoPage
          title="Weiterleitung..."
          description="Du wirst zur Discord-Einladung weitergeleitet."
        />
      );
    }

    if (pathname === '/') {
      return <LandingPage />;
    }

    return (
      <StaticInfoPage
        title="Seite nicht gefunden"
        description="Die gewünschte Seite existiert nicht. Nutze die Homepage oder das Dashboard."
        showHomeActions
      />
    );
  };

  const isDashboardPage = pathname === '/dashboard' || pathname === '/servers' || pathname === '/support' || pathname.startsWith('/support/ticket/') || pathname === '/dashboard/tickets';
  const page = renderPage();

  return (
    <>
      {isDashboardPage && authenticated ? (
        <ServerProvider>{page}</ServerProvider>
      ) : (
        page
      )}
      <CookieSettingsModal />
      <CookieConsentBanner />
    </>
  );
}

export default App;
