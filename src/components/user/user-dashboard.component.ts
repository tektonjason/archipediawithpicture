
import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, Entry } from '../../services/data.service';
import { NgClass } from '@angular/common';
import pinyin from 'pinyin';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';

@Component({
  selector: 'app-user-dashboard',
  imports: [RouterLink, GsapCardHoverDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page text-white">
      
      <!-- Top Header for Toggle -->
       <div class="ui-page-header ui-page-pad bg-app mb-0 transition-all">
          <h2 class="ui-title">用户中心</h2>
          <p class="ui-subtitle">User Dashboard</p>
       </div>

      <!-- Tab Header -->
      <div class="flex border-b border-white/10 shrink-0 px-6 md:px-8">
        <button 
          (click)="activeTab.set('favorites')"
          class="py-4 font-bold text-sm mr-8 border-b-2 transition-all"
          [class.border-blue-500]="activeTab() === 'favorites'"
          [class.text-white]="activeTab() === 'favorites'"
          [class.border-transparent]="activeTab() !== 'favorites'"
          [class.text-gray-500]="activeTab() !== 'favorites'"
          [class.hover:text-gray-300]="activeTab() !== 'favorites'"
        >我的收藏</button>
        <button 
          (click)="activeTab.set('history')"
          class="py-4 font-bold text-sm border-b-2 transition-all"
          [class.border-blue-500]="activeTab() === 'history'"
          [class.text-white]="activeTab() === 'history'"
          [class.border-transparent]="activeTab() !== 'history'"
          [class.text-gray-500]="activeTab() !== 'history'"
          [class.hover:text-gray-300]="activeTab() !== 'history'"
        >浏览历史</button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        @if (activeTab() === 'favorites') {
           @if (favEntries().length === 0) {
            <div class="ui-empty-state h-60 opacity-80">
              <div class="ui-empty-icon"><svg lucideStar class="w-8 h-8" [strokeWidth]="1.8"></svg></div>
              <p class="font-medium">暂无收藏内容</p>
            </div>
           } @else {
             <div class="grid gap-4">
               @for (entry of favEntries(); track entry.id) {
                 <div class="ui-card ui-card-hover p-4 flex justify-between items-center" appGsapCardHover>
                   <div>
                      <h3 class="font-bold text-base text-white">{{ entry.term }}</h3>
                      <p class="text-sm text-gray-500">{{ entry.category }}</p>
                   </div>
                   <div class="flex items-center gap-3">
                     <a [routerLink]="['/entry', entry.id]" class="ui-btn-secondary px-3 py-1.5 text-xs">查看</a>
                     <button (click)="dataService.toggleFavorite(entry.id)" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-yellow-500/20 group transition-colors">
                      <svg lucideStar class="w-5 h-5 text-yellow-400 transition-colors" fill="currentColor" [strokeWidth]="2"></svg>
                    </button>
                   </div>
                 </div>
               }
             </div>
           }
        } @else {
           <div class="flex justify-between items-center mb-6">
              <h2 class="font-bold text-lg text-gray-300">最近访问</h2>
              <button (click)="dataService.clearHistory()" class="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors">清空历史</button>
           </div>
           @if (historyEntries().length === 0) {
             <div class="ui-empty-state h-60 opacity-80 w-full">
               <div class="ui-empty-icon"><svg lucideHistory class="w-8 h-8" [strokeWidth]="1.8"></svg></div>
               <p class="font-medium text-center">暂无历史记录</p>
             </div>
          } @else {
             <div class="flex flex-col gap-4">
               @for (entry of historyEntries(); track entry.id) {
                 <a [routerLink]="['/entry', entry.id]" class="group ui-card ui-card-hover p-4 flex items-center gap-4" appGsapCardHover>
                   <div class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-lg text-gray-500 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors shrink-0">
                     {{ entry.firstPinyinLetter }}
                   </div>
                   <div>
                     <h4 class="font-bold text-base text-white group-hover:text-blue-400 transition-colors">{{ entry.term }}</h4>
                     <p class="text-sm text-gray-500">{{ entry.category }}</p>
                   </div>
                   <div class="ml-auto text-gray-600 group-hover:text-white transition-colors">
                     <svg lucideChevronRight class="w-5 h-5" [strokeWidth]="2"></svg>
                   </div>
                 </a>
               }
             </div>
           }
        }
      </div>
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
  
  activeTab = signal<'favorites' | 'history'>('favorites');

  constructor() {
    this.route.queryParams.subscribe(p => {
      if (p['tab'] === 'history') this.activeTab.set('history');
      else this.activeTab.set('favorites');
    });
  }

  favEntries = computed(() => {
    const ids = this.dataService.favorites();
    return this.dataService.entries().filter(e => ids.includes(e.id));
  });

  historyEntries = computed(() => {
    const historyTerms = this.dataService.history();
    const allEntries = this.dataService.entries();
    return historyTerms
      .map(term => {
        const entry = allEntries.find(e => e.term === term);
        if (!entry) return null;

        const pinyinArray = pinyin(entry.term, {
          style: pinyin.STYLE_FIRST_LETTER,
        });
        const firstLetter = (pinyinArray && pinyinArray[0]?.[0])
          ? pinyinArray[0][0].toUpperCase()
          : '?';

        return { ...entry, firstPinyinLetter: firstLetter };
      })
      .filter((entry): entry is (Entry & { firstPinyinLetter: string }) => !!entry); 
  });
}
