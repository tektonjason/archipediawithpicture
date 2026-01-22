import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import pinyin from 'pinyin';

@Component({
  selector: 'app-readings',
  imports: [FormsModule],
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
      <div class="flex flex-nowrap gap-2 mb-4 md:mb-6 shrink-0 overflow-x-auto pb-2 custom-scrollbar border-b-2 border-transparent hover:border-gray-200 transition-colors">
        <button 
          (click)="selectedTag.set('all')"
          class="flex-shrink-0 whitespace-nowrap px-4 py-1.5 border-2 border-black font-bold transition-all text-xs uppercase tracking-wide active:translate-y-0.5"
          [class.bg-[#FFD700]]="selectedTag() === 'all'"
          [class.shadow-[2px_2px_0px_0px_black]]="selectedTag() === 'all'"
          [class.bg-white]="selectedTag() !== 'all'"
        >全部</button>
        @for (tag of allTags(); track tag) {
          <button 
            (click)="selectedTag.set(tag)"
            class="flex-shrink-0 whitespace-nowrap px-4 py-1.5 border-2 border-black font-bold transition-all text-xs uppercase tracking-wide active:translate-y-0.5"
            [class.bg-[#1C39BB]]="selectedTag() === tag"
            [class.text-white]="selectedTag() === tag"
            [class.shadow-[2px_2px_0px_0px_black]]="selectedTag() === tag"
            [class.bg-white]="selectedTag() !== tag"
          >
            {{ tag }}
          </button>
        }
      </div>

      <!-- Content Grid -->
      <div class="flex-1 overflow-y-auto pr-1 pb-20 custom-scrollbar">
        @if (filteredReadings().length === 0) {
          <div class="flex flex-col items-center justify-center h-60 opacity-50 text-center">
            <div class="text-6xl mb-4">📚</div>
            <p class="font-bold text-xl">未找到相关读物</p>
            <p class="text-gray-500 mt-1">请尝试更换关键词或分类标签</p>
          </div>
        }
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          @for (item of filteredReadings(); track item.title; let i = $index) {
            <div class="bauhaus-card p-4 flex flex-col h-full animate-pop-in" [style.animation-delay]="i < 21 ? (i * 30) + 'ms' : '0ms'">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-black tracking-tight group-hover:text-[#1C39BB] transition-colors pr-4 flex-1">{{ item.title }}</h3>
                @if(item.journalLevel) {
                  <span class="bg-red-500 text-white px-2 py-0.5 border border-black text-xs font-bold shrink-0">{{ item.journalLevel }}</span>
                }
              </div>
              <div class="text-xs text-gray-500 mb-3 font-mono">
                <span>{{ item.author || 'N/A' }} / {{ item.publisher }}</span>
              </div>
              <p class="text-sm text-gray-700 mb-4 flex-1 leading-relaxed font-serif">{{ item.description }}</p>
              <div class="flex flex-wrap gap-1.5 mt-auto border-t-2 border-black/10 pt-3">
                @for(tag of item.tags; track tag) {
                  <span class="bg-gray-100 text-gray-700 px-2 py-0.5 border border-black/20 text-xs font-bold">{{ tag }}</span>
                }
              </div>
            </div>
          }
        </div>
      </div>
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
  `]
})
export class ReadingsComponent {
  dataService = inject(DataService);
  searchQuery = signal('');
  selectedTag = signal('all');

  // get all tags from readings
  allTags = computed(() => {
    const tags = new Set<string>();
    this.dataService.readings().forEach(r => {
      r.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  });

  // filtered and sorted readings
  filteredReadings = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tag = this.selectedTag();

    let readings = this.dataService.readings();

    // Filter by tag
    if (tag !== 'all') {
      readings = readings.filter(r => r.tags.includes(tag));
    }

    // Filter by search query
    if (query) {
      readings = readings.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.author.toLowerCase().includes(query) ||
        r.publisher.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }

    // Sort by pinyin
    return [...readings].sort((a, b) => {
      const pinyinA = pinyin(a.title, { style: pinyin.STYLE_NORMAL }).flat().join('');
      const pinyinB = pinyin(b.title, { style: pinyin.STYLE_NORMAL }).flat().join('');
      return pinyinA.localeCompare(pinyinB);
    });
  });
}
