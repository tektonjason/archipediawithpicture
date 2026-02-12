import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, CommonModule } from '@angular/common';
import { DataService, Reading } from '../../services/data.service';
import pinyin from 'pinyin';

@Component({
  selector: 'app-readings',
  imports: [FormsModule, CommonModule, NgClass, RouterLink],
  standalone: true,
  template: `
    <div class="h-full flex flex-col p-6 md:p-8 overflow-hidden bg-[#0f0f11] text-white">
      
      <!-- Header Section -->
      <div class="flex flex-col items-center mb-8 shrink-0 space-y-2">
        <h1 class="text-3xl md:text-4xl font-bold tracking-wide">建筑读物</h1>
        <p class="text-gray-400 text-sm md:text-base max-w-2xl text-center">
          发现有价值的建筑书籍与期刊
        </p>

        <!-- Search Input -->
        <div class="relative w-full max-w-2xl mt-4 flex gap-3">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input 
              type="text" 
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="搜索书名、作者或出版社..." 
              class="w-full bg-[#18181b] text-white text-base placeholder-gray-500 rounded-xl border border-white/10 py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all shadow-lg"
            >
            @if (searchQuery()) {
              <button (click)="searchQuery.set('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            }
          </div>
          <button (click)="startEResourceFlow()" class="px-6 py-3 bg-[#18181b] border border-white/10 hover:bg-white/5 rounded-xl text-sm font-medium transition-all whitespace-nowrap">
            电子资源
          </button>
        </div>
      </div>

      <!-- Tags Filter -->
      <div class="flex flex-nowrap gap-2 mb-6 shrink-0 overflow-x-auto pb-2 custom-scrollbar mask-gradient justify-start px-1">
        <button 
          (click)="selectTag('all')"
          class="flex-shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border border-transparent"
          [class.bg-white]="selectedTag() === 'all'"
          [class.text-black]="selectedTag() === 'all'"
          [class.bg-white/5]="selectedTag() !== 'all'"
          [class.text-gray-300]="selectedTag() !== 'all'"
          [class.hover:bg-white/10]="selectedTag() !== 'all'"
        >全部</button>
        @for (tag of allTags(); track tag) {
          <button 
            (click)="selectTag(tag)"
            class="flex-shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border border-transparent"
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

      <!-- Content Area -->
      <div class="flex-1 relative overflow-hidden">
        <div #scrollContainer class="h-full overflow-y-auto pb-20 hide-scrollbar" [class.pr-10]="filteredReadings().length > 0" (scroll)="onScroll()">
          @if (filteredReadings().length === 0) {
            <div class="flex flex-col items-center justify-center h-60 opacity-50 text-center">
              <div class="text-4xl mb-4 grayscale">📚</div>
              <p class="font-medium text-lg">未找到相关读物</p>
              <p class="text-gray-500 text-sm mt-1">请尝试更换关键词或进入对应分类查找</p>
              <button 
                [routerLink]="['/about']"
                class="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/5"
              >
                向我们反馈
              </button>
            </div>
          } @else {
            @for (group of groupedReadings(); track group.letter) {
              <div class="relative mb-8">
                <div [attr.data-letter]="group.letter" class="letter-anchor absolute -top-4"></div>
                <h2 class="text-xl font-bold text-gray-500 mb-4 sticky top-0 bg-[#0f0f11]/90 backdrop-blur-sm z-10 py-2 border-b border-white/5">
                  {{ group.letter }}
                </h2>
                
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  @for (item of group.readings; track item.title; let i = $index) {
                    <div 
                       (click)="openModal(item)" 
                       class="group cursor-pointer flex flex-col gap-3 animate-fade-in-up" 
                       [style.animation-delay]="(i % 21 * 30) + 'ms'" 
                     >
                      <!-- Book Cover -->
                      <div class="aspect-[2/3] bg-[#18181b] rounded-lg border border-white/5 group-hover:border-white/20 overflow-hidden relative shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                        @if (item.imageUrl && !failedImages().has(item.id)) {
                          <img [src]="item.imageUrl" [alt]="item.title" loading="lazy" class="w-full h-full object-cover" (error)="handleImageError(item.id)">
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
                      
                      <div>
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
            class="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
            [class.opacity-0]="isClosing()"
            (click)="closeModal()"
          ></div>
          
          <div 
            class="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex overflow-hidden relative z-10 transition-all duration-300"
            [class.scale-95]="isClosing()"
            [class.opacity-0]="isClosing()"
          >
            <button (click)="closeModal()" class="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-white/20 text-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <!-- Layout: Image Left, Content Right -->
            <div class="flex flex-col md:flex-row w-full h-full">
               
               <!-- Left: Cover Image Area -->
               <div class="hidden md:flex md:w-2/5 bg-[#0f0f11] items-center justify-center p-6 md:p-8 relative overflow-hidden shrink-0">
                  <!-- Abstract background pattern -->
                  <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 32px 32px;"></div>
                  
                  <!-- Book Cover Mockup -->
                  <div class="relative w-full max-w-[320px] aspect-[2/3] bg-gradient-to-br from-[#2a2a2e] to-[#121214] shadow-2xl rounded-sm border-l-4 border-white/5 flex flex-col items-center justify-center transform transition-transform hover:scale-105 duration-500 overflow-hidden">
                     @if (item.imageUrl && !failedImages().has(item.id)) {
                       <img [src]="item.imageUrl" [alt]="item.title" class="w-full h-full object-cover" (error)="handleImageError(item.id)">
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
               <div class="flex-1 flex flex-col overflow-hidden">
                  <div class="flex-1 p-5 md:p-8 overflow-y-auto custom-scrollbar flex flex-col">
                  <h2 class="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 pr-8 md:pr-0">{{ item.title }}</h2>
                  <p class="text-base md:text-lg text-gray-400 font-medium mb-4 md:mb-6">{{ item.author || item.publisher }}</p>
                  
                  <div class="space-y-4 md:space-y-6 flex-1">
                    <div>
                      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">内容简介</h4>
                      <p class="text-sm text-gray-300 leading-relaxed font-serif">
                        {{ item.description }}
                      </p>

                    </div>

                    <div class="mt-6">
                      <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">详细介绍</h4>
                      <div class="max-h-[25vh] overflow-y-auto custom-scrollbar pr-2">
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
                  </div>
                  </div>

                  <div class="px-5 pb-8 pt-4 md:p-8 md:pt-6 bg-[#18181b] border-t border-white/10 z-10 shrink-0 flex gap-4">
                    <a (click)="dataService.openExternalModal(getSearchUrl(item))" class="cursor-pointer flex-1 bg-white text-black hover:bg-gray-200 transition-colors py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                       <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                       <span>在线搜索</span>
                    </a>
                    
                    <div class="relative">
                      <button 
                        (click)="handleShare(item)" 
                        class="h-full px-4 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2" 
                        title="分享并搜索"
                      >
                         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </button>

                      <!-- Share Menu -->
                      @if (showShareMenu()) {
                        <div class="absolute bottom-full right-0 mb-3 w-40 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-30 flex flex-col">
                           @if (shareMenuCopied()) {
                             <div class="bg-green-500/10 text-green-400 text-[10px] font-bold text-center py-1.5 border-b border-green-500/20">
                               已复制信息 ✅
                             </div>
                           }
                           
                           <div class="p-1.5 flex flex-col gap-1">
                             <a [href]="getPlatformUrl('wechat', item)" target="_blank" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group">
                               <div class="w-6 h-6 rounded bg-[#07c160] flex items-center justify-center shrink-0">
                                 <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5,1.5c-4.1,0-7.5,2.9-7.5,6.5c0,2.1,1.1,3.9,2.9,5.1c-0.1,0.6-0.4,2.2-0.5,2.6c0,0,0,0,0,0c0,0.1,0,0.2,0.1,0.2c0.1,0,0.2,0,0.4-0.1c1.3-0.7,2.9-1.8,3.3-2.1c0.4,0.1,0.9,0.2,1.3,0.2c4.1,0,7.5-2.9,7.5-6.5S12.6,1.5,8.5,1.5z M17.5,8c-3.6,0-6.5,2.6-6.5,5.8c0,1.9,1,3.5,2.6,4.6c-0.1,0.5-0.4,1.9-0.4,2.3c0,0,0,0,0,0c0,0.1,0.1,0.2,0.2,0.2c0.1,0,0.2,0,0.3-0.1c1.2-0.6,2.6-1.6,2.9-1.9c0.4,0.1,0.8,0.2,1.2,0.2c3.6,0,6.5-2.6,6.5-5.8S21.1,8,17.5,8z"/></svg>
                               </div>
                               微信
                             </a>
                             <a [href]="getPlatformUrl('taobao', item)" target="_blank" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group">
                               <div class="w-6 h-6 rounded bg-[#ff5000] flex items-center justify-center shrink-0">
                                 <span class="text-[10px] font-bold text-white">淘</span>
                               </div>
                               淘宝
                             </a>
                             <a [href]="getPlatformUrl('jd', item)" target="_blank" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group">
                               <div class="w-6 h-6 rounded bg-[#e1251b] flex items-center justify-center shrink-0">
                                 <span class="text-[10px] font-bold text-white">JD</span>
                               </div>
                               京东
                             </a>
                             <a [href]="getPlatformUrl('duozhuayu', item)" target="_blank" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group">
                               <div class="w-6 h-6 rounded bg-[#499d75] flex items-center justify-center shrink-0">
                                 <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                               </div>
                               多抓鱼
                             </a>
                             <a [href]="getPlatformUrl('zhuanzhuan', item)" target="_blank" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white group">
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
          
          <div class="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-md flex flex-col relative z-10 animate-fade-in-up overflow-hidden">
             
             <!-- Modal Header -->
             <div class="p-5 border-b border-white/10 bg-[#202024]">
               <h3 class="font-bold text-lg text-white text-center">
                 @switch(eResourceFlowStep()) {
                   @case('verification') { 学生身份验证 }
                   @case('declaration') { 资源使用声明 }
                   @case('resources') { 获取电子资源 }
                 }
               </h3>
             </div>

             <!-- Content -->
             <div class="p-6">
                @switch(eResourceFlowStep()) {
                  @case('verification') {
                    <div class="flex flex-col gap-4">
                      <div>
                        <label class="text-xs font-bold uppercase text-gray-500 mb-1 block">学校</label>
                        <input [(ngModel)]="verificationForm().school" type="text" placeholder="请输入学校全称" class="w-full bg-[#27272a] border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500">
                      </div>
                      <div>
                        <label class="text-xs font-bold uppercase text-gray-500 mb-1 block">学院</label>
                        <input [(ngModel)]="verificationForm().college" type="text" placeholder="请输入学院全称" class="w-full bg-[#27272a] border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500">
                      </div>
                      <div>
                        <label class="text-xs font-bold uppercase text-gray-500 mb-1 block">专业</label>
                        <input [(ngModel)]="verificationForm().major" type="text" placeholder="请输入专业全称" class="w-full bg-[#27272a] border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500">
                      </div>
                      <div>
                        <label class="text-xs font-bold uppercase text-gray-500 mb-1 block">学号</label>
                        <input [(ngModel)]="verificationForm().studentId" type="text" placeholder="请输入11位学号" class="w-full bg-[#27272a] border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-blue-500">
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
                    <div class="bg-[#0f0f11] p-4 rounded border border-white/10 text-sm font-mono text-gray-300 break-all whitespace-pre-wrap">
                      {{ resourceLinkText() }}
                    </div>
                  }
                }
             </div>

             <!-- Footer -->
             <div class="p-5 border-t border-white/10 bg-[#202024] flex gap-3 justify-end">
                @switch(eResourceFlowStep()) {
                  @case('verification') {
                    <button (click)="closeEResourceFlow()" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">取消</button>
                    <button (click)="handleVerification()" class="px-4 py-2 rounded-lg text-sm font-bold bg-white text-black hover:bg-gray-200 transition-colors">
                      {{ verificationStatus() === 'verifying' ? '核验中...' : '核验' }}
                    </button>
                  }
                  @case('declaration') {
                    <button (click)="goToResourcesStep()" [disabled]="declarationCountdown() > 0" class="px-4 py-2 rounded-lg text-sm font-bold bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ declarationCountdown() > 0 ? '请等待 ' + declarationCountdown() + 's' : '确认并继续' }}
                    </button>
                  }
                  @case('resources') {
                    <button (click)="copyResourceInfo()" class="px-4 py-2 rounded-lg text-sm font-bold bg-white text-black hover:bg-gray-200 transition-colors">{{ copyButtonText() }}</button>
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
    .animate-fade-in-up {
      animation: fadeInUp 0.4s ease-out backwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ReadingsComponent implements AfterViewInit, OnDestroy {
  dataService = inject(DataService);
  searchQuery = signal('');
  selectedTag = signal('all');
  selectedReading = signal<Reading | null>(null);
  isClosing = signal(false);

  failedImages = signal<Set<string>>(new Set());

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

  // Scrubber State
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scrubber') scrubber!: ElementRef<HTMLElement>;
  alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  currentLetter = signal('#');
  isScrubbing = signal(false);
  scrubbingLetter = signal('#');
  
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

  filteredReadings = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const tag = this.selectedTag();
    return this.dataService.readings().filter(r => {
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q) || r.publisher.toLowerCase().includes(q);
      const matchTag = tag === 'all' || r.tags.includes(tag);
      return matchSearch && matchTag;
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
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  selectTag(tag: string) {
    if (this.selectedTag() !== tag) {
      this.searchQuery.set('');
    }
    this.selectedTag.set(tag);
    // Allow the view to update and computed signals (like filteredReadings and availableLetters) to re-evaluate
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'auto' });
        
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
    }, 0);
  }

  openModal(item: Reading) {
    this.isClosing.set(false);
    this.selectedReading.set(item);
  }

  closeModal() {
    this.isClosing.set(true);
    this.showShareMenu.set(false);
    setTimeout(() => {
      this.selectedReading.set(null);
      this.isClosing.set(false);
    }, 300);
  }

  getJournalClass(level: string) {
    if (level.includes('T1')) return 'bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm';
    if (level.includes('T2')) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-sm';
    if (level.includes('T3')) return 'bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm';
    
    // Existing logic as fallback
    if (level.includes('SCI') || level.includes('SSCI') || level.includes('AHCI')) return 'bg-red-100 text-red-800 border-red-200';
    if (level.includes('CSCD') || level.includes('CSSCI')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (level.includes('北大核心')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
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
    if (this.isScrubbing()) return;

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
       this.scrollToLetter(letter, 'auto');
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
       this.scrollToLetter(target, 'auto');
    }
  }

  private compareLetters(a: string, b: string): number {
    if (a === b) return 0;
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  }

  // --- E-Resource Flow ---
  startEResourceFlow() {
    this.eResourceFlowStep.set('verification');
    this.verificationStatus.set('idle');
    this.verificationMessage.set('');
    this.verificationForm.set({ school: '', college: '', major: '', studentId: '' });
  }

  closeEResourceFlow() {
    this.eResourceFlowStep.set('closed');
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  handleVerification() {
    const { school, college, major, studentId } = this.verificationForm();
    if (!school || !college || !major || !studentId) {
      this.verificationStatus.set('error');
      this.verificationMessage.set('请填写所有必填项。');
      return;
    }
    
    // Simple mock verification logic
    if (studentId.length !== 11) {
       this.verificationStatus.set('error');
       this.verificationMessage.set('学号必须为11位数字。');
       return;
    }

    this.verificationStatus.set('verifying');
    setTimeout(() => {
      // Success
      this.verificationStatus.set('success');
      this.verificationMessage.set('验证成功！');
      setTimeout(() => {
        this.eResourceFlowStep.set('declaration');
        this.startDeclarationCountdown();
      }, 800);
    }, 1500);
  }

  startDeclarationCountdown() {
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
    this.eResourceFlowStep.set('resources');
  }

  resourceLinkText = computed(() => {
    return `通过百度网盘分享的文件：1建筑类电子书\n链接: https://pan.baidu.com/s/1cwPl4KV6UiiGxm47Q0DyLw \n提取码: book\n复制这段内容打开「百度网盘APP 即可获取」`;
  });

  copyResourceInfo() {
    navigator.clipboard.writeText(this.resourceLinkText()).then(() => {
      this.copyButtonText.set('已复制');
      setTimeout(() => this.copyButtonText.set('复制链接'), 2000);
    });
  }

  // --- Share & Jump Logic ---
  showShareMenu = signal(false);
  shareMenuCopied = signal(false);

  handleShare(item: Reading) {
    // 1. Determine type and format text
    const isJournal = this.isJournal(item);
    let text = '';
    
    if (isJournal) {
      text = `${item.title} 杂志`;
    } else {
      // Book: Title + Author + ISBN
      const parts = [item.title];
      if (item.author) parts.push(item.author);
      if (item.identifier) parts.push(item.identifier);
      text = parts.join(' ');
    }

    // 2. Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      this.shareMenuCopied.set(true);
      setTimeout(() => this.shareMenuCopied.set(false), 2000);
    });

    // 3. Toggle Menu
    this.showShareMenu.set(!this.showShareMenu());
  }

  getPlatformUrl(platform: string, item: Reading): string {
    const isJournal = this.isJournal(item);
    let keyword = '';
    
    if (isJournal) {
      keyword = `${item.title} 杂志`;
    } else {
      // For search, Title + Author is usually good enough. ISBN is very specific.
      // User said "copy format" is Title+Author+ISBN.
      // For search, maybe we use the same?
      const parts = [item.title];
      if (item.author) parts.push(item.author);
      // ISBN might be too specific if the platform doesn't index it well, but usually they do.
      if (item.identifier) parts.push(item.identifier);
      keyword = parts.join(' ');
    }
    
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

  private isJournal(item: Reading): boolean {
    return !!item.journalLevel || item.tags.some(t => t.includes('期刊') || t.includes('杂志'));
  }
}
