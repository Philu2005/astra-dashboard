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

function buildOptions(unit: 'hours' | 'minutes', min: number, max: number): SelectOption[] {
  const opts: SelectOption[] = [];

  if (unit === 'hours') {
    for (let h = min; h <= max; h++) {
      const label = h === 0 ? 'Deaktiviert' : h === 1 ? '1 Stunde' : `${h} Stunden`;
      opts.push({ value: String(h), label });
    }
  } else {
    // Sinnvolle Minutenintervalle
    const steps = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720, 1440, 2880, 4320, 7200, 10080];
    for (const m of steps) {
      if (m < min || m > max) continue;
      let label: string;
      if (m === 0) {
        label = 'Deaktiviert';
      } else if (m < 60) {
        label = `${m} Minuten`;
      } else {
        const h = Math.floor(m / 60);
        const rest = m % 60;
        label = rest === 0
          ? (h === 1 ? '1 Stunde' : `${h} Stunden`)
          : `${h} Std. ${rest} Min.`;
      }
      opts.push({ value: String(m), label });
    }
    // Falls der aktuelle Wert nicht in den Steps ist, einfügen
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
      let lbl: string;
      if (value === 0) {
        lbl = 'Deaktiviert';
      } else if (unit === 'hours') {
        lbl = value === 1 ? '1 Stunde' : `${value} Stunden`;
      } else if (value < 60) {
        lbl = `${value} Minuten`;
      } else {
        const h = Math.floor(value / 60);
        const rest = value % 60;
        lbl = rest === 0
          ? (h === 1 ? '1 Stunde' : `${h} Stunden`)
          : `${h} Std. ${rest} Min.`;
      }
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
