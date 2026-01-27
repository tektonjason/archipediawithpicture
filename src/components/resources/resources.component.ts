
import { Component, inject, signal, computed } from '@angular/core';
import { DataService, Link } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { NgStyle, CommonModule } from '@angular/common';

@Component({
  selector: 'app-resources',
  imports: [FormsModule, NgStyle, CommonModule],
  template: `
    <div class="h-full flex flex-col p-6 md:p-8 bg-[#0f0f11] text-white overflow-y-auto custom-scrollbar">
      
      <!-- Top Header -->
      <div class="flex flex-col items-center mb-8 shrink-0 text-center space-y-2">
        <h2 class="text-3xl md:text-4xl font-bold tracking-wide">设计资源库</h2>
        <p class="text-gray-400 text-sm md:text-base">为建筑学习者精选的资源集合</p>
        
        <!-- Search -->
        <div class="relative w-full max-w-xl mt-2">
           <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
           </div>
           <input 
             type="text" 
             placeholder="搜索资源..." 
             class="w-full bg-[#18181b] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg"
           >
        </div>
      </div>
      
      <div class="space-y-4">
        @for (group of groupedLinks(); track group.category) {
          <div #categoryElement class="scroll-mt-4 bg-[#18181b] border border-white/5 rounded-xl overflow-hidden transition-all duration-300">
            <button 
              (click)="toggleCategory(group.category, categoryElement)" 
              class="w-full text-left p-4 md:p-5 hover:bg-white/5 transition-colors flex justify-between items-center group"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                   <!-- Icon based on category -->
                   <ng-container [ngSwitch]="group.category">
                      <!-- 院校展览: Academic Cap/School -->
                      <svg *ngSwitchCase="'院校展览'" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>
                      
                      <!-- 建筑资讯与媒体: Newspaper -->
                      <svg *ngSwitchCase="'建筑资讯与媒体'" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>

                      <!-- 规范、学习与学术: Book/Scale -->
                      <svg *ngSwitchCase="'规范、学习与学术'" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>

                      <!-- 地图、气象与数据: Map/Globe -->
                      <svg *ngSwitchCase="'地图、气象与数据'" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>

                      <!-- 软件、插件与渲染: Desktop/Code -->
                      <svg *ngSwitchCase="'软件、插件与渲染'" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>

                      <!-- 材质、配景与素材: Cube/Texture -->
                      <svg *ngSwitchCase="'材质、配景与素材'" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>

                      <!-- 配色、平面与图解: Color Palette -->
                      <svg *ngSwitchCase="'配色、平面与图解'" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>

                      <!-- 实用工具: Wrench/Tool -->
                      <svg *ngSwitchCase="'实用工具'" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>

                      <svg *ngSwitchDefault class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                   </ng-container>
                </div>
                <div>
                  <h3 class="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{{ group.category }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">
                     {{ getCategoryDescription(group.category) }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-4">
                 <span class="bg-white/10 text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">{{ group.links.length }}</span>
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-500 transition-transform duration-300" [class.rotate-180]="expandedCategory() === group.category" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                 </svg>
              </div>
            </button>
             
            <div class="transition-all duration-300 ease-in-out overflow-hidden bg-[#0f0f11]" 
                 [style.max-height]="expandedCategory() === group.category ? '2000px' : '0px'"
                 [style.opacity]="expandedCategory() === group.category ? '1' : '0'">
              <div class="p-4 md:p-6 border-t border-white/5">
                
                @if (group.category === '院校展览') {
                  <div class="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-200/80 leading-relaxed flex gap-3">
                    <svg class="w-5 h-5 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <div>
                      <strong class="block text-blue-400 mb-1">为什么要看这些院校的作品？</strong>
                      小红书、Pinterest等平台上的碎片化灵感图难以传授完整的设计逻辑，ArchDaily、gooood等则偏重落地与施工，创意性受限；而顶尖院校的学生作品能系统呈现从概念到方案的完整思路、批判性方法与国际教学趋势，更利于提升设计视野与方法论。
                    </div>
                  </div>
                }

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  @for (link of group.links; track link.id) {
                    <!-- Link Card -->
                    <a [href]="link.url" target="_blank" class="group/card flex items-start gap-4 p-4 rounded-lg bg-[#18181b] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all">
                      <div class="w-10 h-10 rounded bg-white/5 flex items-center justify-center shrink-0 group-hover/card:bg-white/10 transition-colors">
                         <span class="text-xs font-bold text-gray-400 group-hover/card:text-white">{{ link.title.charAt(0).toUpperCase() }}</span>
                      </div>
                      
                      <div class="flex-1 min-w-0">
                         <div class="flex justify-between items-start">
                            <h4 class="text-sm font-bold text-white group-hover/card:text-blue-400 transition-colors truncate">{{ link.title }}</h4>
                            @if (dataService.isAdmin()) {
                              <button (click)="$event.preventDefault(); deleteLink(link.id)" class="text-red-500/50 hover:text-red-500 transition-colors ml-2">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            }
                         </div>
                         <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ link.description }}</p>
                         
                         <!-- Tags -->
                         @if (link.tags && link.tags.length > 0) {
                           <div class="flex flex-wrap gap-1 mt-3">
                             @for (tag of link.tags; track tag) {
                               <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">{{ tag }}</span>
                             }
                           </div>
                         }
                      </div>
                      
                      <div class="opacity-0 group-hover/card:opacity-100 transition-opacity self-center">
                         <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </div>
                    </a>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      @if (dataService.isAdmin()) {
        <div class="mt-8 border border-white/10 rounded-xl p-6 bg-[#18181b]">
          <h3 class="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            添加新资源
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">分类</label>
              <input [(ngModel)]="newCategory" placeholder="例如: 建筑资讯" class="w-full bg-[#27272a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50">
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">网站名称</label>
              <input [(ngModel)]="newTitle" placeholder="例如：ArchDaily" class="w-full bg-[#27272a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50">
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">URL</label>
              <input [(ngModel)]="newUrl" placeholder="https://..." class="w-full bg-[#27272a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50">
            </div>
            <div class="md:col-span-2">
               <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">简短描述</label>
              <input [(ngModel)]="newDesc" placeholder="网站的一句话介绍" class="w-full bg-[#27272a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50">
            </div>
          </div>
          <button (click)="addLink()" class="w-full py-3 mt-6 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors">添加资源</button>
        </div>
      }
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
export class ResourcesComponent {
  dataService = inject(DataService);
  
  newCategory = signal('');
  newTitle = signal('');
  newUrl = signal('');
  newDesc = signal('');
  expandedCategory = signal<string | null>('null'); // Default expand one for demo

  private categoryOrder = [
    '院校展览','建筑资讯与媒体', '规范、学习与学术', '地图、气象与数据', '软件、插件与渲染',
    '材质、配景与素材', '配色、平面与图解', '实用工具'
  ];

  groupedLinks = computed(() => {
    const links = this.dataService.webLinks();
    const map = new Map<string, Link[]>();
    links.forEach(l => {
      const cat = l.category || '未分类';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(l);
    });
    const groups = Array.from(map.entries()).map(([category, links]) => ({ category, links }));
    return groups.sort((a, b) => {
      const idxA = this.categoryOrder.indexOf(a.category);
      const idxB = this.categoryOrder.indexOf(b.category);
      const valA = idxA === -1 ? 999 : idxA;
      const valB = idxB === -1 ? 999 : idxB;
      return valA - valB;
    });
  });

  toggleCategory(category: string, element?: HTMLElement) {
    const isExpanding = this.expandedCategory() !== category;
    
    // 如果是关闭操作，直接执行
    if (!isExpanding) {
      this.expandedCategory.set(null);
      return;
    }

    // 如果是展开操作
    if (element) {
      const container = element.closest('.overflow-y-auto') as HTMLElement;
      if (!container) {
        this.expandedCategory.set(category);
        return;
      }

      // 1. 计算当前的相对位置 (Start Point)
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const startRelativeTop = elementRect.top - containerRect.top;

      // 2. 切换状态，触发布局变化
      this.expandedCategory.set(category);

      // 3. 启动自定义动画插值补偿 (Dynamic Interpolation Compensation)
      this.animateScroll(element, container, startRelativeTop);

    } else {
       this.expandedCategory.set(category);
    }
  }

  private animateScroll(element: HTMLElement, container: HTMLElement, startRelativeTop: number) {
      const startTime = Date.now();
      const duration = 500; // 动画时长，覆盖 CSS transition
      const targetOffset = 24; // 目标：距离顶部 24px (scroll-mt-6)

      // 缓动函数: Quartic Ease-Out (开始快，结束慢)
      const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

      const step = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          if (progress < 1) {
              const easedT = easeOutQuart(progress);

              // 1. 计算当前时刻的“理想相对位置”
              // 从 startRelativeTop 逐渐过渡到 targetOffset (24px)
              const idealRelativeTop = startRelativeTop + (targetOffset - startRelativeTop) * easedT;

              // 2. 获取当前的“实际相对位置”
              const currentElementRect = element.getBoundingClientRect();
              const currentContainerRect = container.getBoundingClientRect();
              const actualRelativeTop = currentElementRect.top - currentContainerRect.top;

              // 3. 计算误差并修正
              // 如果 actual > ideal，说明元素在理想位置下方，需要往下滚 (scrollTop += positive)
              // 如果 actual < ideal，说明元素在理想位置上方，需要往上滚 (scrollTop += negative)
              const correction = actualRelativeTop - idealRelativeTop;

              if (Math.abs(correction) > 0.5) {
                  container.scrollTop += correction;
              }

              requestAnimationFrame(step);
          } else {
              // 动画结束，做最后一次校准确保精确到位
              // 此时应该完全到位
          }
      };

      requestAnimationFrame(step);
  }

  addLink() {
    if (this.newTitle() && this.newUrl() && this.newCategory()) {
      this.dataService.addLink({
        id: Date.now().toString(),
        category: this.newCategory(),
        title: this.newTitle(),
        url: this.newUrl(),
        description: this.newDesc() || '暂无描述'
      });
      this.newTitle.set('');
      this.newUrl.set('');
      this.newDesc.set('');
    }
  }

  deleteLink(id: string) {
    if(confirm('确定要删除这个资源吗?')) {
      this.dataService.removeLink(id);
    }
  }

  getCategoryDescription(category: string): string {
     switch(category) {
       case '院校展览': return 'Top academic showcases from around the globe';
       case '建筑资讯与媒体': return 'Leading digital publications and news';
       case '规范、学习与学术': return 'Building regulations and zoning';
       case '材质、配景与素材': return 'Textures, physical properties, and suppliers';
       default: return 'Curated resources';
     }
  }
}
