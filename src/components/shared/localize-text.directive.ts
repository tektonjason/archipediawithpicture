import { AfterViewInit, Directive, ElementRef, OnDestroy, effect, inject } from '@angular/core';
import { LocaleService } from '../../services/locale.service';

const LOCALIZABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION']);

@Directive({
  selector: '[appLocalizeText]',
  standalone: true
})
export class LocalizeTextDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly locale = inject(LocaleService);
  private readonly originalText = new WeakMap<Text, string>();
  private readonly originalAttributes = new WeakMap<Element, Map<string, string>>();
  private observer?: MutationObserver;
  private frameId: number | null = null;
  private viewReady = false;
  private fullScanPending = true;
  private readonly pendingNodes = new Set<Node>();

  private readonly localeEffect = effect(() => {
    this.locale.locale();
    this.scheduleApply(true);
  });

  ngAfterViewInit() {
    this.viewReady = true;
    this.applyLocalization();
    this.fullScanPending = false;
    this.observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'childList') {
          record.addedNodes.forEach(node => this.pendingNodes.add(node));
        } else {
          this.pendingNodes.add(record.target);
        }
      }

      if (this.pendingNodes.size > 0) this.scheduleApply();
    });
    this.observer.observe(this.host.nativeElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: LOCALIZABLE_ATTRIBUTES
    });
  }

  ngOnDestroy() {
    this.localeEffect.destroy();
    this.observer?.disconnect();
    if (this.frameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.frameId);
    }
  }

  private scheduleApply(fullScan = false) {
    if (fullScan) this.fullScanPending = true;
    if (!this.viewReady) return;

    if (typeof requestAnimationFrame === 'undefined') {
      this.flushLocalization();
      return;
    }

    if (this.frameId !== null) return;
    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      this.flushLocalization();
    });
  }

  private flushLocalization() {
    if (this.fullScanPending) {
      this.fullScanPending = false;
      this.pendingNodes.clear();
      this.applyLocalization();
    } else {
      const nodes = Array.from(this.pendingNodes);
      this.pendingNodes.clear();
      nodes.forEach(node => this.walk(node));
    }

    // Ignore mutations produced by this directive's own text and attribute writes.
    this.observer?.takeRecords();
  }

  private applyLocalization() {
    this.walk(this.host.nativeElement);
  }

  private walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      this.localizeTextNode(node as Text);
      return;
    }

    if (!(node instanceof Element)) return;
    if (SKIP_TAGS.has(node.tagName) || node.hasAttribute('data-no-localize')) return;

    this.localizeAttributes(node);
    node.childNodes.forEach(child => this.walk(child));
  }

  private localizeTextNode(node: Text) {
    const current = node.nodeValue ?? '';
    if (!current.trim()) return;

    const previousOriginal = this.originalText.get(node);
    const previousEnglish = previousOriginal ? this.locale.translateToEnglish(previousOriginal) : null;
    const original = previousOriginal && (current === previousOriginal || current === previousEnglish) ? previousOriginal : current;

    this.originalText.set(node, original);
    const next = this.locale.translate(original);
    if (node.nodeValue !== next) {
      node.nodeValue = next;
    }
  }

  private localizeAttributes(element: Element) {
    let originals = this.originalAttributes.get(element);
    if (!originals) {
      originals = new Map<string, string>();
      this.originalAttributes.set(element, originals);
    }

    LOCALIZABLE_ATTRIBUTES.forEach(attribute => {
      if (!element.hasAttribute(attribute)) return;

      const current = element.getAttribute(attribute) ?? '';
      if (!current.trim()) return;

      const previousOriginal = originals.get(attribute);
      const previousEnglish = previousOriginal ? this.locale.translateToEnglish(previousOriginal) : null;
      const original = previousOriginal && (current === previousOriginal || current === previousEnglish) ? previousOriginal : current;

      originals.set(attribute, original);
      const next = this.locale.translate(original);
      if (current !== next) {
        element.setAttribute(attribute, next);
      }
    });
  }
}
