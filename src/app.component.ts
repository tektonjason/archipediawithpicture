
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DataService } from './services/data.service';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  dataService = inject(DataService);
  // isSidebarOpen signal removed; using dataService.isSidebarOpen

  // Footer visibility state - Sidebar version
  isSidebarFooterCollapsed = signal(false);
  
  // Main Footer visibility (kept for backward compatibility if needed, but we are moving content to sidebar)
  isFooterVisible = signal(true);

  constructor() {
    // Check local storage for footer visibility state and apply it
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const footerState = localStorage.getItem('arch_footer_visible');
      if (footerState === 'false') {
        this.isFooterVisible.set(false);
      }
      
      const sidebarFooterState = localStorage.getItem('arch_sidebar_footer_collapsed');
      if (sidebarFooterState === 'true') {
        this.isSidebarFooterCollapsed.set(true);
      }
    }
  }

  toggleSidebarFooter() {
    this.isSidebarFooterCollapsed.update(v => !v);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('arch_sidebar_footer_collapsed', String(this.isSidebarFooterCollapsed()));
    }
  }

  hideFooter() {
    if (this.isFooterVisible()) {
      this.isFooterVisible.set(false);
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('arch_footer_visible', 'false');
      }
    }
  }

  toggleSidebar() {
    this.dataService.toggleSidebar();
  }
}
