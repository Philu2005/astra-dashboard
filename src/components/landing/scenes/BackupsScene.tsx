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

export const BackupsScene = memo(({ className }: { className?: string }) => {
  const reduced = useReducedMotion();
  return (
    <div className={cn('relative', className)} aria-hidden>
      <div className="absolute right-6 bottom-0 h-36 w-36 rounded-full blur-2xl opacity-50"
           style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.4), rgba(168,85,247,0))' }} />

      <svg className={cn('block mx-auto max-w-full', reduced ? '' : 'animate-[astra-float_12s_ease-in-out_infinite]')} viewBox="0 0 620 420" width="100%" height="auto">
        <defs>
          <linearGradient id="bgB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14182a" />
            <stop offset="100%" stopColor="#0f1324" />
          </linearGradient>
          <linearGradient id="accentB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7de3ff" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#4b46c8" />
          </linearGradient>
          <filter id="shadowB" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="20" stdDeviation="14" floodColor="rgba(0,0,0,0.5)" />
          </filter>
        </defs>

        {/* device frame */}
        <rect x="86" y="70" width="448" height="280" rx="20" fill="url(#bgB)" stroke="#2c3248" filter="url(#shadowB)" />
        <rect x="86" y="70" width="448" height="54" rx="20" fill="#151a2c" />
        <rect x="110" y="88" width="140" height="14" rx="7" fill="#cfd6f4" opacity="0.9" />
        <rect x="468" y="86" width="48" height="18" rx="9" fill="url(#accentB)" />

        {/* backup items */}
        {[0,1,2,3].map((i) => (
          <g key={i}>
            <rect x="118" y={146 + i*50} width="392" height="36" rx="10" fill="#0f1428" stroke="#2b3350" />
            <rect x="136" y={156 + i*50} width="140" height="14" rx="7" fill="#cdd6f6" opacity="0.9" />
            <rect x="290" y={156 + i*50} width="96" height="14" rx="7" fill="#7de3ff" opacity="0.85" />
            <rect x="398" y={152 + i*50} width="92" height="22" rx="11" fill="#22c55e" opacity="0.9" />
          </g>
        ))}

        {/* progress bar */}
        <rect x="118" y="214" width="392" height="6" rx="3" fill="#1a2036" />
        <rect x="118" y="214" width="120" height="6" rx="3" fill="url(#accentB)">
          <animate attributeName="width" values="120;320;120" dur="4.8s" repeatCount="indefinite" begin={reduced? 'indefinite':'0s'} />
        </rect>
      </svg>
    </div>
  );
});

export default BackupsScene;
