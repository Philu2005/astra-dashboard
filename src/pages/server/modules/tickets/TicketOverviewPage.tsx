import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ticketsApi, type TicketPanel, type OpenTicket } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { 
  LayoutDashboard, 
  Settings, 
  LayoutPanelTop, 
  Inbox, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock,
  ArrowRight,
  Shield,
  Hash,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TicketOverviewPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panels, setPanels] = useState<TicketPanel[]>([]);
  const [tickets, setTickets] = useState<OpenTicket[]>([]);
  const [logChannel, setLogChannel] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      if (!guildId) return;
      setLoading(true);
      setError(null);
      try {
        const [panelsRes, ticketsRes, logRes, statusRes] = await Promise.allSettled([
          ticketsApi.getPanels(guildId),
          ticketsApi.getOpenTickets(guildId),
          ticketsApi.getLog(guildId),
          ticketsApi.getPanelsStatus(guildId),
        ]);

        if (!active) return;

        if (panelsRes.status === 'fulfilled') setPanels(panelsRes.value.panels || []);
        if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value.tickets || []);
        if (logRes.status === 'fulfilled') setLogChannel(logRes.value.channel_id);
        if (statusRes.status === 'fulfilled') setStatus(statusRes.value.status || {});

      } catch (e: any) {
        if (active) setError(e?.message || 'Fehler beim Laden der Ticket-Übersicht.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [guildId]);

  const activePanels = panels.filter(p => {
    const ch = p.channel_id || '';
    const st = status.panels?.[ch] || status[ch];
    const norm = st?.status?.toLowerCase();
    return norm === 'published' || norm === 'published_updated' || norm === 'published_exists' || p.panel_message_id;
  });

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        heading="Ticket-System"
        description="Zentrale Verwaltung und Statusübersicht deines Ticket-Systems."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-[#2a2f45] bg-[#131625]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-astra-purple border-t-transparent" />
            <span className="text-[#8b8fad] text-[0.9rem]">Übersicht wird geladen...</span>
          </div>
        </div>
      ) : error ? (
        <SettingsCard>
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-[0.95rem] text-red-200">
            {error}
          </div>
        </SettingsCard>
      ) : (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              label="Offene Tickets" 
              value={tickets.length} 
              icon={<Inbox className="h-5 w-5" />} 
              trend={tickets.length > 0 ? 'active' : 'neutral'}
            />
            <StatCard 
              label="Aktive Panels" 
              value={activePanels.length} 
              icon={<LayoutPanelTop className="h-5 w-5" />} 
              trend={activePanels.length > 0 ? 'active' : 'warning'}
            />
            <StatCard 
              label="Logging" 
              value={logChannel ? 'Aktiv' : 'Inaktiv'} 
              icon={<BookOpen className="h-5 w-5" />} 
              trend={logChannel ? 'active' : 'neutral'}
            />
            <StatCard 
              label="Status" 
              value="Online" 
              icon={<CheckCircle2 className="h-5 w-5" />} 
              trend="active"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-6">
              {/* Status Section */}
              <SettingsCard header={
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-astra-accent" />
                  <span className="font-medium text-[#dbe3ff]">Aktueller Status</span>
                </div>
              }>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-[#2a2d4a] bg-[#0f111d] p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-3 w-3 rounded-full shadow-[0_0_8px]",
                        tickets.length > 0 ? "bg-emerald-400 shadow-emerald-400/50" : "bg-[#3a3d5a] shadow-transparent"
                      )} />
                      <div>
                        <p className="text-[0.95rem] font-medium text-white">Ticket-Aufkommen</p>
                        <p className="text-[0.85rem] text-[#8b8fad]">
                          {tickets.length === 0 ? "Momentan sind keine Tickets offen." : `${tickets.length} Ticket(s) erfordern Aufmerksamkeit.`}
                        </p>
                      </div>
                    </div>
                    <Link to={`/servers/${guildId}/modules/tickets/open`} className="flex items-center gap-1 text-[0.85rem] text-astra-purple hover:text-astra-purple/80 font-medium">
                      Anzeigen <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#2a2d4a] bg-[#0f111d] p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-3 w-3 rounded-full shadow-[0_0_8px]",
                        activePanels.length > 0 ? "bg-emerald-400 shadow-emerald-400/50" : "bg-amber-400 shadow-amber-400/50"
                      )} />
                      <div>
                        <p className="text-[0.95rem] font-medium text-white">Panel-Verfügbarkeit</p>
                        <p className="text-[0.85rem] text-[#8b8fad]">
                          {activePanels.length} von {panels.length} Panels sind in Discord aktiv.
                        </p>
                      </div>
                    </div>
                    <Link to={`/servers/${guildId}/modules/tickets/panels`} className="flex items-center gap-1 text-[0.85rem] text-astra-purple hover:text-astra-purple/80 font-medium">
                      Verwalten <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </SettingsCard>

              {/* Navigation Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NavTile 
                  to={`/servers/${guildId}/modules/tickets/config`}
                  title="Konfiguration"
                  description="Allgemeine Ticket-Einstellungen und Lifecycle-Regeln."
                  icon={<Settings className="h-6 w-6" />}
                />
                <NavTile 
                  to={`/servers/${guildId}/modules/tickets/panels`}
                  title="Panels"
                  description="Erstelle und verwalte Embed-Panels für Discord."
                  icon={<LayoutPanelTop className="h-6 w-6" />}
                />
                <NavTile 
                  to={`/servers/${guildId}/modules/tickets/open`}
                  title="Offene Tickets"
                  description="Übersicht aller aktuell aktiven Support-Fälle."
                  icon={<Inbox className="h-6 w-6" />}
                />
                <NavTile 
                  to={`/servers/${guildId}/modules/tickets/log`}
                  title="Ticket-Log"
                  description="Protokollierung aller Ticket-Ereignisse konfigurieren."
                  icon={<BookOpen className="h-6 w-6" />}
                />
              </div>
            </div>

            {/* Sidebar Info Area */}
            <div className="lg:col-span-4 space-y-6">
              <SettingsCard header={<span className="text-[0.85rem] font-bold uppercase tracking-widest text-[#8b8fad]">System-Info</span>}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-astra-purple/10 text-astra-purple border border-astra-purple/20">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[0.75rem] uppercase tracking-wider text-[#8b8fad] font-bold">Support-Bereitschaft</p>
                      <p className="text-[0.9rem] text-[#dbe3ff]">{activePanels.length > 0 ? 'Bereit für Anfragen' : 'Keine Panels aktiv'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-astra-cyan/10 text-astra-cyan border border-astra-cyan/20">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[0.75rem] uppercase tracking-wider text-[#8b8fad] font-bold">Logging-Kanal</p>
                      <p className="text-[0.9rem] text-[#dbe3ff] truncate max-w-[180px]">{logChannel ? `Kanal: ${logChannel}` : 'Nicht konfiguriert'}</p>
                    </div>
                  </div>
                </div>
              </SettingsCard>

              <div className="rounded-2xl border border-astra-purple/20 bg-astra-purple/5 p-5">
                <div className="flex items-center gap-2 mb-3 text-astra-purple">
                  <LayoutDashboard className="h-5 w-5" />
                  <h4 className="font-bold text-[0.95rem]">Tipp</h4>
                </div>
                <p className="text-[0.85rem] leading-relaxed text-[#8fa1c6]">
                  Nutze das Ticket-Logging, um alle Transkripte und Aktionen für später zu sichern. Dies erhöht die Transparenz in deinem Team.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Components ────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend: 'active' | 'warning' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => (
  <div className="relative overflow-hidden rounded-2xl border border-[#2d3246] bg-[#141728] p-5 shadow-sm transition-all hover:border-[#3a4060]">
    <div className="flex items-start justify-between">
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl border",
        trend === 'active' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
        trend === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
        "bg-[#1a1f33] border-[#2a2f45] text-[#8b8fad]"
      )}>
        {icon}
      </div>
    </div>
    <div className="mt-4">
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      <p className="text-[0.75rem] font-medium uppercase tracking-wider text-[#8b8fad] mt-1">{label}</p>
    </div>
    {/* Decorative element */}
    <div className={cn(
      "absolute -bottom-2 -right-2 h-12 w-12 rounded-full blur-2xl opacity-20",
      trend === 'active' ? "bg-emerald-500" : trend === 'warning' ? "bg-amber-500" : "bg-astra-purple"
    )} />
  </div>
);

interface NavTileProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const NavTile: React.FC<NavTileProps> = ({ to, title, description, icon }) => (
  <Link to={to} className="group flex items-start gap-4 rounded-2xl border border-[#2a2d4a] bg-[#13152a]/60 p-5 transition-all hover:border-astra-purple/40 hover:bg-astra-purple/5">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1a1f33] text-[#8b8fad] border border-[#2a2f45] transition-colors group-hover:bg-astra-purple/20 group-hover:text-astra-purple group-hover:border-astra-purple/30">
      {icon}
    </div>
    <div>
      <h4 className="text-[1.05rem] font-bold text-[#dbe3ff] group-hover:text-white transition-colors">{title}</h4>
      <p className="mt-1 text-[0.85rem] leading-relaxed text-[#8b8fad] group-hover:text-[#a0a8cc] transition-colors">
        {description}
      </p>
    </div>
  </Link>
);

export default TicketOverviewPage;
