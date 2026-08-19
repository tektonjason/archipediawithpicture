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

  private static instantUntil = 0;
  private static nextId = 0;
  private tooltipEl?: HTMLDivElement;
  private showTimer?: ReturnType<typeof setTimeout>;
  private describedByBefore = '';
  private startX = 0;
  private startY = 0;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    if (!this.tooltipText.trim()) return;

    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'fixed pointer-events-none z-[100] px-3.5 py-2 bg-surface/95 backdrop-blur-md border border-line text-gray-200 text-xs rounded-control shadow-panel font-medium tracking-wide whitespace-nowrap';
    this.tooltipEl.textContent = this.tooltipText;
    this.tooltipEl.id = `arch-tooltip-${++GsapHoverTooltipDirective.nextId}`;
    this.tooltipEl.setAttribute('role', 'tooltip');
    this.tooltipEl.style.willChange = 'transform, opacity';
    this.describedByBefore = this.el.nativeElement.getAttribute('aria-describedby') ?? '';
    const describedBy = new Set(this.describedByBefore.split(/\s+/).filter(Boolean));
    describedBy.add(this.tooltipEl.id);
    this.el.nativeElement.setAttribute('aria-describedby', Array.from(describedBy).join(' '));
    
    // Default styles for animation
    let tOrigin = 'bottom center';
    
    if (this.tooltipPos === 'bottom') {
      this.startY = -6;
      tOrigin = 'top center';
    } else if (this.tooltipPos === 'right') {
      this.startX = -6;
      tOrigin = 'left center';
    } else if (this.tooltipPos === 'left') {
      this.startX = 6;
      tOrigin = 'right center';
    } else {
      this.startY = 6;
    }

    gsap.set(this.tooltipEl, { 
      autoAlpha: 0, 
      y: this.startY,
      x: this.startX,
      scale: 0.96,
      transformOrigin: tOrigin,
      left: 0,
      top: 0
    });
    
    document.body.appendChild(this.tooltipEl);
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.canHover) return;
    const instant = performance.now() < GsapHoverTooltipDirective.instantUntil;
    if (instant) {
      this.showTooltip();
    } else {
      this.clearShowTimer();
      this.showTimer = setTimeout(() => this.showTooltip(), 350);
    }
  }

  @HostListener('focusin')
  onFocusIn() {
    this.showTooltip();
  }

  private showTooltip() {
    if (!this.tooltipEl) return;
    this.clearShowTimer();
    this.updatePosition();
    gsap.to(this.tooltipEl, {
      autoAlpha: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: this.prefersReducedMotion ? 0 : 0.14,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (!this.canHover) return;
    this.hideTooltip();
  }

  @HostListener('focusout')
  onFocusOut() {
    this.hideTooltip();
  }

  private hideTooltip() {
    this.clearShowTimer();
    if (!this.tooltipEl) return;
    gsap.to(this.tooltipEl, {
      autoAlpha: 0,
      y: this.startY,
      x: this.startX,
      scale: 0.96,
      duration: this.prefersReducedMotion ? 0 : 0.1,
      ease: 'power2.out',
      overwrite: 'auto'
    });
    GsapHoverTooltipDirective.instantUntil = performance.now() + 900;
  }

  @HostListener('click')
  onClick() {
    this.hideTooltip();
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
      top = rect.top - tooltipRect.height - 8;
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }

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
    this.clearShowTimer();
    if (this.tooltipEl) gsap.killTweensOf(this.tooltipEl);
    if (this.describedByBefore) {
      this.el.nativeElement.setAttribute('aria-describedby', this.describedByBefore);
    } else {
      this.el.nativeElement.removeAttribute('aria-describedby');
    }
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
  }

  private clearShowTimer() {
    if (!this.showTimer) return;
    clearTimeout(this.showTimer);
    this.showTimer = undefined;
  }
}
