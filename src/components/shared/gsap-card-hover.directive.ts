import { AfterViewInit, Directive, ElementRef, HostListener, NgZone, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';

@Directive({
  selector: '[appGsapCardHover]',
  standalone: true
})
export class GsapCardHoverDirective implements AfterViewInit, OnDestroy {
  private card: HTMLElement;
  private image: HTMLElement | null = null;
  private readMoreArrow: HTMLElement | null = null;
  private hoverTl?: gsap.core.Timeline;
  private isHovering = false;
  private isPressed = false;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {
    this.card = this.el.nativeElement;
  }

  ngAfterViewInit() {
    this.refreshTargets();
  }

  private refreshTargets() {
    this.image = this.card.querySelector('.entry-image img, .entry-image div'); // Select img or fallback div
    this.readMoreArrow = this.card.querySelector('.entry-content svg');
  }

  private setWillChange(active: boolean) {
    this.card.style.willChange = active ? 'transform' : '';
    if (this.image) {
      this.image.style.willChange = active ? 'transform' : '';
    }
  }

  @HostListener('mouseenter')
  @HostListener('focusin')
  onMouseEnter() {
    if (this.prefersReducedMotion) return;
    this.isHovering = true;
    this.refreshTargets();
    this.setWillChange(true);
    this.hoverTl?.kill();

    this.zone.runOutsideAngular(() => {
      this.hoverTl = gsap.timeline({
        defaults: {
          overwrite: 'auto',
          force3D: true
        }
      });

      this.hoverTl.to(this.card, {
        y: -5,
        scale: 1.014,
        duration: 0.34,
        ease: 'power3.out'
      }, 0);

      if (this.image) {
        this.hoverTl.to(this.image, {
          scale: 1.06,
          duration: 0.48,
          ease: 'power3.out'
        }, 0);
      }

      if (this.readMoreArrow) {
        this.hoverTl.to(this.readMoreArrow, {
          x: 4,
          duration: 0.32,
          ease: 'power3.out'
        }, 0.03);
      }
    });
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onMouseLeave() {
    if (this.prefersReducedMotion) return;
    this.isHovering = false;
    this.isPressed = false;
    this.hoverTl?.kill();

    this.zone.runOutsideAngular(() => {
      this.hoverTl = gsap.timeline({
        defaults: {
          overwrite: 'auto',
          force3D: true
        },
        onComplete: () => this.setWillChange(false)
      });

      this.hoverTl.to(this.card, {
        y: 0,
        scale: 1,
        duration: 0.42,
        ease: 'power3.out'
      }, 0);

      if (this.image) {
        this.hoverTl.to(this.image, {
          scale: 1,
          duration: 0.46,
          ease: 'power3.out'
        }, 0);
      }

      if (this.readMoreArrow) {
        this.hoverTl.to(this.readMoreArrow, {
          x: 0,
          duration: 0.32,
          ease: 'power3.out'
        }, 0);
      }
    });
  }

  @HostListener('pointerdown')
  onPointerDown() {
    if (this.prefersReducedMotion) return;

    this.isPressed = true;
    this.setWillChange(true);
    this.hoverTl?.kill();
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
    if (this.isHovering) {
      this.onMouseEnter();
    } else {
      this.onMouseLeave();
    }
  }

  ngOnDestroy() {
    this.hoverTl?.kill();
    const targets = [this.card, this.image, this.readMoreArrow].filter((target): target is HTMLElement => !!target);
    gsap.killTweensOf(targets);
    this.setWillChange(false);
  }
}
