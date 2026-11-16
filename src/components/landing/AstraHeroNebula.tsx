import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type AstraHeroNebulaProps = {
  className?: string;
  intensity?: number; // 0..1
};

// Lightweight prefers-reduced-motion hook (keeps this component self-contained)
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

// Procedural star positions for a subtle unique field per mount
const useStars = (count: number, seed = 42) => {
  return useMemo(() => {
    const stars: { x: number; y: number; r: number; o: number }[] = [];
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let i = 0; i < count; i++) {
      stars.push({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.8, o: 0.25 + rnd() * 0.6 });
    }
    return stars;
  }, [count, seed]);
};

export const AstraHeroNebula = memo(({ className, intensity = 1 }: AstraHeroNebulaProps) => {
  const reduced = useReducedMotion();
  const stars = useStars(64);
  const layerRef = useRef<HTMLDivElement | null>(null);

  // Gentle parallax on mouse move (disabled when reduced motion)
  useEffect(() => {
    if (reduced) return;
    const el = layerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      el.style.setProperty('--parallax-x', `${dx * 8}px`);
      el.style.setProperty('--parallax-y', `${dy * 10}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [reduced]);

  return (
    <div
      ref={layerRef}
      className={cn(
        'relative isolate w-full h-full overflow-visible select-none [--parallax-x:0px] [--parallax-y:0px]',
        className,
      )}
      aria-hidden
    >
      {/* Glow backdrops */}
      <div className="absolute -right-[8%] -top-[14%] h-[64vmin] w-[64vmin] rounded-full blur-3xl opacity-70"
           style={{ background: 'radial-gradient(closest-side, rgba(75,70,200,0.55), rgba(75,70,200,0))', transform: 'translate3d(var(--parallax-x), var(--parallax-y), 0)' }} />
      <div className="absolute -right-[18%] top-[22%] h-[52vmin] w-[52vmin] rounded-full blur-3xl opacity-60"
           style={{ background: 'radial-gradient(closest-side, rgba(125,227,255,0.35), rgba(125,227,255,0))', transform: 'translate3d(calc(var(--parallax-x)*-0.6), calc(var(--parallax-y)*-0.6), 0)' }} />

      {/* Central abstract orb with rings */}
      <svg
        className={cn('absolute right-0 top-1/2 -translate-y-1/2 max-w-none', reduced ? '' : 'animate-[astra-float_8s_ease-in-out_infinite]')}
        width="560" height="560" viewBox="0 0 560 560" fill="none"
        style={{ transform: 'translate3d(var(--parallax-x), var(--parallax-y), 0)' }}
      >
        <defs>
          <radialGradient id="orb" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(280 260) rotate(90) scale(230 230)">
            <stop offset="0%" stopColor="#7de3ff" stopOpacity={0.95 * intensity} />
            <stop offset="45%" stopColor="#a855f7" stopOpacity={0.55 * intensity} />
            <stop offset="100%" stopColor="#4b46c8" stopOpacity={0.0} />
          </radialGradient>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7de3ff" />
            <stop offset="45%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#4b46c8" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="280" cy="260" r="220" fill="url(#orb)" filter="url(#glow)" />
        {/* Rings */}
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={280} cy={270} rx={200 - i * 18} ry={90 - i * 8} stroke="url(#ring)" opacity={0.55 - i * 0.12}
                   strokeWidth={1.6} fill="none" />
        ))}
        {/* Light sweep */}
        <path d="M40 260 C 180 220, 380 220, 520 260" stroke="url(#ring)" strokeOpacity={0.28} strokeWidth={3} />
      </svg>

      {/* Fine star field */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x * 100} cy={s.y * 100} r={s.r * 0.06} fill="#cfe8ff" opacity={s.o * 0.6 * intensity} />
        ))}
      </svg>
    </div>
  );
});

export default AstraHeroNebula;
