import { Component, signal } from '@angular/core';
import { APP_UI_ICONS } from '../shared/ui-icons';

interface ServiceItem {
  title: string;
  price: string;
  description: string;
  image: string;
  note?: string;
}

interface ServiceGroup {
  title: string;
  eyebrow: string;
  summary: string;
  items: ServiceItem[];
}

@Component({
  selector: 'app-resource-services',
  imports: [...APP_UI_ICONS],
  template: `
    <div class="ui-page ui-page-pad text-white">
      <header class="mx-auto flex w-full max-w-7xl flex-col items-center text-center">
        <p class="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-blue-300/70">Resource Services</p>
        <h1 class="ui-title">资源服务</h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400 md:text-base">
          场地资料、地图数据与气象分析图的第三方咨询入口，适合课程设计、竞赛前期调研与方案表达准备。
        </p>
      </header>

      <main class="mx-auto mt-10 grid w-full max-w-7xl gap-8 xl:grid-cols-[1fr_22rem]">
        <section class="space-y-8">
          @for (group of serviceGroups; track group.title) {
            <section class="space-y-4">
              <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.22em] text-blue-300/60">{{ group.eyebrow }}</p>
                  <h2 class="mt-1 text-2xl font-black text-white">{{ group.title }}</h2>
                </div>
                <p class="max-w-xl text-sm leading-relaxed text-gray-500">{{ group.summary }}</p>
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @for (item of group.items; track item.title) {
                  <article class="service-card group overflow-hidden rounded-card border border-line-soft bg-surface/80 shadow-panel transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.055]">
                    <div class="relative aspect-[16/10] overflow-hidden bg-white/5">
                      <img
                        [src]="item.image"
                        [alt]="item.title + '示意图'"
                        loading="lazy"
                        decoding="async"
                        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                      >
                      <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>
                      <div class="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                        {{ item.price }}
                      </div>
                    </div>
                    <div class="p-4">
                      <h3 class="text-base font-black text-white">{{ item.title }}</h3>
                      <p class="mt-2 min-h-[3.25rem] text-sm leading-relaxed text-gray-400">{{ item.description }}</p>
                      @if (item.note) {
                        <p class="mt-3 rounded-control border border-amber-400/15 bg-amber-400/5 px-3 py-2 text-xs leading-relaxed text-amber-100/80">
                          {{ item.note }}
                        </p>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>
          }
        </section>

        <aside class="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section class="rounded-card border border-blue-400/20 bg-blue-500/10 p-5 shadow-panel">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-blue-300/20 bg-blue-400/10 text-blue-200">
                <svg lucideMail class="h-5 w-5" [strokeWidth]="2"></svg>
              </div>
              <div>
                <h2 class="text-lg font-black text-white">服务咨询</h2>
                <p class="mt-1 text-sm leading-relaxed text-blue-100/70">添加微信咨询具体范围、价格与交付方式。</p>
              </div>
            </div>

            <div class="mt-5 overflow-hidden rounded-control border border-white/10 bg-white p-3">
              <img src="/images/services/wechat-qr.png" alt="服务咨询微信二维码" class="mx-auto aspect-square w-full max-w-56 object-contain">
            </div>

            <div class="mt-4 rounded-control border border-white/10 bg-black/20 p-3">
              <p class="text-xs text-gray-500">微信号</p>
              <div class="mt-1 flex items-center justify-between gap-3">
                <span class="font-mono text-sm font-bold text-white">AllDesignEverything</span>
                <button type="button" class="ui-btn-secondary px-3 py-2 text-xs" (click)="copyWechat()">
                  <svg lucideCopy class="h-4 w-4" [strokeWidth]="2"></svg>
                  复制
                </button>
              </div>
            </div>

            @if (copied()) {
              <p class="mt-3 rounded-control bg-emerald-400/10 px-3 py-2 text-center text-xs font-semibold text-emerald-200">微信号已复制</p>
            }
          </section>

          <section class="rounded-card border border-line-soft bg-surface/80 p-5 shadow-panel">
            <div class="mb-3 flex items-center gap-2 text-amber-200">
              <svg lucideAlertTriangle class="h-5 w-5" [strokeWidth]="2"></svg>
              <h2 class="text-base font-black text-white">免责声明</h2>
            </div>
            <div class="space-y-3 text-xs leading-relaxed text-gray-400">
              <p>本页仅提供第三方资源服务的咨询入口与信息展示，ARCHIPEDIA 及网站运营方不直接提供下载、制图、代购、交易撮合、资金收付或售后服务。</p>
              <p>用户应自行核验服务方身份、服务范围、价格、交付标准、数据来源、版权状态与交易安全。任何交易、沟通、付款、退款、纠纷或损失均由用户与第三方服务方自行承担。</p>
              <p>相关地图、卫星图、SHP、POI、气象图等资料仅建议用于个人学习、课程训练和方案前期参考，不得用于科研发表、商业项目、测绘成果替代、行政审批、工程实施或其他需法定资质与授权的数据用途。</p>
              <p>本网站不保证资料完整性、准确性、时效性、可用性或合法授权状态；涉及地理信息、遥感影像、测绘成果、个人信息、平台数据和版权内容时，请遵守国家法律法规及原平台使用条款。</p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
    .service-card {
      contain: layout paint;
    }
  `]
})
export class ResourceServicesComponent {
  copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  serviceGroups: ServiceGroup[] = [
    {
      title: '场地与地图数据',
      eyebrow: 'Site Data',
      summary: '面向场地分析、底图绘制、前期调研与表达整理，按场地范围和数据类型咨询。',
      items: [
        {
          title: '场地模型下载',
          price: '26元起',
          description: '提供指定场地周边白模数据，用于体量推敲、场地分析和方案表达。',
          image: '/images/services/site-model.webp',
          note: '白模为基础交付，精度与完整性需按地区数据情况确认。'
        },
        {
          title: '场地平面图下载',
          price: '23元起',
          description: '整理场地底图、道路、水系、建筑轮廓等平面资料，辅助总平面和分析图绘制。',
          image: '/images/services/site-plan.webp'
        },
        {
          title: '最新卫星图下载',
          price: '6元起',
          description: '按指定范围获取近期卫星影像，用于场地现状观察和图面底图参考。',
          image: '/images/services/satellite-current.webp'
        },
        {
          title: '历史卫星图下载',
          price: '12元起',
          description: '按时间段查询历史影像，辅助研究场地变迁、城市扩张和建设过程。',
          image: '/images/services/satellite-history.webp'
        },
        {
          title: '矢量路网下载',
          price: '10元起',
          description: '以街道、区县等行政区划为基本单元，整理道路网络矢量数据。',
          image: '/images/services/road-network.webp',
          note: '具体覆盖范围与道路属性完整性需按数据源情况确认。'
        },
        {
          title: 'SHP 文件下载',
          price: '10元/个起',
          description: '全国城市 SHP 为 10 元/个；任意场地 SHP 为 16 元起。',
          image: '/images/services/shp-data.webp',
          note: '任意场地 SHP 不保证信息完整，仅作学习与方案前期参考。'
        },
        {
          title: 'POI 数据下载',
          price: '28元起',
          description: '按指定区域和关键词整理兴趣点数据，用于业态、设施、活力和公共服务分析。',
          image: '/images/services/poi-data.webp'
        },
      ]
    },
    {
      title: '气象与环境图制作',
      eyebrow: 'Climate Diagrams',
      summary: '面向气候分析、绿色建筑论证和图面表达，按城市、时间段和图表类型咨询。',
      items: [
        {
          title: '风玫瑰图',
          price: '10元/张起',
          description: '制作指定城市或气象站点的风向、风频图，用于场地风环境与朝向分析。',
          image: '/images/services/wind-rose.webp'
        },
        {
          title: '热辐射图',
          price: '10元/张起',
          description: '制作太阳辐射或热环境相关图表，辅助遮阳、朝向和室外空间舒适度判断。',
          image: '/images/services/radiation.webp'
        },
        {
          title: '焓湿图',
          price: '10元/张起',
          description: '整理空气状态与舒适区分析图，用于被动式设计、通风和湿热环境研究。',
          image: '/images/services/psychrometric.webp'
        },
        {
          title: '气温图',
          price: '10元/张起',
          description: '制作干球温度、湿球温度等气象曲线或统计图，用于气候背景分析。',
          image: '/images/services/temperature.webp'
        },
        {
          title: '相对湿度图',
          price: '10元/张起',
          description: '制作相对湿度变化图，辅助判断地方气候、通风策略和舒适度问题。',
          image: '/images/services/humidity.webp'
        },
      ]
    }
  ];

  copyWechat() {
    const text = 'AllDesignEverything';
    navigator.clipboard?.writeText(text).catch(() => undefined);
    this.copied.set(true);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set(false), 1800);
  }
}
