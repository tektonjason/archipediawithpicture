

import { Component, inject, signal, effect, computed, HostListener, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { Location as NgLocation } from '@angular/common';
import { APP_UI_ICONS } from '../shared/ui-icons';

@Component({
  selector: 'app-entry-detail',
  imports: [FormsModule, ...APP_UI_ICONS],
  template: `
    <div class="ui-page relative">
      <!-- Top Bar -->
      <!-- Added pl-24 to avoid overlap with global sidebar toggle -->
      <div class="flex justify-between items-center p-4 pl-24 border-b border-line shrink-0 bg-app/90 backdrop-blur-md z-10">
        <button (click)="goBack()" class="ui-btn-secondary">
          <svg lucideArrowLeft class="w-4 h-4" [strokeWidth]="2"></svg>
          返回
        </button>
        <div class="flex items-center gap-2">
           <button (click)="toggleFav()" class="ui-icon-btn transition-all active:scale-90 group border-transparent bg-transparent">
             <svg lucideStar class="w-6 h-6 transition-all" 
                [class.text-yellow-400]="isFav()"
                [class.text-gray-400]="!isFav()"
                [class.group-hover:text-yellow-300]="true"
                [attr.fill]="isFav() ? 'currentColor' : 'none'"
                [strokeWidth]="2"></svg>
           </button>
           @if (dataService.isAdmin()) {
             <button (click)="toggleEdit()" class="ui-btn-secondary" [class.bg-blue-600]="isEditing()" [class.text-white]="isEditing()" [class.border-blue-500]="isEditing()">
               {{ isEditing() ? '保存' : '编辑' }}
             </button>
             <button (click)="showDeleteModal.set(true)" class="ui-btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10">删除</button>
           }
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 md:p-10 pb-20 custom-scrollbar">
        @if (entry(); as e) {
          @if (isEditing()) {
             <!-- Edit Mode -->
             <div class="max-w-3xl mx-auto flex flex-col gap-6 pb-10 animate-fade-in-up">
                <div class="ui-alert-info">
                  <p class="font-bold text-base text-white mb-1">管理员编辑模式</p>
                  <p>您可以修改所有内容。上传的图片将自动压缩至 &lt; 130KB 并存储于应用内。</p>
                </div>

                <div>
                  <label class="ui-label">中文术语</label>
                  <input [(ngModel)]="editForm.term" class="ui-field">
                </div>
                
                <div>
                  <label class="ui-label">英文术语</label>
                  <input [(ngModel)]="editForm.termEn" class="ui-field">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="ui-label">分类</label>
                    <input [(ngModel)]="editForm.category" class="ui-field">
                  </div>
                  <div>
                    <label class="ui-label">子分类</label>
                    <input [(ngModel)]="editForm.subcategory" class="ui-field">
                  </div>
                </div>

                <div>
                  <label class="ui-label">简述</label>
                  <textarea [(ngModel)]="editForm.definition" class="ui-field h-24"></textarea>
                </div>

                <div>
                  <label class="ui-label">详细解析</label>
                  <textarea [(ngModel)]="editForm.details" class="ui-field h-48"></textarea>
                </div>

                <div>
                  <label class="ui-label">配图 (点击上传替换)</label>
                  <div class="border border-dashed border-line-strong rounded-control p-8 bg-surface text-center relative group cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="file" (change)="handleImageUpload($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
                    <div class="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-200">
                      <svg lucideUpload class="w-8 h-8" [strokeWidth]="1.8"></svg>
                      <span class="text-sm font-bold">点击选择图片文件</span>
                      <span class="text-xs text-gray-500">支持 JPG/PNG, 自动压缩</span>
                    </div>
                  </div>
                </div>
                
                @if (editForm.imageUrl) {
                  <div class="mt-2">
                    <p class="text-xs font-bold text-gray-500 mb-2">当前图片预览:</p>
                    <img [src]="editForm.imageUrl" class="w-full max-h-60 object-contain border border-line rounded-control bg-black/50 p-2">
                  </div>
                }
             </div>
          } @else {
            <!-- View Mode -->
            <div class="max-w-4xl mx-auto animate-fade-in-up">
              <!-- Header Info -->
              <div class="mb-10 text-center md:text-left">
                <div class="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                  <span class="ui-badge bg-white/10 text-white border-line-soft">{{ e.category }}</span>
                  <span class="ui-badge bg-surface text-gray-400 border-line">{{ e.subcategory }}</span>
                </div>
                <h1 class="text-4xl md:text-6xl font-bold mb-2 text-white tracking-wide">{{ e.term }}</h1>
                <h2 class="text-xl md:text-2xl font-serif italic text-gray-500 mb-8">{{ e.termEn }}</h2>
                
                <div class="p-6 ui-card border-l-4 border-blue-500/50 shadow-lg">
                  <p class="font-medium text-lg lg:text-xl leading-relaxed text-gray-200">{{ e.definition }}</p>
                </div>
              </div>

              <!-- Media Section -->
              <div class="mb-12 rounded-card overflow-hidden border border-line shadow-panel bg-surface">
                <div 
                  class="aspect-video bg-app overflow-hidden relative group/image"
                  [class.cursor-pointer]="e.imageUrl"
                  (click)="openImageModal()">
                  @if(e.imageUrl) {
                    <img [src]="e.imageUrl" class="w-full h-full object-contain md:object-cover transition-transform duration-700 group-hover/image:scale-105" [style.object-position]="e.imagePosition || 'center'" alt="{{e.term}}">
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all duration-300">
                      <div class="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20 text-white transform translate-y-4 group-hover/image:translate-y-0 transition-transform">
                        <svg lucideZoomIn class="h-8 w-8" [strokeWidth]="2"></svg>
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
        <div class="ui-modal-shell animate-fade-in-up">
            <div class="ui-modal-backdrop" (click)="showDeleteModal.set(false)"></div>
            <div class="ui-modal-panel p-8 max-w-sm">
                <h3 class="font-bold text-xl mb-2 text-center text-white">确认删除</h3>
                <p class="my-6 text-center text-gray-400">确定要删除条目 “<strong class="text-red-400">{{ entry()?.term }}</strong>” 吗？<br>此操作不可恢复。</p>
                <div class="flex justify-center gap-3">
                    <button (click)="showDeleteModal.set(false)" class="ui-btn-secondary">取消</button>
                    <button (click)="confirmDelete()" class="ui-btn-danger">确认删除</button>
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
              <button (click)="downloadImage()" class="ui-btn-primary px-6 py-3 active:scale-95 shadow-lg shadow-white/10">
                <svg lucideDownload class="h-5 w-5" [strokeWidth]="2"></svg>
                下载原图
              </button>
              <button (click)="closeImageModal()" class="ui-btn-secondary px-6 py-3 active:scale-95">
                <svg lucideX class="h-5 w-5" [strokeWidth]="2"></svg>
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
  private imageModalCloseTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy() {
    if (this.imageModalCloseTimer) clearTimeout(this.imageModalCloseTimer);
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
      if (this.imageModalCloseTimer) {
        clearTimeout(this.imageModalCloseTimer);
        this.imageModalCloseTimer = null;
      }
      this.isImageModalAnimatingOut.set(false);
      this.showImageModal.set(true);
    }
  }

  closeImageModal() {
    if (!this.showImageModal() || this.isImageModalAnimatingOut()) return;
    this.isImageModalAnimatingOut.set(true);
    if (this.imageModalCloseTimer) clearTimeout(this.imageModalCloseTimer);
    this.imageModalCloseTimer = setTimeout(() => {
      this.imageModalCloseTimer = null;
      this.showImageModal.set(false);
      this.isImageModalAnimatingOut.set(false);
    }, 250); // Matches the new 0.25s animation duration
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.showImageModal()) {
      this.closeImageModal();
      return;
    }

    if (this.showDeleteModal()) {
      this.showDeleteModal.set(false);
    }
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
