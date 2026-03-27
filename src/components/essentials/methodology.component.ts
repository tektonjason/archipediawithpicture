
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

interface MethodColumn {
  title: string;
  url: string;
  description?: string;
  icon?: string;
}

@Component({
  selector: 'app-methodology',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-full flex flex-col bg-[#0f0f11] text-white overflow-hidden">
      <!-- Header -->
      <div class="p-4 pl-24 border-b border-white/5 flex items-center gap-4 bg-[#18181b] shrink-0">
        <a routerLink="/essentials" class="px-4 py-2 rounded-lg bg-[#18181b] border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors text-gray-300 hover:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
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
              class="group cursor-pointer bg-[#18181b] border border-white/5 rounded-xl p-5 hover:bg-white/5 hover:border-white/10 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden"
            >
              <!-- Hover Glow Effect -->
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>

              <div class="flex items-start justify-between relative z-10">
                <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                
                <div class="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-gray-500 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
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
             <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
             </svg>
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
