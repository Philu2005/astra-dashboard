import type { DocArticle } from '../types';
import { gettingStarted } from './getting-started';
import { discordLogin } from './discord-login';
import { dashboardOverview } from './dashboard-overview';
import { serverOverview } from './server-overview';
import { serverDetails } from './server-details';
import { serverRoles } from './server-roles';
import { authentication } from './authentication';
import { sessions } from './sessions';
import { privacy } from './privacy';
import { architecture } from './architecture';
import { apiReference } from './api-reference';
import { frontendStack } from './frontend-stack';
import { backendStack } from './backend-stack';
import { troubleshooting } from './troubleshooting';
import { faq } from './faq';

export const allArticles: DocArticle[] = [
  gettingStarted,
  discordLogin,
  dashboardOverview,
  serverOverview,
  serverDetails,
  serverRoles,
  authentication,
  sessions,
  privacy,
  architecture,
  apiReference,
  frontendStack,
  backendStack,
  troubleshooting,
  faq,
];

const articleMap = new Map<string, DocArticle>();
for (const article of allArticles) {
  articleMap.set(article.slug, article);
}

export function getArticle(slug: string): DocArticle | undefined {
  return articleMap.get(slug);
}

export function getArticlesByCategory(categorySlug: string): DocArticle[] {
  return allArticles.filter((a) => a.categorySlug === categorySlug);
}

export function getPopularArticles(): DocArticle[] {
  return allArticles.filter((a) => a.popular);
}

export function getAdjacentArticles(slug: string): { prev: DocArticle | null; next: DocArticle | null } {
  const idx = allArticles.findIndex((a) => a.slug === slug);
  return {
    prev: idx > 0 ? allArticles[idx - 1] : null,
    next: idx < allArticles.length - 1 ? allArticles[idx + 1] : null,
  };
}
