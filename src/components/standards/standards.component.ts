import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService, StandardClause, StandardQuickRef } from '../../services/data.service';
import { AnimatedSearchBarComponent } from '../shared/animated-search-bar.component';
import { APP_UI_ICONS } from '../shared/ui-icons';
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
  imports: [AnimatedSearchBarComponent, GsapCardHoverDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page-scroll ui-page-pad text-white">
      <div class="ui-page-header">
        <h1 class="ui-title">规范速查</h1>
        <p class="ui-subtitle">常用建筑设计国标条文、关键数值与官方来源速查</p>
        <div class="relative mt-5 flex h-12 w-full max-w-xl justify-center">
          <app-animated-search-bar
            [query]="searchQuery()"
            (queryChange)="searchQuery.set($event)"
            placeholder="搜索 消防车道4m、坡道1:12、栏杆1.10m、日照、车库净高..."
          ></app-animated-search-bar>
        </div>
      </div>

      <section class="ui-notice-info mb-4 shrink-0">
        <div class="ui-notice-title">
          <svg lucideInfo class="h-4 w-4 shrink-0" [strokeWidth]="2"></svg>
          使用说明
        </div>
        <p class="ui-notice-text">
          用于方案初查，可按关键词、类别或规范来源定位常用条文；涉及地方规定、专项论证或审图意见时，以正式文本为准。
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
              {{ category }}
            </button>
          }
        </div>
      </div>

      <div class="mb-5 flex shrink-0">
        <div class="relative w-full max-w-xl" (click)="$event.stopPropagation()">
          <div class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">规范来源</div>
          <button
            type="button"
            (click)="toggleStandardDropdown($event)"
            class="group flex min-h-12 w-full items-center justify-between gap-3 rounded-card border border-line bg-surface-raised/90 px-3 text-left shadow-sm outline-none transition-all hover:border-blue-300/35 hover:bg-white/[0.05] focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/20"
            [attr.aria-expanded]="standardDropdownOpen()"
            aria-haspopup="listbox"
            aria-label="选择规范来源"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span class="shrink-0 rounded-control border border-blue-300/15 bg-blue-500/10 px-2.5 py-1 font-mono text-[11px] font-black text-blue-200">
                {{ standardOptionCode(selectedStandardOption()) }}
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm font-bold text-gray-100">{{ optionLabelTitle(selectedStandardOption()) }}</span>
                <span class="mt-0.5 block text-[11px] text-gray-500">已收录 {{ selectedStandardClauseCount() }} 条常用条文</span>
              </span>
            </span>
            <span class="flex shrink-0 items-center gap-2">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-control border border-white/10 bg-white/5 text-gray-400 transition-all group-hover:text-white"
                [class.rotate-180]="standardDropdownOpen()"
              >
                <svg lucideChevronDown class="h-4 w-4" [strokeWidth]="2"></svg>
              </span>
            </span>
          </button>

          @if (standardDropdownOpen()) {
            <div class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-card border border-blue-400/20 bg-[#17181d]/95 shadow-panel backdrop-blur-xl">
              <div class="max-h-80 overflow-y-auto p-2 custom-scrollbar" role="listbox" aria-label="选择规范来源">
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
                        <span class="block truncate text-sm font-semibold">{{ optionLabelTitle(option) }}</span>
                        <span class="mt-0.5 block text-[11px] text-gray-500">{{ clauseCountForStandard(option.value) }} 条常用条文</span>
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
          <h2 class="text-2xl font-black text-white">常用条文</h2>
          <p class="mt-1 text-sm text-gray-500">共 {{ filteredClauses().length }} 条匹配结果</p>
        </div>
        <button type="button" class="ui-btn-secondary px-3 py-2 text-xs" (click)="clearFilters()">
          清除筛选
        </button>
      </div>

      @if (filteredClauses().length === 0) {
        <div class="ui-empty-state h-64">
          <div class="ui-empty-icon"><svg lucideSearch class="h-8 w-8" [strokeWidth]="1.8"></svg></div>
          <p class="font-medium">没有找到匹配的条文</p>
          <p class="mt-1 text-sm text-gray-500">换一个关键词，或直接打开对应官方来源检索完整规范。</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          @for (result of filteredClauses(); track result.clause.id) {
            <article class="ui-card ui-card-hover overflow-hidden p-0" appGsapCardHover>
              <div class="border-b border-white/10 bg-white/[0.025] p-3">
                <div class="mb-2 flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span class="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-300">{{ categoryGroup(result.clause.category) }}</span>
                      <span class="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-gray-400">{{ result.clause.category }}</span>
                      <span class="font-mono text-[11px] text-gray-500">{{ result.standard.code }}</span>
                      <span class="hidden text-[11px] text-gray-600 sm:inline">·</span>
                      <span class="hidden max-w-[14rem] truncate text-[11px] text-gray-500 sm:inline">{{ result.standard.title }}</span>
                      <span class="font-mono text-[11px] text-gray-500">第 {{ result.clause.clauseNo }} 条</span>
                    </div>
                    <h3 class="text-[15px] font-black leading-snug text-white md:text-base">{{ result.clause.title }}</h3>
                  </div>
                  <div class="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      (click)="toggleClauseFavorite(result)"
                      class="ui-icon-btn h-9 w-9"
                      [class.text-yellow-300]="isClauseFavorite(result)"
                      [title]="isClauseFavorite(result) ? '取消收藏' : '收藏条文'"
                      [attr.aria-label]="isClauseFavorite(result) ? '取消收藏' : '收藏条文'"
                    >
                      <svg lucideStar class="h-4 w-4" [strokeWidth]="2" [attr.fill]="isClauseFavorite(result) ? 'currentColor' : 'none'"></svg>
                    </button>
                    <button
                      type="button"
                      (click)="openNoteEditor(result)"
                      class="ui-icon-btn h-9 w-9"
                      [class.text-blue-300]="hasClauseNote(result)"
                      title="条文笔记"
                      aria-label="条文笔记"
                    >
                      <svg lucideStickyNote class="h-4 w-4" [strokeWidth]="2"></svg>
                    </button>
                    <button
                      type="button"
                      (click)="copyClause(result)"
                      class="ui-icon-btn h-9 w-9"
                      title="复制条文要点"
                      aria-label="复制条文要点"
                    >
                      <svg lucideCopy class="h-4 w-4" [strokeWidth]="2"></svg>
                    </button>
                    <button
                      type="button"
                      (click)="openFeedback(result)"
                      class="ui-icon-btn h-9 w-9"
                      title="内容纠错"
                      aria-label="内容纠错"
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
                        {{ value }}
                      </button>
                    }
                  </div>
                }
              </div>

              <details class="group md:hidden">
                <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-bold text-blue-200">
                  <span>查看适用场景与具体要求</span>
                  <span class="text-gray-500 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div class="space-y-2 px-3 pb-3">
                  <div class="rounded-control border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div class="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">适用场景</div>
                    <p class="text-[13px] leading-relaxed text-gray-300">{{ result.clause.appliesTo }}</p>
                  </div>
                  <div class="rounded-control border border-white/10 bg-black/20 px-3 py-2">
                    <div class="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">具体要求</div>
                    <p class="text-[13px] leading-relaxed text-gray-200">{{ result.clause.requirement }}</p>
                  </div>
                  @if (result.clause.note) {
                    <p class="rounded-control border border-amber-400/15 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/80">
                      {{ result.clause.note }}
                    </p>
                  }
                </div>
              </details>

              <div class="hidden space-y-2 p-3 md:block">
                <div class="rounded-control border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div class="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">适用场景</div>
                  <p class="text-[13px] leading-relaxed text-gray-300">{{ result.clause.appliesTo }}</p>
                </div>
                <div class="rounded-control border border-white/10 bg-black/20 px-3 py-2">
                  <div class="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">具体要求</div>
                  <p class="text-[13px] leading-relaxed text-gray-200">{{ result.clause.requirement }}</p>
                </div>
                @if (result.clause.note) {
                  <p class="rounded-control border border-amber-400/15 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/80">
                    {{ result.clause.note }}
                  </p>
                }
              </div>

              <div class="px-3 pb-3">
                @if (noteEditingClauseId() === result.clause.id) {
                  <div class="mb-3 rounded-control border border-blue-400/20 bg-blue-500/10 p-3">
                    <label class="mb-2 block text-xs font-bold text-blue-200">我的笔记</label>
                    <textarea
                      class="ui-field min-h-24 resize-y bg-black/25 text-sm"
                      [value]="noteDraft()"
                      (input)="noteDraft.set($any($event.target).value)"
                      placeholder="记录审图提示、项目适用条件、个人理解..."
                    ></textarea>
                    <div class="mt-2 flex justify-end gap-2">
                      <button type="button" class="ui-btn-secondary px-3 py-1.5 text-xs" (click)="cancelNoteEditor()">取消</button>
                      <button type="button" class="ui-btn-primary px-3 py-1.5 text-xs" (click)="saveNote(result)">保存笔记</button>
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
                      我的笔记
                    </span>
                    {{ clauseNote(result) }}
                  </button>
                }

                <div class="mb-2 flex flex-wrap gap-1.5">
                  @for (keyword of result.clause.keywords; track keyword) {
                    <button type="button" (click)="searchQuery.set(keyword)" class="rounded bg-white/5 px-2 py-0.5 text-[11px] text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-200">#{{ keyword }}</button>
                  }
                </div>

                <div class="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    (click)="dataService.openExternalModal(result.clause.sourceUrl)"
                    class="ui-btn-secondary gap-2 px-3 py-2 text-xs"
                  >
                    <svg lucideExternalLink class="h-4 w-4" [strokeWidth]="2"></svg>
                    {{ result.clause.sourceName }}
                  </button>
                  <span class="ml-auto text-xs text-gray-600">核验 {{ result.clause.verifiedAt }}</span>
                </div>
              </div>
            </article>
          }
        </div>
      }

      @if (showFeedbackModal()) {
        <div class="ui-modal-shell">
          <div class="ui-modal-backdrop" (click)="closeFeedback()"></div>
          <div class="ui-modal-panel max-w-xl overflow-hidden">
            <div class="ui-modal-header">
              <div>
                <h3 class="text-lg font-black text-white">规范条文纠错</h3>
                <p class="mt-1 text-xs text-gray-500">{{ feedbackTargetLabel() }}</p>
              </div>
              <button type="button" class="ui-icon-btn" (click)="closeFeedback()" aria-label="关闭">
                <svg lucideX class="h-5 w-5" [strokeWidth]="2"></svg>
              </button>
            </div>
            <div class="ui-modal-body space-y-4">
              <div>
                <label class="ui-label">问题类型</label>
                <select class="ui-field" [value]="feedbackType()" (change)="feedbackType.set($any($event.target).value)">
                  <option value="条文数值可能有误">条文数值可能有误</option>
                  <option value="适用场景不准确">适用场景不准确</option>
                  <option value="来源或条文号有误">来源或条文号有误</option>
                  <option value="表述需要优化">表述需要优化</option>
                </select>
              </div>
              <div>
                <label class="ui-label">问题说明</label>
                <textarea class="ui-field min-h-24 resize-y" [value]="feedbackDescription()" (input)="feedbackDescription.set($any($event.target).value)" placeholder="请说明你发现的问题"></textarea>
              </div>
              <div>
                <label class="ui-label">建议改法</label>
                <textarea class="ui-field min-h-20 resize-y" [value]="feedbackSuggestion()" (input)="feedbackSuggestion.set($any($event.target).value)" placeholder="可填写建议替换的条文、数值或表述"></textarea>
              </div>
              <div>
                <label class="ui-label">参考来源</label>
                <input class="ui-field" [value]="feedbackSource()" (input)="feedbackSource.set($any($event.target).value)" placeholder="规范截图、官方链接、页码等">
              </div>
              <div class="flex justify-end gap-3 border-t border-line pt-4">
                <button type="button" class="ui-btn-secondary" (click)="closeFeedback()">取消</button>
                <button type="button" class="ui-btn-primary" (click)="submitFeedback()">生成邮件</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class StandardsComponent {
  dataService = inject(DataService);
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

  standardOptionCode(option: StandardOption): string {
    if (option.value === '全部规范') return 'ALL';
    return option.value.replace(/\s+/g, ' ');
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
