

// =================================================================
//
//  ARCHIPEDIA - Knowledge Base
//  Built by 曾若宽 (Zeng Ruokuan)
//
//  This content is for educational purposes only.
//  Unauthorized commercial use is strictly prohibited.
//
// =================================================================

import { Injectable, signal, computed, effect } from '@angular/core';

export interface Entry {
  id: string;
  category: string;
  subcategory: string;
  term: string;
  termEn: string;
  definition: string;
  details: string;
  imageUrl?: string;
  imagePosition?: string;
  isCustom?: boolean;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  category: string;
  subcategory?: string;
  collection?: ResourceCollection;
  description: string;
  tags?: string[];
  imageUrl?: string;
  imageAlt?: string;
  previewSourceUrl?: string;
  featuredTags?: string[];
  recommended?: boolean;
  actions?: ResourceAction[];
}

export type ResourceCollection = 'resources' | 'inspiration';

interface ResourceActionBase {
  id: string;
  label: string;
  description?: string;
  url: string;
}

export type ResourceAction =
  | (ResourceActionBase & {
      type: 'external';
    })
  | (ResourceActionBase & {
      type: 'verified-download';
      policy: 'nus-gradbook' | 'project-material';
      provider: 'dropbox' | 'baidu-pan';
    });

export type FavoriteKind = 'entry' | 'reading' | 'resource' | 'standard';

export interface ContentFavorite {
  kind: FavoriteKind;
  id: string;
  savedAt: string;
}

export interface ContentHistoryItem {
  kind: FavoriteKind;
  id: string;
  visitedAt: string;
}

export interface StandardClause {
  id: string;
  standardCode: string;
  standardTitle: string;
  clauseNo: string;
  category: string;
  title: string;
  appliesTo: string;
  requirement: string;
  numericValues: string[];
  keywords: string[];
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
  note?: string;
}

export interface StandardQuickRef {
  id: string;
  title: string;
  code: string;
  status: string;
  effectiveDate: string;
  category: string;
  useCases: string[];
  keywords: string[];
  officialUrls: string[];
  verifiedAt: string;
  note: string;
  clauses: StandardClause[];
}

export interface Reading {
  id?: string;
  title: string;
  author: string;
  publisher: string;
  year?: string;
  description: string;
  tags: string[];
  journalLevel: string | null; // e.g. "核心期刊"
  identifier: string | null;
  url?: string;
  detailContent?: string;
  imageUrl?: string;
  citation: ReadingCitation;
}

export interface ReadingCitation {
  type: 'book' | 'journal';
  creators: string[];
  publicationPlace?: string;
  publisher?: string;
  publicationYear?: string;
  containerTitle?: string;
  edition?: string;
  volumeIssue?: string;
  pages?: string;
  accessDate?: string;
  identifier?: string;
  url?: string;
  verifiedBy: string;
}

export interface Competition {
  level: string;     // 级别
  type: string;      // 种类
  name: string;      // 竞赛名称
  organizer: string; // 主办单位
  note: string;      // 备注
  url: string;       // 网址
  deadline: string;  // 报名截至时间
  month?: number;    // 1-12, derived from deadline
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // --- Layout State ---
  // Default to true, but we will adjust in constructor
  isSidebarOpen = signal<boolean>(true);

  // --- Admin State ---
  isAdmin = signal<boolean>(false);

  // --- Toast Notification State ---
  toastMessage = signal('');
  showToast = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  
  // --- Global Modal States ---
  showLoginModal = signal(false);
  showLogoutModal = signal(false);
  loginEmail = signal('');
  loginPass = signal('');
  loginError = signal('');

  // --- External Link Modal State ---
  showExternalModal = signal(false);
  externalUrl = signal('');
  externalModalSuppressed = signal(false); // New state to suppress modal for current session

  openExternalModal(url: string) {
    if (!url) return;
    
    // Check if suppressed
    if (this.externalModalSuppressed()) {
      window.open(url, '_blank');
      return;
    }

    this.externalUrl.set(url);
    this.showExternalModal.set(true);
  }

  closeExternalModal() {
    this.showExternalModal.set(false);
  }

  confirmExternalNavigation(suppress: boolean = false) {
    const url = this.externalUrl();
    if (url) {
      window.open(url, '_blank');
    }
    
    if (suppress) {
      this.externalModalSuppressed.set(true);
    }
    
    this.showExternalModal.set(false);
  }

  // --- Data Stores ---
  entries = signal<Entry[]>([]);
  favorites = signal<string[]>([]);
  favoriteItems = signal<ContentFavorite[]>([]);
  history = signal<string[]>([]);
  historyItems = signal<ContentHistoryItem[]>([]);
  entryNotes = signal<Record<string, string>>({});
  standardClauseNotes = signal<Record<string, string>>({});
  webLinks = signal<Link[]>([]);
  readings = signal<Reading[]>([]);
  competitions = signal<Competition[]>([]);
  standards = signal<StandardQuickRef[]>([]);
  encyclopediaLoaded = signal(false);
  readingsLoaded = signal(false);
  resourcesLoaded = signal(false);
  competitionsLoaded = signal(false);
  standardsLoaded = signal(false);
  encyclopediaLoading = signal(false);
  readingsLoading = signal(false);
  resourcesLoading = signal(false);
  competitionsLoading = signal(false);
  standardsLoading = signal(false);

  private encyclopediaLoadPromise?: Promise<void>;
  private readingsLoadPromise?: Promise<void>;
  private resourcesLoadPromise?: Promise<void>;
  private competitionsLoadPromise?: Promise<void>;
  private standardsLoadPromise?: Promise<void>;

  // --- Encyclopedia View State ---
  encyclopediaScrollPosition = signal<number>(0);
  encyclopediaDisplayLimit = signal<number>(50);
  encyclopediaSelectedCategory = signal<string>('home');
  encyclopediaViewMode = signal<'grid' | 'list'>('grid');
  resourcesViewMode = signal<'list' | 'cards'>('list');
  inspirationViewMode = signal<'list' | 'cards'>('list');

  constructor() {
    this.initLayout();
    this.loadPreferencesFromStorage();

    effect(() => localStorage.setItem('arch_favorites', JSON.stringify(this.favorites())));
    effect(() => localStorage.setItem('arch_content_favorites', JSON.stringify(this.favoriteItems())));
    effect(() => localStorage.setItem('arch_history', JSON.stringify(this.history())));
    effect(() => localStorage.setItem('arch_content_history', JSON.stringify(this.historyItems())));
    effect(() => localStorage.setItem('arch_entry_notes_v1', JSON.stringify(this.entryNotes())));
    effect(() => localStorage.setItem('arch_standard_clause_notes_v1', JSON.stringify(this.standardClauseNotes())));
    effect(() => {
      if (this.encyclopediaLoaded()) {
        localStorage.setItem('arch_entries', JSON.stringify(this.entries()));
      }
    });
    effect(() => {
      if (this.resourcesLoaded()) {
        localStorage.setItem('arch_links', JSON.stringify(this.webLinks()));
      }
    });
    effect(() => localStorage.setItem('arch_view_mode', this.encyclopediaViewMode()));
    effect(() => localStorage.setItem('arch_resources_view_mode', this.resourcesViewMode()));
    effect(() => localStorage.setItem('arch_inspiration_view_mode', this.inspirationViewMode()));
  }

  private initLayout() {
    // Check if running in browser environment
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768; // Tailwind md breakpoint
      // On mobile, start closed. On desktop, start open.
      this.isSidebarOpen.set(!isMobile);
    }
  }

  // --- Layout ---
  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setSidebarState(isOpen: boolean) {
    this.isSidebarOpen.set(isOpen);
  }

  // --- Auth/Modal Logic ---
  handleAdminAction() {
    if (this.isAdmin()) {
      this.showLogoutModal.set(true);
    } else {
      this.loginEmail.set('');
      this.loginPass.set('');
      this.loginError.set('');
      this.showLoginModal.set(true);
    }
  }

  performLogin() {
    if (this.login(this.loginEmail(), this.loginPass())) {
      this.showLoginModal.set(false);
    } else {
      this.loginError.set('认证失败：账号或密码错误');
    }
  }

  confirmLogout() {
    this.logout();
    this.showLogoutModal.set(false);
  }

  closeLoginModal() {
    this.showLoginModal.set(false);
  }

  // --- Auth ---
  login(email: string, pass: string): boolean {
    if (email === 'tektonjason@163.com' && pass === '123456') {
      this.isAdmin.set(true);
      return true;
    }
    return false;
  }

  logout() {
    this.isAdmin.set(false);
  }

  displayToast(message: string, duration: number = 3000) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    this.toastMessage.set(message);
    this.showToast.set(true);

    this.toastTimer = setTimeout(() => {
      this.showToast.set(false);
      this.toastTimer = null;
    }, duration);
  }

  // --- Entry Management ---
  getEntry(id: string) {
    return computed(() => this.entries().find(e => e.id === id));
  }

  addEntry(entry: Entry) {
    this.entries.update(list => [...list, entry]);
  }

  updateEntry(updated: Entry) {
    this.entries.update(list => list.map(e => e.id === updated.id ? updated : e));
  }

  deleteEntry(id: string) {
    this.entries.update(list => list.filter(e => e.id !== id));
  }

  // --- Favorites ---
  toggleFavorite(id: string) {
    this.toggleFavoriteItem('entry', id);
  }

  isFavorite(id: string) {
    return computed(() => this.favoriteItems().some(item => item.kind === 'entry' && item.id === id));
  }

  toggleFavoriteItem(kind: FavoriteKind, id: string) {
    if (!id) return;

    let nextItems: ContentFavorite[] = [];
    this.favoriteItems.update(items => {
      const exists = items.some(item => item.kind === kind && item.id === id);
      nextItems = exists
        ? items.filter(item => !(item.kind === kind && item.id === id))
        : [...items, { kind, id, savedAt: new Date().toISOString() }];
      return nextItems;
    });

    this.syncLegacyEntryFavorites(nextItems);
  }

  isFavoriteItem(kind: FavoriteKind, id: string) {
    return computed(() => this.favoriteItems().some(item => item.kind === kind && item.id === id));
  }

  // --- Entry Notes ---
  getEntryNote(id: string): string {
    return this.entryNotes()[id] ?? '';
  }

  hasEntryNote(id: string): boolean {
    return this.getEntryNote(id).trim().length > 0;
  }

  setEntryNote(id: string, note: string) {
    if (!id) return;
    const value = note.trim();
    this.entryNotes.update(notes => {
      const next = { ...notes };
      if (value) {
        next[id] = value;
      } else {
        delete next[id];
      }
      return next;
    });
  }

  // --- Standard Clause Notes ---
  getStandardClauseNote(id: string): string {
    return this.standardClauseNotes()[id] ?? '';
  }

  hasStandardClauseNote(id: string): boolean {
    return this.getStandardClauseNote(id).trim().length > 0;
  }

  setStandardClauseNote(id: string, note: string) {
    if (!id) return;
    const value = note.trim();
    this.standardClauseNotes.update(notes => {
      const next = { ...notes };
      if (value) {
        next[id] = value;
      } else {
        delete next[id];
      }
      return next;
    });
  }

  // --- History ---
  addToHistory(term: string) {
    const entry = this.entries().find(item => item.term === term || item.id === term);
    if (entry) {
      this.addHistoryItem('entry', entry.id);
      return;
    }

    this.history.update(h => [term, ...h.filter(t => t !== term)].slice(0, 50));
  }

  addHistoryItem(kind: FavoriteKind, id: string) {
    if (!id) return;
    let nextItems: ContentHistoryItem[] = [];
    this.historyItems.update(items => {
      nextItems = [
        { kind, id, visitedAt: new Date().toISOString() },
        ...items.filter(item => !(item.kind === kind && item.id === id))
      ].slice(0, 80);
      return nextItems;
    });
    this.syncLegacyEntryHistory(nextItems);
  }

  clearHistory() {
    this.history.set([]);
    this.historyItems.set([]);
  }

  // --- Links ---
  addLink(link: Link) {
    this.webLinks.update(l => [...l, { ...link, collection: link.collection ?? 'resources' }]);
  }
  
  removeLink(id: string) {
    this.webLinks.update(l => l.filter(i => i.id !== id));
  }

  updateLink(link: Link) {
      this.webLinks.update(l => l.map(i => i.id === link.id ? link : i));
  }

  getResourcePreview(link: Link): string {
    return link.imageUrl || `/images/resources/${link.id}.webp`;
  }

  getResourceCollection(link: Link): ResourceCollection {
    return link.collection ?? 'resources';
  }

  // --- Image Handling ---
  async compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.7;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          while (dataUrl.length > 135000 && quality > 0.1) {
             quality -= 0.1;
             dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  private loadPreferencesFromStorage() {
    try {
      localStorage.removeItem('arch_chat');
      const f = localStorage.getItem('arch_favorites');
      const legacyFavorites = f ? this.parseStringArray(f) : [];
      const contentFavorites = localStorage.getItem('arch_content_favorites');
      if (contentFavorites) {
        const parsed = this.parseContentFavorites(contentFavorites);
        this.favoriteItems.set(parsed);
        this.syncLegacyEntryFavorites(parsed);
      } else if (legacyFavorites.length) {
        const migrated = legacyFavorites.map(id => ({
          kind: 'entry' as const,
          id,
          savedAt: new Date().toISOString()
        }));
        this.favoriteItems.set(migrated);
        this.favorites.set(legacyFavorites);
      }
      const h = localStorage.getItem('arch_history');
      if (h) this.history.set(this.parseStringArray(h));
      const contentHistory = localStorage.getItem('arch_content_history');
      if (contentHistory) {
        this.historyItems.set(this.parseContentHistory(contentHistory));
      }
      const entryNotes = localStorage.getItem('arch_entry_notes_v1');
      if (entryNotes) {
        this.entryNotes.set(this.parseNotesRecord(entryNotes));
      }
      const standardNotes = localStorage.getItem('arch_standard_clause_notes_v1');
      if (standardNotes) {
        this.standardClauseNotes.set(this.parseNotesRecord(standardNotes));
      }
      const vm = localStorage.getItem('arch_view_mode');
      if (vm) this.encyclopediaViewMode.set(vm as 'grid' | 'list');
      const rvm = localStorage.getItem('arch_resources_view_mode');
      if (rvm === 'list' || rvm === 'cards') this.resourcesViewMode.set(rvm);
      const ivm = localStorage.getItem('arch_inspiration_view_mode');
      if (ivm === 'list' || ivm === 'cards') this.inspirationViewMode.set(ivm);
    } catch (err) {
      console.error('Failed to load storage', err);
    }
  }

  private parseStringArray(value: string): string[] {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  private parseContentFavorites(value: string): ContentFavorite[] {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is ContentFavorite => {
        return item &&
          (item.kind === 'entry' || item.kind === 'reading' || item.kind === 'resource' || item.kind === 'standard') &&
          typeof item.id === 'string' &&
          typeof item.savedAt === 'string';
      });
    } catch {
      return [];
    }
  }

  private parseContentHistory(value: string): ContentHistoryItem[] {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is ContentHistoryItem => {
        return item &&
          (item.kind === 'entry' || item.kind === 'reading' || item.kind === 'resource' || item.kind === 'standard') &&
          typeof item.id === 'string' &&
          typeof item.visitedAt === 'string';
      });
    } catch {
      return [];
    }
  }

  private syncLegacyEntryFavorites(items: ContentFavorite[]) {
    this.favorites.set(items.filter(item => item.kind === 'entry').map(item => item.id));
  }

  private parseNotesRecord(value: string): Record<string, string> {
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, note]) => {
        if (typeof key === 'string' && typeof note === 'string') {
          acc[key] = note;
        }
        return acc;
      }, {});
    } catch {
      return {};
    }
  }

  private syncLegacyEntryHistory(items: ContentHistoryItem[]) {
    const entries = new Map(this.entries().map(entry => [entry.id, entry.term]));
    this.history.set(items
      .filter(item => item.kind === 'entry')
      .map(item => entries.get(item.id) ?? item.id));
  }

  private migrateLegacyEntryHistory() {
    if (this.historyItems().length || !this.history().length) return;

    const entries = this.entries();
    const now = Date.now();
    const migrated = this.history()
      .map((term, index) => {
        const entry = entries.find(item => item.term === term || item.id === term);
        if (!entry) return null;
        return {
          kind: 'entry' as const,
          id: entry.id,
          visitedAt: new Date(now - index * 1000).toISOString()
        };
      })
      .filter((item): item is ContentHistoryItem => !!item);

    if (migrated.length) {
      this.historyItems.set(migrated);
      this.syncLegacyEntryHistory(migrated);
    }
  }

  async ensureEncyclopediaLoaded(): Promise<void> {
    if (this.encyclopediaLoaded()) return;
    if (this.encyclopediaLoadPromise) return this.encyclopediaLoadPromise;

    this.encyclopediaLoading.set(true);
    this.encyclopediaLoadPromise = import('../data/archipedia-seed')
      .then(({ ARCHIPEDIA_ROWS, CATEGORY_IMAGE_CONFIG }) => {
        const stored = localStorage.getItem('arch_entries');
        if (stored) {
          try {
            this.entries.set(JSON.parse(stored));
          } catch {
            localStorage.removeItem('arch_entries');
          }
        }
        this.seedArchipediaData(ARCHIPEDIA_ROWS, CATEGORY_IMAGE_CONFIG);
        this.migrateLegacyEntryHistory();
        this.encyclopediaLoaded.set(true);
      })
      .finally(() => {
        this.encyclopediaLoading.set(false);
        this.encyclopediaLoadPromise = undefined;
      });

    return this.encyclopediaLoadPromise;
  }

  async ensureReadingsLoaded(): Promise<void> {
    if (this.readingsLoaded()) return;
    if (this.readingsLoadPromise) return this.readingsLoadPromise;

    this.readingsLoading.set(true);
    this.readingsLoadPromise = import('../data/readings-seed')
      .then(({ SEED_READINGS }) => {
        this.seedReadingsData(SEED_READINGS);
        this.readingsLoaded.set(true);
      })
      .finally(() => {
        this.readingsLoading.set(false);
        this.readingsLoadPromise = undefined;
      });

    return this.readingsLoadPromise;
  }

  async ensureResourcesLoaded(): Promise<void> {
    if (this.resourcesLoaded()) return;
    if (this.resourcesLoadPromise) return this.resourcesLoadPromise;

    this.resourcesLoading.set(true);
    this.resourcesLoadPromise = import('../data/resources-seed')
      .then(({ SEED_RESOURCES }) => {
        const stored = localStorage.getItem('arch_links');
        if (stored) {
          try {
            this.webLinks.set(JSON.parse(stored));
          } catch {
            localStorage.removeItem('arch_links');
          }
        }
        this.syncResources(SEED_RESOURCES);
        this.resourcesLoaded.set(true);
      })
      .finally(() => {
        this.resourcesLoading.set(false);
        this.resourcesLoadPromise = undefined;
      });

    return this.resourcesLoadPromise;
  }

  async ensureCompetitionsLoaded(): Promise<void> {
    if (this.competitionsLoaded()) return;
    if (this.competitionsLoadPromise) return this.competitionsLoadPromise;

    this.competitionsLoading.set(true);
    this.competitionsLoadPromise = import('../data/competitions-seed')
      .then(({ SEED_COMPETITIONS }) => {
        this.seedCompetitionsData(SEED_COMPETITIONS);
        this.competitionsLoaded.set(true);
      })
      .finally(() => {
        this.competitionsLoading.set(false);
        this.competitionsLoadPromise = undefined;
      });

    return this.competitionsLoadPromise;
  }

  async ensureStandardsLoaded(): Promise<void> {
    if (this.standardsLoaded()) return;
    if (this.standardsLoadPromise) return this.standardsLoadPromise;

    this.standardsLoading.set(true);
    this.standardsLoadPromise = import('../data/standards-seed')
      .then(({ SEED_STANDARDS }) => {
        this.standards.set(SEED_STANDARDS);
        this.standardsLoaded.set(true);
      })
      .finally(() => {
        this.standardsLoading.set(false);
        this.standardsLoadPromise = undefined;
      });

    return this.standardsLoadPromise;
  }

  private syncResources(seedLinks: Link[]) {
    const currentLinks = this.webLinks();
    const currentMap = new Map(currentLinks.map(link => [link.id, link]));
    const seedIds = new Set(seedLinks.map(link => link.id));

    const orderedSeedLinks = seedLinks.map(seedLink => {
      const seed: Link = {
        ...seedLink,
        imageUrl: seedLink.imageUrl ?? `/images/resources/${seedLink.id}.webp`,
        imageAlt: seedLink.imageAlt ?? `${seedLink.title} 资源预览`,
        previewSourceUrl: seedLink.previewSourceUrl ?? seedLink.url
      };
      const existing = currentMap.get(seed.id);
      return existing ? { ...existing, ...seed } : seed;
    });

    const customLinks = currentLinks.filter(link => !seedIds.has(link.id));
    const merged = [...orderedSeedLinks, ...customLinks];

    if (JSON.stringify(currentLinks) !== JSON.stringify(merged)) {
      this.webLinks.set(merged);
    }
  }

  private seedReadingsData(seedReadings: Reading[]) {
    this.readings.set(seedReadings.map((item, index) => ({
      ...item,
      id: item.id ?? `r${index + 1}`,
      imageUrl: item.imageUrl ?? `/images/book/s${index + 1}.webp`
    })));
  }

  private seedCompetitionsData(seedCompetitions: Competition[]) {
    const competitions: Competition[] = seedCompetitions.map(d => {
      let month: number | undefined;
      const mMatch = d.deadline.match(/(\d{1,2})月/);
      if (mMatch) {
        month = parseInt(mMatch[1], 10);
      }

      return {
        ...d,
        month
      };
    });

    this.competitions.set(competitions);
  }

  private seedArchipediaData(
    rows: Array<[string, string, string, string, string, string]>,
    imageConfig: Record<string, { basePath: string; prefix?: string }>
  ) {
    const currentEntries = this.entries();
    const currentMap = new Map(currentEntries.map(e => [e.id, e]));
    const uniqueEntries = new Map<string, Entry>();
    const categoryImageCounters = new Map<string, number>();

    rows.forEach(row => {
      const id = row[2] + '_' + row[0];
      const existing = currentMap.get(id);
      const category = row[0];

      let imageUrl = existing?.imageUrl;
      const cfg = imageConfig[category];

      if (cfg) {
        const current = categoryImageCounters.get(category) ?? 0;
        const nextIndex = current + 1;
        categoryImageCounters.set(category, nextIndex);

        const prefix = cfg.prefix ?? '';
        const filename = prefix ? `${prefix}${nextIndex}.webp` : `${nextIndex}.webp`;

        if (category === '中国古代建筑' || !imageUrl) {
          imageUrl = `${cfg.basePath}/${filename}`;
        }
      }

      const entry: Entry = {
        id,
        category,
        subcategory: row[1],
        term: row[2],
        termEn: row[3],
        definition: row[4],
        details: row[5],
        imageUrl,
        imagePosition: row[2] === '北京宪章' ? 'top' : (existing?.imagePosition ?? 'center'),
        isCustom: existing?.isCustom ?? false
      };

      if (!uniqueEntries.has(entry.id)) {
        uniqueEntries.set(entry.id, entry);
      }

      currentMap.delete(id);
    });

    currentMap.forEach(entry => {
      if (entry.isCustom) {
        uniqueEntries.set(entry.id, entry);
      }
    });

    this.entries.set(Array.from(uniqueEntries.values()));
  }
}
