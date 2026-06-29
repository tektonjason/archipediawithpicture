import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService, Entry, FavoriteKind, Link, Reading, StandardClause, StandardQuickRef } from '../../services/data.service';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';

type ContentFilter = 'all' | FavoriteKind;
type DashboardTab = 'favorites' | 'history' | 'notes';

interface EntryItem {
  kind: 'entry';
  savedAt: string;
  entry: Entry;
}

interface ReadingItem {
  kind: 'reading';
  savedAt: string;
  reading: Reading;
}

interface ResourceItem {
  kind: 'resource';
  savedAt: string;
  resource: Link;
}

interface StandardItem {
  kind: 'standard';
  savedAt: string;
  standard: StandardQuickRef;
  clause: StandardClause;
}

type DisplayItem = EntryItem | ReadingItem | ResourceItem | StandardItem;

interface NoteDisplayItem {
  kind: 'entry' | 'standard';
  id: string;
  title: string;
  subtitle: string;
  note: string;
}

@Component({
  selector: 'app-user-dashboard',
  imports: [RouterLink, NgTemplateOutlet, GsapCardHoverDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page text-white">
      <div class="ui-page-header ui-page-pad bg-app mb-0 transition-all">
        <h2 class="ui-title">用户中心</h2>
        <p class="ui-subtitle">User Dashboard</p>
      </div>

      <div class="flex shrink-0 border-b border-white/10 px-6 md:px-8">
        @for (tab of tabs; track tab.value) {
          <button
            (click)="selectTab(tab.value)"
            class="mr-8 border-b-2 py-4 text-sm font-bold transition-all last:mr-0"
            [class.border-blue-500]="activeTab() === tab.value"
            [class.text-white]="activeTab() === tab.value"
            [class.border-transparent]="activeTab() !== tab.value"
            [class.text-gray-500]="activeTab() !== tab.value"
            [class.hover:text-gray-300]="activeTab() !== tab.value"
          >{{ tab.label }}</button>
        }
      </div>

      <div class="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
        @if (activeTab() === 'favorites') {
          <div class="mb-6 flex flex-wrap gap-2">
            @for (filter of filters; track filter.value) {
              <button
                type="button"
                (click)="favoriteFilter.set(filter.value)"
                class="ui-chip"
                [class.bg-white]="favoriteFilter() === filter.value"
                [class.text-black]="favoriteFilter() === filter.value"
                [class.bg-white/5]="favoriteFilter() !== filter.value"
                [class.text-gray-300]="favoriteFilter() !== filter.value"
              >
                {{ filter.label }} {{ favoriteCount(filter.value) }}
              </button>
            }
          </div>

          @if (favoriteItems().length === 0) {
            <div class="ui-empty-state h-60 opacity-80">
              <div class="ui-empty-icon"><svg lucideStar class="h-8 w-8" [strokeWidth]="1.8"></svg></div>
              <p class="font-medium">暂无收藏内容</p>
              <p class="mt-1 text-sm text-gray-500">百科、读物、资源和规范条文都可以收藏到这里。</p>
            </div>
          } @else {
            <div class="grid gap-4">
              @for (item of favoriteItems(); track item.kind + itemId(item)) {
                <ng-container [ngTemplateOutlet]="contentCard" [ngTemplateOutletContext]="{ $implicit: item, mode: 'favorite' }"></ng-container>
              }
            </div>
          }
        } @else if (activeTab() === 'history') {
          <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap gap-2">
              @for (filter of filters; track filter.value) {
                <button
                  type="button"
                  (click)="historyFilter.set(filter.value)"
                  class="ui-chip"
                  [class.bg-white]="historyFilter() === filter.value"
                  [class.text-black]="historyFilter() === filter.value"
                  [class.bg-white/5]="historyFilter() !== filter.value"
                  [class.text-gray-300]="historyFilter() !== filter.value"
                >
                  {{ filter.label }} {{ historyCount(filter.value) }}
                </button>
              }
            </div>
            <button (click)="dataService.clearHistory()" class="rounded bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300">清空历史</button>
          </div>

          @if (historyItems().length === 0) {
            <div class="ui-empty-state h-60 w-full opacity-80">
              <div class="ui-empty-icon"><svg lucideHistory class="h-8 w-8" [strokeWidth]="1.8"></svg></div>
              <p class="text-center font-medium">暂无历史记录</p>
            </div>
          } @else {
            <div class="grid gap-4">
              @for (item of historyItems(); track item.kind + itemId(item)) {
                <ng-container [ngTemplateOutlet]="contentCard" [ngTemplateOutletContext]="{ $implicit: item, mode: 'history' }"></ng-container>
              }
            </div>
          }
        } @else {
          @if (noteItems().length === 0) {
            <div class="ui-empty-state h-60 w-full opacity-80">
              <div class="ui-empty-icon"><svg lucideStickyNote class="h-8 w-8" [strokeWidth]="1.8"></svg></div>
              <p class="text-center font-medium">暂无笔记</p>
              <p class="mt-1 text-sm text-gray-500">百科词条和规范条文的笔记会保存在这里。</p>
            </div>
          } @else {
            <div class="grid gap-4 md:grid-cols-2">
              @for (item of noteItems(); track item.kind + item.id) {
                <div class="ui-card ui-card-hover p-4" appGsapCardHover>
                  <div class="mb-3 flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="mb-1 flex items-center gap-2">
                        <span
                          class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          [class.bg-blue-500/10]="item.kind === 'entry'"
                          [class.text-blue-300]="item.kind === 'entry'"
                          [class.bg-cyan-500/10]="item.kind === 'standard'"
                          [class.text-cyan-300]="item.kind === 'standard'"
                        >{{ item.kind === 'entry' ? '百科' : '规范' }}</span>
                        <span class="truncate text-xs text-gray-600">{{ item.subtitle }}</span>
                      </div>
                      <h3 class="truncate text-base font-bold text-white">{{ item.title }}</h3>
                    </div>
                    <button type="button" (click)="removeNote(item)" class="ui-icon-btn h-8 w-8" title="删除笔记" aria-label="删除笔记">
                      <svg lucideTrash2 class="h-4 w-4" [strokeWidth]="2"></svg>
                    </button>
                  </div>
                  <p class="min-h-16 whitespace-pre-wrap rounded-control border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-gray-300">{{ item.note }}</p>
                  <div class="mt-3 flex justify-end">
                    @if (item.kind === 'entry') {
                      <a [routerLink]="['/entry', item.id]" class="ui-btn-secondary px-3 py-1.5 text-xs">查看词条</a>
                    } @else {
                      <a [routerLink]="['/standards']" [queryParams]="{ q: item.title }" class="ui-btn-secondary px-3 py-1.5 text-xs">查看条文</a>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>

      <ng-template #contentCard let-item let-mode="mode">
        @if (item.kind === 'entry') {
          <div class="ui-card ui-card-hover flex items-center justify-between gap-4 p-4" appGsapCardHover>
            <div class="min-w-0">
              <div class="mb-1 flex items-center gap-2">
                <span class="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">百科</span>
                <span class="text-xs text-gray-600">{{ formatSavedAt(item.savedAt) }}</span>
              </div>
              <h3 class="truncate text-base font-bold text-white">{{ item.entry.term }}</h3>
              <p class="text-sm text-gray-500">{{ item.entry.category }}</p>
              @if (dataService.hasEntryNote(item.entry.id)) {
                <p class="mt-2 line-clamp-1 text-xs text-blue-200/80">笔记：{{ dataService.getEntryNote(item.entry.id) }}</p>
              }
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <a [routerLink]="['/entry', item.entry.id]" class="ui-btn-secondary px-3 py-1.5 text-xs">查看</a>
              @if (mode === 'favorite') {
                <button (click)="dataService.toggleFavoriteItem('entry', item.entry.id)" class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-yellow-500/20">
                  <svg lucideStar class="h-5 w-5 text-yellow-400" fill="currentColor" [strokeWidth]="2"></svg>
                </button>
              }
            </div>
          </div>
        } @else if (item.kind === 'reading') {
          <div class="ui-card ui-card-hover flex items-center justify-between gap-4 p-4" appGsapCardHover>
            <div class="min-w-0">
              <div class="mb-1 flex items-center gap-2">
                <span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">读物</span>
                <span class="text-xs text-gray-600">{{ formatSavedAt(item.savedAt) }}</span>
              </div>
              <h3 class="truncate text-base font-bold text-white">{{ item.reading.title }}</h3>
              <p class="text-sm text-gray-500">{{ item.reading.author || item.reading.publisher }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <a [routerLink]="['/readings']" [queryParams]="{ reading: item.reading.id }" class="ui-btn-secondary px-3 py-1.5 text-xs">详情</a>
              @if (mode === 'favorite') {
                <button (click)="dataService.toggleFavoriteItem('reading', item.reading.id || '')" class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-yellow-500/20">
                  <svg lucideStar class="h-5 w-5 text-yellow-400" fill="currentColor" [strokeWidth]="2"></svg>
                </button>
              }
            </div>
          </div>
        } @else if (item.kind === 'resource') {
          <div class="ui-card ui-card-hover flex items-center justify-between gap-4 p-4" appGsapCardHover>
            <div class="flex min-w-0 items-center gap-4">
              <img [src]="resourceImage(item.resource)" [alt]="item.resource.imageAlt || item.resource.title" loading="lazy" decoding="async" class="h-14 w-20 shrink-0 rounded-control border border-white/10 bg-white/5 object-cover">
              <div class="min-w-0">
                <div class="mb-1 flex items-center gap-2">
                  <span class="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">资源</span>
                  <span class="text-xs text-gray-600">{{ formatSavedAt(item.savedAt) }}</span>
                </div>
                <h3 class="truncate text-base font-bold text-white">{{ item.resource.title }}</h3>
                <p class="line-clamp-1 text-sm text-gray-500">{{ item.resource.description }}</p>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <button (click)="dataService.openExternalModal(item.resource.url)" class="ui-btn-secondary px-3 py-1.5 text-xs">打开</button>
              @if (mode === 'favorite') {
                <button (click)="dataService.toggleFavoriteItem('resource', item.resource.id)" class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-yellow-500/20">
                  <svg lucideStar class="h-5 w-5 text-yellow-400" fill="currentColor" [strokeWidth]="2"></svg>
                </button>
              }
            </div>
          </div>
        } @else {
          <div class="ui-card ui-card-hover flex items-center justify-between gap-4 p-4" appGsapCardHover>
            <div class="min-w-0">
              <div class="mb-1 flex items-center gap-2">
                <span class="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">规范</span>
                <span class="font-mono text-xs text-gray-600">{{ item.standard.code }}</span>
                <span class="text-xs text-gray-600">{{ formatSavedAt(item.savedAt) }}</span>
              </div>
              <h3 class="truncate text-base font-bold text-white">{{ item.clause.title }}</h3>
              <p class="text-sm text-gray-500">第 {{ item.clause.clauseNo }} 条 · {{ item.standard.title }}</p>
              @if (dataService.hasStandardClauseNote(item.clause.id)) {
                <p class="mt-2 line-clamp-1 text-xs text-blue-200/80">笔记：{{ dataService.getStandardClauseNote(item.clause.id) }}</p>
              }
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <a [routerLink]="['/standards']" [queryParams]="{ q: item.clause.title }" class="ui-btn-secondary px-3 py-1.5 text-xs">查看</a>
              @if (mode === 'favorite') {
                <button (click)="dataService.toggleFavoriteItem('standard', item.clause.id)" class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-yellow-500/20">
                  <svg lucideStar class="h-5 w-5 text-yellow-400" fill="currentColor" [strokeWidth]="2"></svg>
                </button>
              }
            </div>
          </div>
        }
      </ng-template>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class UserDashboardComponent {
  dataService = inject(DataService);
  route: ActivatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  activeTab = signal<DashboardTab>('favorites');
  favoriteFilter = signal<ContentFilter>('all');
  historyFilter = signal<ContentFilter>('all');
  tabs: Array<{ value: DashboardTab; label: string }> = [
    { value: 'favorites', label: '我的收藏' },
    { value: 'history', label: '浏览历史' },
    { value: 'notes', label: '我的笔记' }
  ];
  filters: Array<{ value: ContentFilter; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'entry', label: '百科' },
    { value: 'reading', label: '读物' },
    { value: 'resource', label: '资源' },
    { value: 'standard', label: '规范' }
  ];

  constructor() {
    void Promise.all([
      this.dataService.ensureEncyclopediaLoaded(),
      this.dataService.ensureReadingsLoaded(),
      this.dataService.ensureResourcesLoaded(),
      this.dataService.ensureStandardsLoaded()
    ]);

    this.route.queryParams.subscribe(p => {
      if (p['tab'] === 'history') this.activeTab.set('history');
      else if (p['tab'] === 'notes') this.activeTab.set('notes');
      else this.activeTab.set('favorites');
    });
  }

  selectTab(tab: DashboardTab) {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  favoriteItems = computed<DisplayItem[]>(() => this.resolveItems(
    this.dataService.favoriteItems()
      .filter(item => this.favoriteFilter() === 'all' || item.kind === this.favoriteFilter())
      .map(item => ({ kind: item.kind, id: item.id, savedAt: item.savedAt }))
  ));

  historyItems = computed<DisplayItem[]>(() => this.resolveItems(
    this.dataService.historyItems()
      .filter(item => this.historyFilter() === 'all' || item.kind === this.historyFilter())
      .map(item => ({ kind: item.kind, id: item.id, savedAt: item.visitedAt }))
  ));

  noteItems = computed<NoteDisplayItem[]>(() => {
    const entries = new Map(this.dataService.entries().map(item => [item.id, item]));
    const standards = new Map<string, { standard: StandardQuickRef; clause: StandardClause }>();
    for (const standard of this.dataService.standards()) {
      for (const clause of standard.clauses) {
        standards.set(clause.id, { standard, clause });
      }
    }

    const entryNotes = Object.entries(this.dataService.entryNotes())
      .map(([id, note]) => {
        const entry = entries.get(id);
        if (!entry || !note.trim()) return null;
        return {
          kind: 'entry' as const,
          id,
          title: entry.term,
          subtitle: entry.category,
          note: note.trim()
        };
      })
      .filter((item): item is NoteDisplayItem => !!item);

    const standardNotes = Object.entries(this.dataService.standardClauseNotes())
      .map(([id, note]) => {
        const match = standards.get(id);
        if (!match || !note.trim()) return null;
        return {
          kind: 'standard' as const,
          id,
          title: match.clause.title,
          subtitle: `${match.standard.code} 第 ${match.clause.clauseNo} 条`,
          note: note.trim()
        };
      })
      .filter((item): item is NoteDisplayItem => !!item);

    return [...entryNotes, ...standardNotes].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
  });

  private resolveItems(items: Array<{ kind: FavoriteKind; id: string; savedAt: string }>): DisplayItem[] {
    const entries = new Map(this.dataService.entries().map(item => [item.id, item]));
    const readings = new Map(this.dataService.readings().map(item => [item.id, item]));
    const resources = new Map(this.dataService.webLinks().map(item => [item.id, item]));
    const standards = new Map<string, { standard: StandardQuickRef; clause: StandardClause }>();
    for (const standard of this.dataService.standards()) {
      for (const clause of standard.clauses) {
        standards.set(clause.id, { standard, clause });
      }
    }

    return items
      .map(item => {
        if (item.kind === 'entry') {
          const entry = entries.get(item.id);
          return entry ? { kind: 'entry' as const, savedAt: item.savedAt, entry } : null;
        }
        if (item.kind === 'reading') {
          const reading = readings.get(item.id);
          return reading ? { kind: 'reading' as const, savedAt: item.savedAt, reading } : null;
        }
        if (item.kind === 'resource') {
          const resource = resources.get(item.id);
          return resource ? { kind: 'resource' as const, savedAt: item.savedAt, resource } : null;
        }
        const standardItem = standards.get(item.id);
        return standardItem ? { kind: 'standard' as const, savedAt: item.savedAt, ...standardItem } : null;
      })
      .filter((item): item is DisplayItem => !!item)
      .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
  }

  favoriteCount(filter: ContentFilter): number {
    if (filter === 'all') return this.dataService.favoriteItems().length;
    return this.dataService.favoriteItems().filter(item => item.kind === filter).length;
  }

  historyCount(filter: ContentFilter): number {
    if (filter === 'all') return this.dataService.historyItems().length;
    return this.dataService.historyItems().filter(item => item.kind === filter).length;
  }

  itemId(item: DisplayItem): string {
    if (item.kind === 'entry') return item.entry.id;
    if (item.kind === 'reading') return item.reading.id ?? item.reading.title;
    if (item.kind === 'resource') return item.resource.id;
    return item.clause.id;
  }

  resourceImage(resource: Link): string {
    return this.dataService.getResourcePreview(resource);
  }

  removeNote(item: NoteDisplayItem) {
    if (item.kind === 'entry') {
      this.dataService.setEntryNote(item.id, '');
    } else {
      this.dataService.setStandardClauseNote(item.id, '');
    }
    this.dataService.displayToast('笔记已删除');
  }

  formatSavedAt(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }
}
