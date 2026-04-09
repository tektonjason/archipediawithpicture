
// =================================================================
//
//  ARCHIPEDIA - Knowledge Base
//  Built by 曾若宽 (Zeng Ruokuan)
//
//  This content is for educational purposes only.
//  Unauthorized commercial use is strictly prohibited.
//
// =================================================================
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DataService } from './services/data.service';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  dataService = inject(DataService);
  private router = inject(Router);

  // Q&A Carousel Data
  qaQuestions = [
    "快题和课程设计有什么区别？", "SU插件在哪找？", "SU和犀牛哪个好？", "分析图画什么？", 
    "做设计无从下手？", "CAD怎么导出？", "CAD分解不了图块？", "SU模型不是实体？", 
    "Vray怎么批量渲染？", "历史沿革图怎么做？", "BIG风格的分析图怎么做？", 
    "公共设施的服务半径？", "ps怎么扣文字？", "论文参考文献怎么写？", 
    "CAD参考图怎么缩放到真实尺寸？", "怎么下载卫星图？", "怎么下载平面图？", 
    "效果图怎么画？", "可以刻图吗？", "手绘怎么练？", "马克笔怎么买？", 
    "看了案例也不知道怎么做？", "设计要从平面开始吗？", "周边场地怎么设计？", 
    "作品集是什么？", "多久开始做作品集？", "作品集要包括什么？", 
    "我需要学绘画吗？", "为什么我画不完图？", "Rhino模型又大又卡？", 
    "SU建出来的模型乱七八糟？", "建筑学就业有哪些？", "参数化设计要学吗？", 
    "AI怎么用于建筑设计？", "出图用PS合适吗？", "抄绘要抄什么?", 
    "古建筑测绘图怎么画？", "为什么每次都陷入拖延症？"
  ];
  
  currentQuestionIndex = signal(0);
  currentQuestion = computed(() => this.qaQuestions[this.currentQuestionIndex()]);
  private carouselInterval: any;

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

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.startCarousel();
    }
  }

  ngOnDestroy() {
    this.stopCarousel();
  }

  startCarousel() {
    this.carouselInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * this.qaQuestions.length);
      this.currentQuestionIndex.set(randomIndex);
    }, 4000);
  }

  stopCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  handleCarouselClick() {
    this.router.navigate(['/essentials'], { queryParams: { openQna: 'true' } });
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
