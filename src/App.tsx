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
import { useEffect, useRef } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation, useParams, Navigate } from 'react-router-dom';
import GlobalDashboardLayout from '@/layouts/GlobalDashboardLayout';
import ServerLayout from '@/layouts/ServerLayout';
import ServerOverview from '@/pages/server/ServerOverview';
import ServerSettingsPlaceholder from '@/pages/server/ServerSettingsPlaceholder';
import ModuleOverview from '@/pages/server/modules/ModuleOverview';
import ModuleLayout from '@/layouts/modules/ModuleLayout';
import AutomodPage from '@/pages/server/modules/moderation/AutomodPage';
import WarningsPage from '@/pages/server/modules/moderation/WarningsPage';
import ModlogPage from '@/pages/server/modules/moderation/ModlogPage';
import AutomodOverviewPage from '@/pages/server/modules/moderation/AutomodOverviewPage';
import ServerPermissionsPlaceholder from '@/pages/server/ServerPermissionsPlaceholder';
import ServerLogsPlaceholder from '@/pages/server/ServerLogsPlaceholder';
import ServerStatsPlaceholder from '@/pages/server/ServerStatsPlaceholder';
import TicketConfigPage from '@/pages/server/modules/tickets/TicketConfigPage';
import TicketPanelsPage from '@/pages/server/modules/tickets/TicketPanelsPage';
import TicketOpenPage from '@/pages/server/modules/tickets/TicketOpenPage';
import TicketLogPage from '@/pages/server/modules/tickets/TicketLogPage';
import TicketOverviewPage from '@/pages/server/modules/tickets/TicketOverviewPage';
// Dev-only preview page for module UI (guarded by import.meta.env.DEV in routes)
// Dev-Modulvorschau wurde entfernt – keine Import mehr

// --- Route Elements to preserve previous behaviors ---
const RequireAuth: React.FC<{ children: React.ReactNode; message: 'dashboard' | 'servers' }> = ({ children, message }) => {
  const { authenticated, loading, error, status, login } = useAuth();
  const location = useLocation();
  const loginStartedRef = useRef(false);

  useEffect(() => {
    if (location.pathname !== '/login') {
      loginStartedRef.current = false;
    }
  }, [location.pathname]);

  if (loading) {
    return <StaticInfoPage title="Wird geladen..." description="Deine Sitzung wird überprüft." />;
  }
  if (!authenticated) {
    if (message === 'dashboard') {
      return (
        <StaticInfoPage
          title="Nicht angemeldet"
          description="Du musst dich anmelden, um auf das Dashboard zuzugreifen."
          showHomeActions
        />
      );
    }
    return (
      <StaticInfoPage
        title="Nicht angemeldet"
        description="Du musst dich anmelden, um auf die Serverliste zuzugreifen."
        showHomeActions
      />
    );
  }
  return <>{children}</>;
};

const AuthCallbackPage: React.FC = () => {
  const exchangeStartedRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      window.location.replace('/login?error=token_exchange_failed');
      return;
    }
    if (exchangeStartedRef.current) return;
    exchangeStartedRef.current = true;
    apiClient
      .post('/auth/exchange', { token })
      .then(async (res) => {
        if (res.ok) {
          window.location.replace('/dashboard');
        } else {
          window.location.replace('/login?error=token_exchange_failed');
        }
      })
      .catch(() => {
        window.location.replace('/login?error=token_exchange_failed');
      });
  }, []);
  return <StaticInfoPage title="Anmeldung wird abgeschlossen..." description="Deine Sitzung wird eingerichtet." />;
};

const LoginRedirectPage: React.FC = () => {
  const { authenticated, loading, error, status, login } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (authenticated) {
      window.location.replace('/dashboard');
      return;
    }
    if (!error) {
      login();
    }
  }, [authenticated, loading, error, login]);

  if (error) {
    return <StaticInfoPage title="Login-Fehler" description={error} showHomeActions />;
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
  return <StaticInfoPage title="Anmeldung läuft..." description="Du wirst zu Discord weitergeleitet." />;
};

const InviteRedirectPage: React.FC = () => {
  useEffect(() => {
    if (appConfig.botInviteUrl) {
      window.location.replace(appConfig.botInviteUrl);
    }
  }, []);
  return <StaticInfoPage title="Weiterleitung..." description="Du wirst zur Discord-Einladung weitergeleitet." />;
};

// Wrapper to reproduce ServerProvider usage on specific routes when authenticated
const WithServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated } = useAuth();
  if (!authenticated) return <>{children}</>;
  return <ServerProvider>{children}</ServerProvider>;
};

// Ticket detail element with ID parsing like before (declare before router usage)
function TicketDetailRoute() {
  const params = useParams();
  const id = Number(params.id);
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

const GlobalLayoutOutlet: React.FC = () => (
  <GlobalDashboardLayout>
    <Outlet />
  </GlobalDashboardLayout>
);

import { SidebarProvider } from '@/contexts/SidebarContext';

const router = createBrowserRouter([
  {
    // Root wrapper provides Sidebar context for ALL routes
    element: (
      <SidebarProvider>
        <Outlet />
      </SidebarProvider>
    ),
    children: [
      {
        path: '/',
        element: <LandingPage />,
        errorElement: (
          <StaticInfoPage
            title="Seite nicht gefunden"
            description="Die gewünschte Seite existiert nicht. Nutze die Homepage oder das Dashboard."
            showHomeActions
          />
        ),
      },
      {
        path: '/',
        element: (
          <WithServerProvider>
            <GlobalLayoutOutlet />
          </WithServerProvider>
        ),
        children: [
          {
            path: 'dashboard',
            element: (
              <RequireAuth message="dashboard">
                <Dashboard />
              </RequireAuth>
            ),
          },
          {
            path: 'dashboard/status',
            element: (
              <RequireAuth message="dashboard">
                <StatusPage />
              </RequireAuth>
            ),
          },
          {
            path: 'dashboard/docs',
            element: (
              <RequireAuth message="dashboard">
                <DocsPage />
              </RequireAuth>
            ),
          },
          {
            path: 'servers',
            element: (
              <RequireAuth message="servers">
                <Servers />
              </RequireAuth>
            ),
          },
          {
            path: 'support',
            element: <SupportPage />,
          },
          // DEV-Only Routes
          // Dev-/Preview-Routen entfernt
          {
            path: 'support/ticket/:id',
            element: <TicketDetailRoute />,
          },
          {
            path: 'dashboard/tickets',
            element: <AdminTicketsPage />,
          },
        ],
      },
      { path: '/docs', element: <DocsPage /> },
      { path: '/status', element: <StatusPage /> },
      { path: '/login', element: <LoginRedirectPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/invite', element: <InviteRedirectPage /> },
      // --- Serverbereich: Eigenständiges Layout und verschachtelte Routen ---
      {
        path: '/servers/:guildId',
        element: (
          <RequireAuth message="servers">
            <WithServerProvider>
              <ServerLayout />
            </WithServerProvider>
          </RequireAuth>
        ),
        children: [
          { index: true, element: <ServerOverview /> },
          { path: 'settings', element: <ServerSettingsPlaceholder /> },
          { path: 'modules', element: <ModuleOverview /> },
          {
            path: 'modules/moderation',
            element: <ModuleLayout moduleKey="moderation" />,
            children: [
              { index: true, element: <Navigate to="overview" replace /> },
              { path: 'overview', element: <AutomodOverviewPage /> },
              { path: 'automod', element: <AutomodPage /> },
              { path: 'warnings', element: <WarningsPage /> },
              { path: 'modlog', element: <ModlogPage /> },
            ],
          },
          {
            path: 'modules/tickets',
            element: <ModuleLayout moduleKey="tickets" />,
            children: [
              { index: true, element: <Navigate to="overview" replace /> },
              { path: 'overview', element: <TicketOverviewPage /> },
              { path: 'config', element: <TicketConfigPage /> },
              { path: 'panels', element: <TicketPanelsPage /> },
              { path: 'open', element: <TicketOpenPage /> },
              { path: 'log', element: <TicketLogPage /> },
            ],
          },
          { path: 'permissions', element: <ServerPermissionsPlaceholder /> },
          { path: 'logs', element: <ServerLogsPlaceholder /> },
          { path: 'stats', element: <ServerStatsPlaceholder /> },
        ],
      },
      {
        path: '*',
        element: (
          <StaticInfoPage
            title="Seite nicht gefunden"
            description="Die gewünschte Seite existiert nicht. Nutze die Homepage oder das Dashboard."
            showHomeActions
          />
        ),
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <CookieSettingsModal />
      <CookieConsentBanner />
    </>
  );
}

export default App;
