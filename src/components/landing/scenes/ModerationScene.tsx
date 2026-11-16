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

export const ModerationScene = memo(({ className }: { className?: string }) => {
  const reduced = useReducedMotion();
  return (
    <div className={cn('relative', className)} aria-hidden>
      {/* backdrop glows */}
      <div className="absolute -left-8 top-10 h-40 w-40 rounded-full blur-2xl opacity-50"
           style={{ background: 'radial-gradient(closest-side, rgba(75,70,200,0.55), rgba(75,70,200,0))' }} />
      <div className="absolute right-0 -top-6 h-44 w-44 rounded-full blur-2xl opacity-50"
           style={{ background: 'radial-gradient(closest-side, rgba(125,227,255,0.35), rgba(125,227,255,0))' }} />

      {/* main svg card */}
      <svg className={cn('block mx-auto max-w-full', reduced ? '' : 'animate-[astra-float_9s_ease-in-out_infinite]')} viewBox="0 0 620 420" width="100%" height="auto">
        <defs>
          <linearGradient id="mgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a2f45" />
            <stop offset="100%" stopColor="#15192b" />
          </linearGradient>
          <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7de3ff" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#4b46c8" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="22" stdDeviation="16" floodColor="rgba(0,0,0,0.45)" />
          </filter>
        </defs>

        {/* window */}
        <rect x="40" y="36" width="540" height="320" rx="18" fill="url(#mgrad)" stroke="#303752" filter="url(#shadow)" />
        <rect x="40" y="36" width="540" height="54" rx="18" fill="#1b2033" />
        <circle cx="64" cy="63" r="6" fill="#ef4444" />
        <circle cx="86" cy="63" r="6" fill="#eab308" />
        <circle cx="108" cy="63" r="6" fill="#22c55e" />

        {/* left nav */}
        <rect x="56" y="112" width="140" height="210" rx="10" fill="#0f1428" stroke="#2b3350" />
        {[0,1,2,3,4].map((i) => (
          <rect key={i} x="70" y={130 + i*34} width={i===1?96:84} height="16" rx="8" fill={i===1? 'url(#accent)':'#2d3657'} opacity={i===1?1:0.6} />
        ))}

        {/* content header */}
        <rect x="216" y="116" width="184" height="20" rx="10" fill="#cdd6f6" opacity="0.9" />
        <rect x="412" y="116" width="116" height="20" rx="10" fill="#7de3ff" opacity="0.8" />

        {/* automod rule list */}
        {[0,1,2,3,4].map((i) => (
          <g key={i}>
            <rect x="216" y={154 + i*38} width="320" height="26" rx="8" fill="#12182c" stroke="#283154" />
            <rect x="232" y={160 + i*38} width="160" height="14" rx="7" fill="#aab2cf" opacity="0.85" />
            <rect x="404" y={160 + i*38} width="82" height="14" rx="7" fill="#7de3ff" opacity="0.75" />
            <rect x="494" y={160 + i*38} width="28" height="14" rx="7" fill="#22c55e" opacity="0.9" />
          </g>
        ))}

        {/* subtle scanning beam */}
        <rect x="216" y="148" width="320" height="4" fill="#7de3ff" opacity="0.25">
          <animate attributeName="x" values="216;256;216" dur="5s" repeatCount="indefinite" begin={reduced? 'indefinite':'0s'} />
        </rect>
      </svg>
    </div>
  );
});

export default ModerationScene;
