
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';

@Component({
  selector: 'app-essentials',
  imports: [CommonModule, RouterLink, GsapCardHoverDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page-scroll ui-page-pad text-white">
      
      <!-- Top Header -->
      <div class="ui-page-header">
        <h2 class="ui-title">建筑干货</h2>
        <p class="ui-subtitle">精选建筑设计方法与职业发展指南</p>
      </div>
      
      <div class="space-y-4 max-w-4xl mx-auto w-full">
        <!-- Section 1: Methodology -->
        <a routerLink="/essentials/methodology" class="block ui-card ui-card-hover overflow-hidden group" appGsapCardHover>
          <div class="w-full text-left p-5 md:p-6 flex justify-between items-center">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                 <!-- Icon: Chart/Graph -->
                 <svg lucideMap class="w-6 h-6" [strokeWidth]="2"></svg>
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
                 <svg lucideChevronRight class="w-5 h-5" [strokeWidth]="2"></svg>
               </div>
            </div>
          </div>
        </a>

        <!-- Section 2: Q&A -->
        <a (click)="dataService.openExternalModal('https://www.kdocs.cn/l/cj0zVG0UXxsa')" class="block ui-card ui-card-hover overflow-hidden group cursor-pointer" appGsapCardHover>
          <div class="w-full text-left p-5 md:p-6 flex justify-between items-center">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                 <!-- Icon: Chat/Question -->
                 <svg lucideCircleHelp class="w-6 h-6" [strokeWidth]="2"></svg>
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
                 <svg lucideChevronRight class="w-5 h-5" [strokeWidth]="2"></svg>
               </div>
            </div>
          </div>
        </a>

        <!-- Section 3: Career -->
        <a routerLink="/essentials/career" class="block ui-card ui-card-hover overflow-hidden group" appGsapCardHover>
          <div class="w-full text-left p-5 md:p-6 flex justify-between items-center">
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                 <!-- Icon: Briefcase -->
                 <svg lucideBriefcase class="w-6 h-6" [strokeWidth]="2"></svg>
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
                 <svg lucideChevronRight class="w-5 h-5" [strokeWidth]="2"></svg>
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
