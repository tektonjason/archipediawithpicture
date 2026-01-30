
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-qna',
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
          <h2 class="text-xl font-bold">问答 Q&A</h2>
          <p class="text-xs text-gray-500 mt-0.5">Questions & Answers</p>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <div class="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
           <svg class="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
           </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-400 mb-2">内容建设中</h3>
        <p class="max-w-md">本板块正在筹备中，将为您带来常见问题解答与经验分享，敬请期待。</p>
      </div>
    </div>
  `
})
export class QnaComponent {}
