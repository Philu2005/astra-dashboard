import astraLogo from '@/assets/Idee_2_blau.jpg';
import { cn } from '@/lib/utils';

type AstraLogoProps = {
  size?: number;
  className?: string;
  glow?: 'none' | 'soft' | 'hero' | 'ultra';
  alt?: string;
  fill?: boolean;
};

export const AstraLogo = ({
  size = 40,
  className,
  glow = 'none',
  alt = 'Astra Logo',
  fill = false,
}: AstraLogoProps) => {
  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        glow === 'soft' && 'before:absolute before:inset-[-16%] before:rounded-full before:bg-[radial-gradient(circle,rgba(125,227,255,0.34)_0%,rgba(125,227,255,0)_70%)]',
        glow === 'hero' && 'before:absolute before:inset-[-20%] before:rounded-full before:bg-[radial-gradient(circle,rgba(168,85,247,0.46)_0%,rgba(125,227,255,0.26)_34%,rgba(125,227,255,0)_72%)]',
        glow === 'ultra' && 'before:absolute before:inset-[-30%] before:rounded-full before:bg-[radial-gradient(circle,rgba(125,227,255,0.5)_0%,rgba(75,70,200,0.3)_40%,rgba(0,0,0,0)_80%)] after:absolute after:inset-0 after:rounded-full after:shadow-[0_0_15px_rgba(125,227,255,0.4)]',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={astraLogo}
        alt={alt}
        width={size}
        height={size}
        className={cn(
          'relative z-10 h-full w-full transition-transform duration-500',
          fill ? 'object-cover scale-[1.18]' : 'object-contain'
        )}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};
