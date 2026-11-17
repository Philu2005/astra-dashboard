import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi, type OpenTicket } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { Inbox, Info, Hash, User, Clock } from 'lucide-react';

const TicketOpenPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<OpenTicket[]>([]);

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
                        {ticket.channel_id}
                      </span>
                    )}
                    {ticket.user_id && (
                      <span className="flex items-center gap-1 text-[#8b8fad]">
                        <User className="h-4 w-4" />
                        {ticket.user_id}
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
