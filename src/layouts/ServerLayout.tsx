import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
// Ersetze den individuellen ServerHeader durch die globale Topbar, um die Designtreue zur Dashboard‑Übersicht sicherzustellen
import { Topbar } from '@/layouts/Topbar';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
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
      {/* Globale Hintergrund-Gradients wie im GlobalDashboardLayout */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(75,70,200,0.34)_0%,rgba(75,70,200,0.14)_18%,rgba(75,70,200,0)_44%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_20%,rgba(125,227,255,0.2)_0%,rgba(125,227,255,0.08)_14%,rgba(125,227,255,0)_36%)]" />
        <div className="absolute right-[12%] top-[14%] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(125,227,255,0.2)_0%,rgba(125,227,255,0)_72%)] animate-[astra-float_14s_ease-in-out_infinite]" />
        <div className="absolute right-[36%] top-[26%] w-2 h-2 rounded-full bg-[#8ddcff]/35 animate-[astra-shift_18s_ease-in-out_infinite]" />
        <div className="absolute right-[24%] top-[38%] w-1.5 h-1.5 rounded-full bg-[#9b93ff]/40 animate-[astra-float_20s_ease-in-out_infinite]" />
      </div>

      {/* Server Sidebar */}
      <ServerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <div className="lg:ml-[278px]">
          <Topbar />
        </div>
        {/* Content with spacing and left margin on desktop */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 xl:px-10 lg:ml-[278px]">
          {/* Globale Breadcrumbs für alle Server-Unterseiten */}
          <div className="mb-3">
            <Breadcrumbs />
          </div>
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServerLayout;
