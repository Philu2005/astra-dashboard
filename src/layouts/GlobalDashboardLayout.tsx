import React, { useEffect, useState } from 'react';
import GlobalSidebar from '@/layouts/GlobalSidebar';
import { Topbar } from '@/layouts/Topbar';
import { AstraLogo } from '@/components/AstraLogo';
import { useSidebar } from '@/contexts/SidebarContext';

interface GlobalDashboardLayoutProps {
  children: React.ReactNode;
}

export const GlobalDashboardLayout: React.FC<GlobalDashboardLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, isDesktop, close } = useSidebar();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1050);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070912] flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 right-[-150px] w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(75,70,200,0.34)_0%,rgba(75,70,200,0)_60%)] animate-[astra-shift_10s_ease-in-out_infinite]" />
          <div className="absolute top-[32%] right-[12%] w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(125,227,255,0.18)_0%,rgba(125,227,255,0)_72%)] animate-[astra-float_8.5s_ease-in-out_infinite]" />
          <div className="absolute left-[17%] top-[22%] w-2 h-2 rounded-full bg-[#8ddcff]/35 animate-[astra-orbit_9s_ease-in-out_infinite]" />
          <div className="absolute left-[24%] top-[64%] w-1.5 h-1.5 rounded-full bg-[#9f97ff]/45 animate-[astra-orbit_11s_ease-in-out_infinite]" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[1.8rem] border border-[#5f5ad6]/40 animate-[astra-loader-spin_5.5s_linear_infinite]" />
            <div className="absolute inset-2 rounded-[1.45rem] border border-[#7de3ff]/30 animate-[astra-loader-spin_3.8s_linear_infinite_reverse]" />
            <div className="relative flex items-center justify-center w-[75px] h-[75px] bg-[#4b46c8] rounded-[1.35rem] shadow-astra-glow border border-[#5f5ad6]/20 overflow-hidden shrink-0 animate-[astra-pulse_2.6s_ease-in-out_infinite]">
              <AstraLogo size={75} glow="soft" fill className="scale-[1.18]" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[#c6cbdf] text-sm tracking-[0.16em] uppercase font-semibold">Astra wird geladen</p>
            <div className="h-1.5 w-40 rounded-full bg-[#171b2f] overflow-hidden border border-[#343a54]">
              <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#7de3ff_0%,#7b6fff_56%,#4b46c8_100%)] animate-[astra-loader-progress_1.9s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-[#070912] text-white overflow-hidden relative flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(75,70,200,0.34)_0%,rgba(75,70,200,0.14)_18%,rgba(75,70,200,0)_44%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_20%,rgba(125,227,255,0.2)_0%,rgba(125,227,255,0.08)_14%,rgba(125,227,255,0)_36%)]" />
        <div className="absolute right-[12%] top-[14%] w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(125,227,255,0.2)_0%,rgba(125,227,255,0)_72%)] animate-[astra-float_14s_ease-in-out_infinite]" />
        <div className="absolute right-[36%] top-[26%] w-2 h-2 rounded-full bg-[#8ddcff]/35 animate-[astra-shift_18s_ease-in-out_infinite]" />
        <div className="absolute right-[24%] top-[38%] w-1.5 h-1.5 rounded-full bg-[#9b93ff]/40 animate-[astra-float_20s_ease-in-out_infinite]" />
      </div>

      <GlobalSidebar />

      {/* Mobile Overlay */}
      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={close}
        />
      )}

      <div className="flex flex-col h-full w-full relative z-10 min-h-0">
        <div className="lg:ml-[278px] shrink-0">
          <Topbar />
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 xl:px-10 lg:pt-6 lg:pb-8 lg:ml-[278px]">
          <div className="w-full h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default GlobalDashboardLayout;
