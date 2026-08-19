import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService, StandardClause, StandardQuickRef } from '../../services/data.service';
import { LocaleService } from '../../services/locale.service';
import { AnimatedSearchBarComponent } from '../shared/animated-search-bar.component';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { ModalA11yDirective } from '../shared/modal-a11y.directive';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';

interface ClauseResult {
  standard: StandardQuickRef;
  clause: StandardClause;
}

interface StandardOption {
  value: string;
  label: string;
}

const CATEGORY_ORDER = [
  '全部',
  '空间尺度',
  '楼梯栏杆',
  '无障碍',
  '消防安全',
  '场地交通',
  '住宅车库',
  '采光环境',
  '设备管线',
  '其他'
];

@Component({
  selector: 'app-standards',
  imports: [AnimatedSearchBarComponent, GsapCardHoverDirective, ModalA11yDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page-scroll ui-page-pad text-white">
      <div class="ui-page-header">
        <h1 class="ui-title">{{ displayText('规范速查') }}</h1>
        <p class="ui-subtitle">{{ displayText('常用建筑设计国标条文、关键数值与官方来源速查') }}</p>
        <div class="relative mt-5 flex h-12 w-full max-w-xl justify-center">
          <app-animated-search-bar
            [query]="searchQuery()"
            (queryChange)="searchQuery.set($event)"
            [placeholder]="displayText('搜索 消防车道4m、坡道1:12、栏杆1.10m、日照、车库净高...')"
          ></app-animated-search-bar>
        </div>
      </div>

      <section class="ui-notice-info mb-4 shrink-0">
        <div class="ui-notice-title">
          <svg lucideInfo class="h-4 w-4 shrink-0" [strokeWidth]="2"></svg>
          {{ displayText('使用说明') }}
        </div>
        <p class="ui-notice-text">
          {{ displayText('用于方案初查，可按关键词、类别或规范来源定位常用条文；涉及地方规定、专项论证或审图意见时，以正式文本为准。') }}
        </p>
      </section>

      <div class="ui-filter-rail mb-1">
        <div class="ui-filter-row">
          @for (category of categories(); track category) {
            <button
              type="button"
              (click)="selectedCategory.set(category)"
              class="ui-filter-chip"
              [class.ui-chip-active]="selectedCategory() === category"
              [class.ui-chip-muted]="selectedCategory() !== category"
            >
              {{ displayText(category) }}
            </button>
          }
        </div>
      </div>

      <div class="mb-5 flex shrink-0">
        <div class="relative w-full max-w-xl" (click)="$event.stopPropagation()">
          <div class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{{ displayText('规范来源') }}</div>
          <button
            type="button"
            (click)="toggleStandardDropdown($event)"
            class="group flex min-h-12 w-full items-center justify-between gap-3 rounded-card border border-line bg-surface-raised/90 px-3 text-left shadow-sm outline-none transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out hover:border-blue-300/35 hover:bg-white/[0.05] focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/20"
            [attr.aria-expanded]="standardDropdownOpen()"
            aria-haspopup="listbox"
            [attr.aria-label]="displayText('选择规范来源')"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span class="shrink-0 rounded-control border border-blue-300/15 bg-blue-500/10 px-2.5 py-1 font-mono text-[11px] font-black text-blue-200">
                {{ standardOptionCode(selectedStandardOption()) }}
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm font-bold text-gray-100">{{ displayStandardOptionTitle(selectedStandardOption()) }}</span>
                <span class="mt-0.5 block text-[11px] text-gray-500">{{ displayIncludedClauseCount(selectedStandardClauseCount()) }}</span>
              </span>
            </span>
            <span class="flex shrink-0 items-center gap-2">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-control border border-white/10 bg-white/5 text-gray-400 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out group-hover:text-white"
                [class.rotate-180]="standardDropdownOpen()"
              >
                <svg lucideChevronDown class="h-4 w-4" [strokeWidth]="2"></svg>
              </span>
            </span>
          </button>

          @if (standardDropdownOpen()) {
            <div animate.enter="ui-popover-enter" animate.leave="ui-popover-leave" class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-card border border-blue-400/20 bg-[#17181d]/95 shadow-panel backdrop-blur-xl">
                <div class="max-h-80 overflow-y-auto p-2 custom-scrollbar" role="listbox" [attr.aria-label]="displayText('选择规范来源')">
                @for (option of standardOptions(); track option.value) {
                  <button
                    type="button"
                    role="option"
                    (click)="selectStandard(option.value, $event)"
                    class="flex w-full items-center justify-between gap-3 rounded-control px-2.5 py-2 text-left transition-colors hover:bg-white/[0.07]"
                    [class.bg-blue-950]="selectedStandard() === option.value"
                    [class.text-blue-100]="selectedStandard() === option.value"
                    [class.text-gray-300]="selectedStandard() !== option.value"
                    [attr.aria-selected]="selectedStandard() === option.value"
                  >
                    <span class="flex min-w-0 items-center gap-2.5">
                      <span class="w-24 shrink-0 rounded-control border border-white/10 bg-black/20 px-2 py-1 text-center font-mono text-[10px] font-black text-blue-200/80">
                        {{ standardOptionCode(option) }}
                      </span>
                      <span class="min-w-0">
                        <span class="block truncate text-sm font-semibold">{{ displayStandardOptionTitle(option) }}</span>
                        <span class="mt-0.5 block text-[11px] text-gray-500">{{ displayClauseCount(clauseCountForStandard(option.value)) }}</span>
                      </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2">
                      @if (selectedStandard() === option.value) {
                        <svg lucideCheckCircle class="h-4 w-4 text-blue-300" [strokeWidth]="2"></svg>
                      }
                    </span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <div class="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-2xl font-black text-white">{{ displayText('常用条文') }}</h2>
          <p class="mt-1 text-sm text-gray-500">{{ displayMatchCount(filteredClauses().length) }}</p>
        </div>
        <button type="button" class="ui-btn-secondary px-3 py-2 text-xs" (click)="clearFilters()">
          {{ displayText('清除筛选') }}
        </button>
      </div>

      @if (filteredClauses().length === 0) {
        <div class="ui-empty-state h-64">
          <div class="ui-empty-icon"><svg lucideSearch class="h-8 w-8" [strokeWidth]="1.8"></svg></div>
          <p class="font-medium">{{ displayText('没有找到匹配的条文') }}</p>
          <p class="mt-1 text-sm text-gray-500">{{ displayText('换一个关键词，或直接打开对应官方来源检索完整规范。') }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          @for (result of visibleClauses(); track result.clause.id) {
            <article class="ui-card ui-card-hover ui-long-list-item overflow-hidden p-0" appGsapCardHover>
              <div class="border-b border-white/10 bg-white/[0.025] p-3">
                <div class="mb-2 flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span class="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">{{ displayText(categoryGroup(result.clause.category)) }}</span>
                      <span class="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-gray-400">{{ displayText(result.clause.category) }}</span>
                      <span class="font-mono text-[11px] text-gray-500">{{ result.standard.code }}</span>
                      <span class="hidden text-[11px] text-gray-600 sm:inline">·</span>
                      <span class="hidden max-w-[14rem] truncate text-[11px] text-gray-500 sm:inline">{{ displayText(result.standard.title) }}</span>
                      <span class="font-mono text-[11px] text-gray-500">{{ displayClauseNo(result.clause.clauseNo) }}</span>
                    </div>
                    <h3 class="text-[15px] font-black leading-snug text-white md:text-base">{{ displayTechnicalText(result.clause.title) }}</h3>
                  </div>
                  <div class="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      (click)="toggleClauseFavorite(result)"
                      class="ui-icon-btn h-9 w-9"
                      [class.text-yellow-300]="isClauseFavorite(result)"
                      [title]="displayText(isClauseFavorite(result) ? '取消收藏' : '收藏条文')"
                      [attr.aria-label]="displayText(isClauseFavorite(result) ? '取消收藏' : '收藏条文')"
                    >
                      <svg lucideStar class="h-4 w-4" [strokeWidth]="2" [attr.fill]="isClauseFavorite(result) ? 'currentColor' : 'none'"></svg>
                    </button>
                    <button
                      type="button"
                      (click)="openNoteEditor(result)"
                      class="ui-icon-btn h-9 w-9"
                      [class.text-blue-300]="hasClauseNote(result)"
                      [title]="displayText('条文笔记')"
                      [attr.aria-label]="displayText('条文笔记')"
                    >
                      <svg lucideStickyNote class="h-4 w-4" [strokeWidth]="2"></svg>
                    </button>
                    <button
                      type="button"
                      (click)="copyClause(result)"
                      class="ui-icon-btn h-9 w-9"
                      [title]="displayText('复制条文要点')"
                      [attr.aria-label]="displayText('复制条文要点')"
                    >
                      <svg lucideCopy class="h-4 w-4" [strokeWidth]="2"></svg>
                    </button>
                    <button
                      type="button"
                      (click)="openFeedback(result)"
                      class="ui-icon-btn h-9 w-9"
                      [title]="displayText('内容纠错')"
                      [attr.aria-label]="displayText('内容纠错')"
                    >
                      <svg lucideMail class="h-4 w-4" [strokeWidth]="2"></svg>
                    </button>
                  </div>
                </div>

                @if (result.clause.numericValues.length > 0) {
                  <div class="flex flex-wrap gap-1.5">
                    @for (value of result.clause.numericValues; track value) {
                      <button
                        type="button"
                        (click)="searchQuery.set(value)"
                        class="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
                      >
                        {{ displayNumericValue(value) }}
                      </button>
                    }
                  </div>
                }
              </div>

              <details class="group md:hidden">
                <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-bold text-blue-200">
                  <span>{{ displayText('查看适用场景与具体要求') }}</span>
                  <span class="text-gray-500 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div class="space-y-2 px-3 pb-3">
                  <div class="rounded-control border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div class="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">{{ displayText('适用场景') }}</div>
                    <p class="text-[13px] leading-relaxed text-gray-300">{{ displayTechnicalText(result.clause.appliesTo) }}</p>
                  </div>
                  <div class="rounded-control border border-white/10 bg-black/20 px-3 py-2">
                    <div class="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">{{ displayText('具体要求') }}</div>
                    <p class="text-[13px] leading-relaxed text-gray-200">{{ displayTechnicalText(result.clause.requirement) }}</p>
                  </div>
                  @if (result.clause.note) {
                    <p class="rounded-control border border-amber-400/15 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/80">
                      {{ displayTechnicalText(result.clause.note) }}
                    </p>
                  }
                </div>
              </details>

              <div class="hidden space-y-2 p-3 md:block">
                <div class="rounded-control border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div class="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">{{ displayText('适用场景') }}</div>
                  <p class="text-[13px] leading-relaxed text-gray-300">{{ displayTechnicalText(result.clause.appliesTo) }}</p>
                </div>
                <div class="rounded-control border border-white/10 bg-black/20 px-3 py-2">
                  <div class="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">{{ displayText('具体要求') }}</div>
                  <p class="text-[13px] leading-relaxed text-gray-200">{{ displayTechnicalText(result.clause.requirement) }}</p>
                </div>
                @if (result.clause.note) {
                  <p class="rounded-control border border-amber-400/15 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/80">
                    {{ displayTechnicalText(result.clause.note) }}
                  </p>
                }
              </div>

              <div class="px-3 pb-3">
                @if (noteEditingClauseId() === result.clause.id) {
                  <div class="mb-3 rounded-control border border-blue-400/20 bg-blue-500/10 p-3">
                    <label class="mb-2 block text-xs font-bold text-blue-200">{{ displayText('我的笔记') }}</label>
                    <textarea
                      class="ui-field min-h-24 resize-y bg-black/25 text-sm"
                      [value]="noteDraft()"
                      (input)="noteDraft.set($any($event.target).value)"
                      [placeholder]="displayText('记录审图提示、项目适用条件、个人理解...')"
                    ></textarea>
                    <div class="mt-2 flex justify-end gap-2">
                      <button type="button" class="ui-btn-secondary px-3 py-1.5 text-xs" (click)="cancelNoteEditor()">{{ displayText('取消') }}</button>
                      <button type="button" class="ui-btn-primary px-3 py-1.5 text-xs" (click)="saveNote(result)">{{ displayText('保存笔记') }}</button>
                    </div>
                  </div>
                } @else if (hasClauseNote(result)) {
                  <button
                    type="button"
                    (click)="openNoteEditor(result)"
                    class="mb-3 hidden w-full rounded-control border border-blue-400/15 bg-blue-500/10 px-3 py-2 text-left text-xs leading-relaxed text-blue-100/85 transition-colors hover:bg-blue-500/15 md:block"
                  >
                    <span class="mb-1 flex items-center gap-2 font-bold text-blue-200">
                      <svg lucideStickyNote class="h-3.5 w-3.5" [strokeWidth]="2"></svg>
                      {{ displayText('我的笔记') }}
                    </span>
                    {{ clauseNote(result) }}
                  </button>
                }

                <div class="mb-2 flex flex-wrap gap-1.5">
                  @for (keyword of result.clause.keywords; track keyword) {
                    <button type="button" (click)="searchQuery.set(keyword)" class="rounded bg-white/5 px-2 py-0.5 text-[11px] text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-200">#{{ displayTechnicalText(keyword) }}</button>
                  }
                </div>

                <div class="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    (click)="dataService.openExternalModal(result.clause.sourceUrl)"
                    class="ui-btn-secondary gap-2 px-3 py-2 text-xs"
                  >
                    <svg lucideExternalLink class="h-4 w-4" [strokeWidth]="2"></svg>
                    {{ displayText(result.clause.sourceName) }}
                  </button>
                  <span class="ml-auto text-xs text-gray-600">{{ displayVerifiedAt(result.clause.verifiedAt) }}</span>
                </div>
              </div>
            </article>
          }
        </div>
        @if (hasMoreClauses()) {
          <div #loadMoreSentinel class="flex min-h-16 items-center justify-center" aria-hidden="true">
            <span class="h-1.5 w-16 rounded-full bg-white/10"></span>
          </div>
        }
      }

      @if (showFeedbackModal()) {
        <div class="ui-modal-shell">
          <div class="ui-modal-backdrop" animate.enter="ui-backdrop-enter" animate.leave="ui-backdrop-leave" (click)="closeFeedback()"></div>
          <div appModalA11y (modalClose)="closeFeedback()" animate.enter="ui-modal-enter" animate.leave="ui-modal-leave" class="ui-modal-panel max-w-xl overflow-hidden">
            <div class="ui-modal-header">
              <div>
                <h3 class="text-lg font-black text-white">{{ displayText('规范条文纠错') }}</h3>
                <p class="mt-1 text-xs text-gray-500">{{ feedbackTargetLabel() }}</p>
              </div>
              <button type="button" class="ui-icon-btn" (click)="closeFeedback()" [attr.aria-label]="displayText('关闭')">
                <svg lucideX class="h-5 w-5" [strokeWidth]="2"></svg>
              </button>
            </div>
            <div class="ui-modal-body space-y-4">
              <div>
                <label class="ui-label">{{ displayText('问题类型') }}</label>
                <select class="ui-field" [value]="feedbackType()" (change)="feedbackType.set($any($event.target).value)">
                  <option value="条文数值可能有误">{{ displayText('条文数值可能有误') }}</option>
                  <option value="适用场景不准确">{{ displayText('适用场景不准确') }}</option>
                  <option value="来源或条文号有误">{{ displayText('来源或条文号有误') }}</option>
                  <option value="表述需要优化">{{ displayText('表述需要优化') }}</option>
                </select>
              </div>
              <div>
                <label class="ui-label">{{ displayText('问题说明') }}</label>
                <textarea class="ui-field min-h-24 resize-y" [value]="feedbackDescription()" (input)="feedbackDescription.set($any($event.target).value)" [placeholder]="displayText('请说明你发现的问题')"></textarea>
              </div>
              <div>
                <label class="ui-label">{{ displayText('建议改法') }}</label>
                <textarea class="ui-field min-h-20 resize-y" [value]="feedbackSuggestion()" (input)="feedbackSuggestion.set($any($event.target).value)" [placeholder]="displayText('可填写建议替换的条文、数值或表述')"></textarea>
              </div>
              <div>
                <label class="ui-label">{{ displayText('参考来源') }}</label>
                <input class="ui-field" [value]="feedbackSource()" (input)="feedbackSource.set($any($event.target).value)" [placeholder]="displayText('规范截图、官方链接、页码等')">
              </div>
              <div class="flex justify-end gap-3 border-t border-line pt-4">
                <button type="button" class="ui-btn-secondary" (click)="closeFeedback()">{{ displayText('取消') }}</button>
                <button type="button" class="ui-btn-primary" (click)="submitFeedback()">{{ displayText('生成邮件') }}</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class StandardsComponent implements OnDestroy {
  private readonly pageSize = 30;
  private loadObserver?: IntersectionObserver;

  @ViewChild('loadMoreSentinel')
  set loadMoreSentinel(element: ElementRef<HTMLElement> | undefined) {
    this.loadObserver?.disconnect();
    if (!element || typeof IntersectionObserver === 'undefined') return;

    this.loadObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      this.visibleClauseCount.update(count => Math.min(count + this.pageSize, this.filteredClauses().length));
    }, { rootMargin: '320px 0px' });
    this.loadObserver.observe(element.nativeElement);
  }

  dataService = inject(DataService);
  locale = inject(LocaleService);
  private route = inject(ActivatedRoute);
  searchQuery = signal('');
  selectedCategory = signal('全部');
  selectedStandard = signal('全部规范');
  standardDropdownOpen = signal(false);
  noteEditingClauseId = signal<string | null>(null);
  noteDraft = signal('');
  showFeedbackModal = signal(false);
  feedbackTarget = signal<ClauseResult | null>(null);
  feedbackType = signal('条文数值可能有误');
  feedbackDescription = signal('');
  feedbackSuggestion = signal('');
  feedbackSource = signal('');
  visibleClauseCount = signal(this.pageSize);

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const query = params.get('q');
      if (query) this.searchQuery.set(query);
    });
  }

  clauseResults = computed<ClauseResult[]>(() =>
    this.dataService.standards().flatMap(standard =>
      standard.clauses.map(clause => ({ standard, clause }))
    )
  );

  categories = computed(() => {
    const values = new Set(this.clauseResults().map(result => this.categoryGroup(result.clause.category)));
    return CATEGORY_ORDER.filter(category => category === '全部' || values.has(category));
  });

  standardOptions = computed<StandardOption[]>(() => [
    { value: '全部规范', label: '全部规范' },
    ...this.dataService.standards().map(standard => ({
      value: standard.code,
      label: `${standard.code} · ${standard.title}`
    }))
  ]);

  selectedStandardOption = computed(() =>
    this.standardOptions().find(option => option.value === this.selectedStandard()) ?? { value: '全部规范', label: '全部规范' }
  );

  selectedStandardClauseCount = computed(() => this.clauseCountForStandard(this.selectedStandard()));

  filteredClauses = computed(() => {
    const category = this.selectedCategory();
    const standard = this.selectedStandard();
    const query = this.normalizedQuery();
    const queryTokens = this.normalizedQueryTokens();

    return this.clauseResults().filter(result => {
      if (category !== '全部' && this.categoryGroup(result.clause.category) !== category) return false;
      if (standard !== '全部规范' && result.standard.code !== standard) return false;
      if (!query) return true;
      const haystack = this.normalizeText(this.clauseHaystack(result));
      return haystack.includes(query) || queryTokens.every(token => haystack.includes(token));
    });
  });

  visibleClauses = computed(() => this.filteredClauses().slice(0, this.visibleClauseCount()));
  hasMoreClauses = computed(() => this.visibleClauseCount() < this.filteredClauses().length);

  private readonly resetVisibleClauses = effect(() => {
    this.searchQuery();
    this.selectedCategory();
    this.selectedStandard();
    untracked(() => this.visibleClauseCount.set(this.pageSize));
  });

  ngOnDestroy() {
    this.loadObserver?.disconnect();
  }

  categoryGroup(category: string): string {
    if (category.includes('无障碍')) return '无障碍';
    if (category.includes('防火') || category.includes('疏散') || category.includes('消防') || category.includes('安全')) return '消防安全';
    if (category.includes('楼梯') || category.includes('栏杆') || category.includes('台阶') || category.includes('坡道')) return '楼梯栏杆';
    if (category.includes('净高') || category.includes('房间') || category.includes('公共空间') || category.includes('套内') || category.includes('建筑高度') || category.includes('建筑层数') || category.includes('总平面')) return '空间尺度';
    if (category.includes('基地') || category.includes('道路') || category.includes('出入口') || category.includes('停车') || category.includes('车库')) return '场地交通';
    if (category.includes('住宅') || category.includes('厨房') || category.includes('卫生间') || category.includes('地下空间')) return '住宅车库';
    if (category.includes('日照') || category.includes('采光') || category.includes('通风') || category.includes('照明') || category.includes('隔声') || category.includes('环境')) return '采光环境';
    if (category.includes('设备') || category.includes('给水') || category.includes('排水') || category.includes('电气') || category.includes('燃气')) return '设备管线';
    return '其他';
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('全部');
    this.selectedStandard.set('全部规范');
    this.standardDropdownOpen.set(false);
  }

  toggleStandardDropdown(event: Event) {
    event.stopPropagation();
    this.standardDropdownOpen.update(open => !open);
  }

  selectStandard(value: string, event?: Event) {
    event?.stopPropagation();
    this.selectedStandard.set(value);
    this.standardDropdownOpen.set(false);
  }

  clauseCountForStandard(value: string): number {
    if (value === '全部规范') return this.clauseResults().length;
    return this.dataService.standards().find(standard => standard.code === value)?.clauses.length ?? 0;
  }

  optionLabelTitle(option: StandardOption): string {
    if (option.value === '全部规范') return option.label;
    return option.label.replace(`${option.value} · `, '');
  }

  displayText(value: string | null | undefined, fallback?: string): string {
    return this.locale.translateData(value, fallback);
  }

  displayStandardOptionTitle(option: StandardOption): string {
    return this.displayText(this.optionLabelTitle(option));
  }

  displayClauseCount(count: number): string {
    return this.locale.isEnglish() ? `${count} common clauses` : `${count} 条常用条文`;
  }

  displayIncludedClauseCount(count: number): string {
    return this.locale.isEnglish() ? `${count} common clauses included` : `已收录 ${count} 条常用条文`;
  }

  displayMatchCount(count: number): string {
    return this.locale.isEnglish() ? `${count} matching clauses` : `共 ${count} 条匹配结果`;
  }

  displayClauseNo(clauseNo: string): string {
    return this.locale.isEnglish() ? `Clause ${clauseNo}` : `第 ${clauseNo} 条`;
  }

  displayVerifiedAt(date: string): string {
    return this.locale.isEnglish() ? `Verified ${date}` : `核验 ${date}`;
  }

  displayNumericValue(value: string): string {
    if (!this.locale.isEnglish()) return value;
    const normalized = this.normalizeNumericToken(value);
    return this.locale.hasCjk(normalized) ? this.genericTechnicalFallback(value) : normalized;
  }

  displayTechnicalText(value: string | null | undefined): string {
    if (!value) return '';
    if (!this.locale.isEnglish()) return value;

    const translated = this.locale.translateToEnglish(value);
    if (!this.locale.hasCjk(translated)) return translated;

    const technical = this.technicalEnglish(value);
    return this.locale.hasCjk(technical) ? this.genericTechnicalFallback(value) : technical;
  }

  standardOptionCode(option: StandardOption): string {
    if (option.value === '全部规范') return 'ALL';
    return option.value.replace(/\s+/g, ' ');
  }

  private technicalEnglish(value: string): string {
    let text = value
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/，/g, ', ')
      .replace(/；/g, '; ')
      .replace(/。/g, '.')
      .replace(/、/g, ', ')
      .replace(/：/g, ': ')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/不应小于/g, 'shall be no less than')
      .replace(/不应大于/g, 'shall not exceed')
      .replace(/不宜小于/g, 'should be no less than')
      .replace(/不宜大于/g, 'should not exceed')
      .replace(/不应少于/g, 'shall be at least')
      .replace(/不应超过/g, 'shall not exceed')
      .replace(/应设置/g, 'shall provide')
      .replace(/应采用/g, 'shall use')
      .replace(/应满足/g, 'shall satisfy')
      .replace(/应采取/g, 'shall take')
      .replace(/宜为/g, 'should be')
      .replace(/宜/g, 'should')
      .replace(/不得/g, 'must not')
      .replace(/严禁/g, 'is strictly prohibited from')
      .replace(/必须/g, 'must');

    const replacements: Array<[string, string]> = [
      ['住宅项目居住街坊集中绿地配置', 'central green-space provision in residential neighborhood blocks'],
      ['新区建设项目人均集中绿地面积', 'per-capita central green-space area in new development projects'],
      ['旧区改建项目', 'old-district redevelopment projects'],
      ['集中绿地宽度', 'central green-space width'],
      ['日照阴影线范围外的绿地面积占比', 'share of green-space area outside the sunlight shadow line'],
      ['老年人和儿童活动场地', 'activity areas for older adults and children'],
      ['自然坡度较大场地台地式布局', 'terraced layout for sites with steep natural slopes'],
      ['住宅项目场地自然坡度大于8.0%的山地或坡地项目', 'mountain or sloping residential sites with a natural site gradient greater than 8.0%'],
      ['护坡或挡土墙上缘', 'upper edge of a slope protection or retaining wall'],
      ['高台地建筑', 'upper-terrace building'],
      ['低台地建筑', 'lower-terrace building'],
      ['住宅场地排水坡度', 'residential site drainage gradient'],
      ['防洪排涝', 'flood prevention and drainage'],
      ['雨水资源化利用', 'rainwater resource utilization'],
      ['场地地面排水设计坡度', 'site surface drainage design gradient'],
      ['卧室最小使用面积与短边', 'minimum bedroom usable area and short-side width'],
      ['兼起居室的卧室', 'bedroom combined with a living room'],
      ['卧室短边净宽', 'clear width of the bedroom short side'],
      ['新建住宅层高与主要房间净高', 'storey height and main-room clear height in new residential buildings'],
      ['新建住宅建筑层高', 'storey height of new residential buildings'],
      ['卧室、起居室室内净高', 'indoor clear height of bedrooms and living rooms'],
      ['局部净高面积', 'area with reduced local clear height'],
      ['室内使用面积', 'indoor usable area'],
      ['坡屋顶内卧室与起居室净高', 'clear height of bedrooms and living rooms under pitched roofs'],
      ['利用坡屋顶内空间', 'spaces within pitched roofs'],
      ['厨房和卫生间室内净高', 'indoor clear height of kitchens and bathrooms'],
      ['卧室起居室厨房不得布置在地下室', 'bedrooms, living rooms, and kitchens must not be placed in basements'],
      ['半地下室', 'semi-basements'],
      ['通风、防潮、排水和安全防护', 'ventilation, moisture protection, drainage, and safety protection'],
      ['住宅厨房卫生间不应布置在下层住户卧室等上方', 'residential kitchens and bathrooms shall not be placed above lower-floor bedrooms and similar rooms'],
      ['下层住户', 'lower-floor dwelling'],
      ['起居室、书房、厨房、餐厅', 'living rooms, studies, kitchens, and dining rooms'],
      ['厨房直接采光和自然通风', 'direct daylighting and natural ventilation for kitchens'],
      ['厨房排油烟', 'kitchen exhaust'],
      ['卫生间防水与排水', 'bathroom waterproofing and drainage'],
      ['住宅套内过道净宽', 'clear width of in-unit residential passageways'],
      ['套内入口过道', 'in-unit entrance passageway'],
      ['通往卧室、起居室的过道', 'passageway to bedrooms and living rooms'],
      ['通往厨房、卫生间和储藏室的过道', 'passageway to kitchens, bathrooms, and storage rooms'],
      ['住宅阳台栏杆防护', 'protective guardrails for residential balconies'],
      ['住宅低窗台防护', 'protection at low residential windowsills'],
      ['外窗窗台距楼面、地面净高', 'clear height from the external-window sill to the floor or ground'],
      ['住宅凸窗防护', 'protection for residential bay windows'],
      ['住宅公共楼梯踏步尺寸', 'tread and riser dimensions of residential common stairs'],
      ['住宅公共楼梯栏杆高度', 'guardrail height for residential common stairs'],
      ['住宅电梯设置层数', 'storey threshold for residential elevator provision'],
      ['设有电梯住宅至少一台担架电梯', 'at least one stretcher-capable elevator in residential buildings with elevators'],
      ['住宅公共区域照明', 'lighting in residential common areas'],
      ['住宅燃气安全', 'residential gas safety'],
      ['燃气管道、燃气表和燃气设备', 'gas pipes, gas meters, and gas equipment'],
      ['自然通风良好', 'well naturally ventilated'],
      ['住宅隔声降噪', 'residential sound insulation and noise control'],
      ['分户墙和分户楼板', 'party walls and separating floors'],
      ['空气声隔声', 'airborne sound insulation'],
      ['撞击声隔声', 'impact sound insulation'],
      ['住宅排气道', 'residential exhaust ducts'],
      ['排气道出屋面高度', 'height of exhaust ducts above the roof'],
      ['住宅无障碍改造条件', 'conditions for residential accessibility retrofit'],
      ['居住街坊集中绿地', 'central green space in residential neighborhood blocks'],
      ['场地自然坡度', 'natural site gradient'],
      ['山地或坡地项目', 'mountain or sloping-site projects'],
      ['台地式布局', 'terraced layout'],
      ['护坡', 'slope protection'],
      ['挡土墙', 'retaining wall'],
      ['水平净距', 'clear horizontal distance'],
      ['场地竖向设计', 'site vertical design'],
      ['地面排水', 'surface drainage'],
      ['使用面积', 'usable area'],
      ['短边净宽', 'clear short-side width'],
      ['层高', 'storey height'],
      ['局部净高', 'local clear height'],
      ['卫生间防水', 'bathroom waterproofing'],
      ['防潮', 'moisture protection'],
      ['安全防护', 'safety protection'],
      ['低窗台', 'low windowsill'],
      ['凸窗', 'bay window'],
      ['担架电梯', 'stretcher-capable elevator'],
      ['公共区域', 'common areas'],
      ['燃气设备', 'gas equipment'],
      ['排气道', 'exhaust duct'],
      ['风帽', 'vent cap'],
      ['无障碍改造', 'accessibility retrofit'],
      ['建筑高度起算室外设计地坪', 'building height measured from the outdoor design ground level'],
      ['民用建筑高度计算', 'civil-building height calculation'],
      ['室外设计地坪', 'outdoor design ground level'],
      ['建筑主要屋面或檐口等控制点', 'main roof, eave, or other control point of the building'],
      ['坡屋面、多种屋面形式和局部突出物', 'pitched roofs, mixed roof forms, and local projections'],
      ['地下室和半地下室层数判定', 'storey counting for basements and semi-basements'],
      ['自然层数和消防高度判断', 'natural-storey count and fire-safety height determination'],
      ['顶板高出室外设计地面的空间', 'space whose top slab is above the outdoor design ground level'],
      ['基地排水不得污染周边', 'site drainage must not pollute adjacent areas'],
      ['雨污水组织和场地排水', 'rainwater, wastewater, and site drainage organization'],
      ['地表径流', 'surface runoff'],
      ['相邻用地、市政道路或公共空间', 'adjacent land, municipal roads, or public spaces'],
      ['人车流线与出入口组织', 'pedestrian-vehicle circulation and entrance organization'],
      ['非机动车', 'non-motor vehicles'],
      ['主要人流与车流交叉', 'crossing between main pedestrian flow and vehicle flow'],
      ['公共卫生间位置与服务可达', 'location and service accessibility of public toilets'],
      ['便于识别和到达的位置', 'locations that are easy to identify and reach'],
      ['服务半径', 'service radius'],
      ['走廊净宽满足通行与疏散', 'corridor clear width satisfying passage and egress'],
      ['搬运', 'transport of objects'],
      ['地下空间防水排水与安全', 'waterproofing, drainage, and safety for underground spaces'],
      ['防涝措施', 'flooding prevention measures'],
      ['设备平台检修与防护', 'maintenance and protection for equipment platforms'],
      ['设备安装、检修、排水、防坠落和人员安全', 'equipment installation, maintenance, drainage, fall prevention, and personnel safety'],
      ['上人屋面安全防护', 'safety protection for accessible roofs'],
      ['屋面设备检修区域', 'roof equipment maintenance areas'],
      ['防坠落、防滑、排水和检修安全措施', 'fall prevention, slip resistance, drainage, and maintenance safety measures'],
      ['结构层高2.20m与面积计算', '2.20 m structural storey height and floor-area calculation'],
      ['建筑面积计算与方案指标核对', 'floor-area calculation and design-index checking'],
      ['结构层高2.20m分界值', '2.20 m structural storey-height threshold'],
      ['围护边界', 'enclosure boundary'],
      ['地方测绘口径', 'local surveying calculation rules'],
      ['消防车道坡度', 'fire-lane gradient'],
      ['满载消防车正常通行', 'normal passage of fully loaded fire trucks'],
      ['消防车停靠和作业要求', 'fire-truck parking and operation requirements'],
      ['尽头式消防车道回转', 'turnaround for dead-end fire lanes'],
      ['消防扑救面障碍控制', 'obstacle control at the fire-fighting access face'],
      ['建筑消防扑救面', 'building fire-fighting access face'],
      ['架空高压电线', 'overhead high-voltage power lines'],
      ['高层建筑登高操作场地', 'aerial fire-apparatus operation site for high-rise buildings'],
      ['消防车登高操作场地', 'aerial fire-apparatus operation site'],
      ['消防扑救面', 'fire-fighting access face'],
      ['裙房进深', 'podium depth'],
      ['疏散路径与其他功能分隔', 'separation between egress paths and other functions'],
      ['经营、储藏、设备等非疏散功能', 'commercial, storage, equipment, and other non-egress functions'],
      ['中庭与周围空间防火分隔', 'fire separation between atria and surrounding spaces'],
      ['共享大厅', 'shared halls'],
      ['上下连通空间', 'vertically connected spaces'],
      ['火烟跨层蔓延', 'vertical spread of fire and smoke'],
      ['商业营业厅防火分区', 'fire compartments for commercial sales halls'],
      ['大开间公共空间', 'large open-plan public spaces'],
      ['楼层位置、自动灭火系统、排烟条件和疏散距离', 'floor location, automatic fire-extinguishing system, smoke exhaust conditions, and egress distance'],
      ['有人员正常活动空间最低净高', 'Minimum clear height for occupied spaces'],
      ['公共楼梯转向平台宽度', 'Turning landing width of public stairs'],
      ['直跑楼梯中间平台宽度', 'Intermediate landing width of straight-run stairs'],
      ['楼梯间门距踏步边缘', 'Distance from stairwell door to tread edge'],
      ['公共楼梯平台和梯段净高', 'Clear height of public stair landings and flights'],
      ['公共楼梯每梯段踏步级数', 'Number of treads per public stair flight'],
      ['螺旋楼梯和扇形踏步最小踏面', 'Minimum tread width for spiral and winder stairs'],
      ['相邻梯段踏步高度差', 'Riser-height difference between adjacent stair flights'],
      ['少年儿童活动场所楼梯井防坠', 'Fall protection for stairwells in children activity spaces'],
      ['临空栏杆基本高度', 'Basic height of guardrails at open edges'],
      ['栏杆高度起算位置', 'Datum for measuring guardrail height'],
      ['栏杆底部不宜留空', 'Guardrail bottom should not be left open'],
      ['道路红线和用地红线内不得随意突出', 'No arbitrary projection beyond road or land red lines'],
      ['建筑主体', 'main building body'],
      ['地下设施', 'underground facilities'],
      ['阳台', 'balconies'],
      ['雨篷', 'canopies'],
      ['台阶', 'steps'],
      ['坡道', 'ramps'],
      ['设备平台', 'equipment platforms'],
      ['围墙', 'boundary walls'],
      ['公共楼梯', 'public stair'],
      ['楼梯休息平台', 'stair landing'],
      ['梯段净宽', 'clear flight width'],
      ['中间实体墙', 'intermediate solid wall'],
      ['扶手转向端平台净宽', 'clear landing width at handrail turn'],
      ['公共直跑楼梯中间休息平台', 'intermediate landing of a public straight-run stair'],
      ['楼梯间门距踏步边缘的距离', 'distance from the stairwell door to the tread edge'],
      ['楼梯休息平台上部及下部过道处净高', 'clear height above and below stair landings'],
      ['梯段净高', 'clear height over the stair flight'],
      ['每个梯段踏步级数', 'number of treads in each flight'],
      ['离内侧扶手中心', 'at the centerline of the inner handrail'],
      ['踏步宽度', 'tread width'],
      ['每个楼梯的踏步高度、宽度', 'the riser height and tread width of each stair'],
      ['踏步面', 'tread surface'],
      ['防滑措施', 'anti-slip measures'],
      ['托儿所', 'nurseries'],
      ['幼儿园', 'kindergartens'],
      ['中小学校', 'primary and secondary schools'],
      ['少年儿童专用活动场所', 'activity spaces dedicated to children'],
      ['公共楼梯井', 'public stairwell void'],
      ['防止少年儿童坠落的措施', 'measures to prevent children from falling'],
      ['临空部位', 'open-edge locations'],
      ['防护栏杆', 'protective guardrails'],
      ['栏杆或栏板垂直高度', 'vertical height of guardrail or parapet'],
      ['楼地面或屋面至扶手顶面', 'floor or roof surface to the top of handrail'],
      ['可踏部位', 'climbable surface'],
      ['顶面起算', 'measured from its top surface'],
      ['地下室', 'basements'],
      ['局部夹层', 'partial mezzanines'],
      ['公共走道', 'public corridors'],
      ['避难区', 'refuge areas'],
      ['架空层', 'open ground floors'],
      ['室内净高', 'indoor clear height'],
      ['主要功能的房间', 'main functional rooms'],
      ['建筑类型', 'building type'],
      ['更高净高要求', 'higher clear-height requirements'],
      ['消防车道', 'fire lane'],
      ['净宽度', 'clear width'],
      ['净空高度', 'clear height'],
      ['疏散出口', 'egress exit'],
      ['安全出口', 'safety exit'],
      ['防火墙', 'fire wall'],
      ['防火门', 'fire door'],
      ['防火分区', 'fire compartment'],
      ['公共建筑', 'public building'],
      ['住宅建筑', 'residential building'],
      ['建筑高度', 'building height'],
      ['汽车库', 'garage'],
      ['停车场', 'parking lot'],
      ['生活饮用水', 'potable water'],
      ['管道', 'pipe'],
      ['空气间隙', 'air gap'],
      ['出水口', 'outlet'],
      ['外窗', 'external windows'],
      ['幕墙', 'curtain walls'],
      ['遮阳', 'shading'],
      ['采光', 'daylighting'],
      ['通风', 'ventilation'],
      ['排烟', 'smoke exhaust'],
      ['设备用房', 'equipment rooms'],
      ['设备房间', 'equipment rooms'],
      ['设备平台', 'equipment platforms'],
      ['水箱间', 'water-tank rooms'],
      ['生活水箱', 'domestic water tanks'],
      ['生活饮用水池', 'potable-water tanks'],
      ['生活饮用水', 'potable water'],
      ['生活给水系统', 'domestic water-supply system'],
      ['生活排水', 'domestic drainage'],
      ['排水口', 'drain outlet'],
      ['存水弯', 'trap'],
      ['水封', 'water seal'],
      ['地漏', 'floor drain'],
      ['排水沟', 'drainage channel'],
      ['污水管', 'sewer pipe'],
      ['通气管', 'vent pipe'],
      ['污废水', 'wastewater'],
      ['淋浴', 'shower'],
      ['洗衣机', 'washing machine'],
      ['卫生器具', 'sanitary fixtures'],
      ['备用泵', 'standby pump'],
      ['用水点', 'water outlet point'],
      ['超压减压', 'overpressure reduction'],
      ['洗手盆', 'wash basin'],
      ['水嘴', 'faucet'],
      ['景观水体', 'landscape water body'],
      ['亲水', 'water-contact'],
      ['中水', 'reclaimed water'],
      ['回用雨水', 'reused rainwater'],
      ['防回流污染', 'backflow pollution prevention'],
      ['空气间隙', 'air gap'],
      ['倒流防止器', 'backflow preventer'],
      ['有毒有害场所', 'toxic or hazardous spaces'],
      ['非饮用水', 'non-potable water'],
      ['直饮水', 'direct drinking water'],
      ['饮水器', 'drinking fountain'],
      ['开水间', 'boiling-water room'],
      ['冷却塔', 'cooling tower'],
      ['循环冷却水', 'circulating cooling water'],
      ['公共场所', 'public places'],
      ['人员密集公共场所', 'crowded public places'],
      ['无障碍通道', 'accessible route'],
      ['轮椅坡道', 'wheelchair ramp'],
      ['轮椅电梯', 'wheelchair-accessible elevator'],
      ['无障碍电梯', 'accessible elevator'],
      ['无障碍停车位', 'accessible parking space'],
      ['无障碍更衣室', 'accessible changing room'],
      ['无障碍客房', 'accessible guest room'],
      ['可开启窗', 'operable window'],
      ['执手高度', 'handle height'],
      ['呼叫按钮', 'call button'],
      ['回转空间', 'turning space'],
      ['通行净宽', 'clear passage width'],
      ['侧向轮椅通道', 'side wheelchair aisle'],
      ['更衣座椅', 'changing bench'],
      ['墙柱突出物', 'wall or column projections'],
      ['道路红线', 'road red line'],
      ['用地红线', 'land-use red line'],
      ['附属设施', 'ancillary facilities'],
      ['出入口', 'entrance and exit'],
      ['交叉口', 'intersection'],
      ['基地道路', 'site road'],
      ['连接道路', 'connecting road'],
      ['机动车', 'motor vehicle'],
      ['停车场', 'parking lot'],
      ['回车场', 'turnaround area'],
      ['缓冲段', 'buffer section'],
      ['自然坡度', 'natural slope'],
      ['纵坡', 'longitudinal gradient'],
      ['下沉庭院', 'sunken courtyard'],
      ['车库坡道', 'garage ramp'],
      ['截水沟', 'intercepting drain'],
      ['防雨水回流', 'rainwater backflow prevention'],
      ['基本功能空间', 'basic functional spaces'],
      ['厨房', 'kitchen'],
      ['卫生间', 'bathroom'],
      ['起居室', 'living room'],
      ['卧室', 'bedroom'],
      ['前室', 'anteroom'],
      ['主要房间', 'main rooms'],
      ['住宅层高', 'residential storey height'],
      ['坡屋顶', 'pitched roof'],
      ['排水横管', 'horizontal drainage pipe'],
      ['住宅阳台', 'residential balcony'],
      ['儿童攀登', 'children climbing'],
      ['低窗台', 'low windowsill'],
      ['住宅套型', 'dwelling unit type'],
      ['使用面积', 'usable area'],
      ['过道净宽', 'clear corridor width'],
      ['楼梯踏步', 'stair treads'],
      ['凸窗', 'bay window'],
      ['通风构造', 'ventilation detail'],
      ['安全出口数量', 'number of safety exits'],
      ['候梯厅', 'elevator lobby'],
      ['公共走廊', 'public corridor'],
      ['排气道', 'exhaust duct'],
      ['风帽', 'vent cap'],
      ['天然采光', 'natural daylighting'],
      ['自然通风', 'natural ventilation'],
      ['噪声级', 'noise level'],
      ['分户墙', 'party wall'],
      ['楼板隔声', 'floor sound insulation'],
      ['供水压力', 'water-supply pressure'],
      ['燃气压力', 'gas pressure'],
      ['用电负荷', 'electrical load'],
      ['小型车', 'small car'],
      ['车位', 'parking space'],
      ['邻墙尺寸', 'wall-adjacent clearance'],
      ['设计车型尺寸', 'design vehicle dimensions'],
      ['安全余量', 'safety allowance'],
      ['防火设计', 'fire-protection design'],
      ['普通办公室', 'standard office'],
      ['高档办公室', 'premium office'],
      ['照度', 'illuminance'],
      ['加压送风', 'pressurized air supply'],
      ['防烟前室', 'smoke-proof anteroom'],
      ['避难区', 'refuge area'],
      ['余压值', 'residual pressure'],
      ['火灾联动', 'fire linkage'],
      ['防烟分区', 'smoke control zone'],
      ['机械排烟', 'mechanical smoke exhaust'],
      ['竖向分段', 'vertical segmentation'],
      ['排烟防火阀', 'smoke exhaust fire damper'],
      ['关闭温度', 'closing temperature'],
      ['补风', 'make-up air'],
      ['节能运行', 'energy-efficient operation'],
      ['节能', 'energy efficiency'],
      ['可再生能源', 'renewable energy'],
      ['甲类公共建筑', 'Class A public building'],
      ['透光面积比例', 'ratio of translucent roof area'],
      ['供暖空调', 'heating and air-conditioning'],
      ['窗墙比', 'window-to-wall ratio'],
      ['全玻幕墙', 'full glass curtain wall'],
      ['中空玻璃', 'insulating glass'],
      ['夏热冬暖地区', 'hot-summer and warm-winter region'],
      ['空气渗透量', 'air infiltration rate'],
      ['可见光透射比', 'visible light transmittance'],
      ['窗地面积比', 'window-to-floor area ratio'],
      ['自动扶梯', 'escalator'],
      ['修车库', 'repair garage'],
      ['组间距', 'spacing between groups'],
      ['甲乙类物品运输车库', 'garage for Class A/B goods transport vehicles'],
      ['自动灭火系统', 'automatic fire-extinguishing system'],
      ['自然排烟口', 'natural smoke vent'],
      ['最远点距离', 'maximum distance to farthest point'],
      ['排烟风机', 'smoke exhaust fan'],
      ['耐温', 'temperature resistance'],
      ['排烟风速', 'smoke exhaust air velocity']
    ];

    for (const [source, target] of replacements.sort((a, b) => b[0].length - a[0].length)) {
      text = text.replaceAll(source, target);
    }

    return this.translateRemainingTechnicalTerms(text)
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:])/g, '$1')
      .trim();
  }

  private genericTechnicalFallback(value: string): string {
    const numbers = Array.from(value.matchAll(/\d+(?:\.\d+)?\s*(?:m|mm|h|%|MPa|L\/\(㎡·d\)|㎡|级|辆|个|台|间|层|部)?/g))
      .map(match => this.normalizeNumericToken(match[0].replace(/\s+/g, '')))
      .filter(Boolean);

    const numericSuffix = numbers.length ? ` Key value: ${Array.from(new Set(numbers)).join(', ')}.` : '';
    const topic = this.technicalTopicFallback(value);
    return `${topic}.${numericSuffix}`;
  }

  private technicalTopicFallback(value: string): string {
    let text = this.technicalEnglish(value);

    if (this.locale.hasCjk(text)) {
      const replacements: Array<[string, string]> = [
        ['不得', 'not permitted'],
        ['不应', 'shall not'],
        ['不宜', 'should not'],
        ['应', 'shall'],
        ['需', 'requires'],
        ['和', 'and'],
        ['与', 'and'],
        ['及', 'and'],
        ['或', 'or'],
        ['内', 'within'],
        ['外', 'outside'],
        ['上方', 'above'],
        ['下方', 'below'],
        ['周边', 'surrounding'],
        ['控制', 'control'],
        ['设置', 'provision'],
        ['布置', 'layout'],
        ['连接', 'connection'],
        ['接入', 'connection to'],
        ['直连', 'direct connection'],
        ['接纳', 'receive'],
        ['散发', 'release'],
        ['有害气体', 'harmful gases'],
        ['污染源', 'pollution sources'],
        ['水源', 'water source'],
        ['水量', 'water volume'],
        ['漏失', 'leakage'],
        ['未预见', 'unaccounted'],
        ['浇灌', 'irrigation'],
        ['浇洒', 'sprinkling'],
        ['定额', 'quota'],
        ['绿化', 'landscape irrigation'],
        ['道路广场', 'roads and plazas'],
        ['小区', 'residential community'],
        ['学校', 'schools'],
        ['体育建筑', 'sports buildings'],
        ['处理间', 'treatment room'],
        ['布置与进风距离', 'layout and air-inlet distance'],
        ['集水池', 'water collection basin'],
        ['最小淹没深度', 'minimum submerged depth'],
        ['补充水量', 'make-up water volume'],
        ['旁流处理量', 'side-stream treatment volume'],
        ['排水去向', 'drainage destination']
      ];

      for (const [source, target] of replacements.sort((a, b) => b[0].length - a[0].length)) {
        text = text.replaceAll(source, target);
      }
    }

    text = this.translateRemainingTechnicalTerms(text)
      .replace(/[《》]/g, '')
      .replace(/[，。；：、]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text || this.locale.hasCjk(text)) return this.keywordBasedTechnicalFallback(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private translateRemainingTechnicalTerms(value: string): string {
    let text = value;
    const replacements: Array<[string, string]> = [
      ['强制性工程建设规范', 'mandatory engineering construction code'],
      ['现行通用规范', 'current general code'],
      ['正式审查', 'formal review'],
      ['专项论证', 'special technical review'],
      ['地方审查', 'local review'],
      ['地方规划', 'local planning'],
      ['规划条件', 'planning conditions'],
      ['地方技术规定', 'local technical provisions'],
      ['项目所在地', 'project location'],
      ['住宅项目', 'residential projects'],
      ['住宅建筑', 'residential buildings'],
      ['住宅单元', 'residential units'],
      ['住宅套型', 'dwelling unit types'],
      ['住宅套内', 'inside dwelling units'],
      ['住宅', 'residential'],
      ['居住建筑', 'residential buildings'],
      ['居住小区', 'residential communities'],
      ['居住街坊', 'residential neighborhood blocks'],
      ['街坊', 'neighborhood block'],
      ['新区建设项目', 'new development projects'],
      ['新区', 'new district'],
      ['旧区改建项目', 'old-district redevelopment projects'],
      ['旧区', 'old district'],
      ['改建项目', 'redevelopment projects'],
      ['集中绿地', 'central green space'],
      ['绿地面积', 'green-space area'],
      ['绿地', 'green space'],
      ['人均', 'per-capita'],
      ['面积占比', 'area share'],
      ['宽度', 'width'],
      ['长度', 'length'],
      ['高度', 'height'],
      ['深度', 'depth'],
      ['距离', 'distance'],
      ['半径', 'radius'],
      ['净距', 'clear distance'],
      ['净宽', 'clear width'],
      ['净高', 'clear height'],
      ['最小', 'minimum'],
      ['最大', 'maximum'],
      ['平均', 'average'],
      ['总面积', 'total area'],
      ['使用面积', 'usable area'],
      ['建筑面积', 'floor area'],
      ['地面面积', 'floor area'],
      ['屋面面积', 'roof area'],
      ['透光面积', 'translucent area'],
      ['通风开口面积', 'ventilation opening area'],
      ['开口面积', 'opening area'],
      ['短边', 'short side'],
      ['层高', 'storey height'],
      ['层数', 'number of storeys'],
      ['楼层', 'floor'],
      ['每层', 'each floor'],
      ['卧室', 'bedrooms'],
      ['起居室', 'living rooms'],
      ['书房', 'studies'],
      ['餐厅', 'dining rooms'],
      ['厨房', 'kitchens'],
      ['卫生间', 'bathrooms'],
      ['储藏室', 'storage rooms'],
      ['阳台', 'balconies'],
      ['地下室', 'basements'],
      ['半地下室', 'semi-basements'],
      ['坡屋顶', 'pitched roofs'],
      ['屋面', 'roofs'],
      ['上人屋面', 'accessible roofs'],
      ['楼地面', 'floors'],
      ['地坪', 'ground level'],
      ['地面', 'ground'],
      ['室外', 'outdoor'],
      ['室内', 'indoor'],
      ['场地', 'site'],
      ['基地', 'building site'],
      ['道路', 'roads'],
      ['广场', 'plazas'],
      ['车行道', 'vehicle lanes'],
      ['人行道', 'pedestrian paths'],
      ['停车场地', 'parking areas'],
      ['停车场', 'parking areas'],
      ['停车位', 'parking spaces'],
      ['车库', 'garages'],
      ['汽车库', 'garages'],
      ['修车库', 'repair garages'],
      ['自行车库', 'bicycle garages'],
      ['小型车', 'small cars'],
      ['机动车', 'motor vehicles'],
      ['非机动车', 'non-motor vehicles'],
      ['消防车', 'fire trucks'],
      ['消防车道', 'fire lanes'],
      ['消防救援', 'fire rescue'],
      ['消防扑救', 'fire-fighting'],
      ['消防设施', 'fire protection facilities'],
      ['消防水泵房', 'fire pump rooms'],
      ['防火墙', 'fire walls'],
      ['防火门', 'fire doors'],
      ['防火窗', 'fire windows'],
      ['防火分区', 'fire compartments'],
      ['防火分隔', 'fire separation'],
      ['耐火极限', 'fire-resistance rating'],
      ['耐火完整性', 'fire integrity'],
      ['不燃性', 'non-combustible'],
      ['可燃', 'combustible'],
      ['难燃', 'flame-retardant'],
      ['火势', 'fire spread'],
      ['烟火', 'smoke and fire'],
      ['烟气', 'smoke'],
      ['排烟', 'smoke exhaust'],
      ['防烟', 'smoke control'],
      ['补风', 'make-up air'],
      ['疏散', 'egress'],
      ['安全出口', 'safety exits'],
      ['疏散出口', 'egress exits'],
      ['疏散楼梯', 'egress stairs'],
      ['疏散走道', 'egress corridors'],
      ['疏散通道', 'egress passages'],
      ['前室', 'anterooms'],
      ['合用前室', 'shared anterooms'],
      ['封闭楼梯间', 'enclosed stairwells'],
      ['防烟楼梯间', 'smoke-proof stairwells'],
      ['楼梯间', 'stairwells'],
      ['楼梯', 'stairs'],
      ['梯段', 'stair flights'],
      ['踏步', 'treads'],
      ['踏面', 'tread surface'],
      ['扶手', 'handrails'],
      ['栏杆', 'guardrails'],
      ['栏板', 'parapets'],
      ['临空', 'open-edge'],
      ['防坠落', 'fall prevention'],
      ['防滑', 'slip resistance'],
      ['儿童', 'children'],
      ['少年儿童', 'children'],
      ['老年人', 'older adults'],
      ['托儿所', 'nurseries'],
      ['幼儿园', 'kindergartens'],
      ['中小学校', 'primary and secondary schools'],
      ['学校', 'schools'],
      ['公共建筑', 'public buildings'],
      ['公共空间', 'public spaces'],
      ['公共卫生间', 'public toilets'],
      ['公共场所', 'public places'],
      ['公共走廊', 'public corridors'],
      ['公共走道', 'public corridors'],
      ['过道', 'passageways'],
      ['走廊', 'corridors'],
      ['通道', 'routes'],
      ['出入口', 'entrances and exits'],
      ['入口', 'entrances'],
      ['出口', 'exits'],
      ['主要功能', 'main function'],
      ['主要房间', 'main rooms'],
      ['主要使用房间', 'main usable rooms'],
      ['房间', 'rooms'],
      ['功能空间', 'functional spaces'],
      ['设备用房', 'equipment rooms'],
      ['设备平台', 'equipment platforms'],
      ['设备', 'equipment'],
      ['检修', 'maintenance'],
      ['水泵机组', 'pump units'],
      ['备用泵', 'standby pumps'],
      ['供水能力', 'water-supply capacity'],
      ['生活饮用水', 'potable water'],
      ['生活给水', 'domestic water supply'],
      ['给水', 'water supply'],
      ['排水', 'drainage'],
      ['污水', 'sewage'],
      ['废水', 'wastewater'],
      ['雨水', 'rainwater'],
      ['中水', 'reclaimed water'],
      ['回用雨水', 'reused rainwater'],
      ['非饮用水', 'non-potable water'],
      ['直饮水', 'direct drinking water'],
      ['管道', 'pipes'],
      ['管网', 'pipe network'],
      ['水池', 'water tanks'],
      ['水箱', 'water tanks'],
      ['贮水池', 'storage tanks'],
      ['出水口', 'outlet'],
      ['进水管口', 'inlet pipe opening'],
      ['空气间隙', 'air gap'],
      ['溢流边缘', 'overflow rim'],
      ['倒流防止器', 'backflow preventer'],
      ['防回流', 'backflow prevention'],
      ['污染源', 'pollution sources'],
      ['水嘴', 'faucets'],
      ['洗手盆', 'wash basins'],
      ['小便器', 'urinals'],
      ['大便器', 'toilets'],
      ['地漏', 'floor drains'],
      ['冷却塔', 'cooling towers'],
      ['循环冷却水', 'circulating cooling water'],
      ['旁流处理', 'side-stream treatment'],
      ['过滤', 'filtration'],
      ['悬浮物', 'suspended solids'],
      ['空调', 'air conditioning'],
      ['供暖', 'heating'],
      ['通风', 'ventilation'],
      ['自然通风', 'natural ventilation'],
      ['采光', 'daylighting'],
      ['天然采光', 'natural daylighting'],
      ['日照', 'sunlight'],
      ['外窗', 'external windows'],
      ['窗台', 'windowsills'],
      ['窗扇', 'window sashes'],
      ['幕墙', 'curtain walls'],
      ['全玻幕墙', 'full glass curtain walls'],
      ['遮阳', 'shading'],
      ['建筑遮阳系数', 'building shading coefficient'],
      ['窗墙面积比', 'window-to-wall area ratio'],
      ['窗地面积比', 'window-to-floor area ratio'],
      ['传热系数', 'heat transfer coefficient'],
      ['可见光透射比', 'visible light transmittance'],
      ['空气渗透量', 'air infiltration rate'],
      ['节能运行', 'energy-saving operation'],
      ['节能', 'energy efficiency'],
      ['可再生能源', 'renewable energy'],
      ['照明', 'lighting'],
      ['照度', 'illuminance'],
      ['应急照明', 'emergency lighting'],
      ['电梯', 'elevators'],
      ['自动扶梯', 'escalators'],
      ['自动人行步道', 'moving walks'],
      ['群控', 'group control'],
      ['燃气', 'gas'],
      ['隔声', 'sound insulation'],
      ['噪声', 'noise'],
      ['声环境', 'acoustic environment'],
      ['无障碍', 'accessible'],
      ['轮椅', 'wheelchair'],
      ['坡道', 'ramps'],
      ['盲道', 'tactile paving'],
      ['低位服务设施', 'low-position service facilities'],
      ['客房', 'guest rooms'],
      ['更衣室', 'changing rooms'],
      ['更衣座椅', 'changing benches'],
      ['呼叫按钮', 'call buttons'],
      ['回转空间', 'turning space'],
      ['可踏部位', 'climbable surfaces'],
      ['突出物', 'projections'],
      ['边缘', 'edge'],
      ['上方', 'above'],
      ['下方', 'below'],
      ['周围', 'around'],
      ['之间', 'between'],
      ['以内', 'within'],
      ['以上', 'or above'],
      ['以下', 'or below'],
      ['不低于', 'shall be no less than'],
      ['不小于', 'shall be no less than'],
      ['不大于', 'shall not exceed'],
      ['不超过', 'shall not exceed'],
      ['不宜小于', 'should be no less than'],
      ['不宜大于', 'should not exceed'],
      ['不少于', 'shall be at least'],
      ['不得', 'must not'],
      ['严禁', 'is strictly prohibited from'],
      ['必须', 'must'],
      ['应当', 'shall'],
      ['应', 'shall'],
      ['宜', 'should'],
      ['可', 'may'],
      ['并', 'and'],
      ['且', 'and'],
      ['与', 'and'],
      ['和', 'and'],
      ['或', 'or'],
      ['等', 'etc.'],
      ['第', 'Clause '],
      ['条', ''],
      ['类', 'Class '],
    ];

    for (const [source, target] of replacements.sort((a, b) => b[0].length - a[0].length)) {
      text = text.replaceAll(source, target);
    }

    return text;
  }

  private keywordBasedTechnicalFallback(value: string): string {
    const lowered = value;
    if (/楼梯|梯段|踏步|平台|楼梯间/.test(lowered)) return 'Stair and landing requirement';
    if (/栏杆|临空|防护|防坠|凸窗|外窗/.test(lowered)) return 'Guardrail and fall-protection requirement';
    if (/净高|层高|高度/.test(lowered)) return 'Clear-height requirement';
    if (/红线|退界|突出/.test(lowered)) return 'Boundary and setback requirement';
    if (/住宅|卧室|厨房|卫生间|阳台|起居室/.test(lowered)) return 'Residential design requirement';
    if (/消防|防火|疏散|排烟|防烟|车库/.test(lowered)) return 'Fire safety requirement';
    if (/给水|排水|饮用水|水箱|水池|管道|冷却塔/.test(lowered)) return 'Water supply and drainage requirement';
    if (/无障碍|轮椅|坡道|扶手/.test(lowered)) return 'Accessible design requirement';
    if (/节能|遮阳|幕墙|通风|采光|照明/.test(lowered)) return 'Environmental performance requirement';
    if (/场地|道路|出入口|停车/.test(lowered)) return 'Site planning requirement';
    return 'Architectural design requirement';
  }

  private normalizeNumericToken(value: string): string {
    return value
      .replace(/级/g, ' steps')
      .replace(/个/g, ' item(s)')
      .replace(/辆/g, ' vehicle(s)')
      .replace(/台/g, ' unit(s)')
      .replace(/间/g, ' room(s)')
      .replace(/层/g, ' floor(s)')
      .replace(/部/g, ' stair(s)')
      .replace(/㎡/g, ' sq m')
      .replace(/\s+/g, ' ')
      .trim();
  }

  @HostListener('document:click')
  closeStandardDropdown() {
    if (this.standardDropdownOpen()) this.standardDropdownOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  closeStandardDropdownOnEscape() {
    if (this.standardDropdownOpen()) this.standardDropdownOpen.set(false);
  }

  async copyClause(result: ClauseResult) {
    const { standard, clause } = result;
    const text = `${standard.code} 第 ${clause.clauseNo} 条：${clause.requirement} 适用：${clause.appliesTo} 来源：${clause.sourceUrl} 核验日期：${clause.verifiedAt}`;
    try {
      await navigator.clipboard.writeText(text);
      this.dataService.displayToast('条文要点已复制');
    } catch {
      this.dataService.displayToast('复制失败，请手动选择内容');
    }
  }

  isClauseFavorite(result: ClauseResult): boolean {
    return this.dataService.favoriteItems().some(item => item.kind === 'standard' && item.id === result.clause.id);
  }

  toggleClauseFavorite(result: ClauseResult) {
    const wasFavorite = this.isClauseFavorite(result);
    this.dataService.toggleFavoriteItem('standard', result.clause.id);
    this.dataService.displayToast(wasFavorite ? '已取消收藏' : '条文已收藏');
  }

  hasClauseNote(result: ClauseResult): boolean {
    return this.dataService.hasStandardClauseNote(result.clause.id);
  }

  clauseNote(result: ClauseResult): string {
    return this.dataService.getStandardClauseNote(result.clause.id);
  }

  openNoteEditor(result: ClauseResult) {
    this.noteEditingClauseId.set(result.clause.id);
    this.noteDraft.set(this.clauseNote(result));
  }

  cancelNoteEditor() {
    this.noteEditingClauseId.set(null);
    this.noteDraft.set('');
  }

  saveNote(result: ClauseResult) {
    this.dataService.setStandardClauseNote(result.clause.id, this.noteDraft());
    this.noteEditingClauseId.set(null);
    this.noteDraft.set('');
    this.dataService.displayToast('条文笔记已保存，可前往用户中心查看');
  }

  openFeedback(result: ClauseResult) {
    this.feedbackTarget.set(result);
    this.feedbackType.set('条文数值可能有误');
    this.feedbackDescription.set('');
    this.feedbackSuggestion.set('');
    this.feedbackSource.set('');
    this.showFeedbackModal.set(true);
  }

  closeFeedback() {
    this.showFeedbackModal.set(false);
    this.feedbackTarget.set(null);
  }

  feedbackTargetLabel(): string {
    const target = this.feedbackTarget();
    if (!target) return '';
    return `${target.standard.code} ${target.standard.title} 第 ${target.clause.clauseNo} 条`;
  }

  async submitFeedback() {
    const target = this.feedbackTarget();
    if (!target) return;
    const body = [
      'ARCHIPEDIA 规范条文纠错',
      '',
      `规范：${target.standard.code} ${target.standard.title}`,
      `条文：第 ${target.clause.clauseNo} 条 ${target.clause.title}`,
      `条文 ID：${target.clause.id}`,
      `页面：${window.location.href}`,
      '',
      `问题类型：${this.feedbackType()}`,
      `问题说明：${this.feedbackDescription() || '未填写'}`,
      `建议改法：${this.feedbackSuggestion() || '未填写'}`,
      `参考来源：${this.feedbackSource() || '未填写'}`,
      '',
      `当前适用场景：${target.clause.appliesTo}`,
      `当前具体要求：${target.clause.requirement}`,
      `当前来源：${target.clause.sourceUrl}`
    ].join('\n');
    const subject = `[Archipedia 规范纠错] ${target.standard.code} 第 ${target.clause.clauseNo} 条`;
    const mailto = `mailto:tektonjason@163.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      window.location.href = mailto;
      this.dataService.displayToast('已打开邮件客户端');
    } catch {
      try {
        await navigator.clipboard.writeText(body);
        this.dataService.displayToast('无法打开邮件客户端，纠错内容已复制');
      } catch {
        this.dataService.displayToast('无法打开邮件客户端，请手动复制纠错内容');
      }
    } finally {
      this.closeFeedback();
    }
  }

  private normalizedQuery(): string {
    return this.normalizeText(this.searchQuery());
  }

  private normalizedQueryTokens(): string[] {
    const raw = this.searchQuery().trim();
    if (!raw) return [];

    const tokens = raw.match(/[\u4e00-\u9fa5]+|[a-zA-Z0-9.:%]+/g) ?? [];
    return Array.from(new Set(
      tokens
        .map(token => this.normalizeText(token))
        .filter(token => token.length > 0)
    ));
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .replace(/(\d+)\.0+(?=\D|$)/g, '$1')
      .replace(/[\s,，。；;：:、/\\|()[\]（）【】《》"'“”‘’\-—_]+/g, '');
  }

  private clauseHaystack(result: ClauseResult): string {
    const { standard, clause } = result;
    return [
      standard.title,
      standard.code,
      standard.category,
      clause.standardTitle,
      clause.standardCode,
      clause.clauseNo,
      clause.category,
      this.categoryGroup(clause.category),
      clause.title,
      clause.appliesTo,
      clause.requirement,
      clause.note,
      clause.sourceName,
      ...clause.numericValues,
      ...clause.keywords,
      ...standard.keywords,
      ...standard.useCases
    ].join(' ');
  }
}
