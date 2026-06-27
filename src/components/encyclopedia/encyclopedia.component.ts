import { Component, inject, computed, signal, AfterViewInit, ViewChild, ElementRef, effect, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService, Entry } from '../../services/data.service';
import { ArchitectureNewsItem, ArchitectureNewsService } from '../../services/architecture-news.service';
import { AnimatedSearchBarComponent } from '../shared/animated-search-bar.component';
import { GsapHoverTooltipDirective } from '../shared/gsap-hover-tooltip.directive';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import {
  buildSearchIndex,
  createSearchSnippet,
  HighlightSegment,
  matchesSearch,
  splitHighlight
} from './encyclopedia-tools';

gsap.registerPlugin(Flip);

@Component({
  selector: 'app-encyclopedia',
  imports: [RouterLink, FormsModule, AnimatedSearchBarComponent, GsapHoverTooltipDirective, GsapCardHoverDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page ui-page-pad text-white" (wheel)="onPageWheel($event)">
      <div class="encyclopedia-chrome" [class.is-compact]="encyclopediaChromeCompact()">
      
      <!-- Header Section -->
      <div class="ui-page-header encyclopedia-hero">
        <h1 class="ui-title h-[48px] flex items-center encyclopedia-title">
          {{ currentTitle() }}<span class="animate-pulse text-gray-400 font-thin">|</span>
        </h1>
        <p class="ui-subtitle mb-4 encyclopedia-hero-copy">
          探索全面的建筑知识库
        </p>

        <!-- Animated Search Input & View Toggle -->
        @if (!encyclopediaChromeCompact()) {
          <div class="encyclopedia-controls relative w-full max-w-2xl mt-4 flex justify-center items-center gap-4 h-12 z-20">
            
            <app-animated-search-bar 
              [query]="searchQuery()" 
              (queryChange)="updateSearch($event)" 
              placeholder="搜索百科词条..."
            ></app-animated-search-bar>
            
            @if (!isHomePage()) {
            <!-- View Toggle Button -->
            <div class="flex bg-surface rounded-card border border-line p-1 shrink-0 z-20 shadow-lg h-12 items-center">
              <button 
                (click)="switchView('grid')"
                class="p-2 rounded-lg transition-colors"
                [class.bg-white/10]="viewMode() === 'grid'"
                [class.text-white]="viewMode() === 'grid'"
                [class.text-gray-500]="viewMode() !== 'grid'"
                [class.hover:text-gray-300]="viewMode() !== 'grid'"
                appGsapTooltip="网格视图"
                [hoverScale]="1.15"
              >
                <svg lucideLayoutGrid class="w-5 h-5" [strokeWidth]="2"></svg>
              </button>
              <button 
                (click)="switchView('list')"
                class="p-2 rounded-lg transition-colors"
                [class.bg-white/10]="viewMode() === 'list'"
                [class.text-white]="viewMode() === 'list'"
                [class.text-gray-500]="viewMode() !== 'list'"
                [class.hover:text-gray-300]="viewMode() !== 'list'"
                appGsapTooltip="列表视图"
                [hoverScale]="1.15"
              >
                <svg lucideLayoutList class="w-5 h-5" [strokeWidth]="2"></svg>
              </button>
            </div>
            }
          </div>
        }
      </div>

      <!-- Categories Filter -->
      <div class="encyclopedia-categories flex flex-nowrap gap-2 mb-6 shrink-0 overflow-x-auto pb-2 custom-scrollbar mask-gradient">
        <button 
          (click)="selectCategory('home')"
          class="ui-chip flex-shrink-0 whitespace-nowrap"
          [class.bg-white]="selectedCategory() === 'home'"
          [class.text-black]="selectedCategory() === 'home'"
          [class.bg-white/5]="selectedCategory() !== 'home'"
          [class.text-gray-300]="selectedCategory() !== 'home'"
          [class.hover:bg-white/10]="selectedCategory() !== 'home'"
        >主页</button>
        <button 
          (click)="selectCategory('all')"
          class="ui-chip flex-shrink-0 whitespace-nowrap"
          [class.bg-white]="selectedCategory() === 'all'"
          [class.text-black]="selectedCategory() === 'all'"
          [class.bg-white/5]="selectedCategory() !== 'all'"
          [class.text-gray-300]="selectedCategory() !== 'all'"
          [class.hover:bg-white/10]="selectedCategory() !== 'all'"
        >全部</button>
        @for (cat of categories(); track cat) {
          <button 
            (click)="selectCategory(cat)"
             class="ui-chip flex-shrink-0 whitespace-nowrap"
            [class.bg-white]="selectedCategory() === cat"
            [class.text-black]="selectedCategory() === cat"
            [class.bg-white/5]="selectedCategory() !== cat"
            [class.text-gray-300]="selectedCategory() !== cat"
            [class.hover:bg-white/10]="selectedCategory() !== cat"
          >
            {{ cat }}
          </button>
        }
      </div>
      </div>

      <!-- Content Grid -->
      <div
        id="encyclopedia-scroll-container"
        #scrollContainer
        (scroll)="onScroll()"
        (wheel)="onContentWheel($event)"
        (touchstart)="onContentTouchStart($event)"
        (touchmove)="onContentTouchMove($event)"
        class="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2"
      >
        @if (isHomePage()) {
          <section class="encyclopedia-home pb-24">
            <div class="home-feature-grid">
              @if (featuredNews(); as item) {
                <button type="button" class="home-feature-card" (click)="openNewsItem(item)">
                  <div class="home-feature-image">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="newsTitle(item)" loading="eager" decoding="async">
                    } @else {
                      <div class="home-image-fallback">{{ item.source.slice(0, 1) }}</div>
                    }
                  </div>
                  <div class="home-feature-content">
                    <div class="home-news-meta">
                      <span>{{ item.source }}</span>
                      <span>{{ formatNewsDate(item.publishedAt) }}</span>
                    </div>
                    <h3>{{ newsTitle(item) }}</h3>
                    <p>{{ newsSummary(item) }}</p>
                    <span class="home-open-link">打开原文 <svg lucideExternalLink class="w-3.5 h-3.5" [strokeWidth]="2"></svg></span>
                  </div>
                </button>
              }

              <div class="home-ad-slot" aria-label="广告位">
                <span>AD SLOT</span>
                <strong>Google Ads Ready</strong>
              </div>
            </div>

            <div class="home-section-head">
              <div>
                <h3>最新建筑资讯</h3>
                <p>最后更新：{{ formatNewsDate(newsService.updatedAt()) }}</p>
              </div>
              <div class="home-source-row">
                @for (source of newsService.sources(); track source.homeUrl) {
                  <button type="button" (click)="openSource(source.homeUrl)">{{ source.name }}</button>
                }
              </div>
            </div>

            <div class="home-news-grid">
              @for (item of secondaryNews(); track item.id) {
                <button type="button" class="home-news-card" (click)="openNewsItem(item)">
                  <div class="home-news-thumb">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="newsTitle(item)" loading="lazy" decoding="async">
                    } @else {
                      <div class="home-image-fallback small">{{ item.source.slice(0, 1) }}</div>
                    }
                  </div>
                  <div class="home-news-body">
                    <div class="home-news-meta">
                      <span>{{ item.source }}</span>
                      <span>{{ formatNewsDate(item.publishedAt) }}</span>
                    </div>
                    <h4>{{ newsTitle(item) }}</h4>
                    <p>{{ newsSummary(item) }}</p>
                  </div>
                </button>
              }
            </div>
          </section>
        } @else {
        @if (filteredEntries().length === 0) {
          <div class="ui-empty-state h-60 opacity-80">
            <div class="ui-empty-icon"><svg lucideBuilding2 class="w-8 h-8" [strokeWidth]="1.8"></svg></div>
            <p class="font-medium text-lg">未找到相关条目</p>
            <p class="text-gray-500 text-sm mt-1">请尝试更换关键词或进入对应分类查找</p>
            <button 
              [routerLink]="['/about']"
              class="ui-btn-secondary mt-4"
            >
              向我们反馈
            </button>
          </div>
        }

        <div #entriesContainer class="grid gap-6 pb-20 entries-grid" [class.grid-cols-1]="viewMode() === 'list'" [class.md:grid-cols-2]="viewMode() === 'grid'" [class.lg:grid-cols-3]="viewMode() === 'grid'" [class.xl:grid-cols-4]="viewMode() === 'grid'" [class.entries-grid-list]="viewMode() === 'list'" [class.entries-grid-grid]="viewMode() === 'grid'">
          @for (entry of filteredEntries(); track entry.id; let i = $index) {
            <a 
              [routerLink]="['/entry', entry.id]" 
              [queryParams]="searchQuery() ? { q: searchQuery() } : null"
              (click)="saveState(scrollContainer.scrollTop)" 
              class="group ui-media-card animate-fade-in-up entry-card" appGsapCardHover
              [class.flex]="viewMode() === 'list'"
              [class.flex-col]="viewMode() === 'grid'"
              [class.h-full]="viewMode() === 'grid'"
              [class.flex-row]="viewMode() === 'list'"
              [class.h-24]="viewMode() === 'list'"
              [class.entry-card-list]="viewMode() === 'list'"
              [class.entry-card-grid]="viewMode() === 'grid'"
              [style.animation-delay]="i < 12 ? (i * 50) + 'ms' : '0ms'"
              [attr.data-flip-id]="entry.id"
            >
              <!-- Image Section -->
              <div class="overflow-hidden relative bg-gray-800 entry-image" [class.h-48]="viewMode() === 'grid'" [class.h-full]="viewMode() === 'list'" [class.w-32]="viewMode() === 'list'" [class.shrink-0]="viewMode() === 'list'">
                @if (entry.imageUrl) {
                   <img [src]="entry.imageUrl" class="w-full h-full object-cover" [style.object-position]="entry.imagePosition || 'center'" loading="lazy" decoding="async" [alt]="entry.term" data-flip-id="image-{{entry.id}}">
                } @else {
                   <!-- Fallback Pattern -->
                   <div class="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center relative" data-flip-id="image-{{entry.id}}">
                      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 20px 20px;"></div>
                      <span class="text-4xl opacity-30 select-none">Aa</span>
                   </div>
                }
                <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                  {{ entry.subcategory?.split(' ')[0] || '词条' }}
                </div>
              </div>

              <!-- Content Section -->
              <div class="flex flex-col flex-1 min-w-0 entry-content" [class.p-4]="viewMode() === 'grid'" [class.p-2]="viewMode() === 'list'">
                <div class="flex justify-between items-start gap-2 mb-1 shrink-0">
                  <h3 class="font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-1" [class.text-lg]="viewMode() === 'grid'" [class.text-base]="viewMode() === 'list'">
                    @for (segment of highlightSegments(entry.term); track $index) {
                      <span [class.search-hit]="segment.matched">{{ segment.text }}</span>
                    }
                  </h3>
                  @if (entry.details?.includes('19')) {
                    <span class="text-xs font-mono text-gray-500 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">{{ extractYear(entry.details) }}</span>
                  }
                </div>
                
                <p class="text-xs text-gray-500 italic truncate shrink-0" [class.mb-3]="viewMode() === 'grid'" [class.mb-1]="viewMode() === 'list'">
                  @for (segment of highlightSegments(entry.termEn); track $index) {
                    <span [class.search-hit]="segment.matched">{{ segment.text }}</span>
                  }
                </p>
                
                <p class="text-sm text-gray-400 line-clamp-3 mb-4 flex-1 leading-relaxed" [class.hidden]="viewMode() === 'list'">
                  @for (segment of highlightSegments(searchSnippet(entry)); track $index) {
                    <span [class.search-hit]="segment.matched">{{ segment.text }}</span>
                  }
                </p>
                
                <div class="flex items-center justify-between mt-auto pt-4 border-t border-white/5" [class.border-t-0]="viewMode() === 'list'" [class.pt-0]="viewMode() === 'list'">
                   <span class="text-xs text-gray-600 font-medium truncate max-w-[70%]">{{ entry.category }}</span>
                   <div class="flex items-center text-xs font-medium text-gray-500 group-hover:text-white transition-colors">
                     阅读更多 
                     <svg lucideChevronRight class="w-3 h-3 ml-1" [strokeWidth]="2"></svg>
                   </div>
                </div>
              </div>
            </a>
          }
        </div>
        }
      </div>

      <!-- Admin Add Button -->
      @if (dataService.isAdmin()) {
        <button (click)="createNew()" title="添加新词条" class="absolute bottom-8 right-8 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-500 hover:scale-105 transition-all z-20">
          <svg lucidePlus class="w-6 h-6" [strokeWidth]="2"></svg>
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      --view-dur: 380ms;
      --view-ease: cubic-bezier(0.22, 1, 0.36, 1);
    }
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
    .mask-gradient {
      mask-image: linear-gradient(to right, black 95%, transparent 100%);
    }
    .encyclopedia-chrome {
      max-height: 320px;
      overflow: hidden;
      transition: max-height 320ms cubic-bezier(0.16, 1, 0.3, 1);
      will-change: max-height;
    }
    .encyclopedia-hero,
    .encyclopedia-title,
    .encyclopedia-hero-copy,
    .encyclopedia-controls,
    .encyclopedia-categories {
      transition:
        margin 260ms cubic-bezier(0.16, 1, 0.3, 1),
        max-height 260ms cubic-bezier(0.16, 1, 0.3, 1),
        height 260ms cubic-bezier(0.16, 1, 0.3, 1),
        opacity 220ms ease,
        transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
        padding 260ms cubic-bezier(0.16, 1, 0.3, 1),
        font-size 260ms cubic-bezier(0.16, 1, 0.3, 1),
        line-height 260ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .encyclopedia-hero-copy {
      max-height: 4rem;
    }
    .encyclopedia-controls {
      max-height: 4.5rem;
    }
    .encyclopedia-chrome.is-compact {
      max-height: 132px;
    }
    .encyclopedia-chrome.is-compact .encyclopedia-hero {
      margin-bottom: 0.75rem;
      transform: translateY(-2px);
    }
    .encyclopedia-chrome.is-compact .encyclopedia-title {
      height: 2rem;
      font-size: 1.5rem;
      line-height: 1.15;
    }
    .encyclopedia-chrome.is-compact .encyclopedia-hero-copy,
    .encyclopedia-chrome.is-compact .encyclopedia-controls {
      max-height: 0;
      margin-top: 0;
      margin-bottom: 0;
      padding-top: 0;
      padding-bottom: 0;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-8px);
    }
    .encyclopedia-chrome.is-compact .encyclopedia-categories {
      margin-bottom: 0.75rem;
      padding-bottom: 0.25rem;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(14px) scale(0.985); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.48s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }
    .entries-grid {
    }
    .entry-card {
      transition: border-color 300ms ease, background-color 300ms ease;
    }
    .entry-image {
      transition: border-radius 300ms ease;
    }
    .entry-image img {
      transition: opacity 300ms ease;
    }
    .entry-content {
      transition: opacity 300ms ease;
    }
    .search-hit {
      color: #dbeafe;
      background: rgba(59, 130, 246, 0.28);
      border-radius: 2px;
      padding: 0 0.08em;
    }
    .encyclopedia-home {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-top: 0.85rem;
    }
    .home-feature-card,
    .home-ad-slot,
    .home-news-card {
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.045);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
    }
    .home-feature-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.55fr);
      gap: 1rem;
    }
    .home-feature-card,
    .home-news-card {
      text-align: left;
      overflow: hidden;
      border-radius: 8px;
      color: inherit;
      transition: transform 220ms ease, border-color 220ms ease, background 220ms ease;
    }
    .home-feature-card:hover,
    .home-news-card:hover {
      transform: translateY(-2px);
      border-color: rgba(147, 197, 253, 0.34);
      background: rgba(255, 255, 255, 0.065);
    }
    .home-feature-card {
      display: grid;
      grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.05fr);
      min-height: 23rem;
    }
    .home-feature-image,
    .home-news-thumb {
      position: relative;
      overflow: hidden;
      background: rgba(15, 23, 42, 0.9);
    }
    .home-feature-image img,
    .home-news-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .home-feature-content {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 1rem;
      min-width: 0;
      padding: 1.5rem;
    }
    .home-feature-content h3 {
      color: #fff;
      font-size: clamp(1.45rem, 2vw, 2.1rem);
      line-height: 1.15;
      font-weight: 900;
      letter-spacing: 0;
      margin: 0;
    }
    .home-feature-content p,
    .home-news-body p {
      color: rgba(203, 213, 225, 0.78);
      line-height: 1.7;
      margin: 0;
    }
    .home-open-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: #bfdbfe;
      font-size: 0.86rem;
      font-weight: 800;
    }
    .home-ad-slot {
      display: flex;
      min-height: 23rem;
      flex-direction: column;
      justify-content: center;
      border-radius: 8px;
      padding: 1.5rem;
      background:
        repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 12px),
        rgba(255, 255, 255, 0.035);
    }
    .home-ad-slot span {
      width: fit-content;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(147, 197, 253, 0.92);
      padding: 0.3rem 0.65rem;
      font-size: 0.7rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      margin-bottom: 1rem;
    }
    .home-ad-slot strong {
      color: rgba(255, 255, 255, 0.94);
      font-size: 1.15rem;
      line-height: 1.25;
      margin-bottom: 0.55rem;
    }
    .home-section-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 0.25rem;
    }
    .home-section-head h3 {
      color: #fff;
      font-size: 1.35rem;
      font-weight: 900;
      margin: 0 0 0.25rem;
      letter-spacing: 0;
    }
    .home-section-head p,
    .home-news-meta {
      color: rgba(148, 163, 184, 0.78);
      font-size: 0.78rem;
    }
    .home-source-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.45rem;
    }
    .home-source-row button {
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.09);
      background: rgba(255, 255, 255, 0.055);
      color: rgba(226, 232, 240, 0.86);
      padding: 0.42rem 0.75rem;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .home-source-row button:hover {
      background: rgba(255, 255, 255, 0.11);
      color: #fff;
    }
    .home-news-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }
    .home-news-card {
      display: grid;
      grid-template-rows: 10rem auto;
      min-height: 21rem;
    }
    .home-news-body {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
    }
    .home-news-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .home-news-body h4 {
      color: #fff;
      font-size: 1rem;
      line-height: 1.35;
      font-weight: 850;
      letter-spacing: 0;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .home-news-body p {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 0.875rem;
    }
    .home-image-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(circle at 24% 20%, rgba(96, 165, 250, 0.25), transparent 35%),
        radial-gradient(circle at 80% 80%, rgba(45, 212, 191, 0.18), transparent 36%),
        #111827;
      color: rgba(255, 255, 255, 0.72);
      font-size: 5rem;
      font-weight: 900;
    }
    .home-image-fallback.small {
      font-size: 3rem;
    }
    @media (max-width: 1180px) {
      .home-feature-grid,
      .home-feature-card {
        grid-template-columns: 1fr;
      }
      .home-feature-image {
        height: 18rem;
      }
      .home-ad-slot {
        min-height: 12rem;
      }
      .home-news-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 720px) {
      .home-section-head {
        align-items: flex-start;
        flex-direction: column;
      }
      .home-source-row {
        justify-content: flex-start;
      }
      .home-news-grid {
        grid-template-columns: 1fr;
      }
      .home-feature-image {
        height: 14rem;
      }
      .home-news-card {
        min-height: auto;
      }
    }
    .no-transition {
      transition-duration: 0ms !important;
    }
    @media (prefers-reduced-motion: reduce) {
      .encyclopedia-chrome,
      .encyclopedia-hero,
      .encyclopedia-title,
      .encyclopedia-hero-copy,
      .encyclopedia-controls,
      .encyclopedia-categories,
      .entries-grid,
      .entry-card,
      .entry-image,
      .entry-content {
        transition-duration: 0ms;
      }
    }
  `]
})
export class EncyclopediaComponent implements AfterViewInit, OnDestroy {
  dataService = inject(DataService);
  newsService = inject(ArchitectureNewsService);
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  searchQuery = signal('');
  debouncedQuery = signal('');
  selectedCategory = signal(this.dataService.encyclopediaSelectedCategory());
  viewMode = this.dataService.encyclopediaViewMode;
  displayLimit = this.dataService.encyclopediaDisplayLimit;
  encyclopediaChromeCompact = signal(false);
  isHomePage = computed(() => this.selectedCategory() === 'home' && !this.debouncedQuery().trim());
  featuredNews = computed(() => this.newsService.items()[0]);
  secondaryNews = computed(() => this.newsService.items().slice(1, 13));
  private lastAnimatedIndex = 0;

  // Typewriter properties
  currentTitle = signal('');
  private titles = ['建筑百科', 'ARCHIPEDIA'];
  private titleIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private timer: any;
  private queryUpdateTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollFrame = 0;
  private lastContentScrollTop = 0;
  private lastContentTouchY = 0;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('entriesContainer') entriesContainer?: ElementRef<HTMLDivElement>;
  @ViewChildren('.entry-card') entryCards!: QueryList<ElementRef>;

  private categoryOrder = [
    // 如果您添加了新的分类（例如“未来建筑”），默认它会出现在列表末尾。
    // 若要调整其显示顺序，请将其名称添加到此数组中的期望位置。
    // 未在此数组中列出的分类将按字母顺序排在这些指定分类之后。
    "中国古代建筑", "西方古代建筑", "现代构造与系统", "建筑风格与设计思潮", 
    "结构与构造理论", "建筑材料与施工工艺", "可持续与绿色建筑", 
    "城市规划与公共空间", "室内设计与景观设计", "建筑法规、标准与项目管理", 
    "数字化、BIM 与智能建筑", "绘图与制图", "建筑史、理论与批评"
  ];

  constructor() {
    void this.newsService.load();

    this.route.queryParamMap.subscribe(params => {
      const query = params.get('q') ?? '';
      if (query !== this.searchQuery()) {
        if (query.trim() && this.selectedCategory() === 'home') {
          this.selectedCategory.set('all');
        }
        this.searchQuery.set(query);
        this.debouncedQuery.set(query);
        this.displayLimit.set(50);
      }
    });

    effect(() => {
      this.dataService.encyclopediaSelectedCategory.set(this.selectedCategory());
    });
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
    if (this.queryUpdateTimer) clearTimeout(this.queryUpdateTimer);
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
    gsap.killTweensOf('.entry-card');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        const savedTop = this.dataService.encyclopediaScrollPosition();
        this.scrollContainer.nativeElement.scrollTop = savedTop;
        this.lastContentScrollTop = savedTop;
        if (savedTop > 24) {
          this.collapseEncyclopediaChrome();
        }
      }
    }, 0);
    
    if (this.prefersReducedMotion) {
      this.currentTitle.set('建筑百科');
    } else {
      this.typewriterEffect();
    }
  }

  private typewriterEffect() {
    const currentFullTitle = this.titles[this.titleIndex];

    if (this.isDeleting) {
      this.currentTitle.set(currentFullTitle.substring(0, this.charIndex - 1));
      this.charIndex--;
    } else {
      this.currentTitle.set(currentFullTitle.substring(0, this.charIndex + 1));
      this.charIndex++;
    }

    let delta = this.isDeleting ? 100 : 150;

    if (!this.isDeleting && this.charIndex === currentFullTitle.length) {
      delta = 2000; // Pause at end
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.titleIndex = (this.titleIndex + 1) % this.titles.length;
      delta = 500; // Pause before typing next
    }

    this.timer = setTimeout(() => this.typewriterEffect(), delta);
  }

  switchView(mode: 'grid' | 'list') {
    if (this.viewMode() === mode) {
      return;
    }

    if (this.isHomePage()) {
      this.viewMode.set(mode);
      return;
    }

    if (this.prefersReducedMotion) {
      this.viewMode.set(mode);
      return;
    }

    const container = this.entriesContainer?.nativeElement;
    if (!container) {
      this.viewMode.set(mode);
      return;
    }
    const currentCards = Array.from(container.querySelectorAll('.entry-card'));

    if (currentCards.length === 0) {
      this.viewMode.set(mode);
      return;
    }

    // Add no-transition class to prevent CSS transitions from interfering
    currentCards.forEach(card => card.classList.add('no-transition'));

    const state = Flip.getState(currentCards, { props: "borderRadius,boxShadow" });

    this.viewMode.set(mode);

    requestAnimationFrame(() => {
      // Force a reflow to ensure layout is settled
      container.offsetHeight; 
      const newCards = Array.from(container.querySelectorAll('.entry-card'));
      Flip.from(state, {
        elements: newCards,
        duration: 0.42,
        ease: "power3.inOut",
        nested: true,
        onComplete: () => {
          // Remove no-transition class after animation completes
          newCards.forEach(card => card.classList.remove('no-transition'));
        }
      });
    });
  }

  onScroll() {
    this.updateChromeFromScroll();
    if (this.scrollFrame) return;

    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      this.extendListNearEnd();
    });
  }

  onContentWheel(event: WheelEvent) {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    if (event.deltaY > 8) {
      this.collapseEncyclopediaChrome();
    } else if (event.deltaY < -8 && container.scrollTop <= 1) {
      this.expandEncyclopediaChrome();
    }
  }

  onPageWheel(event: WheelEvent) {
    const container = this.scrollContainer?.nativeElement;
    if (!container || container.contains(event.target as Node)) return;

    if (event.deltaY > 8) {
      this.collapseEncyclopediaChrome();
      container.scrollBy({ top: event.deltaY, behavior: 'auto' });
      event.preventDefault();
    } else if (event.deltaY < -8) {
      if (container.scrollTop <= 1) {
        this.expandEncyclopediaChrome();
      } else {
        container.scrollBy({ top: event.deltaY, behavior: 'auto' });
      }
      event.preventDefault();
    }
  }

  onContentTouchStart(event: TouchEvent) {
    this.lastContentTouchY = event.touches[0]?.clientY ?? 0;
  }

  onContentTouchMove(event: TouchEvent) {
    const container = this.scrollContainer?.nativeElement;
    const currentY = event.touches[0]?.clientY ?? this.lastContentTouchY;
    const deltaY = this.lastContentTouchY - currentY;
    this.lastContentTouchY = currentY;

    if (!container) return;
    if (deltaY > 8) {
      this.collapseEncyclopediaChrome();
    } else if (deltaY < -8 && container.scrollTop <= 1) {
      this.expandEncyclopediaChrome();
    }
  }

  private updateChromeFromScroll() {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    const currentTop = container.scrollTop;
    const delta = currentTop - this.lastContentScrollTop;
    if (currentTop > 24 && delta > 1) {
      this.collapseEncyclopediaChrome();
    }
    this.lastContentScrollTop = currentTop;
  }

  private collapseEncyclopediaChrome() {
    if (!this.encyclopediaChromeCompact()) {
      this.encyclopediaChromeCompact.set(true);
    }
  }

  private expandEncyclopediaChrome() {
    if (this.encyclopediaChromeCompact()) {
      this.encyclopediaChromeCompact.set(false);
    }
  }

  private extendListNearEnd() {
    if (this.isHomePage()) {
      return;
    }

    const element = this.scrollContainer?.nativeElement;
    if (!element) return;

    // Buffer of 200px
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 200) {
      if (this.displayLimit() < this._allFilteredEntries().length) {
        const oldLimit = this.displayLimit();
        this.displayLimit.update(limit => limit + 100);
        
        // Animate newly added cards
        requestAnimationFrame(() => {
          const container = this.entriesContainer?.nativeElement;
          if (!container) return;
          const newCards = Array.from(container.querySelectorAll('.entry-card')).slice(oldLimit);
          if (newCards.length > 0) {
            gsap.fromTo(newCards.slice(0, 32),
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", stagger: 0.012, overwrite: "auto" }
            );
          }
        });
      }
    }
  }

  updateSearch(query: string) {
    if (query.trim() && this.selectedCategory() === 'home') {
      this.selectedCategory.set('all');
    }
    this.searchQuery.set(query);
    this.displayLimit.set(50);
    this.expandEncyclopediaChrome();
    if (this.queryUpdateTimer) clearTimeout(this.queryUpdateTimer);
    this.queryUpdateTimer = setTimeout(() => {
      this.debouncedQuery.set(query);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: query.trim() || null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }, 140);
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = 0;
      this.lastContentScrollTop = 0;
    }
  }

  saveState(scrollTop: number) {
    this.dataService.encyclopediaScrollPosition.set(scrollTop);
  }

  categories = computed(() => {
    const cats = new Set<string>(this.dataService.entries().map(e => e.category));
    return Array.from(cats).sort((a: string, b: string) => {
      const idxA = this.categoryOrder.indexOf(a);
      const idxB = this.categoryOrder.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  });

  private searchIndex = computed(() => buildSearchIndex(this.dataService.entries()));

  private _allFilteredEntries = computed(() => {
    const rawQuery = this.debouncedQuery().trim();
    const cat = this.selectedCategory();
    return this.searchIndex()
      .filter(document => {
        const matchCat = cat === 'all' || cat === 'home' || document.entry.category === cat;
        if (!matchCat) return false;
        if (!rawQuery) return true;
        if (matchesSearch(document, rawQuery)) return true;

        const alternate = rawQuery.includes('栱')
          ? rawQuery.replace(/栱/g, '拱')
          : rawQuery.includes('拱')
            ? rawQuery.replace(/拱/g, '栱')
            : '';
        return Boolean(alternate && matchesSearch(document, alternate));
      })
      .map(document => document.entry);
  });

  filteredEntries = computed(() => {
    return this._allFilteredEntries().slice(0, this.displayLimit());
  });

  selectCategory(category: string) {
    if (this.selectedCategory() === category) {
      return;
    }

    const container = this.entriesContainer?.nativeElement;
    const currentCards = container ? Array.from(container.querySelectorAll('.entry-card')) : [];

    if (this.prefersReducedMotion || currentCards.length === 0) {
      this.expandEncyclopediaChrome();
      this.selectedCategory.set(category);
      this.searchQuery.set('');
      this.debouncedQuery.set('');
      this.clearSearchQueryParam();
      this.displayLimit.set(50);
      this.dataService.encyclopediaScrollPosition.set(0);
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = 0;
        this.lastContentScrollTop = 0;
      }
      return;
    }

    // Exit animation for current cards
    gsap.to(currentCards.slice(0, 36), {
      duration: 0.18,
      opacity: 0,
      y: 8,
      stagger: 0.008,
      ease: "power2.in",
      overwrite: "auto",
      onComplete: () => {
        // Update category and reset scroll/search after exit animation
        this.expandEncyclopediaChrome();
        this.selectedCategory.set(category);
        this.searchQuery.set('');
        this.debouncedQuery.set('');
        this.clearSearchQueryParam();
        this.displayLimit.set(50);
        this.dataService.encyclopediaScrollPosition.set(0);
        if (this.scrollContainer?.nativeElement) {
          this.scrollContainer.nativeElement.scrollTop = 0;
          this.lastContentScrollTop = 0;
        }

        // Enter animation for new cards
        requestAnimationFrame(() => {
          const newCards = container ? Array.from(container.querySelectorAll('.entry-card')) : [];
          gsap.fromTo(newCards.slice(0, 36),
            { opacity: 0, y: 12 }, // FROM these values
            { // TO these values (their natural CSS state)
              duration: 0.28,
              opacity: 1,
              y: 0,
              stagger: 0.012,
              ease: "power2.out",
              overwrite: "auto",
            }
          );
        });
      }
    });
  }

  createNew() {
    const currentCat = this.selectedCategory() === 'all' || this.selectedCategory() === 'home' ? '未分类' : this.selectedCategory();
    const newId = 'custom_' + Date.now();
    const newEntry = {
      id: newId,
      category: currentCat,
      subcategory: '新增',
      term: '新词条 (点击编辑)',
      termEn: 'New Entry',
      definition: '请点击上方“编辑”按钮修改此内容。',
      details: '在此处添加详细内容...',
      imageUrl: '',
      isCustom: true
    };
    this.dataService.addEntry(newEntry);
    this.router.navigate(['/entry', newId], { queryParams: { edit: 'true' } });
  }

  extractYear(details: string): string {
    const match = details.match(/\b(18|19|20)\d{2}\b/);
    return match ? match[0] : '';
  }

  highlightSegments(text: string | undefined): HighlightSegment[] {
    return splitHighlight(text, this.debouncedQuery());
  }

  searchSnippet(entry: Entry): string {
    return createSearchSnippet(entry, this.debouncedQuery());
  }

  newsTitle(item: ArchitectureNewsItem): string {
    return item.titleZh || item.title;
  }

  newsSummary(item: ArchitectureNewsItem): string {
    return item.summaryZh || item.summary;
  }

  openNewsItem(item: ArchitectureNewsItem) {
    this.dataService.openExternalModal(item.url);
  }

  openSource(url: string) {
    this.dataService.openExternalModal(url);
  }

  refreshNews() {
    void this.newsService.load(true);
  }

  formatNewsDate(value?: string): string {
    if (!value) return '今日';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '今日';

    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  private clearSearchQueryParam() {
    if (this.queryUpdateTimer) clearTimeout(this.queryUpdateTimer);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
