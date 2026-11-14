export interface DocArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  icon?: string;
  readingTime: number;
  popular?: boolean;
  sections: DocSection[];
}

export interface DocSection {
  id: string;
  title: string;
  level: 2 | 3;
  content: string;
}

export interface DocCategory {
  slug: string;
  title: string;
  description: string;
  icon: string;
  articles: string[]; // slugs
}
