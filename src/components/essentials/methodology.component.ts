
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { APP_UI_ICONS } from '../shared/ui-icons';

interface MethodColumn {
  title: string;
  url: string;
  description?: string;
  icon?: string;
}

@Component({
  selector: 'app-methodology',
  imports: [CommonModule, RouterLink, ...APP_UI_ICONS],
  template: `
    <div class="ui-page text-white">
      <!-- Header -->
      <div class="ui-topbar">
        <a routerLink="/essentials" class="ui-btn-secondary">
          <svg lucideArrowLeft class="w-4 h-4" [strokeWidth]="2"></svg>
          返回
        </a>
        <div>
          <h2 class="text-xl font-bold">设计方法图谱</h2>
          <p class="text-xs text-gray-500 mt-0.5">Design Methodology Graph</p>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
          @for (col of methodologyColumns; track col.title) {
            <a 
              (click)="openLink(col.url)"
              class="group cursor-pointer ui-card ui-card-hover p-5 flex flex-col gap-4 relative overflow-hidden"
            >
              <!-- Hover Glow Effect -->
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>

              <div class="flex items-start justify-between relative z-10">
                <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                  <svg lucideExternalLink class="w-5 h-5" [strokeWidth]="1.8"></svg>
                </div>
                
                <div class="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-gray-500 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-all">
                  <svg lucideChevronRight class="w-3 h-3" [strokeWidth]="2"></svg>
                </div>
              </div>

              <div class="relative z-10">
                <h3 class="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">{{ col.title }}</h3>
                <p class="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors line-clamp-2">
                  {{ col.description || '点击查看详细内容与方法论' }}
                </p>
              </div>
            </a>
          }
          
          <!-- Add New Placeholder (Visual cue for extensibility) -->
          <div class="border border-dashed border-white/10 rounded-xl p-5 flex flex-col items-center justify-center text-gray-600 gap-2 min-h-[140px] opacity-50 hover:opacity-100 hover:border-white/20 transition-all cursor-default">
             <svg lucidePlus class="w-6 h-6" [strokeWidth]="1.8"></svg>
             <span class="text-xs">更多栏目建设中...</span>
          </div>
        </div>
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
export class MethodologyComponent {
  private dataService = inject(DataService);

  // Define columns here for easy extensibility
  methodologyColumns: MethodColumn[] = [
    { title: '设计开题方法', url: 'https://www.kdocs.cn/l/coV0BsAPZ001', description: '包含选题背景、意义、目标及框架构建方法' },
    { title: '调研方法', url: 'https://www.kdocs.cn/l/ceaSWaVLumOh', description: '场地调研、用户访谈与案例分析技巧' },
    { title: '建筑立面', url: 'https://www.kdocs.cn/l/cu0mWlNMf5bG', description: '立面材质、构成与形式语言探索' },
    { title: '建筑结构', url: 'https://www.kdocs.cn/l/cbDrUaQ0N7cc', description: '结构选型、力学原理与构造细节' },
    { title: '空间设计', url: 'https://www.kdocs.cn/l/crp3GmFAiAXh', description: '空间序列、尺度感与氛围营造' },
    { title: '楼梯设计', url: 'https://www.kdocs.cn/l/cvm1E0MGujmB', description: '规范要求、形式选择与细部设计' },
    { title: '色彩应用', url: 'https://www.kdocs.cn/l/cgKttRrwFHsH', description: '色彩心理学、材质搭配与环境色分析' },
    // 在此处添加新栏目，格式如下：
    // { title: '栏目名称', url: 'https://链接地址', description: '栏目描述' },
  ];

  openLink(url: string) {
    // Check if it's a valid URL before trying to open
    if (url && url.startsWith('http')) {
      this.dataService.openExternalModal(url);
    } else {
      console.warn('Invalid URL:', url);
    }
  }
}
