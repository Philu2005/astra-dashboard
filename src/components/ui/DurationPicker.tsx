import React, { useMemo } from 'react';
import StyledSelect, { type SelectOption } from '@/components/ui/StyledSelect';

export interface DurationPickerProps {
  /** Aktueller Wert in der Einheit, die `unit` angibt (Stunden oder Minuten). */
  value: number;
  /** Einheit des Wertes. */
  unit: 'hours' | 'minutes';
  /** Callback bei Änderung – liefert den neuen Wert in der gleichen Einheit. */
  onChange: (value: number) => void;
  /** Minimum (in der angegebenen Einheit). */
  min?: number;
  /** Maximum (in der angegebenen Einheit). */
  max?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

function formatHours(h: number): string {
  if (h === 0) return 'Deaktiviert';
  if (h < 24) return h === 1 ? '1 Stunde' : `${h} Stunden`;
  const d = Math.floor(h / 24);
  const rest = h % 24;
  const dLabel = d === 1 ? '1 Tag' : `${d} Tage`;
  if (rest === 0) return dLabel;
  return `${dLabel} ${rest} Std.`;
}

function formatMinutes(m: number): string {
  if (m === 0) return 'Deaktiviert';
  if (m < 60) return m === 1 ? '1 Minute' : `${m} Minuten`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  const hLabel = h === 1 ? '1 Stunde' : `${h} Stunden`;
  if (rest === 0) return hLabel;
  return `${hLabel} ${rest} Min.`;
}

function buildOptions(unit: 'hours' | 'minutes', min: number, max: number): SelectOption[] {
  const opts: SelectOption[] = [];

  if (unit === 'hours') {
    // Sinnvolle Stunden-Presets statt 0-720
    const steps = [0, 1, 2, 3, 4, 6, 8, 12, 18, 24, 36, 48, 72, 96, 120, 168, 336, 504, 720];
    for (const h of steps) {
      if (h < min || h > max) continue;
      opts.push({ value: String(h), label: formatHours(h) });
    }
  } else {
    // Sinnvolle Minutenintervalle
    const steps = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720, 1440, 2880, 4320, 7200, 10080];
    for (const m of steps) {
      if (m < min || m > max) continue;
      opts.push({ value: String(m), label: formatMinutes(m) });
    }
  }

  return opts;
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  unit,
  onChange,
  min = 0,
  max = unit === 'hours' ? 720 : 10080,
  label,
  description,
  disabled,
  className,
}) => {
  const options = useMemo(() => {
    const opts = buildOptions(unit, min, max);
    // Sicherstellen, dass der aktuelle Wert enthalten ist
    if (!opts.find(o => o.value === String(value))) {
      const lbl = unit === 'hours' ? formatHours(value) : formatMinutes(value);
      opts.push({ value: String(value), label: lbl });
      opts.sort((a, b) => Number(a.value) - Number(b.value));
    }
    return opts;
  }, [unit, min, max, value]);

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-[0.9rem] font-medium text-[#dbe3ff]">{label}</label>}
      {description && <p className="mb-2 text-[0.8rem] leading-relaxed text-[#8b8fad]">{description}</p>}
      <StyledSelect
        options={options}
        value={String(value)}
        onChange={(v) => onChange(Number(v))}
        placeholder="Auswählen…"
        disabled={disabled}
      />
    </div>
  );
};

export default DurationPicker;
