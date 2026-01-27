

import { Component, inject, signal, effect, computed, HostListener, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { Location as NgLocation } from '@angular/common';

@Component({
  selector: 'app-entry-detail',
  imports: [FormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#0f0f11] text-gray-300 overflow-hidden relative">
      <!-- Top Bar -->
      <!-- Added pl-24 to avoid overlap with global sidebar toggle -->
      <div class="flex justify-between items-center p-4 pl-24 border-b border-white/10 shrink-0 bg-[#0f0f11]/90 backdrop-blur-md z-10">
        <button (click)="goBack()" class="px-4 py-2 rounded-lg bg-[#18181b] border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors text-gray-300 hover:text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </button>
        <div class="flex items-center gap-2">
           <button (click)="toggleFav()" class="w-10 h-10 flex items-center justify-center transition-all active:scale-90 group rounded-lg hover:bg-white/5">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 transition-all" 
                [class.text-yellow-400]="isFav()"
                [class.text-gray-400]="!isFav()"
                [class.group-hover:text-yellow-300]="true"
                viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
             </svg>
           </button>
           @if (dataService.isAdmin()) {
             <button (click)="toggleEdit()" class="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors" [class.bg-blue-600]="isEditing()" [class.text-white]="isEditing()" [class.border-blue-500]="isEditing()">
               {{ isEditing() ? '保存' : '编辑' }}
             </button>
             <button (click)="showDeleteModal.set(true)" class="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors">删除</button>
           }
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 md:p-10 pb-20 custom-scrollbar">
        @if (entry(); as e) {
          @if (isEditing()) {
             <!-- Edit Mode -->
             <div class="max-w-3xl mx-auto flex flex-col gap-6 pb-10 animate-fade-in-up">
                <div class="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 text-sm text-blue-300">
                  <p class="font-bold text-base text-white mb-1">管理员编辑模式</p>
                  <p>您可以修改所有内容。上传的图片将自动压缩至 &lt; 130KB 并存储于应用内。</p>
                </div>

                <div>
                  <label class="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">中文术语</label>
                  <input [(ngModel)]="editForm.term" class="w-full bg-[#18181b] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                </div>
                
                <div>
                  <label class="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">英文术语</label>
                  <input [(ngModel)]="editForm.termEn" class="w-full bg-[#18181b] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">分类</label>
                    <input [(ngModel)]="editForm.category" class="w-full bg-[#18181b] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                  </div>
                  <div>
                    <label class="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">子分类</label>
                    <input [(ngModel)]="editForm.subcategory" class="w-full bg-[#18181b] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                  </div>
                </div>

                <div>
                  <label class="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">简述</label>
                  <textarea [(ngModel)]="editForm.definition" class="w-full bg-[#18181b] border border-white/10 rounded-lg p-3 h-24 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"></textarea>
                </div>

                <div>
                  <label class="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">详细解析</label>
                  <textarea [(ngModel)]="editForm.details" class="w-full bg-[#18181b] border border-white/10 rounded-lg p-3 h-48 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"></textarea>
                </div>

                <div>
                  <label class="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">配图 (点击上传替换)</label>
                  <div class="border border-dashed border-white/20 rounded-lg p-8 bg-[#18181b] text-center relative group cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="file" (change)="handleImageUpload($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
                    <div class="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-200">
                      <span class="text-3xl">📷</span>
                      <span class="text-sm font-bold">点击选择图片文件</span>
                      <span class="text-xs text-gray-500">支持 JPG/PNG, 自动压缩</span>
                    </div>
                  </div>
                </div>
                
                @if (editForm.imageUrl) {
                  <div class="mt-2">
                    <p class="text-xs font-bold text-gray-500 mb-2">当前图片预览:</p>
                    <img [src]="editForm.imageUrl" class="w-full max-h-60 object-contain border border-white/10 rounded-lg bg-black/50 p-2">
                  </div>
                }
             </div>
          } @else {
            <!-- View Mode -->
            <div class="max-w-4xl mx-auto animate-fade-in-up">
              <!-- Header Info -->
              <div class="mb-10 text-center md:text-left">
                <div class="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                  <span class="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/5">{{ e.category }}</span>
                  <span class="bg-[#18181b] text-gray-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">{{ e.subcategory }}</span>
                </div>
                <h1 class="text-4xl md:text-6xl font-bold mb-2 text-white tracking-wide">{{ e.term }}</h1>
                <h2 class="text-xl md:text-2xl font-serif italic text-gray-500 mb-8">{{ e.termEn }}</h2>
                
                <div class="p-6 bg-[#18181b] rounded-xl border-l-4 border-blue-500/50 shadow-lg">
                  <p class="font-medium text-lg lg:text-xl leading-relaxed text-gray-200">{{ e.definition }}</p>
                </div>
              </div>

              <!-- Media Section -->
              <div class="mb-12 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#18181b]">
                <div 
                  class="aspect-video bg-[#0f0f11] overflow-hidden relative group/image"
                  [class.cursor-pointer]="e.imageUrl"
                  (click)="openImageModal()">
                  @if(e.imageUrl) {
                    <img [src]="e.imageUrl" class="w-full h-full object-contain md:object-cover transition-transform duration-700 group-hover/image:scale-105" [style.object-position]="e.imagePosition || 'center'" alt="{{e.term}}">
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-300">
                      <div class="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20 text-white transform translate-y-4 group-hover/image:translate-y-0 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  } @else {
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#18181b] to-[#0f0f11]">
                       <span class="text-gray-600 font-bold text-lg">暂无图片</span>
                    </div>
                  }
                </div>
                <div class="p-3 text-xs font-mono text-center bg-[#202024] text-gray-500 border-t border-white/5 uppercase tracking-wider">Figure 1.1 - {{ e.term }} 示意图</div>
              </div>

              <!-- Details -->
              <div class="max-w-none">
                <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span class="w-1 h-8 bg-blue-500 rounded-full"></span>
                  详细解析
                </h3>
                <p class="whitespace-pre-wrap leading-relaxed text-gray-300 font-sans tracking-wide text-lg text-left">{{ e.details }}</p>
              </div>
            </div>
          }
        } @else {
          <div class="flex flex-col items-center justify-center h-full text-gray-500">
             <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
             <p>正在加载条目详情...</p>
          </div>
        }
      </div>

      @if (showDeleteModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="showDeleteModal.set(false)"></div>
            <div class="bg-[#18181b] p-8 border border-white/10 rounded-xl shadow-2xl max-w-sm w-full relative z-10">
                <h3 class="font-bold text-xl mb-2 text-center text-white">确认删除</h3>
                <p class="my-6 text-center text-gray-400">确定要删除条目 “<strong class="text-red-400">{{ entry()?.term }}</strong>” 吗？<br>此操作不可恢复。</p>
                <div class="flex justify-center gap-3">
                    <button (click)="showDeleteModal.set(false)" class="px-5 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors">取消</button>
                    <button (click)="confirmDelete()" class="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors font-medium">确认删除</button>
                </div>
            </div>
        </div>
      }

      @if (showImageModal()) {
        <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-8">
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-black/95 backdrop-blur-xl"
            [class.animate-backdrop-in]="!isImageModalAnimatingOut()"
            [class.animate-backdrop-out]="isImageModalAnimatingOut()"
            (click)="closeImageModal()">
          </div>
          
          <!-- Modal Content -->
          <div 
            class="relative z-10 w-full h-full flex flex-col gap-6"
            [class.animate-modal-pop-in]="!isImageModalAnimatingOut()"
            [class.animate-modal-pop-out]="isImageModalAnimatingOut()">
            
            <!-- Image Container -->
            <div class="flex-1 flex items-center justify-center overflow-hidden" (click)="closeImageModal()">
              <img 
                [src]="entry()?.imageUrl" 
                alt="{{entry()?.term}}" 
                (load)="onImageLoad($event)"
                class="modal-image object-contain shadow-2xl rounded-lg transition-transform duration-300"
                (click)="$event.stopPropagation()">
            </div>

            <!-- Controls -->
            <div class="flex-shrink-0 flex justify-center items-center gap-4 pb-4">
              <button (click)="downloadImage()" class="px-6 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                下载原图
              </button>
              <button (click)="closeImageModal()" class="px-6 py-3 rounded-xl bg-[#18181b] border border-white/10 text-white hover:bg-white/10 font-bold flex items-center gap-2 transition-all active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                关闭
              </button>
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
    @keyframes backdropIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes backdropOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes modalPopIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes modalPopOut {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.95); }
    }
    .animate-backdrop-in {
      animation: backdropIn 0.3s ease-out forwards;
    }
    .animate-backdrop-out {
      animation: backdropOut 0.25s ease-in forwards;
    }
    .animate-modal-pop-in {
      animation: modalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-modal-pop-out {
      animation: modalPopOut 0.25s ease-in forwards;
    }
  `]
})
export class EntryDetailComponent implements OnDestroy {
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  location: NgLocation = inject(NgLocation);
  dataService = inject(DataService);

  private resizeObserver: ResizeObserver | null = null;
  private activeImageElement: HTMLImageElement | null = null;

  ngOnDestroy() {
    this.disconnectResizeObserver();
  }

  private disconnectResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  entryId = signal<string>('');
  entry = computed(() => this.dataService.getEntry(this.entryId())());
  
  isFav = computed(() => this.entryId() ? this.dataService.isFavorite(this.entryId())() : false);
  
  isEditing = signal(false);
  editForm: any = {};
  
  showDeleteModal = signal(false);
  showImageModal = signal(false);
  isImageModalAnimatingOut = signal(false);

  constructor() {
    this.route.params.subscribe(p => {
      this.entryId.set(p['id']);
      // Add to history when viewed
      if (p['id'] && this.entry()) {
        this.dataService.addToHistory(this.entry()!.term);
      }
    });

    this.route.queryParams.subscribe(p => {
      if (p['edit'] === 'true' && this.dataService.isAdmin()) {
        this.isEditing.set(true);
      }
    });

    effect(() => {
      if (this.isEditing() && this.entry()) {
        this.editForm = { ...this.entry() };
      }
    });
  }

  goBack() {
    this.location.back();
  }

  toggleFav() {
    if(this.entryId()) this.dataService.toggleFavorite(this.entryId());
  }

  toggleEdit() {
    if (this.isEditing() && this.entry() && this.editForm.id) {
        this.dataService.updateEntry(this.editForm);
    }
    this.isEditing.update(v => !v);
  }

  confirmDelete() {
    this.dataService.deleteEntry(this.entryId());
    this.showDeleteModal.set(false);
    this.router.navigate(['/encyclopedia']);
  }

  async handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const compressedBase64 = await this.dataService.compressImage(input.files[0]);
        this.editForm.imageUrl = compressedBase64;
      } catch (e) {
        console.error(e);
      }
    }
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.updateImageSize(img);
  }

  @HostListener('window:resize')
  onWindowResize() {
    const img = document.querySelector('.modal-image') as HTMLImageElement;
    if (img) {
      this.updateImageSize(img);
    }
  }

  private updateImageSize(img: HTMLImageElement) {
    if (!img.naturalWidth) return;

    // Use window dimensions directly for stability, accounting for padding (approx 32px-64px)
    const availableWidth = window.innerWidth - 64; 
    const availableHeight = window.innerHeight - 64;

    const screenRatio = availableWidth / availableHeight;
    const imageRatio = img.naturalWidth / img.naturalHeight;

    // Reset styles first
    img.style.width = '';
    img.style.height = '';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';

    if (imageRatio > screenRatio) {
      // Image is wider than screen: fit to width
      // To ensure small images are scaled UP, we set width to 100%
      // But we must check if that causes height to overflow (which it shouldn't if ratio logic is correct)
      img.style.width = '100%';
      img.style.height = 'auto';
    } else {
      // Image is taller than screen: fit to height
      img.style.width = 'auto';
      img.style.height = '100%';
    }
  }

  openImageModal() {
    if (this.entry()?.imageUrl) {
      this.showImageModal.set(true);
    }
  }

  closeImageModal() {
    this.isImageModalAnimatingOut.set(true);
    setTimeout(() => {
      this.showImageModal.set(false);
      this.isImageModalAnimatingOut.set(false);
    }, 250); // Matches the new 0.25s animation duration
  }

  downloadImage() {
    const imageUrl = this.entry()?.imageUrl;
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    // Extract filename or generate one
    const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1) || `${this.entry()?.term?.replace(/\s+/g, '_') ?? 'image'}.jpg`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}