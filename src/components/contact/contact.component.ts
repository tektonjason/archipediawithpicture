
import { Component, inject } from '@angular/core';
import { DataService } from '../../services/data.service';

interface DownloadLink {
  name: string;
  url: string;
  icon: string;
  description: string;
  buttonText: string;
}

@Component({
  selector: 'app-contact',
  template: `
    <div class="h-full flex flex-col p-6 md:p-8 bg-[#0f0f11] text-white overflow-y-auto custom-scrollbar">
      
      <!-- Top Header -->
      <div class="flex flex-col items-center mb-8 shrink-0 space-y-2 text-center">
        <h2 class="text-3xl md:text-4xl font-bold tracking-wide">关于应用</h2>
        <p class="text-gray-400 font-medium">About & Contact</p>
      </div>

      <!-- User Tutorial Section -->
      <section class="mb-10">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <span class="w-2 h-2 rounded-full bg-orange-500"></span>
          使用教程
        </h3>
        <div (click)="dataService.openExternalModal('https://www.kdocs.cn/l/cpjHpTZQ60RV')" class="cursor-pointer group bg-[#18181b] border border-white/5 rounded-xl p-6 flex items-center gap-6 hover:bg-white/5 hover:border-white/10 transition-all">
          <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-400 group-hover:bg-orange-500/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-300 group-hover:text-white transition-colors">
               查看详细的操作指南与功能介绍，快速上手应用。
            </p>
          </div>
          <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
             </svg>
          </div>
        </div>
      </section>

      <!-- Contact Info -->
      <section class="mb-10">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          交流邮箱
        </h3>
        <div class="group bg-[#18181b] border border-white/5 rounded-xl p-6 flex items-center gap-6 hover:bg-white/5 hover:border-white/10 transition-all">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
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
          <div class="group bg-[#18181b] border border-white/5 rounded-xl p-6 flex items-center gap-6 hover:bg-white/5 hover:border-white/10 transition-all">
            <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 text-green-400 group-hover:bg-green-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            <div class="flex-1 text-left">
              <p class="text-sm font-medium text-white">{{ link.name }}</p>
              <p class="text-xs text-gray-400">{{ link.description }}</p>
            </div>
            <div class="flex items-center gap-3">
              <div (click)="dataService.openExternalModal(link.url)" class="cursor-pointer px-4 py-2 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white hover:text-black transition-colors">
                {{ link.buttonText }}
              </div>
              <div (click)="shareLink(link.url)" class="cursor-pointer w-10 h-10 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center">
                <svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                  <path d='M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z' />
                </svg>
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
            <a [href]="link.url" target="_blank" class="group bg-[#18181b] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-white/10 transition-all">
              <h4 class="text-base font-bold mb-6 text-white">{{ link.name }}</h4>
              <div class="w-full">
                <div class="w-full py-2.5 rounded-lg bg-white/10 text-white font-bold text-xs group-hover:bg-white group-hover:text-black transition-colors">
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
        <div class="bg-[#18181b] border border-white/5 rounded-xl p-6 text-gray-400">
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
          class="w-full p-4 rounded-xl border border-white/5 bg-[#18181b] hover:bg-white/5 transition-all flex items-center justify-between group"
        >
          <div class="flex items-center gap-4">
             <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                @if (dataService.isAdmin()) {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
             </div>
             <div class="text-left">
                <h4 class="text-lg font-bold text-white">{{ dataService.isAdmin() ? '管理员已登录' : '管理员入口' }}</h4>
             </div>
          </div>
          <svg class="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
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
