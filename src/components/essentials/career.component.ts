
import { Component, OnInit, signal, computed, ElementRef, ViewChild, HostListener, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

interface CareerNode {
  id: number;
  name: string;
  category: 'design' | 'tech' | 'art' | 'management' | 'specialized';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number; // pixel size for the dot
  animationClass: string;
  animationDelay: string;
  animationDuration: string;
}

@Component({
  selector: 'app-career',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-full flex flex-col bg-[#0f0f11] text-gray-300 overflow-hidden relative font-sans">
      <!-- Background Grid (Dark Mode) -->
      <div class="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style="background-image: radial-gradient(#ffffff 1.5px, transparent 1.5px); background-size: 50px 50px;">
      </div>

      <!-- Header -->
      <div class="absolute top-0 left-0 right-0 z-20 px-4 pt-4 md:pl-24 flex items-center gap-4 pointer-events-none">
        <a routerLink="/essentials" class="pointer-events-auto ml-12 md:ml-0 px-4 py-2 rounded-lg bg-[#18181b]/80 backdrop-blur-md border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors text-gray-300 hover:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </a>
        <div class="pointer-events-auto">
          <h2 class="text-lg md:text-xl font-bold text-white shadow-black drop-shadow-md">就业方向概览</h2>
          <p class="text-[10px] md:text-xs text-gray-400 mt-0.5 shadow-black drop-shadow-md">Career Path Universe</p>
        </div>
      </div>

      <!-- Interactive Universe Container -->
      <div #universeContainer class="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
           (mousedown)="startDrag($event)"
           (touchstart)="startDrag($event)"
           (wheel)="onWheel($event)">
        
        <!-- Pan/Zoom Content Layer -->
        <div class="absolute inset-0 origin-center transition-transform duration-100 ease-out will-change-transform"
             [style.transform]="'translate(' + panX() + 'px, ' + panY() + 'px) scale(' + scale() + ')'">
          
          <!-- Central Hub (Fixed Center, No Floating) -->
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center">
            <!-- Glowing Aura -->
            <div class="absolute inset-0 -m-16 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
            
            <!-- Central Circle -->
            <div class="w-28 h-28 md:w-40 md:h-40 rounded-full bg-[#18181b] border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center text-center p-4 relative z-10">
               <div class="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Start Here</div>
               <h1 class="text-base md:text-xl font-bold text-white leading-tight">Architecture<br><span class="text-xs md:text-sm font-normal text-gray-400">建筑学</span></h1>
               
               <!-- Icons row -->
               <div class="flex gap-2 md:gap-3 mt-2 md:mt-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.552 50.552 0 00-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.551 50.551 0 0112-3.342" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
               </div>
            </div>
          </div>

          <!-- Career Nodes -->
          @for (node of nodes(); track node.id) {
            <div class="absolute flex items-center gap-3 group will-change-transform cursor-pointer transition-[left,top] duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                 (click)="openSearch(node.name)"
                 [style.left.%]="isExpanded() ? node.x : 50"
                 [style.top.%]="isExpanded() ? node.y : 50"
                 [class]="node.animationClass"
                 [style.animation-delay]="node.animationDelay"
                 [style.animation-duration]="node.animationDuration">
               
               <!-- Node Dot -->
               <div class="rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-150 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    [class]="getNodeColorClass(node.category)"
                    [style.width.px]="node.size"
                    [style.height.px]="node.size">
               </div>

               <!-- Label -->
               @if (isDesktop || scale() > 1.1) {
                 <div class="text-xs font-medium text-gray-400 group-hover:text-white transition-colors whitespace-nowrap cursor-pointer shadow-black drop-shadow-sm">
                   {{ node.name }}
                 </div>
               }
            </div>
          }
        </div>
      </div>

      <!-- Controls -->
      <div class="absolute bottom-8 right-8 flex flex-col items-end gap-2 z-20">
        <div class="flex flex-col gap-2">
          <button (click)="zoomIn()" class="p-3 bg-[#18181b]/80 backdrop-blur-md border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button (click)="zoomOut()" class="p-3 bg-[#18181b]/80 backdrop-blur-md border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>
          <button (click)="resetView()" class="p-3 bg-[#18181b]/80 backdrop-blur-md border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        <div class="bg-[#18181b]/80 backdrop-blur-md border border-white/10 rounded-xl p-2 flex flex-col gap-1.5 shadow-xl">
           <div class="flex items-center gap-2 text-[10px] font-medium text-gray-400 tracking-wider mb-0.5 px-1">
             <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> 设计</div>
             <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> 技术</div>
             <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> 艺术</div>
             <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></span> 管理</div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Randomized floating animations */
    @keyframes float-1 {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(10px, -10px); }
      66% { transform: translate(-5px, 8px); }
    }
    @keyframes float-2 {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(-8px, -5px); }
      66% { transform: translate(6px, 12px); }
    }
    @keyframes float-3 {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(5px, 10px); }
      66% { transform: translate(-10px, -5px); }
    }
    @keyframes float-4 {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(-5px, 8px); }
      66% { transform: translate(8px, -8px); }
    }

    .animate-float-1 { animation-name: float-1; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
    .animate-float-2 { animation-name: float-2; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
    .animate-float-3 { animation-name: float-3; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
    .animate-float-4 { animation-name: float-4; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }

    @keyframes pulse-slow {
      0%, 100% { opacity: 0.1; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.1); }
    }
    
    .animate-pulse-slow {
      animation: pulse-slow 8s ease-in-out infinite;
    }
  `]
})
export class CareerComponent implements OnInit {
  nodes = signal<CareerNode[]>([]);
  
  // Viewport State
  scale = signal(1);
  panX = signal(0);
  panY = signal(0);
  isExpanded = signal(false); // Controls the burst animation
  isDesktop = window.innerWidth >= 768;
  
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  dataService = inject(DataService);

  private readonly rawCareers = [
    '策展人', '景观建筑师', '工业设计师', '动画师', '太阳能工程师', '建筑设计师', '绘图员', '设计策略师', 
    '网页设计师', '建筑学教授', '品牌体验设计师', '文案撰稿人', '电子游戏设计师', '建筑师', '计算设计师', 
    '美术教师', '机电一体化工程师', '船舶设计师', '计算机工程师', '架构师', '电子竞技运营', '游戏设计师', 
    '数据工程师', 'UI / UX 设计师', '开发者', '作家 / 撰稿人', '城市/交通规划师', '体验设计师', 
    '互动媒体艺术家', '创意总监', '文化体验开发者', '工程造价师', 'BIM 管理', '能耗模拟师', 
    '绿色建筑认证顾问', '幕墙工程师', '照明设计师', '声学顾问', '建筑材料研发', '数字制造', 
    '室内设计师', '舞台/影视布景', '城市数据分析师', '文物/古建保护', '媒体从业者', 
    '建筑软件开发', 'AR/VR', '交互设计', '城市规划', '城市设计', '应急设计', '建成环境',
    // 您可以在此处添加新职业，直接追加字符串即可：
    // '新职业名称',
  ];

  ngOnInit() {
    this.initNodes();
    // Trigger burst animation after a short delay
    setTimeout(() => {
      this.isExpanded.set(true);
    }, 100);
  }

  initNodes() {
    const uniqueCareers = Array.from(new Set(this.rawCareers));
    const total = uniqueCareers.length;
    
    // Golden Angle for Phyllotaxis distribution (even packing)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // Detect mobile for larger spread
    const isMobile = window.innerWidth < 768;
    const spreadFactor = isMobile ? 6.5 : 4.5;

    const nodes: CareerNode[] = uniqueCareers.map((name, index) => {
      const category = this.determineCategory(name);
      
      // Phyllotaxis Formula:
      // r = c * sqrt(n), theta = n * 137.5 deg
      // We skip the first few indices to leave a hole in the middle for the "Center Hub"
      const n = index + 12; // Start from 12 to leave empty space in center
      const r = spreadFactor * Math.sqrt(n); // Scaling factor determines spread
      const theta = n * goldenAngle;

      // Convert to Cartesian percentages (centered at 50, 50)
      // Add slight randomness to break perfect mathematical pattern
      const jitterAngle = (Math.random() - 0.5) * 0.2; 
      const jitterRadius = (Math.random() - 0.5) * 2;
      
      const x = 50 + (r + jitterRadius) * Math.cos(theta + jitterAngle) * 1.4; // Multiply X by 1.4 for aspect ratio
      const y = 50 + (r + jitterRadius) * Math.sin(theta + jitterAngle);

      // Randomize animation type
      const animType = Math.floor(Math.random() * 4) + 1;

      return {
        id: index,
        name,
        category,
        x,
        y,
        size: (isMobile ? 6 : 8) + Math.random() * 4, // Smaller nodes on mobile
        animationClass: `animate-float-${animType}`,
        animationDelay: `-${Math.random() * 5}s`,
        animationDuration: `${6 + Math.random() * 4}s`, // Slower, more relaxed floating
      };
    });
    
    this.nodes.set(nodes);
  }

  determineCategory(name: string): CareerNode['category'] {
    // 如果您添加了新职业，请确保它能被以下逻辑正确分类。
    // 如果现有关键词无法覆盖，请在此处添加新的关键词判断。
    if (name.includes('工程师') || name.includes('开发') || name.includes('数据') || name.includes('BIM') || name.includes('计算')) return 'tech';
    if (name.includes('艺术') || name.includes('动画') || name.includes('游戏') || name.includes('美术') || name.includes('布景')) return 'art';
    if (name.includes('管理') || name.includes('总监') || name.includes('策略') || name.includes('造价')) return 'management';
    if (name.includes('顾问') || name.includes('认证') || name.includes('模拟') || name.includes('声学') || name.includes('照明')) return 'specialized';
    return 'design'; 
  }

  getNodeColorClass(category: CareerNode['category']): string {
    switch(category) {
      case 'design': return 'bg-blue-500';
      case 'tech': return 'bg-emerald-500';
      case 'art': return 'bg-amber-500';
      case 'management': return 'bg-purple-500';
      case 'specialized': return 'bg-gray-400';
    }
  }

  // --- Pan & Zoom Logic ---

  startDrag(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    if (event instanceof MouseEvent) {
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    } else if (event.touches.length > 0) {
      this.lastMouseX = event.touches[0].clientX;
      this.lastMouseY = event.touches[0].clientY;
    }
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
    
    if (event instanceof TouchEvent) {
        // event.preventDefault(); 
    }

    let clientX, clientY;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      return;
    }

    const deltaX = clientX - this.lastMouseX;
    const deltaY = clientY - this.lastMouseY;

    this.panX.update(v => v + deltaX);
    this.panY.update(v => v + deltaY);

    this.lastMouseX = clientX;
    this.lastMouseY = clientY;
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  stopDrag() {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomIntensity = 0.1;
    const delta = -Math.sign(event.deltaY);
    const newScale = this.scale() + (delta * zoomIntensity);
    
    // Clamp scale
    if (newScale >= 0.5 && newScale <= 3) {
      this.scale.set(newScale);
    }
  }

  zoomIn() {
    this.scale.update(s => Math.min(s + 0.2, 3));
  }

  zoomOut() {
    this.scale.update(s => Math.max(s - 0.2, 0.5));
  }

  resetView() {
    this.scale.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  openSearch(keyword: string) {
    const query = encodeURIComponent(`什么是${keyword}`);
    const url = `https://www.bing.com/search?q=${query}`;
    this.dataService.openExternalModal(url);
  }
}
