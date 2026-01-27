import { Component, inject, computed, signal, AfterViewInit, ViewChild, ElementRef, effect } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-encyclopedia',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="h-full flex flex-col p-6 md:p-8 overflow-hidden bg-[#0f0f11] text-white">
      
      <!-- Header Section -->
      <div class="flex flex-col items-center mb-8 shrink-0 space-y-2">
                <h1 class="text-3xl md:text-4xl font-bold tracking-wide">建筑百科</h1>
        <p class="text-gray-400 text-sm md:text-base max-w-2xl text-center">
          探索全面的建筑知识库
        </p>

        <!-- Search Input -->
        <div class="relative w-full max-w-2xl mt-4 flex gap-3">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input 
              type="text" 
              [ngModel]="searchQuery()"
              (ngModelChange)="updateSearch($event)"
              placeholder="搜索..." 
              class="w-full bg-[#18181b] text-white text-base placeholder-gray-500 rounded-xl border border-white/10 py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all shadow-lg"
            >
          </div>
          <!-- View Toggle Button -->
          <div class="flex bg-[#18181b] rounded-xl border border-white/10 p-1 shrink-0">
            <button 
              (click)="viewMode.set('grid')"
              class="p-2 rounded-lg transition-all"
              [class.bg-white/10]="viewMode() === 'grid'"
              [class.text-white]="viewMode() === 'grid'"
              [class.text-gray-500]="viewMode() !== 'grid'"
              [class.hover:text-gray-300]="viewMode() !== 'grid'"
              title="网格视图"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              (click)="viewMode.set('list')"
              class="p-2 rounded-lg transition-all"
              [class.bg-white/10]="viewMode() === 'list'"
              [class.text-white]="viewMode() === 'list'"
              [class.text-gray-500]="viewMode() !== 'list'"
              [class.hover:text-gray-300]="viewMode() !== 'list'"
              title="列表视图"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Categories Filter -->
      <div class="flex flex-nowrap gap-2 mb-6 shrink-0 overflow-x-auto pb-2 custom-scrollbar mask-gradient">
        <button 
          (click)="selectCategory('all')"
          class="flex-shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border border-transparent"
          [class.bg-white]="selectedCategory() === 'all'"
          [class.text-black]="selectedCategory() === 'all'"
          [class.bg-white/5]="selectedCategory() !== 'all'"
          [class.text-gray-300]="selectedCategory() !== 'all'"
          [class.hover:bg-white/10]="selectedCategory() !== 'all'"
        >全部</button>
        @for (cat of categories(); track cat) {
          <button 
            (click)="selectCategory(cat)"
             class="flex-shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border border-transparent"
            [class.bg-white]="selectedCategory() === cat"
            [class.text-black]="selectedCategory() === cat"
            [class.bg-white/5]="selectedCategory() !== cat"
            [class.text-gray-300]="selectedCategory() !== cat"
            [class.hover:bg-white/10]="selectedCategory() !== cat"
          >
            {{ cat }}
          </button>
        }
      </div>

      <!-- Content Grid -->
      <div id="encyclopedia-scroll-container" #scrollContainer (scroll)="onScroll()" class="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
        @if (filteredEntries().length === 0) {
          <div class="flex flex-col items-center justify-center h-60 opacity-50 text-center">
            <div class="text-4xl mb-4 grayscale">🏛️</div>
            <p class="font-medium text-lg">未找到相关条目</p>
            <p class="text-gray-500 text-sm mt-1">请尝试更换关键词或进入对应分类查找</p>
            <button 
              [routerLink]="['/about']"
              class="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/5"
            >
              向我们反馈
            </button>
          </div>
        }

        <div class="grid gap-6 pb-20" [class.grid-cols-1]="viewMode() === 'list'" [class.md:grid-cols-2]="viewMode() === 'grid'" [class.lg:grid-cols-3]="viewMode() === 'grid'" [class.xl:grid-cols-4]="viewMode() === 'grid'">
          @for (entry of filteredEntries(); track entry.id; let i = $index) {
            <a 
              [routerLink]="['/entry', entry.id]" 
              (click)="saveState(scrollContainer.scrollTop)" 
              class="group bg-[#18181b] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:translate-y-[-2px] hover:shadow-xl animate-fade-in-up"
              [class.flex]="viewMode() === 'list'"
              [class.flex-col]="viewMode() === 'grid'"
              [class.h-full]="viewMode() === 'grid'"
              [class.flex-row]="viewMode() === 'list'"
              [class.h-24]="viewMode() === 'list'"
              [style.animation-delay]="i < 12 ? (i * 50) + 'ms' : '0ms'"
            >
              <!-- Image Section -->
              <div class="overflow-hidden relative bg-gray-800" [class.h-48]="viewMode() === 'grid'" [class.h-full]="viewMode() === 'list'" [class.w-32]="viewMode() === 'list'" [class.shrink-0]="viewMode() === 'list'">
                @if (entry.imageUrl) {
                   <img [src]="entry.imageUrl" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" [style.object-position]="entry.imagePosition || 'center'" loading="lazy" [alt]="entry.term">
                } @else {
                   <!-- Fallback Pattern -->
                   <div class="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center relative">
                      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 20px 20px;"></div>
                      <span class="text-4xl opacity-30 select-none">Aa</span>
                   </div>
                }
                <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                  {{ entry.subcategory?.split(' ')[0] || '词条' }}
                </div>
              </div>

              <!-- Content Section -->
              <div class="flex flex-col flex-1 min-w-0" [class.p-4]="viewMode() === 'grid'" [class.p-2]="viewMode() === 'list'">
                <div class="flex justify-between items-start gap-2 mb-1 shrink-0">
                  <h3 class="font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-1" [class.text-lg]="viewMode() === 'grid'" [class.text-base]="viewMode() === 'list'">{{ entry.term }}</h3>
                  @if (entry.details?.includes('19')) {
                    <span class="text-xs font-mono text-gray-500 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">{{ extractYear(entry.details) }}</span>
                  }
                </div>
                
                <p class="text-xs text-gray-500 italic truncate shrink-0" [class.mb-3]="viewMode() === 'grid'" [class.mb-1]="viewMode() === 'list'">{{ entry.termEn }}</p>
                
                <p class="text-sm text-gray-400 line-clamp-3 mb-4 flex-1 leading-relaxed" [class.hidden]="viewMode() === 'list'">
                  {{ entry.definition }}
                </p>
                
                <div class="flex items-center justify-between mt-auto pt-4 border-t border-white/5" [class.border-t-0]="viewMode() === 'list'" [class.pt-0]="viewMode() === 'list'">
                   <span class="text-xs text-gray-600 font-medium truncate max-w-[70%]">{{ entry.category }}</span>
                   <div class="flex items-center text-xs font-medium text-gray-500 group-hover:text-white transition-colors">
                     阅读更多 
                     <svg class="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                     </svg>
                   </div>
                </div>
              </div>
            </a>
          }
        </div>
      </div>

      <!-- Admin Add Button -->
      @if (dataService.isAdmin()) {
        <button (click)="createNew()" title="添加新词条" class="absolute bottom-8 right-8 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-500 hover:scale-105 transition-all z-20">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
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
    .mask-gradient {
      mask-image: linear-gradient(to right, black 95%, transparent 100%);
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out backwards;
    }
  `]
})
export class EncyclopediaComponent implements AfterViewInit {
  dataService = inject(DataService);
  router: Router = inject(Router);
  searchQuery = signal('');
  selectedCategory = signal(this.dataService.encyclopediaSelectedCategory());
  viewMode = this.dataService.encyclopediaViewMode;
  displayLimit = signal(200);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  private categoryOrder = [
    "中国古代建筑", "西方古代建筑", "现代构造与系统", "建筑风格与设计思潮", 
    "结构与构造理论", "建筑材料与施工工艺", "可持续与绿色建筑", 
    "城市规划与公共空间", "室内设计与景观设计", "建筑法规、标准与项目管理", 
    "数字化、BIM 与智能建筑", "绘图与制图", "建筑史、理论与批评"
  ];

  constructor() {
    effect(() => {
      this.dataService.encyclopediaSelectedCategory.set(this.selectedCategory());
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = this.dataService.encyclopediaScrollPosition();
      }
    }, 0);
  }

  onScroll() {
    const element = this.scrollContainer.nativeElement;
    // Buffer of 200px
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 200) {
      if (this.displayLimit() < this._allFilteredEntries().length) {
        this.displayLimit.update(limit => limit + 100);
      }
    }
  }

  updateSearch(query: string) {
    this.searchQuery.set(query);
    this.displayLimit.set(200);
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }

  saveState(scrollTop: number) {
    this.dataService.encyclopediaScrollPosition.set(scrollTop);
  }

  categories = computed(() => {
    const cats = new Set<string>(this.dataService.entries().map(e => e.category));
    return Array.from(cats).sort((a: string, b: string) => {
      const idxA = this.categoryOrder.indexOf(a);
      const idxB = this.categoryOrder.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  });

  private _allFilteredEntries = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.selectedCategory();
    let list = this.dataService.entries().filter(e => {
      const matchCat = cat === 'all' || e.category === cat;
      const matchSearch = !q || e.term.toLowerCase().includes(q) || 
                          e.termEn.toLowerCase().includes(q) || 
                          e.definition.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
    return list; 
  });

  filteredEntries = computed(() => {
    return this._allFilteredEntries().slice(0, this.displayLimit());
  });

  selectCategory(category: string) {
    if (this.selectedCategory() !== category) {
      this.selectedCategory.set(category);
      this.displayLimit.set(200);
      this.dataService.encyclopediaScrollPosition.set(0);
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = 0;
      }
    }
  }

  createNew() {
    const currentCat = this.selectedCategory() === 'all' ? '未分类' : this.selectedCategory();
    const newId = 'custom_' + Date.now();
    const newEntry = {
      id: newId,
      category: currentCat,
      subcategory: '新增',
      term: '新词条 (点击编辑)',
      termEn: 'New Entry',
      definition: '请点击上方“编辑”按钮修改此内容。',
      details: '在此处添加详细内容...',
      imageUrl: '',
      isCustom: true
    };
    this.dataService.addEntry(newEntry);
    this.router.navigate(['/entry', newId], { queryParams: { edit: 'true' } });
  }

  extractYear(details: string): string {
    const match = details.match(/\b(18|19|20)\d{2}\b/);
    return match ? match[0] : '';
  }
}