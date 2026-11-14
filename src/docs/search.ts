import type { DocArticle } from './types';
import { allArticles } from './articles';

export interface SearchResult {
  article: DocArticle;
  score: number;
  excerpt: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/---+/g, '')
    .replace(/>\s*/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getExcerpt(text: string, query: string, maxLen = 120): string {
  const plain = stripMarkdown(text);
  const lower = plain.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return plain.slice(0, maxLen) + (plain.length > maxLen ? '…' : '');
  const start = Math.max(0, idx - 40);
  const end = Math.min(plain.length, idx + query.length + 80);
  let excerpt = '';
  if (start > 0) excerpt += '…';
  excerpt += plain.slice(start, end);
  if (end < plain.length) excerpt += '…';
  return excerpt;
}

export function searchDocs(query: string): SearchResult[] {
  if (!query || query.length < 2) return [];

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const article of allArticles) {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const descLower = article.description.toLowerCase();

    for (const term of terms) {
      // Title match (highest weight)
      if (titleLower.includes(term)) score += 10;
      // Description match
      if (descLower.includes(term)) score += 5;
      // Content match
      for (const section of article.sections) {
        const sectionTitle = section.title.toLowerCase();
        const sectionContent = section.content.toLowerCase();
        if (sectionTitle.includes(term)) score += 3;
        if (sectionContent.includes(term)) score += 1;
      }
    }

    if (score > 0) {
      // Find best excerpt from sections
      const allContent = article.sections.map((s) => s.content).join('\n');
      const excerpt = getExcerpt(allContent, query);
      results.push({ article, score, excerpt });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20);
}
