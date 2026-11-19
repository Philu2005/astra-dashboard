import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import type { AutomodConfig } from '@/types/moderation';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { 
  LayoutDashboard, 
  Settings, 
  ShieldAlert, 
  CaseSensitive, 
  ListChecks, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Activity,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AutomodOverviewPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<AutomodConfig | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!guildId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await moderationApi.getAutomod(guildId);
        if (!active) return;
        setConfig(res.config || {});
      } catch (e: any) {
        if (active) setError(e?.message || 'Fehler beim Laden der AutoMod-Übersicht.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [guildId]);

  const rulesCount = config?.rules?.length || 0;
  const capsEnabled = config?.capslock?.enabled || false;
  const profanityEnabled = config?.blacklist?.enabled || false;

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        heading="AutoMod-System"
        description="Zentrale Statusübersicht deiner automatischen Moderationsfunktionen."
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard 
              label="Aktive Regeln" 
              value={rulesCount} 
              icon={<ListChecks className="h-5 w-5" />} 
              trend={rulesCount > 0 ? 'active' : 'neutral'}
            />
            <StatCard 
              label="Beleidigungsfilter" 
              value={profanityEnabled ? 'Aktiv' : 'Inaktiv'} 
              icon={<ShieldAlert className="h-5 w-5" />} 
              trend={profanityEnabled ? 'active' : 'neutral'}
            />
            <StatCard 
              label="Capslock-Schutz" 
              value={capsEnabled ? 'Aktiv' : 'Inaktiv'} 
              icon={<CaseSensitive className="h-5 w-5" />} 
              trend={capsEnabled ? 'active' : 'neutral'}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-6">
              {/* Status Section */}
              <SettingsCard header={
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-astra-accent" />
                  <span className="font-medium text-[#dbe3ff]">Schutz-Status</span>
                </div>
              }>
                <div className="space-y-4">
                  <StatusItem 
                    title="Moderations-Regeln"
                    description={rulesCount === 0 
                      ? "Keine automatischen Aktionen konfiguriert." 
                      : `${rulesCount} Regel(n) für automatische Sanktionen aktiv.`}
                    status={rulesCount > 0 ? 'ok' : 'neutral'}
                    link={`/servers/${guildId}/modules/moderation/automod`}
                    linkText="Regeln verwalten"
                  />

                  <StatusItem 
                    title="Inhalts-Filter"
                    description={profanityEnabled 
                      ? "Der Beleidigungsfilter schützt deinen Server vor toxischen Inhalten." 
                      : "Beleidigungsfilter ist aktuell deaktiviert."}
                    status={profanityEnabled ? 'ok' : 'warn'}
                    link={`/servers/${guildId}/modules/moderation/automod`}
                    linkText="Filter einstellen"
                  />

                  <StatusItem 
                    title="Spam-Prävention"
                    description={capsEnabled 
                      ? `Capslock-Erkennung ist bei ${config?.capslock?.percent || 70}% Schwelle aktiv.` 
                      : "Capslock-Erkennung ist deaktiviert."}
                    status={capsEnabled ? 'ok' : 'neutral'}
                    link={`/servers/${guildId}/modules/moderation/automod`}
                    linkText="Spam-Schutz anpassen"
                  />
                </div>
              </SettingsCard>

              {/* Navigation Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NavTile 
                  to={`/servers/${guildId}/modules/moderation/automod`}
                  title="AutoMod-Konfiguration"
                  description="Passe Regeln, Filter und Spam-Schutz für deinen Server an."
                  icon={<Settings className="h-6 w-6" />}
                />
                <NavTile 
                  to={`/servers/${guildId}/modules/moderation/modlog`}
                  title="Moderations-Log"
                  description="Konfiguriere den Kanal für Moderations-Protokolle."
                  icon={<Shield className="h-6 w-6" />}
                />
              </div>
            </div>

            {/* Sidebar Info Area */}
            <div className="lg:col-span-4 space-y-6">
              <SettingsCard header={<span className="text-[0.85rem] font-bold uppercase tracking-widest text-[#8b8fad]">System-Info</span>}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-astra-purple/10 text-astra-purple border border-astra-purple/20">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[0.75rem] uppercase tracking-wider text-[#8b8fad] font-bold">Bot-Status</p>
                      <p className="text-[0.9rem] text-[#dbe3ff]">Bereit & Aktiv</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-astra-cyan/10 text-astra-cyan border border-astra-cyan/20">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[0.75rem] uppercase tracking-wider text-[#8b8fad] font-bold">Letzte Aktion</p>
                      <p className="text-[0.9rem] text-[#dbe3ff]">Keine aktuellen Vorfälle</p>
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
                  Kombiniere Moderationsregeln mit dem Beleidigungsfilter, um eine sichere Umgebung für deine Community zu schaffen.
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
    <div className={cn(
      "absolute -bottom-2 -right-2 h-12 w-12 rounded-full blur-2xl opacity-20",
      trend === 'active' ? "bg-emerald-500" : trend === 'warning' ? "bg-amber-500" : "bg-astra-purple"
    )} />
  </div>
);

interface StatusItemProps {
  title: string;
  description: string;
  status: 'ok' | 'warn' | 'neutral';
  link: string;
  linkText: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ title, description, status, link, linkText }) => (
  <div className="flex items-center justify-between rounded-xl border border-[#2a2d4a] bg-[#0f111d] p-4">
    <div className="flex items-center gap-3">
      <div className={cn(
        "h-3 w-3 rounded-full shadow-[0_0_8px]",
        status === 'ok' ? "bg-emerald-400 shadow-emerald-400/50" : 
        status === 'warn' ? "bg-amber-400 shadow-amber-400/50" :
        "bg-[#3a3d5a] shadow-transparent"
      )} />
      <div>
        <p className="text-[0.95rem] font-medium text-white">{title}</p>
        <p className="text-[0.85rem] text-[#8b8fad]">{description}</p>
      </div>
    </div>
    <Link to={link} className="flex items-center gap-1 text-[0.85rem] text-astra-purple hover:text-astra-purple/80 font-medium whitespace-nowrap ml-4">
      {linkText} <ArrowRight className="h-4 w-4" />
    </Link>
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

export default AutomodOverviewPage;
