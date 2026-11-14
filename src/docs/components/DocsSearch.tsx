import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchDocs, type SearchResult } from '../search';

interface DocsSearchProps {
  onNavigate: (slug: string) => void;
}

export const DocsSearch: React.FC<DocsSearchProps> = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  useEffect(() => {
    const r = searchDocs(query);
    setResults(r);
    setSelectedIdx(0);
  }, [query]);

  const handleSelect = useCallback((slug: string) => {
    setOpen(false);
    onNavigate(slug);
  }, [onNavigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx].article.slug);
    }
  };

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIdx] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full max-w-xl mx-auto h-12 px-4 rounded-lg border border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40 text-[#9ca2bd] transition-all duration-200 group"
      >
        <Search className="w-4.5 h-4.5 text-[#8a90ad] group-hover:text-[#b7bed8] transition-colors" />
        <span className="flex-1 text-left text-[0.9rem]">Dokumentation durchsuchen…</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#171a2b] border border-[#2a2f45] text-[0.7rem] text-[#8a90ad] font-mono">
          /
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-[#121423] border border-[#2a2f45] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 h-14 border-b border-[#212131]">
              <Search className="w-4.5 h-4.5 text-[#8a90ad] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Suche nach Artikeln, Funktionen, Endpunkten…"
                className="flex-1 bg-transparent text-white text-[0.95rem] placeholder:text-[#8a90ad] outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 rounded-md hover:bg-[#171a2b] text-[#8a90ad] hover:text-[#b7bed8] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="px-2 py-1 rounded-md bg-[#171a2b] border border-[#2a2f45] text-[0.7rem] text-[#8a90ad] font-mono hover:bg-[#1a1a2a] transition-colors">
                ESC
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
              {query.length >= 2 && results.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <Search className="w-10 h-10 text-[#8a90ad] mx-auto mb-3" />
                  <p className="text-[#9ca2bd] text-[0.9rem]">Keine Ergebnisse für „{query}"</p>
                  <p className="text-[#8a90ad] text-[0.8rem] mt-1">Versuche andere Suchbegriffe</p>
                </div>
              )}
              {query.length < 2 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-[#8a90ad] text-[0.85rem]">Mindestens 2 Zeichen eingeben</p>
                </div>
              )}
              {results.map((result, idx) => (
                <button
                  key={result.article.slug}
                  onClick={() => handleSelect(result.article.slug)}
                  className={cn(
                    "w-full flex items-start gap-3.5 px-5 py-3 text-left transition-colors duration-100",
                    idx === selectedIdx ? "bg-astra-purple/15" : "hover:bg-[#1a1a2a]"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    idx === selectedIdx ? "bg-astra-purple/30 text-[#b4adff]" : "bg-[#171a2b] text-[#8a90ad]"
                  )}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[0.9rem] font-medium truncate", idx === selectedIdx ? "text-white" : "text-[#d6dbf0]")}> 
                        {result.article.title}
                      </span>
                      <span className="text-[0.7rem] text-[#8a90ad] shrink-0">{result.article.category}</span>
                    </div>
                    <p className="text-[0.8rem] text-[#9ca2bd] truncate mt-0.5">{result.excerpt}</p>
                  </div>
                  {idx === selectedIdx && <ArrowRight className="w-4 h-4 text-[#b4adff] mt-2 shrink-0" />}
                </button>
              ))}
            </div>

            {/* Footer */}
            {results.length > 0 && (
              <div className="flex items-center gap-4 px-5 py-2.5 border-t border-[#212131] text-[0.7rem] text-[#8a90ad]">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-[#171a2b] border border-[#2a2f45] font-mono">↑↓</kbd> Navigieren</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-[#171a2b] border border-[#2a2f45] font-mono">↵</kbd> Öffnen</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-[#171a2b] border border-[#2a2f45] font-mono">ESC</kbd> Schließen</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
