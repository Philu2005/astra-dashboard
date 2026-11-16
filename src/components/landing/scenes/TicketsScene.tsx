import { memo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

export const TicketsScene = memo(({ className }: { className?: string }) => {
  const reduced = useReducedMotion();
  return (
    <div className={cn('relative', className)} aria-hidden>
      <div className="absolute -right-6 top-6 h-40 w-40 rounded-full blur-2xl opacity-50"
           style={{ background: 'radial-gradient(closest-side, rgba(125,227,255,0.35), rgba(125,227,255,0))' }} />

      <svg className={cn('block mx-auto max-w-full', reduced ? '' : 'animate-[astra-float_10s_ease-in-out_infinite]')} viewBox="0 0 620 420" width="100%" height="auto">
        <defs>
          <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#141a2c" />
            <stop offset="100%" stopColor="#121628" />
          </linearGradient>
          <linearGradient id="accentT" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7de3ff" />
            <stop offset="60%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="tshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="rgba(0,0,0,0.45)" />
          </filter>
        </defs>

        {/* Board */}
        <rect x="56" y="52" width="508" height="308" rx="16" fill="url(#card)" stroke="#2c3248" filter="url(#tshadow)" />
        <rect x="56" y="52" width="508" height="50" rx="16" fill="#151a2c" />
        <rect x="76" y="68" width="120" height="14" rx="7" fill="#cfd6f4" opacity="0.9" />
        <rect x="482" y="66" width="62" height="18" rx="9" fill="url(#accentT)" />

        {/* Columns */}
        {[0,1,2].map((col) => (
          <g key={col}>
            <rect x={76 + col*158} y="118" width="140" height="22" rx="11" fill="#aab2cf" opacity="0.8" />
            {[0,1,2].map((i) => (
              <g key={i}>
                <rect x={76 + col*158} y={150 + i*62} width="140" height="48" rx="10" fill="#0f1428" stroke="#2b3350" />
                <rect x={88 + col*158} y={162 + i*62} width="92" height="12" rx="6" fill="#cdd6f6" opacity="0.9" />
                <rect x={88 + col*158} y={178 + i*62} width="62" height="10" rx="5" fill="#7de3ff" opacity="0.8" />
              </g>
            ))}
          </g>
        ))}

        {/* Moving ticket indicator */}
        <circle cx="482" cy="246" r="8" fill="#7de3ff" opacity="0.9">
          <animate attributeName="cy" values="246;208;246" dur="3.6s" repeatCount="indefinite" begin={reduced? 'indefinite':'0s'} />
        </circle>
      </svg>
    </div>
  );
});

export default TicketsScene;
