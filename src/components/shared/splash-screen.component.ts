import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { gsap } from 'gsap';

type OrientationPermissionState = 'unknown' | 'pending' | 'granted' | 'denied' | 'unavailable';

type DeviceOrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  template: `
    <div 
      #splashContainer
      class="fixed inset-0 z-[100] flex items-center justify-center bg-app cursor-pointer overflow-hidden touch-none"
      (click)="enterApp()"
    >
      <!-- Background pattern/gradient to make it look nicer -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none"></div>
      
      <div #logoOuter class="logo-outer relative flex flex-col items-center justify-center p-12 md:p-16 rounded-card border border-line bg-surface/70 shadow-panel backdrop-blur-md transform-style-3d">
        <div #logoInner class="logo flex flex-col items-center gap-8 pointer-events-none transform-style-3d">
          <div class="w-28 h-28 md:w-32 md:h-32 bg-white/10 rounded-card flex items-center justify-center overflow-hidden shadow-2xl border border-line relative">
             <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent z-10"></div>
             <img src="/icon/archipediaicon.webp" alt="Archipedia Logo" decoding="sync" fetchpriority="high" class="w-full h-full object-cover">
          </div>
          
          <div class="flex flex-col items-center gap-3">
            <h1 class="text-4xl md:text-6xl font-extrabold tracking-[0.16em] text-white drop-shadow-2xl font-brand">
              建筑百科
            </h1>
            <p class="text-sm md:text-base text-gray-400 font-medium tracking-[0.3em] uppercase">
              Archipedia
            </p>
          </div>
          
          <div class="mt-4 px-6 py-2 rounded-full bg-white/5 border border-line">
            <p class="text-xs md:text-sm text-gray-300 tracking-widest uppercase animate-pulse">
              点击进入 / Click to Enter
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .transform-style-3d {
      transform-style: preserve-3d;
    }
  `]
})
export class SplashScreenComponent implements AfterViewInit, OnDestroy {
  @ViewChild('splashContainer') splashContainer!: ElementRef<HTMLElement>;
  @ViewChild('logoOuter') logoOuter!: ElementRef<HTMLElement>;
  @ViewChild('logoInner') logoInner!: ElementRef<HTMLElement>;
  @Output() enter = new EventEmitter<void>();

  private mm!: gsap.MatchMedia;
  private pointerMoveHandler!: (e: PointerEvent) => void;
  private pointerLeaveHandler!: (e: PointerEvent) => void;
  private isEntering = false;
  private enterTl?: gsap.core.Timeline;
  private introTweens: gsap.core.Tween[] = [];
  private enterFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private hasEmittedEnter = false;
  private orientationPermissionState: OrientationPermissionState = 'unknown';

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;

    this.mm = gsap.matchMedia();

    this.mm.add(
      {
        canAnimate: "(prefers-reduced-motion: no-preference)"
      },
      (context) => {
      const container = this.splashContainer.nativeElement;
      const outer = this.logoOuter.nativeElement;
      const inner = this.logoInner.nativeElement;
      const { canAnimate } = context.conditions as { canAnimate: boolean };

      gsap.set(container, { perspective: 1000 });
      gsap.set(outer, { transformStyle: "preserve-3d" });
      gsap.set(inner, { transformStyle: "preserve-3d", z: 50 });

      if (!canAnimate) {
        return;
      }

      const outerRX = gsap.quickTo(outer, "rotationX", { duration: 0.28, ease: "power3.out" });
      const outerRY = gsap.quickTo(outer, "rotationY", { duration: 0.28, ease: "power3.out" });
      const innerX = gsap.quickTo(inner, "x", { duration: 0.28, ease: "power3.out" });
      const innerY = gsap.quickTo(inner, "y", { duration: 0.28, ease: "power3.out" });

      let pointerActive = false;
      let orientationBaseline: { beta: number; gamma: number; screenAngle: number } | null = null;
      let orientationPose = { rotationX: 0, rotationY: 0 };

      const applyPose = (rotationX: number, rotationY: number) => {
        outerRX(rotationX);
        outerRY(rotationY);
        innerX(rotationY * 2);
        innerY(rotationX * -2);
      };

      const applyOrientationPose = () => {
        applyPose(orientationPose.rotationX, orientationPose.rotationY);
      };

      this.pointerMoveHandler = (e: PointerEvent) => {
        if (this.isEntering) return;
        if (e.pointerType !== 'mouse' && !pointerActive) return;

        pointerActive = true;
        const xRatio = e.clientX / window.innerWidth;
        const yRatio = e.clientY / window.innerHeight;

        applyPose(
          gsap.utils.interpolate(15, -15, yRatio),
          gsap.utils.interpolate(-15, 15, xRatio)
        );
      };

      this.pointerLeaveHandler = () => {
        if (this.isEntering) return;
        pointerActive = false;
        applyOrientationPose();
      };

      const pointerDownHandler = (e: PointerEvent) => {
        pointerActive = true;
        this.pointerMoveHandler(e);
      };

      const normalizeAngleDelta = (value: number, baseline: number) => {
        let delta = value - baseline;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        return delta;
      };

      const getScreenAngle = () => {
        const orientationAngle = window.screen.orientation?.angle;
        if (typeof orientationAngle === 'number') return orientationAngle;

        const legacyAngle = (window as Window & { orientation?: number }).orientation;
        return typeof legacyAngle === 'number' ? legacyAngle : 0;
      };

      const orientationHandler = (event: DeviceOrientationEvent) => {
        if (this.isEntering || event.beta === null || event.gamma === null) return;

        const screenAngle = getScreenAngle();
        if (!orientationBaseline || orientationBaseline.screenAngle !== screenAngle) {
          orientationBaseline = { beta: event.beta, gamma: event.gamma, screenAngle };
          orientationPose = { rotationX: 0, rotationY: 0 };
          if (!pointerActive) applyOrientationPose();
          return;
        }

        const betaDelta = normalizeAngleDelta(event.beta, orientationBaseline.beta);
        const gammaDelta = normalizeAngleDelta(event.gamma, orientationBaseline.gamma);
        let horizontalTilt = gammaDelta;
        let verticalTilt = betaDelta;
        const normalizedScreenAngle = ((screenAngle % 360) + 360) % 360;

        if (normalizedScreenAngle === 90) {
          horizontalTilt = betaDelta;
          verticalTilt = -gammaDelta;
        } else if (normalizedScreenAngle === 180) {
          horizontalTilt = -gammaDelta;
          verticalTilt = -betaDelta;
        } else if (normalizedScreenAngle === 270) {
          horizontalTilt = -betaDelta;
          verticalTilt = gammaDelta;
        }

        orientationPose = {
          rotationX: gsap.utils.clamp(-15, 15, -verticalTilt * 0.7),
          rotationY: gsap.utils.clamp(-15, 15, horizontalTilt * 0.7)
        };

        if (!pointerActive) applyOrientationPose();
      };

      container.addEventListener("pointerdown", pointerDownHandler);
      container.addEventListener("pointermove", this.pointerMoveHandler);
      container.addEventListener("pointerleave", this.pointerLeaveHandler);
      container.addEventListener("pointerup", this.pointerLeaveHandler);
      container.addEventListener("pointercancel", this.pointerLeaveHandler);
      window.addEventListener("deviceorientation", orientationHandler);

      return () => {
        container.removeEventListener("pointerdown", pointerDownHandler);
        container.removeEventListener("pointermove", this.pointerMoveHandler);
        container.removeEventListener("pointerleave", this.pointerLeaveHandler);
        container.removeEventListener("pointerup", this.pointerLeaveHandler);
        container.removeEventListener("pointercancel", this.pointerLeaveHandler);
        window.removeEventListener("deviceorientation", orientationHandler);
      };
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(this.logoOuter.nativeElement, { opacity: 1, y: 0, scale: 1 });
      gsap.set(this.logoInner.nativeElement.children, { opacity: 1, y: 0 });
      return;
    }
    
    // Initial entrance animation
    this.introTweens.push(gsap.from(this.logoOuter.nativeElement, {
      y: 50,
      scale: 0.9,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out"
    }));
    
    this.introTweens.push(gsap.from(this.logoInner.nativeElement.children, {
      y: 20,
      opacity: 0,
      duration: 0.45,
      stagger: 0.08,
      ease: "power2.out",
      delay: 0.15
    }));
  }

  ngOnDestroy() {
    if (this.mm) this.mm.revert();
    this.introTweens.forEach(tween => tween.kill());
    this.enterTl?.kill();
    if (this.enterFallbackTimer) clearTimeout(this.enterFallbackTimer);
  }

  async enterApp() {
    if (this.isEntering) return;

    const keepSplashOpen = await this.requestOrientationPermissionIfNeeded();
    if (keepSplashOpen || this.isEntering) return;

    this.startEnterAnimation();
  }

  private async requestOrientationPermissionIfNeeded(): Promise<boolean> {
    if (this.orientationPermissionState === 'pending') return true;
    if (this.orientationPermissionState !== 'unknown') return false;

    const orientationEvent = window.DeviceOrientationEvent as DeviceOrientationEventConstructorWithPermission | undefined;
    const requiresPermission = navigator.maxTouchPoints > 0
      && typeof orientationEvent?.requestPermission === 'function';

    if (!requiresPermission) {
      this.orientationPermissionState = 'unavailable';
      return false;
    }

    this.orientationPermissionState = 'pending';

    try {
      const permission = await orientationEvent.requestPermission!();
      this.orientationPermissionState = permission;
      return permission === 'granted';
    } catch {
      this.orientationPermissionState = 'denied';
      return false;
    }
  }

  private startEnterAnimation() {
    this.isEntering = true;
    this.enterFallbackTimer = setTimeout(() => this.completeEnter(), 900);

    this.enterTl = gsap.timeline({
      onComplete: () => this.completeEnter()
    });
    
    // Reset rotations first
    this.enterTl.to(this.logoOuter.nativeElement, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.18,
      ease: "power2.inOut"
    }, 0);
    
    this.enterTl.to(this.logoInner.nativeElement, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.18,
      ease: "power2.inOut"
    }, 0);

    // Zoom and fade out
    this.enterTl.to(this.logoOuter.nativeElement, {
      scale: 1.2,
      opacity: 0,
      duration: 0.32,
      ease: "power2.in"
    }, 0.12).to(this.splashContainer.nativeElement, {
      opacity: 0,
      duration: 0.24,
      ease: "power2.inOut"
    }, 0.18);
  }

  private completeEnter() {
    if (this.hasEmittedEnter) return;

    this.hasEmittedEnter = true;
    if (this.enterFallbackTimer) {
      clearTimeout(this.enterFallbackTimer);
      this.enterFallbackTimer = null;
    }
    this.enter.emit();
  }
}
