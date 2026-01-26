
import { Component, signal, inject } from '@angular/core';
import { DataService } from '../../services/data.service';
import { NgStyle, CommonModule } from '@angular/common';

interface AiTool {
  id: string;
  name: string;
  url: string;
  desc: string;
  theme: string;
}

@Component({
  selector: 'app-ai-assistant',
  imports: [NgStyle, CommonModule],
  template: `
    <div class="h-full flex flex-col bg-[#0f0f11] text-white overflow-y-auto p-6 md:p-8 relative custom-scrollbar">
      
      <!-- Top Header -->
      <div class="flex flex-col items-center mb-8 shrink-0 space-y-2">
        <h2 class="text-3xl md:text-4xl font-bold tracking-wide">AI 导师导航</h2>
        <p class="text-gray-400 text-sm md:text-base text-center max-w-2xl">请选择一个 AI 模型，复制专属提示词进行提问。</p>
      </div>

      <!-- Tools Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        @for (tool of aiTools; track tool.id) {
          <div 
            (click)="openModal(tool)"
            class="group relative bg-[#18181b] border border-white/5 rounded-xl p-6 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:border-white/10"
          >
            <!-- Hover Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            <div class="flex items-center gap-4 mb-4 relative z-10">
              <!-- Icons Container -->
              <div class="w-12 h-12 shrink-0 flex items-center justify-center rounded-lg bg-black border border-white/10 group-hover:bg-black/80 transition-colors">
                @switch (tool.id) {
                  @case ('deepseek') {
                    <span class="font-bold text-lg text-blue-500">DS</span>
                  }
                  @case ('chatgpt') {
                    <span class="font-bold text-lg text-green-500">GPT</span>
                  }
                  @case ('gemini') {
                    <span class="font-bold text-lg text-purple-500">Ge</span>
                  }
                  @case ('claude') {
                    <span class="font-bold text-lg text-orange-500">Cl</span>
                  }
                  @case ('grok') {
                    <span class="font-bold text-lg text-white">X</span>
                  }
                  @case ('doubao') {
                    <span class="font-bold text-lg text-sky-400">CiCi</span>
                  }
                }
              </div>
              <h3 class="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{{ tool.name }}</h3>
            </div>
            
            <p class="text-gray-400 text-sm leading-relaxed mb-6 min-h-[4rem] relative z-10">{{ tool.desc }}</p>
            
            <button class="w-full py-2.5 rounded-lg bg-white/5 text-sm font-bold text-gray-300 border border-white/5 hover:bg-white hover:text-black hover:border-transparent transition-all flex items-center justify-center gap-2 relative z-10">
              <span>获取提示词</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </div>
        }
      </div>

      <!-- Prompt Modal -->
      @if (selectedTool()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="closeModal()" class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"></div>
          <div class="bg-[#18181b] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 animate-fade-in-up overflow-hidden">
            
            <div class="p-5 border-b border-white/10 flex justify-between items-center bg-[#202024]">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                前往: {{ selectedTool()?.name }}
              </h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="p-6 overflow-y-auto custom-scrollbar">
              <p class="font-medium mb-4 text-gray-400 text-sm">已为您准备好建筑学专用提示词 (Prompt):</p>
              
              <div class="bg-[#0f0f11] border border-white/10 rounded-lg p-5 font-mono text-sm leading-loose whitespace-pre-wrap text-gray-300 relative group">
                <span class="text-gray-500 select-none">{{ promptParts.prefix }}</span>
                <span class="text-gray-500 select-none">{{ promptParts.suffix }}</span>
                
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span class="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Preview</span>
                </div>
              </div>
              
              <div class="mt-6 flex justify-end gap-3">
                <button (click)="closeModal()" class="px-5 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm">取消</button>
                <button (click)="copyAndGo()" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2">
                  <span>复制并前往</span>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      }
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
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out backwards;
    }
  `]
})
export class AiAssistantComponent {
  dataService = inject(DataService);
  aiTools: AiTool[] = [
    { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', desc: '深度求索 (DeepSeek) 是国产开源大模型的领军者，擅长复杂逻辑推理、代码生成及深度学术问答。', theme: 'blue' },
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', desc: 'OpenAI 开发的通用人工智能，拥有最庞大的知识库和流畅的对话体验，适合广泛的建筑理论探讨。', theme: 'green' },
    { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', desc: 'Google 的原生多模态 AI，能同时处理文本和图片信息，适合结合建筑图像进行分析。', theme: 'blue' },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai', desc: 'Anthropic 开发的 AI，以安全性和长文本处理能力著称，非常适合阅读和总结长篇建筑论文。', theme: 'orange' },
    { id: 'grok', name: 'Grok', url: 'https://grok.x.ai', desc: 'X (Twitter) 旗下的 AI，能够实时获取社交媒体上的最新资讯和趋势，风格犀利幽默。', theme: 'black' },
    { id: 'doubao', name: '豆包', url: 'https://www.doubao.com', desc: '字节跳动推出的智能助手，响应速度快，中文语境理解能力强，适合日常快速查询。', theme: 'blue' }
  ];

  selectedTool = signal<AiTool | null>(null);

  promptParts = {
    prefix: '你是一位专业的建筑学导师，服务于"Archipedia"应用。 \n你的目标是帮助用户学习建筑知识，制定学习计划，并解释专业术语。 \n请用中文回答，语言专业、精确、简洁。',
    suffix: '重要规则：\n如果你的回复中提到了任何特定的建筑术语，请尽量使用标准术语，并提供可访问的可靠资料的访问链接。 \n不要使用Markdown链接语法，直接输出文本即可。 \n保持语气鼓励和学术性。'
  };

  fullPrompt = this.promptParts.prefix + '\n' + this.promptParts.suffix;

  openModal(tool: AiTool) {
    this.selectedTool.set(tool);
    // When opening a modal, ensure sidebar is closed on mobile for better view
    if (window.innerWidth < 768) {
      this.dataService.setSidebarState(false);
    }
  }

  closeModal() {
    this.selectedTool.set(null);
  }

  copyAndGo() {
    const tool = this.selectedTool();
    if (tool) {
      navigator.clipboard.writeText(this.fullPrompt).then(() => {
        window.open(tool.url, '_blank');
        this.closeModal();
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback or error message
      });
    }
  }
}
