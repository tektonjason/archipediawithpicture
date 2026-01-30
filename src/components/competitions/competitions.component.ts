import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService, Competition } from '../../services/data.service';

@Component({
  selector: 'app-competitions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-full flex flex-col p-6 md:p-8 bg-[#0f0f11] text-white overflow-hidden">
      
      <!-- Header Section -->
      <div class="flex flex-col items-center mb-8 shrink-0 space-y-2">
        <h1 class="text-3xl md:text-4xl font-bold tracking-wide">竞赛合集</h1>
        <p class="text-gray-400 text-sm md:text-base max-w-2xl text-center">
          汇集全球建筑设计竞赛资讯
        </p>

        <!-- View Toggle (Centered below title) -->
        <div class="mt-4 flex bg-[#18181b] rounded-xl border border-white/10 p-1 shrink-0">
          <button 
            (click)="switchView('grid')"
            class="p-2 rounded-lg transition-all"
            [class.bg-white/10]="viewMode() === 'grid'"
            [class.text-white]="viewMode() === 'grid'"
            [class.text-gray-500]="viewMode() !== 'grid'"
            [class.hover:text-gray-300]="viewMode() !== 'grid'"
            title="网格视图"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button 
            (click)="switchView('calendar')"
            class="p-2 rounded-lg transition-all"
            [class.bg-white/10]="viewMode() === 'calendar'"
            [class.text-white]="viewMode() === 'calendar'"
            [class.text-gray-500]="viewMode() !== 'calendar'"
            [class.hover:text-gray-300]="viewMode() !== 'calendar'"
            title="日历视图"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">

        <!-- Disclaimer & Useful Links -->
        <div class="mb-8 space-y-4 max-w-5xl mx-auto">
          <!-- Disclaimer -->
          <div *ngIf="showDisclaimer()" class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3 items-center text-sm text-amber-200/80 pr-2 group transition-all">
            <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="flex-1">相关竞赛的信息整理于2026年1月，实际情况可能与本页面内容不同，请以官方文件或学校通知为准。</p>
            <button (click)="showDisclaimer.set(false)" class="text-amber-500/50 hover:text-amber-500 transition-colors p-1 rounded hover:bg-amber-500/10 shrink-0 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Useful Links -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Official Libraries -->
            <div class="bg-[#18181b] border border-white/10 rounded-xl p-4">
              <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                官方竞赛库
              </h3>
              <div class="flex flex-wrap gap-2">
                <a (click)="dataService.openExternalModal('https://www.bing.com/search?q=%E5%85%A8%E5%9B%BD%E5%A4%A7%E5%AD%A6%E7%94%9F%E5%AD%A6%E7%A7%91%E7%AB%9E%E8%B5%9B%E7%9B%AE%E5%BD%95')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">全国大学生学科竞赛目录</a>
                <a (click)="dataService.openExternalModal('https://www.bing.com/search?q=%E6%9F%90%E6%9F%90%E5%A4%A7%E5%AD%A6%E5%AD%A6%E7%A7%91%E7%AB%9E%E8%B5%9B%E7%9B%AE%E5%BD%95')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">学校学科竞赛库</a>
              </div>
            </div>

            <!-- Info Websites -->
            <div class="bg-[#18181b] border border-white/10 rounded-xl p-4">
              <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                竞赛信息查询
              </h3>
              <div class="flex flex-wrap gap-2">
                <a (click)="dataService.openExternalModal('https://www.shejijingsai.com/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">设计竞赛网</a>
                <a (click)="dataService.openExternalModal('https://www.archdaily.com/search/competitions')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">ArchDaily</a>
                <a (click)="dataService.openExternalModal('https://architecturecompetitions.com/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">Buildner</a>
                <a (click)="dataService.openExternalModal('https://www.archrace.com/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">ArchRace</a>
                <a (click)="dataService.openExternalModal('https://www.dezeen.com/competitions/type/architecture/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">Dezeen</a>
                <a (click)="dataService.openExternalModal('https://competitions.archi/')" class="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">Competitions.archi</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="view-transition-wrapper" [class.switching]="isSwitching()">
          <!-- Loading / Empty State -->
          <div *ngIf="sortedCompetitions().length === 0" class="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>暂无竞赛数据</p>
          </div>

          <!-- Grid View -->
          <div *ngIf="viewMode() === 'grid' && sortedCompetitions().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            <div *ngFor="let comp of sortedCompetitions()" (click)="dataService.openExternalModal(comp.url)" class="bg-[#18181b] border border-white/5 rounded-xl p-3 md:p-5 hover:bg-white/5 hover:border-white/10 transition-all hover:shadow-lg group flex flex-col h-full relative cursor-pointer">
              <div class="flex items-start justify-between mb-2 md:mb-3">
                <span [class]="getLevelClass(comp.level)">
                  {{ comp.level || '未知级别' }}
                </span>
                <span class="text-xs text-gray-500 font-mono" *ngIf="comp.month">
                  {{ comp.month }}月
                </span>
              </div>
              
              <h3 class="text-base md:text-lg font-bold text-gray-200 mb-1 md:mb-2 leading-tight group-hover:text-blue-400 transition-colors">
                {{ comp.name }}
              </h3>
              
              <div class="text-xs text-gray-500 mb-2 md:mb-4 line-clamp-2">
                主办: {{ comp.organizer }}
              </div>

              <div class="mt-auto pt-2 md:pt-4 border-t border-white/5 flex flex-col gap-2">
                <div class="flex items-center justify-between text-xs" *ngIf="comp.type && !comp.type.includes('忽略级别')">
                  <span class="text-gray-500">类型</span>
                  <span class="text-gray-300">{{ comp.type }}</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-500">截止</span>
                  <span class="text-gray-300">{{ comp.deadline || '详见官网' }}</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-2" *ngIf="comp.note">
                  <span [class]="getNoteClass(comp.note)">
                    {{ comp.note }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Calendar View -->
          <div *ngIf="viewMode() === 'calendar' && sortedCompetitions().length > 0" class="flex flex-col gap-8 pb-20">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <div *ngFor="let m of months" 
                class="aspect-[3/4] md:aspect-square bg-[#18181b] border rounded-xl p-3 md:p-5 relative cursor-pointer transition-all hover:border-white/20 group flex flex-col overflow-hidden"
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
                      <span class="truncate">{{ c.name }}</span>
                    </div>
                  </ng-container>
                  
                  <!-- More Indicator -->
                  <div *ngIf="getCountByMonth(m) > 7" class="text-[10px] text-gray-600 mt-auto pt-2 border-t border-white/5 flex items-center gap-1">
                    <span>还有 {{ getCountByMonth(m) - 7 }} 个竞赛</span>
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </div>
                  
                  <!-- Empty State -->
                  <div *ngIf="getCountByMonth(m) === 0" class="flex-1 flex items-center justify-center text-[10px] md:text-xs text-gray-700 italic">
                    本月暂无赛事
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
                <span>{{ sm }}月竞赛详情</span>
              </h2>
              
              <div class="grid grid-cols-1 gap-3">
                 <div *ngFor="let comp of getCompetitionsByMonth(sm)" (click)="dataService.openExternalModal(comp.url)" class="bg-[#18181b] border border-white/5 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center group hover:border-white/10 transition-all cursor-pointer">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3 mb-1">
                        <span [class]="getLevelClass(comp.level)">
                          {{ comp.level || '未知' }}
                        </span>
                        <span class="text-xs text-gray-500" *ngIf="comp.type && !comp.type.includes('忽略级别')">{{ comp.type }}</span>
                      </div>
                      <h3 class="text-base font-bold text-gray-200 group-hover:text-white transition-colors line-clamp-2">
                        {{ comp.name }}
                      </h3>
                      <p class="text-xs text-gray-500 line-clamp-2">主办: {{ comp.organizer }}</p>
                    </div>
                    
                    <div class="flex flex-col items-end shrink-0 gap-1">
                       <span class="text-xs font-mono text-gray-400">截止: {{ comp.deadline }}</span>
                       <span *ngIf="comp.note" [class]="getNoteClass(comp.note)">{{ comp.note }}</span>
                    </div>
                 </div>
                 
                 <div *ngIf="getCompetitionsByMonth(sm).length === 0" class="p-8 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                   本月暂无收录竞赛
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
      transition: opacity 200ms ease, transform 200ms ease;
      opacity: 1;
      transform: scale(1);
      transform-origin: top center;
    }
    .view-transition-wrapper.switching {
      opacity: 0;
      transform: scale(0.98);
    }
  `]
})
export class CompetitionsComponent {
  dataService = inject(DataService);
  viewMode = signal<'grid' | 'calendar'>('grid');
  isSwitching = signal(false);
  showDisclaimer = signal(true);
  selectedMonth = signal<number | null>(null);
  
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

  switchView(mode: 'grid' | 'calendar') {
    if (this.viewMode() === mode) {
      return;
    }
    // 1. Start exit animation (fade out + scale down)
    this.isSwitching.set(true);
    
    // 2. Wait for exit animation to complete (200ms matches CSS)
    setTimeout(() => {
      // 3. Change layout (invisible)
      this.viewMode.set(mode);
      
      // 4. Slight delay to let DOM update layout
      setTimeout(() => {
         // 5. Start enter animation (fade in + scale up)
         this.isSwitching.set(false);
      }, 50);
    }, 200);
  }

  selectMonth(m: number) {
    this.selectedMonth.set(m);
    // Auto scroll to details
    setTimeout(() => {
      const el = document.getElementById('month-detail');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
