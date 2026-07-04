import { Component, HostListener, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet } from '@angular/common';
import { DataService, Link } from '../../services/data.service';
import { ShareCardService } from '../../services/share-card.service';
import { AnimatedSearchBarComponent } from '../shared/animated-search-bar.component';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';

@Component({
  selector: 'app-resources',
  imports: [FormsModule, RouterLink, NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet, AnimatedSearchBarComponent, GsapCardHoverDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page-scroll ui-page-pad text-white">
      <div class="ui-page-header">
        <h2 class="ui-title">设计资源库</h2>
        <p class="ui-subtitle mb-4">为建筑学习者精选的资源集合</p>

        <div class="relative z-20 mt-4 flex h-12 w-full max-w-3xl items-center justify-center gap-4">
          <app-animated-search-bar
            [query]="searchQuery()"
            (queryChange)="searchQuery.set($event)"
            placeholder="搜索资源..."
          ></app-animated-search-bar>

          <div class="flex h-12 shrink-0 items-center rounded-card border border-line bg-surface p-1 shadow-lg">
            <button
              type="button"
              (click)="switchView('list')"
              class="rounded-lg p-2 transition-colors"
              [class.bg-white/10]="viewMode() === 'list'"
              [class.text-white]="viewMode() === 'list'"
              [class.text-gray-500]="viewMode() !== 'list'"
              title="列表视图"
              aria-label="列表视图"
            >
              <svg lucideLayoutList class="h-5 w-5" [strokeWidth]="2"></svg>
            </button>
            <button
              type="button"
              (click)="switchView('cards')"
              class="rounded-lg p-2 transition-colors"
              [class.bg-white/10]="viewMode() === 'cards'"
              [class.text-white]="viewMode() === 'cards'"
              [class.text-gray-500]="viewMode() !== 'cards'"
              title="卡片视图"
              aria-label="卡片视图"
            >
              <svg lucideLayoutGrid class="h-5 w-5" [strokeWidth]="2"></svg>
            </button>
          </div>
        </div>
      </div>

      @if (filteredLinks().length === 0) {
        <div class="ui-empty-state h-60 opacity-80">
          <div class="ui-empty-icon"><svg lucidePackageOpen class="h-8 w-8" [strokeWidth]="1.8"></svg></div>
          <p class="text-lg font-medium">未找到相关资源</p>
          <p class="mt-1 text-sm text-gray-500">请尝试更换关键词查找</p>
          <button [routerLink]="['/contact']" class="ui-btn-secondary mt-4">向我反馈</button>
        </div>
      } @else if (viewMode() === 'cards') {
        <div class="ui-filter-rail mb-6 mt-8">
          <button
            type="button"
            (click)="selectedCardCategory.set('全部')"
            class="ui-filter-chip"
            [class.bg-white]="selectedCardCategory() === '全部'"
            [class.text-black]="selectedCardCategory() === '全部'"
            [class.bg-white/5]="selectedCardCategory() !== '全部'"
            [class.text-gray-300]="selectedCardCategory() !== '全部'"
          >
            全部 {{ filteredLinks().length }}
          </button>
          @for (group of groupedLinks(); track group.category) {
            <button
              type="button"
              (click)="selectedCardCategory.set(group.category)"
              class="ui-filter-chip"
              [class.bg-white]="selectedCardCategory() === group.category"
              [class.text-black]="selectedCardCategory() === group.category"
              [class.bg-white/5]="selectedCardCategory() !== group.category"
              [class.text-gray-300]="selectedCardCategory() !== group.category"
            >
              {{ group.category }} {{ group.links.length }}
            </button>
          }
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          @for (link of cardLinks(); track link.id) {
            <article class="group/resource ui-card ui-card-hover overflow-hidden" appGsapCardHover>
              <button type="button" (click)="openResource(link)" class="block w-full text-left">
                <div class="relative aspect-[16/9] overflow-hidden bg-white/5">
                  <img
                    [src]="resourceImage(link)"
                    [alt]="link.imageAlt || link.title"
                    loading="lazy"
                    decoding="async"
                    class="h-full w-full object-cover opacity-90 transition duration-500 group-hover/resource:scale-105 group-hover/resource:opacity-100"
                    (error)="handleImageError($event)"
                  >
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent"></div>
                  <span class="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">{{ link.category }}</span>
                </div>
                <div class="p-4">
                  <div class="mb-2 flex items-start justify-between gap-3">
                    <h3 class="line-clamp-1 text-base font-black text-white group-hover/resource:text-blue-300">{{ link.title }}</h3>
                    <span class="shrink-0 text-xs font-bold text-gray-500">{{ getResourceMark(link.title) }}</span>
                  </div>
                  <p class="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-gray-500">{{ link.description }}</p>
                  @if (visibleTags(link).length) {
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      @for (tag of visibleTags(link); track tag) {
                        <span [class]="getTagClass(link.category, tag)">{{ tag }}</span>
                      }
                    </div>
                  }
                </div>
              </button>

              <div class="flex items-center gap-2 border-t border-white/10 p-3">
                <button type="button" (click)="toggleFavoriteResource($event, link)" class="ui-icon-btn h-9 w-9" [title]="isResourceFavorite(link) ? '取消收藏' : '收藏资源'">
                  <svg lucideStar class="h-4 w-4" [class.text-yellow-300]="isResourceFavorite(link)" [attr.fill]="isResourceFavorite(link) ? 'currentColor' : 'none'" [strokeWidth]="2"></svg>
                </button>
                <button type="button" (click)="copyResourceLink($event, link)" class="ui-icon-btn h-9 w-9" title="复制链接">
                  <svg lucideCopy class="h-4 w-4" [strokeWidth]="2"></svg>
                </button>
                <button type="button" (click)="openResource(link)" class="ui-btn-secondary ml-auto h-9 gap-2 px-3 text-xs">
                  <svg lucideExternalLink class="h-4 w-4" [strokeWidth]="2"></svg>
                  打开
                </button>
                <div class="resource-share-wrap relative">
                  <button type="button" (click)="toggleShareMenu($event, link)" class="ui-icon-btn h-9 w-9" title="分享">
                    <svg lucideShare2 class="h-4 w-4" [strokeWidth]="2"></svg>
                  </button>
                  @if (shareMenuLinkId() === link.id) {
                    <ng-container *ngTemplateOutlet="shareMenu; context: { $implicit: link }"></ng-container>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="space-y-4">
          @for (group of groupedLinks(); track group.category) {
            <div #categoryElement class="scroll-mt-6 ui-card overflow-hidden transition-all duration-300">
              <button
                type="button"
                (click)="toggleCategory(group.category, categoryElement)"
                class="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/5 md:p-5"
              >
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-white/5 transition-colors group-hover:bg-white/10">
                    <ng-container [ngSwitch]="group.category">
                      <svg *ngSwitchCase="'院校展览'" lucideSchool class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'建筑资讯与媒体'" lucideBookOpen class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'规范、学习与学术'" lucideLibrary class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'地图、气象与数据'" lucideMap class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'软件、插件与渲染'" lucideSettings class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'材质、配景与素材'" lucidePackageOpen class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'配色、平面与图解'" lucidePalette class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'实用工具'" lucideWrench class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchDefault lucideList class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                    </ng-container>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-white transition-colors group-hover:text-blue-400">{{ group.category }}</h3>
                    <p class="mt-0.5 text-xs text-gray-500">{{ getCategoryDescription(group.category) }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-gray-300">{{ group.links.length }}</span>
                  <svg lucideChevronDown class="h-5 w-5 text-gray-500 transition-transform duration-300" [class.rotate-180]="isCategoryOpen(group.category)" [strokeWidth]="2"></svg>
                </div>
              </button>

              <div class="resource-panel bg-app" [class.resource-panel-open]="isCategoryOpen(group.category)">
                <div class="resource-panel-clip">
                  <div class="border-t border-white/5 p-4 md:p-6">
                    @if (group.category === '院校展览') {
                      <div class="ui-notice-info mb-6">
                        <div class="ui-notice-title">
                          <svg lucideInfo class="h-4 w-4 shrink-0 text-blue-300" [strokeWidth]="2"></svg>
                          为什么要看这些院校的作品？
                        </div>
                        <p class="ui-notice-text">
                          顶尖院校的学生作品能系统呈现从概念到方案的完整思路、批判性方法与国际教学趋势，更利于提升设计视野与方法论。
                        </p>
                      </div>
                    }

                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      @for (link of group.links; track link.id) {
                        <div class="group/card ui-card ui-card-hover flex cursor-pointer items-start gap-4 p-4" (click)="openResource(link)" appGsapCardHover>
                          <img
                            [src]="resourceImage(link)"
                            [alt]="link.imageAlt || link.title"
                            loading="lazy"
                            decoding="async"
                            class="h-14 w-20 shrink-0 rounded-control border border-white/10 object-cover bg-white/5"
                            (error)="handleImageError($event)"
                          >
                          <div class="min-w-0 flex-1">
                            <div class="flex items-start justify-between gap-2">
                              <h4 class="truncate text-sm font-bold text-white transition-colors group-hover/card:text-blue-400">{{ link.title }}</h4>
                              @if (dataService.isAdmin()) {
                                <button type="button" (click)="$event.stopPropagation(); requestDeleteLink(link.id)" class="ml-2 text-red-500/50 transition-colors hover:text-red-500">
                                  <svg lucideX class="h-3 w-3" [strokeWidth]="2"></svg>
                                </button>
                              }
                            </div>
                            <p class="mt-1 line-clamp-2 text-xs text-gray-500">{{ link.description }}</p>
                            @if (visibleTags(link).length) {
                              <div class="mt-3 flex flex-wrap gap-1">
                                @for (tag of visibleTags(link); track tag) {
                                  <span [class]="getTagClass(group.category, tag)">{{ tag }}</span>
                                }
                              </div>
                            }
                          </div>
                          <button type="button" (click)="toggleFavoriteResource($event, link)" class="self-center rounded-full p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-yellow-300">
                            <svg lucideStar class="h-4 w-4" [class.text-yellow-300]="isResourceFavorite(link)" [attr.fill]="isResourceFavorite(link) ? 'currentColor' : 'none'" [strokeWidth]="2"></svg>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (pendingDeleteLink(); as linkToDelete) {
        <div class="ui-modal-shell">
          <div class="ui-modal-backdrop" (click)="cancelDeleteLink()"></div>
          <div class="ui-modal-panel max-w-sm animate-modal-pop-in p-6">
            <div class="flex flex-col items-center text-center">
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <svg lucideAlertTriangle class="h-6 w-6 text-red-400" [strokeWidth]="2"></svg>
              </div>
              <h3 class="text-lg font-bold text-white">删除资源</h3>
              <p class="mt-3 text-sm leading-relaxed text-gray-400">
                确定要删除“<span class="font-semibold text-white">{{ linkToDelete.title }}</span>”吗？此操作不可恢复。
              </p>
              <div class="mt-6 flex w-full gap-3">
                <button (click)="cancelDeleteLink()" class="ui-btn-secondary flex-1">取消</button>
                <button (click)="confirmDeleteLink()" class="ui-btn-danger flex-1">确认删除</button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (dataService.isAdmin()) {
        <div class="ui-card mt-8 p-6">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <span class="h-2 w-2 rounded-full bg-blue-500"></span>
            添加新资源
          </h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="ui-label mb-1 block">分类</label>
              <input [(ngModel)]="newCategory" placeholder="例如: 建筑资讯" class="ui-field">
            </div>
            <div>
              <label class="ui-label mb-1 block">网站名称</label>
              <input [(ngModel)]="newTitle" placeholder="例如：ArchDaily" class="ui-field">
            </div>
            <div class="md:col-span-2">
              <label class="ui-label mb-1 block">URL</label>
              <input [(ngModel)]="newUrl" placeholder="https://..." class="ui-field">
            </div>
            <div class="md:col-span-2">
              <label class="ui-label mb-1 block">简短描述</label>
              <input [(ngModel)]="newDesc" placeholder="网站的一句话介绍" class="ui-field">
            </div>
          </div>
          <button (click)="addLink()" class="ui-btn-accent mt-6 w-full">添加资源</button>
        </div>
      }

      <ng-template #shareMenu let-link>
        <div (click)="$event.stopPropagation()" class="resource-share-menu absolute bottom-full right-0 z-40 mb-3 flex w-56 flex-col overflow-hidden rounded-card border border-white/10 bg-surface shadow-panel">
          @if (shareMenuNotice()) {
            <div class="border-b border-green-500/20 bg-green-500/10 py-1.5 text-center text-[10px] font-bold text-green-400">
              {{ shareMenuNotice() }}
            </div>
          }
          <div class="flex flex-col gap-1 p-1.5">
            <button type="button" (click)="shareResourceCard(link)" class="resource-menu-item" [disabled]="isGeneratingCard()">生成分享图像</button>
            <div class="my-1 h-px bg-white/10"></div>
            <button type="button" (click)="copyResourceShareText($event, link)" class="resource-menu-item">复制分享文案</button>
          </div>
        </div>
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
    .resource-panel {
      display: grid;
      grid-template-rows: 0fr;
      opacity: 0;
      overflow: hidden;
      transition:
        grid-template-rows 300ms cubic-bezier(0.16, 1, 0.3, 1),
        opacity 220ms ease;
    }
    .resource-panel-open {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    .resource-panel-clip {
      min-height: 0;
      overflow: hidden;
    }
    .resource-menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-size: 0.875rem;
      color: rgb(209 213 219);
      transition: background-color 160ms ease, color 160ms ease;
    }
    .resource-menu-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: white;
    }
    .resource-menu-item:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @media (prefers-reduced-motion: reduce) {
      .resource-panel {
        transition: none;
      }
    }
  `]
})
export class ResourcesComponent implements OnDestroy {
  dataService = inject(DataService);
  private shareCardService = inject(ShareCardService);
  private route = inject(ActivatedRoute);

  newCategory = signal('');
  newTitle = signal('');
  newUrl = signal('');
  newDesc = signal('');
  expandedCategory = signal<string | null>(null);
  searchQuery = signal('');
  selectedCardCategory = signal('全部');
  pendingDeleteLinkId = signal<string | null>(null);
  shareMenuLinkId = signal<string | null>(null);
  shareMenuNotice = signal('');
  isGeneratingCard = signal(false);

  pendingDeleteLink = computed(() => {
    const id = this.pendingDeleteLinkId();
    return id ? this.dataService.webLinks().find(link => link.id === id) ?? null : null;
  });

  viewMode = computed(() => this.dataService.resourcesViewMode());

  private pendingCategoryScrollFrame: number | null = null;
  private pendingCategoryScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private shareResetTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly categoryScrollOffset = 24;
  private readonly categoryPanelTransitionMs = 330;
  private readonly categoryOrder = [
    '院校展览',
    '建筑资讯与媒体',
    '规范、学习与学术',
    '地图、气象与数据',
    '软件、插件与渲染',
    '材质、配景与素材',
    '配色、平面与图解',
    '实用工具'
  ];

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const resourceId = params.get('resource');
      if (!resourceId) return;
      const link = this.dataService.webLinks().find(item => item.id === resourceId);
      if (link) {
        this.dataService.resourcesViewMode.set('cards');
        this.selectedCardCategory.set(link.category);
      }
    });
  }

  filteredLinks = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.dataService.webLinks().filter(link => {
      if (!q) return true;
      const haystack = [
        link.title,
        link.description,
        link.category,
        ...(link.tags ?? []),
        ...(link.featuredTags ?? [])
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  });

  groupedLinks = computed(() => {
    const map = new Map<string, Link[]>();
    for (const link of this.filteredLinks()) {
      const category = link.category || '未分类';
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(link);
    }

    const groups = Array.from(map.entries()).map(([category, links]) => ({ category, links }));
    return groups.sort((a, b) => {
      const idxA = this.categoryOrder.indexOf(a.category);
      const idxB = this.categoryOrder.indexOf(b.category);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  });

  cardLinks = computed(() => {
    const category = this.selectedCardCategory();
    const links = this.filteredLinks();
    if (category === '全部') return links;
    return links.filter(link => link.category === category);
  });

  switchView(mode: 'list' | 'cards') {
    this.dataService.resourcesViewMode.set(mode);
    this.closeShareMenu();
  }

  isCategoryOpen(category: string): boolean {
    return this.expandedCategory() === category || !!this.searchQuery();
  }

  toggleCategory(category: string, element?: HTMLElement) {
    const isExpanding = this.expandedCategory() !== category;
    this.cancelPendingCategoryScroll();
    this.closeShareMenu();

    if (!isExpanding) {
      this.expandedCategory.set(null);
      return;
    }

    this.expandedCategory.set(category);
    if (element && !this.searchQuery()) {
      const container = this.findScrollContainer(element);
      if (container) {
        this.scrollCategoryIntoViewAfterLayoutSettles(element, container);
      }
    }
  }

  openResource(link: Link) {
    this.dataService.addHistoryItem('resource', link.id);
    this.dataService.openExternalModal(link.url);
  }

  resourceImage(link: Link): string {
    return this.dataService.getResourcePreview(link);
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/images/resources/default.webp';
  }

  visibleTags(link: Link): string[] {
    return (link.featuredTags?.length ? link.featuredTags : link.tags ?? []).slice(0, 4);
  }

  isResourceFavorite(link: Link): boolean {
    return this.dataService.favoriteItems().some(item => item.kind === 'resource' && item.id === link.id);
  }

  toggleFavoriteResource(event: MouseEvent, link: Link) {
    event.preventDefault();
    event.stopPropagation();
    this.dataService.toggleFavoriteItem('resource', link.id);
    this.dataService.displayToast(this.isResourceFavorite(link) ? '资源已收藏' : '已取消收藏');
  }

  async copyResourceLink(event: MouseEvent, link: Link) {
    event.preventDefault();
    event.stopPropagation();
    await this.copyText(link.url, '资源链接已复制');
  }

  toggleShareMenu(event: MouseEvent, link: Link) {
    event.preventDefault();
    event.stopPropagation();
    this.shareMenuLinkId.update(id => id === link.id ? null : link.id);
  }

  closeShareMenu() {
    this.shareMenuLinkId.set(null);
    this.shareMenuNotice.set('');
  }

  async copyResourceShareText(event: MouseEvent, link: Link) {
    event.preventDefault();
    event.stopPropagation();
    await this.copyText(this.getResourceShareText(link), '分享文案已复制');
    this.setShareMenuNotice('已复制分享文案');
  }

  async shareResourceCard(link: Link) {
    if (this.isGeneratingCard()) return;
    this.isGeneratingCard.set(true);
    try {
      const blob = await this.shareCardService.generateResourceCard(link, this.getResourceShareUrl(link));
      const result = await this.shareCardService.shareOrDownload(blob, `archipedia-resource-${link.id}.png`, link.title);
      if (result === 'downloaded') this.dataService.displayToast('资源分享卡片已下载');
    } catch (error) {
      console.error(error);
      this.dataService.displayToast('资源分享卡片生成失败，请稍后重试');
    } finally {
      this.isGeneratingCard.set(false);
    }
  }

  addLink() {
    if (this.newTitle() && this.newUrl() && this.newCategory()) {
      const id = Date.now().toString();
      this.dataService.addLink({
        id,
        category: this.newCategory(),
        title: this.newTitle(),
        url: this.newUrl(),
        description: this.newDesc() || '暂无描述',
        imageUrl: '/images/resources/default.webp',
        imageAlt: `${this.newTitle()} 资源预览`,
        previewSourceUrl: this.newUrl()
      });
      this.newTitle.set('');
      this.newUrl.set('');
      this.newDesc.set('');
    }
  }

  requestDeleteLink(id: string) {
    this.pendingDeleteLinkId.set(id);
  }

  cancelDeleteLink() {
    this.pendingDeleteLinkId.set(null);
  }

  confirmDeleteLink() {
    const link = this.pendingDeleteLink();
    if (!link) return;

    this.dataService.removeLink(link.id);
    this.pendingDeleteLinkId.set(null);
    this.dataService.displayToast('资源已删除');
  }

  getResourceMark(title: string): string {
    const trimmed = title.trim();
    const cjk = trimmed.match(/[\u3400-\u9fff]/u)?.[0];
    if (cjk) return cjk;

    const latin = trimmed.match(/[A-Za-z0-9]/)?.[0];
    return latin ? latin.toUpperCase() : '#';
  }

  getTagClass(category: string, tag: string): string {
    const baseClasses = 'text-[10px] px-2 py-0.5 rounded backdrop-blur-sm border transition-all duration-300 font-medium tracking-wide';
    const tagColors: Record<string, string> = {
      '环境': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
      '材质': 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
      '模型': 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
      '人物': 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
      '配景': 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
      '尺寸': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20',
      '素材': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
      '剪影': 'bg-zinc-500/30 text-zinc-300 border-zinc-500/20 hover:bg-zinc-500/40'
    };

    if (category === '材质、配景与素材') {
      return `${baseClasses} ${tagColors[tag] || 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/15'}`;
    }

    return `${baseClasses} bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-300`;
  }

  getCategoryDescription(category: string): string {
    switch (category) {
      case '院校展览': return 'Top academic showcases from around the globe';
      case '建筑资讯与媒体': return 'Leading digital publications and news';
      case '规范、学习与学术': return 'Building regulations and academic references';
      case '地图、气象与数据': return 'Mapping, weather, and urban datasets';
      case '软件、插件与渲染': return 'Software, plugins, and visualization tools';
      case '材质、配景与素材': return 'Textures, entourage, and visual assets';
      case '配色、平面与图解': return 'Curated palettes and diagram references';
      case '实用工具': return 'Everyday workflow utilities';
      default: return 'Curated resources';
    }
  }

  private getResourceShareText(link: Link): string {
    return [
      `我在 ARCHIPEDIA.top 发现了这个建筑资源：${link.title}`,
      link.description,
      `打开：${link.url}`
    ].filter(Boolean).join('\n');
  }

  private getResourceShareUrl(link: Link): string {
    return `${window.location.origin}${window.location.pathname}#/resources?resource=${encodeURIComponent(link.id)}`;
  }

  private async copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.dataService.displayToast(successMessage);
    } catch {
      this.copyTextWithSelection(text);
    }
  }

  private copyTextWithSelection(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.dataService.displayToast('内容已复制');
  }

  private setShareMenuNotice(message: string) {
    this.shareMenuNotice.set(message);
    if (this.shareResetTimer) clearTimeout(this.shareResetTimer);
    this.shareResetTimer = setTimeout(() => {
      this.shareResetTimer = null;
      this.shareMenuNotice.set('');
    }, 2000);
  }

  private findScrollContainer(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;

    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }

    return null;
  }

  private scrollCategoryIntoViewAfterLayoutSettles(element: HTMLElement, container: HTMLElement) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReducedMotion ? 0 : this.categoryPanelTransitionMs;

    this.pendingCategoryScrollTimer = window.setTimeout(() => {
      this.pendingCategoryScrollTimer = null;
      this.pendingCategoryScrollFrame = window.requestAnimationFrame(() => {
        this.pendingCategoryScrollFrame = null;
        this.alignCategoryWithViewportTop(element, container, prefersReducedMotion ? 'auto' : 'smooth');
      });
    }, delay);
  }

  private alignCategoryWithViewportTop(element: HTMLElement, container: HTMLElement, behavior: ScrollBehavior) {
    if (!element.isConnected || !container.isConnected) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const rawTop = elementRect.top - containerRect.top + container.scrollTop - this.categoryScrollOffset;
    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const top = Math.min(Math.max(rawTop, 0), maxTop);

    container.scrollTo({ top, behavior });
  }

  private cancelPendingCategoryScroll() {
    if (this.pendingCategoryScrollFrame !== null) {
      window.cancelAnimationFrame(this.pendingCategoryScrollFrame);
      this.pendingCategoryScrollFrame = null;
    }

    if (this.pendingCategoryScrollTimer !== null) {
      window.clearTimeout(this.pendingCategoryScrollTimer);
      this.pendingCategoryScrollTimer = null;
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.shareMenuLinkId()) {
      this.closeShareMenu();
      return;
    }
    if (this.pendingDeleteLink()) {
      this.cancelDeleteLink();
    }
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.shareMenuLinkId()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.resource-share-wrap')) return;
    this.closeShareMenu();
  }

  ngOnDestroy() {
    this.cancelPendingCategoryScroll();
    if (this.shareResetTimer) {
      clearTimeout(this.shareResetTimer);
      this.shareResetTimer = null;
    }
  }
}
