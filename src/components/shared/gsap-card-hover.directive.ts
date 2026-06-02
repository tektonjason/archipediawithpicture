import { Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';

@Directive({
  selector: '[appGsapCardHover]',
  standalone: true
})
export class GsapCardHoverDirective implements OnDestroy {
  private card: HTMLElement;
  private image: HTMLElement | null;
  private readMoreArrow: HTMLElement | null;
  private tl: gsap.core.Timeline | null = null;

  constructor(private el: ElementRef<HTMLElement>) {
    this.card = this.el.nativeElement;
    this.image = this.card.querySelector('.entry-image img, .entry-image div'); // Select img or fallback div
    this.readMoreArrow = this.card.querySelector('.entry-content svg');
  }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.tl) {
      this.tl.kill(); // Kill any existing timeline to prevent conflicts
    }

    this.tl = gsap.timeline({
      defaults: { duration: 0.3, ease: 'power2.out' }
    });

    this.tl.to(this.card, {
      y: -5, // Subtle lift
      boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
      borderColor: 'rgba(255,255,255,0.3)',
      duration: 0.4,
      ease: 'power2.out'
    }, 0);

    if (this.image) {
      this.tl.to(this.image, {
        scale: 1.05, // Slight zoom on image
        duration: 0.4
      }, 0);
    }

    if (this.readMoreArrow) {
      this.tl.to(this.readMoreArrow, {
        x: 3, // Move arrow slightly to the right
        duration: 0.3
      }, 0);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.tl) {
      this.tl.reverse(); // Reverse the timeline on mouse leave
    }
  }

  ngOnDestroy() {
    if (this.tl) {
      this.tl.kill();
    }
  }
}
