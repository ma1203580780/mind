export interface NewsStory {
  id: string; eventKey: string; category: string; kind: string;
  title: string; summary: string; why: string; action: string;
  sourceName: string; sourceUrl: string; publishedDate: string;
  automated?: boolean; publishedAt?: string; fetchedAt?: string; feedUrl?: string; domain?: string; updateOf?: string;
  image?: string; imageAlt?: string; imageKind?: string; imageSourceUrl?: string;
  sourceLanguage?: 'zh'|'en'; contentLanguage?: 'zh'|'en'; titleZh?: string; summaryZh?: string;
  translationStatus?: string; translationProvider?: string; translationModel?: string; summaryTruncated?: boolean; author?: string;
}
export interface NewsIssue {
  automated?: boolean; date: string; checkedAt: string; title: string; intro: string;
  briefing: string[]; stories: NewsStory[];
}
const files = import.meta.glob('../data/news/*.json', { eager: true, import: 'default' });
export const issues = Object.values(files).sort((a: any, b: any) => b.date.localeCompare(a.date)) as NewsIssue[];
export const newsDate = (date: string) => date.replaceAll('-', '.');
export const sourceHost = (url: string) => new URL(url).hostname.replace(/^www\./, '');
export const displayTitle = (s:NewsStory) => s.titleZh || s.title;
export const displaySummary = (s:NewsStory) => s.summaryZh || s.summary;
export const sourceLanguage = (s:NewsStory) => s.sourceLanguage || 'en';
