
import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, Entry } from '../../services/data.service';
import { NgClass } from '@angular/common';
import pinyin from 'pinyin';

@Component({
  selector: 'app-user-dashboard',
  imports: [RouterLink],
  template: `
    <div class="h-full flex flex-col bg-[#0f0f11] text-white">
      
      <!-- Top Header for Toggle -->
       <div class="p-6 md:p-8 bg-[#0f0f11] flex flex-col items-center space-y-2 shrink-0 transition-all text-center">
          <h2 class="text-3xl md:text-4xl font-bold tracking-wide">用户中心</h2>
          <p class="text-gray-400 font-medium">User Dashboard</p>
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
            <div class="flex flex-col items-center justify-center h-60 text-gray-500 opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mb-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
              </svg>
              <p class="font-medium">暂无收藏内容</p>
            </div>
           } @else {
             <div class="grid gap-4">
               @for (entry of favEntries(); track entry.id) {
                 <div class="bg-[#18181b] border border-white/5 rounded-xl p-4 flex justify-between items-center transition-all duration-200 hover:border-white/20 hover:bg-white/5">
                   <div>
                      <h3 class="font-bold text-lg text-white">{{ entry.term }}</h3>
                      <p class="text-sm text-gray-500">{{ entry.category }}</p>
                   </div>
                   <div class="flex items-center gap-3">
                     <a [routerLink]="['/entry', entry.id]" class="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors">查看</a>
                     <button (click)="dataService.toggleFavorite(entry.id)" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-yellow-500/20 group transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
                      </svg>
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
             <div class="flex flex-col items-center justify-center h-60 text-gray-500 opacity-50 w-full text-center">
               <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mb-4 text-gray-600 mx-auto block" viewBox="0 0 24 24" fill="currentColor">
                 <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
               </svg>
               <p class="font-medium text-center">暂无历史记录</p>
             </div>
          } @else {
             <div class="flex flex-col gap-4">
               @for (entry of historyEntries(); track entry.id) {
                 <a [routerLink]="['/entry', entry.id]" class="group bg-[#18181b] border border-white/5 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:bg-white/5 hover:border-white/20 hover:translate-x-1">
                   <div class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-black text-lg text-gray-500 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors shrink-0">
                     {{ entry.firstPinyinLetter }}
                   </div>
                   <div>
                     <h4 class="font-bold text-white group-hover:text-blue-400 transition-colors">{{ entry.term }}</h4>
                     <p class="text-sm text-gray-500 font-mono">{{ entry.category }}</p>
                   </div>
                   <div class="ml-auto text-gray-600 group-hover:text-white transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" />
                     </svg>
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
