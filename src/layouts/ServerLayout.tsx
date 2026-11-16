import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import ServerHeader from '@/layouts/ServerHeader';
import ServerSidebar from '@/layouts/ServerSidebar';
import { useServerContext } from '@/contexts/ServerContext';
import { StaticInfoPage } from '@/pages/StaticInfoPage';

const ServerLayout: React.FC = () => {
  const { guildId } = useParams();
  const { servers, selectedServer, loadingState } = useServerContext();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Ladezustände
  if (loadingState.status === 'loading' || loadingState.status === 'idle') {
    return <StaticInfoPage title="Wird geladen..." description="Server werden geladen." />;
  }
  if (loadingState.status === 'unavailable') {
    return (
      <StaticInfoPage
        title="Dienst nicht verfügbar"
        description="Die Serverliste ist derzeit nicht erreichbar. Bitte versuche es später erneut."
        showHomeActions
      />
    );
  }
  if (loadingState.status === 'error') {
    return (
      <StaticInfoPage
        title="Fehler beim Laden"
        description={loadingState.error ?? 'Es ist ein Fehler aufgetreten.'}
        showHomeActions
      />
    );
  }

  // Unbekannte Server-ID
  const exists = servers.some((s) => s.id === guildId);
  if (!exists) {
    return (
      <StaticInfoPage
        title="Server nicht gefunden"
        description="Der angeforderte Server ist unbekannt oder du hast keine Berechtigung. Kehre zur Serverliste zurück."
        showHomeActions
      />
    );
  }

  return (
    <div className="h-dvh bg-[#070912] text-white overflow-hidden relative flex">
      {/* Server Sidebar */}
      <ServerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:ml-[278px]">
          <ServerHeader onOpenSidebar={() => setSidebarOpen(true)} />
        </div>
        {/* Content with spacing and left margin on desktop */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 xl:px-10 lg:ml-[278px]">
          {/* Platz für zukünftige Breadcrumbs/PageHeader */}
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServerLayout;
