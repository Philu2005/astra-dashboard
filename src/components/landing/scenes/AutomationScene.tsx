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

export const AutomationScene = memo(({ className }: { className?: string }) => {
  const reduced = useReducedMotion();
  return (
    <div className={cn('relative', className)} aria-hidden>
      <div className="absolute left-0 bottom-2 h-40 w-40 rounded-full blur-2xl opacity-50"
           style={{ background: 'radial-gradient(closest-side, rgba(75,70,200,0.45), rgba(75,70,200,0))' }} />

      <svg className={cn('block mx-auto max-w-full', reduced ? '' : 'animate-[astra-float_11s_ease-in-out_infinite]')} viewBox="0 0 620 420" width="100%" height="auto">
        <defs>
          <linearGradient id="bgA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#151a2c" />
            <stop offset="100%" stopColor="#0f1426" />
          </linearGradient>
          <linearGradient id="wire" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7de3ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="shadowA" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="20" stdDeviation="14" floodColor="rgba(0,0,0,0.5)" />
          </filter>
        </defs>

        <rect x="54" y="56" width="512" height="300" rx="16" fill="url(#bgA)" stroke="#2c3248" filter="url(#shadowA)" />

        {/* nodes */}
        {[
          { x: 118, y: 128 },
          { x: 276, y: 128 },
          { x: 436, y: 128 },
          { x: 118, y: 246 },
          { x: 276, y: 246 },
          { x: 436, y: 246 },
        ].map((n, i) => (
          <g key={i}>
            <rect x={n.x - 44} y={n.y - 24} width="88" height="48" rx="10" fill="#0f1428" stroke="#2b3350" />
            <rect x={n.x - 30} y={n.y - 8} width="60" height="12" rx="6" fill="#cdd6f6" opacity="0.9" />
            <rect x={n.x - 30} y={n.y + 8} width="38" height="10" rx="5" fill="#7de3ff" opacity="0.8" />
          </g>
        ))}

        {/* wires */}
        <path d="M162 128 C 200 128, 236 128, 276 128" stroke="url(#wire)" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M320 128 C 360 128, 396 128, 436 128" stroke="url(#wire)" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M162 246 C 200 246, 236 246, 276 246" stroke="url(#wire)" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M320 246 C 360 246, 396 246, 436 246" stroke="url(#wire)" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M276 150 C 276 184, 276 210, 276 246" stroke="url(#wire)" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M436 150 C 436 184, 436 210, 436 246" stroke="url(#wire)" strokeWidth="3" fill="none" opacity="0.7" />

        {/* flow pulse */}
        <circle r="5" fill="#7de3ff" opacity="0.95">
          <animateMotion dur="4.2s" repeatCount="indefinite" begin={reduced? 'indefinite':'0s'} path="M162 128 C 200 128, 236 128, 276 128 M320 128 C 360 128, 396 128, 436 128 M436 150 C 436 184, 436 210, 436 246 M320 246 C 360 246, 396 246, 436 246" />
        </circle>
      </svg>
    </div>
  );
});

export default AutomationScene;
