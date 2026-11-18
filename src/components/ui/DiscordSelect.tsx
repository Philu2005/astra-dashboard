import React, { useEffect, useMemo, useState } from 'react';
import StyledSelect, { type SelectOption } from '@/components/ui/StyledSelect';
import { FolderTree } from 'lucide-react';

export type DiscordSelectKind = 'channel' | 'role' | 'category';

export interface DiscordEntity {
  id: string;
  name: string;
  color?: number;
}

export interface DiscordSelectProps {
  label?: string;
  placeholder?: string;
  value: string | null;
  onChange: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  items: DiscordEntity[];
  kind: DiscordSelectKind;
  disabled?: boolean;
  className?: string;
}

function roleColorToStyle(color?: number): React.CSSProperties | undefined {
  if (!color || color === 0) return undefined;
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return { color: `rgb(${r} ${g} ${b})` };
}

export const DiscordSelect: React.FC<DiscordSelectProps> = ({
  label,
  placeholder = 'Auswählen…',
  value,
  onChange,
  loading,
  error,
  items,
  kind,
  disabled,
  className,
}) => {
  const options: SelectOption[] = useMemo(() => {
    const iconFor = (ent: DiscordEntity) => {
      if (kind === 'role') {
        return <div className="h-3 w-3 rounded-full" style={{ backgroundColor: roleColorToStyle(ent.color)?.color || '#7289da' }} />;
      }
      if (kind === 'category') return <FolderTree className="h-4 w-4" />;
      // Für Channel kein Icon verwenden – stattdessen „# “ im Label
      return null;
    };
    return items.map((it) => {
      const baseLabel = it.name || it.id;
      const label = kind === 'channel' ? `# ${baseLabel}` : baseLabel;
      return {
        value: it.id,
        label,
        description: `ID: ${it.id}`,
        icon: iconFor(it) ?? undefined,
      } as SelectOption;
    });
  }, [items, kind]);

  const current = value ?? '';

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-[0.85rem] font-medium text-[#c1c7de]">{label}</label>}
      <StyledSelect
        options={options}
        value={current}
        onChange={(v) => onChange(v)}
        placeholder={loading ? 'Laden…' : error ? `Fehler: ${error}` : placeholder}
        disabled={disabled || loading}
      />
      {error && <p className="mt-1 text-[0.8rem] text-red-300">{error}</p>}
    </div>
  );
};

export default DiscordSelect;
