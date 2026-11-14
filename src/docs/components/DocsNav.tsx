import React, { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categories } from '../categories';
import { getArticlesByCategory } from '../articles';

interface DocsNavProps {
  currentSlug?: string;
  onNavigate: (slug: string) => void;
}

export const DocsNav: React.FC<DocsNavProps> = ({ currentSlug, onNavigate }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of categories) {
      const articles = getArticlesByCategory(cat.slug);
      if (articles.some((a) => a.slug === currentSlug)) {
        initial[cat.slug] = true;
      }
    }
    return initial;
  });

  const toggle = (slug: string) => {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  return (
    <nav className="space-y-1">
      {categories.map((cat) => {
        const articles = getArticlesByCategory(cat.slug);
        const isExpanded = expanded[cat.slug] ?? false;
        const hasActive = articles.some((a) => a.slug === currentSlug);

        return (
          <div key={cat.slug}>
            <button
              onClick={() => toggle(cat.slug)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200 group",
                hasActive ? "text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/4"
              )}
            >
              <span className="flex-1 text-[0.85rem] font-medium">{cat.title}</span>
              <ChevronDown className={cn(
                "w-3.5 h-3.5 text-zinc-600 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
            </button>
            {isExpanded && (
              <div className="ml-2 pl-3 border-l border-white/6 space-y-0.5 mt-0.5 mb-2">
                {articles.map((article) => {
                  const isActive = article.slug === currentSlug;
                  return (
                    <button
                      key={article.slug}
                      onClick={() => onNavigate(article.slug)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all duration-150 text-[0.82rem]",
                        isActive
                          ? "bg-[#4b46c8]/15 text-[#c4b5fd] font-medium"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/4"
                      )}
                    >
                      <FileText className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-[#b4adff]" : "text-zinc-600")} />
                      <span className="truncate">{article.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
