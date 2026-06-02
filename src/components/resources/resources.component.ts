
import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, Link } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { NgStyle, CommonModule } from '@angular/common';
import { AnimatedSearchBarComponent } from '../shared/animated-search-bar.component';
import { APP_UI_ICONS } from '../shared/ui-icons';

@Component({
  selector: 'app-resources',
  imports: [FormsModule, NgStyle, CommonModule, RouterLink, AnimatedSearchBarComponent, ...APP_UI_ICONS],
  template: `
    <div class="ui-page-scroll ui-page-pad text-white">
      
      <!-- Top Header -->
      <div class="ui-page-header">
        <h2 class="ui-title">设计资源库</h2>
        <p class="ui-subtitle mb-4">为建筑学习者精选的资源集合</p>
        
        <!-- Search -->
        <div class="relative w-full max-w-xl mt-4 h-12 flex justify-center z-20">
          <app-animated-search-bar 
            [query]="searchQuery()" 
            (queryChange)="searchQuery.set($event)" 
            placeholder="搜索资源..."
          ></app-animated-search-bar>
        </div>
      </div>
      
      <div class="space-y-4">
        @if (groupedLinks().length === 0) {
          <div class="ui-empty-state h-60 opacity-80">
            <div class="ui-empty-icon"><svg lucidePackageOpen class="w-8 h-8" [strokeWidth]="1.8"></svg></div>
            <p class="font-medium text-lg">未找到相关资源</p>
            <p class="text-gray-500 text-sm mt-1">请尝试更换关键词查找</p>
            <button 
              [routerLink]="['/about']"
              class="ui-btn-secondary mt-4"
            >
              向我们反馈
            </button>
          </div>
        } @else {
          @for (group of groupedLinks(); track group.category) {
          <div #categoryElement class="scroll-mt-4 ui-card overflow-hidden transition-all duration-300">
            <button 
              (click)="toggleCategory(group.category, categoryElement)" 
              class="w-full text-left p-4 md:p-5 hover:bg-white/5 transition-colors flex justify-between items-center group"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-control bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                   <!-- Icon based on category -->
                   <ng-container [ngSwitch]="group.category">
                      <!-- 院校展览: Academic Cap/School -->
                      <svg *ngSwitchCase="'院校展览'" lucideSchool class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>
                      
                      <!-- 建筑资讯与媒体: Newspaper -->
                      <svg *ngSwitchCase="'建筑资讯与媒体'" lucideBookOpen class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>

                      <!-- 规范、学习与学术: Book/Scale -->
                      <svg *ngSwitchCase="'规范、学习与学术'" lucideLibrary class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>

                      <!-- 地图、气象与数据: Map/Globe -->
                      <svg *ngSwitchCase="'地图、气象与数据'" lucideMap class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>

                      <!-- 软件、插件与渲染: Desktop/Code -->
                      <svg *ngSwitchCase="'软件、插件与渲染'" lucideSettings class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>

                      <!-- 材质、配景与素材: Cube/Texture -->
                      <svg *ngSwitchCase="'材质、配景与素材'" lucidePackageOpen class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>

                      <!-- 配色、平面与图解: Color Palette -->
                      <svg *ngSwitchCase="'配色、平面与图解'" lucidePalette class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>

                      <!-- 实用工具: Wrench/Tool -->
                      <svg *ngSwitchCase="'实用工具'" lucideWrench class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>

                      <svg *ngSwitchDefault lucideList class="w-5 h-5 text-gray-300" [strokeWidth]="2"></svg>
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
                 <svg lucideChevronDown class="w-5 h-5 text-gray-500 transition-transform duration-300" [class.rotate-180]="expandedCategory() === group.category || searchQuery()" [strokeWidth]="2"></svg>
              </div>
            </button>
             
            <div class="transition-all duration-300 ease-in-out overflow-hidden bg-app" 
                 [style.max-height]="(expandedCategory() === group.category || searchQuery()) ? '2000px' : '0px'"
                 [style.opacity]="(expandedCategory() === group.category || searchQuery()) ? '1' : '0'">
              <div class="p-4 md:p-6 border-t border-white/5">
                
                @if (group.category === '院校展览') {
                  <div class="ui-alert-info mb-6 flex gap-3">
                    <svg lucideInfo class="w-5 h-5 shrink-0 text-blue-400" [strokeWidth]="2"></svg>
                    <div>
                      <strong class="block text-blue-400 mb-1">为什么要看这些院校的作品？</strong>
                      小红书、Pinterest等平台上的碎片化灵感图难以传授完整的设计逻辑，ArchDaily、gooood等则偏重落地与施工，创意性受限；而顶尖院校的学生作品能系统呈现从概念到方案的完整思路、批判性方法与国际教学趋势，更利于提升设计视野与方法论。
                    </div>
                  </div>
                }

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  @for (link of group.links; track link.id) {
                    <!-- Link Card -->
                    <div (click)="dataService.openExternalModal(link.url)" class="group/card flex items-start gap-4 p-4 ui-card ui-card-hover cursor-pointer">
                      <div class="w-10 h-10 rounded-control bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-gray-300 group-hover/card:bg-white/10 group-hover/card:text-white transition-colors">
                         <span class="text-sm font-bold leading-none tracking-wide">{{ getResourceMark(link.title) }}</span>
                      </div>
                      
                      <div class="flex-1 min-w-0">
                         <div class="flex justify-between items-start">
                            <h4 class="text-sm font-bold text-white group-hover/card:text-blue-400 transition-colors truncate">{{ link.title }}</h4>
                            @if (dataService.isAdmin()) {
                              <button (click)="$event.stopPropagation(); requestDeleteLink(link.id)" class="text-red-500/50 hover:text-red-500 transition-colors ml-2">
                                <svg lucideX class="w-3 h-3" [strokeWidth]="2"></svg>
                              </button>
                            }
                         </div>
                         <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ link.description }}</p>
                         
                         <!-- Tags -->
                         @if (link.tags && link.tags.length > 0) {
                           <div class="flex flex-wrap gap-1 mt-3">
                             @for (tag of link.tags; track tag) {
                               <span [class]="getTagClass(group.category, tag)">{{ tag }}</span>
                             }
                           </div>
                         }
                      </div>
                      
                      <div class="opacity-0 group-hover/card:opacity-100 transition-opacity self-center">
                         <svg lucideChevronRight class="w-4 h-4 text-gray-500" [strokeWidth]="2"></svg>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
        }
      </div>

      @if (pendingDeleteLink(); as linkToDelete) {
        <div class="ui-modal-shell">
          <div class="ui-modal-backdrop" (click)="cancelDeleteLink()"></div>
          <div class="ui-modal-panel max-w-sm p-6 animate-modal-pop-in">
            <div class="flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <svg lucideAlertTriangle class="w-6 h-6 text-red-400" [strokeWidth]="2"></svg>
              </div>
              <h3 class="text-lg font-bold text-white">删除资源</h3>
              <p class="mt-3 text-sm leading-relaxed text-gray-400">
                确定要删除 “<span class="text-white font-semibold">{{ linkToDelete.title }}</span>” 吗？此操作不可恢复。
              </p>
              <div class="mt-6 flex w-full gap-3">
                <button (click)="cancelDeleteLink()" class="ui-btn-secondary flex-1">取消</button>
                <button (click)="confirmDeleteLink()" class="ui-btn-danger flex-1">确认删除</button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (dataService.isAdmin()) {
        <div class="mt-8 ui-card p-6">
          <h3 class="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            添加新资源
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">分类</label>
              <input [(ngModel)]="newCategory" placeholder="例如: 建筑资讯" class="ui-field">
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">网站名称</label>
              <input [(ngModel)]="newTitle" placeholder="例如：ArchDaily" class="ui-field">
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">URL</label>
              <input [(ngModel)]="newUrl" placeholder="https://..." class="ui-field">
            </div>
            <div class="md:col-span-2">
               <label class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">简短描述</label>
              <input [(ngModel)]="newDesc" placeholder="网站的一句话介绍" class="ui-field">
            </div>
          </div>
          <button (click)="addLink()" class="ui-btn-accent w-full mt-6">添加资源</button>
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
  searchQuery = signal('');
  pendingDeleteLinkId = signal<string | null>(null);
  pendingDeleteLink = computed(() => {
    const id = this.pendingDeleteLinkId();
    return id ? this.dataService.webLinks().find(link => link.id === id) ?? null : null;
  });

  private categoryOrder = [
    '院校展览','建筑资讯与媒体', '规范、学习与学术', '地图、气象与数据', '软件、插件与渲染',
    '材质、配景与素材', '配色、平面与图解', '实用工具'
  ];

  groupedLinks = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const links = this.dataService.webLinks().filter(l => {
      if (!q) return true;
      return l.title.toLowerCase().includes(q) || 
             l.description.toLowerCase().includes(q) || 
             (l.tags && l.tags.some(t => t.toLowerCase().includes(q)));
    });

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

  requestDeleteLink(id: string) {
    this.pendingDeleteLinkId.set(id);
  }

  cancelDeleteLink() {
    this.pendingDeleteLinkId.set(null);
  }

  confirmDeleteLink() {
    const link = this.pendingDeleteLink();
    if (!link) return;

    this.dataService.removeLink(link.id);
    this.pendingDeleteLinkId.set(null);
    this.dataService.displayToast('资源已删除');
  }

  getResourceMark(title: string): string {
    const trimmed = title.trim();
    const cjk = trimmed.match(/[\u3400-\u9fff]/u)?.[0];
    if (cjk) return cjk;

    const latin = trimmed.match(/[A-Za-z0-9]/)?.[0];
    return latin ? latin.toUpperCase() : '#';
  }

  private tagColors: Record<string, string> = {
    '环境': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    '材质': 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
    '模型': 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    '人物': 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
    '配景': 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
    '尺寸': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20',
    '素材': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
    '剪影': 'bg-zinc-500/30 text-zinc-300 border-zinc-500/20 hover:bg-zinc-500/40'
  };

  getTagClass(category: string, tag: string): string {
    const baseClasses = 'text-[10px] px-2 py-0.5 rounded backdrop-blur-sm border transition-all duration-300 font-medium tracking-wide';
    
    // 只有“材质、配景与素材”分类才使用特殊颜色
    if (category === '材质、配景与素材') {
      const colorClass = this.tagColors[tag] || 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/15';
      return `${baseClasses} ${colorClass}`;
    }
    
    // 默认样式
    return `${baseClasses} bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-300`;
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
