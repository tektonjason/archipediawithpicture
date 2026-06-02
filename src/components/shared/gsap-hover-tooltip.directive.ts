import { Directive, ElementRef, Input, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { gsap } from 'gsap';

@Directive({
  selector: '[appGsapTooltip]',
  standalone: true
})
export class GsapHoverTooltipDirective implements AfterViewInit, OnDestroy {
  @Input('appGsapTooltip') tooltipText: string = '';
  @Input() hoverScale: number = 1.06;
  @Input() tooltipPos: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tl?: gsap.core.Timeline;
  private tooltipEl?: HTMLDivElement;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    if (!this.tooltipText.trim()) return;

    // 1. Create Tooltip Element
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'fixed pointer-events-none z-[100] px-3.5 py-2 bg-surface/95 backdrop-blur-md border border-line text-gray-200 text-xs rounded-control shadow-panel font-medium tracking-wide whitespace-nowrap';
    this.tooltipEl.textContent = this.tooltipText;
    
    // Default styles for animation
    let startY = 0;
    let startX = 0;
    let tOrigin = 'bottom center';
    
    if (this.tooltipPos === 'bottom') {
      startY = -10;
      tOrigin = 'top center';
    } else if (this.tooltipPos === 'right') {
      startX = -10;
      tOrigin = 'left center';
    } else if (this.tooltipPos === 'left') {
      startX = 10;
      tOrigin = 'right center';
    } else {
      startY = 10;
    }

    gsap.set(this.tooltipEl, { 
      autoAlpha: 0, 
      y: startY, 
      x: startX,
      scale: 0.8,
      transformOrigin: tOrigin,
      left: 0,
      top: 0
    });
    
    document.body.appendChild(this.tooltipEl);

    // 2. Prepare Button styles
    // Clear any conflicting transition on transform if it exists, to let GSAP handle it
    const currentTransition = window.getComputedStyle(this.el.nativeElement).transition;
    if (currentTransition.includes('transform') || currentTransition === 'all') {
      // GSAP works best if CSS transitions don't fight it
      this.el.nativeElement.style.transition = currentTransition.replace(/transform[^,]*(,|$)/g, '').replace(/all[^,]*(,|$)/g, 'background-color 0.3s, border-color 0.3s, color 0.3s');
    }

    // 3. Create Timeline
    this.tl = gsap.timeline({ paused: true })
      // Button scale
      .to(this.el.nativeElement, {
        scale: this.prefersReducedMotion ? 1 : this.hoverScale,
        duration: 0.16,
        ease: 'power2.out'
      }, 0)
      // Tooltip pop
      .to(this.tooltipEl, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.16,
        ease: 'power2.out'
      }, 0);
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.tl) return;
    this.updatePosition();
    this.tl.timeScale(1).play();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (!this.tl) return;
    // Reverse with an accelerated timescale for snappy exit
    this.tl.timeScale(1.6).reverse();
  }

  @HostListener('click')
  onClick() {
    if (!this.tl) return;
    // Hide tooltip immediately on click (especially useful for mobile tap)
    this.tl.timeScale(1.8).reverse();
  }

  private updatePosition() {
    if (!this.tooltipEl) return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    
    if (this.tooltipPos === 'bottom') {
      top = rect.bottom + 8;
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    } else if (this.tooltipPos === 'right') {
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      left = rect.right + 8;
    } else if (this.tooltipPos === 'left') {
      top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      left = rect.left - tooltipRect.width - 8;
    } else {
      // Default: top
      top = rect.top - tooltipRect.height - 8; // 8px gap
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }

    // Safe boundaries
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    if (top + tooltipRect.height > window.innerHeight - 8) {
      top = window.innerHeight - tooltipRect.height - 8;
    }

    gsap.set(this.tooltipEl, {
      top: top,
      left: left
    });
  }

  ngOnDestroy() {
    if (this.tl) {
      this.tl.kill();
    }
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
  }
}
