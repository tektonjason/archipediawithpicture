
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-methodology',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-full flex flex-col bg-[#0f0f11] text-white overflow-hidden">
      <!-- Header -->
      <div class="p-4 pl-24 border-b border-white/5 flex items-center gap-4 bg-[#18181b] shrink-0">
        <a routerLink="/essentials" class="px-4 py-2 rounded-lg bg-[#18181b] border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors text-gray-300 hover:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </a>
        <div>
          <h2 class="text-xl font-bold">设计方法图谱</h2>
          <p class="text-xs text-gray-500 mt-0.5">Design Methodology Graph</p>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <div class="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
          <svg class="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-400 mb-2">内容建设中</h3>
        <p class="max-w-md">本板块正在筹备中，将为您带来系统化的设计思维与方法论总结，敬请期待。</p>
      </div>
    </div>
  `
})
export class MethodologyComponent {}
