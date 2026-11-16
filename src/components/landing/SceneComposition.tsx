import { memo, type ReactNode, type ComponentType } from 'react';
import { cn } from '@/lib/utils';

type SceneCompositionProps = {
  id?: string;
  title: string;
  eyebrow?: string;
  description: string | ReactNode;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  reverse?: boolean; // image left / text right when true
  Illustration: ComponentType<{ className?: string }>;
  className?: string;
};

export const SceneComposition = memo(({ id, title, eyebrow, description, bullets, ctaHref, ctaLabel, reverse = false, Illustration, className }: SceneCompositionProps) => {
  return (
    <section id={id} className={cn('relative grid grid-cols-1 gap-8 border-b border-layout-divider py-10 lg:grid-cols-2 lg:items-center', className)}>
      <div className={cn('order-2 lg:order-1', reverse && 'lg:order-2')}
           aria-labelledby={id ? `${id}-title` : undefined}
      >
        {eyebrow && (
          <p className="inline-flex items-center gap-2 rounded-full border border-[#3e4370] bg-[#171a2d]/70 px-3 py-1.5 text-[0.82rem] text-[#d4daf2]">{eyebrow}</p>
        )}
        <h2 id={id ? `${id}-title` : undefined} className="mt-3 text-[clamp(1.75rem,2.8vw,2.25rem)] font-semibold tracking-tight text-white">{title}</h2>
        <div className="mt-2 text-[1.02rem] leading-relaxed text-[#b8bfd9]">{description}</div>
        {bullets && bullets.length > 0 && (
          <ul className="mt-4 space-y-2 text-[#d4daf0]">
            {bullets.map((b) => (
              <li key={b} className="inline-flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7de3ff]" />
                {b}
              </li>
            ))}
          </ul>
        )}
        {ctaHref && ctaLabel && (
          <a href={ctaHref} className="mt-5 inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#7770f5] bg-[linear-gradient(138deg,#6662e8_0%,#4b46c8_52%,#b14fff_100%)] px-5 py-2.5 text-sm font-semibold text-white tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9f95ff] hover:shadow-[0_14px_28px_-16px_rgba(168,85,247,0.9)]">
            {ctaLabel}
          </a>
        )}
      </div>
      <div className={cn('order-1 lg:order-2', reverse && 'lg:order-1')} aria-hidden>
        <Illustration className="w-full max-w-[600px] mx-auto" />
      </div>
    </section>
  );
});

export default SceneComposition;
