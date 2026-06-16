import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-animated-search-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div #islandContainer class="relative flex justify-center items-center z-30" style="width: 48px; height: 48px;">
      
      <!-- Island Container -->
      <div 
        #island 
        class="island absolute left-0 top-0 bg-surface border border-line shadow-panel flex items-center overflow-hidden z-20"
        style="width: 48px; height: 48px; border-radius: 24px;"
      >
        <!-- Toggle Button -->
        <button 
          #toggleBtn 
          (click)="toggle()" 
          class="absolute left-0 w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-20 focus:outline-none"
          [attr.aria-expanded]="isOpen"
          aria-label="Toggle search"
        >
          <!-- SVG for Search / Close -->
          <svg class="w-5 h-5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
             <!-- Search circle -->
             <circle #searchCircle cx="7" cy="7" r="4.5" />
             <!-- Handle / bar-bot -->
             <line #barBot x1="10.5" y1="10.5" x2="14" y2="14" />
             <!-- bar-top (hidden initially) -->
             <line #barTop x1="14" y1="2" x2="14" y2="2" opacity="0" />
             <line #barMid x1="2" y1="2" x2="2" y2="2" opacity="0" />
          </svg>
        </button>

        <!-- Search Input -->
        <div #menuPanel class="menu-panel absolute left-12 right-0 h-full flex items-center">
          <input 
            #searchInput
            type="text" 
            [ngModel]="query"
            (ngModelChange)="onQueryChange($event)"
            [placeholder]="placeholder" 
            class="w-full h-full bg-transparent text-white text-base placeholder-gray-500 pr-4 focus:outline-none"
            (keydown.enter)="onEnter()"
            tabindex="-1"
          >
          
          <!-- Clear Button -->
          @if (query) {
            <button (click)="clearQuery(); $event.stopPropagation()" class="absolute right-4 text-lg leading-none text-gray-500 hover:text-white transition-colors" aria-label="清除搜索">
              ×
            </button>
          }
        </div>
      </div>
      
      <!-- Backdrop -->
      <div 
        #backdrop 
        class="menu-backdrop fixed inset-0 bg-black/55 backdrop-blur-md z-10 pointer-events-none opacity-0" 
        (click)="closeIfOpen()"
      ></div>
    </div>
  `,
  styles: [`
    .island {
      will-change: width, transform;
    }
    .menu-panel {
      will-change: transform, opacity;
    }
  `]
})
export class AnimatedSearchBarComponent implements AfterViewInit, OnDestroy {
  @Input() query: string = '';
  @Input() placeholder: string = '搜索...';
  @Output() queryChange = new EventEmitter<string>();

  @ViewChild('islandContainer') islandContainer!: ElementRef;
  @ViewChild('island') island!: ElementRef;
  @ViewChild('toggleBtn') toggleBtn!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('backdrop') backdrop!: ElementRef;
  @ViewChild('menuPanel') menuPanel!: ElementRef;
  
  @ViewChild('searchCircle') searchCircle!: ElementRef;
  @ViewChild('barTop') barTop!: ElementRef;
  @ViewChild('barBot') barBot!: ElementRef;

  isOpen = false;
  tl!: gsap.core.Timeline;
  private positionFrame = 0;
  private resizeObserver?: ResizeObserver;
  private isAnimating = false;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private scrollListenerOptions: AddEventListenerOptions = { capture: true, passive: true };
  private layoutSyncFrame = 0;
  private layoutSyncUntil = 0;
  private handleLayoutShift = () => this.trackPositionDuringLayoutChange();

  onQueryChange(val: string) {
    this.query = val;
    this.queryChange.emit(val);
  }

  clearQuery() {
    this.query = '';
    this.queryChange.emit('');
    this.searchInput.nativeElement.focus();
  }

  onEnter() {
    // Optionally close on enter, or just leave it
  }

  updatePosition = () => {
    if (!this.isOpen && !this.isAnimating && this.islandContainer && this.island) {
      this.pinIslandToAnchor();
    }
  }

  schedulePositionUpdate = () => {
    if (this.isOpen || this.isAnimating) return;
    if (this.positionFrame) return;
    this.positionFrame = requestAnimationFrame(() => {
      this.positionFrame = 0;
      this.updatePosition();
    });
  }

  private trackPositionDuringLayoutChange(duration = 460) {
    if (typeof window === 'undefined') return;

    this.layoutSyncUntil = Math.max(this.layoutSyncUntil, performance.now() + duration);
    if (this.layoutSyncFrame) return;

    const tick = () => {
      this.layoutSyncFrame = 0;
      if (!this.isOpen && !this.isAnimating) {
        this.updatePosition();
      }

      if (performance.now() < this.layoutSyncUntil) {
        this.layoutSyncFrame = requestAnimationFrame(tick);
      }
    };

    this.layoutSyncFrame = requestAnimationFrame(tick);
  }

  private pinIslandToAnchor() {
    gsap.set(this.island.nativeElement, {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 48,
      xPercent: 0,
      yPercent: 0,
      clearProps: 'transform'
    });
  }

  private floatIslandFromAnchor() {
    const rect = this.islandContainer.nativeElement.getBoundingClientRect();
    gsap.set(this.island.nativeElement, {
      position: 'fixed',
      left: rect.left,
      top: rect.top,
      width: 48,
      xPercent: 0,
      yPercent: 0,
      clearProps: 'transform'
    });
  }

  private observePositionSources() {
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => this.schedulePositionUpdate());
    this.resizeObserver.observe(this.islandContainer.nativeElement);

    const sidebar = document.getElementById('sidebar-panel');
    if (sidebar) {
      this.resizeObserver.observe(sidebar);
    }
  }

  ngAfterViewInit() {
    this.pinIslandToAnchor();
    window.addEventListener('resize', this.schedulePositionUpdate);
    window.addEventListener('scroll', this.schedulePositionUpdate, this.scrollListenerOptions);
    window.addEventListener('archipedia:layout-shift', this.handleLayoutShift);
    this.observePositionSources();
    
    gsap.set(this.menuPanel.nativeElement, { autoAlpha: 0, yPercent: -10, scale: 0.6 });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.toggleBtn.nativeElement.setAttribute('aria-expanded', this.isOpen.toString());
    
    if (this.isOpen) {
      this.searchInput.nativeElement.setAttribute('tabindex', '0');
      this.isAnimating = true;
      this.floatIslandFromAnchor();
      
      const expandedWidth = Math.min(window.innerWidth * 0.9, 400);
      const openDuration = this.prefersReducedMotion ? 0.01 : 0.36;
      
      // Calculate how much we need to shift to center the island on the screen
      const screenCenterX = window.innerWidth / 2;
      const targetLeft = screenCenterX - (expandedWidth / 2);
      
      // we are using fixed positioning, so we just animate left
      
      if (this.tl) this.tl.kill();
      
      this.tl = gsap.timeline({
        onComplete: () => {
          this.isAnimating = false;
          this.searchInput.nativeElement.focus();
        }
      })
      .set(this.backdrop.nativeElement, { pointerEvents: 'auto' })
      .to(this.island.nativeElement, { 
        width: expandedWidth, 
        left: targetLeft,
        duration: openDuration,
        ease: 'power3.out'
      }, 0)
      .to(this.searchCircle.nativeElement, { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0)
      .to(this.barTop.nativeElement, { opacity: 1, attr: { x1: 3, y1: 3, x2: 13, y2: 13 }, duration: 0.18, ease: 'power2.out' }, 0)
      .to(this.barBot.nativeElement, { attr: { x1: 13, y1: 3, x2: 3, y2: 13 }, duration: 0.18, ease: 'power2.out' }, 0)
      .to(this.backdrop.nativeElement, { opacity: 1, duration: openDuration * 0.7, ease: 'power2.out' }, 0)
      .fromTo(this.menuPanel.nativeElement, 
        { autoAlpha: 0, yPercent: -10, scale: 0.6 },
        { autoAlpha: 1, yPercent: 0, scale: 1, duration: openDuration, transformOrigin: 'left center', ease: 'power3.out' },
      0.06);
      
    } else {
      this.searchInput.nativeElement.setAttribute('tabindex', '-1');
      this.isAnimating = true;
      
      if (this.tl) this.tl.kill();
      const closedRect = this.islandContainer.nativeElement.getBoundingClientRect();
      const closeDuration = this.prefersReducedMotion ? 0.01 : 0.24;
      
      this.tl = gsap.timeline({
        onComplete: () => {
          gsap.set(this.backdrop.nativeElement, { pointerEvents: 'none' });
          gsap.set(this.island.nativeElement, { width: 48 });
          gsap.set(this.searchCircle.nativeElement, { opacity: 1 });
          gsap.set(this.barTop.nativeElement, { opacity: 0, attr: { x1: 14, y1: 2, x2: 14, y2: 2 } });
          gsap.set(this.barBot.nativeElement, { attr: { x1: 10.5, y1: 10.5, x2: 14, y2: 14 } });
          gsap.set(this.menuPanel.nativeElement, { autoAlpha: 0, yPercent: -10, scale: 0.6 });
          this.isAnimating = false;
          this.pinIslandToAnchor();
          this.trackPositionDuringLayoutChange(140);
        }
      })
      .to(this.island.nativeElement, { 
        width: 48, 
        left: closedRect.left,
        top: closedRect.top,
        duration: closeDuration,
        ease: 'power2.inOut' 
      }, 0)
      .to(this.searchCircle.nativeElement, { opacity: 1, duration: 0.15, ease: 'power2.out' }, 0)
      .to(this.barTop.nativeElement, { opacity: 0, attr: { x1: 14, y1: 2, x2: 14, y2: 2 }, duration: 0.18, ease: 'power2.inOut' }, 0)
      .to(this.barBot.nativeElement, { attr: { x1: 10.5, y1: 10.5, x2: 14, y2: 14 }, duration: 0.18, ease: 'power2.inOut' }, 0)
      .to(this.backdrop.nativeElement, { opacity: 0, duration: closeDuration * 0.75, ease: 'power2.in' }, 0)
      .to(this.menuPanel.nativeElement, { 
        autoAlpha: 0, 
        yPercent: -10, 
        scale: 0.6, 
        duration: closeDuration,
        ease: 'power2.inOut' 
      }, 0);
    }
  }

  closeIfOpen() {
    if (this.isOpen) {
      this.toggle();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.isOpen) {
      this.toggle();
      this.toggleBtn.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    if (this.tl) {
      this.tl.kill();
    }
    window.removeEventListener('resize', this.schedulePositionUpdate);
    window.removeEventListener('scroll', this.schedulePositionUpdate, this.scrollListenerOptions);
    window.removeEventListener('archipedia:layout-shift', this.handleLayoutShift);
    this.resizeObserver?.disconnect();
    if (this.positionFrame) {
      cancelAnimationFrame(this.positionFrame);
    }
    if (this.layoutSyncFrame) {
      cancelAnimationFrame(this.layoutSyncFrame);
    }
  }
}
