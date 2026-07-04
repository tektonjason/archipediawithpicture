import { Component, HostListener, signal } from '@angular/core';
import { APP_UI_ICONS } from '../shared/ui-icons';

interface ServiceItem {
  id: string;
  title: string;
  price: string;
  description: string;
  image: string;
  coverImage: string;
  detail: string;
  suitable: string[];
  deliverables: string[];
  beforeOrder: string[];
  gallery: string[];
  note?: string;
}

interface ServiceGroup {
  title: string;
  summary: string;
  items: ServiceItem[];
}

@Component({
  selector: 'app-resource-services',
  imports: [...APP_UI_ICONS],
  template: `
    <div class="ui-page-scroll ui-page-pad text-white">
      <header class="ui-page-header">
        <h1 class="ui-title">资源服务</h1>
        <p class="ui-subtitle">
          场地资料、地图数据与气象分析图制作的第三方咨询入口。
        </p>
      </header>

      <div class="mx-auto w-full max-w-7xl space-y-6 pb-24">
        <section class="ui-notice-info service-notice">
          <div class="ui-notice-title">
            <svg lucideInfo class="h-4 w-4 shrink-0" [strokeWidth]="2"></svg>
            服务说明
          </div>
          <p class="ui-notice-text">
            本页仅展示第三方服务咨询入口。具体范围、价格、交付时间与数据完整性请与服务方确认，下载资料建议仅用于个人学习和方案前期参考。
          </p>
        </section>

        <section class="service-consult-card" [class.is-open]="consultOpen()">
          <div class="service-consult-main">
            <div class="service-consult-icon">
              <svg lucideMail class="h-5 w-5" [strokeWidth]="2"></svg>
            </div>
            <div class="min-w-0">
              <p class="service-eyebrow">CONSULTATION</p>
              <h2 class="service-consult-title">服务咨询</h2>
              <p class="service-consult-text">添加微信确认服务范围、价格、交付时间与数据完整性。网站仅提供第三方咨询入口，不参与交易。</p>
            </div>
          </div>
          <button type="button" class="service-consult-toggle" (click)="toggleConsult()" [attr.aria-expanded]="consultOpen()">
            <span>{{ consultOpen() ? '收起咨询方式' : '查看咨询方式' }}</span>
            <svg lucideChevronDown class="h-4 w-4 transition-transform" [class.rotate-180]="consultOpen()" [strokeWidth]="2"></svg>
          </button>
          <div class="service-consult-action">
            <div class="service-qr-card" aria-label="服务咨询微信二维码">
              <img src="/images/services/wechat-qr.png" alt="服务咨询微信二维码" class="h-full w-full object-contain">
            </div>
            <div class="min-w-0">
              <p class="ui-card-meta">微信号</p>
              <p class="service-wechat">AllDesignEverything</p>
              <button type="button" class="ui-btn-secondary mt-2 px-3 py-2 text-xs" (click)="copyWechat()">
                <svg lucideCopy class="h-4 w-4" [strokeWidth]="2"></svg>
                复制微信号
              </button>
              <button type="button" class="ui-btn-secondary mt-2 px-3 py-2 text-xs" (click)="openWechat()">
                <svg lucideExternalLink class="h-4 w-4" [strokeWidth]="2"></svg>
                打开微信
              </button>
            </div>
          </div>
          @if (copied()) {
            <p class="service-copy-toast">微信号已复制</p>
          }
        </section>

        <main class="space-y-9">
          <section class="space-y-9">
            @for (group of serviceGroups; track group.title) {
              <section class="service-group-block">
                <div class="service-group-head">
                  <h2 class="service-group-title">{{ group.title }}</h2>
                  <p class="service-group-summary">{{ group.summary }}</p>
                </div>

                <div class="services-grid">
                  @for (item of group.items; track item.id) {
                    <button
                      type="button"
                      class="service-product-card group"
                      (click)="openServiceDetail(item)"
                    >
                      <div class="service-product-cover">
                        <img
                          [src]="item.coverImage"
                          [alt]="item.title + '示意图'"
                          loading="lazy"
                          decoding="async"
                          class="service-cover-image"
                        >
                      </div>
                      <div class="service-product-body">
                        <div class="service-product-head">
                          <div class="min-w-0">
                            <h3 class="service-product-title">{{ item.title }}</h3>
                            <p class="service-product-price">{{ item.price }}</p>
                          </div>
                          <svg lucideChevronRight class="service-product-arrow" [strokeWidth]="2"></svg>
                        </div>
                        <p class="service-product-desc">{{ item.description }}</p>
                        @if (item.note) {
                          <p class="service-product-note">
                            {{ item.note }}
                          </p>
                        }
                      </div>
                    </button>
                  }
                </div>
              </section>
            }
          </section>

          <aside class="service-disclaimer">
            <section class="rounded-card border border-line-soft bg-surface/80 p-5 shadow-panel">
              <div class="mb-3 flex items-center gap-2 text-amber-200">
                <svg lucideAlertTriangle class="h-5 w-5" [strokeWidth]="2"></svg>
                <h2 class="ui-panel-title">免责声明</h2>
              </div>
              <div class="space-y-3 text-xs leading-relaxed text-gray-400">
                <p>本页仅提供第三方资源服务的咨询入口与信息展示，ARCHIPEDIA 及网站运营方不直接提供下载、制图、代购、交易撮合、资金收付或售后服务。</p>
                <p>用户应自行核验服务方身份、服务范围、价格、交付标准、数据来源、版权状态与交易安全。任何交易、沟通、付款、退款、纠纷或损失均由用户与第三方服务方自行承担。</p>
                <p>相关地图、卫星图、SHP、POI、气象图等资料仅建议用于个人学习、课程训练和方案前期参考，不得用于科研发表、商业项目、测绘成果替代、行政审查、工程实施或其他需要法定资质与授权的数据用途。</p>
                <p>本网站不保证资料完整性、准确性、时效性、可用性或合法授权状态；涉及地理信息、遥感影像、测绘成果、个人信息、平台数据和版权内容时，请遵守国家法律法规及原平台使用条款。</p>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>

    @if (selectedService(); as item) {
      <div class="service-detail-overlay fixed inset-0 z-[80] flex items-center justify-center p-3 md:p-6" role="dialog" aria-modal="true" (click)="closeServiceDetail()">
        <div class="service-detail-backdrop absolute inset-0 bg-black/80 backdrop-blur-md"></div>
        <section class="service-detail-shell relative z-10 grid w-full max-w-6xl rounded-card border border-line bg-surface shadow-panel md:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]" (click)="$event.stopPropagation()">
          <button type="button" class="absolute right-4 top-4 z-20 ui-icon-btn bg-black/40" aria-label="关闭详情" (click)="closeServiceDetail()">
            <svg lucideX class="h-5 w-5" [strokeWidth]="2"></svg>
          </button>

          <div class="service-detail-gallery min-h-0 bg-black/25 p-4 custom-scrollbar md:p-6">
            <div class="relative overflow-hidden rounded-card border border-white/10 bg-black/40">
              <img [src]="selectedGalleryImage()" [alt]="item.title + '详情图'" class="max-h-[58vh] w-full object-contain" loading="lazy" decoding="async">
            </div>
            @if (item.gallery.length > 1) {
              <div class="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                @for (image of item.gallery; track image; let i = $index) {
                  <button
                    type="button"
                    class="aspect-[4/3] overflow-hidden rounded-control border border-white/10 bg-white/5 transition hover:border-blue-300/60"
                    [class.border-blue-300]="selectedImageIndex() === i"
                    [class.thumb-active]="selectedImageIndex() === i"
                    (click)="selectedImageIndex.set(i)"
                  >
                    <img [src]="image" [alt]="item.title + '缩略图 ' + (i + 1)" class="h-full w-full object-cover" loading="lazy" decoding="async">
                  </button>
                }
              </div>
            }
          </div>

          <div class="service-detail-info min-h-0 p-5 pr-6 custom-scrollbar md:p-7">
            <div class="pr-12">
              <p class="ui-card-meta uppercase tracking-wider">RESOURCE SERVICE</p>
              <h2 class="mt-2 text-2xl font-black leading-tight text-white md:text-3xl">{{ item.title }}</h2>
              <p class="mt-2 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-white">{{ item.price }}</p>
              <p class="ui-card-text mt-4">{{ item.detail }}</p>
            </div>

            <div class="service-detail-sections custom-scrollbar">
              <section class="detail-block">
                <h3 class="detail-title">适合场景</h3>
                <ul class="detail-list">
                  @for (text of item.suitable; track text) {
                    <li>{{ text }}</li>
                  }
                </ul>
              </section>

              <section class="detail-block">
                <h3 class="detail-title">可交付内容</h3>
                <ul class="detail-list">
                  @for (text of item.deliverables; track text) {
                    <li>{{ text }}</li>
                  }
                </ul>
              </section>

              <section class="detail-block">
                <h3 class="detail-title">咨询前建议准备</h3>
                <ul class="detail-list">
                  @for (text of item.beforeOrder; track text) {
                    <li>{{ text }}</li>
                  }
                </ul>
              </section>
            </div>

            <div class="service-detail-contact mt-6 rounded-card border border-blue-400/20 bg-blue-500/10 p-4">
              <div class="service-detail-contact-inner flex items-center gap-4">
                <div class="qr-soft-frame flex h-24 w-24 shrink-0 items-center justify-center rounded-card border border-blue-200/20 bg-blue-50/90 p-2">
                  <img src="/images/services/wechat-qr.png" alt="服务咨询微信二维码" class="h-full w-full object-contain">
                </div>
                <div class="min-w-0">
                  <p class="ui-card-meta">微信咨询</p>
                  <p class="mt-1 break-all font-mono text-sm font-bold text-white">AllDesignEverything</p>
                  <div class="service-detail-actions">
                    <button type="button" class="ui-btn-secondary mt-3 px-3 py-2 text-xs" (click)="copyWechat()">
                      <svg lucideCopy class="h-4 w-4" [strokeWidth]="2"></svg>
                      复制微信号
                    </button>
                    <button type="button" class="ui-btn-secondary mt-3 px-3 py-2 text-xs" (click)="openWechat()">
                      <svg lucideExternalLink class="h-4 w-4" [strokeWidth]="2"></svg>
                      打开微信
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    }
  `,
  styleUrls: ['./resource-services.component.css']
})
export class ResourceServicesComponent {
  copied = signal(false);
  consultOpen = signal(false);
  selectedService = signal<ServiceItem | null>(null);
  selectedImageIndex = signal(-1);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  serviceGroups: ServiceGroup[] = [
    {
      title: '场地与地图数据',
      summary: '面向场地分析、底图绘制、前期调研与表达整理，按场地范围和数据类型咨询。',
      items: [
        {
          id: 'site-model',
          title: '场地模型下载',
          price: '26元起',
          description: '提供指定场地周边白模数据，用于体量推敲、场地分析和方案表达。',
          image: '/images/services/site-model.webp',
          coverImage: '/images/services/covers/site-model.webp',
          detail: '根据指定位置和范围整理建筑白模、道路、水体及基础地形轮廓，适合作为课程设计、竞赛方案和早期城市体量分析的基础模型。',
          suitable: ['课程设计或竞赛需要快速建立场地周边体量关系。', '需要制作轴测、鸟瞰、日照或空间分析底模。', '已有场地位置，但缺少可直接导入建模软件的基础数据。'],
          deliverables: ['白模或基础场地模型文件，具体格式需咨询确认。', '按约定范围整理的建筑体量、道路与主要地物。', '可用于个人学习和方案表达的基础参考数据。'],
          beforeOrder: ['提供场地定位、范围截图或坐标。', '说明希望覆盖的半径、街区或行政边界。', '提前确认模型精度、文件格式和是否包含地形。'],
          gallery: [
            '/images/services/gallery/site-model-01.webp',
            '/images/services/gallery/site-model-02.webp',
            '/images/services/gallery/site-model-03.webp',
            '/images/services/gallery/site-model-04.webp',
            '/images/services/gallery/site-model-05.webp',
          ],
          note: '白模为基础交付，精度与完整性需按地区数据情况确认。'
        },
        {
          id: 'site-plan',
          title: '场地平面图下载',
          price: '23元起',
          description: '整理场地底图、道路、水系、建筑轮廓等平面资料，辅助总平面和分析图绘制。',
          image: '/images/services/site-plan.webp',
          coverImage: '/images/services/covers/site-plan.webp',
          detail: '面向总平面绘制和场地分析，整理指定范围内的道路、建筑轮廓、水体、绿地及基础地理要素，帮助快速建立清晰的绘图底稿。',
          suitable: ['需要制作总平面、区位、交通或功能分析图。', '已有场地位置，但手动描图时间不足。', '需要统一线稿风格作为方案汇报底图。'],
          deliverables: ['指定范围内的平面底图资料。', '道路、水系、建筑轮廓等基础图层。', '具体文件格式和图层完整性需咨询确认。'],
          beforeOrder: ['提供场地范围、比例需求和用途。', '说明是否需要道路、水系、建筑、绿地等分类图层。', '确认是否需要矢量格式、图片格式或两者都要。'],
          gallery: [
            '/images/services/gallery/site-plan-01.webp',
            '/images/services/gallery/site-plan-02.webp',
          ]
        },
        {
          id: 'satellite-current',
          title: '最新卫星图下载',
          price: '6元起',
          description: '按指定范围获取近期卫星影像，用于场地现状观察和图面底图参考。',
          image: '/images/services/satellite-current.webp',
          coverImage: '/images/services/covers/satellite-current.webp',
          detail: '用于快速获取指定区域的近期遥感影像，适合观察场地现状、周边开发程度、道路肌理和地表覆盖情况。',
          suitable: ['需要场地现状底图或汇报背景图。', '需要辅助判断周边建设、绿地、水体和交通关系。', '需要比普通地图更直观的现状影像。'],
          deliverables: ['按指定范围导出的近期卫星影像。', '可用于个人学习和前期方案参考的图片资料。', '影像日期、清晰度和覆盖情况以实际可获取数据为准。'],
          beforeOrder: ['提供场地范围或坐标。', '说明是否需要指定比例、尺寸或图片格式。', '提前确认影像清晰度、时间和版权使用限制。'],
          gallery: ['/images/services/gallery/satellite-current-01.webp']
        },
        {
          id: 'satellite-history',
          title: '历史卫星图下载',
          price: '12元起',
          description: '按时间段查询历史影像，辅助研究场地变迁、城市扩张和建设过程。',
          image: '/images/services/satellite-history.webp',
          coverImage: '/images/services/covers/satellite-history.webp',
          detail: '通过历史影像对比场地在不同时段的开发变化，适合城市更新、场地演变分析、滨水岸线变化和建设过程研究。',
          suitable: ['需要展示场地多年变化过程。', '需要对比道路、建筑、河道、绿地或边界变迁。', '需要为城市更新和场地叙事提供图像依据。'],
          deliverables: ['指定年份或时间段的历史卫星图。', '按约定范围输出的影像序列。', '可根据资料可得性整理对比图。'],
          beforeOrder: ['说明希望查询的年份或时间段。', '提供场地范围和用途。', '确认历史影像是否存在空缺、云层遮挡或清晰度不足。'],
          gallery: [
            '/images/services/gallery/satellite-history-01.webp',
            '/images/services/gallery/satellite-history-02.webp',
            '/images/services/gallery/satellite-history-03.webp',
          ]
        },
        {
          id: 'road-network',
          title: '矢量路网下载',
          price: '10元起',
          description: '以街道、区县等行政区划为基本单元，整理道路网络矢量数据。',
          image: '/images/services/road-network.webp',
          coverImage: '/images/services/covers/road-network.webp',
          detail: '整理指定区域道路网络，适合交通结构分析、可达性表达、区位分析和城市肌理图绘制。',
          suitable: ['需要制作路网结构、交通层级或可达性分析。', '需要区县、街道或场地周边道路矢量数据。', '需要将道路作为 GIS、AI 或 CAD 绘图底图。'],
          deliverables: ['指定范围内的道路矢量数据。', '可按数据源情况整理道路层级和基础属性。', '文件格式需咨询确认。'],
          beforeOrder: ['提供行政区、街道、场地范围或边界。', '说明是否需要道路等级、名称或其他属性。', '确认坐标系、格式和数据完整性要求。'],
          gallery: ['/images/services/gallery/road-network-01.webp'],
          note: '具体覆盖范围与道路属性完整性需按数据源情况确认。'
        },
        {
          id: 'shp-data',
          title: 'SHP 文件下载',
          price: '10元/个起',
          description: '全国城市 SHP 为 10 元/个；任意场地 SHP 为 16 元起。',
          image: '/images/services/shp-data.webp',
          coverImage: '/images/services/covers/shp-data.webp',
          detail: '面向 GIS 分析和规划表达整理 SHP 数据，可用于边界、道路、地物、POI 等空间信息的初步分析。',
          suitable: ['需要城市或场地范围的 GIS 数据。', '需要进行空间叠加、缓冲区或分类表达。', '需要将空间数据导入 GIS 软件进行二次处理。'],
          deliverables: ['城市或场地范围 SHP 数据。', '可按数据可得性整理边界、道路或地物图层。', '任意场地数据不保证信息完整。'],
          beforeOrder: ['说明城市、行政区或场地范围。', '说明需要的图层类型和文件格式。', '确认数据来源、坐标系、完整性和使用限制。'],
          gallery: [
            '/images/services/gallery/shp-data-01-small.webp',
            '/images/services/gallery/shp-data-02.webp',
          ],
          note: '任意场地 SHP 不保证信息完整，仅作学习与方案前期参考。'
        },
        {
          id: 'poi-data',
          title: 'POI 数据下载',
          price: '28元起',
          description: '按指定区域和关键词整理兴趣点数据，用于业态、设施、活力和公共服务分析。',
          image: '/images/services/poi-data.webp',
          coverImage: '/images/services/covers/poi-data.webp',
          detail: '围绕指定范围提取或整理兴趣点数据，用于商业业态、生活设施、公共服务、人口活动和城市活力分析。',
          suitable: ['需要分析餐饮、商业、教育、医疗、交通等设施分布。', '需要制作 POI 热力、密度或分类统计图。', '需要辅助判断场地周边功能结构和服务半径。'],
          deliverables: ['按关键词和范围整理的 POI 数据。', '可按需求整理名称、类别、位置等基础字段。', '数据字段完整性需按实际来源确认。'],
          beforeOrder: ['提供范围、关键词、分类和数据用途。', '确认是否需要坐标、名称、分类、地址等字段。', '注意平台数据、隐私和版权使用限制。'],
          gallery: [
            '/images/services/gallery/poi-data-01.webp',
            '/images/services/gallery/poi-data-02.webp',
          ]
        },
      ]
    },
    {
      title: '气象与环境图制作',
      summary: '面向气候分析、绿色建筑论证和图面表达，按城市、时间段和图表类型咨询。',
      items: [
        {
          id: 'wind-rose',
          title: '风玫瑰图',
          price: '10元/张起',
          description: '制作指定城市或气象站点的风向、风频图，用于场地风环境与朝向分析。',
          image: '/images/services/wind-rose.webp',
          coverImage: '/images/services/covers/wind-rose.webp',
          detail: '整理指定城市或气象站点的风向与风频信息，生成适合方案汇报和气候分析的风玫瑰图。',
          suitable: ['需要判断主导风向、通风廊道和入口朝向。', '需要制作气候分析图或绿色建筑分析页。', '需要以图表形式说明场地风环境背景。'],
          deliverables: ['风玫瑰图或风频统计图。', '可按季节、月份或全年进行整理，具体以数据可得性为准。', '图面样式可按用途沟通。'],
          beforeOrder: ['提供城市、气象站点或经纬度。', '说明希望分析全年、季节还是指定月份。', '确认图表尺寸、颜色和输出格式。'],
          gallery: [
            '/images/services/gallery/wind-rose-01.webp',
            '/images/services/gallery/wind-rose-02.webp',
          ]
        },
        {
          id: 'radiation',
          title: '热辐射图',
          price: '10元/张起',
          description: '制作太阳辐射或热环境相关图表，辅助遮阳、朝向和室外空间舒适度判断。',
          image: '/images/services/radiation.webp',
          coverImage: '/images/services/covers/radiation.webp',
          detail: '用于表达场地或建筑在不同时间段的太阳辐射与热环境特征，辅助判断遮阳、开窗、朝向和室外活动空间安排。',
          suitable: ['需要制作日照、太阳辐射或热环境分析。', '需要辅助解释立面遮阳和空间布局。', '需要绿色建筑、低碳设计或气候适应性表达。'],
          deliverables: ['辐射分析图或相关环境图表。', '可按全年、季节或指定时段整理。', '输出精度和计算口径需咨询确认。'],
          beforeOrder: ['提供地点、时间段和图表用途。', '说明是否需要建筑模型、场地范围或气象数据。', '确认图表样式和输出格式。'],
          gallery: [
            '/images/services/gallery/radiation-01.webp',
            '/images/services/gallery/radiation-02.webp',
          ]
        },
        {
          id: 'psychrometric',
          title: '焓湿图',
          price: '10元/张起',
          description: '整理空气状态与舒适区分析图，用于被动式设计、通风和湿热环境研究。',
          image: '/images/services/psychrometric.webp',
          coverImage: '/images/services/covers/psychrometric.webp',
          detail: '基于气象数据整理空气温湿状态与舒适区关系，适合被动式设计策略、通风降温和湿热环境分析。',
          suitable: ['需要判断当地气候舒适区和被动策略。', '需要分析通风、除湿、遮阳或采暖降温可能性。', '需要用图表支持气候适应性设计说明。'],
          deliverables: ['焓湿图或舒适区分析图。', '可按全年或指定月份统计。', '图表样式和指标口径需咨询确认。'],
          beforeOrder: ['提供城市或气象站点。', '说明是否需要叠加舒适区、策略区或月份分布。', '确认输出尺寸、格式和用途。'],
          gallery: ['/images/services/gallery/psychrometric-01.webp']
        },
        {
          id: 'temperature',
          title: '气温图',
          price: '10元/张起',
          description: '制作干球温度、湿球温度等气象曲线或统计图，用于气候背景分析。',
          image: '/images/services/temperature.webp',
          coverImage: '/images/services/covers/temperature.webp',
          detail: '整理气温相关数据，生成适合设计汇报的气温曲线、月份统计或干湿球温度图。',
          suitable: ['需要说明城市气候背景和冷热季变化。', '需要支持围护结构、通风或遮阳策略。', '需要课程设计或竞赛中的环境分析图。'],
          deliverables: ['干球温度、湿球温度或相关统计图。', '可按全年、季节或月份整理。', '输出样式可按图面风格沟通。'],
          beforeOrder: ['提供城市、站点或经纬度。', '说明时间范围和图表类型。', '确认是否需要与湿度、风向等图表组合。'],
          gallery: [
            '/images/services/gallery/temperature-01.webp',
            '/images/services/gallery/temperature-02.webp',
          ]
        },
        {
          id: 'humidity',
          title: '相对湿度图',
          price: '10元/张起',
          description: '制作相对湿度变化图，辅助判断地方气候、通风策略和舒适度问题。',
          image: '/images/services/humidity.webp',
          coverImage: '/images/services/covers/humidity.webp',
          detail: '用于表达相对湿度在全年或指定时间段内的变化，辅助判断湿热地区设计策略、通风除湿和材料选择。',
          suitable: ['需要分析湿热、干燥或季节性湿度变化。', '需要支持自然通风、除湿和室内舒适性判断。', '需要形成完整气候分析图组。'],
          deliverables: ['相对湿度曲线或统计图。', '可按月份、季节或全年整理。', '可与气温、焓湿图等组合输出。'],
          beforeOrder: ['提供城市或气象站点。', '说明时间范围和图表样式。', '确认是否需要统一图面模板。'],
          gallery: ['/images/services/gallery/humidity-01.webp']
        },
      ]
    }
  ];

  @HostListener('document:keydown.escape')
  closeOnEscape() {
    this.closeServiceDetail();
  }

  openServiceDetail(item: ServiceItem) {
    this.selectedImageIndex.set(item.gallery.length ? 0 : -1);
    this.selectedService.set(item);
  }

  closeServiceDetail() {
    this.selectedService.set(null);
    this.selectedImageIndex.set(-1);
  }

  selectedGalleryImage(): string {
    const item = this.selectedService();
    if (!item) return '';
    const index = this.selectedImageIndex();
    if (index < 0) return item.gallery[0] || item.image || item.coverImage;
    return item.gallery[index] || item.image || item.coverImage;
  }

  toggleConsult() {
    this.consultOpen.update((value) => !value);
  }

  openWechat() {
    this.copyWechat();
    window.location.href = 'weixin://';
  }

  copyWechat() {
    const text = 'AllDesignEverything';
    navigator.clipboard?.writeText(text).catch(() => undefined);
    this.copied.set(true);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set(false), 1800);
  }
}
