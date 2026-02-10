
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-essentials',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-full flex flex-col p-6 md:p-8 bg-[#0f0f11] text-white overflow-y-auto custom-scrollbar">
      
      <!-- Top Header -->
      <div class="flex flex-col items-center mb-8 shrink-0 text-center space-y-2">
        <h2 class="text-3xl md:text-4xl font-bold tracking-wide">建筑干货</h2>
        <p class="text-gray-400 text-sm md:text-base">精选建筑设计方法与职业发展指南</p>
      </div>
      
      <div class="space-y-4 max-w-4xl mx-auto w-full">
        <!-- Section 1: Methodology -->
        <a routerLink="/essentials/methodology" class="block bg-[#18181b] border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/5 hover:border-white/10 group">
          <div class="w-full text-left p-5 md:p-6 flex justify-between items-center">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                 <!-- Icon: Chart/Graph -->
                 <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                 </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">设计方法图谱</h3>
                <p class="text-sm text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                   系统化的设计思维与方法论总结
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
               <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                 </svg>
               </div>
            </div>
          </div>
        </a>

        <!-- Section 2: Q&A -->
        <a (click)="dataService.openExternalModal('https://www.kdocs.cn/l/cj0zVG0UXxsa')" class="block bg-[#18181b] border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/5 hover:border-white/10 group cursor-pointer">
          <div class="w-full text-left p-5 md:p-6 flex justify-between items-center">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                 <!-- Icon: Chat/Question -->
                 <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">问答 Q&A</h3>
                <p class="text-sm text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                   常见问题解答与经验分享
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
               <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                 </svg>
               </div>
            </div>
          </div>
        </a>

        <!-- Section 3: Career -->
        <a routerLink="/essentials/career" class="block bg-[#18181b] border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/5 hover:border-white/10 group">
          <div class="w-full text-left p-5 md:p-6 flex justify-between items-center">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                 <!-- Icon: Briefcase -->
                 <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">就业方向概览</h3>
                <p class="text-sm text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                   行业前景、职业规划与求职指南
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
               <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                 </svg>
               </div>
            </div>
          </div>
        </a>

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
export class EssentialsComponent implements OnInit {
  dataService = inject(DataService);
  route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['openQna'] === 'true') {
        // Small delay to ensure smooth transition and data service readiness
        setTimeout(() => {
          this.dataService.openExternalModal('https://www.kdocs.cn/l/cj0zVG0UXxsa');
        }, 100);
      }
    });
  }
}
