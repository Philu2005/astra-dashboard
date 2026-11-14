import { AstraLogo } from '@/components/AstraLogo';
import { apiClient } from '@/lib/api-client';

type StaticInfoPageProps = {
  title: string;
  description: string;
  showHomeActions?: boolean;
};

export const StaticInfoPage = ({ title, description, showHomeActions = false }: StaticInfoPageProps) => {
  return (
    <div className="min-h-screen bg-[#070912] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(75,70,200,0.28)_0%,rgba(75,70,200,0)_38%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_14%,rgba(125,227,255,0.2)_0%,rgba(125,227,255,0)_30%)]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-14 sm:py-20">
        <a href="/" className="inline-flex items-center gap-3 rounded-xl border border-layout-divider bg-layout-topbar/70 px-4 py-2.5 hover:bg-layout-hover transition-colors group">
          <div className="relative flex items-center justify-center w-9 h-9 bg-[#4b46c8] rounded-xl shadow-astra-glow border border-[#5f5ad6]/20 overflow-hidden shrink-0 transition-transform group-hover:scale-105">
            <AstraLogo size={32} glow="soft" fill className="scale-[1.18]" alt="Astra" />
          </div>
          <span className="font-semibold tracking-tight text-white">Astra</span>
        </a>

        <section className="mt-8 sm:mt-12 rounded-[1.4rem] border border-layout-divider bg-[linear-gradient(180deg,#141728_0%,#111422_100%)] p-6 sm:p-8 md:p-10 shadow-astra">
          <h1 className="text-[2rem] sm:text-[2.5rem] leading-tight tracking-[-0.02em] font-semibold">{title}</h1>
          <p className="mt-4 text-[#c2c8df] text-[1.05rem] sm:text-[1.15rem] leading-relaxed max-w-2xl">{description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {showHomeActions ? (
              <>
                <a href={apiClient.getLoginUrl()} className="inline-flex items-center justify-center rounded-xl border border-[#6861e1] bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] px-5 py-2.5 text-sm font-semibold tracking-wide hover:scale-[1.01] transition-transform">
                  Anmelden
                </a>
                <a href="/" className="inline-flex items-center justify-center rounded-xl border border-layout-divider bg-layout-hover px-5 py-2.5 text-sm font-semibold tracking-wide hover:border-[#5e66a0] transition-colors">
                  Zur Homepage
                </a>
              </>
            ) : (
              <a href="/dashboard" className="inline-flex items-center justify-center rounded-xl border border-[#6861e1] bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] px-5 py-2.5 text-sm font-semibold tracking-wide hover:scale-[1.01] transition-transform">
                Dashboard öffnen
              </a>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
