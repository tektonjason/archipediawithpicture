import { Directive, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, inject } from '@angular/core';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

@Directive({
  selector: '[appModalA11y]',
  standalone: true
})
export class ModalA11yDirective implements OnInit, OnDestroy {
  private static readonly stack: ModalA11yDirective[] = [];
  private static bodyLockCount = 0;
  private static previousBodyOverflow = '';

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private previousFocus: HTMLElement | null = null;
  private focusFrame = 0;

  @Output() modalClose = new EventEmitter<void>();

  ngOnInit() {
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ModalA11yDirective.stack.push(this);

    if (!this.host.hasAttribute('role')) this.host.setAttribute('role', 'dialog');
    if (!this.host.hasAttribute('aria-modal')) this.host.setAttribute('aria-modal', 'true');
    if (!this.host.hasAttribute('tabindex')) this.host.setAttribute('tabindex', '-1');

    if (ModalA11yDirective.bodyLockCount === 0) {
      ModalA11yDirective.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    ModalA11yDirective.bodyLockCount += 1;

    this.focusFrame = requestAnimationFrame(() => {
      this.focusFrame = 0;
      const preferred = this.host.querySelector<HTMLElement>('[autofocus]');
      const first = preferred ?? this.focusableElements()[0] ?? this.host;
      first.focus({ preventScroll: true });
    });
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent) {
    if (ModalA11yDirective.stack.at(-1) !== this) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.modalClose.emit();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = this.focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.host.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !this.host.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  ngOnDestroy() {
    if (this.focusFrame) cancelAnimationFrame(this.focusFrame);

    const stackIndex = ModalA11yDirective.stack.lastIndexOf(this);
    if (stackIndex >= 0) ModalA11yDirective.stack.splice(stackIndex, 1);

    ModalA11yDirective.bodyLockCount = Math.max(0, ModalA11yDirective.bodyLockCount - 1);
    if (ModalA11yDirective.bodyLockCount === 0) {
      document.body.style.overflow = ModalA11yDirective.previousBodyOverflow;
    }

    const focusTarget = this.previousFocus;
    if (focusTarget?.isConnected) {
      requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
    }
  }

  private focusableElements(): HTMLElement[] {
    return Array.from(this.host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter(element => !element.hasAttribute('hidden') && element.getClientRects().length > 0);
  }
}
