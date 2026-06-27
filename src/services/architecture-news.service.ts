import { Injectable, signal } from '@angular/core';

export interface ArchitectureNewsSource {
  name: string;
  homeUrl: string;
}

export interface ArchitectureNewsItem {
  id: string;
  title: string;
  titleZh?: string;
  source: string;
  url: string;
  sourceHomeUrl: string;
  summary: string;
  summaryZh?: string;
  imageUrl?: string;
  publishedAt?: string;
}

interface ArchitectureNewsCache {
  updatedAt?: string;
  sources?: ArchitectureNewsSource[];
  items?: ArchitectureNewsItem[];
}

const STORAGE_KEY = 'arch_architecture_news_cache_v2';

const FALLBACK_SOURCES: ArchitectureNewsSource[] = [
  { name: 'ArchDaily', homeUrl: 'https://www.archdaily.com' },
  { name: 'Archeyes', homeUrl: 'https://archeyes.com' },
  { name: 'Dezeen', homeUrl: 'https://www.dezeen.com' },
  { name: 'designboom', homeUrl: 'https://www.designboom.com' },
  { name: 'Architectuul', homeUrl: 'https://architectuul.com' },
  { name: '有方', homeUrl: 'https://www.archiposition.com' }
];

const FALLBACK_ITEMS: ArchitectureNewsItem[] = [
  {
    id: 'fallback-archdaily-projects',
    title: 'Architecture Projects',
    titleZh: '建筑项目',
    source: 'ArchDaily',
    url: 'https://www.archdaily.com/search/projects',
    sourceHomeUrl: 'https://www.archdaily.com',
    summary: '精选全球建筑项目、竞赛、观点与案例。',
    summaryZh: '精选全球建筑项目、竞赛、观点与案例。',
    publishedAt: '2026-06-27T00:00:00+08:00'
  },
  {
    id: 'fallback-archeyes',
    title: 'Architecture, Design and Theory',
    titleZh: '建筑、设计与理论',
    source: 'Archeyes',
    url: 'https://archeyes.com/',
    sourceHomeUrl: 'https://archeyes.com',
    summary: '建筑历史、设计案例与建筑师专题。',
    summaryZh: '建筑历史、设计案例与建筑师专题。',
    publishedAt: '2026-06-27T00:00:00+08:00'
  },
  {
    id: 'fallback-dezeen',
    title: 'Architecture news and projects',
    titleZh: '建筑新闻与项目',
    source: 'Dezeen',
    url: 'https://www.dezeen.com/architecture/',
    sourceHomeUrl: 'https://www.dezeen.com',
    summary: '来自 Dezeen 的建筑项目、建筑师访谈与设计文化资讯。',
    summaryZh: '来自 Dezeen 的建筑项目、建筑师访谈与设计文化资讯。',
    publishedAt: '2026-06-27T00:00:00+08:00'
  },
  {
    id: 'fallback-designboom',
    title: 'Architecture archive',
    titleZh: '建筑档案',
    source: 'designboom',
    url: 'https://www.designboom.com/architecture/',
    sourceHomeUrl: 'https://www.designboom.com',
    summary: '来自 designboom 的国际建筑项目、装置与设计资讯。',
    summaryZh: '来自 designboom 的国际建筑项目、装置与设计资讯。',
    publishedAt: '2026-06-27T00:00:00+08:00'
  },
  {
    id: 'fallback-architectuul',
    title: 'Architects, Architecture - Building Knowledge',
    titleZh: '建筑师与建筑知识网络',
    source: 'Architectuul',
    url: 'https://architectuul.com/',
    sourceHomeUrl: 'https://architectuul.com',
    summary: '以建筑师、建筑作品和城市为线索的知识网络。',
    summaryZh: '以建筑师、建筑作品和城市为线索的知识网络。',
    publishedAt: '2026-06-27T00:00:00+08:00'
  },
  {
    id: 'fallback-archiposition',
    title: '高品质建筑资讯门户',
    titleZh: '高品质建筑资讯门户',
    source: '有方',
    url: 'https://www.archiposition.com/',
    sourceHomeUrl: 'https://www.archiposition.com',
    summary: '关注中国建筑现场、建筑评论与公共文化。',
    summaryZh: '关注中国建筑现场、建筑评论与公共文化。',
    publishedAt: '2026-06-27T00:00:00+08:00'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ArchitectureNewsService {
  items = signal<ArchitectureNewsItem[]>(FALLBACK_ITEMS);
  sources = signal<ArchitectureNewsSource[]>(FALLBACK_SOURCES);
  updatedAt = signal<string>('');
  loading = signal(false);
  error = signal('');

  private loadPromise?: Promise<void>;
  private loaded = false;

  load(force = false): Promise<void> {
    if (this.loadPromise && !force) {
      return this.loadPromise;
    }

    if (this.loaded && !force) {
      return Promise.resolve();
    }

    this.applyCachedSnapshot();
    this.loading.set(true);
    this.error.set('');

    const cacheBust = force ? `?t=${Date.now()}` : '';
    this.loadPromise = fetch(`news-cache.json${cacheBust}`, {
      cache: force ? 'reload' : 'default'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`news-cache.json ${response.status}`);
        }
        return response.json() as Promise<ArchitectureNewsCache>;
      })
      .then(snapshot => {
        this.applySnapshot(snapshot);
        this.persistSnapshot(snapshot);
        this.loaded = true;
      })
      .catch(error => {
        this.error.set(error instanceof Error ? error.message : String(error));
        this.loaded = true;
      })
      .finally(() => {
        this.loading.set(false);
        this.loadPromise = undefined;
      });

    return this.loadPromise;
  }

  private applyCachedSnapshot() {
    if (typeof localStorage === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      this.applySnapshot(JSON.parse(raw) as ArchitectureNewsCache);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private applySnapshot(snapshot: ArchitectureNewsCache) {
    const sources = this.normalizeSources(snapshot.sources);
    const items = this.normalizeItems(snapshot.items);

    if (sources.length) {
      this.sources.set(sources);
    }
    if (items.length) {
      this.items.set(items);
    }
    if (snapshot.updatedAt) {
      this.updatedAt.set(snapshot.updatedAt);
    }
  }

  private persistSnapshot(snapshot: ArchitectureNewsCache) {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage can be unavailable in private browsing; the in-memory fallback is enough.
    }
  }

  private normalizeSources(sources: ArchitectureNewsCache['sources']): ArchitectureNewsSource[] {
    if (!Array.isArray(sources)) return [];
    return sources.filter(source => source?.name && source?.homeUrl);
  }

  private normalizeItems(items: ArchitectureNewsCache['items']): ArchitectureNewsItem[] {
    if (!Array.isArray(items)) return [];

    return items
      .filter(item => item?.title && item?.url && /^https?:\/\//i.test(item.url))
      .map(item => ({
        ...item,
        summary: item.summary || '来自专业建筑媒体的最新资讯。',
        titleZh: item.titleZh || item.title,
        summaryZh: item.summaryZh || item.summary || '来自专业建筑媒体的最新资讯。',
        sourceHomeUrl: item.sourceHomeUrl || FALLBACK_SOURCES.find(source => source.name === item.source)?.homeUrl || item.url
      }))
      .slice(0, 16);
  }
}
