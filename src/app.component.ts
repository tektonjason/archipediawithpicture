
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
import { LocaleService } from './services/locale.service';

import { SplashScreenComponent } from './components/shared/splash-screen.component';
import { APP_UI_ICONS } from './components/shared/ui-icons';
import { LocalizeTextDirective } from './components/shared/localize-text.directive';
import { ModalA11yDirective } from './components/shared/modal-a11y.directive';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, GsapHoverTooltipDirective, GsapCardHoverDirective, LocalizeTextDirective, ModalA11yDirective, SplashScreenComponent, ...APP_UI_ICONS],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  dataService = inject(DataService);
  locale = inject(LocaleService);
  private analytics = inject(AnalyticsService);
  private router = inject(Router);

  showSplash = signal(true);
  showUpdateNotice = signal(false);
  readonly updateNoticeDate = '2026.08.20';
  readonly lastUpdatedDate = '2026.08.20';
  readonly updateNoticeItems = [
    '新增灵感库，整合院校展览与建筑资讯，并加入分类清晰、需身份验证的项目资料下载；推荐标识同步优化。',
    '更新应用设计规范与全局交互动效，按钮、卡片、弹窗和提示反馈更加统一、轻快。',
    '新增中英双语界面切换，可在关于应用中切换语言，英文界面已覆盖卡片、详情页与主要功能模块。',
    '资源库新增卡片视图；规范速查新增常用条文、收藏、笔记与纠错反馈。',
    '新增本地笔记与统一用户中心，可集中查看收藏、历史和笔记。',
    '百科、读物与资源库支持分享卡片，便于保存和转发。',
    '首页建筑资讯支持自动获取与刷新，内容会以中文摘要展示。'
  ];
  private readonly updateNoticeStorageKey = 'arch_update_notice_seen_2026_08_20_inspiration_library';
  private readonly servicesNavCometStorageKey = 'arch_services_nav_comet_seen_2026_07_05_v2';

  @ViewChild('servicesNavItem', { read: ElementRef }) private servicesNavItem?: ElementRef<HTMLElement>;
  @ViewChild('sidebarPanel', { read: ElementRef }) private sidebarPanel?: ElementRef<HTMLElement>;
  @ViewChild('menuBarTop', { read: ElementRef }) private menuBarTop?: ElementRef<SVGLineElement>;
  @ViewChild('menuBarBottom', { read: ElementRef }) private menuBarBottom?: ElementRef<SVGLineElement>;

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

  displayText(value: string | null | undefined): string {
    return this.locale.translateData(value);
  }

  // isSidebarOpen signal removed; using dataService.isSidebarOpen

  // Footer visibility state - Sidebar version
  isSidebarFooterCollapsed = signal(false);
  
  // Main Footer visibility (kept for backward compatibility if needed, but we are moving content to sidebar)
  isFooterVisible = signal(true);

  private sidebarTl!: gsap.core.Timeline;
  private servicesNavCometTl?: gsap.core.Timeline;
  private mm!: gsap.MatchMedia;
  private routerEventsSub?: Subscription;
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  private hasHandledInitialNavigation = false;
  private isFirstRun = true;
  private pendingServicesNavComet = false;
  private servicesNavCometAttempts = 0;
  private servicesNavCometRetryTimer?: ReturnType<typeof window.setTimeout>;
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
    this.mm.add("(min-width: 768px)", () => {
      const isOpen = this.dataService.isSidebarOpen();
      const panel = this.sidebarPanel?.nativeElement;
      if (panel) {
        const navItems = panel.querySelectorAll<HTMLElement>('.nav-item');
        gsap.set(panel, { width: isOpen ? "16rem" : "0rem", xPercent: 0 });
        gsap.set(navItems, { opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -12 });
      }
      this.setMenuIcon(isOpen);
    });

    this.mm.add("(max-width: 767px)", () => {
      const isOpen = this.dataService.isSidebarOpen();
      const panel = this.sidebarPanel?.nativeElement;
      if (panel) {
        const navItems = panel.querySelectorAll<HTMLElement>('.nav-item');
        gsap.set(panel, { width: "16rem", xPercent: isOpen ? 0 : -100 });
        gsap.set(navItems, { opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -12 });
      }
      this.setMenuIcon(isOpen);
    });

    window.setTimeout(() => this.requestServicesNavComet(), 300);
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
    this.servicesNavCometTl?.kill();
    if (this.servicesNavCometRetryTimer) window.clearTimeout(this.servicesNavCometRetryTimer);
    if (this.mm) this.mm.revert();
  }

  animateSidebar(isOpen: boolean) {
    const panel = this.sidebarPanel?.nativeElement;
    const topBar = this.menuBarTop?.nativeElement;
    const bottomBar = this.menuBarBottom?.nativeElement;
    if (!panel || !topBar || !bottomBar) return;
    const navItems = Array.from(panel.querySelectorAll<HTMLElement>('.nav-item'));

    if (this.sidebarTl) {
      this.sidebarTl.kill();
    }

    if (this.prefersReducedMotion) {
      const isDesktop = window.innerWidth >= 768;
      gsap.set(panel, {
        width: isDesktop ? (isOpen ? "16rem" : "0rem") : "16rem",
        xPercent: isDesktop ? 0 : (isOpen ? 0 : -100)
      });
      gsap.set(navItems, { opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -12 });
      this.setMenuIcon(isOpen);
      this.notifyLayoutShift();
      if (isOpen) this.requestServicesNavComet();
      return;
    }

    this.sidebarTl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        this.notifyLayoutShift();
        if (isOpen) this.requestServicesNavComet();
      }
    });
    this.notifyLayoutShift();
    
    const isDesktop = window.innerWidth >= 768;

    if (isOpen) {
      this.sidebarTl
        .to(panel, {
          width: "16rem",
          xPercent: 0,
          duration: 0.34,
          ease: "power3.out"
        }, 0)
        .to(navItems, {
          opacity: 1,
          x: 0,
          duration: 0.24,
          ease: "power2.out",
          stagger: 0.025
        }, 0.06)
        .to(topBar, {
          attr: { x1: 5, y1: 5, x2: 15, y2: 15 },
          duration: 0.24,
          ease: "power2.out"
        }, 0)
        .to(bottomBar, {
          attr: { x1: 15, y1: 5, x2: 5, y2: 15 },
          duration: 0.24,
          ease: "power2.out"
        }, 0);
      return;
    }

    this.sidebarTl
      .to(navItems, {
        x: -12,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        stagger: { from: "end", each: 0.018 }
      }, 0)
      .to(panel, {
        width: isDesktop ? "0rem" : "16rem",
        xPercent: isDesktop ? 0 : -100,
        duration: 0.28,
        ease: "power2.inOut"
      }, 0.12)
      .to(topBar, {
        attr: { x1: 3, y1: 6, x2: 17, y2: 6 },
        duration: 0.24,
        ease: "power2.inOut"
      }, 0)
      .to(bottomBar, {
        attr: { x1: 3, y1: 14, x2: 17, y2: 14 },
        duration: 0.24,
        ease: "power2.inOut"
      }, 0);
  }

  private setMenuIcon(isOpen: boolean) {
    const topBar = this.menuBarTop?.nativeElement;
    const bottomBar = this.menuBarBottom?.nativeElement;
    if (!topBar || !bottomBar) return;

    gsap.set(topBar, { attr: isOpen ? { x1: 5, y1: 5, x2: 15, y2: 15 } : { x1: 3, y1: 6, x2: 17, y2: 6 } });
    gsap.set(bottomBar, { attr: isOpen ? { x1: 15, y1: 5, x2: 5, y2: 15 } : { x1: 3, y1: 14, x2: 17, y2: 14 } });
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

  isUserCenterActive(): boolean {
    const url = this.currentUrl() || this.router.url;
    const [path] = url.split('?');
    return path.startsWith('/user');
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
    const delay = this.prefersReducedMotion ? 80 : 720;
    window.setTimeout(() => this.requestServicesNavComet(), delay);
  }

  dismissUpdateNotice() {
    this.showUpdateNotice.set(false);
    if (this.canUseLocalStorage()) {
      localStorage.setItem(this.updateNoticeStorageKey, 'true');
    }
    window.setTimeout(() => this.requestServicesNavComet(), 180);
  }

  private requestServicesNavComet() {
    if (typeof window === 'undefined') return;
    this.pendingServicesNavComet = true;
    this.servicesNavCometAttempts = 0;
    this.queueServicesNavCometCheck(this.prefersReducedMotion ? 20 : 80);
  }

  private queueServicesNavCometCheck(delay: number) {
    if (this.servicesNavCometRetryTimer) window.clearTimeout(this.servicesNavCometRetryTimer);
    this.servicesNavCometRetryTimer = window.setTimeout(() => this.playServicesNavCometIfReady(), delay);
  }

  private retryServicesNavComet() {
    if (!this.pendingServicesNavComet) return;
    this.servicesNavCometAttempts += 1;

    if (this.servicesNavCometAttempts > 40) {
      this.pendingServicesNavComet = false;
      return;
    }

    this.queueServicesNavCometCheck(this.prefersReducedMotion ? 80 : 140);
  }

  private playServicesNavCometIfReady() {
    if (!this.pendingServicesNavComet || !this.canUseLocalStorage()) return;
    if (localStorage.getItem(this.servicesNavCometStorageKey) === 'true') {
      this.pendingServicesNavComet = false;
      return;
    }
    if (this.showSplash() || this.showUpdateNotice() || !this.dataService.isSidebarOpen()) {
      this.retryServicesNavComet();
      return;
    }

    const navItem = this.servicesNavItem?.nativeElement;
    if (!navItem || navItem.offsetParent === null) {
      this.retryServicesNavComet();
      return;
    }

    if (this.prefersReducedMotion) {
      this.pendingServicesNavComet = false;
      localStorage.setItem(this.servicesNavCometStorageKey, 'true');
      return;
    }

    const highlight = navItem.querySelector<HTMLElement>('.services-nav-highlight');
    const orbitPath = navItem.querySelector<SVGGeometryElement>('.services-nav-comet-orbit-path');
    const guidePath = navItem.querySelector<SVGGeometryElement>('.services-nav-comet-guide');
    const tailSmear = navItem.querySelector<SVGPolylineElement>('.services-nav-comet-smear');
    const tailParticles = Array.from(navItem.querySelectorAll<SVGCircleElement>('.services-nav-comet-particle'));
    const headHalo = navItem.querySelector<SVGCircleElement>('.services-nav-comet-head-halo');
    const headCore = navItem.querySelector<SVGCircleElement>('.services-nav-comet-head-core');
    if (!highlight || !orbitPath || !guidePath || !tailSmear || tailParticles.length === 0 || !headHalo || !headCore) {
      this.retryServicesNavComet();
      return;
    }

    this.pendingServicesNavComet = false;
    localStorage.setItem(this.servicesNavCometStorageKey, 'true');

    const orbitLength = orbitPath.getTotalLength();
    const travel = { distance: 0 };
    const cometNodes = [guidePath, tailSmear, ...tailParticles, headHalo, headCore];
    const getPathPoint = (distance: number) => {
      const boundedDistance = gsap.utils.clamp(0, orbitLength, distance);
      return orbitPath.getPointAtLength(boundedDistance);
    };
    const renderComet = () => {
      const headDistance = travel.distance;
      const headPoint = getPathPoint(headDistance);
      const tangentPoint = getPathPoint(headDistance - 2);
      const dx = headPoint.x - tangentPoint.x;
      const dy = headPoint.y - tangentPoint.y;
      const tangentLength = Math.hypot(dx, dy) || 1;
      const normal = { x: -dy / tangentLength, y: dx / tangentLength };
      const entranceAlpha = gsap.utils.clamp(0, 1, headDistance / 44);

      gsap.set(headHalo, {
        attr: { cx: headPoint.x, cy: headPoint.y },
        autoAlpha: entranceAlpha * 0.86
      });
      gsap.set(headCore, {
        attr: { cx: headPoint.x, cy: headPoint.y },
        autoAlpha: entranceAlpha
      });

      const smearPoints: string[] = [];
      for (let index = 14; index >= 0; index -= 1) {
        const smearDistance = headDistance - 8 - index * 3.4;
        if (smearDistance > 0) {
          const point = getPathPoint(smearDistance);
          smearPoints.push(`${point.x.toFixed(2)},${point.y.toFixed(2)}`);
        }
      }
      gsap.set(tailSmear, {
        attr: { points: smearPoints.join(' ') },
        autoAlpha: smearPoints.length > 1 ? entranceAlpha * 0.34 : 0
      });

      tailParticles.forEach((particle, index) => {
        const lag = 6 + index * 3.15;
        const particleDistance = headDistance - lag;
        if (particleDistance <= 0) {
          gsap.set(particle, { autoAlpha: 0 });
          return;
        }

        const point = getPathPoint(particleDistance);
        const fade = 1 - index / tailParticles.length;
        const powderOffset = ((index % 5) - 2) * 0.46;
        const radius = 2.65 * fade + 0.34;
        const opacity = entranceAlpha * 0.6 * Math.pow(fade, 1.55);

        gsap.set(particle, {
          attr: {
            cx: point.x + normal.x * powderOffset,
            cy: point.y + normal.y * powderOffset,
            r: radius
          },
          autoAlpha: opacity
        });
      });
    };

    this.servicesNavCometTl?.kill();
    navItem.classList.add('services-nav-entry-active');

    gsap.set(highlight, { autoAlpha: 1 });
    gsap.set(cometNodes, { autoAlpha: 0 });
    gsap.set(guidePath, { autoAlpha: 0.28 });
    renderComet();

    this.servicesNavCometTl = gsap.timeline({
      defaults: { ease: 'power1.inOut' },
      onComplete: () => {
        navItem.classList.remove('services-nav-entry-active');
        gsap.set(highlight, { autoAlpha: 0 });
        gsap.set(cometNodes, { autoAlpha: 0, clearProps: 'opacity,visibility' });
      }
    });

    this.servicesNavCometTl
      .fromTo(navItem, {
        boxShadow: '0 0 0 rgba(56, 189, 248, 0)'
      }, {
        boxShadow: '0 0 34px rgba(56, 189, 248, 0.22)',
        duration: 0.18
      }, 0)
      .to(travel, {
        distance: orbitLength,
        duration: 2.05,
        ease: 'sine.inOut',
        onUpdate: renderComet
      }, 0.02)
      .to(navItem, {
        boxShadow: '0 0 0 rgba(56, 189, 248, 0)',
        duration: 0.45,
        ease: 'power1.out'
      }, 1.55)
      .to(cometNodes, {
        autoAlpha: 0,
        duration: 0.42,
        ease: 'power1.out'
      }, 1.95)
      .to(highlight, {
        autoAlpha: 0,
        duration: 0.42,
        ease: 'power1.out'
      }, 2.02);
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
