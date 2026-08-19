import { AfterViewInit, Directive, ElementRef, HostBinding, HostListener, NgZone, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';

const IMAGE_SELECTOR = [
  '.entry-image img',
  '.entry-image > div',
  '.reading-cover img',
  '.service-product-cover img',
  '.resource-preview img',
  '[data-hover-image]',
  'img'
].join(',');

const ARROW_SELECTOR = [
  '.entry-content svg',
  '.service-product-arrow',
  '[data-hover-arrow]'
].join(',');

@Directive({
  selector: '[appGsapCardHover]',
  standalone: true
})
export class GsapCardHoverDirective implements AfterViewInit, OnDestroy {
  @HostBinding('class.gsap-card-hover-active') readonly gsapHoverActive = true;

  private readonly card: HTMLElement;
  private image: HTMLElement | null = null;
  private arrow: HTMLElement | null = null;
  private hoverTimeline?: gsap.core.Timeline;
  private isHovering = false;
  private isPressed = false;
  private readonly prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private readonly element: ElementRef<HTMLElement>, private readonly zone: NgZone) {
    this.card = this.element.nativeElement;
  }

  ngAfterViewInit() {
    this.refreshTargets();
  }

  @HostListener('mouseenter')
  @HostListener('focusin')
  onEnter() {
    if (this.prefersReducedMotion) return;
    this.isHovering = true;
    this.refreshTargets();
    this.setWillChange(true);
    this.hoverTimeline?.kill();

    this.zone.runOutsideAngular(() => {
      this.hoverTimeline = gsap.timeline({
        defaults: { overwrite: 'auto', force3D: true }
      });

      this.hoverTimeline.to(this.card, {
        y: -5,
        scale: 1.014,
        duration: 0.34,
        ease: 'power3.out'
      }, 0);

      if (this.image) {
        this.hoverTimeline.to(this.image, {
          scale: 1.055,
          duration: 0.48,
          ease: 'power3.out'
        }, 0);
      }

      if (this.arrow) {
        this.hoverTimeline.to(this.arrow, {
          x: 4,
          duration: 0.32,
          ease: 'power3.out'
        }, 0.03);
      }
    });
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.leave();
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent) {
    if (event.relatedTarget instanceof Node && this.card.contains(event.relatedTarget)) return;
    this.leave();
  }

  @HostListener('pointerdown')
  onPointerDown() {
    if (this.prefersReducedMotion) return;
    this.isPressed = true;
    this.setWillChange(true);
    this.hoverTimeline?.kill();

    this.zone.runOutsideAngular(() => {
      gsap.to(this.card, {
        y: this.isHovering ? -2 : 0,
        scale: 0.992,
        duration: 0.12,
        ease: 'power2.out',
        overwrite: 'auto',
        force3D: true
      });
    });
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  onPointerUp() {
    if (this.prefersReducedMotion || !this.isPressed) return;
    this.isPressed = false;
    if (this.isHovering) this.onEnter();
    else this.leave();
  }

  ngOnDestroy() {
    this.hoverTimeline?.kill();
    gsap.killTweensOf(this.targets());
    this.setWillChange(false);
  }

  private leave() {
    if (this.prefersReducedMotion) return;
    this.isHovering = false;
    this.isPressed = false;
    this.hoverTimeline?.kill();

    this.zone.runOutsideAngular(() => {
      this.hoverTimeline = gsap.timeline({
        defaults: { overwrite: 'auto', force3D: true },
        onComplete: () => this.setWillChange(false)
      });

      this.hoverTimeline.to(this.card, {
        y: 0,
        scale: 1,
        duration: 0.42,
        ease: 'power3.out'
      }, 0);

      if (this.image) {
        this.hoverTimeline.to(this.image, {
          scale: 1,
          duration: 0.46,
          ease: 'power3.out'
        }, 0);
      }

      if (this.arrow) {
        this.hoverTimeline.to(this.arrow, {
          x: 0,
          duration: 0.32,
          ease: 'power3.out'
        }, 0);
      }
    });
  }

  private refreshTargets() {
    this.image = this.card.querySelector<HTMLElement>(IMAGE_SELECTOR);
    this.arrow = this.card.querySelector<HTMLElement>(ARROW_SELECTOR);
  }

  private targets(): HTMLElement[] {
    return [this.card, this.image, this.arrow].filter((target): target is HTMLElement => !!target);
  }

  private setWillChange(active: boolean) {
    for (const target of this.targets()) {
      target.style.willChange = active ? 'transform' : '';
    }
  }
}
