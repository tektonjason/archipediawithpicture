
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_UI_ICONS } from '../shared/ui-icons';

@Component({
  selector: 'app-qna',
  imports: [CommonModule, RouterLink, ...APP_UI_ICONS],
  template: `
    <div class="ui-page text-white">
      <!-- Header -->
      <div class="ui-topbar">
        <a routerLink="/essentials" class="ui-btn-secondary">
          <svg lucideArrowLeft class="w-4 h-4" [strokeWidth]="2"></svg>
          返回
        </a>
        <div>
          <h2 class="text-xl font-bold">问答 Q&A</h2>
          <p class="text-xs text-gray-500 mt-0.5">Questions & Answers</p>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div class="max-w-4xl mx-auto space-y-6">
            <div class="ui-empty-state py-20">
              <div class="ui-empty-icon h-20 w-20 mb-6"><svg lucideCircleHelp class="w-10 h-10 opacity-70" [strokeWidth]="1.8"></svg></div>
              <h3 class="text-lg font-bold text-gray-400 mb-2">内容建设中</h3>
              <p class="max-w-md">本板块正在筹备中，将为您带来常见问题解答与经验分享，敬请期待。</p>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
  `]
})
export class QnaComponent {}
