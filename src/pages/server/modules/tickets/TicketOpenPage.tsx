import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi, type OpenTicket } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { Inbox, Info, Hash, User, Clock, Shield, FolderTree } from 'lucide-react';
import { serversApi, type GuildChannel, type GuildRole, type GuildCategory } from '@/services/servers-api';

const TicketOpenPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<OpenTicket[]>([]);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [categories, setCategories] = useState<GuildCategory[]>([]);

  useEffect(() => {
    let active = true;
    async function loadResources() {
      if (!guildId) return;
      try {
        const [chRes, roRes, caRes] = await Promise.allSettled([
          serversApi.getChannels(guildId),
          serversApi.getRoles(guildId),
          serversApi.getCategories(guildId),
        ]);
        if (!active) return;
        if (chRes.status === 'fulfilled') setChannels(chRes.value.channels || []);
        if (roRes.status === 'fulfilled') setRoles(roRes.value.roles || []);
        if (caRes.status === 'fulfilled') setCategories(caRes.value.categories || []);
      } catch { /* ignore */ }
    }
    loadResources();
    return () => { active = false; };
  }, [guildId]);

  const channelName = useMemo(() => {
    const m: Record<string, string> = {};
    channels.forEach(c => { m[c.id] = c.name || c.id; });
    return m;
  }, [channels]);

  const userName = useMemo(() => {
    // Falls das Ticket-Objekt Benutzernamen enthalten würde, könnten wir sie hier mappen.
    // Aktuell haben wir nur user_id. Wir lassen den Platzhalter für zukünftiges Mapping.
    return (id: string) => `Benutzer (${id})`;
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!guildId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await ticketsApi.getOpenTickets(guildId);
        if (!active) return;
        setTickets(res.tickets);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Fehler beim Laden der offenen Tickets.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [guildId]);

  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Offene Tickets"
        description="Übersicht über alle aktuell offenen Tickets auf diesem Server."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
      />

      {loading && (
        <SettingsCard>
          <div className="text-[0.95rem] text-[#c1c7de]">Wird geladen…</div>
        </SettingsCard>
      )}
      {error && (
        <SettingsCard>
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-[0.95rem] text-red-200">{error}</div>
        </SettingsCard>
      )}

      {!loading && !error && (
        <SettingsCard header={
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-astra-accent" />
            <span className="text-[#dbe3ff] font-medium">Offene Tickets ({tickets.length})</span>
          </div>
        }>
          {tickets.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#8b8fad]" />
              <p className="text-[0.9rem] leading-relaxed text-[#8b8fad]">
                Keine offenen Tickets vorhanden.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket, i) => (
                <div
                  key={ticket.channel_id || i}
                  className="flex flex-col gap-2 rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-3 text-[0.9rem]">
                    {ticket.channel_id && (
                      <span className="flex items-center gap-1 text-[#c1c7de]">
                        <Hash className="h-4 w-4 text-[#8b8fad]" />
                        {channelName[ticket.channel_id] || ticket.channel_id}
                      </span>
                    )}
                    {ticket.user_id && (
                      <span className="flex items-center gap-1 text-[#8b8fad]">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-[#c1c7de]">Benutzer</span>
                        <span className="text-[0.75rem] opacity-70">({ticket.user_id})</span>
                      </span>
                    )}
                  </div>
                  {ticket.opened_at && (
                    <span className="flex items-center gap-1 text-[0.8rem] text-[#8b8fad]">
                      <Clock className="h-3.5 w-3.5" />
                      {ticket.opened_at}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </SettingsCard>
      )}
    </div>
  );
};

export default TicketOpenPage;
