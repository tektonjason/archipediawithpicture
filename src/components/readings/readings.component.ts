import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { DataService, Reading } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import pinyin from 'pinyin';

@Component({
  selector: 'app-readings',
  imports: [FormsModule, CommonModule, NgClass],
  standalone: true,
  template: `
    <div class="h-full flex flex-col p-4 md:p-6 overflow-hidden bg-[#f8f7f5]">
      <!-- Top Toolbar -->
      <div class="flex items-stretch gap-3 mb-4 md:mb-6 shrink-0 h-10 pl-24">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-lg h-full">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="搜索书名、作者、出版社..." 
            class="w-full h-full px-4 text-sm border-2 border-black shadow-[3px_3px_0px_0px_black] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_black] transition-all font-bold placeholder-gray-400 rounded-none bg-white"
          >
          @if (searchQuery()) {
            <button (click)="searchQuery.set('')" class="absolute right-0 top-0 h-full w-10 flex items-center justify-center font-bold text-gray-400 hover:text-red-500">X</button>
          }
        </div>
      </div>

      <!-- Tags Filter -->
      <div class="flex flex-nowrap gap-2 mb-2 md:mb-3 shrink-0 overflow-x-auto pb-2 custom-scrollbar border-b-2 border-transparent hover:border-gray-200 transition-colors">
        <button 
          (click)="selectTag('all')"
          class="flex-shrink-0 whitespace-nowrap px-4 py-1.5 border-2 border-black font-bold transition-all text-xs uppercase tracking-wide active:translate-y-0.5"
          [class.bg-[#FFD700]]="selectedTag() === 'all'"
          [class.shadow-[2px_2px_0px_0px_black]]="selectedTag() === 'all'"
          [class.bg-white]="selectedTag() !== 'all'"
        >全部</button>
        @for (tag of allTags(); track tag) {
          <button 
            (click)="selectTag(tag)"
            class="flex-shrink-0 whitespace-nowrap px-4 py-1.5 border-2 border-black font-bold transition-all text-xs uppercase tracking-wide active:translate-y-0.5"
            [class.bg-[#FFD700]]="selectedTag() === tag"
            [class.shadow-[2px_2px_0px_0px_black]]="selectedTag() === tag"
            [class.bg-white]="selectedTag() !== tag"
          >
            {{ tag }}
          </button>
        }
      </div>

      <!-- Content Area with #-A-Z Scrubber -->
      <div class="flex-1 relative overflow-hidden">
        <div #scrollContainer class="h-full overflow-y-auto pr-14 pb-20 custom-scrollbar-hidden" (scroll)="onScroll()">
          @if (filteredReadings().length === 0) {
            <div class="flex flex-col items-center justify-center h-60 opacity-50 text-center">
              <div class="text-6xl mb-4">📚</div>
              <p class="font-bold text-xl">未找到相关读物</p>
              <p class="text-gray-500 mt-1">请尝试更换关键词或分类标签</p>
            </div>
          } @else {
            @for (group of groupedReadings(); track group.letter) {
              <div class="relative px-2 pb-4">
                <div [attr.data-letter]="group.letter" class="letter-anchor absolute top-0"></div>
                <!-- Sticky Header: Simple Bold Text, Solid BG -->
                <h2 class="font-black text-2xl sticky top-0 bg-[#f8f7f5] py-2 z-10 border-b-2 border-black mb-4 -mx-2 px-2">
                  {{ group.letter }}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  @for (item of group.readings; track item.title; let i = $index) {
                    <div 
                       (click)="openModal(item)" 
                       class="bauhaus-card p-3 md:p-4 flex flex-col h-full animate-pop-in cursor-pointer group hover:bg-white block relative" 
                       [style.animation-delay]="(i % 21 * 30) + 'ms'" 
                     >
                      <div class="flex justify-between items-start mb-1">
                        <h3 class="text-base md:text-lg font-black tracking-tight group-hover:text-[#1C39BB] transition-colors pr-4 flex-1">{{ item.title }}</h3>
                        @if(item.journalLevel) {
                          <span class="px-2 py-0.5 border border-black text-[10px] md:text-xs font-bold shrink-0" [ngClass]="getJournalClass(item.journalLevel)">{{ item.journalLevel }}</span>
                        }
                      </div>
                      <div class="text-xs text-gray-500 mb-2 font-mono">
                        @if (item.author) {
                          <span>{{ item.author }} / {{ item.publisher }}</span>
                        } @else {
                          <span>{{ item.publisher }}</span>
                        }
                      </div>
                      <p class="text-sm text-gray-700 mb-3 leading-relaxed font-serif line-clamp-3">{{ item.description }}</p>
                      <div class="flex flex-wrap gap-1.5 mt-auto border-t-2 border-black/10 pt-2">
                        @for(tag of item.tags; track tag) {
                          <span class="bg-gray-100 text-gray-700 px-2 py-0.5 border border-black/20 text-xs font-bold">{{ tag }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
        
        <!-- #-A-Z Scrubber -->
        @if (groupedReadings().length > 0) {
          <div 
            #scrubberContainer 
            class="absolute top-0 right-0 h-full flex items-center py-4 z-20"
          >
            <!-- Scrubber Bar: Solid White, Black Border, NO Shadow -->
            <div 
              class="relative bg-white border-2 border-black rounded-full flex flex-col gap-0.5 p-1.5 cursor-pointer select-none touch-none"
              (touchstart)="onScrubStart($event)"
              (touchmove)="onScrubMove($event)"
              (touchend)="onScrubEnd()"
              (mousedown)="onScrubStart($event)"
              (mousemove)="onScrubMove($event)"
              (mouseup)="onScrubEnd()"
              (mouseleave)="onScrubEnd()"
            >
              @for (letter of alphabet; track letter) {
                <button 
                  class="w-5 h-5 md:w-6 md:h-6 text-[10px] md:text-xs font-black rounded-full transition-all duration-150 flex items-center justify-center relative z-10"
                  [class.text-gray-300]="!availableLetters().has(letter)"
                  [class.pointer-events-none]="!availableLetters().has(letter)"
                  [class.bg-[#1C39BB]]="letter === (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  [class.text-white]="letter === (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  [class.scale-110]="letter === (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  [class.hover:bg-gray-100]="availableLetters().has(letter) && letter !== (isScrubbing() ? scrubbingLetter() : currentLetter())"
                  [class.text-black]="availableLetters().has(letter) && letter !== (isScrubbing() ? scrubbingLetter() : currentLetter())"
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
            class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            [class.animate-backdrop-in]="!isClosing()"
            [class.animate-backdrop-out]="isClosing()"
            (click)="closeModal()"
          ></div>
          <div 
            class="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] w-full max-w-lg max-h-[90vh] flex flex-col relative z-10 overflow-hidden"
            [class.animate-modal-pop-in]="!isClosing()"
            [class.animate-modal-pop-out]="isClosing()"
          >
             
            <!-- Modal Header -->
            <div class="flex justify-between items-start p-4 border-b-4 border-black bg-gray-50">
               <h3 class="text-xl md:text-2xl font-black pr-4 leading-tight">{{ item.title }}</h3>
            </div>
 
            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto custom-scrollbar">
               <!-- Basic Info Table -->
               <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 mb-6 text-sm">
                  @if (item.author) {
                    <span class="font-bold text-gray-500 text-right">作者:</span>
                    <span class="font-bold">{{ item.author }}</span>
                  }
                   
                  <span class="font-bold text-gray-500 text-right">出版社/单位:</span>
                  <span class="font-bold">{{ item.publisher }}</span>
                   
                  @if (item.tags.includes('期刊')) {
                    <span class="font-bold text-gray-500 text-right">刊号:</span>
                  } @else {
                    <span class="font-bold text-gray-500 text-right">ISBN:</span>
                  }
                  <span class="font-mono" [class.text-gray-400]="!item.identifier">{{ item.identifier || '(暂无)' }}</span>
                   
                  @if(item.journalLevel) {
                     <span class="font-bold text-gray-500 text-right">期刊等级:</span>
                     <span class="px-2 py-0.5 border border-black text-xs font-bold inline-block w-fit" [ngClass]="getJournalClass(item.journalLevel)">{{ item.journalLevel }}</span>
                  }
 
                  <span class="font-bold text-gray-500 text-right">标签:</span>
                  <div class="flex flex-wrap gap-1">
                    @for(tag of item.tags; track tag) {
                        <span class="bg-gray-100 text-gray-700 px-2 py-0.5 border border-black/20 text-xs font-bold">{{ tag }}</span>
                    }
                  </div>
               </div>
 
               <!-- Description -->
               <div class="prose prose-sm max-w-none border-t-2 border-black/10 pt-4">
                  <h4 class="font-black text-lg mb-2">内容简介</h4>
                  <p class="mb-4 font-serif leading-relaxed text-base">{{ item.description }}</p>
                  <div class="bg-gray-50 border-l-4 border-gray-300 p-3">
                     <p class="text-gray-400 italic text-xs leading-relaxed">
                       [此处为更详细的读物内容简介占位符。未来版本将包含该书目的详细目录、核心观点摘要以及学术评价等深度内容。]
                     </p>
                  </div>
               </div>
            </div>
 
            <!-- Modal Footer -->
             <div class="p-4 border-t-4 border-black bg-gray-50 flex justify-end">
                <button (click)="closeModal()" class="bauhaus-btn bg-white px-4 py-1.5 text-sm hover:bg-black hover:text-white">关闭</button>
             </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      height: 8px;
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: black;
      border-radius: 4px;
      border: 2px solid #f8f7f5;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #1C39BB;
    }
    /* Hidden scrollbar but still scrollable */
    .custom-scrollbar-hidden::-webkit-scrollbar {
      display: none;
    }
    .custom-scrollbar-hidden {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    @keyframes backdrop-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modal-pop-in {
      from { 
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .animate-backdrop-in {
      animation: backdrop-in 0.2s ease-out forwards;
    }

    .animate-modal-pop-in {
      animation: modal-pop-in 0.25s ease-out forwards;
    }

    @keyframes backdrop-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes modal-pop-out {
      from { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to { 
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
    }

    .animate-backdrop-out {
      animation: backdrop-out 0.2s ease-in forwards;
    }

    .animate-modal-pop-out {
      animation: modal-pop-out 0.2s ease-in forwards;
    }
  `]
})
export class ReadingsComponent implements AfterViewInit, OnDestroy {
  dataService = inject(DataService);
  searchQuery = signal('');
  selectedTag = signal('all');
  selectedReading = signal<Reading | null>(null);
  isClosing = signal(false);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('scrubberContainer') scrubberContainer!: ElementRef<HTMLDivElement>;

  alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Scrubber State
  isScrubbing = signal(false);
  scrubbingLetter = signal('');
  scrubbingPosition = signal(0);
  currentLetter = signal('');

  private letterElements: Map<string, HTMLElement> = new Map();
  private unlisteners: (() => void)[] = [];

  // get all tags from readings
  allTags = computed(() => {
    const tags = new Set<string>();
    this.dataService.readings().forEach(r => {
      r.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  });

  ngOnDestroy(): void {
    this.unlisteners.forEach(unlisten => unlisten());
  }

  openModal(item: Reading) {
    this.selectedReading.set(item);
  }

  // Helper for Journal Colors
  getJournalClass(level: string | null): string {
    if (!level) return '';
    const l = level.toUpperCase();
    if (l === 'T1') return 'bg-red-500 text-white';
    if (l === 'T2') return 'bg-orange-500 text-white';
    if (l === 'T3') return 'bg-yellow-400 text-black'; // Yellow usually needs dark text
    return 'bg-red-500 text-white'; // Default
  }

  closeModal() {
    this.isClosing.set(true);
    setTimeout(() => {
      this.selectedReading.set(null);
      this.isClosing.set(false);
    }, 200); // Animation duration
  }

  selectTag(tag: string) {
    this.selectedTag.set(tag);
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = 0;
    }
  }

  // Basic filtered list (flat)
  filteredReadings = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tag = this.selectedTag();

    let readings = this.dataService.readings();

    if (tag !== 'all') {
      readings = readings.filter(r => r.tags.includes(tag));
    }

    if (query) {
      readings = readings.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.author.toLowerCase().includes(query) ||
        r.publisher.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }
    return readings;
  });

  // Grouped by First Letter
  groupedReadings = computed(() => {
    const readings = this.filteredReadings();
    const groups = new Map<string, any[]>();

    readings.forEach(item => {
      let firstChar = item.title.charAt(0);
      
      // Try to get pinyin for Chinese characters
      const pinyinResult = pinyin(firstChar, {
        style: pinyin.STYLE_FIRST_LETTER,
        heteronym: false
      });
      
      let letter = '#';
      if (pinyinResult && pinyinResult[0] && pinyinResult[0][0]) {
        letter = pinyinResult[0][0].toUpperCase();
      } else if (/[a-zA-Z]/.test(firstChar)) {
        letter = firstChar.toUpperCase();
      }

      if (!/[A-Z]/.test(letter)) {
        letter = '#';
      }

      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter)!.push(item);
    });

    // Sort groups
    const sortedGroups = Array.from(groups.keys()).sort((a, b) => {
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    }).map(letter => ({
      letter,
      readings: groups.get(letter)!.sort((a, b) => a.title.localeCompare(b.title, 'zh'))
    }));

    return sortedGroups;
  });

  // Available letters for the scrubber
  availableLetters = computed(() => {
    const set = new Set<string>();
    this.groupedReadings().forEach(g => set.add(g.letter));
    return set;
  });

  ngAfterViewInit() {
    this.onScroll(); // Init current letter
  }

  // --- Interaction Logic ---

  onScroll() {
    if (this.isScrubbing()) return; // Don't update while scrubbing

    const container = this.scrollContainer.nativeElement;
    const anchors = container.querySelectorAll('.letter-anchor');
    
    // Use getBoundingClientRect for accurate position checking relative to the viewport
    const containerRect = container.getBoundingClientRect();
    // The threshold is slightly below the top of the container to trigger the switch
    // just as the header comes into view or sticks.
    const threshold = containerRect.top + 100; 
    
    let current = '';
    
    // Iterate through all anchors to find the last one that is "above" or at the threshold
    anchors.forEach((anchor: any) => {
      const anchorRect = anchor.getBoundingClientRect();
      if (anchorRect.top <= threshold) {
        current = anchor.getAttribute('data-letter') || '';
      }
    });

    if (current && current !== this.currentLetter()) {
      this.currentLetter.set(current);
    }
  }

  scrollToLetter(letter: string, behavior: ScrollBehavior = 'auto') {
    if (!this.availableLetters().has(letter)) return;
    
    this.currentLetter.set(letter);
    const container = this.scrollContainer.nativeElement;
    const anchor = container.querySelector(`[data-letter="${letter}"]`) as HTMLElement;
    
    if (anchor) {
      const anchorRect = anchor.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop + (anchorRect.top - containerRect.top);

      container.scrollTo({
        top: scrollTop,
        behavior: behavior
      });
    }
  }

  // --- Scrubber Event Handlers ---

  onScrubStart(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isScrubbing.set(true);
    this.handleScrub(event);
  }

  onScrubMove(event: MouseEvent | TouchEvent) {
    if (this.isScrubbing()) {
      event.preventDefault(); // Prevent page scroll
      this.handleScrub(event);
    }
  }

  onScrubEnd() {
    this.isScrubbing.set(false);
  }

  handleScrub(event: MouseEvent | TouchEvent) {
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    // Get scrubber dimensions
    const scrubber = this.scrubberContainer.nativeElement.querySelector('div'); // Inner div
    if (!scrubber) return;

    const rect = scrubber.getBoundingClientRect();
    const localY = clientY - rect.top;
    
    // Calculate relative position (0 to 1)
    let percentage = (clientY - rect.top) / rect.height;
    percentage = Math.max(0, Math.min(1, percentage));
    
    // Find closest letter index
    const index = Math.floor(percentage * this.alphabet.length);
    let letterIndex = Math.min(index, this.alphabet.length - 1);

    // Find this letter or next available letter
    let targetLetter = '';
    
    // 1. Try finding forward (inclusive)
    for (let i = letterIndex; i < this.alphabet.length; i++) {
        if (this.availableLetters().has(this.alphabet[i])) {
            targetLetter = this.alphabet[i];
            break;
        }
    }
    
    // 2. If no forward letter found (e.g. dragged past Z but Z is empty), try backward
    if (!targetLetter) {
        for (let i = letterIndex - 1; i >= 0; i--) {
            if (this.availableLetters().has(this.alphabet[i])) {
                targetLetter = this.alphabet[i];
                break;
            }
        }
    }

    if (targetLetter) {
         this.scrollToLetter(targetLetter, 'auto'); 
         this.scrubbingLetter.set(targetLetter); 
         this.scrubbingPosition.set(localY - 32); 
    }
  }
}
