import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Rocket, Server, Shield, Code, LifeBuoy,
  BookOpen, ChevronRight, ArrowLeft, ArrowRight,
  Clock, ChevronLeft, ThumbsUp, ThumbsDown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SharedNavbar } from '@/components/SharedNavbar';
import { categories } from './categories';
import { allArticles, getArticle, getArticlesByCategory, getPopularArticles, getAdjacentArticles } from './articles';
import { DocsSearch } from './components/DocsSearch';
import { DocsNav } from './components/DocsNav';
import { DocsToc } from './components/DocsToc';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import type { DocArticle } from './types';
import { getReturnToFromUrl } from '@/lib/returnTo';

const iconMap: Record<string, React.ElementType> = {
  Rocket, Server, Shield, Code, LifeBuoy,
};

function getSlugFromPath(): string | null {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/docs') return null;
  const match = path.match(/^\/docs\/(.+)$/);
  return match ? match[1] : null;
}

export const DocsPage: React.FC = () => {
  const [currentSlug, setCurrentSlug] = useState<string | null>(getSlugFromPath);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const backTo = getReturnToFromUrl(undefined, '/');

  // Handle popstate for browser back/forward
  useEffect(() => {
    const handler = () => setCurrentSlug(getSlugFromPath());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Reading progress
  useEffect(() => {
    if (!currentSlug) { setReadProgress(0); return; }
    const handler = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      setReadProgress(total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [currentSlug]);

  const navigate = useCallback((slug: string | null) => {
    const path = slug ? `/docs/${slug}` : '/docs';
    const search = typeof window !== 'undefined' ? window.location.search : '';
    window.history.pushState(null, '', `${path}${search}`);
    setCurrentSlug(slug);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const article = currentSlug ? getArticle(currentSlug) : null;

  // Article view
  if (article) {
    const { prev, next } = getAdjacentArticles(article.slug);
    return (
      <div className="min-h-screen bg-[#070912]">
        {/* Reading progress bar */}
        <div className="fixed top-0 left-0 right-0 h-0.5 z-[60]">
          <div className="h-full bg-gradient-to-r from-[#4b46c8] to-[#7de3ff] transition-all duration-150" style={{ width: `${readProgress * 100}%` }} />
        </div>

        <SharedNavbar
          variant="subpage"
          activeRoute="/docs"
          showBackButton
          backTo={backTo}
          customLeftContent={
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#7de3ff]" />
              <span className="text-[0.95rem] font-bold tracking-tight text-white">Dokumentation</span>
            </div>
          }
          customRightContent={
            <div className="w-56 hidden xl:block">
              <DocsSearch onNavigate={navigate} />
            </div>
          }
        />

        {/* Sub-Header für Mobile Navigation & Breadcrumbs */}
        <div className="sticky top-[71px] z-40 bg-[#131522]/80 backdrop-blur-xl border-b border-[#212131] lg:hidden">
          <div className="max-w-[1400px] mx-auto flex items-center gap-4 px-4 sm:px-6 h-12">
            <button onClick={() => setMobileNavOpen(true)} className="p-1.5 rounded-lg hover:bg-[#1a1a2a] text-[#9ca2bd]">
              <BookOpen className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-[#8a90ad] text-[0.8rem] truncate">
              <span className="text-[#9ca2bd]">{article.category}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#d6dbf0] truncate">{article.title}</span>
            </div>
          </div>
        </div>

        {/* Mobile nav overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#121423] border-r border-[#212131] overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[0.85rem] font-semibold text-white">Navigation</span>
                <button onClick={() => setMobileNavOpen(false)} className="p-1 rounded-md hover:bg-[#1a1a2a] text-[#9ca2bd]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <DocsNav currentSlug={currentSlug ?? undefined} onNavigate={navigate} />
            </div>
          </div>
        )}

        <div className="max-w-[1400px] mx-auto flex gap-0">
          {/* Left sidebar - nav */}
          <aside className="hidden lg:block w-64 shrink-0 border-r border-[#212131]">
            <div className="sticky top-[72px] overflow-y-auto max-h-[calc(100vh-4.5rem)] p-6">
              <DocsNav currentSlug={currentSlug ?? undefined} onNavigate={navigate} />
            </div>
          </aside>

          {/* Main content */}
          <main ref={contentRef} className="flex-1 min-w-0 px-6 sm:px-10 lg:px-14 py-10 max-w-3xl">
            {/* Zurück zur Dokumentation */}
            <button
              onClick={() => navigate(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#1e2235] bg-transparent px-3.5 py-2 text-[0.84rem] font-medium text-[#9ca2bd] transition-all duration-200 hover:border-[#4b46c8]/30 hover:bg-[#4b46c8]/8 hover:text-[#c4b5fd] active:scale-[0.97] mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zur Dokumentation
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[0.78rem] text-[#8a90ad] mb-6">
              <button onClick={() => navigate(null)} className="hover:text-[#d6dbf0] transition-colors">Docs</button>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => { navigate(null); setCategoryFilter(article.categorySlug); }} className="hover:text-[#d6dbf0] transition-colors">{article.category}</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#d6dbf0]">{article.title}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">{article.title}</h1>
            <p className="text-[#9ca2bd] text-[0.95rem] leading-relaxed mb-6">{article.description}</p>
            <div className="flex items-center gap-4 text-[0.78rem] text-[#8a90ad] mb-10 pb-8 border-b border-[#212131]">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{article.readingTime} Min. Lesezeit</span>
            </div>

            {/* Sections */}
            {article.sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-20 mb-10">
                {section.level === 2 ? (
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full bg-astra-purple" />
                    {section.title}
                  </h2>
                ) : (
                  <h3 className="text-lg font-semibold text-[#d6dbf0] mb-3">{section.title}</h3>
                )}
                <MarkdownRenderer content={section.content} />
              </div>
            ))}

            {/* Feedback */}
            <div className="mt-12 pt-8 border-t border-[#212131]">
              <p className="text-[0.85rem] text-[#9ca2bd] mb-3">War dieser Artikel hilfreich?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedback((p) => ({ ...p, [article.slug]: 'up' }))}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-[0.82rem] transition-all duration-200",
                    feedback[article.slug] === 'up'
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-[#2a2f45] bg-[#131625] text-[#9ca2bd] hover:bg-[#171a2b] hover:text-white"
                  )}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Ja
                </button>
                <button
                  onClick={() => setFeedback((p) => ({ ...p, [article.slug]: 'down' }))}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-[0.82rem] transition-all duration-200",
                    feedback[article.slug] === 'down'
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : "border-[#2a2f45] bg-[#131625] text-[#9ca2bd] hover:bg-[#171a2b] hover:text-white"
                  )}
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Nein
                </button>
              </div>
            </div>

            {/* Prev/Next */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prev && (
                <button onClick={() => navigate(prev.slug)} className="flex items-center gap-3 p-4 rounded-xl border border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40 transition-all duration-200 text-left group">
                  <ArrowLeft className="w-4 h-4 text-[#8a90ad] group-hover:text-[#b4adff] transition-colors shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[0.7rem] text-[#8a90ad] uppercase tracking-wider">Vorheriger</p>
                    <p className="text-[0.85rem] text-[#d6dbf0] group-hover:text-white truncate transition-colors">{prev.title}</p>
                  </div>
                </button>
              )}
              {next && (
                <button onClick={() => navigate(next.slug)} className={cn("flex items-center gap-3 p-4 rounded-xl border border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40 transition-all duration-200 text-left group", !prev && "sm:col-start-2")}> 
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[0.7rem] text-[#8a90ad] uppercase tracking-wider">Nächster</p>
                    <p className="text-[0.85rem] text-[#d6dbf0] group-hover:text-white truncate transition-colors">{next.title}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8a90ad] group-hover:text-[#b4adff] transition-colors shrink-0" />
                </button>
              )}
            </div>
          </main>

          {/* Right sidebar - TOC */}
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-14 overflow-y-auto max-h-[calc(100vh-3.5rem)] p-4 pt-10">
              <DocsToc sections={article.sections} />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Home view
  const popular = getPopularArticles();
  const filteredArticles = categoryFilter
    ? allArticles.filter((a) => a.categorySlug === categoryFilter)
    : allArticles;

  return (
    <div className="min-h-screen bg-[#070912]">
      <SharedNavbar
        variant="subpage"
        activeRoute="/docs"
        showBackButton
        backTo={backTo}
        customLeftContent={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#7de3ff]" />
              <span className="text-[0.95rem] font-bold tracking-tight text-white">Dokumentation</span>
            </div>
          </div>
        }
        customRightContent={
          <div className="w-56 hidden xl:block">
            <DocsSearch onNavigate={navigate} />
          </div>
        }
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-astra-purple/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-astra-purple/10 rounded-full blur-[120px]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Wie können wir dir helfen?
          </h1>
          <p className="text-[#9ca2bd] text-lg mb-8 max-w-xl mx-auto">
            Finde Anleitungen, Referenzen und Antworten zu allen Funktionen des Astra Dashboards.
          </p>
          <DocsSearch onNavigate={navigate} />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Categories */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">Kategorien</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon] ?? BookOpen;
              const count = getArticlesByCategory(cat.slug).length;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
                  className={cn(
                    "group p-5 rounded-2xl border text-left transition-all duration-300",
                    categoryFilter === cat.slug
                      ? "border-astra-purple/40 bg-astra-purple/10"
                      : "border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300",
                    categoryFilter === cat.slug
                      ? "bg-astra-purple/25 text-[#b4adff]"
                      : "bg-[#171a2b] text-[#8a90ad] group-hover:bg-astra-purple/20 group-hover:text-[#b4adff]"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-[0.95rem] font-semibold text-white mb-1">{cat.title}</h3>
                  <p className="text-[0.8rem] text-[#9ca2bd] mb-2 leading-relaxed">{cat.description}</p>
                  <span className="text-[0.72rem] text-[#8a90ad]">{count} {count === 1 ? 'Artikel' : 'Artikel'}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Popular articles */}
        {!categoryFilter && (
          <section className="mb-16">
            <h2 className="text-xl font-bold text-white mb-6">Beliebte Artikel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popular.map((article) => (
                <ArticleCard key={article.slug} article={article} onNavigate={navigate} />
              ))}
            </div>
          </section>
        )}

        {/* All articles */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {categoryFilter ? categories.find((c) => c.slug === categoryFilter)?.title ?? 'Artikel' : 'Alle Artikel'}
            </h2>
            {categoryFilter && (
              <button onClick={() => setCategoryFilter(null)} className="flex items-center gap-1.5 text-[0.8rem] text-[#8a90ad] hover:text-[#d6dbf0] transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Alle anzeigen
              </button>
            )}
          </div>
          <div className="space-y-2">
            {filteredArticles.map((article) => (
              <button
                key={article.slug}
                onClick={() => navigate(article.slug)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40 transition-all duration-200 text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#171a2b] flex items-center justify-center shrink-0 group-hover:bg-astra-purple/20 transition-colors">
                  <BookOpen className="w-4 h-4 text-[#8a90ad] group-hover:text-[#b4adff] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9rem] font-medium text-[#d6dbf0] group-hover:text-white truncate transition-colors">{article.title}</p>
                  <p className="text-[0.78rem] text-[#9ca2bd] truncate">{article.description}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  <span className="text-[0.72rem] text-[#8a90ad]">{article.category}</span>
                  <span className="text-[0.72rem] text-[#8a90ad] flex items-center gap-1"><Clock className="w-3 h-3" />{article.readingTime} Min.</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8a90ad] group-hover:text-[#b4adff] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// Article card component
function ArticleCard({ article, onNavigate }: { article: DocArticle; onNavigate: (slug: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(article.slug)}
      className="group p-5 rounded-2xl border border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40 transition-all duration-300 text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-[#171a2b] flex items-center justify-center mb-3 group-hover:bg-astra-purple/20 transition-colors">
        <BookOpen className="w-4.5 h-4.5 text-[#8a90ad] group-hover:text-[#b4adff] transition-colors" />
      </div>
      <h3 className="text-[0.9rem] font-semibold text-white mb-1 group-hover:text-[#e0ddff] transition-colors">{article.title}</h3>
      <p className="text-[0.8rem] text-[#9ca2bd] leading-relaxed line-clamp-2">{article.description}</p>
      <div className="flex items-center gap-1.5 mt-3 text-[0.72rem] text-[#8a90ad]">
        <Clock className="w-3 h-3" />
        <span>{article.readingTime} Min. Lesezeit</span>
      </div>
    </button>
  );
}
