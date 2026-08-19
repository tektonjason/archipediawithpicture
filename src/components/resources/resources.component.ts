import { Component, HostListener, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet } from '@angular/common';
import { DataService, Link, ResourceAction, ResourceCollection } from '../../services/data.service';
import { LocaleService } from '../../services/locale.service';
import { ShareCardService } from '../../services/share-card.service';
import { AnimatedSearchBarComponent } from '../shared/animated-search-bar.component';
import { APP_UI_ICONS } from '../shared/ui-icons';
import { ModalA11yDirective } from '../shared/modal-a11y.directive';
import { GsapCardHoverDirective } from '../shared/gsap-card-hover.directive';
import {
  createEmptyStudentVerificationForm,
  validateStudentResourceIdentity,
} from '../shared/student-resource-verification';

@Component({
  selector: 'app-resources',
  imports: [FormsModule, RouterLink, NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet, AnimatedSearchBarComponent, GsapCardHoverDirective, ModalA11yDirective, ...APP_UI_ICONS],
  template: `
    <div class="ui-page-scroll ui-page-pad text-white">
      <div class="ui-page-header">
        <h2 class="ui-title">{{ displayText(pageTitle()) }}</h2>
        <p class="ui-subtitle mb-4">{{ displayText(pageSubtitle()) }}</p>

        <div class="relative z-20 mt-4 flex h-12 w-full max-w-3xl items-center justify-center gap-4">
          <app-animated-search-bar
            [query]="searchQuery()"
            (queryChange)="searchQuery.set($event)"
            [placeholder]="displayText(searchPlaceholder())"
          ></app-animated-search-bar>

          <div class="flex h-12 shrink-0 items-center rounded-card border border-line bg-surface p-1 shadow-lg">
            <button
              type="button"
              (click)="switchView('list')"
              class="rounded-lg p-2 transition-colors"
              [class.bg-white/10]="viewMode() === 'list'"
              [class.text-white]="viewMode() === 'list'"
              [class.text-gray-500]="viewMode() !== 'list'"
              title="列表视图"
              aria-label="列表视图"
            >
              <svg lucideLayoutList class="h-5 w-5" [strokeWidth]="2"></svg>
            </button>
            <button
              type="button"
              (click)="switchView('cards')"
              class="rounded-lg p-2 transition-colors"
              [class.bg-white/10]="viewMode() === 'cards'"
              [class.text-white]="viewMode() === 'cards'"
              [class.text-gray-500]="viewMode() !== 'cards'"
              title="卡片视图"
              aria-label="卡片视图"
            >
              <svg lucideLayoutGrid class="h-5 w-5" [strokeWidth]="2"></svg>
            </button>
          </div>
        </div>
      </div>

      @if (filteredLinks().length === 0) {
        <div class="ui-empty-state h-60 opacity-80">
          <div class="ui-empty-icon"><svg lucidePackageOpen class="h-8 w-8" [strokeWidth]="1.8"></svg></div>
          <p class="text-lg font-medium">未找到相关资源</p>
          <p class="mt-1 text-sm text-gray-500">请尝试更换关键词查找</p>
          <button [routerLink]="['/contact']" class="ui-btn-secondary mt-4">向我反馈</button>
        </div>
      } @else if (viewMode() === 'cards') {
        <div class="ui-filter-rail mb-6 mt-8">
          <button
            type="button"
            (click)="selectCardCategory('全部')"
            class="ui-filter-chip"
            [class.bg-white]="selectedCardCategory() === '全部'"
            [class.text-black]="selectedCardCategory() === '全部'"
            [class.bg-white/5]="selectedCardCategory() !== '全部'"
            [class.text-gray-300]="selectedCardCategory() !== '全部'"
          >
            全部 {{ filteredLinks().length }}
          </button>
          @for (group of groupedLinks(); track group.category) {
            <button
              type="button"
              (click)="selectCardCategory(group.category)"
              class="ui-filter-chip"
              [class.bg-white]="selectedCardCategory() === group.category"
              [class.text-black]="selectedCardCategory() === group.category"
              [class.bg-white/5]="selectedCardCategory() !== group.category"
              [class.text-gray-300]="selectedCardCategory() !== group.category"
            >
              {{ displayCategory(group.category) }} {{ group.links.length }}
            </button>
          }
        </div>

        @if (selectedCardCategory() === '项目资料') {
          <div class="ui-filter-rail mb-6 -mt-2 border-amber-400/15 bg-amber-400/[0.025]">
            <button
              type="button"
              (click)="selectedProjectMaterialGroup.set('全部')"
              class="ui-filter-chip"
              [class.bg-amber-300]="selectedProjectMaterialGroup() === '全部'"
              [class.text-black]="selectedProjectMaterialGroup() === '全部'"
              [class.bg-white/5]="selectedProjectMaterialGroup() !== '全部'"
              [class.text-gray-300]="selectedProjectMaterialGroup() !== '全部'"
            >
              {{ displayText('全部资料') }} {{ projectMaterialLinks().length }}
            </button>
            @for (group of projectMaterialGroups(); track group.name) {
              <button
                type="button"
                (click)="selectedProjectMaterialGroup.set(group.name)"
                class="ui-filter-chip"
                [class.bg-amber-300]="selectedProjectMaterialGroup() === group.name"
                [class.text-black]="selectedProjectMaterialGroup() === group.name"
                [class.bg-white/5]="selectedProjectMaterialGroup() !== group.name"
                [class.text-gray-300]="selectedProjectMaterialGroup() !== group.name"
              >
                {{ displayText(group.name) }} {{ group.links.length }}
              </button>
            }
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          @for (link of cardLinks(); track link.id) {
            <article class="group/resource ui-card ui-card-hover ui-long-list-item overflow-hidden" appGsapCardHover>
              <button type="button" (click)="openResource(link)" class="block w-full text-left">
                <div class="relative aspect-[16/9] overflow-hidden bg-white/5">
                  <img
                    [src]="resourceImage(link)"
                    [alt]="displayLinkAlt(link)"
                    loading="lazy"
                    decoding="async"
                    class="h-full w-full object-cover opacity-90 transition-[transform,opacity] duration-ui ease-ui-out group-hover/resource:scale-[1.03] group-hover/resource:opacity-100"
                    (error)="handleImageError($event)"
                  >
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent"></div>
                  <span class="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">{{ displayCardCategory(link) }}</span>
                </div>
                <div class="min-w-0 p-4">
                  <div class="mb-2 flex items-start justify-between gap-3">
                    <h3 class="line-clamp-1 text-base font-black text-white group-hover/resource:text-blue-300">{{ displayLinkTitle(link) }}</h3>
                    <span class="shrink-0 text-xs font-black text-gray-500">{{ getResourceMark(displayLinkTitle(link)) }}</span>
                  </div>
                  <p class="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-gray-500">{{ displayLinkDescription(link) }}</p>
                  @if (visibleTags(link).length) {
                    <div class="mt-3 flex flex-wrap gap-1.5">
                      @for (tag of visibleTags(link); track tag) {
                        <span [class]="getTagClass(link.category, tag)">{{ displayText(tag) }}</span>
                      }
                    </div>
                  }
                </div>
              </button>

              <div class="flex items-center gap-2 border-t border-white/10 p-3">
                <button type="button" (click)="toggleFavoriteResource($event, link)" class="ui-icon-btn h-9 w-9" [title]="isResourceFavorite(link) ? '取消收藏' : '收藏资源'">
                  <svg lucideStar class="h-4 w-4" [class.text-yellow-300]="isResourceFavorite(link)" [attr.fill]="isResourceFavorite(link) ? 'currentColor' : 'none'" [strokeWidth]="2"></svg>
                </button>
                <button type="button" (click)="copyResourceLink($event, link)" class="ui-icon-btn h-9 w-9" title="复制链接">
                  <svg lucideCopy class="h-4 w-4" [strokeWidth]="2"></svg>
                </button>
                @if (link.recommended) {
                  <span class="resource-recommended-badge ml-1">
                    <svg lucideSparkles class="h-3 w-3" [strokeWidth]="2.2"></svg>
                    {{ displayText('推荐') }}
                  </span>
                }
                <button type="button" (click)="openResource(link)" class="ui-btn-secondary ml-auto h-9 gap-2 px-3 text-xs">
                  @if (hasVerifiedDownload(link)) {
                    <svg lucideLock class="h-4 w-4" [strokeWidth]="2"></svg>
                  } @else {
                    <svg lucideExternalLink class="h-4 w-4" [strokeWidth]="2"></svg>
                  }
                  {{ displayText(resourceOpenLabel(link)) }}
                </button>
                <div class="resource-share-wrap relative">
                  <button type="button" (click)="toggleShareMenu($event, link)" class="ui-icon-btn h-9 w-9" title="分享">
                    <svg lucideShare2 class="h-4 w-4" [strokeWidth]="2"></svg>
                  </button>
                  @if (shareMenuLinkId() === link.id) {
                    <ng-container *ngTemplateOutlet="shareMenu; context: { $implicit: link }"></ng-container>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="space-y-4">
          @for (group of groupedLinks(); track group.category) {
            <div #categoryElement class="scroll-mt-6 ui-card overflow-hidden transition-[background-color,border-color,box-shadow] duration-ui ease-ui-out">
              <button
                type="button"
                (click)="toggleCategory(group.category, categoryElement)"
                class="group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/5 md:p-5"
              >
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-white/5 transition-colors group-hover:bg-white/10">
                    <ng-container [ngSwitch]="group.category">
                      <svg *ngSwitchCase="'院校展览'" lucideSchool class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'建筑资讯与媒体'" lucideBookOpen class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'项目资料'" lucideDownload class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'规范、学习与学术'" lucideLibrary class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'地图、气象与数据'" lucideMap class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'软件、插件与渲染'" lucideSettings class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'材质、配景与素材'" lucidePackageOpen class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'配色、平面与图解'" lucidePalette class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchCase="'实用工具'" lucideWrench class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                      <svg *ngSwitchDefault lucideList class="h-5 w-5 text-gray-300" [strokeWidth]="2"></svg>
                    </ng-container>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-white transition-colors group-hover:text-blue-400">{{ displayCategory(group.category) }}</h3>
                    <p class="mt-0.5 text-xs text-gray-500">{{ getCategoryDescription(group.category) }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-gray-300">{{ group.links.length }}</span>
                  <svg lucideChevronDown class="h-5 w-5 text-gray-500 transition-transform duration-300" [class.rotate-180]="isCategoryOpen(group.category)" [strokeWidth]="2"></svg>
                </div>
              </button>

              <div class="resource-panel bg-app" [class.resource-panel-open]="isCategoryOpen(group.category)">
                <div class="resource-panel-clip">
                  <div class="border-t border-white/5 p-4 md:p-6">
                    @if (group.category === '院校展览') {
                      <div class="ui-notice-info mb-6">
                        <div class="ui-notice-title">
                          <svg lucideInfo class="h-4 w-4 shrink-0 text-blue-300" [strokeWidth]="2"></svg>
                          为什么要看这些院校的作品？
                        </div>
                        <p class="ui-notice-text">
                          顶尖院校的学生作品能系统呈现从概念到方案的完整思路、批判性方法与国际教学趋势，更利于提升设计视野与方法论。
                        </p>
                      </div>
                    }

                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      @for (link of group.links; track link.id; let index = $index) {
                        @if (group.category === '项目资料' && isProjectMaterialGroupStart(group.links, index)) {
                          <div class="project-material-group-heading col-span-full">
                            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-300/10 text-amber-200">
                              <svg lucideFolder class="h-3.5 w-3.5" [strokeWidth]="2"></svg>
                            </span>
                            <span class="text-sm font-black text-white">{{ displayText(link.subcategory || '其他资料') }}</span>
                            <span class="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-gray-500">{{ projectMaterialGroupCount(group.links, link.subcategory) }}</span>
                          </div>
                        }
                        <article class="group/card ui-card ui-card-hover ui-long-list-item relative overflow-hidden" appGsapCardHover>
                          <button type="button" class="flex min-w-0 w-full cursor-pointer items-start gap-4 p-4 pr-20 text-left" (click)="openResource(link)">
                            <div class="h-14 w-20 shrink-0 overflow-hidden rounded-control border border-white/10 bg-white/5">
                              <img
                                [src]="resourceImage(link)"
                                [alt]="displayLinkAlt(link)"
                                loading="lazy"
                                decoding="async"
                                class="h-full w-full object-cover"
                                (error)="handleImageError($event)"
                              >
                            </div>
                            <div class="min-w-0 flex-1">
                              <h4 class="truncate text-sm font-bold text-white transition-colors group-hover/card:text-blue-400">{{ displayLinkTitle(link) }}</h4>
                              <p class="mt-1 line-clamp-2 text-xs text-gray-500">{{ displayLinkDescription(link) }}</p>
                              @if (visibleTags(link).length) {
                                <div class="mt-3 flex flex-wrap gap-1">
                                  @for (tag of visibleTags(link); track tag) {
                                    <span [class]="getTagClass(group.category, tag)">{{ displayText(tag) }}</span>
                                  }
                                </div>
                              }
                            </div>
                          </button>
                          <div class="absolute right-2 top-2 flex items-center gap-1">
                            @if (dataService.isAdmin()) {
                              <button type="button" (click)="requestDeleteLink(link.id)" class="ui-icon-btn h-8 w-8 text-red-500/60 hover:text-red-400" [attr.aria-label]="displayText('删除')">
                                <svg lucideX class="h-3.5 w-3.5" [strokeWidth]="2"></svg>
                              </button>
                            }
                            <button type="button" (click)="toggleFavoriteResource($event, link)" class="ui-icon-btn h-8 w-8 text-gray-500 hover:text-yellow-300" [attr.aria-label]="displayText(isResourceFavorite(link) ? '取消收藏' : '收藏资源')">
                              <svg lucideStar class="h-4 w-4" [class.text-yellow-300]="isResourceFavorite(link)" [attr.fill]="isResourceFavorite(link) ? 'currentColor' : 'none'" [strokeWidth]="2"></svg>
                            </button>
                          </div>
                          @if (link.recommended) {
                            <span class="resource-recommended-badge absolute bottom-3 right-3">
                              <svg lucideSparkles class="h-3 w-3" [strokeWidth]="2.2"></svg>
                              {{ displayText('推荐') }}
                            </span>
                          }
                        </article>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (activeResource(); as resource) {
        <div class="ui-modal-shell">
          <div class="ui-modal-backdrop" animate.enter="ui-backdrop-enter" animate.leave="ui-backdrop-leave" (click)="closeResourceFlow()"></div>
          <div appModalA11y (modalClose)="closeResourceFlow()" animate.enter="ui-modal-enter" animate.leave="ui-modal-leave" class="ui-modal-panel w-full max-w-md overflow-hidden">
            <div class="ui-modal-header block text-center">
              <p class="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/80">{{ displayCategory(resource.category) }}</p>
              <h3 class="text-lg font-bold text-white">{{ resourceFlowTitle(resource) }}</h3>
            </div>

            <div class="ui-modal-body">
              @switch (resourceFlowStep()) {
                @case ('actions') {
                  <p class="mb-4 text-sm leading-relaxed text-gray-400">{{ displayLinkDescription(resource) }}</p>
                  <div class="space-y-2.5">
                    @for (action of resource.actions ?? []; track action.id) {
                      <button type="button" (click)="chooseResourceAction(action)" class="resource-action-row group/action">
                        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-white/10 bg-white/5 text-gray-300 transition-colors group-hover/action:border-amber-400/25 group-hover/action:bg-amber-400/10 group-hover/action:text-amber-200">
                          @if (action.type === 'verified-download') {
                            <svg lucideLock class="h-4 w-4" [strokeWidth]="2"></svg>
                          } @else if (action.id === 'immersive') {
                            <svg lucideMaximize class="h-4 w-4" [strokeWidth]="2"></svg>
                          } @else {
                            <svg lucideBookOpen class="h-4 w-4" [strokeWidth]="2"></svg>
                          }
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block text-sm font-bold text-white">{{ displayText(action.label) }}</span>
                          @if (action.description) {
                            <span class="mt-0.5 block text-xs leading-relaxed text-gray-500">{{ displayText(action.description) }}</span>
                          }
                        </span>
                        <svg lucideChevronRight class="h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover/action:translate-x-0.5 group-hover/action:text-amber-300" [strokeWidth]="2"></svg>
                      </button>
                    }
                  </div>
                }
                @case ('verification') {
                  <div class="flex flex-col gap-4">
                    <div>
                      <label class="ui-label">{{ displayText('学校') }}</label>
                      <input [(ngModel)]="resourceVerificationForm().school" type="text" [placeholder]="displayText('请输入学校全称')" class="ui-field">
                    </div>
                    <div>
                      <label class="ui-label">{{ displayText('学院') }}</label>
                      <input [(ngModel)]="resourceVerificationForm().college" type="text" [placeholder]="displayText('请输入学院全称')" class="ui-field">
                    </div>
                    <div>
                      <label class="ui-label">{{ displayText('专业') }}</label>
                      <input [(ngModel)]="resourceVerificationForm().major" type="text" [placeholder]="displayText('请输入专业全称')" class="ui-field">
                    </div>
                    <div>
                      <label class="ui-label">{{ displayText('学号') }}</label>
                      <input [(ngModel)]="resourceVerificationForm().studentId" type="text" [placeholder]="displayText('请输入学号')" class="ui-field">
                    </div>
                    @if (resourceVerificationStatus() !== 'idle' && resourceVerificationMessage()) {
                      <div class="rounded-control border bg-white/5 p-2 text-center text-sm font-medium"
                        [class.text-green-400]="resourceVerificationStatus() === 'success'"
                        [class.border-green-500/30]="resourceVerificationStatus() === 'success'"
                        [class.text-red-400]="resourceVerificationStatus() === 'error'"
                        [class.border-red-500/30]="resourceVerificationStatus() === 'error'"
                        role="status"
                        aria-live="polite"
                      >
                        {{ displayText(resourceVerificationMessage()) }}
                      </div>
                    }
                  </div>
                }
                @case ('declaration') {
                  <div class="max-h-[50vh] space-y-4 overflow-y-auto pr-2 text-sm leading-relaxed text-gray-300 custom-scrollbar">
                    <p><strong class="text-white">{{ displayText('本人确认：') }}</strong><br>{{ resourceStudentDeclarationLine() }}</p>
                    <p><strong class="text-white">{{ displayText('本人已知晓：') }}</strong><br>{{ displayText(resourceUsageNotice()) }}</p>
                    <p><strong class="text-white">{{ displayText('本人承诺：') }}</strong><br>{{ displayText(resourceUsagePromise()) }}</p>
                    <p>{{ displayText(resourceLiabilityNotice()) }}</p>
                  </div>
                }
                @case ('download') {
                  <div class="flex flex-col items-center py-3 text-center">
                    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                      <svg lucideCheckCircle class="h-7 w-7" [strokeWidth]="1.8"></svg>
                    </div>
                    <h4 class="text-base font-bold text-white">{{ displayText('身份验证与使用声明已完成') }}</h4>
                    <p class="mt-2 max-w-sm text-sm leading-relaxed text-gray-400">{{ displayText(resourceDownloadDescription()) }}</p>
                  </div>
                }
              }
            </div>

            <div class="ui-modal-footer">
              @switch (resourceFlowStep()) {
                @case ('actions') {
                  <button type="button" (click)="closeResourceFlow()" class="ui-btn-secondary">{{ displayText('关闭') }}</button>
                }
                @case ('verification') {
                  <button type="button" (click)="closeResourceFlow()" class="ui-btn-ghost">{{ displayText('取消') }}</button>
                  <button type="button" (click)="handleResourceVerification()" [disabled]="resourceVerificationStatus() === 'verifying'" class="ui-btn-primary">
                    {{ resourceVerificationStatus() === 'verifying' ? displayText('核验中...') : displayText('核验') }}
                  </button>
                }
                @case ('declaration') {
                  <button type="button" (click)="goToResourceDownloadStep()" [disabled]="resourceDeclarationCountdown() > 0" class="ui-btn-primary">
                    {{ resourceDeclarationCountdown() > 0 ? resourceWaitCountdown() : displayText('确认并继续') }}
                  </button>
                }
                @case ('download') {
                  <button type="button" (click)="closeResourceFlow()" class="ui-btn-ghost">{{ displayText('取消') }}</button>
                  <button type="button" (click)="openVerifiedResourceDownload()" class="ui-btn-primary">
                    <svg lucideExternalLink class="h-4 w-4" [strokeWidth]="2"></svg>
                    {{ displayText(resourceDownloadButtonLabel()) }}
                  </button>
                }
              }
            </div>
          </div>
        </div>
      }

      @if (pendingDeleteLink(); as linkToDelete) {
        <div class="ui-modal-shell">
          <div class="ui-modal-backdrop" animate.enter="ui-backdrop-enter" animate.leave="ui-backdrop-leave" (click)="cancelDeleteLink()"></div>
          <div appModalA11y (modalClose)="cancelDeleteLink()" animate.enter="ui-modal-enter" animate.leave="ui-modal-leave" class="ui-modal-panel max-w-sm p-6">
            <div class="flex flex-col items-center text-center">
              <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <svg lucideAlertTriangle class="h-6 w-6 text-red-400" [strokeWidth]="2"></svg>
              </div>
              <h3 class="text-lg font-bold text-white">删除资源</h3>
              <p class="mt-3 text-sm leading-relaxed text-gray-400">
                确定要删除“<span class="font-semibold text-white">{{ linkToDelete.title }}</span>”吗？此操作不可恢复。
              </p>
              <div class="mt-6 flex w-full gap-3">
                <button (click)="cancelDeleteLink()" class="ui-btn-secondary flex-1">取消</button>
                <button (click)="confirmDeleteLink()" class="ui-btn-danger flex-1">确认删除</button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (dataService.isAdmin() && collection === 'resources') {
        <div class="ui-card mt-8 p-6">
          <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <span class="h-2 w-2 rounded-full bg-blue-500"></span>
            添加新资源
          </h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="ui-label mb-1 block">分类</label>
              <input [(ngModel)]="newCategory" placeholder="例如: 建筑资讯" class="ui-field">
            </div>
            <div>
              <label class="ui-label mb-1 block">网站名称</label>
              <input [(ngModel)]="newTitle" placeholder="例如：ArchDaily" class="ui-field">
            </div>
            <div class="md:col-span-2">
              <label class="ui-label mb-1 block">URL</label>
              <input [(ngModel)]="newUrl" placeholder="https://..." class="ui-field">
            </div>
            <div class="md:col-span-2">
              <label class="ui-label mb-1 block">简短描述</label>
              <input [(ngModel)]="newDesc" placeholder="网站的一句话介绍" class="ui-field">
            </div>
          </div>
          <button (click)="addLink()" class="ui-btn-accent mt-6 w-full">添加资源</button>
        </div>
      }

      <ng-template #shareMenu let-link>
        <div animate.enter="ui-popover-enter" animate.leave="ui-popover-leave" (click)="$event.stopPropagation()" class="resource-share-menu absolute bottom-full right-0 z-40 mb-3 flex w-56 flex-col overflow-hidden rounded-card border border-white/10 bg-surface shadow-panel">
          @if (shareMenuNotice()) {
            <div class="border-b border-green-500/20 bg-green-500/10 py-1.5 text-center text-[10px] font-bold text-green-400" role="status" aria-live="polite">
              {{ shareMenuNotice() }}
            </div>
          }
          <div class="flex flex-col gap-1 p-1.5">
            <button type="button" (click)="shareResourceCard(link)" class="resource-menu-item" [disabled]="isGeneratingCard()">生成分享图像</button>
            <div class="my-1 h-px bg-white/10"></div>
            <button type="button" (click)="copyResourceShareText($event, link)" class="resource-menu-item">复制分享文案</button>
          </div>
        </div>
      </ng-template>
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
    .project-material-group-heading {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      border-bottom: 1px solid rgba(251, 191, 36, 0.12);
      padding: 0.35rem 0.15rem 0.6rem;
    }
    .resource-recommended-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.22rem;
      border: 1px solid rgba(251, 191, 36, 0.34);
      border-radius: 9999px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(251, 191, 36, 0.09));
      padding: 0.25rem 0.45rem;
      color: rgb(253 230 138);
      font-size: 0.6rem;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.04em;
      box-shadow: 0 5px 14px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(10px);
      white-space: nowrap;
    }
    .resource-action-row {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.025);
      padding: 0.75rem;
      text-align: left;
      transition:
        transform var(--duration-press) var(--ease-out),
        border-color var(--duration-fast) var(--ease-out),
        background-color var(--duration-fast) var(--ease-out);
    }
    .resource-action-row:active {
      transform: scale(0.985);
    }
    @media (hover: hover) and (pointer: fine) {
      .resource-action-row:hover {
        border-color: rgba(251, 191, 36, 0.22);
        background: rgba(251, 191, 36, 0.045);
      }
    }
    .resource-panel {
      display: grid;
      grid-template-rows: 0fr;
      opacity: 0;
      overflow: hidden;
      transition:
        grid-template-rows 240ms var(--ease-in-out),
        opacity 180ms var(--ease-out);
    }
    .resource-panel-open {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    .resource-panel-clip {
      min-height: 0;
      overflow: hidden;
    }
    .resource-menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-size: 0.875rem;
      color: rgb(209 213 219);
      transition:
        transform var(--duration-press) var(--ease-out),
        background-color var(--duration-fast) var(--ease-out),
        color var(--duration-fast) var(--ease-out);
    }
    .resource-menu-item:active {
      transform: scale(0.97);
    }
    @media (hover: hover) and (pointer: fine) {
      .resource-menu-item:hover {
        background: rgba(255, 255, 255, 0.06);
        color: white;
      }
    }
    .resource-menu-item:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @media (prefers-reduced-motion: reduce) {
      .resource-panel {
        transition: none;
      }
    }
  `]
})
export class ResourcesComponent implements OnDestroy {
  dataService = inject(DataService);
  locale = inject(LocaleService);
  private shareCardService = inject(ShareCardService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly collection = (this.route.snapshot.data['collection'] as ResourceCollection | undefined) ?? 'resources';

  newCategory = signal('');
  newTitle = signal('');
  newUrl = signal('');
  newDesc = signal('');
  expandedCategory = signal<string | null>(null);
  searchQuery = signal('');
  selectedCardCategory = signal('全部');
  selectedProjectMaterialGroup = signal('全部');
  pendingDeleteLinkId = signal<string | null>(null);
  shareMenuLinkId = signal<string | null>(null);
  shareMenuNotice = signal('');
  isGeneratingCard = signal(false);
  resourceFlowStep = signal<'closed' | 'actions' | 'verification' | 'declaration' | 'download'>('closed');
  activeResource = signal<Link | null>(null);
  activeDownloadAction = signal<ResourceAction | null>(null);
  resourceVerificationForm = signal(createEmptyStudentVerificationForm());
  resourceVerificationStatus = signal<'idle' | 'verifying' | 'success' | 'error'>('idle');
  resourceVerificationMessage = signal('');
  resourceDeclarationCountdown = signal(0);

  pendingDeleteLink = computed(() => {
    const id = this.pendingDeleteLinkId();
    return id ? this.dataService.webLinks().find(link => link.id === id) ?? null : null;
  });

  viewMode = computed(() => this.collection === 'inspiration'
    ? this.dataService.inspirationViewMode()
    : this.dataService.resourcesViewMode());

  private pendingCategoryScrollFrame: number | null = null;
  private pendingCategoryScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private shareResetTimer: ReturnType<typeof setTimeout> | null = null;
  private resourceVerificationTimer: ReturnType<typeof setTimeout> | null = null;
  private resourceDeclarationTimer: ReturnType<typeof setTimeout> | null = null;
  private resourceCountdownInterval: ReturnType<typeof setInterval> | null = null;
  private readonly categoryScrollOffset = 24;
  private readonly categoryPanelTransitionMs = 330;
  private readonly resourceCategoryOrder = [
    '规范、学习与学术',
    '地图、气象与数据',
    '软件、插件与渲染',
    '材质、配景与素材',
    '配色、平面与图解',
    '实用工具'
  ];
  private readonly inspirationCategoryOrder = ['院校展览', '建筑资讯与媒体', '项目资料'];
  private readonly projectMaterialGroupOrder = ['规划与导则', '建筑构造与技术', '事务所与项目案例', '考研与快题', '表达与申请', '其他资料'];

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const resourceId = params.get('resource');
      if (!resourceId) return;
      const link = this.dataService.webLinks().find(item => item.id === resourceId);
      if (link) {
        const targetCollection = this.dataService.getResourceCollection(link);
        if (targetCollection !== this.collection) {
          void this.router.navigate([targetCollection === 'inspiration' ? '/inspiration' : '/resources'], {
            queryParams: { resource: resourceId },
            replaceUrl: true
          });
          return;
        }
        this.setViewMode('cards');
        this.selectedCardCategory.set(link.category);
        this.selectedProjectMaterialGroup.set(link.category === '项目资料' ? link.subcategory ?? '其他资料' : '全部');
        if (link.actions?.length) this.openResource(link);
      }
    });
  }

  filteredLinks = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.dataService.webLinks().filter(link => {
      if (this.dataService.getResourceCollection(link) !== this.collection) return false;
      if (!q) return true;
      const haystack = [
        link.title,
        this.displayLinkTitle(link),
        link.description,
        this.displayLinkDescription(link),
        link.category,
        this.displayCategory(link.category),
        link.subcategory ?? '',
        this.displayText(link.subcategory),
        ...(link.tags ?? []),
        ...(link.featuredTags ?? []),
        ...(link.actions ?? []).flatMap(action => [action.label, action.description ?? '']),
        ...this.locale.translateList(link.tags ?? []),
        ...this.locale.translateList(link.featuredTags ?? []),
        ...this.locale.translateList((link.actions ?? []).flatMap(action => [action.label, action.description ?? '']))
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  });

  groupedLinks = computed(() => {
    const map = new Map<string, Link[]>();
    for (const link of this.filteredLinks()) {
      const category = link.category || '未分类';
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(link);
    }

    const groups = Array.from(map.entries()).map(([category, links]) => ({
      category,
      links: category === '项目资料' ? this.sortProjectMaterialLinks(links) : links
    }));
    return groups.sort((a, b) => {
      const categoryOrder = this.collection === 'inspiration' ? this.inspirationCategoryOrder : this.resourceCategoryOrder;
      const idxA = categoryOrder.indexOf(a.category);
      const idxB = categoryOrder.indexOf(b.category);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  });

  projectMaterialLinks = computed(() => this.sortProjectMaterialLinks(
    this.filteredLinks().filter(link => link.category === '项目资料')
  ));

  projectMaterialGroups = computed(() => {
    const groups = new Map<string, Link[]>();
    for (const link of this.projectMaterialLinks()) {
      const name = link.subcategory ?? '其他资料';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push(link);
    }
    return this.projectMaterialGroupOrder
      .filter(name => groups.has(name))
      .map(name => ({ name, links: groups.get(name)! }));
  });

  cardLinks = computed(() => {
    const category = this.selectedCardCategory();
    const links = this.filteredLinks();
    if (category === '全部') return links;
    const categoryLinks = links.filter(link => link.category === category);
    if (category !== '项目资料' || this.selectedProjectMaterialGroup() === '全部') {
      return category === '项目资料' ? this.sortProjectMaterialLinks(categoryLinks) : categoryLinks;
    }
    return this.sortProjectMaterialLinks(categoryLinks.filter(link => link.subcategory === this.selectedProjectMaterialGroup()));
  });

  selectCardCategory(category: string) {
    this.selectedCardCategory.set(category);
    if (category !== '项目资料') this.selectedProjectMaterialGroup.set('全部');
  }

  private sortProjectMaterialLinks(links: Link[]): Link[] {
    return [...links].sort((a, b) => {
      const groupA = this.projectMaterialGroupOrder.indexOf(a.subcategory ?? '其他资料');
      const groupB = this.projectMaterialGroupOrder.indexOf(b.subcategory ?? '其他资料');
      return (groupA === -1 ? 999 : groupA) - (groupB === -1 ? 999 : groupB);
    });
  }

  isProjectMaterialGroupStart(links: Link[], index: number): boolean {
    if (index === 0) return true;
    return (links[index - 1].subcategory ?? '其他资料') !== (links[index].subcategory ?? '其他资料');
  }

  projectMaterialGroupCount(links: Link[], subcategory?: string): number {
    const group = subcategory ?? '其他资料';
    return links.filter(link => (link.subcategory ?? '其他资料') === group).length;
  }

  switchView(mode: 'list' | 'cards') {
    this.setViewMode(mode);
    this.closeShareMenu();
  }

  private setViewMode(mode: 'list' | 'cards') {
    if (this.collection === 'inspiration') {
      this.dataService.inspirationViewMode.set(mode);
    } else {
      this.dataService.resourcesViewMode.set(mode);
    }
  }

  pageTitle(): string {
    return this.collection === 'inspiration' ? '灵感库' : '设计资源库';
  }

  pageSubtitle(): string {
    return this.collection === 'inspiration'
      ? '汇集院校作品、建筑媒体与经验证获取的项目资料'
      : '为建筑学习者精选的工具、数据与学习资源';
  }

  searchPlaceholder(): string {
    return this.collection === 'inspiration' ? '搜索灵感与项目资料...' : '搜索资源...';
  }

  isCategoryOpen(category: string): boolean {
    return this.expandedCategory() === category || !!this.searchQuery();
  }

  toggleCategory(category: string, element?: HTMLElement) {
    const isExpanding = this.expandedCategory() !== category;
    this.cancelPendingCategoryScroll();
    this.closeShareMenu();

    if (!isExpanding) {
      this.expandedCategory.set(null);
      return;
    }

    this.expandedCategory.set(category);
    if (element && !this.searchQuery()) {
      const container = this.findScrollContainer(element);
      if (container) {
        this.scrollCategoryIntoViewAfterLayoutSettles(element, container);
      }
    }
  }

  openResource(link: Link) {
    this.dataService.addHistoryItem('resource', link.id);
    if (link.actions?.length) {
      this.closeResourceFlow();
      this.activeResource.set(link);
      if (link.actions.length === 1 && link.actions[0].type === 'verified-download') {
        this.chooseResourceAction(link.actions[0]);
        return;
      }
      this.resourceFlowStep.set('actions');
      return;
    }
    this.dataService.openExternalModal(link.url);
  }

  chooseResourceAction(action: ResourceAction) {
    if (action.type === 'external') {
      this.closeResourceFlow();
      this.dataService.openExternalModal(action.url);
      return;
    }

    this.activeDownloadAction.set(action);
    this.resourceVerificationForm.set(createEmptyStudentVerificationForm());
    this.resourceVerificationStatus.set('idle');
    this.resourceVerificationMessage.set('');
    this.resourceFlowStep.set('verification');
  }

  closeResourceFlow() {
    this.clearResourceFlowTimers();
    this.resourceFlowStep.set('closed');
    this.activeResource.set(null);
    this.activeDownloadAction.set(null);
    this.resourceVerificationStatus.set('idle');
    this.resourceVerificationMessage.set('');
    this.resourceDeclarationCountdown.set(0);
  }

  resourceFlowTitle(resource: Link): string {
    switch (this.resourceFlowStep()) {
      case 'actions':
        return this.displayLinkTitle(resource);
      case 'verification':
        return this.displayText('学生身份验证');
      case 'declaration':
        return this.displayText(this.isProjectMaterialDownload() ? '项目资料使用声明' : '项目册使用声明');
      case 'download':
        return this.displayText(this.isProjectMaterialDownload() ? '获取项目资料' : '获取项目册 PDF');
      default:
        return '';
    }
  }

  resourceStudentDeclarationLine(): string {
    const form = this.resourceVerificationForm();
    if (this.locale.isEnglish()) {
      return `I am a Ningxia University School of Architecture student majoring in ${this.displayText(form.major)}. Student ID: ${form.studentId}.`;
    }
    return `本人为宁夏大学建筑学院${form.major}专业学生，学号 ${form.studentId}。`;
  }

  resourceWaitCountdown(): string {
    return this.locale.isEnglish()
      ? `Please wait ${this.resourceDeclarationCountdown()}s`
      : `请等待 ${this.resourceDeclarationCountdown()}s`;
  }

  isProjectMaterialDownload(): boolean {
    const action = this.activeDownloadAction();
    return action?.type === 'verified-download' && action.policy === 'project-material';
  }

  resourceUsageNotice(): string {
    return this.isProjectMaterialDownload()
      ? '本项目资料仅供宁夏大学建筑学院校内教学与个人学习使用，应尊重原作者及资料权利人的版权，不具备公开传播、商业使用或二次分发授权。'
      : 'NUS IDEK 项目册 PDF 仅供宁夏大学建筑学院校内教学与个人学习使用，不具备对外传播、商业使用或二次分发授权。';
  }

  resourceUsagePromise(): string {
    return this.isProjectMaterialDownload()
      ? '不公开分享、转卖、商业使用或以其他方式再次分发本项目资料。'
      : '不公开分享、转卖、商业使用或以其他方式再次分发该项目册。';
  }

  resourceLiabilityNotice(): string {
    return this.isProjectMaterialDownload()
      ? '若因本人违反上述约定或资料权利人的使用要求而产生任何版权纠纷或法律责任，均由本人自行承担，与平台及资源整理方无关。'
      : '若因本人违反上述约定而产生任何版权纠纷或法律责任，均由本人自行承担，与平台及资源整理方无关。';
  }

  resourceDownloadDescription(): string {
    const action = this.activeDownloadAction();
    if (action?.type === 'verified-download' && action.provider === 'baidu-pan') {
      return '点击下方按钮将在新标签页打开百度网盘页面，提取码已包含在链接中。';
    }
    return '点击下方按钮将在新标签页打开 Dropbox 项目册页面，您可在该页面预览或下载 PDF。';
  }

  resourceDownloadButtonLabel(): string {
    const action = this.activeDownloadAction();
    return action?.type === 'verified-download' && action.provider === 'baidu-pan'
      ? '打开百度网盘下载页'
      : '打开 Dropbox 下载页';
  }

  handleResourceVerification() {
    if (this.resourceVerificationStatus() === 'verifying') return;
    const verification = validateStudentResourceIdentity(this.resourceVerificationForm());

    if (verification.result === 'incomplete') {
      this.resourceVerificationStatus.set('error');
      this.resourceVerificationMessage.set('请填写所有必填项。');
      return;
    }

    if (verification.result !== 'valid') {
      this.resourceVerificationStatus.set('error');
      this.resourceVerificationMessage.set('身份信息核验未通过，请确认填写信息。');
      return;
    }

    this.resourceVerificationForm.set(verification.normalized);
    this.resourceVerificationStatus.set('verifying');
    this.clearResourceVerificationTimers();
    this.resourceVerificationTimer = setTimeout(() => {
      this.resourceVerificationTimer = null;
      if (this.resourceFlowStep() !== 'verification') return;
      this.resourceVerificationStatus.set('success');
      this.resourceVerificationMessage.set('验证成功！');
      this.resourceDeclarationTimer = setTimeout(() => {
        this.resourceDeclarationTimer = null;
        if (this.resourceFlowStep() !== 'verification') return;
        this.resourceFlowStep.set('declaration');
        this.startResourceDeclarationCountdown();
      }, 800);
    }, 1500);
  }

  goToResourceDownloadStep() {
    if (this.resourceDeclarationCountdown() > 0) return;
    const verification = validateStudentResourceIdentity(this.resourceVerificationForm());
    if (verification.result !== 'valid' || !this.activeDownloadAction()) {
      this.resourceFlowStep.set('verification');
      this.resourceVerificationStatus.set('error');
      this.resourceVerificationMessage.set('身份信息核验未通过，请确认填写信息。');
      return;
    }
    this.clearResourceCountdown();
    this.resourceFlowStep.set('download');
  }

  openVerifiedResourceDownload() {
    const action = this.activeDownloadAction();
    if (!action || validateStudentResourceIdentity(this.resourceVerificationForm()).result !== 'valid') {
      this.resourceFlowStep.set('verification');
      this.resourceVerificationStatus.set('error');
      this.resourceVerificationMessage.set('身份信息核验未通过，请确认填写信息。');
      return;
    }

    const url = action.url;
    this.closeResourceFlow();
    this.dataService.openExternalModal(url);
  }

  private startResourceDeclarationCountdown() {
    this.clearResourceCountdown();
    this.resourceDeclarationCountdown.set(5);
    this.resourceCountdownInterval = setInterval(() => {
      const current = this.resourceDeclarationCountdown();
      if (current <= 1) {
        this.resourceDeclarationCountdown.set(0);
        this.clearResourceCountdown();
        return;
      }
      this.resourceDeclarationCountdown.set(current - 1);
    }, 1000);
  }

  private clearResourceVerificationTimers() {
    if (this.resourceVerificationTimer) clearTimeout(this.resourceVerificationTimer);
    if (this.resourceDeclarationTimer) clearTimeout(this.resourceDeclarationTimer);
    this.resourceVerificationTimer = null;
    this.resourceDeclarationTimer = null;
  }

  private clearResourceCountdown() {
    if (this.resourceCountdownInterval) clearInterval(this.resourceCountdownInterval);
    this.resourceCountdownInterval = null;
  }

  private clearResourceFlowTimers() {
    this.clearResourceVerificationTimers();
    this.clearResourceCountdown();
  }

  resourceImage(link: Link): string {
    return this.dataService.getResourcePreview(link);
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/images/resources/default.webp';
  }

  visibleTags(link: Link): string[] {
    return (link.featuredTags?.length ? link.featuredTags : link.tags ?? []).slice(0, 4);
  }

  hasVerifiedDownload(link: Link): boolean {
    return link.actions?.some(action => action.type === 'verified-download') ?? false;
  }

  resourceOpenLabel(link: Link): string {
    if (link.actions?.length === 1 && link.actions[0].type === 'verified-download') return '验证获取';
    if (link.actions?.length) return '查看入口';
    return '打开';
  }

  displayText(value: string | null | undefined, fallback?: string): string {
    return this.locale.translateData(value, fallback);
  }

  displayCategory(category: string): string {
    return this.displayText(category);
  }

  displayCardCategory(link: Link): string {
    return this.displayText(link.category === '项目资料' ? link.subcategory ?? link.category : link.category);
  }

  displayLinkTitle(link: Link): string {
    const translated = this.displayText(link.title);
    if (!this.locale.isEnglish() || !this.locale.hasCjk(translated)) return translated;
    return link.title.replace(/（(.+?)）/g, '').replace(/\s*\(.+?\)\s*$/, '').trim() || 'Architecture Resource';
  }

  displayLinkDescription(link: Link): string {
    const category = this.displayCategory(link.category).toLowerCase();
    const fallback = `A curated ${category} resource for architecture study, reference gathering, and design workflow support.`;
    return this.displayText(link.description, fallback);
  }

  displayLinkAlt(link: Link): string {
    return this.displayText(link.imageAlt || link.title, `${this.displayLinkTitle(link)} preview`);
  }

  isResourceFavorite(link: Link): boolean {
    return this.dataService.favoriteItems().some(item => item.kind === 'resource' && item.id === link.id);
  }

  toggleFavoriteResource(event: MouseEvent, link: Link) {
    event.preventDefault();
    event.stopPropagation();
    this.dataService.toggleFavoriteItem('resource', link.id);
    this.dataService.displayToast(this.isResourceFavorite(link) ? '资源已收藏' : '已取消收藏');
  }

  async copyResourceLink(event: MouseEvent, link: Link) {
    event.preventDefault();
    event.stopPropagation();
    const linkToCopy = this.hasVerifiedDownload(link) ? this.getResourceShareUrl(link) : link.url;
    await this.copyText(linkToCopy, '资源链接已复制');
  }

  toggleShareMenu(event: MouseEvent, link: Link) {
    event.preventDefault();
    event.stopPropagation();
    this.shareMenuLinkId.update(id => id === link.id ? null : link.id);
  }

  closeShareMenu() {
    this.shareMenuLinkId.set(null);
    this.shareMenuNotice.set('');
  }

  async copyResourceShareText(event: MouseEvent, link: Link) {
    event.preventDefault();
    event.stopPropagation();
    await this.copyText(this.getResourceShareText(link), '分享文案已复制');
    this.setShareMenuNotice('已复制分享文案');
  }

  async shareResourceCard(link: Link) {
    if (this.isGeneratingCard()) return;
    this.isGeneratingCard.set(true);
    try {
      const blob = await this.shareCardService.generateResourceCard(link, this.getResourceShareUrl(link));
      const result = await this.shareCardService.shareOrDownload(blob, `archipedia-resource-${link.id}.png`, link.title);
      if (result === 'downloaded') this.dataService.displayToast('资源分享卡片已下载');
    } catch (error) {
      console.error(error);
      this.dataService.displayToast('资源分享卡片生成失败，请稍后重试');
    } finally {
      this.isGeneratingCard.set(false);
    }
  }

  addLink() {
    if (this.newTitle() && this.newUrl() && this.newCategory()) {
      const id = Date.now().toString();
      this.dataService.addLink({
        id,
        collection: this.collection,
        category: this.newCategory(),
        title: this.newTitle(),
        url: this.newUrl(),
        description: this.newDesc() || '暂无描述',
        imageUrl: '/images/resources/default.webp',
        imageAlt: `${this.newTitle()} 资源预览`,
        previewSourceUrl: this.newUrl()
      });
      this.newTitle.set('');
      this.newUrl.set('');
      this.newDesc.set('');
    }
  }

  requestDeleteLink(id: string) {
    this.pendingDeleteLinkId.set(id);
  }

  cancelDeleteLink() {
    this.pendingDeleteLinkId.set(null);
  }

  confirmDeleteLink() {
    const link = this.pendingDeleteLink();
    if (!link) return;

    this.dataService.removeLink(link.id);
    this.pendingDeleteLinkId.set(null);
    this.dataService.displayToast('资源已删除');
  }

  getResourceMark(title: string): string {
    const trimmed = title.trim();
    const cjk = trimmed.match(/[\u3400-\u9fff]/u)?.[0];
    if (cjk) return cjk;

    const latin = trimmed.match(/[A-Za-z0-9]/)?.[0];
    return latin ? latin.toUpperCase() : '#';
  }

  getTagClass(category: string, tag: string): string {
    const baseClasses = 'text-[10px] px-2 py-0.5 rounded backdrop-blur-sm border transition-[background-color,border-color,color,opacity] duration-fast ease-ui-out font-medium tracking-wide';
    const tagColors: Record<string, string> = {
      '环境': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
      '材质': 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
      '模型': 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
      '人物': 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
      '配景': 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20',
      '尺寸': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20',
      '素材': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
      '剪影': 'bg-zinc-500/30 text-zinc-300 border-zinc-500/20 hover:bg-zinc-500/40'
    };

    if (category === '材质、配景与素材') {
      return `${baseClasses} ${tagColors[tag] || 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/15'}`;
    }

    return `${baseClasses} bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-300`;
  }

  getCategoryDescription(category: string): string {
    const descriptions: Record<string, readonly [string, string]> = {
      '院校展览': ['全球建筑院校优秀作品展', 'Top academic showcases from around the globe'],
      '建筑资讯与媒体': ['精选建筑数字出版与资讯', 'Leading digital publications and news'],
      '项目资料': ['经学生身份验证获取的项目与学习资料', 'Project and study materials available after student verification'],
      '规范、学习与学术': ['建筑规范、学习与学术参考', 'Building regulations and academic references'],
      '地图、气象与数据': ['地图、气象与城市数据', 'Mapping, weather, and urban datasets'],
      '软件、插件与渲染': ['建筑软件、插件与可视化工具', 'Software, plugins, and visualization tools'],
      '材质、配景与素材': ['材质、配景与视觉素材', 'Textures, entourage, and visual assets'],
      '配色、平面与图解': ['精选配色与图解参考', 'Curated palettes and diagram references'],
      '实用工具': ['日常工作流实用工具', 'Everyday workflow utilities']
    };
    const description = descriptions[category] ?? ['精选建筑资源', 'Curated architecture resources'];
    return description[this.locale.isEnglish() ? 1 : 0];
  }

  private getResourceShareText(link: Link): string {
    return [
      `我在 ARCHIPEDIA.top 发现了这个建筑资源：${link.title}`,
      link.description,
      `打开：${this.getResourceShareUrl(link)}`
    ].filter(Boolean).join('\n');
  }

  private getResourceShareUrl(link: Link): string {
    const route = this.dataService.getResourceCollection(link) === 'inspiration' ? 'inspiration' : 'resources';
    return `${window.location.origin}${window.location.pathname}#/${route}?resource=${encodeURIComponent(link.id)}`;
  }

  private async copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.dataService.displayToast(successMessage);
    } catch {
      this.copyTextWithSelection(text);
    }
  }

  private copyTextWithSelection(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.dataService.displayToast('内容已复制');
  }

  private setShareMenuNotice(message: string) {
    this.shareMenuNotice.set(message);
    if (this.shareResetTimer) clearTimeout(this.shareResetTimer);
    this.shareResetTimer = setTimeout(() => {
      this.shareResetTimer = null;
      this.shareMenuNotice.set('');
    }, 2000);
  }

  private findScrollContainer(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;

    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }

    return null;
  }

  private scrollCategoryIntoViewAfterLayoutSettles(element: HTMLElement, container: HTMLElement) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReducedMotion ? 0 : this.categoryPanelTransitionMs;

    this.pendingCategoryScrollTimer = window.setTimeout(() => {
      this.pendingCategoryScrollTimer = null;
      this.pendingCategoryScrollFrame = window.requestAnimationFrame(() => {
        this.pendingCategoryScrollFrame = null;
        this.alignCategoryWithViewportTop(element, container, prefersReducedMotion ? 'auto' : 'smooth');
      });
    }, delay);
  }

  private alignCategoryWithViewportTop(element: HTMLElement, container: HTMLElement, behavior: ScrollBehavior) {
    if (!element.isConnected || !container.isConnected) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const rawTop = elementRect.top - containerRect.top + container.scrollTop - this.categoryScrollOffset;
    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const top = Math.min(Math.max(rawTop, 0), maxTop);

    container.scrollTo({ top, behavior });
  }

  private cancelPendingCategoryScroll() {
    if (this.pendingCategoryScrollFrame !== null) {
      window.cancelAnimationFrame(this.pendingCategoryScrollFrame);
      this.pendingCategoryScrollFrame = null;
    }

    if (this.pendingCategoryScrollTimer !== null) {
      window.clearTimeout(this.pendingCategoryScrollTimer);
      this.pendingCategoryScrollTimer = null;
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.activeResource()) {
      this.closeResourceFlow();
      return;
    }
    if (this.shareMenuLinkId()) {
      this.closeShareMenu();
      return;
    }
    if (this.pendingDeleteLink()) {
      this.cancelDeleteLink();
    }
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.shareMenuLinkId()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.resource-share-wrap')) return;
    this.closeShareMenu();
  }

  ngOnDestroy() {
    this.cancelPendingCategoryScroll();
    this.clearResourceFlowTimers();
    if (this.shareResetTimer) {
      clearTimeout(this.shareResetTimer);
      this.shareResetTimer = null;
    }
  }
}
