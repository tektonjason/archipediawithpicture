

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
  description: string;
  tags?: string[];
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
  history = signal<string[]>([]);
  webLinks = signal<Link[]>([]);
  readings = signal<Reading[]>([]);
  competitions = signal<Competition[]>([]);
  encyclopediaLoaded = signal(false);
  readingsLoaded = signal(false);
  resourcesLoaded = signal(false);
  competitionsLoaded = signal(false);
  encyclopediaLoading = signal(false);
  readingsLoading = signal(false);
  resourcesLoading = signal(false);
  competitionsLoading = signal(false);

  private encyclopediaLoadPromise?: Promise<void>;
  private readingsLoadPromise?: Promise<void>;
  private resourcesLoadPromise?: Promise<void>;
  private competitionsLoadPromise?: Promise<void>;

  // --- Encyclopedia View State ---
  encyclopediaScrollPosition = signal<number>(0);
  encyclopediaDisplayLimit = signal<number>(50);
  encyclopediaSelectedCategory = signal<string>('home');
  encyclopediaViewMode = signal<'grid' | 'list'>('grid');

  constructor() {
    this.initLayout();
    this.loadPreferencesFromStorage();

    effect(() => localStorage.setItem('arch_favorites', JSON.stringify(this.favorites())));
    effect(() => localStorage.setItem('arch_history', JSON.stringify(this.history())));
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
    this.favorites.update(favs => {
      if (favs.includes(id)) return favs.filter(f => f !== id);
      return [...favs, id];
    });
  }

  isFavorite(id: string) {
    return computed(() => this.favorites().includes(id));
  }

  // --- History ---
  addToHistory(term: string) {
    this.history.update(h => [term, ...h.filter(t => t !== term)].slice(0, 50));
  }

  clearHistory() {
    this.history.set([]);
  }

  // --- Links ---
  addLink(link: Link) {
    this.webLinks.update(l => [...l, link]);
  }
  
  removeLink(id: string) {
    this.webLinks.update(l => l.filter(i => i.id !== id));
  }

  updateLink(link: Link) {
      this.webLinks.update(l => l.map(i => i.id === link.id ? link : i));
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
      if (f) this.favorites.set(JSON.parse(f));
      const h = localStorage.getItem('arch_history');
      if (h) this.history.set(JSON.parse(h));
      const vm = localStorage.getItem('arch_view_mode');
      if (vm) this.encyclopediaViewMode.set(vm as 'grid' | 'list');
    } catch (err) {
      console.error('Failed to load storage', err);
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

  private syncResources(seedLinks: Link[]) {
    const currentLinks = this.webLinks();
    const currentMap = new Map<string, Link>();
    for (const link of currentLinks) {
      currentMap.set(link.id, link);
    }

    let hasChanges = false;
    const merged = [...currentLinks];

    seedLinks.forEach(seed => {
      if (!currentMap.has(seed.id)) {
        merged.push(seed);
        hasChanges = true;
      } else {
        const existing = currentMap.get(seed.id);
        if (existing) {
          const tagsChanged = JSON.stringify(existing.tags) !== JSON.stringify(seed.tags);
          if (
            existing.category !== seed.category ||
            existing.url !== seed.url ||
            existing.title !== seed.title ||
            existing.description !== seed.description ||
            tagsChanged
          ) {
            const idx = merged.findIndex(m => m.id === seed.id);
            if (idx > -1) {
              merged[idx] = { ...existing, ...seed };
              hasChanges = true;
            }
          }
        }
      }
    });

    if (hasChanges) {
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
