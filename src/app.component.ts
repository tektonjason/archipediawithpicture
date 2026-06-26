
// =================================================================
//
//  ARCHIPEDIA - Knowledge Base
//  Built by 曾若宽 (Zeng Ruokuan)
//
//  This content is for educational purposes only.
//  Unauthorized commercial use is strictly prohibited.
//
// =================================================================
import { Component, inject, signal, computed, OnInit, OnDestroy, effect, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DataService } from './services/data.service';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { Subscription, filter } from 'rxjs';
import { GsapHoverTooltipDirective } from './components/shared/gsap-hover-tooltip.directive';
import { GsapCardHoverDirective } from './components/shared/gsap-card-hover.directive';
import { AnalyticsService } from './services/analytics.service';

import { SplashScreenComponent } from './components/shared/splash-screen.component';
import { APP_UI_ICONS } from './components/shared/ui-icons';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, GsapHoverTooltipDirective, GsapCardHoverDirective, SplashScreenComponent, ...APP_UI_ICONS],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  dataService = inject(DataService);
  private analytics = inject(AnalyticsService);
  private router = inject(Router);

  showSplash = signal(true);
  showUpdateNotice = signal(false);
  readonly updateNoticeDate = '2026.06.26';
  readonly lastUpdatedDate = '2026.06.26';
  readonly updateNoticeItems = [
    '建筑读物新增主题书单、书籍/期刊切换与更顺手的详情浏览。',
    '支持 GB/T 7714-2015 文献引用，一键复制或下载引用文本。',
    '百科和读物可生成分享卡片，方便保存与转发。',
    '百科详情新增内容纠错反馈，发现问题可以直接提交说明。'
  ];
  private readonly updateNoticeStorageKey = 'arch_update_notice_seen_2026_06_26';

  // Q&A Carousel Data
  qaQuestions = [
    "快题和课程设计有什么区别？", "SU插件在哪找？", "SU和犀牛哪个好？", "分析图画什么？", 
    "做设计无从下手？", "CAD怎么导出？", "CAD分解不了图块？", "SU模型不是实体？", 
    "Vray怎么批量渲染？", "历史沿革图怎么做？", "BIG风格的分析图怎么做？", 
    "公共设施的服务半径？", "ps怎么扣文字？", "论文参考文献怎么写？", 
    "CAD参考图怎么缩放到真实尺寸？", "怎么下载卫星图？", "怎么下载平面图？", 
    "效果图怎么画？", "可以刻图吗？", "手绘怎么练？", "马克笔怎么买？", 
    "看了案例也不知道怎么做？", "设计要从平面开始吗？", "周边场地怎么设计？", 
    "作品集是什么？", "多久开始做作品集？", "作品集要包括什么？", 
    "我需要学绘画吗？", "为什么我画不完图？", "Rhino模型又大又卡？", 
    "SU建出来的模型乱七八糟？", "建筑学就业有哪些？", "参数化设计要学吗？", 
    "AI怎么用于建筑设计？", "出图用PS合适吗？", "抄绘要抄什么?", 
    "古建筑测绘图怎么画？", "为什么每次都陷入拖延症？"
  ];
  
  currentQuestionIndex = signal(0);
  currentQuestion = computed(() => this.qaQuestions[this.currentQuestionIndex()]);
  private carouselInterval: any;

  // isSidebarOpen signal removed; using dataService.isSidebarOpen

  // Footer visibility state - Sidebar version
  isSidebarFooterCollapsed = signal(false);
  
  // Main Footer visibility (kept for backward compatibility if needed, but we are moving content to sidebar)
  isFooterVisible = signal(true);

  private sidebarTl!: gsap.core.Timeline;
  private mm!: gsap.MatchMedia;
  private routerEventsSub?: Subscription;
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  private hasHandledInitialNavigation = false;
  private isFirstRun = true;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  canInstallApp = signal(false);
  currentUrl = signal('');
  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.stopCarousel();
    } else {
      this.startCarousel();
    }
  };
  private handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
    if (!this.isRunningAsInstalledApp()) {
      this.canInstallApp.set(true);
    }
  };
  private handleAppInstalled = () => {
    this.deferredInstallPrompt = null;
    this.canInstallApp.set(false);
    this.dataService.displayToast('应用已安装');
  };

  constructor() {
    // Check local storage for footer visibility state and apply it
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const footerState = localStorage.getItem('arch_footer_visible');
      if (footerState === 'false') {
        this.isFooterVisible.set(false);
      }
      
      const sidebarFooterState = localStorage.getItem('arch_sidebar_footer_collapsed');
      if (sidebarFooterState === 'true') {
        this.isSidebarFooterCollapsed.set(true);
      }
    }

    // Effect to react to sidebar state changes and trigger GSAP animations
    effect(() => {
      const isOpen = this.dataService.isSidebarOpen();
      // Skip animation on initial load to avoid flash, just set state
      if (this.isFirstRun) {
        this.isFirstRun = false;
        // The matchMedia setup will handle the initial state
        return;
      }
      this.animateSidebar(isOpen);
    });
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      if (!document.hidden) {
        this.startCarousel();
      }
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', this.handleAppInstalled);
    }
    this.currentUrl.set(this.router.url);
    this.routerEventsSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const path = event.urlAfterRedirects || event.url;
        this.currentUrl.set(path);
        this.analytics.trackPageView(path, document.title, this.hasHandledInitialNavigation);
        this.hasHandledInitialNavigation = true;
      });
  }

  ngAfterViewInit() {
    // Initialize GSAP matchMedia for responsive sidebar
    this.mm = gsap.matchMedia();
    const isOpen = this.dataService.isSidebarOpen();

    this.mm.add("(min-width: 768px)", () => {
      // Desktop: animate width
      gsap.set("#sidebar-panel", { width: isOpen ? "16rem" : "0rem" });
      if (isOpen) {
        gsap.set(".nav-item", { opacity: 1, x: 0 });
        gsap.set(".bar-top", { attr: { x1: 5, y1: 5, x2: 15, y2: 15 } });
        gsap.set(".bar-bot", { attr: { x1: 15, y1: 5, x2: 5, y2: 15 } });
      } else {
        gsap.set(".nav-item", { opacity: 0, x: -20 });
        gsap.set(".bar-top", { attr: { x1: 3, y1: 6, x2: 17, y2: 6 } });
        gsap.set(".bar-bot", { attr: { x1: 3, y1: 14, x2: 17, y2: 14 } });
      }
    });

    this.mm.add("(max-width: 767px)", () => {
      // Mobile: animate xPercent
      gsap.set("#sidebar-panel", { width: "16rem", xPercent: isOpen ? 0 : -100 });
      if (isOpen) {
        gsap.set(".nav-item", { opacity: 1, x: 0 });
        gsap.set(".bar-top", { attr: { x1: 5, y1: 5, x2: 15, y2: 15 } });
        gsap.set(".bar-bot", { attr: { x1: 15, y1: 5, x2: 5, y2: 15 } });
      } else {
        gsap.set(".nav-item", { opacity: 0, x: -20 });
        gsap.set(".bar-top", { attr: { x1: 3, y1: 6, x2: 17, y2: 6 } });
        gsap.set(".bar-bot", { attr: { x1: 3, y1: 14, x2: 17, y2: 14 } });
      }
    });
  }

  ngOnDestroy() {
    this.stopCarousel();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', this.handleAppInstalled);
    }
    this.routerEventsSub?.unsubscribe();
    if (this.sidebarTl) this.sidebarTl.kill();
    if (this.mm) this.mm.revert();
  }

  animateSidebar(isOpen: boolean) {
    if (this.sidebarTl) {
      this.sidebarTl.kill();
    }
    this.sidebarTl = gsap.timeline();
    this.notifyLayoutShift();
    
    const isDesktop = window.innerWidth >= 768;
    const openDuration = this.prefersReducedMotion ? 0.01 : 0.34;
    const closeDuration = this.prefersReducedMotion ? 0.01 : 0.24;
    const itemDuration = this.prefersReducedMotion ? 0.01 : 0.24;

    if (isOpen) {
      // Open Menu
      this.sidebarTl
        // 1. Sidebar Panel Animation
        .to("#sidebar-panel", {
          width: isDesktop ? "16rem" : "16rem",
          xPercent: isDesktop ? 0 : 0,
          duration: openDuration,
          ease: "power3.out"
        }, 0)
        // 2. Nav Items Stagger In
        .fromTo(".nav-item", 
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: itemDuration, ease: "power2.out", stagger: 0.025, overwrite: "auto" },
          0.06
        )
        // 3. Hamburger Morph to X
        .to(".bar-top", {
          attr: { x1: 5, y1: 5, x2: 15, y2: 15 },
          duration: itemDuration,
          ease: "power2.out"
        }, 0)
        .to(".bar-bot", {
          attr: { x1: 15, y1: 5, x2: 5, y2: 15 },
          duration: itemDuration,
          ease: "power2.out"
        }, 0)
        .call(() => this.notifyLayoutShift());
        
    } else {
      // Close Menu
      this.sidebarTl
        // 1. Nav Items Fall Out
        .to(".nav-item", {
          x: -12,
          opacity: 0,
          duration: closeDuration,
          ease: "power2.in",
          stagger: { from: "end", each: 0.012 },
          overwrite: "auto"
        }, 0)
        // 2. Sidebar Panel Animation
        .to("#sidebar-panel", {
          width: isDesktop ? "0rem" : "16rem",
          xPercent: isDesktop ? 0 : -100,
          duration: closeDuration,
          ease: "power2.inOut"
        }, 0.12)
        // 3. X Morph to Hamburger
        .to(".bar-top", {
          attr: { x1: 3, y1: 6, x2: 17, y2: 6 },
          duration: closeDuration,
          ease: "power2.inOut"
        }, 0)
        .to(".bar-bot", {
          attr: { x1: 3, y1: 14, x2: 17, y2: 14 },
          duration: closeDuration,
          ease: "power2.inOut"
        }, 0)
        // Reset nav-item transforms so they are ready for the next open
        .set(".nav-item", { clearProps: "x" })
        .call(() => this.notifyLayoutShift());
    }
  }

  private notifyLayoutShift() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('archipedia:layout-shift'));
    }
  }

  startCarousel() {
    if (this.carouselInterval) return;

    this.carouselInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * this.qaQuestions.length);
      this.currentQuestionIndex.set(randomIndex);
    }, 4000);
  }

  stopCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  handleCarouselClick() {
    this.router.navigate(['/essentials'], { queryParams: { openQna: 'true' } });
  }

  isUserTabActive(tab: 'favorites' | 'history'): boolean {
    const url = this.currentUrl() || this.router.url;
    const [path, queryString = ''] = url.split('?');
    if (!path.startsWith('/user')) return false;

    const activeTab = new URLSearchParams(queryString).get('tab') === 'history'
      ? 'history'
      : 'favorites';
    return activeTab === tab;
  }

  toggleSidebarFooter() {
    this.isSidebarFooterCollapsed.update(v => !v);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('arch_sidebar_footer_collapsed', String(this.isSidebarFooterCollapsed()));
    }
  }

  hideFooter() {
    if (this.isFooterVisible()) {
      this.isFooterVisible.set(false);
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('arch_footer_visible', 'false');
      }
    }
  }

  toggleSidebar() {
    this.dataService.toggleSidebar();
  }

  async installApp() {
    const promptEvent = this.deferredInstallPrompt;
    if (!promptEvent) {
      this.canInstallApp.set(false);
      this.dataService.displayToast('请使用浏览器菜单添加到主屏幕');
      return;
    }

    this.canInstallApp.set(false);
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    this.deferredInstallPrompt = null;

    if (choice.outcome === 'accepted') {
      this.dataService.displayToast('正在安装应用');
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.showUpdateNotice()) {
      this.dismissUpdateNotice();
      return;
    }

    if (this.dataService.showExternalModal()) {
      this.dataService.closeExternalModal();
      return;
    }

    if (this.dataService.showLoginModal()) {
      this.dataService.closeLoginModal();
      return;
    }

    if (this.dataService.showLogoutModal()) {
      this.dataService.showLogoutModal.set(false);
      return;
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768 && this.dataService.isSidebarOpen()) {
      this.dataService.setSidebarState(false);
    }
  }

  onSplashEnter() {
    this.showSplash.set(false);
    this.scheduleUpdateNotice();
  }

  dismissUpdateNotice() {
    this.showUpdateNotice.set(false);
    if (this.canUseLocalStorage()) {
      localStorage.setItem(this.updateNoticeStorageKey, 'true');
    }
  }

  private scheduleUpdateNotice() {
    if (!this.shouldShowUpdateNotice()) return;
    const delay = this.prefersReducedMotion ? 80 : 520;
    window.setTimeout(() => {
      if (this.shouldShowUpdateNotice()) {
        this.showUpdateNotice.set(true);
      }
    }, delay);
  }

  private shouldShowUpdateNotice(): boolean {
    if (!this.canUseLocalStorage()) return false;
    return localStorage.getItem(this.updateNoticeStorageKey) !== 'true';
  }

  private canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private isRunningAsInstalledApp(): boolean {
    if (typeof window === 'undefined') return false;
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
  }
}
