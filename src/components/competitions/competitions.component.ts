import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService, Competition } from '../../services/data.service';
import { LocaleService } from '../../services/locale.service';
import { GsapHoverTooltipDirective } from '../shared/gsap-hover-tooltip.directive';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';
import { APP_UI_ICONS } from '../shared/ui-icons';

const COMPETITION_NAME_TRANSLATIONS: Record<string, string> = {};

@Component({
  selector: 'app-competitions',
  standalone: true,
  imports: [CommonModule, RouterModule, GsapHoverTooltipDirective, GsapCardHoverDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page ui-page-pad text-white">
      
      <!-- Header Section -->
      <div class="ui-page-header">
        <h1 class="ui-title">{{ displayText('竞赛合集') }}</h1>
        <p class="ui-subtitle">
          {{ displayText('汇集全球建筑设计竞赛资讯') }}
        </p>

        <!-- View Toggle (Centered below title) -->
        <div class="mt-4 flex bg-surface rounded-card border border-line p-1 shrink-0">
          <button 
            (click)="switchView('grid')"
            class="p-2 rounded-lg transition-colors"
            [class.bg-white/10]="viewMode() === 'grid'"
            [class.text-white]="viewMode() === 'grid'"
            [class.text-gray-500]="viewMode() !== 'grid'"
            [class.hover:text-gray-300]="viewMode() !== 'grid'"
            [appGsapTooltip]="displayText('网格视图')"
            [hoverScale]="1.15"
          >
            <svg lucideLayoutGrid class="w-5 h-5" [strokeWidth]="2"></svg>
          </button>
          <button 
            (click)="switchView('calendar')"
            class="p-2 rounded-lg transition-colors"
            [class.bg-white/10]="viewMode() === 'calendar'"
            [class.text-white]="viewMode() === 'calendar'"
            [class.text-gray-500]="viewMode() !== 'calendar'"
            [class.hover:text-gray-300]="viewMode() !== 'calendar'"
            [appGsapTooltip]="displayText('日历视图')"
            [hoverScale]="1.15"
          >
            <svg lucideCalendarDays class="w-5 h-5" [strokeWidth]="2"></svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 py-2 md:-mx-3 md:px-3">

        <!-- Disclaimer & Useful Links -->
        <div class="mb-8 space-y-4 max-w-5xl mx-auto">
          <!-- Disclaimer -->
          <div *ngIf="showDisclaimer()" class="ui-notice-info group flex items-center gap-3 pr-2 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">
            <svg lucideInfo class="h-4 w-4 shrink-0 text-blue-300" [strokeWidth]="2"></svg>
            <p class="ui-notice-text flex-1">{{ displayText('相关竞赛的信息整理于2026年1月，实际情况可能与本页面内容不同，请以官方文件或学校通知为准。') }}</p>
            <button (click)="showDisclaimer.set(false)" class="text-blue-200/50 hover:text-blue-200 transition-colors p-1 rounded hover:bg-blue-500/10 shrink-0 flex items-center justify-center">
              <svg lucideX class="w-4 h-4" [strokeWidth]="2"></svg>
            </button>
          </div>

          <!-- Useful Links -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Official Libraries -->
            <div class="ui-card p-4">
              <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                {{ displayText('官方竞赛库') }}
              </h3>
              <div class="flex flex-wrap gap-2">
                <a (click)="dataService.openExternalModal('https://www.bing.com/search?q=%E5%85%A8%E5%9B%BD%E5%A4%A7%E5%AD%A6%E7%94%9F%E5%AD%A6%E7%A7%91%E7%AB%9E%E8%B5%9B%E7%9B%AE%E5%BD%95')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">{{ displayText('全国大学生学科竞赛目录') }}</a>
                <a (click)="dataService.openExternalModal('https://www.bing.com/search?q=%E6%9F%90%E6%9F%90%E5%A4%A7%E5%AD%A6%E5%AD%A6%E7%A7%91%E7%AB%9E%E8%B5%9B%E7%9B%AE%E5%BD%95')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">{{ displayText('学校学科竞赛库') }}</a>
              </div>
            </div>

            <!-- Info Websites -->
            <div class="ui-card p-4">
              <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                {{ displayText('竞赛信息查询') }}
              </h3>
              <div class="flex flex-wrap gap-2">
                <a (click)="dataService.openExternalModal('https://www.shejijingsai.com/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">{{ displayText('设计竞赛网') }}</a>
                <a (click)="dataService.openExternalModal('https://www.archdaily.com/search/competitions')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">ArchDaily</a>
                <a (click)="dataService.openExternalModal('https://architecturecompetitions.com/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">Buildner</a>
                <a (click)="dataService.openExternalModal('https://www.archrace.com/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">ArchRace</a>
                <a (click)="dataService.openExternalModal('https://www.dezeen.com/competitions/type/architecture/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">Dezeen</a>
                <a (click)="dataService.openExternalModal('https://competitions.archi/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out">Competitions.archi</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="view-transition-wrapper" [class.switching]="isSwitching()">
          <!-- Loading / Empty State -->
          <div *ngIf="sortedCompetitions().length === 0" class="ui-empty-state h-64">
            <div class="ui-empty-icon"><svg lucideTrophy class="w-8 h-8" [strokeWidth]="1.8"></svg></div>
            <p>{{ displayText('暂无竞赛数据') }}</p>
          </div>

          <!-- Grid View -->
          <div *ngIf="viewMode() === 'grid' && sortedCompetitions().length > 0" class="grid grid-cols-1 gap-4 pb-20 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <button type="button" *ngFor="let comp of sortedCompetitions()" (click)="dataService.openExternalModal(comp.url)" class="ui-card ui-card-hover ui-long-list-item p-3 md:p-5 group flex flex-col h-full relative cursor-pointer text-left" appGsapCardHover>
              <div class="flex items-start justify-between mb-2 md:mb-3">
                <span [class]="getLevelClass(comp.level)">
                  {{ displayCompetitionLevel(comp.level) }}
                </span>
                <span class="text-xs text-gray-500 font-mono" *ngIf="comp.month">
                  {{ displayMonth(comp.month) }}
                </span>
              </div>
              
              <h3 class="text-base md:text-lg font-bold text-gray-200 mb-1 md:mb-2 leading-tight group-hover:text-blue-400 transition-colors">
                {{ displayCompetitionName(comp) }}
              </h3>
              
              <div class="text-xs text-gray-500 mb-2 md:mb-4 line-clamp-2">
                {{ displayText('主办') }}: {{ displayOrganizer(comp.organizer) }}
              </div>

              <div class="mt-auto pt-2 md:pt-4 border-t border-white/5 flex flex-col gap-2">
                <div class="flex items-center justify-between text-xs" *ngIf="comp.type && !comp.type.includes('忽略级别')">
                  <span class="text-gray-500">{{ displayText('类型') }}</span>
                  <span class="text-gray-300">{{ displayCompetitionType(comp.type) }}</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-500">{{ displayText('截止') }}</span>
                  <span class="text-gray-300">{{ displayDeadline(comp.deadline) }}</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-2" *ngIf="comp.note">
                  <span [class]="getNoteClass(comp.note)">
                    {{ displayNote(comp.note) }}
                  </span>
                </div>
              </div>
            </button>
          </div>

          <!-- Calendar View -->
          <div *ngIf="viewMode() === 'calendar' && sortedCompetitions().length > 0" class="flex flex-col gap-8 pb-20">
            <div class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              <div *ngFor="let m of months" 
                class="aspect-[3/4] md:aspect-square bg-surface border rounded-card p-3 md:p-5 relative cursor-pointer transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-fast ease-ui-out hover:border-line-strong group flex flex-col overflow-hidden"
                appGsapCardHover
                [class.border-white_20]="selectedMonth() === m"
                [class.bg-white_5]="selectedMonth() === m"
                [class.border-white_5]="selectedMonth() !== m"
                (click)="selectMonth(m)"
              >
                <!-- Month Header -->
                <div class="flex flex-col mb-2 md:mb-4 shrink-0 relative z-10">
                  <div class="flex items-center justify-between">
                    <div class="text-4xl md:text-6xl font-bold text-white/10 group-hover:text-white/20 transition-colors leading-none tracking-tighter">{{ m | number:'2.0-0' }}</div>
                    <div class="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 md:mt-2">{{ getMonthName(m) }}</div>
                  </div>
                </div>

                <!-- Competition List (Preview) -->
                <div class="flex-1 overflow-hidden flex flex-col gap-1 md:gap-2 relative z-10">
                  <ng-container *ngFor="let c of getCompetitionsByMonth(m); let i = index">
                    <!-- Show up to 7 items, or 6 if there are more than 7 -->
                    <div *ngIf="i < 7" class="text-[10px] md:text-xs text-gray-400 truncate hover:text-white transition-colors flex items-center gap-1.5 md:gap-2 group/item">
                      <span class="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover/item:scale-125" 
                        [class.bg-blue-500]="c.level.includes('国际')"
                        [class.bg-amber-500]="c.level.includes('国家')"
                        [class.bg-emerald-500]="!c.level.includes('国际') && !c.level.includes('国家')"
                      ></span>
                      <span class="truncate">{{ displayCompetitionName(c) }}</span>
                    </div>
                  </ng-container>
                  
                  <!-- More Indicator -->
                  <div *ngIf="getCountByMonth(m) > 7" class="text-[10px] text-gray-600 mt-auto pt-2 border-t border-white/5 flex items-center gap-1">
                    <span>{{ displayText('还有') }} {{ getCountByMonth(m) - 7 }} {{ displayText('个竞赛') }}</span>
                    <svg lucideChevronDown class="w-3 h-3" [strokeWidth]="2"></svg>
                  </div>
                  
                  <!-- Empty State -->
                  <div *ngIf="getCountByMonth(m) === 0" class="flex-1 flex items-center justify-center text-[10px] md:text-xs text-gray-700 italic">
                    {{ displayText('本月暂无赛事') }}
                  </div>
                </div>
                
                <!-- Indicator dot if active -->
                <div *ngIf="selectedMonth() === m" class="absolute top-5 right-5 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20"></div>
              </div>
            </div>

            <!-- Month Detail Section -->
            <div id="month-detail" *ngIf="selectedMonth() as sm" class="animate-[fadeIn_0.3s_ease-out] scroll-mt-24">
              <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span class="text-4xl text-white/20">{{ sm | number:'2.0-0' }}</span>
                <span>{{ displayMonth(sm) }} {{ displayText('月竞赛详情') }}</span>
              </h2>
              
              <div class="grid grid-cols-1 gap-3">
                 <button type="button" *ngFor="let comp of getCompetitionsByMonth(sm)" (click)="dataService.openExternalModal(comp.url)" class="ui-card ui-card-hover rounded-control p-4 flex flex-col md:flex-row gap-4 items-start md:items-center group cursor-pointer text-left" appGsapCardHover>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3 mb-1">
                        <span [class]="getLevelClass(comp.level)">
                          {{ displayCompetitionLevel(comp.level) }}
                        </span>
                        <span class="text-xs text-gray-500" *ngIf="comp.type && !comp.type.includes('忽略级别')">{{ displayCompetitionType(comp.type) }}</span>
                      </div>
                      <h3 class="text-base font-bold text-gray-200 group-hover:text-white transition-colors line-clamp-2">
                        {{ displayCompetitionName(comp) }}
                      </h3>
                      <p class="text-xs text-gray-500 line-clamp-2">{{ displayText('主办') }}: {{ displayOrganizer(comp.organizer) }}</p>
                    </div>
                    
                    <div class="flex flex-col items-end shrink-0 gap-1">
                       <span class="text-xs font-mono text-gray-400">{{ displayText('截止') }}: {{ displayDeadline(comp.deadline) }}</span>
                       <span *ngIf="comp.note" [class]="getNoteClass(comp.note)">{{ displayNote(comp.note) }}</span>
                    </div>
                 </button>
                 
                 <div *ngIf="getCompetitionsByMonth(sm).length === 0" class="p-8 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                   {{ displayText('本月暂无收录竞赛') }}
                 </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
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
    
    /* View Switching Animation */
    .view-transition-wrapper {
      transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 1;
      transform: scale(1);
      transform-origin: top center;
    }
    .view-transition-wrapper.switching {
      opacity: 0;
      transform: translateY(4px) scale(0.985);
    }
    @media (prefers-reduced-motion: reduce) {
      .view-transition-wrapper {
        transition-duration: 0.01ms;
      }
    }
  `]
})
export class CompetitionsComponent implements OnDestroy {
  dataService = inject(DataService);
  locale = inject(LocaleService);
  viewMode = signal<'grid' | 'calendar'>('grid');
  isSwitching = signal(false);
  showDisclaimer = signal(true);
  selectedMonth = signal<number | null>(null);
  private switchTimer: ReturnType<typeof setTimeout> | null = null;
  private switchSettleTimer: ReturnType<typeof setTimeout> | null = null;
  private monthScrollFrame = 0;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // Sort competitions by type for grid view
  sortedCompetitions = computed(() => {
    const weights: Record<string, number> = {
      'S类': 0,
      'A类': 1,
      'B类': 2,
      'C类': 3,
      'D类': 4,
      'E级': 5,
      '未知': 6,
      '无（忽略级别）': 7
    };
    
    const comps = this.dataService.competitions();
    if (!comps) return [];

    return [...comps].sort((a, b) => {
      const wa = weights[a.type] ?? 8;
      const wb = weights[b.type] ?? 8;
      return wa - wb;
    });
  });

  ngOnDestroy() {
    this.clearSwitchTimers();
    if (this.monthScrollFrame) {
      cancelAnimationFrame(this.monthScrollFrame);
    }
  }

  private clearSwitchTimers() {
    if (this.switchTimer) {
      clearTimeout(this.switchTimer);
      this.switchTimer = null;
    }
    if (this.switchSettleTimer) {
      clearTimeout(this.switchSettleTimer);
      this.switchSettleTimer = null;
    }
  }

  switchView(mode: 'grid' | 'calendar') {
    if (this.viewMode() === mode) {
      return;
    }

    this.clearSwitchTimers();

    if (this.prefersReducedMotion) {
      this.viewMode.set(mode);
      this.isSwitching.set(false);
      return;
    }

    this.isSwitching.set(true);
    
    this.switchTimer = setTimeout(() => {
      this.switchTimer = null;
      this.viewMode.set(mode);
      
      this.switchSettleTimer = setTimeout(() => {
        this.switchSettleTimer = null;
        this.isSwitching.set(false);
      }, 32);
    }, 180);
  }

  selectMonth(m: number) {
    this.selectedMonth.set(m);

    if (this.monthScrollFrame) {
      cancelAnimationFrame(this.monthScrollFrame);
    }

    this.monthScrollFrame = requestAnimationFrame(() => {
      this.monthScrollFrame = 0;
      const el = document.getElementById('month-detail');
      if (el) {
        el.scrollIntoView({ behavior: this.prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  getMonthName(m: number): string {
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return names[m - 1];
  }

  getCountByMonth(m: number): number {
    return this.dataService.competitions().filter(c => c.month === m).length;
  }

  getCompetitionsByMonth(m: number): Competition[] {
    return this.dataService.competitions().filter(c => c.month === m);
  }

  displayText(value: string | null | undefined): string {
    return this.locale.translateData(value);
  }

  displayMonth(month: number | string | null | undefined): string {
    if (!month) return this.displayText('详见官网');
    const numeric = typeof month === 'number' ? month : Number(String(month).replace('月', ''));
    if (!this.locale.isEnglish()) return `${numeric || month}月`;
    if (!numeric || numeric < 1 || numeric > 12) return String(month);
    return this.getMonthName(numeric);
  }

  displayDeadline(deadline: string | null | undefined): string {
    if (!deadline) return this.displayText('详见官网');
    const monthMatch = deadline.match(/^(\d{1,2})月$/);
    if (this.locale.isEnglish() && monthMatch) {
      return this.displayMonth(Number(monthMatch[1]));
    }
    return this.displayText(deadline);
  }

  displayCompetitionLevel(level: string | null | undefined): string {
    if (!level) return this.displayText('未知级别');
    return this.displayText(level);
  }

  displayCompetitionType(type: string | null | undefined): string {
    if (!type) return '';
    if (!this.locale.isEnglish()) return type;
    if (type.includes('忽略级别')) return 'Unranked';
    return type.replace('类', '-Class').replace('级', '-Level');
  }

  displayNote(note: string | null | undefined): string {
    if (!note) return '';
    const translated = this.displayText(note);
    return this.locale.isEnglish() && this.locale.hasCjk(translated) ? 'Competition Note' : translated;
  }

  displayCompetitionName(comp: Competition): string {
    if (!this.locale.isEnglish()) return comp.name;
    const exact = COMPETITION_NAME_TRANSLATIONS[comp.name];
    if (exact) return exact;
    return this.translateCompetitionPhrase(comp.name, 'Architecture & Design Competition');
  }

  displayOrganizer(organizer: string): string {
    if (!this.locale.isEnglish()) return organizer;
    return this.translateCompetitionPhrase(organizer, 'Organizing Committee');
  }

  private translateCompetitionPhrase(value: string, fallback: string): string {
    let text = value;
    const replacements: Array<[string, string]> = [
      ['中国国际大学生创新大赛', 'China International College Students Innovation Competition'],
      ['“挑战杯”全国大学生课外学术科技作品竞赛', 'Challenge Cup National Undergraduate Extracurricular Academic Science and Technology Works Competition'],
      ['“挑战杯” 全国大学生课外学术科技作品竞赛', 'Challenge Cup National Undergraduate Extracurricular Academic Science and Technology Works Competition'],
      ['“挑战杯”中国大学生创业计划大赛', 'Challenge Cup Chinese College Students Entrepreneurship Plan Competition'],
      ['“挑战杯” 中国大学生创业计划竞赛', 'Challenge Cup Chinese College Students Entrepreneurship Plan Competition'],
      ['全国大学生电子商务“创新、创意及创业”挑战赛', 'National College Students E-Commerce Innovation, Creativity and Entrepreneurship Challenge'],
      ['全国大学生电子商务 “创新、创意及创业” 挑战赛', 'National College Students E-Commerce Innovation, Creativity and Entrepreneurship Challenge'],
      ['全国大学生创新创业训练计划年会展示', 'National College Student Innovation and Entrepreneurship Training Program Annual Showcase'],
      ['中美青年创客大赛', 'China-US Young Maker Competition'],
      ['全国大学生广告艺术大赛', 'National College Student Advertising Art Competition'],
      ['未来设计师·全国高校数字艺术设计大赛', 'Future Designer National College Digital Art Design Competition'],
      ['中国好创意暨全国数字艺术设计大赛', 'China Creativity and National Digital Art Design Competition'],
      ['“学创杯”全国大学生创业综合模拟大赛', 'Xuechuang Cup National College Entrepreneurship Simulation Competition'],
      ['全国大学生先进成图技术与产品信息建模创新大赛', 'National College Student Advanced Mapping and Product Information Modeling Innovation Competition'],
      ['全国大学生结构设计竞赛', 'National College Student Structural Design Competition'],
      ['全国高校 BIM 毕业设计创新大赛', 'National University BIM Graduation Design Innovation Competition'],
      ['两岸新锐设计竞赛·华灿奖', 'Huacan Award Cross-Strait Emerging Designer Competition'],
      ['米兰设计周--中国高校设计学科师生优秀作品展', 'Milan Design Week China University Design Works Exhibition'],
      ['全国三维数字化创新设计大赛', 'National 3D Digital Innovation Design Competition'],
      ['全国大学生GIS应用技能大赛', 'National College Student GIS Application Skills Competition'],
      ['WUPENiCity城市可持续调研报告国际竞赛', 'WUPENiCity International Competition for Urban Sustainability Research Reports'],
      ['WUPENiCity城市设计学生作业国际竞赛', 'WUPENiCity International Student Urban Design Competition'],
      ['全国大学生环境设计大赛', 'National College Student Environmental Design Competition'],
      ['全国大学生花园设计建造竞赛', 'National College Student Garden Design and Construction Competition'],
      ['东南·中国建筑新人赛', 'Southeast China Architecture Rookie Award'],
      ['霍普杯2025国际大学生建筑设计竞赛', 'UIA-HYP Cup 2025 International Student Architecture Design Competition'],
      ['eVolo 摩天楼设计竞赛', 'eVolo Skyscraper Design Competition'],
      ['谷雨杯-全国大学生可持续建筑设计竞赛', 'Guyu Cup National College Student Sustainable Architecture Design Competition'],
      ['国际威卢克斯（Velux）大奖赛', 'International VELUX Award'],
      ['情感博物馆设计竞赛', 'Museum of Emotions Design Competition'],
      ['微型住宅（MICROHOME）设计竞赛', 'MICROHOME Design Competition'],
      ['ADF 设计大奖赛', 'ADF Design Award'],
      ['UIA 国际学生竞赛', 'UIA International Student Competition'],
      ['Kinderspace — 儿童发展建筑竞赛', 'Kinderspace: Architecture for Children Development Competition'],
      ['疗愈空间——国际设计大赛', 'A Healing Space International Design Competition'],
      ['ARCASIA 学生建筑设计竞赛', 'ARCASIA Student Architecture Design Competition'],
      ['垂直农场设计竞赛', 'Vertical Farms Design Competition'],
      ['全国', 'National'],
      ['国际', 'International'],
      ['大学生', 'College Student'],
      ['高校', 'University'],
      ['学生', 'Student'],
      ['建筑设计', 'Architecture Design'],
      ['建筑', 'Architecture'],
      ['环境设计', 'Environmental Design'],
      ['风景园林', 'Landscape Architecture'],
      ['乡村振兴', 'Rural Revitalization'],
      ['城市设计', 'Urban Design'],
      ['规划设计', 'Planning and Design'],
      ['数字艺术设计', 'Digital Art Design'],
      ['创新创业', 'Innovation and Entrepreneurship'],
      ['创新设计', 'Innovation Design'],
      ['设计竞赛', 'Design Competition'],
      ['设计大赛', 'Design Competition'],
      ['竞赛', 'Competition'],
      ['大赛', 'Competition'],
      ['作品展', 'Works Exhibition'],
      ['教育部高等学校', 'Ministry of Education Higher Education'],
      ['教育部', 'Ministry of Education'],
      ['高等教育司', 'Department of Higher Education'],
      ['共青团中央', 'Central Committee of the Communist Youth League'],
      ['住房和城乡建设部', 'Ministry of Housing and Urban-Rural Development'],
      ['中国土木工程学会', 'China Civil Engineering Society'],
      ['中国建筑学会', 'Architectural Society of China'],
      ['中国风景园林学会', 'Chinese Society of Landscape Architecture'],
      ['中国城市科学研究会', 'Chinese Society for Urban Studies'],
      ['中国建设教育协会', 'China Association of Construction Education'],
      ['中国高等教育学会', 'China Association of Higher Education'],
      ['工业和信息化部人才交流中心', 'Talent Exchange Center of the Ministry of Industry and Information Technology'],
      ['东南大学', 'Southeast University'],
      ['天津大学建筑学院', 'School of Architecture, Tianjin University'],
      ['同济大学', 'Tongji University'],
      ['清华大学', 'Tsinghua University'],
      ['西安建筑科技大学', "Xi'an University of Architecture and Technology"],
      ['等', 'and others'],
      ['、', ', '],
      ['（', ' ('],
      ['）', ')'],
      ['“', ''],
      ['”', '']
    ];

    for (const [source, target] of replacements.sort((a, b) => b[0].length - a[0].length)) {
      text = text.replaceAll(source, target);
    }

    text = text
      .replace(/\s+/g, ' ')
      .replace(/\s+,/g, ',')
      .replace(/,\s*/g, ', ')
      .trim();

    return this.locale.hasCjk(text) ? fallback : text;
  }

  getLevelClass(level: string | undefined | null): string {
    const base = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm transition-colors duration-300';
    const safeLevel = level || '';
    
    if (safeLevel.includes('国际')) {
      // Blue (Model style from Resources)
      return `${base} bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20`;
    }
    
    if (safeLevel.includes('国家')) {
      // Amber (Material style from Resources) - Distinct from Red
      return `${base} bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20`;
    }
    
    // Default / Provincial -> Emerald (Environment style from Resources)
    return `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20`;
  }

  getNoteClass(note: string | undefined | null): string {
    const base = 'text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm transition-colors duration-300 border';
    
    if (note === '上榜赛事') {
      // Red (TI Journal style from Readings)
      return `${base} bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30`;
    }
    
    // Default note
    return `${base} bg-white/5 text-gray-500 border-white/10 hover:bg-white/10`;
  }
}
