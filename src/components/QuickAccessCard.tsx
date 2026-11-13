import { cn } from '@/lib/utils';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}

export const QuickAccessCard = ({ title, description, icon: Icon, className }: QuickAccessCardProps) => {
  return (
    <div className={cn(
      "bg-[linear-gradient(180deg,#171a2b_0%,#141728_100%)] border border-[#333a55] p-4 rounded-[1rem] flex items-center gap-4 cursor-pointer hover:bg-[linear-gradient(180deg,#1b1f34_0%,#161a2d_100%)] hover:border-astra-purple/45 transition-all duration-300 group min-h-[86px]",
      className
    )}>
      <div className="w-11 h-11 rounded-xl bg-[#1e2338] flex items-center justify-center text-[#a18fff] group-hover:scale-105 transition-all duration-300 shadow-sm border border-[#39405b] group-hover:border-astra-purple/30">
        <Icon className="w-[25px] h-[25px]" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-semibold text-[1.18rem] truncate tracking-tight leading-none">{title}</h4>
        <p className="text-[#9ca2bd] text-[1.01rem] truncate font-normal leading-none mt-1.5">{description}</p>
      </div>
      <div className="p-2 rounded-lg bg-[#0f1220] text-[#8a90ad] group-hover:text-astra-cyan group-hover:translate-x-1 transition-all duration-300">
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};
