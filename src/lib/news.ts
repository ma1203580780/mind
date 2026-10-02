export interface NewsStory {
  id: string; eventKey: string; category: string; kind: string;
  title: string; summary: string; why: string; action: string;
  sourceName: string; sourceUrl: string; publishedDate: string;
  updateOf?: string; image?: string; imageAlt?: string;
}
export interface NewsIssue {
  date: string; checkedAt: string; title: string; intro: string;
  briefing: string[]; stories: NewsStory[];
}
const files = import.meta.glob('../data/news/*.json', { eager: true, import: 'default' });
export const issues = Object.values(files).sort((a: any, b: any) => b.date.localeCompare(a.date)) as NewsIssue[];
export const newsDate = (date: string) => date.replaceAll('-', '.');
export const sourceHost = (url: string) => new URL(url).hostname.replace(/^www\./, '');
