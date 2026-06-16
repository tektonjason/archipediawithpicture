import { Injectable, signal } from '@angular/core';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  readonly measurementId = 'G-G2R63VRYJK';

  isReady = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;

    this.isReady.set(typeof window.gtag === 'function');
  }

  trackPageView(path: string, title = document.title, sendToGoogle = true) {
    if (typeof window === 'undefined') return;

    const gtag = window.gtag;
    this.isReady.set(typeof gtag === 'function');
    if (sendToGoogle && typeof gtag === 'function') {
      gtag('event', 'page_view', {
        send_to: this.measurementId,
        page_title: title,
        page_path: path,
        page_location: window.location.href
      });
    }
  }
}
