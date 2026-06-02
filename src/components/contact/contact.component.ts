
import { Component, inject } from '@angular/core';
import { DataService } from '../../services/data.service';
import { APP_UI_ICONS } from '../shared/ui-icons';

interface DownloadLink {
  name: string;
  url: string;
  icon: string;
  description: string;
  buttonText: string;
}

@Component({
  selector: 'app-contact',
  imports: [...APP_UI_ICONS],
  template: `
    <div class="ui-page-scroll ui-page-pad text-white">
      
      <!-- Top Header -->
      <div class="ui-page-header">
        <h2 class="ui-title">关于应用</h2>
        <p class="ui-subtitle">About & Contact</p>
      </div>

      <!-- User Tutorial Section -->
      <section class="mb-10">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <span class="w-2 h-2 rounded-full bg-orange-500"></span>
          使用教程
        </h3>
        <div (click)="dataService.openExternalModal('https://www.kdocs.cn/l/cpjHpTZQ60RV')" class="cursor-pointer group ui-card ui-card-hover p-6 flex items-center gap-6">
          <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-400 group-hover:bg-orange-500/20 transition-colors">
            <svg lucideBookOpen class="w-6 h-6" [strokeWidth]="2"></svg>
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-300 group-hover:text-white transition-colors">
               查看详细的操作指南与功能介绍，快速上手应用。
            </p>
          </div>
          <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition-all">
             <svg lucideChevronRight class="w-5 h-5" [strokeWidth]="2"></svg>
          </div>
        </div>
      </section>

      <!-- Contact Info -->
      <section class="mb-10">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          交流邮箱
        </h3>
        <div class="group ui-card ui-card-hover p-6 flex items-center gap-6">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <svg lucideMail class="w-6 h-6" [strokeWidth]="2"></svg>
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm text-gray-300 group-hover:text-white transition-colors">
              如果您有任何建议、问题或合作意向，请发送邮件至：
              <a href="mailto:tektonjason@163.com" class="block mt-1 font-bold text-blue-400 hover:text-blue-300 transition-colors">
                tektonjason@163.com
              </a>
            </p>
          </div>
        </div>
      </section>

      <!-- Online Version Section -->
      <section class="mb-10">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          在线使用
        </h3>
        @for (link of onlineLinks; track link.name) {
          <div class="group ui-card ui-card-hover p-6 flex items-center gap-6">
            <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 text-green-400 group-hover:bg-green-500/20 transition-colors">
              <svg lucideExternalLink class="h-6 w-6" [strokeWidth]="2"></svg>
            </div>
            <div class="flex-1 text-left">
              <p class="text-sm font-medium text-white">{{ link.name }}</p>
              <p class="text-xs text-gray-400">{{ link.description }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div (click)="dataService.openExternalModal(link.url)" class="ui-btn-secondary cursor-pointer px-4 py-2 text-xs">
                {{ link.buttonText }}
              </div>
              <div (click)="shareLink(link.url)" class="ui-icon-btn cursor-pointer">
                <svg lucideShare2 class="h-5 w-5" [strokeWidth]="2"></svg>
              </div>
            </div>
          </div>
        }
      </section>

      <!-- Software Updates Section -->
      <section>
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <span class="w-2 h-2 rounded-full bg-purple-500"></span>
          软件更新
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (link of downloadLinks; track link.name) {
            <a [href]="link.url" target="_blank" class="group ui-card ui-card-hover p-6 flex flex-col items-center justify-center text-center">
              <h4 class="text-base font-bold mb-6 text-white">{{ link.name }}</h4>
              <div class="w-full">
                <div class="ui-btn-secondary w-full text-xs group-hover:bg-white group-hover:text-black">
                  {{ link.buttonText }}
                </div>
              </div>
            </a>
          }
        </div>
      </section>
      
      <!-- Sources Section -->
      <section class="mt-10 pb-10">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
          文献来源
        </h3>
        <div class="ui-card p-6 text-gray-400">
          <p class="mb-4 text-white text-xs">本应用中的部分图片素材来源于以下平台或文献，并遵循其许可协议：</p>
          <ul class="list-disc list-inside space-y-2 text-sm leading-relaxed font-serif text-gray-300">
            <li>Wikimedia Commons, 协议 <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en" target="_blank" rel="noopener noreferrer" class="underline text-blue-400 hover:text-blue-300">CC BY-SA 4.0</a></li>
            <li>Openverse, 协议 <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en" target="_blank" rel="noopener noreferrer" class="underline text-blue-400 hover:text-blue-300">CC BY-SA 4.0</a></li>
            <li>Pixabay, 协议 <a href="https://creativecommons.org/public-domain/cc0/" target="_blank" rel="noopener noreferrer" class="underline text-blue-400 hover:text-blue-300">CC0</a></li>
            <li>《中国建筑图解词典》（作者：王其钧）</li>
            <li>《西方建筑图解词典》（作者：王其钧）</li>
            <li>《中国建筑史》（主编：潘谷西）</li>
            <li>《外国建筑史》（作者：陈志华）</li>
            <li>《外国近现代建筑史》（主编：罗小未）</li>
            <li><em>Fundamentals of Building Construction: Materials and Methods</em> (作者：Edward Allen & Joseph Iano) Wiley出版社</li>
          </ul>
        </div>
      </section>

      <!-- Admin Access Section -->
      <section class="mt-10 pb-20 border-t border-white/5 pt-10">
        <button 
          (click)="dataService.handleAdminAction()" 
          class="w-full ui-card ui-card-hover p-4 flex items-center justify-between group"
        >
          <div class="flex items-center gap-4">
             <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                @if (dataService.isAdmin()) {
                  <svg lucideCheckCircle class="w-6 h-6 text-green-400" [strokeWidth]="2"></svg>
                } @else {
                  <svg lucideLock class="w-6 h-6 text-gray-400 group-hover:text-white" [strokeWidth]="2"></svg>
                }
             </div>
             <div class="text-left">
                <h4 class="text-lg font-bold text-white">{{ dataService.isAdmin() ? '管理员已登录' : '管理员入口' }}</h4>
             </div>
          </div>
          <svg lucideChevronRight class="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" [strokeWidth]="2"></svg>
        </button>
      </section>
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
export class ContactComponent {
  dataService = inject(DataService);

  onlineLinks: DownloadLink[] = [
    {
      name: '在线使用',
      url: 'https://www.archipedia.top',
      icon: '🚀',
      description: 'Archipedia Online',
      buttonText: '访问站点'
    }
  ];

  shareLink(url: string) {
    const textToCopy = `${url}   Archipedia---你的建筑知识生态系统`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.dataService.displayToast('分享内容已复制');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      this.dataService.displayToast('复制失败');
    });
  }

  downloadLinks: DownloadLink[] = [
    {
      name: '百度网盘',
      url: 'https://pan.baidu.com/s/5YvtunmbZbcj-2qAokdy6dQ',
      icon: '☁️',
      description: '无需提取码 / 自动填充',
      buttonText: '前往下载'
    },
    {
      name: '夸克网盘',
      url: 'https://pan.quark.cn/s/1a9ca6924dff',
      icon: '🌪️',
      description: '高速下载体验',
      buttonText: '前往下载'
    },
    {
      name: 'OneDrive',
      url: 'https://1drv.ms/f/c/474d1ec9b29e5075/IgCewBjkuvOLQKY_HD8dPkHBAVJyLxB3EtucY8F5JabOD1w?e=eIiJYb',
      icon: '📂',
      description: '微软云存储下载',
      buttonText: '前往下载'
    }
  ];
}
