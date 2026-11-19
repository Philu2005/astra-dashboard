import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
}

export const StatCard = ({ title, value, trend, trendUp, subtitle, icon: Icon, className }: StatCardProps) => {
  return (
    <div className={cn("bg-[linear-gradient(180deg,#151828_0%,#121524_100%)] border border-[#2e334a] p-4 sm:p-5 rounded-[1.05rem] hover:border-astra-purple/50 transition-all duration-300 group relative overflow-hidden shadow-astra min-w-0 h-full", className)}>
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_42%)] pointer-events-none" />
      <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-[#1d2238] text-[#9b95ff] group-hover:text-astra-cyan group-hover:bg-astra-purple/18 transition-all duration-300 shadow-[0_12px_26px_-20px_rgba(75,70,200,0.95)] border border-[#353c56] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 sm:w-[25px] sm:h-[25px]" strokeWidth={2} />
          </div>
          <span className="text-[#d5daef] text-[1rem] sm:text-[1.24rem] font-medium leading-none">{title}</span>
        </div>
        <div>
          <h3 className="text-[1.8rem] sm:text-[2.75rem] font-bold text-white tracking-tight leading-none">{value}</h3>
          {trend && (
            <p className={cn(
              "text-[1rem] sm:text-[1.34rem] font-semibold mt-2 flex items-center gap-1.5 leading-none",
              trendUp ? "text-emerald-400" : "text-red-400"
            )}>
              {trendUp ? '+' : '-'}{trend} diese Woche
            </p>
          )}
          {subtitle && (
            <p className="text-[0.75rem] sm:text-[0.85rem] text-[#9399b5] mt-1.5 font-medium leading-none opacity-80 uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
