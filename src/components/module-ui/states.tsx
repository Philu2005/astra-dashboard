import React from 'react';
import { cn } from '@/lib/utils';

export interface ModuleEmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const ModuleEmptyState: React.FC<ModuleEmptyStateProps> = ({ icon, title, description, action, className }) => {
  return (
    <div className={cn('rounded-xl border border-[#2d3246] bg-[#141728] p-6 text-center shadow-astra', className)}>
      {icon && <div className="mx-auto mb-3 h-10 w-10 text-[#9ca2be]">{icon}</div>}
      <div className="text-[1.05rem] font-semibold text-white">{title}</div>
      {description && <div className="mt-1 text-[0.92rem] text-[#9ca2be]">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export interface ModuleLoadingStateProps {
  lines?: number;
  className?: string;
}

export const ModuleLoadingState: React.FC<ModuleLoadingStateProps> = ({ lines = 4, className }) => {
  return (
    <div className={cn('rounded-xl border border-[#2d3246] bg-[#141728] p-5 shadow-astra', className)}>
      <div className="space-y-3">
        {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-[#1b1f33]" />
        ))}
      </div>
    </div>
  );
};

export interface ModuleErrorStateProps {
  message: React.ReactNode;
  retry?: React.ReactNode;
  className?: string;
}

export const ModuleErrorState: React.FC<ModuleErrorStateProps> = ({ message, retry, className }) => {
  return (
    <div className={cn('rounded-xl border border-red-600/40 bg-[#1a1317] p-5 shadow-astra', className)}>
      <div className="text-[0.95rem] text-red-300">{message}</div>
      {retry && <div className="mt-3">{retry}</div>}
    </div>
  );
};

export default ModuleEmptyState;
