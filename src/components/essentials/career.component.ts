
import { Component, OnInit, OnDestroy, signal, computed, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { LocaleService } from '../../services/locale.service';
import { APP_UI_ICONS } from '../shared/ui-icons';

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

const CAREER_TRANSLATIONS: Record<string, string> = {
  '策展人': 'Curator',
  '景观建筑师': 'Landscape Architect',
  '工业设计师': 'Industrial Designer',
  '动画师': 'Animator',
  '太阳能工程师': 'Solar Energy Engineer',
  '建筑设计师': 'Architectural Designer',
  '绘图员': 'Draftsperson',
  '设计策略师': 'Design Strategist',
  '网页设计师': 'Web Designer',
  '建筑学教授': 'Architecture Professor',
  '品牌体验设计师': 'Brand Experience Designer',
  '文案撰稿人': 'Copywriter',
  '电子游戏设计师': 'Video Game Designer',
  '建筑师': 'Architect',
  '计算设计师': 'Computational Designer',
  '美术教师': 'Art Teacher',
  '机电一体化工程师': 'Mechatronics Engineer',
  '船舶设计师': 'Naval Designer',
  '计算机工程师': 'Computer Engineer',
  '架构师': 'Systems Architect',
  '电子竞技运营': 'Esports Operations',
  '游戏设计师': 'Game Designer',
  '数据工程师': 'Data Engineer',
  'UI / UX 设计师': 'UI / UX Designer',
  '开发者': 'Developer',
  '作家 / 撰稿人': 'Writer / Copywriter',
  '城市/交通规划师': 'Urban / Transport Planner',
  '体验设计师': 'Experience Designer',
  '互动媒体艺术家': 'Interactive Media Artist',
  '创意总监': 'Creative Director',
  '文化体验开发者': 'Cultural Experience Developer',
  '工程造价师': 'Cost Engineer',
  'BIM 管理': 'BIM Manager',
  '能耗模拟师': 'Energy Simulation Specialist',
  '绿色建筑认证顾问': 'Green Building Certification Consultant',
  '幕墙工程师': 'Facade Engineer',
  '照明设计师': 'Lighting Designer',
  '声学顾问': 'Acoustic Consultant',
  '建筑材料研发': 'Building Materials R&D',
  '数字制造': 'Digital Fabrication',
  '室内设计师': 'Interior Designer',
  '舞台/影视布景': 'Stage / Film Set Designer',
  '城市数据分析师': 'Urban Data Analyst',
  '文物/古建保护': 'Heritage Conservation Specialist',
  '媒体从业者': 'Media Practitioner',
  '建筑软件开发': 'Architecture Software Developer',
  'AR/VR': 'AR / VR',
  '交互设计': 'Interaction Design',
  '城市规划': 'Urban Planning',
  '城市设计': 'Urban Design',
  '应急设计': 'Emergency Design',
  '建成环境': 'Built Environment'
};

@Component({
  selector: 'app-career',
  imports: [CommonModule, RouterLink, ...APP_UI_ICONS],
  template: `
    <div class="ui-page relative font-sans">
      <!-- Background Grid (Dark Mode) -->
      <div class="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style="background-image: radial-gradient(#ffffff 1.5px, transparent 1.5px); background-size: 50px 50px;">
      </div>

      <!-- Header -->
      <div class="absolute top-0 left-0 right-0 z-20 px-4 pt-4 md:pl-24 flex items-center gap-4 pointer-events-none">
        <a routerLink="/essentials" class="pointer-events-auto ml-12 md:ml-0 ui-btn-secondary bg-surface/80 backdrop-blur-md">
          <svg lucideArrowLeft class="w-4 h-4" [strokeWidth]="2"></svg>
          {{ displayText('返回') }}
        </a>
        <div class="pointer-events-auto">
          <h2 class="text-lg md:text-xl font-bold text-white shadow-black drop-shadow-md">{{ displayText('就业方向概览') }}</h2>
          <p class="text-[10px] md:text-xs text-gray-400 mt-0.5 shadow-black drop-shadow-md">Career Path Universe</p>
        </div>
      </div>

      <!-- Interactive Universe Container -->
      <div #universeContainer class="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
           (mousedown)="startDrag($event)"
           (touchstart)="startDrag($event)"
           (wheel)="onWheel($event)">
        
        <!-- Pan/Zoom Content Layer -->
        <div class="absolute inset-0 origin-center ease-out will-change-transform"
             [class.transition-transform]="!isDraggingView()"
             [class.duration-100]="!isDraggingView()"
              [style.transform]="'translate(' + panX() + 'px, ' + panY() + 'px) scale(' + scale() + ')'">
          
          <!-- Central Hub (Fixed Center, No Floating) -->
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center">
            <!-- Glowing Aura -->
            <div class="absolute inset-0 -m-16 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
            
            <!-- Central Circle -->
            <div class="w-28 h-28 md:w-40 md:h-40 rounded-full bg-surface border border-line shadow-[0_0_50px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center text-center p-4 relative z-10">
               <div class="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Start Here</div>
               <h1 class="text-base md:text-xl font-bold text-white leading-tight">Architecture<br><span class="text-xs md:text-sm font-normal text-gray-400">{{ displayText('建筑学') }}</span></h1>
               
               <!-- Icons row -->
               <div class="flex gap-2 md:gap-3 mt-2 md:mt-3 text-gray-500">
                  <svg lucideSchool class="w-4 h-4 md:w-5 md:h-5" [strokeWidth]="1.6"></svg>
                  <svg lucideSettings class="w-4 h-4 md:w-5 md:h-5" [strokeWidth]="1.6"></svg>
               </div>
            </div>
          </div>

          <!-- Career Nodes -->
          @for (node of nodes(); track node.id) {
            <div class="absolute flex items-center gap-3 group cursor-pointer transition-[left,top] duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
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
                   {{ displayCareerName(node.name) }}
                 </div>
               }
            </div>
          }
        </div>
      </div>

      <!-- Controls -->
      <div class="absolute bottom-8 right-8 flex flex-col items-end gap-2 z-20">
        <div class="flex flex-col gap-2">
          <button (click)="zoomIn()" class="ui-icon-btn bg-surface/80 backdrop-blur-md shadow-lg">
            <svg lucideZoomIn class="w-5 h-5" [strokeWidth]="2"></svg>
          </button>
          <button (click)="zoomOut()" class="ui-icon-btn bg-surface/80 backdrop-blur-md shadow-lg">
            <svg lucideZoomOut class="w-5 h-5" [strokeWidth]="2"></svg>
          </button>
          <button (click)="resetView()" class="ui-icon-btn bg-surface/80 backdrop-blur-md shadow-lg">
            <svg lucideRefreshCcw class="w-5 h-5" [strokeWidth]="2"></svg>
          </button>
        </div>

        <div class="bg-surface/80 backdrop-blur-md border border-line rounded-card p-2 flex flex-col gap-1.5 shadow-panel">
           <div class="flex items-center gap-2 text-[10px] font-medium text-gray-400 tracking-wider mb-0.5 px-1">
             <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> {{ displayText('设计') }}</div>
             <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> {{ displayText('技术') }}</div>
             <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> {{ displayText('艺术') }}</div>
             <div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></span> {{ displayText('管理') }}</div>
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

    @media (prefers-reduced-motion: reduce) {
      .animate-float-1,
      .animate-float-2,
      .animate-float-3,
      .animate-float-4,
      .animate-pulse-slow {
        animation: none !important;
      }
    }
  `]
})
export class CareerComponent implements OnInit, OnDestroy {
  nodes = signal<CareerNode[]>([]);
  
  // Viewport State
  scale = signal(1);
  panX = signal(0);
  panY = signal(0);
  isExpanded = signal(false); // Controls the burst animation
  isDraggingView = signal(false);
  isDesktop = window.innerWidth >= 768;
  
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private pendingPanX = 0;
  private pendingPanY = 0;
  private dragFrame = 0;
  private expandTimer: ReturnType<typeof setTimeout> | null = null;

  dataService = inject(DataService);
  locale = inject(LocaleService);

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
    this.expandTimer = setTimeout(() => {
      this.isExpanded.set(true);
    }, 100);
  }

  ngOnDestroy() {
    if (this.expandTimer) clearTimeout(this.expandTimer);
    if (this.dragFrame) cancelAnimationFrame(this.dragFrame);
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
    this.isDraggingView.set(true);
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

    this.pendingPanX += deltaX;
    this.pendingPanY += deltaY;
    this.schedulePanFlush();

    this.lastMouseX = clientX;
    this.lastMouseY = clientY;
  }

  private schedulePanFlush() {
    if (this.dragFrame) return;

    this.dragFrame = requestAnimationFrame(() => {
      this.dragFrame = 0;
      const deltaX = this.pendingPanX;
      const deltaY = this.pendingPanY;
      this.pendingPanX = 0;
      this.pendingPanY = 0;

      if (!deltaX && !deltaY) return;

      this.panX.update(v => v + deltaX);
      this.panY.update(v => v + deltaY);
    });
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  stopDrag() {
    this.isDragging = false;
    this.isDraggingView.set(false);
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
    const queryText = this.locale.isEnglish() ? `What is ${this.displayCareerName(keyword)} in architecture?` : `什么是${keyword}`;
    const query = encodeURIComponent(queryText);
    const url = `https://www.bing.com/search?q=${query}`;
    this.dataService.openExternalModal(url);
  }

  displayText(value: string): string {
    return this.locale.translateData(value);
  }

  displayCareerName(name: string): string {
    if (!this.locale.isEnglish()) return name;
    return CAREER_TRANSLATIONS[name] ?? this.locale.translateData(name, 'Architecture Career');
  }
}
