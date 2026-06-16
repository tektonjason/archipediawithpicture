import { Component, inject, computed, signal, AfterViewInit, ViewChild, ElementRef, effect, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AnimatedSearchBarComponent } from '../shared/animated-search-bar.component';
import { GsapHoverTooltipDirective } from '../shared/gsap-hover-tooltip.directive';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

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
          </div>
        }
      </div>

      <!-- Categories Filter -->
      <div class="encyclopedia-categories flex flex-nowrap gap-2 mb-6 shrink-0 overflow-x-auto pb-2 custom-scrollbar mask-gradient">
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
                   <img [src]="entry.imageUrl" class="w-full h-full object-cover" [style.object-position]="entry.imagePosition || 'center'" loading="lazy" [alt]="entry.term" data-flip-id="image-{{entry.id}}">
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
                  <h3 class="font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-1" [class.text-lg]="viewMode() === 'grid'" [class.text-base]="viewMode() === 'list'">{{ entry.term }}</h3>
                  @if (entry.details?.includes('19')) {
                    <span class="text-xs font-mono text-gray-500 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">{{ extractYear(entry.details) }}</span>
                  }
                </div>
                
                <p class="text-xs text-gray-500 italic truncate shrink-0" [class.mb-3]="viewMode() === 'grid'" [class.mb-1]="viewMode() === 'list'">{{ entry.termEn }}</p>
                
                <p class="text-sm text-gray-400 line-clamp-3 mb-4 flex-1 leading-relaxed" [class.hidden]="viewMode() === 'list'">
                  {{ entry.definition }}
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
  router: Router = inject(Router);
  searchQuery = signal('');
  selectedCategory = signal(this.dataService.encyclopediaSelectedCategory());
  viewMode = this.dataService.encyclopediaViewMode;
  displayLimit = this.dataService.encyclopediaDisplayLimit;
  encyclopediaChromeCompact = signal(false);
  private lastAnimatedIndex = 0;

  // Typewriter properties
  currentTitle = signal('');
  private titles = ['建筑百科', 'ARCHIPEDIA'];
  private titleIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private timer: any;
  private scrollFrame = 0;
  private lastContentScrollTop = 0;
  private lastContentTouchY = 0;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('entriesContainer') entriesContainer!: ElementRef<HTMLDivElement>;
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
    effect(() => {
      this.dataService.encyclopediaSelectedCategory.set(this.selectedCategory());
    });
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
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

    if (this.prefersReducedMotion) {
      this.viewMode.set(mode);
      return;
    }

    const container = this.entriesContainer.nativeElement;
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
    const element = this.scrollContainer.nativeElement;
    // Buffer of 200px
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 200) {
      if (this.displayLimit() < this._allFilteredEntries().length) {
        const oldLimit = this.displayLimit();
        this.displayLimit.update(limit => limit + 100);
        
        // Animate newly added cards
        requestAnimationFrame(() => {
          const container = this.entriesContainer.nativeElement;
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
    this.searchQuery.set(query);
    this.displayLimit.set(50);
    this.expandEncyclopediaChrome();
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

  private _allFilteredEntries = computed(() => {
    const rawQuery = this.searchQuery().trim().toLowerCase();
    const hasQuery = !!rawQuery;
    
    // “栱”/“拱” 互通：为当前查询构造同义变体
    const queryVariants = new Set<string>();
    if (hasQuery) {
      queryVariants.add(rawQuery);
      if (rawQuery.includes('栱')) {
        queryVariants.add(rawQuery.replace(/栱/g, '拱'));
      }
      if (rawQuery.includes('拱')) {
        queryVariants.add(rawQuery.replace(/拱/g, '栱'));
      }
    }

    const cat = this.selectedCategory();
    let list = this.dataService.entries().filter(e => {
      const matchCat = cat === 'all' || e.category === cat;
      
      let matchSearch = true;
      if (hasQuery) {
        const fields = [
          e.term || '',
          e.termEn || '',
          e.definition || '',
          e.details || ''
        ].map(v => v.toLowerCase());

        matchSearch = Array.from(queryVariants).some(qv =>
          fields.some(f => f.includes(qv))
        );
      }

      return matchCat && matchSearch;
    });
    return list; 
  });

  filteredEntries = computed(() => {
    return this._allFilteredEntries().slice(0, this.displayLimit());
  });

  selectCategory(category: string) {
    if (this.selectedCategory() === category) {
      return;
    }

    const container = this.entriesContainer.nativeElement;
    const currentCards = Array.from(container.querySelectorAll('.entry-card'));

    if (this.prefersReducedMotion || currentCards.length === 0) {
      this.expandEncyclopediaChrome();
      this.selectedCategory.set(category);
      this.searchQuery.set('');
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
        this.displayLimit.set(50);
        this.dataService.encyclopediaScrollPosition.set(0);
        if (this.scrollContainer?.nativeElement) {
          this.scrollContainer.nativeElement.scrollTop = 0;
          this.lastContentScrollTop = 0;
        }

        // Enter animation for new cards
        requestAnimationFrame(() => {
          const newCards = Array.from(container.querySelectorAll('.entry-card'));
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
    const currentCat = this.selectedCategory() === 'all' ? '未分类' : this.selectedCategory();
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
}
