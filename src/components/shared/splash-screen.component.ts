import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { gsap } from 'gsap';

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
             <img src="/icon/archipediaicon.webp" alt="Archipedia Logo" class="w-full h-full object-cover">
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

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;

    this.mm = gsap.matchMedia();

    this.mm.add("all", () => {
      const container = this.splashContainer.nativeElement;
      const outer = this.logoOuter.nativeElement;
      const inner = this.logoInner.nativeElement;

      gsap.set(container, { perspective: 1000 });
      gsap.set(outer, { transformStyle: "preserve-3d" });
      gsap.set(inner, { transformStyle: "preserve-3d", z: 50 });

      const outerRX = gsap.quickTo(outer, "rotationX", { ease: "power3" });
      const outerRY = gsap.quickTo(outer, "rotationY", { ease: "power3" });
      const innerX = gsap.quickTo(inner, "x", { ease: "power3" });
      const innerY = gsap.quickTo(inner, "y", { ease: "power3" });

      this.pointerMoveHandler = (e: PointerEvent) => {
        if (this.isEntering) return;
        const xRatio = e.clientX / window.innerWidth;
        const yRatio = e.clientY / window.innerHeight;
        
        outerRX(gsap.utils.interpolate(15, -15, yRatio));
        outerRY(gsap.utils.interpolate(-15, 15, xRatio));
        innerX(gsap.utils.interpolate(-30, 30, xRatio));
        innerY(gsap.utils.interpolate(-30, 30, yRatio));
      };

      this.pointerLeaveHandler = (e: PointerEvent) => {
        if (this.isEntering) return;
        outerRX(0);
        outerRY(0);
        innerX(0);
        innerY(0);
      };

      container.addEventListener("pointermove", this.pointerMoveHandler);
      container.addEventListener("pointerleave", this.pointerLeaveHandler);

      return () => {
        container.removeEventListener("pointermove", this.pointerMoveHandler);
        container.removeEventListener("pointerleave", this.pointerLeaveHandler);
      };
    });
    
    // Initial entrance animation
    gsap.from(this.logoOuter.nativeElement, {
      y: 50,
      scale: 0.9,
      opacity: 0,
      duration: 1.2,
      ease: "power4.out"
    });
    
    gsap.from(this.logoInner.nativeElement.children, {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "back.out(1.5)",
      delay: 0.3
    });
  }

  ngOnDestroy() {
    if (this.mm) this.mm.revert();
  }

  enterApp() {
    if (this.isEntering) return;
    this.isEntering = true;

    const tl = gsap.timeline({
      onComplete: () => {
        this.enter.emit();
      }
    });
    
    // Reset rotations first
    tl.to(this.logoOuter.nativeElement, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.3,
      ease: "power2.inOut"
    }, 0);
    
    tl.to(this.logoInner.nativeElement, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.3,
      ease: "power2.inOut"
    }, 0);

    // Zoom and fade out
    tl.to(this.logoOuter.nativeElement, {
      scale: 1.2,
      opacity: 0,
      duration: 0.5,
      ease: "power2.in"
    }, 0.2).to(this.splashContainer.nativeElement, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.inOut"
    }, 0.3);
  }
}
