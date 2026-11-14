import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { DocSection } from '../types';

interface DocsTocProps {
  sections: DocSection[];
}

export const DocsToc: React.FC<DocsTocProps> = ({ sections }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (sections.length < 2) return null;

  return (
    <div className="space-y-2">
      <p className="text-[0.7rem] font-semibold text-zinc-500 uppercase tracking-wider px-1">
        Auf dieser Seite
      </p>
      <nav className="space-y-0.5">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => handleClick(section.id)}
              className={cn(
                "w-full text-left px-2.5 py-1.5 rounded-md text-[0.8rem] transition-all duration-150 block",
                section.level === 3 && "pl-5",
                isActive
                  ? "text-[#c4b5fd] bg-[#4b46c8]/10 font-medium"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/4"
              )}
            >
              {section.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
