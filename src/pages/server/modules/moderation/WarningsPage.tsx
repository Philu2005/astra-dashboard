import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Shield, 
  User, 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  Search, 
  AlertCircle,
  XCircle,
  CheckCircle2,
  Filter,
  UserCheck
} from 'lucide-react';
import { moderationApi } from '@/services/moderation-api';
import type { WarnItem, DiscordMember } from '@/types/moderation';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledButton } from '@/components/ui/StyledButton';
import { StyledBadge } from '@/components/ui/StyledBadge';

const WarningsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warns, setWarns] = useState<WarnItem[]>([]);
  const [count, setCount] = useState<number>(0);
  const [members, setMembers] = useState<Record<string, DiscordMember>>({});
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmOne, setConfirmOne] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const canQuery = useMemo(() => Boolean(guildId), [guildId]);

  const load = async (silent = false) => {
    if (!canQuery || !guildId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await moderationApi.getGuildWarns(guildId);
      const items = (res.warns || []).map((w) => ({
        ...w,
        warnId: String(w.warnId),
      }));
      setWarns(items);
      setCount(res.count || items.length || 0);

      // Member Lookup auslösen
      void lookupMissingMembers(guildId, items);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Verwarnungen.');
      setWarns([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const lookupMissingMembers = async (gid: string, items: WarnItem[]) => {
    const uniqueUserIds = Array.from(new Set(items.map(w => w.userId)));
    const idsToLookup = uniqueUserIds.filter(id => !members[id]);

    if (idsToLookup.length === 0) return;

    // Batching (max 50 pro Request lt. Bot-API)
    const batches: string[][] = [];
    for (let i = 0; i < idsToLookup.length; i += 50) {
      batches.push(idsToLookup.slice(i, i + 50));
    }

    try {
      const results = await Promise.all(
        batches.map(batch => moderationApi.lookupMembers(gid, batch))
      );

      const allFoundMembers: Record<string, DiscordMember> = {};
      results.forEach(res => {
        if (res.success && res.members) {
          Object.assign(allFoundMembers, res.members);
        }
      });

      setMembers(prev => ({ ...prev, ...allFoundMembers }));
    } catch (err) {
      console.error('Fehler beim Member-Lookup:', err);
    }
  };

  useEffect(() => {
    setWarns([]);
    setCount(0);
    setError(null);
    setSuccess(null);
    setConfirmAll(false);
    if (guildId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const onDeleteOne = async (warnId: string) => {
    if (!guildId || !canQuery) return;
    if (confirmOne !== warnId) {
      setConfirmOne(warnId);
      setTimeout(() => setConfirmOne((curr) => (curr === warnId ? null : curr)), 4000);
      return;
    }
    
    setActionLoading(warnId);
    setError(null);
    setSuccess(null);
    try {
      const warn = warns.find((w) => w.warnId === warnId);
      if (!warn) throw new Error('Verwarnung nicht gefunden.');
      await moderationApi.deleteWarn(guildId, warn.userId, warnId);
      
      // Optimistic update
      setWarns(prev => prev.filter(w => w.warnId !== warnId));
      setCount(prev => Math.max(0, prev - 1));
      setSuccess('Verwarnung wurde erfolgreich entfernt.');
      setConfirmOne(null);
      
      // Re-load in background to ensure sync
      void load(true);
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen.');
    } finally {
      setActionLoading(null);
    }
  };

  const onDeleteAll = async () => {
    if (!guildId || !canQuery) return;
    if (!confirmAll) {
      setConfirmAll(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await moderationApi.deleteAllWarnsGuild(guildId);
      setWarns([]);
      setCount(0);
      setSuccess('Alle Verwarnungen des Servers wurden gelöscht.');
      setConfirmAll(false);
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const groups = warns.reduce<Record<string, WarnItem[]>>((acc, w) => {
      (acc[w.userId] ||= []).push(w);
      return acc;
    }, {});

    if (!searchQuery.trim()) return Object.entries(groups);

    const q = searchQuery.toLowerCase();
    let filtered = Object.entries(groups).filter(([userId]) => userId.includes(q));

    // Nach Mitgliedsnamen filtern, falls in Suche
    if (searchQuery.trim()) {
      filtered = Object.entries(groups).filter(([userId]) => {
        const member = members[userId];
        if (!member) return userId.includes(q);
        return (
          userId.includes(q) || 
          member.username.toLowerCase().includes(q) || 
          member.display_name.toLowerCase().includes(q)
        );
      });
    }

    // Expliziter Member-Filter
    if (memberFilter) {
      filtered = filtered.filter(([userId]) => userId === memberFilter);
    }

    return filtered;
  }, [warns, searchQuery, members, memberFilter]);

  const memberOptions = useMemo(() => {
    const userIdsWithWarns = Array.from(new Set(warns.map(w => w.userId)));
    return userIdsWithWarns.map(id => ({
      id,
      member: members[id] || null
    })).sort((a, b) => {
      const nameA = a.member?.display_name || a.id;
      const nameB = b.member?.display_name || b.id;
      return nameA.localeCompare(nameB);
    });
  }, [warns, members]);

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        heading="Verwarnungs-Management"
        description="Überblicken und verwalten Sie alle aktiven Verwarnungen auf Ihrem Server. Hier können Sie einzelne Fehltritte korrigieren oder die Historie ganzer Benutzer bereinigen."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
        actions={
          <div className="flex items-center gap-3">
             {count > 0 && (
               <StyledBadge variant="default" className="border-[#3a3f5a] bg-[#1a1e33] text-[#cbd4ff]">
                 {count} {count === 1 ? 'Verwarnung' : 'Verwarnungen'} insgesamt
               </StyledBadge>
             )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SettingsCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca2be]" />
                  <input
                    type="text"
                    placeholder="Suchen (Name oder ID)..."
                    className="w-full rounded-md border border-[#2a2f45] bg-[#131625] py-2 pl-10 pr-4 text-sm text-[#dbe3ff] placeholder-[#5c627a] outline-none focus:border-[#4c5581]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <StyledButton onClick={() => load()} disabled={loading} variant="secondary" className="flex-1 sm:flex-none gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Lade...' : 'Aktualisieren'}
                  </StyledButton>
                </div>
              </div>

              {/* Member-Filter */}
              {memberOptions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[#2a2f45]/50">
                  <div className="flex items-center gap-2 text-[#9ca2be] text-sm shrink-0">
                    <Filter className="h-4 w-4" />
                    <span>Filter:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    <button
                      onClick={() => setMemberFilter(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        !memberFilter 
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' 
                          : 'bg-[#1a1e33] text-[#9ca2be] border border-[#2a2f45] hover:border-[#3a3f5a]'
                      }`}
                    >
                      Alle Mitglieder
                    </button>
                    {memberOptions.slice(0, 5).map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setMemberFilter(opt.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          memberFilter === opt.id
                            ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                            : 'bg-[#1a1e33] text-[#9ca2be] border border-[#2a2f45] hover:border-[#3a3f5a]'
                        }`}
                      >
                        {opt.member?.avatar_url ? (
                          <img src={opt.member.avatar_url} alt="" className="h-4 w-4 rounded-full" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span>{opt.member?.display_name || (typeof opt.id === 'string' ? opt.id.slice(0, 8) : String(opt.id))}</span>
                      </button>
                    ))}
                    {memberOptions.length > 5 && !memberFilter && (
                      <span className="text-[0.7rem] text-[#5c627a] self-center ml-1">
                        +{memberOptions.length - 5} weitere
                      </span>
                    )}
                  </div>
                  {memberFilter && (
                    <button 
                      onClick={() => setMemberFilter(null)}
                      className="text-[0.75rem] text-blue-400 hover:text-blue-300 underline underline-offset-4"
                    >
                      Filter zurücksetzen
                    </button>
                  )}
                </div>
              )}
            </div>
          </SettingsCard>

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="text-[0.92rem] font-medium">{error}</div>
              <button onClick={() => setError(null)} className="ml-auto opacity-70 hover:opacity-100">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-200 shadow-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div className="text-[0.92rem] font-medium">{success}</div>
              <button onClick={() => setSuccess(null)} className="ml-auto opacity-70 hover:opacity-100">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="space-y-4">
            {loading && warns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#9ca2be] space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin opacity-20" />
                <p>Lade Verwarnungen...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2a2f45] py-20 text-[#9ca2be] space-y-4">
                <div className="rounded-full bg-[#1a1e33] p-4">
                  <Shield className="h-8 w-8 opacity-20" />
                </div>
                <div className="text-center">
                  <h3 className="text-[#dbe3ff] font-medium">Keine Ergebnisse</h3>
                  <p className="text-sm mt-1">{searchQuery ? 'Kein Benutzer mit dieser ID gefunden.' : 'Dieser Server ist sauber. Keine aktiven Verwarnungen.'}</p>
                </div>
              </div>
            ) : (
              filteredGroups.map(([userId, list]) => (
                <div key={userId} className={`overflow-hidden rounded-xl border transition-all ${
                  memberFilter === userId ? 'border-blue-500/50 bg-[#0f111d] shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-[#2a2f45] bg-[#0f111d] shadow-sm hover:border-[#3a3f5a]'
                }`}>
                  <div className="flex items-center justify-between border-b border-[#2a2f45] bg-[#14182d]/50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {members[userId]?.avatar_url ? (
                          <img 
                            src={members[userId].avatar_url!} 
                            alt="" 
                            className="h-10 w-10 rounded-full border border-[#2a2f45] object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1e33] border border-[#2a2f45] text-[#cbd4ff]">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                        {memberFilter === userId && (
                          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                            <UserCheck className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#dbe3ff]">
                            {members[userId]?.display_name || 'Mitglied'}
                          </span>
                          {members[userId]?.username && (
                            <span className="text-[0.75rem] text-[#7c83ac]">
                              @{members[userId].username}
                            </span>
                          )}
                          <StyledBadge variant="default" className="bg-[#1a1e33] text-[0.7rem] px-1.5 font-mono opacity-80">
                            {userId}
                          </StyledBadge>
                        </div>
                        <div className="text-[0.75rem] text-[#9ca2be]">
                          {list.length} aktive {list.length === 1 ? 'Verwarnung' : 'Verwarnungen'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-[#2a2f45]">
                    {list
                      .slice()
                      .sort((a, b) => (Number(b.warnId) - Number(a.warnId)))
                      .map((w, idx) => (
                        <div key={`${w.userId}-${w.warnId}`} className="group flex items-start justify-between gap-4 p-4 transition-colors hover:bg-[#131625]/50">
                          <div className="flex gap-4">
                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1a1e33] text-[0.7rem] font-bold text-[#5c627a] border border-[#2a2f45]">
                              {list.length - idx}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[0.8rem] text-[#9ca2be]">
                                <span className="font-mono text-[0.7rem] bg-[#1a1e33] px-1 rounded border border-[#2a2f45]">ID: {String(w.warnId).slice(-8)}</span>
                              </div>
                              <p className="text-[0.95rem] leading-relaxed text-[#dbe3ff]">
                                {w.reason || <span className="italic opacity-30 text-[#9ca2be]">Kein Grund angegeben</span>}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 self-center">
                            <StyledButton 
                              onClick={() => onDeleteOne(String(w.warnId))} 
                              disabled={!!actionLoading} 
                              size="sm" 
                              variant={confirmOne === String(w.warnId) ? 'danger' : 'ghost'}
                              className="h-8 gap-2"
                            >
                              {actionLoading === String(w.warnId) ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : confirmOne === String(w.warnId) ? (
                                <>
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  <span>Bestätigen</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                                  <span className="hidden sm:inline">Entfernen</span>
                                </>
                              )}
                            </StyledButton>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SettingsCard header={<div className="flex items-center gap-2"><Shield className="h-4 w-4 text-[#7c83ac]" /><span>Moderations-Status</span></div>}>
             <div className="space-y-4">
               <div className="rounded-lg bg-[#14182d] border border-[#2a2f45] p-4">
                 <div className="text-sm text-[#9ca2be] mb-1">Auslastung</div>
                 <div className="text-2xl font-bold text-[#dbe3ff]">{count}</div>
                 <div className="mt-2 h-1.5 w-full rounded-full bg-[#0a0c14] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (count / 20) * 100)}%` }}
                    />
                 </div>
                 <p className="mt-2 text-[0.7rem] text-[#5c627a]">
                   {count > 10 ? 'Hohes Moderationsaufkommen auf diesem Server.' : 'Normale Moderationsaktivität.'}
                 </p>
               </div>
               
               <div className="space-y-2">
                 <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5c627a]">Gefahrenzone</h4>
                 <StyledButton
                    onClick={onDeleteAll}
                    disabled={!canQuery || loading || actionLoading !== null || warns.length === 0}
                    variant={confirmAll ? 'danger' : 'secondary'}
                    className="w-full justify-start gap-3 border-red-500/20 text-red-200/70 hover:bg-red-500/10 hover:text-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{confirmAll ? 'Sicher? Jetzt klicken.' : 'Alle Verwarnungen löschen'}</span>
                  </StyledButton>
                  {confirmAll && (
                    <p className="text-[0.7rem] text-red-400 px-1 animate-pulse">
                      Achtung: Dieser Vorgang kann nicht rückgängig gemacht werden.
                    </p>
                  )}
               </div>
             </div>
          </SettingsCard>

          <SettingsCard header={<div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-[#7c83ac]" /><span>Hinweis</span></div>}>
            <p className="text-[0.85rem] leading-relaxed text-[#9ca2be]">
              Verwarnungen werden dauerhaft in der Datenbank gespeichert. Das Entfernen einer Verwarnung reduziert die Warnstufe des Benutzers sofort, was eventuelle automatische Sperren (AutoMod) beeinflussen kann.
            </p>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
};

export default WarningsPage;
