import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, CommonModule } from '@angular/common';
import { DataService, Reading } from '../../services/data.service';
import pinyin from 'pinyin';
import { AnimatedSearchBarComponent } from '../shared/animated-search-bar.component';
import { GsapHoverTooltipDirective } from '../shared/gsap-hover-tooltip.directive';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { gsap } from 'gsap';
import { ShareCardService } from '../../services/share-card.service';
import { downloadTextFile, formatCitationList, formatGbT7714 } from './citation';

type ReadingType = 'all' | 'books' | 'journals';

interface ReadingTheme {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

@Component({
  selector: 'app-readings',
  imports: [FormsModule, CommonModule, NgClass, RouterLink, AnimatedSearchBarComponent, GsapHoverTooltipDirective, GsapCardHoverDirective, ...APP_UI_ICONS],
  standalone: true,
  template: `
    <div class="ui-page ui-page-pad text-white" (wheel)="onPageWheel($event)">
      <div class="readings-chrome" [class.is-compact]="readingChromeCompact()">
      
      <!-- Header Section -->
      <div class="ui-page-header readings-hero">
        <h1 class="ui-title">建筑读物</h1>
        <p class="ui-subtitle readings-hero-copy mb-4">
          发现有价值的建筑书籍与期刊
        </p>

        <!-- Search Input -->
        @if (!readingChromeCompact()) {
          <div class="readings-hero-search relative w-full max-w-2xl mt-4 flex gap-4 items-center justify-center h-12 z-20">
            <app-animated-search-bar
              [query]="searchQuery()"
              (queryChange)="searchQuery.set($event)"
              placeholder="搜索书名、作者或出版社..."
            ></app-animated-search-bar>

            <button (click)="startEResourceFlow()" appGsapTooltip="获取受限电子资源" [hoverScale]="1.05" class="ui-btn-secondary h-12 whitespace-nowrap shadow-lg">
              电子资源
            </button>
          </div>
        }
      </div>

      <!-- Type Filter -->
      <div class="readings-type-filter flex justify-center mb-4 shrink-0">
        <div class="inline-flex items-center rounded-control border border-line bg-surface/80 p-1 shadow-sm">
          <button
            (click)="selectReadingType('all')"
            class="min-w-16 px-4 py-2 text-sm font-medium rounded-control transition-colors"
            [class.bg-white]="readingType() === 'all'"
            [class.text-black]="readingType() === 'all'"
            [class.text-gray-400]="readingType() !== 'all'"
            [class.hover:text-white]="readingType() !== 'all'"
          >全部</button>
          <button
            (click)="selectReadingType('books')"
            class="min-w-16 px-4 py-2 text-sm font-medium rounded-control transition-colors"
            [class.bg-white]="readingType() === 'books'"
            [class.text-black]="readingType() === 'books'"
            [class.text-gray-400]="readingType() !== 'books'"
            [class.hover:text-white]="readingType() !== 'books'"
          >书籍</button>
          <button
            (click)="selectReadingType('journals')"
            class="min-w-16 px-4 py-2 text-sm font-medium rounded-control transition-colors"
            [class.bg-white]="readingType() === 'journals'"
            [class.text-black]="readingType() === 'journals'"
            [class.text-gray-400]="readingType() !== 'journals'"
            [class.hover:text-white]="readingType() !== 'journals'"
          >期刊</button>
        </div>
      </div>

      <!-- Tags Filter -->
      <div class="readings-tags-filter flex flex-nowrap gap-2 mb-6 shrink-0 overflow-x-auto pb-2 custom-scrollbar mask-gradient justify-start px-1">
        <button 
          (click)="selectTag('all')"
          class="ui-chip flex-shrink-0 whitespace-nowrap"
          [class.bg-white]="selectedTag() === 'all'"
          [class.text-black]="selectedTag() === 'all'"
          [class.bg-white/5]="selectedTag() !== 'all'"
          [class.text-gray-300]="selectedTag() !== 'all'"
          [class.hover:bg-white/10]="selectedTag() !== 'all'"
        >全部</button>
        @for (tag of allTags(); track tag) {
          <button 
            (click)="selectTag(tag)"
            class="ui-chip flex-shrink-0 whitespace-nowrap"
            [class.bg-white]="selectedTag() === tag"
            [class.text-black]="selectedTag() === tag"
            [class.bg-white/5]="selectedTag() !== tag"
            [class.text-gray-300]="selectedTag() !== tag"
            [class.hover:bg-white/10]="selectedTag() !== tag"
          >
            {{ tag }}
          </button>
        }
      </div>

      <!-- Theme Booklists -->
      <div class="readings-theme-panel mb-6 shrink-0">
        <div class="flex items-center justify-between mb-2 px-1">
          <h2 class="text-xs font-bold uppercase tracking-wider text-gray-500">主题书单</h2>
          @if (activeTheme()) {
            <button
              (click)="selectTheme('all')"
              class="text-xs font-medium text-gray-500 hover:text-white transition-colors"
            >全部主题</button>
          }
        </div>

        <div class="flex flex-nowrap gap-2 overflow-x-auto pb-2 custom-scrollbar mask-gradient px-1">
          @for (theme of readingThemes; track theme.id) {
            <button
              (click)="selectTheme(theme.id)"
              class="ui-chip flex-shrink-0 whitespace-nowrap"
              [class.bg-blue-500]="selectedTheme() === theme.id"
              [class.text-white]="selectedTheme() === theme.id"
              [class.border-blue-400]="selectedTheme() === theme.id"
              [class.bg-white/5]="selectedTheme() !== theme.id"
              [class.text-gray-300]="selectedTheme() !== theme.id"
              [class.hover:bg-white/10]="selectedTheme() !== theme.id"
            >
              {{ theme.title }}
              <span class="ml-1 text-[10px] opacity-60">{{ themeCount(theme) }}</span>
            </button>
          }
        </div>

        @if (activeTheme(); as theme) {
          <div class="mt-3 rounded-control border border-blue-500/20 bg-blue-500/10 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <svg lucideBookOpen class="w-4 h-4 text-blue-300 shrink-0" [strokeWidth]="2"></svg>
                <h3 class="text-sm font-semibold text-blue-100 truncate">{{ theme.title }}</h3>
                <span class="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-blue-100">{{ filteredReadings().length }} 项</span>
              </div>
              <p class="mt-1 text-xs text-blue-100/70 leading-relaxed">{{ theme.description }}</p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button
                (click)="copyThemeReadingList()"
                class="ui-btn-secondary h-10"
                appGsapTooltip="复制当前主题下的书单"
              >
                <svg lucideCopy class="w-4 h-4" [strokeWidth]="2"></svg>
                <span>复制书单</span>
              </button>
              <button
                (click)="downloadThemeCitations()"
                class="ui-btn-secondary h-10"
                appGsapTooltip="导出 GB/T 7714-2015 引用"
              >
                <svg lucideDownload class="w-4 h-4" [strokeWidth]="2"></svg>
                <span>导出引用</span>
              </button>
            </div>
          </div>
        }
      </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 relative overflow-hidden">
        <div
          #scrollContainer
          class="h-full overflow-y-auto pb-20 hide-scrollbar"
          [class.pr-10]="filteredReadings().length > 0"
          (scroll)="onScroll()"
          (wheel)="onReadingWheel($event)"
          (touchstart)="onReadingTouchStart($event)"
          (touchmove)="onReadingTouchMove($event)"
        >
          @if (filteredReadings().length === 0) {
            <div class="ui-empty-state h-60 opacity-80">
              <div class="ui-empty-icon"><svg lucideBookOpen class="w-8 h-8" [strokeWidth]="1.8"></svg></div>
              <p class="font-medium text-lg">未找到相关读物</p>
              <p class="text-gray-500 text-sm mt-1">请尝试更换关键词或进入对应分类查找</p>
              <button 
                [routerLink]="['/about']"
                class="ui-btn-secondary mt-4"
              >
                向我们反馈
              </button>
            </div>
          } @else {
            @for (group of groupedReadings(); track group.letter) {
              <div class="relative mb-8">
                <div [attr.data-letter]="group.letter" class="letter-anchor absolute -top-4"></div>
                <h2 class="text-xl font-bold text-gray-500 mb-4 sticky top-0 bg-app/90 backdrop-blur-sm z-10 py-2 border-b border-line-soft">
                  {{ group.letter }}
                </h2>
                
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  @for (item of group.readings; track item.title; let i = $index) {
                    <div 
                       (click)="openModal(item)" 
                       class="group cursor-pointer flex flex-col gap-3 animate-fade-in-up" 
                       [style.animation-delay]="(i % 21 * 30) + 'ms'" 
                       appGsapCardHover
                     >
                      <!-- Book Cover -->
                      <div class="entry-image aspect-[2/3] bg-surface rounded-control border border-line-soft overflow-hidden relative shadow-lg">
                        @if (item.imageUrl && !failedImages().has(item.id)) {
                          <img [src]="item.imageUrl" [alt]="item.title" loading="lazy" decoding="async" class="w-full h-full object-cover" (error)="handleImageError(item.id)">
                        } @else {
                          <div class="absolute inset-0 bg-gradient-to-br from-[#2a2a2e] to-[#18181b] flex items-center justify-center p-4 text-center">
                             <div class="absolute inset-x-4 top-0 h-[1px] bg-white/10"></div>
                             <div class="absolute inset-y-0 left-3 w-[2px] bg-black/20 h-full"></div>
                             <h3 class="font-serif font-bold text-gray-300 text-sm line-clamp-3 leading-snug">{{ item.title }}</h3>
                          </div>
                        }
                        @if(item.journalLevel) {
                          <div class="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded shadow-sm" [ngClass]="getJournalClass(item.journalLevel)">
                            {{ item.journalLevel }}
                          </div>
                        }
                      </div>
                      
                      <div class="entry-content">
                        <h3 class="font-medium text-sm text-gray-200 line-clamp-1 group-hover:text-blue-400 transition-colors">{{ item.title }}</h3>
                        <p class="text-xs text-gray-500 truncate">{{ item.author || item.publisher }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
        
        <!-- Scrubber -->
        @if (groupedReadings().length > 0) {
          <div 
            class="absolute top-0 right-0 h-full flex items-center py-4 z-20"
          >
            <div 
              #scrubber
              class="relative bg-white/5 rounded-full flex flex-col gap-0.5 p-1 cursor-pointer select-none touch-none shadow-lg backdrop-blur-sm"
              (touchstart)="onScrubStart($event)"
              (touchmove)="onScrubMove($event)"
              (touchend)="onScrubEnd()"
              (mousedown)="onScrubStart($event)"
            >
              @for (letter of alphabet; track letter) {
                <button 
                  class="w-4 h-4 text-[9px] font-bold rounded-full transition-all duration-150 flex items-center justify-center relative z-10"
                  [class.text-gray-600]="!availableLetters().has(letter)"
                  [class.pointer-events-none]="!availableLetters().has(letter)"
                  [class.bg-white]="letter === (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  [class.text-black]="letter === (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  [class.scale-125]="letter === (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  [class.hover:text-white]="availableLetters().has(letter) && letter !== (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  [class.text-gray-400]="availableLetters().has(letter) && letter !== (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  (click)="scrollToLetter(letter)"
                >
                  {{ letter }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Detail Modal -->
      @if (selectedReading(); as item) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            #readingModalBackdrop
            class="absolute inset-0 bg-black/80 backdrop-blur-md"
            (click)="closeModal()"
          ></div>
          
          <div 
            #readingModalPanel
            class="reading-modal-panel ui-modal-panel w-full max-w-4xl flex overflow-hidden"
            [class.pointer-events-none]="isClosing()"
          >
            <button (click)="closeModal()" class="absolute top-4 right-4 z-20 ui-icon-btn bg-black/50 active:scale-90">
              <svg lucideX class="w-5 h-5" [strokeWidth]="2"></svg>
            </button>

            <!-- Layout: Image Left, Content Right -->
            <div class="reading-modal-layout flex flex-col md:flex-row w-full h-full min-h-0">
               
               <!-- Left: Cover Image Area -->
               <div class="hidden md:flex md:w-2/5 bg-app items-center justify-center p-6 md:p-8 relative overflow-hidden shrink-0">
                  <!-- Abstract background pattern -->
                  <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 32px 32px;"></div>
                  
                  <!-- Book Cover Mockup -->
                  <div #readingModalCover class="reading-cover-preview relative w-full max-w-[320px] aspect-[2/3] bg-gradient-to-br from-[#2a2a2e] to-[#121214] shadow-2xl rounded-sm border-l-4 border-white/5 flex flex-col items-center justify-center overflow-hidden">
                     @if (item.imageUrl && !failedImages().has(item.id)) {
                       <img [src]="item.imageUrl" [alt]="item.title" loading="lazy" decoding="async" class="w-full h-full object-cover" (error)="handleImageError(item.id)">
                     } @else {
                       <div class="flex flex-col p-4 md:p-6 text-center justify-center h-full w-full relative">
                         <div class="absolute inset-y-0 left-2 w-[1px] bg-white/5"></div>
                         <h2 class="font-serif font-bold text-gray-200 text-lg md:text-xl leading-tight mb-2">{{ item.title }}</h2>
                         <p class="text-xs text-gray-500 uppercase tracking-widest">{{ item.author }}</p>
                       </div>
                     }
                  </div>
               </div>

               <!-- Right: Content -->
               <div class="reading-modal-content flex-1 flex flex-col overflow-hidden min-h-0">
                  <div class="reading-modal-scroll flex-1 p-5 md:p-8 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                  <h2 class="reading-modal-stagger text-2xl md:text-3xl font-bold text-white leading-tight mb-2 pr-8 md:pr-0">{{ item.title }}</h2>
                  <p class="reading-modal-stagger text-base md:text-lg text-gray-400 font-medium mb-4 md:mb-6">{{ item.author || item.publisher }}</p>
                  
                  <div class="reading-modal-stagger space-y-4 md:space-y-6 flex-1">
                    <div>
                      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">内容简介</h4>
                      <p class="text-sm text-gray-300 leading-relaxed font-serif">
                        {{ item.description }}
                      </p>

                    </div>

                    <div class="mt-6">
                      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">详细介绍</h4>
                      <div class="reading-detail-scrollbox overflow-y-auto custom-scrollbar pr-2">
                        <p class="text-sm text-gray-300 leading-relaxed font-serif whitespace-pre-wrap">{{ item.detailContent }}</p>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-white/10">
                       <div>
                          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">出版社</label>
                          <span class="text-sm text-white font-medium">{{ item.publisher }}</span>
                       </div>
                       <div>
                          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ISBN</label>
                          <span class="text-sm text-white font-mono">{{ item.identifier || '暂无' }}</span>
                       </div>
                       <div>
                          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">分类</label>
                          <div class="flex flex-wrap gap-1 mt-1">
                            @for(t of item.tags; track $index) {
                                <span class="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">{{ t }}</span>
                            }
                          </div>
                       </div>
                       @if(item.journalLevel) {
                         <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">等级</label>
                            <span class="px-2 py-0.5 text-xs font-bold rounded" [ngClass]="getJournalClass(item.journalLevel)">{{ item.journalLevel }}</span>
                         </div>
                       }
                    </div>

                    <div class="pt-4 md:pt-6 border-t border-white/10">
                      <div class="flex items-center justify-between gap-3 mb-2">
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">GB/T 7714-2015 引用</h4>
                        <span class="text-[10px] text-gray-600">{{ item.citation.verifiedBy }}</span>
                      </div>
                      <p class="rounded-control bg-black/20 border border-line-soft p-3 text-xs leading-relaxed text-gray-300 font-mono">
                        {{ citationText(item) }}
                      </p>
                    </div>
                  </div>
                  </div>

                  <div #readingModalActions class="reading-modal-actions bg-surface border-t border-line z-10 shrink-0">
                    <a
                      (click)="dataService.openExternalModal(getSearchUrl(item))"
                      class="reading-action-primary ui-btn-primary cursor-pointer active:scale-[0.98]"
                      title="在线搜索"
                      appGsapTooltip="在线搜索"
                    >
                       <svg lucideSearch class="w-5 h-5" [strokeWidth]="2"></svg>
                       <span>在线搜索</span>
                    </a>
                    <button
                      (click)="copyCitation(item)"
                      class="reading-action-icon ui-btn-secondary"
                      title="复制引用"
                      aria-label="复制引用"
                      appGsapTooltip="复制 GB/T 引用"
                    >
                      <svg lucideCopy class="w-5 h-5" [strokeWidth]="2"></svg>
                    </button>
                    <button
                      (click)="downloadCitation(item)"
                      class="reading-action-icon ui-btn-secondary"
                      title="下载引用"
                      aria-label="下载引用"
                      appGsapTooltip="下载 GB/T 引用"
                    >
                      <svg lucideDownload class="w-5 h-5" [strokeWidth]="2"></svg>
                    </button>

                    <div class="reading-share-wrap relative">
                      <button
                        (click)="handleShare($event)"
                        class="reading-action-icon ui-btn-secondary active:scale-95"
                        title="分享"
                        aria-label="分享"
                        appGsapTooltip="打开分享菜单"
                      >
                         <svg lucideShare2 class="w-5 h-5" [strokeWidth]="2"></svg>
                      </button>

                      <!-- Share Menu -->
                      @if (showShareMenu()) {
                        <div #readingShareMenu (click)="$event.stopPropagation()" class="reading-share-menu absolute bottom-full right-0 mb-3 w-52 ui-card shadow-panel overflow-hidden z-30 flex flex-col">
                           @if (shareMenuNotice()) {
                              <div class="bg-green-500/10 text-green-400 text-[10px] font-bold text-center py-1.5 border-b border-green-500/20">
                                {{ shareMenuNotice() }}
                              </div>
                            }

                            <div class="p-1.5 flex flex-col gap-1">
                              <button
                                type="button"
                                (click)="shareReadingCard(item)"
                                [disabled]="isGeneratingCard()"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-left"
                              >
                                <div class="w-6 h-6 rounded bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                                  <svg lucideImage class="w-4 h-4 text-gray-200" [strokeWidth]="2"></svg>
                                </div>
                                {{ isGeneratingCard() ? '正在生成...' : '生成分享图像' }}
                              </button>
                              <div class="h-px bg-white/10 my-1"></div>
                              <a
                                [href]="getPlatformUrl('wechat', item)"
                                target="_blank"
                                (click)="openShareTarget($event, item, 'wechat')"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group"
                              >
                                <div class="w-6 h-6 rounded bg-[#07c160] flex items-center justify-center shrink-0">
                                  <span class="text-[10px] font-bold text-white">微</span>
                               </div>
                               微信
                             </a>
                              <a
                                [href]="getPlatformUrl('taobao', item)"
                                target="_blank"
                                (click)="openShareTarget($event, item, 'taobao')"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group"
                              >
                                <div class="w-6 h-6 rounded bg-[#ff5000] flex items-center justify-center shrink-0">
                                  <span class="text-[10px] font-bold text-white">淘</span>
                                </div>
                                淘宝
                              </a>
                              <a
                                [href]="getPlatformUrl('jd', item)"
                                target="_blank"
                                (click)="openShareTarget($event, item, 'jd')"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group"
                              >
                                <div class="w-6 h-6 rounded bg-[#e1251b] flex items-center justify-center shrink-0">
                                  <span class="text-[10px] font-bold text-white">JD</span>
                                </div>
                                京东
                              </a>
                              <a
                                [href]="getPlatformUrl('duozhuayu', item)"
                                target="_blank"
                                (click)="openShareTarget($event, item, 'duozhuayu')"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group"
                              >
                                <div class="w-6 h-6 rounded bg-[#499d75] flex items-center justify-center shrink-0">
                                  <svg lucideBookOpen class="w-4 h-4 text-white" [strokeWidth]="2"></svg>
                                </div>
                                多抓鱼
                              </a>
                              <a
                                [href]="getPlatformUrl('zhuanzhuan', item)"
                                target="_blank"
                                (click)="openShareTarget($event, item, 'zhuanzhuan')"
                                class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group"
                              >
                               <div class="w-6 h-6 rounded bg-[#ff3d3d] flex items-center justify-center shrink-0">
                                 <span class="text-[10px] font-bold text-white">转</span>
                               </div>
                               转转
                             </a>
                           </div>
                        </div>
                      }
                    </div>
                  </div>

               </div>
            </div>
          </div>
        </div>
      }

      <!-- E-Resource Access Modals (Dark Mode) -->
      @if (eResourceFlowStep() !== 'closed') {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="closeEResourceFlow()"></div>
          
          <div class="ui-modal-panel w-full max-w-md flex flex-col animate-modal-pop-in overflow-hidden">
             
             <!-- Modal Header -->
             <div class="ui-modal-header block">
               <h3 class="font-bold text-lg text-white text-center">
                 @switch(eResourceFlowStep()) {
                   @case('verification') { 学生身份验证 }
                   @case('declaration') { 资源使用声明 }
                   @case('resources') { 获取电子资源 }
                 }
               </h3>
             </div>

             <!-- Content -->
             <div class="ui-modal-body">
                @switch(eResourceFlowStep()) {
                  @case('verification') {
                    <div class="flex flex-col gap-4">
                      <div>
                        <label class="ui-label">学校</label>
                        <input [(ngModel)]="verificationForm().school" type="text" placeholder="请输入学校全称" class="ui-field">
                      </div>
                      <div>
                        <label class="ui-label">学院</label>
                        <input [(ngModel)]="verificationForm().college" type="text" placeholder="请输入学院全称" class="ui-field">
                      </div>
                      <div>
                        <label class="ui-label">专业</label>
                        <input [(ngModel)]="verificationForm().major" type="text" placeholder="请输入专业全称" class="ui-field">
                      </div>
                      <div>
                        <label class="ui-label">学号</label>
                        <input [(ngModel)]="verificationForm().studentId" type="text" placeholder="请输入学号" class="ui-field">
                      </div>

                      @if (verificationStatus() !== 'idle' && verificationMessage()) {
                        <div class="text-center text-sm font-medium p-2 rounded bg-white/5 border" 
                          [class.text-green-400]="verificationStatus() === 'success'"
                          [class.border-green-500/30]="verificationStatus() === 'success'"
                          [class.text-red-400]="verificationStatus() === 'error'"
                          [class.border-red-500/30]="verificationStatus() === 'error'"
                        >
                           {{ verificationMessage() }}
                        </div>
                      }
                    </div>
                  }
                  @case('declaration') {
                    <div class="text-sm text-gray-300 space-y-4 leading-relaxed max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                      <p><strong class="text-white">本人确认：</strong><br>本人为宁夏大学建筑学院{{ verificationForm().major }}专业学生，学号 {{ verificationForm().studentId }}。</p>
                      <p><strong class="text-white">本人已知晓：</strong><br>本应用所提供的电子读物资源仅限宁夏大学建筑学院校内教学与学习使用，不具备对外传播、商业使用或二次分发授权。</p>
                      <p><strong class="text-white">本人承诺：</strong><br>不对上述电子资源进行传播、转卖、公开分享或任何形式的非法使用。</p>
                      <p>若因本人违反上述约定而产生任何版权纠纷或法律责任，均由本人自行承担，与平台及资源整理方无关。</p>
                    </div>
                  }
                  @case('resources') {
                    <div class="bg-app p-4 rounded-control border border-line text-sm font-mono text-gray-300 break-all whitespace-pre-wrap">
                      {{ resourceLinkText() }}
                    </div>
                  }
                }
             </div>

             <!-- Footer -->
             <div class="ui-modal-footer">
                @switch(eResourceFlowStep()) {
                  @case('verification') {
                    <button (click)="closeEResourceFlow()" class="ui-btn-ghost">取消</button>
                    <button (click)="handleVerification()" class="ui-btn-primary">
                      {{ verificationStatus() === 'verifying' ? '核验中...' : '核验' }}
                    </button>
                  }
                  @case('declaration') {
                    <button (click)="goToResourcesStep()" [disabled]="declarationCountdown() > 0" class="ui-btn-primary">
                      {{ declarationCountdown() > 0 ? '请等待 ' + declarationCountdown() + 's' : '确认并继续' }}
                    </button>
                  }
                  @case('resources') {
                    <button (click)="copyResourceInfo()" class="ui-btn-primary">{{ copyButtonText() }}</button>
                  }
                }
             </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .mask-gradient {
      mask-image: linear-gradient(to right, black 85%, transparent 100%);
    }
    .readings-chrome {
      max-height: 640px;
      overflow: hidden;
      transition: max-height 320ms cubic-bezier(0.16, 1, 0.3, 1);
      will-change: max-height;
    }
    .readings-hero,
    .readings-hero-copy,
    .readings-hero-search,
    .readings-type-filter,
    .readings-tags-filter,
    .readings-theme-panel {
      transition:
        margin 260ms cubic-bezier(0.16, 1, 0.3, 1),
        max-height 260ms cubic-bezier(0.16, 1, 0.3, 1),
        opacity 220ms ease,
        transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
        padding 260ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .readings-hero-copy {
      max-height: 4rem;
    }
    .readings-hero-search {
      max-height: 4.5rem;
    }
    .readings-theme-panel {
      max-height: 22rem;
    }
    .readings-hero .ui-title {
      transition: font-size 260ms cubic-bezier(0.16, 1, 0.3, 1), line-height 260ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .readings-chrome.is-compact {
      max-height: 150px;
    }
    .readings-chrome.is-compact .readings-hero {
      margin-bottom: 0.5rem;
      transform: translateY(-2px);
    }
    .readings-chrome.is-compact .readings-hero .ui-title {
      font-size: 1.375rem;
      line-height: 1.15;
    }
    .readings-chrome.is-compact .readings-hero-copy,
    .readings-chrome.is-compact .readings-hero-search,
    .readings-chrome.is-compact .readings-theme-panel {
      max-height: 0;
      margin-top: 0;
      margin-bottom: 0;
      padding-top: 0;
      padding-bottom: 0;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-8px);
    }
    .readings-chrome.is-compact .readings-type-filter {
      margin-bottom: 0.5rem;
    }
    .readings-chrome.is-compact .readings-tags-filter {
      margin-bottom: 0.75rem;
      padding-bottom: 0.25rem;
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.44s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }
    .reading-modal-panel {
      transform-origin: center center;
      height: min(85vh, 860px);
      max-height: calc(100svh - 2rem);
    }
    .reading-modal-layout,
    .reading-modal-content {
      min-height: 0;
    }
    .reading-modal-scroll {
      min-height: 0;
      overscroll-behavior: contain;
    }
    .reading-detail-scrollbox {
      max-height: clamp(8rem, 18svh, 14rem);
      scrollbar-gutter: stable;
    }
    .reading-modal-actions {
      display: grid;
      grid-template-columns: minmax(12rem, 1fr) repeat(3, 3rem);
      gap: 0.75rem;
      align-items: stretch;
      padding: 1.25rem 2rem 1.5rem;
    }
    .reading-action-primary,
    .reading-action-icon {
      min-height: 3rem;
    }
    .reading-action-primary {
      justify-content: center;
      min-width: 0;
    }
    .reading-action-primary span {
      white-space: nowrap;
    }
    .reading-action-icon {
      width: 3rem;
      padding-inline: 0;
      justify-content: center;
    }
    .reading-cover-preview {
      transform-origin: center center;
      transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 420ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reading-cover-preview:hover {
      transform: translateY(-3px) scale(1.025);
      box-shadow: 0 28px 70px -32px rgba(59, 130, 246, 0.55), 0 24px 55px -28px rgba(0, 0, 0, 0.85);
    }
    .reading-share-menu {
      transform-origin: bottom right;
    }
    @media (max-height: 780px) and (min-width: 768px) {
      .reading-detail-scrollbox {
        max-height: clamp(6.5rem, 15svh, 10rem);
      }
      .reading-modal-scroll {
        padding-top: 1.5rem;
        padding-bottom: 1.25rem;
      }
      .reading-modal-actions {
        padding-top: 1rem;
        padding-bottom: 1.25rem;
      }
    }
    @media (max-width: 767px) {
      .reading-modal-panel {
        width: calc(100vw - 2rem);
        height: min(82svh, calc(100svh - 2rem));
        max-height: calc(100svh - 2rem);
      }
      .reading-modal-scroll {
        padding: 1.25rem;
        padding-bottom: 1rem;
      }
      .reading-detail-scrollbox {
        max-height: clamp(7.5rem, 22svh, 13rem);
      }
      .reading-modal-actions {
        grid-template-columns: minmax(0, 1.35fr) repeat(3, minmax(3.25rem, 0.55fr));
        gap: 0.75rem;
        padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));
      }
      .reading-action-primary,
      .reading-action-icon {
        min-height: 3.25rem;
      }
      .reading-action-primary {
        padding-inline: 0.75rem;
      }
      .reading-action-icon {
        width: 100%;
      }
      .reading-share-wrap {
        min-width: 0;
      }
      .reading-share-menu {
        width: min(13rem, calc(100vw - 3rem));
      }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px) scale(0.985); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .readings-chrome,
      .readings-hero,
      .readings-hero-copy,
      .readings-hero-search,
      .readings-type-filter,
      .readings-tags-filter,
      .readings-theme-panel,
      .readings-hero .ui-title {
        transition-duration: 0.01ms;
      }
      .reading-cover-preview {
        transition-duration: 0.01ms;
      }
      .reading-cover-preview:hover {
        transform: none;
      }
    }
  `]
})
export class ReadingsComponent implements AfterViewInit, OnDestroy {
  dataService = inject(DataService);
  private zone = inject(NgZone);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private shareCardService = inject(ShareCardService);
  searchQuery = signal('');
  selectedTag = signal('all');
  readingType = signal<ReadingType>('all');
  selectedTheme = signal('all');
  selectedReading = signal<Reading | null>(null);
  isClosing = signal(false);
  isGeneratingCard = signal(false);

  failedImages = signal<Set<string>>(new Set());

  readingThemes: ReadingTheme[] = [
    {
      id: 'design-foundation',
      title: '设计基础',
      description: '从空间、形式、构成与设计训练入门，适合建立建筑学基础语感。',
      tags: ['建筑设计', '高校教材', '建筑教育']
    },
    {
      id: 'history-theory',
      title: '史论入门',
      description: '把建筑史、理论与文化放在一起读，适合补足批判性阅读背景。',
      tags: ['建筑史', '建筑理论', '建筑文化']
    },
    {
      id: 'urban-public',
      title: '城市公共',
      description: '围绕城市规划、公共空间与社会生活，适合城市设计方向阅读。',
      tags: ['城市规划', '建筑文化', '建筑理论']
    },
    {
      id: 'tools-research',
      title: '工具研究',
      description: '偏工具书、期刊与研究资料，适合查术语、找文献和做专题调研。',
      tags: ['专业工具', '期刊']
    },
    {
      id: 'portfolio-practice',
      title: '作品实践',
      description: '偏作品集、案例与表达训练，适合方案参考和作品集准备。',
      tags: ['作品集', '建筑设计', '建筑教育']
    }
  ];

  handleImageError(id: string | undefined) {
    if (!id) return;
    this.failedImages.update(s => {
      const newSet = new Set(s);
      newSet.add(id);
      return newSet;
    });
  }

  // E-Resource Flow State
  eResourceFlowStep = signal<'closed' | 'verification' | 'declaration' | 'resources'>('closed');
  verificationForm = signal({ school: '', college: '', major: '', studentId: '' });
  verificationStatus = signal<'idle' | 'verifying' | 'success' | 'error'>('idle');
  verificationMessage = signal('');
  declarationCountdown = signal(0);
  copyButtonText = signal('复制链接');
  private countdownInterval: any;
  private scrollFrame = 0;
  private tagResetFrame = 0;
  private modalCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private verificationTimer: ReturnType<typeof setTimeout> | null = null;
  private declarationTimer: ReturnType<typeof setTimeout> | null = null;
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;
  private shareResetTimer: ReturnType<typeof setTimeout> | null = null;
  private modalEnterFrame = 0;
  private shareMenuEnterFrame = 0;
  private lastReadingScrollTop = 0;
  private lastReadingTouchY = 0;
  private readingModalTl?: gsap.core.Timeline;
  private shareMenuTl?: gsap.core.Tween;
  private prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lastScrubScrollTarget = '';

  // Scrubber State
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scrubber') scrubber!: ElementRef<HTMLElement>;
  @ViewChild('readingModalBackdrop') readingModalBackdrop?: ElementRef<HTMLDivElement>;
  @ViewChild('readingModalPanel') readingModalPanel?: ElementRef<HTMLDivElement>;
  @ViewChild('readingModalCover') readingModalCover?: ElementRef<HTMLDivElement>;
  @ViewChild('readingModalActions') readingModalActions?: ElementRef<HTMLDivElement>;
  @ViewChild('readingShareMenu') readingShareMenu?: ElementRef<HTMLDivElement>;
  alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  currentLetter = signal('#');
  isScrubbing = signal(false);
  scrubbingLetter = signal('#');
  readingChromeCompact = signal(false);

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const readingId = params.get('reading');
      if (!readingId || this.selectedReading()?.id === readingId) return;
      const reading = this.dataService.readings().find(item => item.id === readingId);
      if (reading) this.openModal(reading, false);
    });
  }
  
  // Cache available letters for visual feedback
  availableLetters = computed(() => {
    const letters = new Set<string>();
    // Use filteredReadings() instead of all readings to match current category context
    this.filteredReadings().forEach(r => {
      const pinyinResult = pinyin(r.title, { style: pinyin.STYLE_FIRST_LETTER })[0][0];
      const firstChar = pinyinResult.charAt(0).toUpperCase();
      const letter = /^[A-Z]/.test(firstChar) ? firstChar : '#';
      letters.add(letter);
    });
    return letters;
  });

  allTags = computed(() => {
    const tags = new Set<string>();
    this.dataService.readings().forEach(r => r.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  });

  activeTheme = computed(() => {
    return this.readingThemes.find(theme => theme.id === this.selectedTheme()) ?? null;
  });

  filteredReadings = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const tag = this.selectedTag();
    const type = this.readingType();
    const theme = this.activeTheme();
    return this.dataService.readings().filter(r => {
      const matchSearch = !q || r.title.toLowerCase().includes(q) || (r.author || '').toLowerCase().includes(q) || r.publisher.toLowerCase().includes(q);
      const matchTag = tag === 'all' || r.tags.includes(tag);
      const matchType = this.matchesReadingType(r, type);
      const matchTheme = !theme || this.matchesTheme(r, theme);
      return matchSearch && matchTag && matchType && matchTheme;
    });
  });

  groupedReadings = computed(() => {
    const groups: { letter: string, readings: Reading[] }[] = [];
    const map = new Map<string, Reading[]>();
    
    this.filteredReadings().forEach(r => {
      const pinyinResult = pinyin(r.title, { style: pinyin.STYLE_FIRST_LETTER })[0][0];
      const firstChar = pinyinResult.charAt(0).toUpperCase();
      const letter = /^[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(r);
    });

    // Sort letters: # at end or beginning? Usually # is at end or beginning. 
    // Let's put # at the beginning as "0-9/Symbols"
    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      groups.push({ letter: key, readings: map.get(key)! });
    });

    return groups;
  });

  ngAfterViewInit() {
    // Scroll listener is attached in template
  }

  ngOnDestroy() {
    this.clearDeferredTimers();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
    if (this.tagResetFrame) cancelAnimationFrame(this.tagResetFrame);
    if (this.modalEnterFrame) cancelAnimationFrame(this.modalEnterFrame);
    if (this.shareMenuEnterFrame) cancelAnimationFrame(this.shareMenuEnterFrame);
    this.readingModalTl?.kill();
    this.shareMenuTl?.kill();
  }

  private clearDeferredTimers() {
    if (this.modalCloseTimer) clearTimeout(this.modalCloseTimer);
    if (this.verificationTimer) clearTimeout(this.verificationTimer);
    if (this.declarationTimer) clearTimeout(this.declarationTimer);
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
    if (this.shareResetTimer) clearTimeout(this.shareResetTimer);
    this.modalCloseTimer = null;
    this.verificationTimer = null;
    this.declarationTimer = null;
    this.copyResetTimer = null;
    this.shareResetTimer = null;
  }

  private matchesReadingType(item: Reading, type: ReadingType = this.readingType()) {
    if (type === 'all') return true;
    const isJournal = this.isJournal(item);
    return type === 'journals' ? isJournal : !isJournal;
  }

  private matchesTheme(item: Reading, theme: ReadingTheme) {
    return theme.tags.some(tag => item.tags.includes(tag));
  }

  themeCount(theme: ReadingTheme) {
    return this.dataService.readings().filter(item => this.matchesReadingType(item) && this.matchesTheme(item, theme)).length;
  }

  selectReadingType(type: ReadingType) {
    if (this.readingType() === type) return;
    this.readingType.set(type);
    this.expandReadingChrome();
    this.resetReadingPosition();
  }

  selectTheme(themeId: string) {
    if (this.selectedTheme() === themeId) return;
    this.selectedTheme.set(themeId);
    this.selectedTag.set('all');
    this.searchQuery.set('');
    this.expandReadingChrome();
    this.resetReadingPosition();
  }

  selectTag(tag: string) {
    if (this.selectedTag() !== tag) {
      this.searchQuery.set('');
    }
    this.selectedTheme.set('all');
    this.selectedTag.set(tag);
    this.expandReadingChrome();
    this.resetReadingPosition();
  }

  private resetReadingPosition() {
    if (this.tagResetFrame) {
      cancelAnimationFrame(this.tagResetFrame);
    }
    this.tagResetFrame = requestAnimationFrame(() => {
      this.tagResetFrame = 0;
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'auto' });
        this.lastReadingScrollTop = 0;
        
        // Reset current letter to the first available letter in the new list
        const available = Array.from(this.availableLetters()).sort((a, b) => {
          if (a === '#') return -1;
          if (b === '#') return 1;
          return a.localeCompare(b);
        });
        
        if (available.length > 0) {
          this.currentLetter.set(available[0]);
        } else {
          this.currentLetter.set('#');
        }
      }
    });
  }

  copyThemeReadingList() {
    const theme = this.activeTheme();
    if (!theme) return;

    const rows = this.filteredReadings().map((item, index) => {
      const meta = [item.author, item.publisher, item.identifier].filter(Boolean).join(' / ');
      return meta ? `${index + 1}. ${item.title} - ${meta}` : `${index + 1}. ${item.title}`;
    });

    const text = `${theme.title}主题书单\n${theme.description}\n\n${rows.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      this.dataService.displayToast('主题书单已复制');
    });
  }

  downloadThemeCitations() {
    const theme = this.activeTheme();
    if (!theme) return;
    const content = `${theme.title}主题书单\n${theme.description}\n\n${formatCitationList(this.filteredReadings())}`;
    downloadTextFile(content, `${theme.title}-GB-T-7714.txt`);
    this.dataService.displayToast('主题书单引用已导出');
  }

  openModal(item: Reading, updateRoute = true) {
    if (this.modalCloseTimer) {
      clearTimeout(this.modalCloseTimer);
      this.modalCloseTimer = null;
    }
    if (this.modalEnterFrame) {
      cancelAnimationFrame(this.modalEnterFrame);
      this.modalEnterFrame = 0;
    }
    this.readingModalTl?.kill();
    this.closeShareMenu();
    this.isClosing.set(false);
    this.selectedReading.set(item);
    if (updateRoute && item.id) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { reading: item.id },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
    this.scheduleReadingModalEnter();
  }

  closeModal() {
    if (!this.selectedReading() || this.isClosing()) return;
    this.isClosing.set(true);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { reading: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.closeShareMenu();
    if (this.modalCloseTimer) clearTimeout(this.modalCloseTimer);
    if (this.modalEnterFrame) {
      cancelAnimationFrame(this.modalEnterFrame);
      this.modalEnterFrame = 0;
    }

    const targets = this.getReadingModalTargets();
    if (this.prefersReducedMotion || !targets.backdrop || !targets.panel) {
      this.modalCloseTimer = setTimeout(() => this.finishReadingModalClose(), 0);
      return;
    }

    this.readingModalTl?.kill();
    this.zone.runOutsideAngular(() => {
      this.setReadingModalWillChange(true, targets);
      this.readingModalTl = gsap.timeline({
        defaults: { overwrite: 'auto', force3D: true },
        onComplete: () => this.zone.run(() => this.finishReadingModalClose())
      });

      const contentTargets = [...targets.contentItems].reverse();
      this.readingModalTl
        .to([...contentTargets, targets.actions].filter((target): target is HTMLElement => !!target), {
          autoAlpha: 0,
          y: 8,
          duration: 0.16,
          stagger: 0.018,
          ease: 'power2.in'
        }, 0)
        .to(targets.cover, {
          autoAlpha: 0,
          y: 12,
          scale: 0.98,
          rotationY: -4,
          duration: 0.22,
          ease: 'power2.in'
        }, 0)
        .to(targets.panel, {
          autoAlpha: 0,
          y: 16,
          scale: 0.97,
          duration: 0.24,
          ease: 'power2.inOut'
        }, 0.04)
        .to(targets.backdrop, {
          autoAlpha: 0,
          duration: 0.22,
          ease: 'power2.in'
        }, 0.04);
    });
  }

  private scheduleReadingModalEnter() {
    if (this.prefersReducedMotion) return;

    this.modalEnterFrame = requestAnimationFrame(() => {
      this.modalEnterFrame = 0;
      this.animateReadingModalEnter();
    });
  }

  private animateReadingModalEnter() {
    if (!this.selectedReading() || this.isClosing()) return;

    const targets = this.getReadingModalTargets();
    if (!targets.backdrop || !targets.panel) return;

    this.readingModalTl?.kill();
    this.zone.runOutsideAngular(() => {
      this.setReadingModalWillChange(true, targets);
      this.readingModalTl = gsap.timeline({
        defaults: { overwrite: 'auto', force3D: true },
        onComplete: () => this.clearReadingModalAnimationProps(targets)
      });

      this.readingModalTl
        .fromTo(targets.backdrop,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.28, ease: 'power2.out' },
          0
        )
        .fromTo(targets.panel,
          { autoAlpha: 0, y: 24, scale: 0.965 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.46, ease: 'power3.out' },
          0.02
        )
        .fromTo(targets.cover,
          { autoAlpha: 0, y: 18, scale: 0.96, rotationY: -7 },
          { autoAlpha: 1, y: 0, scale: 1, rotationY: 0, duration: 0.52, ease: 'power3.out' },
          0.12
        )
        .fromTo(targets.contentItems,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.36, stagger: 0.045, ease: 'power2.out' },
          0.16
        )
        .fromTo(targets.actions,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.34, ease: 'power2.out' },
          0.24
        );
    });
  }

  private getReadingModalTargets() {
    const panel = this.readingModalPanel?.nativeElement ?? null;
    return {
      backdrop: this.readingModalBackdrop?.nativeElement ?? null,
      panel,
      cover: this.readingModalCover?.nativeElement ?? null,
      actions: this.readingModalActions?.nativeElement ?? null,
      contentItems: panel ? Array.from(panel.querySelectorAll<HTMLElement>('.reading-modal-stagger')) : []
    };
  }

  private setReadingModalWillChange(active: boolean, targets = this.getReadingModalTargets()) {
    const animatedTargets = [
      targets.backdrop,
      targets.panel,
      targets.cover,
      targets.actions,
      ...targets.contentItems
    ].filter((target): target is HTMLElement => !!target);

    animatedTargets.forEach(target => {
      target.style.willChange = active ? 'transform, opacity' : '';
    });
  }

  private clearReadingModalAnimationProps(targets = this.getReadingModalTargets()) {
    const animatedTargets = [
      targets.backdrop,
      targets.panel,
      targets.cover,
      targets.actions,
      ...targets.contentItems
    ].filter((target): target is HTMLElement => !!target);

    gsap.set(animatedTargets, { clearProps: 'transform,opacity,visibility' });
    this.setReadingModalWillChange(false, targets);
  }

  private finishReadingModalClose() {
    if (this.modalCloseTimer) {
      clearTimeout(this.modalCloseTimer);
      this.modalCloseTimer = null;
    }
    this.readingModalTl?.kill();
    this.setReadingModalWillChange(false);
    this.selectedReading.set(null);
    this.isClosing.set(false);
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.showShareMenu()) {
      this.closeShareMenu();
      return;
    }

    if (this.eResourceFlowStep() !== 'closed') {
      this.closeEResourceFlow();
      return;
    }

    if (this.selectedReading()) {
      this.closeModal();
    }
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.showShareMenu()) return;

    const target = event.target as Node | null;
    const menu = this.readingShareMenu?.nativeElement;
    const shareWrap = menu?.closest('.reading-share-wrap');

    if (target && shareWrap?.contains(target)) return;
    this.closeShareMenu();
  }

  getJournalClass(level: string) {
    if (level.includes('T1')) return 'bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm';
    if (level.includes('T2')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-sm';
    if (level.includes('T3')) return 'bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm';
    
    // Existing logic as fallback
    if (level.includes('SCI') || level.includes('SSCI') || level.includes('AHCI')) return 'bg-red-500/15 text-red-300 border border-red-500/30 backdrop-blur-sm';
    if (level.includes('CSCD') || level.includes('CSSCI')) return 'bg-amber-500/15 text-amber-300 border border-amber-500/30 backdrop-blur-sm';
    if (level.includes('北大核心')) return 'bg-blue-500/15 text-blue-300 border border-blue-500/30 backdrop-blur-sm';
    return 'bg-white/10 text-gray-300 border border-white/10 backdrop-blur-sm';
  }

  getSearchUrl(item: Reading) {
    const name = item.title || '';
    const encoded = encodeURIComponent(name);
    if (this.isJournal(item)) {
      return `https://www.zazhi.com.cn/s.html?t=&q=${encoded}`;
    }
    return `https://search.douban.com/book/subject_search?search_text=${encoded}`;
  }

  // --- Scrubber Logic ---
  onScroll() {
    this.updateReadingChromeFromScroll();
    if (this.isScrubbing()) return;
    if (this.scrollFrame) return;

    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      this.updateCurrentLetterFromScroll();
    });
  }

  onReadingWheel(event: WheelEvent) {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    if (event.deltaY > 8) {
      this.collapseReadingChrome();
    } else if (event.deltaY < -8 && container.scrollTop <= 1) {
      this.expandReadingChrome();
    }
  }

  onPageWheel(event: WheelEvent) {
    const container = this.scrollContainer?.nativeElement;
    if (!container || container.contains(event.target as Node)) return;

    if (event.deltaY > 8) {
      this.collapseReadingChrome();
      container.scrollBy({ top: event.deltaY, behavior: 'auto' });
      event.preventDefault();
    } else if (event.deltaY < -8) {
      if (container.scrollTop <= 1) {
        this.expandReadingChrome();
      } else {
        container.scrollBy({ top: event.deltaY, behavior: 'auto' });
      }
      event.preventDefault();
    }
  }

  onReadingTouchStart(event: TouchEvent) {
    this.lastReadingTouchY = event.touches[0]?.clientY ?? 0;
  }

  onReadingTouchMove(event: TouchEvent) {
    const container = this.scrollContainer?.nativeElement;
    const currentY = event.touches[0]?.clientY ?? this.lastReadingTouchY;
    const deltaY = this.lastReadingTouchY - currentY;
    this.lastReadingTouchY = currentY;

    if (!container) return;
    if (deltaY > 8) {
      this.collapseReadingChrome();
    } else if (deltaY < -8 && container.scrollTop <= 1) {
      this.expandReadingChrome();
    }
  }

  private updateReadingChromeFromScroll() {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    const currentTop = container.scrollTop;
    const delta = currentTop - this.lastReadingScrollTop;
    if (currentTop > 24 && delta > 1) {
      this.collapseReadingChrome();
    }
    this.lastReadingScrollTop = currentTop;
  }

  private collapseReadingChrome() {
    if (!this.readingChromeCompact()) {
      this.readingChromeCompact.set(true);
    }
  }

  private expandReadingChrome() {
    if (this.readingChromeCompact()) {
      this.readingChromeCompact.set(false);
    }
  }

  private updateCurrentLetterFromScroll() {
    const container = this.scrollContainer.nativeElement;
    const containerRect = container.getBoundingClientRect();
    const anchors = container.querySelectorAll('.letter-anchor');
    let current = '#';

    // Find the last anchor that is above the threshold
    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i] as HTMLElement;
      const rect = anchor.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;

      // If the anchor is above or near the top (within 150px)
      if (relativeTop <= 150) {
        current = anchor.getAttribute('data-letter') || '#';
      } else {
        break;
      }
    }
    this.currentLetter.set(current);
  }

  scrollToLetter(letter: string, behavior: ScrollBehavior = 'smooth') {
    const container = this.scrollContainer.nativeElement;
    const anchor = container.querySelector(`.letter-anchor[data-letter="${letter}"]`) as HTMLElement;
    if (anchor) {
      // Calculate offset relative to container
      const containerRect = container.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const relativeTop = anchorRect.top - containerRect.top + container.scrollTop;
      
      container.scrollTo({ top: relativeTop, behavior });
      this.currentLetter.set(letter);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent) {
    if (this.isScrubbing()) {
      this.handleScrub(event);
      event.preventDefault();
    }
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp() {
    if (this.isScrubbing()) {
      this.onScrubEnd();
    }
  }

  onScrubStart(event: MouseEvent | TouchEvent) {
    this.isScrubbing.set(true);
    this.lastScrubScrollTarget = '';
    this.handleScrub(event);
    event.preventDefault(); // Prevent text selection/scroll
  }

  onScrubMove(event: MouseEvent | TouchEvent) {
    if (this.isScrubbing()) {
      this.handleScrub(event);
      event.preventDefault();
    }
  }

  onScrubEnd() {
    this.isScrubbing.set(false);
    this.lastScrubScrollTarget = '';
    // Final snap to the letter we ended on
    if (this.availableLetters().has(this.scrubbingLetter())) {
        this.scrollToLetter(this.scrubbingLetter(), 'smooth');
    }
  }

  private handleScrub(event: MouseEvent | TouchEvent) {
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    if (!this.scrubber) return;
    const rect = this.scrubber.nativeElement.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    
    // Calculate index based on height percentage
    const percentage = Math.max(0, Math.min(1, offsetY / rect.height));
    const index = Math.floor(percentage * this.alphabet.length);
    const safeIndex = Math.min(this.alphabet.length - 1, Math.max(0, index));
    
    const letter = this.alphabet[safeIndex];
    
    // Always update scrubbing letter for feedback
    this.scrubbingLetter.set(letter);

    // Try to find exact match first
    if (this.availableLetters().has(letter)) {
       this.scrollToScrubTarget(letter);
    } else {
       // If exact match not found, find nearest previous letter
       const available = Array.from(this.availableLetters());
       // Find the closest letter that is before the current one
       // Sort available letters first just in case
       const sorted = available.sort((a, b) => {
          if (a === '#') return -1;
          if (b === '#') return 1;
          return a.localeCompare(b);
       });
       
       // Find the letter that is closest but before or at current index
       // Since 'letter' is not in available, we look for one before it
       let target = '#';
       for (const l of sorted) {
          if (l === letter) break; // Should not happen as we checked has()
          if (this.compareLetters(l, letter) < 0) {
             target = l;
          } else {
             break;
          }
       }
       this.scrollToScrubTarget(target);
    }
  }

  private scrollToScrubTarget(letter: string) {
    if (this.lastScrubScrollTarget === letter) return;

    this.lastScrubScrollTarget = letter;
    this.scrollToLetter(letter, 'auto');
  }

  private compareLetters(a: string, b: string): number {
    if (a === b) return 0;
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  }

  // --- E-Resource Flow ---
  startEResourceFlow() {
    if (this.verificationTimer) clearTimeout(this.verificationTimer);
    if (this.declarationTimer) clearTimeout(this.declarationTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.verificationTimer = null;
    this.declarationTimer = null;
    this.eResourceFlowStep.set('verification');
    this.verificationStatus.set('idle');
    this.verificationMessage.set('');
    this.verificationForm.set({ school: '', college: '', major: '', studentId: '' });
  }

  closeEResourceFlow() {
    this.eResourceFlowStep.set('closed');
    if (this.verificationTimer) clearTimeout(this.verificationTimer);
    if (this.declarationTimer) clearTimeout(this.declarationTimer);
    this.verificationTimer = null;
    this.declarationTimer = null;
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private readonly allowedEResourceMajors = ['建筑学', '城乡规划', '智能建造'];

  private normalizeVerificationValue(value: string): string {
    return value.replace(/\s+/g, '').trim();
  }

  private hasValidEResourceVerification(): boolean {
    const { school, college, major, studentId } = this.verificationForm();
    const normalizedSchool = this.normalizeVerificationValue(school);
    const normalizedCollege = this.normalizeVerificationValue(college);
    const normalizedMajor = this.normalizeVerificationValue(major);
    const normalizedStudentId = this.normalizeVerificationValue(studentId);

    return (
      normalizedSchool === '宁夏大学' &&
      normalizedCollege === '建筑学院' &&
      this.allowedEResourceMajors.includes(normalizedMajor) &&
      /^120\d{8}$/.test(normalizedStudentId)
    );
  }

  handleVerification() {
    const { school, college, major, studentId } = this.verificationForm();
    const normalizedSchool = this.normalizeVerificationValue(school);
    const normalizedCollege = this.normalizeVerificationValue(college);
    const normalizedMajor = this.normalizeVerificationValue(major);
    const normalizedStudentId = this.normalizeVerificationValue(studentId);

    if (!normalizedSchool || !normalizedCollege || !normalizedMajor || !normalizedStudentId) {
      this.verificationStatus.set('error');
      this.verificationMessage.set('请填写所有必填项。');
      return;
    }

    if (normalizedSchool !== '宁夏大学') {
      this.verificationStatus.set('error');
      this.verificationMessage.set('身份信息核验未通过，请确认填写信息。');
      return;
    }

    if (normalizedCollege !== '建筑学院') {
      this.verificationStatus.set('error');
      this.verificationMessage.set('身份信息核验未通过，请确认填写信息。');
      return;
    }

    if (!this.allowedEResourceMajors.includes(normalizedMajor)) {
      this.verificationStatus.set('error');
      this.verificationMessage.set('身份信息核验未通过，请确认填写信息。');
      return;
    }

    if (!/^120\d{8}$/.test(normalizedStudentId)) {
      this.verificationStatus.set('error');
      this.verificationMessage.set('身份信息核验未通过，请确认填写信息。');
      return;
    }

    this.verificationForm.set({
      school: normalizedSchool,
      college: normalizedCollege,
      major: normalizedMajor,
      studentId: normalizedStudentId,
    });

    this.verificationStatus.set('verifying');
    if (this.verificationTimer) clearTimeout(this.verificationTimer);
    if (this.declarationTimer) clearTimeout(this.declarationTimer);
    this.verificationTimer = setTimeout(() => {
      this.verificationTimer = null;
      if (this.eResourceFlowStep() !== 'verification') return;
      this.verificationStatus.set('success');
      this.verificationMessage.set('验证成功！');
      this.declarationTimer = setTimeout(() => {
        this.declarationTimer = null;
        if (this.eResourceFlowStep() !== 'verification') return;

        this.eResourceFlowStep.set('declaration');
        this.startDeclarationCountdown();
      }, 800);
    }, 1500);
  }

  startDeclarationCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.declarationCountdown.set(5);
    this.countdownInterval = setInterval(() => {
      const current = this.declarationCountdown();
      if (current > 0) {
        this.declarationCountdown.set(current - 1);
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  goToResourcesStep() {
    if (!this.hasValidEResourceVerification()) {
      this.eResourceFlowStep.set('verification');
      this.verificationStatus.set('error');
      this.verificationMessage.set('身份信息核验未通过，请确认填写信息。');
      return;
    }

    this.eResourceFlowStep.set('resources');
  }

  resourceLinkText = computed(() => {
    return `通过百度网盘分享的文件：1建筑类电子书\n链接: https://pan.baidu.com/s/1cwPl4KV6UiiGxm47Q0DyLw \n提取码: book\n复制这段内容打开「百度网盘APP 即可获取」`;
  });

  copyResourceInfo() {
    navigator.clipboard.writeText(this.resourceLinkText()).then(() => {
      this.copyButtonText.set('已复制');
      if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => {
        this.copyResetTimer = null;
        this.copyButtonText.set('复制链接');
      }, 2000);
    });
  }

  // --- Share & Jump Logic ---
  showShareMenu = signal(false);
  shareMenuNotice = signal('');

  handleShare(event?: MouseEvent) {
    event?.stopPropagation();
    const shouldOpenMenu = !this.showShareMenu();
    this.showShareMenu.set(shouldOpenMenu);
    if (shouldOpenMenu) {
      this.shareMenuNotice.set('');
      this.scheduleShareMenuEnter();
    } else {
      this.closeShareMenu();
    }
  }

  private closeShareMenu() {
    this.showShareMenu.set(false);
    this.shareMenuNotice.set('');
    this.shareMenuTl?.kill();
    if (this.shareMenuEnterFrame) {
      cancelAnimationFrame(this.shareMenuEnterFrame);
      this.shareMenuEnterFrame = 0;
    }
  }

  openShareTarget(event: MouseEvent, item: Reading, platform: 'wechat' | 'taobao' | 'jd' | 'duozhuayu' | 'zhuanzhuan') {
    event.preventDefault();
    event.stopPropagation();

    const target = platform === 'wechat' ? 'wechat' : 'shopping';
    const text = target === 'wechat'
      ? this.getReadingShareText(item)
      : this.getReadingShoppingSearchText(item);
    const notice = target === 'wechat' ? '已复制分享文案' : '已复制搜索词';
    const copied = this.copyTextBeforeNavigation(text, notice);

    if (!copied) {
      this.dataService.displayToast('复制可能失败，请手动复制后搜索');
    }

    this.openPlatformUrl(this.getPlatformUrl(platform, item));
  }

  private copyTextBeforeNavigation(text: string, successNotice: string): boolean {
    if (this.copyTextWithSelection(text)) {
      this.setShareMenuNotice(successNotice);
      return true;
    }

    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (clipboard?.writeText) {
      clipboard.writeText(text).then(() => {
        this.setShareMenuNotice(successNotice);
      }).catch(() => {
        this.dataService.displayToast('复制可能失败，请手动复制后搜索');
      });
      return true;
    }

    return false;
  }

  private copyTextWithSelection(text: string): boolean {
    if (typeof document === 'undefined') return false;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    } finally {
      document.body.removeChild(textarea);
    }

    return copied;
  }

  private openPlatformUrl(url: string) {
    if (!url || url === '#') return;
    if (url.startsWith('weixin://')) {
      window.location.href = url;
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private setShareMenuNotice(message: string) {
    this.shareMenuNotice.set(message);
    if (this.shareResetTimer) clearTimeout(this.shareResetTimer);
    this.shareResetTimer = setTimeout(() => {
      this.shareResetTimer = null;
      this.shareMenuNotice.set('');
    }, 2000);
  }

  private getReadingShareText(item: Reading): string {
    const isJournal = this.isJournal(item);
    const typeLabel = isJournal ? '这本期刊' : '这本书';
    const idLabel = isJournal ? 'ISSN/CN' : 'ISBN';
    const meta = [
      item.author ? `作者：${item.author}` : '',
      item.publisher ? `出版社：${item.publisher}` : '',
      item.identifier ? `${idLabel}：${item.identifier}` : ''
    ].filter(Boolean).join('，');
    const description = this.truncateShareText(item.description, 72);
    const lines = [
      `我在 ARCHIPEDIA.top 发现了${typeLabel}：《${item.title}》。`,
      meta,
      description ? `简介：${description}` : '',
      `打开查看：${this.getReadingShareUrl(item)}`
    ].filter(Boolean);

    return lines.join('\n');
  }

  private truncateShareText(text: string, maxLength: number): string {
    const normalized = (text || '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1)}…`;
  }

  private getReadingShareUrl(item: Reading): string {
    return `${window.location.origin}${window.location.pathname}#/readings?reading=${encodeURIComponent(item.id ?? '')}`;
  }

  private getReadingShoppingSearchText(item: Reading): string {
    if (this.isJournal(item)) return item.title;
    return [item.title, item.author].map(value => value?.trim()).filter(Boolean).join(' ');
  }

  citationText(item: Reading) {
    return formatGbT7714(item);
  }

  async copyCitation(item: Reading) {
    try {
      await navigator.clipboard.writeText(formatGbT7714(item));
      this.dataService.displayToast('引用已复制');
    } catch {
      this.dataService.displayToast('复制失败，请手动选择引用文本');
    }
  }

  downloadCitation(item: Reading) {
    downloadTextFile(formatGbT7714(item), `${item.title}-GB-T-7714.txt`);
    this.dataService.displayToast('引用文件已下载');
  }

  async shareReadingCard(item: Reading) {
    if (this.isGeneratingCard()) return;
    this.isGeneratingCard.set(true);
    try {
      const url = this.getReadingShareUrl(item);
      const blob = await this.shareCardService.generateReadingCard(item, url);
      const result = await this.shareCardService.shareOrDownload(blob, `archipedia-reading-${item.id ?? 'card'}.png`, item.title);
      if (result === 'downloaded') this.dataService.displayToast('分享卡片已下载');
    } catch (error) {
      console.error(error);
      this.dataService.displayToast('分享卡片生成失败，请稍后重试');
    } finally {
      this.isGeneratingCard.set(false);
    }
  }

  private scheduleShareMenuEnter() {
    if (this.prefersReducedMotion) return;

    if (this.shareMenuEnterFrame) {
      cancelAnimationFrame(this.shareMenuEnterFrame);
    }

    this.shareMenuEnterFrame = requestAnimationFrame(() => {
      this.shareMenuEnterFrame = 0;
      const menu = this.readingShareMenu?.nativeElement;
      if (!menu || !this.showShareMenu()) return;

      this.shareMenuTl?.kill();
      this.zone.runOutsideAngular(() => {
        menu.style.willChange = 'transform, opacity';
        this.shareMenuTl = gsap.fromTo(menu,
          { autoAlpha: 0, y: 10, scale: 0.96 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.22,
            ease: 'power3.out',
            overwrite: 'auto',
            force3D: true,
            onComplete: () => {
              menu.style.willChange = '';
              gsap.set(menu, { clearProps: 'transform,opacity,visibility' });
            }
          }
        );
      });
    });
  }

  getPlatformUrl(platform: string, item: Reading): string {
    const keyword = this.getReadingShoppingSearchText(item);
    const encoded = encodeURIComponent(keyword);

    switch (platform) {
      case 'wechat':
        return 'weixin://'; // Tries to open app
      case 'taobao':
        return `https://s.taobao.com/search?q=${encoded}`;
      case 'jd':
        return `https://search.jd.com/Search?keyword=${encoded}`;
      case 'duozhuayu':
        return `https://www.duozhuayu.com/search?q=${encoded}`;
      case 'zhuanzhuan':
        // Mobile web search for Zhuanzhuan
        return `https://m.zhuanzhuan.com/search/result?info=${encoded}`;
      default:
        return '#';
    }
  }

  isJournal(item: Reading): boolean {
    return !!item.journalLevel || item.tags.some(t => t.includes('期刊') || t.includes('杂志'));
  }
}
