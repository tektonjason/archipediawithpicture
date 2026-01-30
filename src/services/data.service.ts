

import { Injectable, signal, computed, effect } from '@angular/core';

export interface Entry {
  id: string;
  category: string;
  subcategory: string;
  term: string;
  termEn: string;
  definition: string;
  details: string;
  imageUrl?: string;
  imagePosition?: string;
  isCustom?: boolean;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  tags?: string[];
}

export interface Reading {
  id?: string;
  title: string;
  author: string;
  publisher: string;
  year?: string;
  description: string;
  tags: string[];
  journalLevel: string | null; // e.g. "核心期刊"
  identifier: string | null;
  url?: string;
  detailContent?: string;
  imageUrl?: string;
}

export interface Competition {
  level: string;     // 级别
  type: string;      // 种类
  name: string;      // 竞赛名称
  organizer: string; // 主办单位
  note: string;      // 备注
  url: string;       // 网址
  deadline: string;  // 报名截至时间
  month?: number;    // 1-12, derived from deadline
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // --- Layout State ---
  // Default to true, but we will adjust in constructor
  isSidebarOpen = signal<boolean>(true);

  // --- Admin State ---
  isAdmin = signal<boolean>(false);
  
  // --- Global Modal States ---
  showLoginModal = signal(false);
  showLogoutModal = signal(false);
  loginEmail = signal('');
  loginPass = signal('');
  loginError = signal('');

  // --- External Link Modal State ---
  showExternalModal = signal(false);
  externalUrl = signal('');
  externalModalSuppressed = signal(false); // New state to suppress modal for current session

  openExternalModal(url: string) {
    if (!url) return;
    
    // Check if suppressed
    if (this.externalModalSuppressed()) {
      window.open(url, '_blank');
      return;
    }

    this.externalUrl.set(url);
    this.showExternalModal.set(true);
  }

  closeExternalModal() {
    this.showExternalModal.set(false);
  }

  confirmExternalNavigation(suppress: boolean = false) {
    const url = this.externalUrl();
    if (url) {
      window.open(url, '_blank');
    }
    
    if (suppress) {
      this.externalModalSuppressed.set(true);
    }
    
    this.showExternalModal.set(false);
  }

  // --- Data Stores ---
  entries = signal<Entry[]>([]);
  favorites = signal<string[]>([]);
  history = signal<string[]>([]);
  webLinks = signal<Link[]>([]);
  readings = signal<Reading[]>([]);
  competitions = signal<Competition[]>([]);
  chatHistory = signal<ChatMessage[]>([]);

  // --- Encyclopedia View State ---
  encyclopediaScrollPosition = signal<number>(0);
  encyclopediaDisplayLimit = signal<number>(50);
  encyclopediaSelectedCategory = signal<string>('all');
  encyclopediaViewMode = signal<'grid' | 'list'>('grid');

  constructor() {
    this.initLayout();
    this.loadFromStorage();
    // Only seed entries if completely empty
    // if (this.entries().length === 0) {
      this.seedArchipediaData();
    // }
    
    this.syncResources();
    this.seedReadingsData();
    this.seedCompetitionsData();

    effect(() => localStorage.setItem('arch_favorites', JSON.stringify(this.favorites())));
    effect(() => localStorage.setItem('arch_history', JSON.stringify(this.history())));
    effect(() => localStorage.setItem('arch_chat', JSON.stringify(this.chatHistory())));
    effect(() => localStorage.setItem('arch_entries', JSON.stringify(this.entries())));
    effect(() => localStorage.setItem('arch_links', JSON.stringify(this.webLinks())));
    effect(() => localStorage.setItem('arch_view_mode', this.encyclopediaViewMode()));
  }

  private initLayout() {
    // Check if running in browser environment
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768; // Tailwind md breakpoint
      // On mobile, start closed. On desktop, start open.
      this.isSidebarOpen.set(!isMobile);
    }
  }

  // --- Layout ---
  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setSidebarState(isOpen: boolean) {
    this.isSidebarOpen.set(isOpen);
  }

  // --- Auth/Modal Logic ---
  handleAdminAction() {
    if (this.isAdmin()) {
      this.showLogoutModal.set(true);
    } else {
      this.loginEmail.set('');
      this.loginPass.set('');
      this.loginError.set('');
      this.showLoginModal.set(true);
    }
  }

  performLogin() {
    if (this.login(this.loginEmail(), this.loginPass())) {
      this.showLoginModal.set(false);
    } else {
      this.loginError.set('认证失败：账号或密码错误');
    }
  }

  confirmLogout() {
    this.logout();
    this.showLogoutModal.set(false);
  }

  closeLoginModal() {
    this.showLoginModal.set(false);
  }

  // --- Auth ---
  login(email: string, pass: string): boolean {
    if (email === 'tektonjason@163.com' && pass === '123456') {
      this.isAdmin.set(true);
      return true;
    }
    return false;
  }

  logout() {
    this.isAdmin.set(false);
  }

  // --- Entry Management ---
  getEntry(id: string) {
    return computed(() => this.entries().find(e => e.id === id));
  }

  addEntry(entry: Entry) {
    this.entries.update(list => [...list, entry]);
  }

  updateEntry(updated: Entry) {
    this.entries.update(list => list.map(e => e.id === updated.id ? updated : e));
  }

  deleteEntry(id: string) {
    this.entries.update(list => list.filter(e => e.id !== id));
  }

  // --- Favorites ---
  toggleFavorite(id: string) {
    this.favorites.update(favs => {
      if (favs.includes(id)) return favs.filter(f => f !== id);
      return [...favs, id];
    });
  }

  isFavorite(id: string) {
    return computed(() => this.favorites().includes(id));
  }

  // --- History ---
  addToHistory(term: string) {
    this.history.update(h => [term, ...h.filter(t => t !== term)].slice(0, 50));
  }

  clearHistory() {
    this.history.set([]);
  }

  // --- Chat ---
  addMessage(msg: ChatMessage) {
    this.chatHistory.update(h => [...h, msg]);
  }
  
  clearChat() {
    this.chatHistory.set([]);
  }

  // --- Links ---
  addLink(link: Link) {
    this.webLinks.update(l => [...l, link]);
  }
  
  removeLink(id: string) {
    this.webLinks.update(l => l.filter(i => i.id !== id));
  }

  updateLink(link: Link) {
      this.webLinks.update(l => l.map(i => i.id === link.id ? link : i));
  }

  // --- Image Handling ---
  async compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.7;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          while (dataUrl.length > 135000 && quality > 0.1) {
             quality -= 0.1;
             dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  private loadFromStorage() {
    try {
      const e = localStorage.getItem('arch_entries');
      if (e) this.entries.set(JSON.parse(e));
      const f = localStorage.getItem('arch_favorites');
      if (f) this.favorites.set(JSON.parse(f));
      const h = localStorage.getItem('arch_history');
      if (h) this.history.set(JSON.parse(h));
      const c = localStorage.getItem('arch_chat');
      if (c) this.chatHistory.set(JSON.parse(c));
      const w = localStorage.getItem('arch_links');
      if (w) this.webLinks.set(JSON.parse(w));
      const vm = localStorage.getItem('arch_view_mode');
      if (vm) this.encyclopediaViewMode.set(vm as 'grid' | 'list');
    } catch (err) {
      console.error('Failed to load storage', err);
    }
  }

  private syncResources() {
    const seedLinks = this.getSeedResources();
    const currentLinks = this.webLinks();
    const currentMap = new Map<string, Link>();
    for (const link of currentLinks) {
      currentMap.set(link.id, link);
    }
    
    let hasChanges = false;
    const merged = [...currentLinks];

    seedLinks.forEach(seed => {
      if (!currentMap.has(seed.id)) {
        merged.push(seed);
        hasChanges = true;
      } else {
        const existing = currentMap.get(seed.id);
        if (existing) {
          const tagsChanged = JSON.stringify(existing.tags) !== JSON.stringify(seed.tags);
          if (
            existing.category !== seed.category || 
            existing.url !== seed.url || 
            existing.title !== seed.title || 
            existing.description !== seed.description ||
            tagsChanged
          ) {
               const idx = merged.findIndex(m => m.id === seed.id);
               if (idx > -1) {
                 merged[idx] = { ...existing, ...seed };
                 hasChanges = true;
               }
          }
        }
      }
    });

    if (hasChanges) {
      this.webLinks.set(merged);
    }
  }

  private getSeedResources(): Link[] {
    return [
      { id: 'e1', category: '院校展览', title: 'UCL Bartlett', url: 'https://shows.bartlettarchucl.com/', description: 'UCL巴特莱特建筑学院学生项目 The Bartlett Show Index' },
      { id: 'e2', category: '院校展览', title: 'Harvard GSD Projects', url: 'https://www.gsd.harvard.edu/architecture/department-of-architecture-student-projects/', description: '哈佛大学学生项目' },
      { id: 'e3', category: '院校展览', title: 'Harvard GSD Publications', url: 'https://issuu.com/gsdharvard', description: '哈佛大学设计研究生院出版社（Harvard GSD）出版物' },
      { id: 'e4', category: '院校展览', title: 'NUS DoA Projects', url: 'https://cde.nus.edu.sg/arch/gallery/?galleryType=programmes&programmes=1207', description: '新加坡国立大学学生项目' },
      { id: 'e5', category: '院校展览', title: 'NUS DoA Publications', url: 'https://issuu.com/nusdoa', description: '新加坡国立大学出版物' },
      { id: 'e6', category: '院校展览', title: 'HKU Architecture Gallery', url: 'https://www.arch.hku.hk/programmes_/arch/gallery-arch/', description: '香港大学学生项目' },
      { id: 'e7', category: '院校展览', title: 'Cornell AAP Student Work', url: 'https://aap.cornell.edu/student-work-index/', description: '康奈尔大学学生项目' },
      { id: 'e8', category: '院校展览', title: 'The Presidents Medals', url: 'https://www.presidentsmedals.com/', description: '英国总统奖章学生奖' },
      { id: 'e9', category: '院校展览', title: 'UPenn Weitzman Gallery', url: 'https://www.design.upenn.edu/architecture/graduate/student-gallery', description: '宾夕法尼亚大学学生项目' },
      { id: 'e10', category: '院校展览', title: 'Politecnico di Milano Theses', url: 'https://www.architetturadellecostruzioni.polimi.it/tesi-di-laurea/', description: '米兰理工大学建造建筑学学生项目' },
      { id: 'e11', category: '院校展览', title: 'AA School Publications', url: 'https://issuu.com/aaschool', description: '英国建筑联盟学院（AA）出版社出版物' },
      { id: 'e12', category: '院校展览', title: 'AA School Projects', url: 'https://www.aaschool.ac.uk/projectsreview', description: '英国建筑联盟学院（AA）学生项目' },
      { id: 'e13', category: '院校展览', title: 'Columbia GSAPP Exhibitions', url: 'https://www.arch.columbia.edu/exhibitions', description: '哥伦比亚大学学生项目' },
      { id: 'e14', category: '院校展览', title: 'MIT Architecture Publications', url: 'https://issuu.com/mitarchitecture', description: '麻省理工大学出版物' },
      { id: 'e15', category: '院校展览', title: 'Yale Student Work', url: 'https://www.architecture.yale.edu/students/student-work', description: '耶鲁大学学生项目' },
      { id: 'e16', category: '院校展览', title: 'TUDelft MA Gallery', url: 'https://www.tudelft.nl/en/education/programmes/masters/aubs/msc-architecture-urbanism-and-building-sciences/master-tracks/architecture/student-work', description: '代尔夫特理工大学建筑学学生项目' },
      { id: 'e17', category: '院校展览', title: 'TUDelft MLA Gallery', url: 'https://www.tudelft.nl/en/education/programmes/masters/aubs/msc-architecture-urbanism-and-building-sciences/master-tracks/landscape-architecture/student-work', description: '代尔夫特理工大学景观建筑学生项目' },
      { id: 'e18', category: '院校展览', title: 'TUDelft MU Gallery', url: 'https://www.tudelft.nl/en/education/programmes/masters/aubs/msc-architecture-urbanism-and-building-sciences/master-tracks/urbanism/student-work', description: '代尔夫特理工大学城市化学生项目' },
      { id: 'e19', category: '院校展览', title: '清华大学学生设计作品展', url: 'https://exhibition.arch.tsinghua.edu.cn/studios/', description: '清华大学建筑学院线上优秀作品展' },  
      { id: 'e20', category: '院校展览', title: '同济大学本科生毕设展', url: 'https://zhuanlan.zhihu.com/p/635386065', description: '2023同济大学建筑系本科生毕业展' },          
      { id: 'n1', category: '建筑资讯与媒体', title: 'ArchDaily', url: 'https://www.archdaily.com', description: '全球最受欢迎的建筑网站，提供最新的建筑新闻和项目。' },
      { id: 'n2', category: '建筑资讯与媒体', title: '建日筑闻', url: 'https://www.archdaily.cn/cn', description: 'ArchDaily 中国版，关注中国建筑现场与独立评论。' },
      { id: 'n3', category: '建筑资讯与媒体', title: 'Dezeen', url: 'https://www.dezeen.com', description: '世界上最有影响力的建筑、室内和设计杂志。' },
      { id: 'n4', category: '建筑资讯与媒体', title: '谷德设计网 (Gooood)', url: 'https://www.gooood.cn', description: '中国最受欢迎的建筑景观设计门户网站。' },
      { id: 'n5', category: '建筑资讯与媒体', title: '有方 (Position)', url: 'https://www.archiposition.com', description: '高品质建筑文化机构，致力于建筑展览与学术推广。' },
      { id: 'n6', category: '建筑资讯与媒体', title: 'Divisare', url: 'https://divisare.com', description: '精心策划的当代建筑案例图库，分类极其详细。' },
      { id: 'n7', category: '建筑资讯与媒体', title: 'Architizer', url: 'https://architizer.com', description: '连接建筑师与建材制造商的平台，拥有丰富的项目库。' },
      { id: 'n8', category: '建筑资讯与媒体', title: 'Detail', url: 'https://www.detail.de', description: '专注于建筑细节构造和节点设计的专业期刊。' },
      { id: 'n9', category: '建筑资讯与媒体', title: 'World-Architects', url: 'https://www.world-architects.com', description: '精选全球优秀建筑师及其作品的高端网络平台。' },
      { id: 'n10', category: '建筑资讯与媒体', title: 'Archinect', url: 'https://archinect.com', description: '建立建筑师社区与职业网络的资讯平台，包含求职与论坛。' },
      { id: 'n11', category: '建筑资讯与媒体', title: 'Issuu', url: 'https://issuu.com', description: '全球最大的电子出版平台，海量学生作品集与建筑杂志在线阅读。' },
      { id: 'n12', category: '建筑资讯与媒体', title: 'Google Arts & Culture', url: 'https://artsandculture.google.com', description: '谷歌艺术与文化，高清浏览全球历史建筑、博物馆与艺术品。' },
      { id: 'n13', category: '建筑资讯与媒体', title: '灵感行星 (EasyRef)', url: 'https://next.easyref.design', description: '聚合全球设计灵感的瀑布流网站，高效寻找参考图。' },
      { id: 'n14', category: '建筑资讯与媒体', title: 'BIG | Bjarke Ingels Group', url: 'https://big.dk/', description: '国际知名建筑设计公司，以创新的形式与功能结合而闻名，其作品可极大激发学生的设计创意' },
      { id: 'n15', category: '建筑资讯与媒体', title: 'Archiweb', url: 'https://www.archweb.com/zh-CN/', description: '汇集各类建筑项目，具有详尽的图纸DWG和模型文件' },
      { id: 'n16', category: '建筑资讯与媒体', title: 'Archeyes', url: 'https://archeyes.com/', description: '具有详细分类的建筑案例库' },
      { id: 'n17', category: '建筑资讯与媒体', title: 'Architectuul', url: 'https://architectuul.com/', description: '按建筑师进行分类的建筑案例库' },
      { id: 'l1', category: '规范、学习与学术', title: '建标库', url: 'https://www.jianbiaoku.com', description: '最全的国家工程建设标准、图集与规范查询平台。' },
      { id: 'l2', category: '规范、学习与学术', title: '犀流堂 (RhinoStudio)', url: 'https://www.rhinostudio.cn', description: '专业的 Rhino/Grasshopper 参数化建模中文教程网。' },
      { id: 'l3', category: '规范、学习与学术', title: 'ResearchGate', url: 'https://www.researchgate.net', description: '全球科研人员的学术社交与论文分享平台。' },
      { id: 'l4', category: '规范、学习与学术', title: '建筑学长', url: 'https://www.jianzhuxuezhang.com', description: '聚合建筑考研、设计教程与资源的综合学习平台。' },
      { id: 'l5', category: '规范、学习与学术', title: 'Google Scholar', url: 'https://scholar.google.com', description: '全球最大的学术文献搜索引擎。' },
      { id: 'l6', category: '规范、学习与学术', title: '茶思屋 (Chaspark)', url: 'https://www.chaspark.com', description: '黄大年茶思屋，科技与学术交流平台。' },
      { id: 'l7', category: '规范、学习与学术', title: 'ArchStudio', url: 'http://www.arch-studio.cn', description: '建筑相关的网课和视频教程资源。' },
      { id: 't1', category: '地图、气象与数据', title: 'CADMAPPER', url: 'https://cadmapper.com', description: '下载全球城市的CAD文件（DXF格式），包含建筑轮廓和道路。' },
      { id: 't2', category: '地图、气象与数据', title: 'OpenStreetMap', url: 'https://www.openstreetmap.org', description: '免费的维基世界地图，可导出矢量地理数据。' },
      { id: 't3', category: '地图、气象与数据', title: 'Windy', url: 'https://www.windy.com', description: '全球可视化天气预报，提供风场、气温等气象数据。' },
      { id: 't4', category: '地图、气象与数据', title: '高德开放平台', url: 'https://lbs.amap.com', description: '提供国内地图API、样式自定义和地理数据服务。' },
      { id: 't5', category: '地图、气象与数据', title: 'Mapbox', url: 'https://www.mapbox.com', description: '强大的自定义地图设计平台，支持高度风格化的地图输出。' },
      { id: 't6', category: '地图、气象与数据', title: 'Ladybug EPW Map', url: 'https://www.ladybug.tools/epwmap/', description: '获取全球各地的EPW气象数据文件，用于建筑能耗分析。' },
      { id: 't7', category: '地图、气象与数据', title: 'BBBike', url: 'https://extract.bbbike.org', description: '提取世界各地地图数据为多种格式。' },
      { id: 't8', category: '地图、气象与数据', title: 'City Roads', url: 'https://anvaka.github.io/city-roads/', description: '一键生成并导出任意城市的道路网矢量图。' },
      { id: 't9', category: '地图、气象与数据', title: 'Bus Line', url: 'http://bus.multeek.com/busline', description: '城市公交线路可视化工具，分析城市交通脉络。' },
      { id: 't10', category: '地图、气象与数据', title: 'Height Mapper', url: 'https://tangrams.github.io/heightmapper/', description: '全球地形高度图生成器，支持导出灰度置换贴图。' },
      { id: 't11', category: '地图、气象与数据', title: '全国风玫瑰汇总', url: 'https://www.shejiyizhou.com/thread-451-1-1.html', description: '建筑设计必备的中国各地气象风环境基础资料。' },
      { id: 't12', category: '地图、气象与数据', title: '建筑节能数据平台', url: 'https://buildingdata.xauat.edu.cn/#call-to-action', description: '提供精细化的建筑节能设计基础气象参数。' },
      { id: 't13', category: '地图、气象与数据', title: '规划云', url: 'http://guihuayun.com', description: '城乡规划行业的综合数据查询与工具服务平台。' },
      { id: 't14', category: '地图、气象与数据', title: '地图慧', url: 'http://e.dituhui.com', description: '在线制作统计地图与地理数据可视化的简易工具。' },
      { id: 's1', category: '软件、插件与渲染', title: 'Unreal Engine', url: 'https://www.unrealengine.com', description: '虚幻引擎，实时渲染与建筑可视化的未来工具。' },
      { id: 's2', category: '软件、插件与渲染', title: 'D5渲染器', url: 'https://www.d5render.com', description: '国产实时光线追踪渲染器，操作便捷效果惊艳。' },
      { id: 's3', category: '软件、插件与渲染', title: 'Rhino 3D', url: 'https://www.rhino3d.com', description: '强大的NURBS建模软件，参数化设计的基石。' },
      { id: 's4', category: '软件、插件与渲染', title: 'V-Ray', url: 'https://www.chaos.com/vray', description: '业界标杆级的物理渲染引擎，支持多种建模软件。' },
      { id: 's5', category: '软件、插件与渲染', title: 'Enscape', url: 'https://enscape3d.com', description: '即时交互式渲染软件，设计与表现同步，VR漫游首选。' },
      { id: 's6', category: '软件、插件与渲染', title: 'Blender', url: 'https://www.blender.org', description: '免费开源的全能三维创作套件，拥有庞大的社区插件。' },
      { id: 's7', category: '软件、插件与渲染', title: 'Corona', url: 'https://chaos.com/corona', description: '专注于写实与易用性的CPU渲染器，光影柔和。' },
      { id: 's8', category: '软件、插件与渲染', title: 'Chaos Vantage', url: 'https://www.chaos.com/vantage', description: '100% 实时光线追踪的大场景漫游工具。' },
      { id: 's9', category: '软件、插件与渲染', title: 'Grasshopper', url: 'https://www.grasshopper3d.com', description: 'Rhino内置的图形化参数化编程插件。' },
      { id: 's10', category: '软件、插件与渲染', title: 'Food4Rhino', url: 'https://www.food4rhino.com', description: 'Rhino与Grasshopper的全球最大插件资源社区。' },
      { id: 's11', category: '软件、插件与渲染', title: 'Revit', url: 'https://www.autodesk.com/products/revit', description: 'Autodesk旗下建筑信息模型(BIM)的核心软件。' },
      { id: 's12', category: '软件、插件与渲染', title: 'SketchUp', url: 'https://www.sketchup.com', description: '直观易用的推敲与建模工具，草图大师。' },
      { id: 'm1', category: '材质、配景与素材', title: 'Polyhaven', url: 'https://polyhaven.com', description: '免费的高质量HDRI、纹理和3D模型库(原HDRIHaven)。', tags: ['环境', '材质', '模型'] },
      { id: 'm2', category: '材质、配景与素材', title: 'Architextures', url: 'https://architextures.org', description: '在线生成无缝建筑纹理贴图的强大工具。', tags: ['材质'] },
      { id: 'm3', category: '材质、配景与素材', title: 'Textures.com', url: 'https://www.textures.com', description: '老牌纹理素材网站，资源极其丰富。', tags: ['材质'] },
      { id: 'm4', category: '材质、配景与素材', title: 'Sketchup Texture Club', url: 'https://www.sketchuptextureclub.com', description: '专为SketchUp用户提供的材质贴图库。', tags: ['材质'] },
      { id: 'm5', category: '材质、配景与素材', title: '3D Warehouse', url: 'https://3dwarehouse.sketchup.com', description: 'SketchUp官方模型库，拥有海量用户上传的模型。', tags: ['模型'] },
      { id: 'm6', category: '材质、配景与素材', title: 'Pexels', url: 'https://www.pexels.com', description: '高质量免费库存照片和视频，适用于效果图配景。', tags: ['环境'] },
      { id: 'm7', category: '材质、配景与素材', title: 'Pixabay', url: 'https://pixabay.com', description: '免费正版高清图片素材库。', tags: ['环境'] },
      { id: 'm8', category: '材质、配景与素材', title: 'Nonscandinavia', url: 'https://www.nonscandinavia.com', description: '提供非北欧（多样化种族）的人物配景素材。', tags: ['人物'] },
      { id: 'm9', category: '材质、配景与素材', title: 'Town Illust', url: 'https://town-illust.com', description: '提供日系城市建筑插画素材，适合分析图制作。', tags: ['配景'] },
      { id: 'm10', category: '材质、配景与素材', title: 'Dimensions', url: 'https://www.dimensions.com', description: '各种物品、家具和空间的标准尺寸数据库。', tags: ['尺寸'] },
      { id: 'm11', category: '材质、配景与素材', title: 'Toffu', url: 'https://toffu.co', description: '高质量的矢量配景人物和树木素材。', tags: ['人物', '配景'] },
      { id: 'm12', category: '材质、配景与素材', title: 'Skalgubbar', url: 'https://skalgubbar.se', description: '著名的北欧风格建筑配景人物素材库。', tags: ['人物'] },
      { id: 'm13', category: '材质、配景与素材', title: 'Meye', url: 'https://meye.dk', description: '哥本哈根视角的免费人物与环境素材。', tags: ['人物', '配景'] },
      { id: 'm14', category: '材质、配景与素材', title: 'MrCutout', url: 'https://mrcutout.com', description: '高质量的免抠人物、植被与物体素材库。', tags: ['人物', '配景'] },
      { id: 'm15', category: '材质、配景与素材', title: 'Elderly Entourage', url: 'https://elderlyentourage.cargo.site', description: '专注于老年人形象的建筑配景人物库。', tags: ['人物'] },
      { id: 'm16', category: '材质、配景与素材', title: 'Transparent Textures', url: 'https://www.transparenttextures.com', description: '免费的无缝背景纹理素材库。', tags: ['材质'] },
      { id: 'm17', category: '材质、配景与素材', title: 'Yajidesign', url: 'http://yajidesign.com', description: '提供丰富多样的箭头设计素材。', tags: ['素材'] },
      { id: 'm18', category: '材质、配景与素材', title: 'Fukidesign', url: 'https://fukidesign.com', description: '手绘风格的对话气泡素材库。', tags: ['素材'] },
      { id: 'm19', category: '材质、配景与素材', title: 'Kage-design', url: 'https://kage-design.com', description: '高质量的光影与剪影素材设计。', tags: ['配景'] },
      { id: 'm20', category: '材质、配景与素材', title: 'Pictogram2', url: 'https://pictogram2.com', description: '丰富的人物象形图和剪影素材。', tags: ['人物', '剪影'] },
      { id: 'c1', category: '配色、平面与图解', title: 'Adobe Color', url: 'https://color.adobe.com', description: '专业的在线配色轮和调色板生成工具。' },
      { id: 'c2', category: '配色、平面与图解', title: '分析图', url: 'https://www.fenxitu.cn', description: '专为建筑分析图设计的配色参考网站。' },
      { id: 'c3', category: '配色、平面与图解', title: 'MyColorSpace', url: 'https://mycolor.space', description: '输入主色调即可生成完美的配色方案。' },
      { id: 'c4', category: '配色、平面与图解', title: 'Dogma', url: 'http://dogma.name', description: '独特的拼贴风格建筑表现参考。' },
      { id: 'c5', category: '配色、平面与图解', title: 'Drawing Architecture', url: 'https://drawingarchitecture.tumblr.com', description: '汇集极具表现力的建筑绘画与图纸参考。' },
      { id: 'c6', category: '配色、平面与图解', title: 'Color Hunt', url: 'https://colorhunt.co', description: '每日更新的精选配色方案，寻找色彩灵感。' },
      { id: 'c7', category: '配色、平面与图解', title: 'Pantone Connect', url: 'https://connect.pantone.com', description: '潘通(Pantone)官方色彩平台，查找标准色号。' },
      { id: 'c8', category: '材质、配景与素材', title: 'Iconfont', url: 'https://www.iconfont.cn', description: '阿里巴巴矢量图标库，提供海量设计图标。', tags: ['素材'] },
      { id: 'c9', category: '配色、平面与图解', title: 'Arqui9', url: 'https://arqui9.com', description: '英国顶级建筑可视化工作室，极致的光影与氛围。' },
      { id: 'c10', category: '配色、平面与图解', title: 'MIR', url: 'https://mir.no', description: '挪威传奇效果图工作室，以其独特的自然感与艺术性著称。' },
      { id: 'u1', category: '实用工具', title: 'PDF24', url: 'https://tools.pdf24.org', description: '免费且易用的在线PDF处理工具箱。' },
      { id: 'u2', category: '实用工具', title: 'iLovePDF', url: 'https://www.ilovepdf.com', description: '全能的PDF在线转换和编辑工具。' },
      { id: 'u3', category: '实用工具', title: 'FreeMyPDF', url: 'https://www.freemypdf.com', description: '在线移除PDF文件的密码和编辑限制。' },
      { id: 'u4', category: '实用工具', title: 'Palette.fm', url: 'https://palette.fm', description: 'AI黑白照片上色工具，效果惊艳。' },
      { id: 'u5', category: '实用工具', title: 'BgSub', url: 'https://bgsub.cn', description: '基于AI的自动消除背景工具，无需上传图片。' },
      { id: 'u6', category: '实用工具', title: '扣扣图', url: 'https://www.koukoutu.com', description: '免费在线抠图工具。' }
    ];
  }

  private seedReadingsData() {
    const rawData: Reading[] = [
      { title: '建筑: 形式、空间和秩序', author: '程大锦', publisher: '天津大学出版社', description: '建筑设计基础语汇的经典图解入门书。', tags: ['建筑设计'], journalLevel: null, identifier: '9787561860793', detailContent: '程大锦所著的《建筑：形式、空间和秩序》是广受推崇的建筑设计基础读物，通过丰富的案例和图示阐述建筑构成的原则与规律。书中从构成要素出发，讲解形式、空间、秩序如何结合应用于设计，对建筑学生理解设计语言有重要帮助。' },
      { title: '美国大城市的死与生', author: '[加]简·雅各布斯', publisher: '译林出版社', description: '批判当下城市规划理论的经典著作。', tags: ['城市规划', '建筑理论'], journalLevel: null, identifier: '9787544740586', detailContent: '简·雅各布斯的《美国大城市的死与生》是一部经典城市规划批评著作，反对20世纪中期的规划思潮。她通过对纽约街区的实地观察，阐述了“街区综合功能”和“步行环境”对城市活力的重要性。书中主张混合用途、街道活跃与社区参与，揭示了现代主义规划的弊端，对后世城市设计产生深远影响。' },
      { title: '明日的田园城市', author: '[英]埃比尼泽·霍华德', publisher: '商务印书馆', description: '具有世界影响力的田园城市经典。', tags: ['城市规划', '建筑理论'], journalLevel: null, identifier: '9787100072250', detailContent: '霍华德的《明日的田园城市》倡导“田园城市”理念，即在城市与乡村之间建立自给自足的小城市，兼具自然环境和现代设施。该书是1898年出版的经典作品，首次系统提出花园城市模式，通过环形绿带分隔城市与工业区，成为全球城市规划史上的重要里程碑。' },
      { title: '看不见的城市', author: '[意]伊塔洛·卡尔维诺', publisher: '译林出版社', description: '卡尔维诺笔下描绘想象城市的代表作。', tags: ['建筑文化', '建筑理论'], journalLevel: null, identifier: '9787544722278', detailContent: '卡尔维诺的《看不见的城市》是意大利当代作家用文学手法描写城市的奇幻作品。书中主人公马可·波罗向忽必烈大汗讲述他见过的虚构城市，诸如“欲望之城”、“记忆之城”等，每个城市都蕴含哲理。这本书通过丰富想象探讨了人类对城市空间和意义的感知，语言诗意，是建筑师和城市规划者启发思考城市本质的经典读物。' },
      { title: '场所精神: 迈向建筑现象学', author: '[挪]诺伯舒兹', publisher: '华中科技大学出版社', description: '将建筑视为生活情境具现的建筑理论著作。', tags: ['建筑理论', '建筑文化'], journalLevel: null, identifier: '9787560960791', detailContent: '挪威建筑师Christian Norberg-Schulz的《场所精神》提出建筑应体现“地域精神”（Genius Loci）的理念。他主张建筑设计要关注人们对环境的体验和认同，将建筑与特定场所的文化、历史结合。该书推动了建筑现象学思潮，成为理解建筑与环境关系的重要理论基础。' },
      { title: '城市意象', author: '[美]凯文·林奇', publisher: '华夏出版社', description: '城市规划经典,提出城市意象五大要素。', tags: ['城市规划', '建筑理论'], journalLevel: null, identifier: '9787508024271', detailContent: '凯文·林奇的《城市意象》通过实证研究提出了构成城市形象的五个要素：道路、边界、区域、节点、地标。他认为城市形象是个人心理地图的总和，分析这些要素如何帮助居民识别城市并产生归属感。该书1960年出版后影响深远，为城市设计和环境心理学提供了重要参考。' },
      { title: '建筑空间组合论', author: '彭一刚', publisher: '中国建筑工业出版社', description: '系统阐述建筑构图及空间组合原理。', tags: ['建筑设计', '建筑理论'], journalLevel: null, identifier: '9787112100323', detailContent: '本书从“空间组合”的角度系统阐述建筑构图原理。书中运用辩证唯物主义分析建筑形态与功能的关系，讲解室内空间、室外空间及建筑群的构成规则，并结合实例分析空间组织的方法。它强调空间在建筑形态设计中的主导作用，为设计实践提供了理论指导。' },
      { title: '城市建筑学', author: '[意]阿尔多·罗西', publisher: '中国建筑工业出版社', description: '罗西1966年著作,对现代城市建筑运动批判。', tags: ['建筑理论', '城市规划'], journalLevel: null, identifier: '9787112083985', detailContent: '阿尔多·罗西的《城市建筑学》是1966年出版的重要著作，基于他的演讲稿集成而成。罗西在书中提出城市是一种历史的集体建筑记忆，探讨城市元素（如街道、广场、建筑形象）的集体记忆功能。他批判现代主义城市规划忽视历史连续性，主张从历史与集体记忆角度分析城市，是后现代城市理论的重要文献。' },
      { title: '外部空间设计', author: '[日]芦原义信', publisher: '江苏凤凰文艺出版社', description: '对比意日外部空间,提出积极/消极空间概念。', tags: ['建筑设计', '建筑文化'], journalLevel: null, identifier: '9787559403643', detailContent: '日本建筑师芦原义信的《外部空间设计》比较研究了意大利和日本的户外空间设计。书中提出“正负空间”、“加法减法空间”等概念，分析庭院、广场、街道空间的设计原理。通过丰富的案例和图示，该书总结了室外空间对流动和静谧氛围的营造方法，为城市公共空间和庭院设计提供了宝贵经验。' },
      { title: '外国建筑史', author: '陈志华', publisher: '中国建筑工业出版社', description: '系统介绍19世纪末前外国建筑的发展脉络。', tags: ['高校教材', '建筑史'], journalLevel: null, identifier: '9787112112937', detailContent: '陈志华主编的《外国建筑史》是国内高校建筑教材，系统梳理了19世纪末以前的世界建筑历史。书中涵盖原始社会建筑、埃及、希腊、罗马及中世纪、文艺复兴时期，以及欧洲近现代建筑。内容包括不同文明和风格的重要建筑和发展脉络，对外国建筑史进行了扼要而全面的介绍。' },
      { title: '中国建筑图解词典', author: '王其钧', publisher: '机械工业出版社', description: '中国古建筑名词的图解词典型工具书。', tags: ['专业工具', '建筑史'], journalLevel: null, identifier: '9787111670957', detailContent: '王其钧的《中国建筑图解词典》是一部图文并茂的参考书。全书收录千余条中国古典建筑专业术语（如梁柱、斗拱、屋顶样式等），并配以手绘插图和说明。它帮助读者快速了解中国传统建筑的构件名称及含义，是学习和研究中国建筑细部的实用工具。' },
      { title: '中国园林图解词典', author: '王其钧', publisher: '机械工业出版社', description: '中国园林名词图解词典。', tags: ['专业工具', '建筑史'], journalLevel: null, identifier: '9787111670933', detailContent: '此词典由王其钧编著，详解中国古典园林建筑与景观术语。约700多个词条涵盖亭台楼阁、园路桥廊、山石布置、水系等内容，并配以手绘图和实景照片。本书旨在让读者直观认识传统园林的元素与美学，学习中国园林的设计语言。' },
      { title: '西方建筑图解词典', author: '王其钧', publisher: '机械工业出版社', description: '西方建筑名词图解词典。', tags: ['专业工具', '建筑史'], journalLevel: null, identifier: '9787111634119', detailContent: '王其钧的《西方建筑图解词典》收录了约1000个西方建筑术语，涵盖古埃及、希腊、罗马、拜占庭、哥特、文艺复兴、巴洛克等多种风格。每个词条均配插图说明，对西方建筑的构造、形式和风格特征进行详细解读，是学习西方建筑史和术语的重要工具。' },
      { title: '古建筑测绘学', author: '林源', publisher: '中国建筑工业出版社', description: '系统介绍古建筑测绘方法和内容的指南。', tags: ['专业工具', '建筑史'], journalLevel: null, identifier: '9787112055173', detailContent: '《古建筑测绘学》总结了国内古建筑测绘教学和研究经验。全书系统介绍古建筑测绘的环节、程序与方法，包括仪器使用、手稿制图、摄影测量、结构分析等。此外讨论了古建筑年代鉴定与价值评估等问题，配有大量实测插图。本书是古建筑测绘与保护领域的指导性教材。' },
      { title: '古建筑测绘', author: '王其亨', publisher: '中国建筑工业出版社', description: '包括古建筑测绘基本理论、测量方法及新技术应用的教材。', tags: ['专业工具', '高校教材'], journalLevel: null, identifier: '9787112085453', detailContent: '王其亨主编的《古建筑测绘》属于高校的建筑学系列教材，用于介绍古建筑测绘实践与技术。书中讲解了测绘准备工作、传统测绘方法、摄影测量、变形监测等，还涵盖GPS、三维扫描等现代技术应用。通过实例案例分析和法规说明，为古建筑文物调查与保护中的测绘工作提供了全面指导。' },
      { title: '中国古建筑测绘十年', author: '', publisher: '清华大学出版社', description: '清华大学建筑学院2000-2010年古建筑测绘成果集。', tags: ['专业工具', '建筑史'], journalLevel: null, identifier: '9787302257660', detailContent: '此书是清华大学建筑学院2000－2010年古建筑测绘成果的汇编。书中收录了故宫、清西陵、佛寺、名园等多处古建筑的测绘图纸。详细的平面、立面和结构图展示了传统建筑的精细构造，是中国古建筑测绘领域的珍贵资料集。' },
      { title: '阿尔瓦·阿尔托全集', author: '', publisher: '中国建筑工业出版社', description: '阿尔托主要作品全集,含图文资料。', tags: ['建筑史', '作品集'], journalLevel: null, identifier: '9787112091119', detailContent: '《阿尔瓦·阿尔托全集》为对芬兰大师阿尔瓦·阿尔托（Alvar Aalto）作品的系统汇编，以三卷本形式刊行，由Karl Fleig 编纂、并由阿尔托的家属与研究者组织资料。 \n第一卷（1922–1962）侧重阿尔托的早期与成熟期作品，收录大量场景摄影、平面与立面图、设计草图与家具、室内与产品设计稿，旨在呈现他从北欧古典主义向有机现代主义演进的形成脉络； \n第二卷（1963–1970）汇集其成熟期至晚期的重要公共工程与国际项目，补充工作过程文献、详尽的施工图与项目说明，体现其在公共建筑、文化建筑与城市尺度上的实践； \n第三卷（1971–1976）则专注其最后阶段的项目与未竟构想，包含晚年完成的代表作、后期方案、以及对项目收尾与遗稿的整理。 \n三卷并重图版与说明，力求以原始图纸、摄影与编辑注释忠实再现阿尔托的设计语言与工作方法，对研究阿尔托整体创作、家具与建筑一体化理念具有重要参考价值。' },
      { title: '建筑概念: 红不只是一种颜色', author: '[法]伯纳德·屈米', publisher: '电子工业出版社', description: '屈米30年建筑探索的图文回顾著作。', tags: ['建筑理论', '建筑文化'], journalLevel: null, identifier: '9787121236037', detailContent: '《建筑概念：红不只是一种颜色》是伯纳德·屈米（Bernard Tschumi）以自述与文献并置的方式回顾其建筑实践与理论的大部头专著，书中以“五个部分”编排，交织回忆、理论论述、假想方案与已建工程，既是作品集也是理论论文集，意在把“概念”（concept）置于建筑判断的中心。 \n屈米在书中系统阐述了几条核心命题：一是“空间（space）与事件（event）同时性”——建筑不只是静态物体，而是承载和触发社会活动与行为的场域；二是把“程序／事件”作为等同于形式考量的设计要素，提出通过事件编排来生成建筑意义；三是通过图像、剧本式的“转录”（如《曼哈顿转录本》）与符号记号的运用，建立一种以叙事和记号化为核心的设计语言（即以“叙事—记号”重新塑造建筑书写法）。这些观念是书中贯穿的理论线索，并在他的代表作——例如巴黎拉·维莱特公园的“红色方亭／follies”等项目——中被具体化：这里的“红”被作为概念标记而非单纯色彩使用，用以召聚事件并指示场所的社会含义。 \n整本书以图文与文本交错的叙述策略，既回顾了屈米从概念艺术啓发到大尺度公共工程的演进，也为理解其“以概念驱动设计”的方法论提供了丰富的一手材料，是想深入把握屈米理论（尤其是“事件—空间”范式）与实践案例的读者不可或缺的参考。' },
      { title: '城市规划原理', author: '吴志强, 李德华', publisher: '中国建筑工业出版社', description: '系统阐述城乡规划基本原理与设计方法的教材。', tags: ['高校教材', '城市规划'], journalLevel: null, identifier: '9787112124152', detailContent: '《城市规划原理》是规划学入门教材，系统讲述城乡规划的基本理论和设计方法。内容包括城市化过程、规划思想演变、城市分析与预测、总体规划编制等。书中以现代城市发展为背景，结合中国国情阐释规划原则，适合规划专业学生学习城市规划基础。' },
      { title: '外国建筑历史图说', author: '罗小未', publisher: '同济大学出版社', description: '系统回顾从原始至18世纪的国外建筑历史。', tags: ['高校教材', '建筑史'], journalLevel: null, identifier: '9787560811154', detailContent: '罗小未的《外国建筑历史图说》用图文并茂的形式介绍全球建筑史。书中从史前建筑到18世纪结束，跨越非洲、美洲、欧洲、亚洲等地区，讲述各时代具有代表性的建筑风格和类型。丰富的插图配合文字，帮助读者直观了解不同文明建筑演进，是建筑史学习的参考读物。' },
      { title: '中国古代建筑历史图说', author: '侯幼彬, 李婉贞', publisher: '中国建筑工业出版社', description: '按时代脉络介绍中国古代建筑发展历程。', tags: ['建筑史', '专业工具'], journalLevel: null, identifier: '9787112052202', detailContent: '此书以通俗图说方式编排，按照中国古代建筑体系的历史脉络阐述建筑发展。从原始社会到夏商周，再至秦汉、隋唐、宋元、明清，书中每一时期的重要城市建筑和代表作都用图文详细解读。' },
      { title: 'Fundamentals of Building Construction: Materials and Methods', author: 'Edward Allen', publisher: 'Wiley', description: '结构教育的重要经典教材。', tags: ['高校教材', '专业工具'], journalLevel: null, identifier: '9781119597278', detailContent: 'Allen与Iano合著的《建筑构造基础：材料与方法》系统介绍建筑工程材料性能与施工工艺。书中涵盖各种结构系统、围护结构以及相关规范、可持续技术等内容。它以清晰图表讲解材料和构造原理，被广泛用作建筑学、建筑工程的基础教材和参考书。目前已出版到第七版' },
      { title: '建筑学教程', author: '[荷]赫曼·赫茨伯格', publisher: '天津大学出版社', description: '荷兰结构主义教育与设计理论教程。', tags: ['建筑教育', '建筑理论'], journalLevel: null, identifier: '9780061817038', detailContent: '荷兰建筑师赫茨伯格的《建筑学教程：设计原理》等著作，属于结构主义设计学派代表作。他书中深入分析建筑结构与空间的关系，探讨公共空间与私密空间的转换、留白与生成等设计原则。赫茨伯格认为建筑设计应着重于场所和环境的连续性，这些书籍被多国译介，是建筑教育的重要参考。' },
      { title: '交往与空间', author: '[丹麦]扬·盖尔', publisher: '中国建筑工业出版社', description: '从人的活动需求角度分析城市公共空间质量的经典著作。', tags: ['建筑设计', '城市规划'], journalLevel: null, identifier: '9787112052028', detailContent: '丹麦建筑师Jan Gehl（杨·盖尔）的《交往与空间》（原名《屋宇之间的生活》）关注城市公共空间的人性化设计。书中以北欧为例，分析吸引人们到户外活动的环境条件，如适宜的尺度、人行路线、座椅和绿地配置等。1971年首版后，该书对城市步行空间设计和以人为本的规划理念产生了深远影响。' },
      { title: '建筑语汇', author: '[美]爱德华·T·怀特', publisher: '大连理工大学出版社', description: '探讨建筑创作普遍规律的设计词典。', tags: ['专业工具', '建筑理论'], journalLevel: null, identifier: '9787561118894', detailContent: '本书是一本面向建筑设计实践的构想参考手册，聚焦于“构想”这一建筑师的核心表达方式。作者以大量示意图配以简要文字，将建筑设计中常见的问题系统化：先将设计议题分为五大类，再细分为106个小专题，每个专题都用一页或数页的示意图与说明展示可行的构想路径。 \n全书收录上千幅构想示意图，形式简洁而具有可操作性，便于读者模仿、发展、组合或改良为自己的设计语言。 \n对学生而言，本书既是激发创意的素材库，也是训练用图思维与快速表达构想能力的练功册；对职业设计者，它提供了高效的视觉化思考模板，帮助在方案阶段高效交流。' },
      { title: '走向新建筑', author: '[法]勒·柯布西耶', publisher: '商务印书馆', description: '阐述住宅是居住机器理念的现代建筑经典。', tags: ['建筑理论', '建筑设计'], journalLevel: null, identifier: '9787100198707', detailContent: '勒·柯布西耶的《走向新建筑》（Vers une Architecture, 1923）是现代主义建筑宣言性著作。书中猛烈抨击19世纪末的复古和装饰风格，提倡“房子是居住的机器”，强调功能主导形式。提出“五点构造”（支柱、自由平面、自由立面、横向窗、屋顶花园）等现代建筑原则，对20世纪建筑风格及教育影响深远。 \n值得一提的是，这部著作的中文通行书名以及“新”字的强调并非完全源自法文原题。1927年，英国艺术家兼建筑师弗雷德里克·艾切尔斯（Frederick Etchells）将该书译为英文并命名为 Towards a New Architecture，这一英文书名在英语语境中迅速传播，从而影响了全球对柯布思想的接受与表述；中文中《走向新建筑》一名在很大程度上承接了这一英语传统。文本自身也带有复杂的历史语境：柯布许多章节最初发表于前卫刊物《L’Esprit Nouveau》，文中既有面向未来的宣言性论述（“走向”），也常以 rappel（召回、提醒或回顾）之类措辞呼唤对某些传统原则的重新关注。因此，把该书理解为单纯的“全盘否定传统、完全崇新”的宣言，是非常片面的，且不足以囊括本书在宣示现代性的同时，还有对过去经验的选择性召回与再阐释。' },
      { title: '建筑十书', author: '[古罗马]维特鲁威', publisher: '北京大学出版社', description: '古罗马建筑经典,建筑理论与营建手册之源。(Wikipedia)', tags: ['建筑史', '建筑理论'], journalLevel: null, identifier: '9787301197875', detailContent: '古罗马建筑师维特鲁威的《建筑十书》是现存最早的建筑理论专著。全书分十卷，论述了古希腊罗马建筑原则、建筑材料与施工技术、建筑类型与比例法则等。它为文艺复兴时期的建筑师提供了理论基础，对后世建筑理论体系产生了重要影响，被誉为建筑学经典之作。' },
      { title: '建筑师的20岁', author: '东京大学工学部', publisher: '清华大学出版社', description: '安藤邀请多位建筑师讲述青年求学经历的访谈集。', tags: ['建筑教育', '建筑文化'], journalLevel: null, identifier: '9787302111269', detailContent: '该书汇集了东京大学建筑系教授安藤忠雄于1998年举办的公开讲座访谈内容。内容包括六位国际知名建筑师（如贝聿铭、谢里宁、弗兰克·盖里等）讲述自己学习、成长与实践的经历。书中真实记录了大师们年轻时的奋斗历程和创作心路，为建筑学生呈现前辈建筑师的成长经历与学术启蒙。' },
      { title: '中国建筑史', author: '梁思成', publisher: '生活·读书·新知三联书店', description: '梁思成研究中国古建筑的开创之作,系统梳理建筑发展脉络。', tags: ['建筑史', '建筑教育', '建筑理论'], journalLevel: null, identifier: '9787108033536', detailContent: '梁思成编著的《中国建筑史》是首部由中国学者撰写的系统建筑史著作。基于对数千处古建筑的实地调查，梁思成提出“结构技术—环境思想”研究体系。全书以历史顺序介绍各朝代建筑特色和施工技术，资料丰富翔实，为研究中国传统建筑提供了权威基础。' },
      { title: '图像中国建筑史', author: '梁思成', publisher: '生活·读书·新知三联书店', description: '梁思成著作,图文并茂阐述中国古建筑“有机”结构。', tags: ['建筑史', '建筑教育', '建筑理论'], journalLevel: null, identifier: '9787108032379', detailContent: '该书是梁思成面向西方读者撰写的《中国建筑史图录》（英文版）对应的中文译本。全书通过大量照片和结构示意图，生动讲解中国古代木构建筑三千多年的演变。内容涵盖原始社会至宋代各主要建筑类型，被誉为首部图像化的中国建筑史读本。' },
      { title: '中国建筑史', author: '潘谷西', publisher: '中国建筑工业出版社', description: '体系阐述中国建筑发展脉络的教材,图文并茂。', tags: ['高校教材', '建筑史'], journalLevel: null, identifier: '9787112175895', detailContent: '潘谷西的《中国建筑史》将内容分为古代、近代、现代三卷。古代部分系统介绍了木构建筑体系和中国传统工法，近现代部分梳理了改革开放以来建筑发展历程。书中配有大量照片和地图，是国内高校建筑史教学的常用教材。' },
      { title: '公共建筑设计原理', author: '张文忠', publisher: '中国建筑工业出版社', description: '系统论述公共建筑设计原则与方法的教材。', tags: ['高校教材', '建筑设计'], journalLevel: null, identifier: '9787112252770', detailContent: '本书系统分析了各种公共建筑的设计要点。从总体形象、功能布局到细部造型艺术，全书分门别类讨论交通枢纽、商业建筑、展览馆、剧院等不同类型建筑的设计原则，是国内高校常用的建筑设计教材。' },
      { title: '建筑初步', author: '田学哲, 郭逊', publisher: '中国建筑工业出版社', description: '本科建筑设计初步教材,介绍建筑形式与构造基础。', tags: ['高校教材', '建筑设计'], journalLevel: null, identifier: '9787112117574', detailContent: '这是面向建筑新生的入门教材，内容涵盖建筑学基础概念、构件与空间、传统建筑知识、设计表达技法、形态构成等。' },
      { title: '华夏意匠', author: '李允鉌', publisher: '天津大学出版社', description: '总结中国古典建筑设计原理,肯定中国传统建筑特色。', tags: ['建筑理论', '建筑史'], journalLevel: null, identifier: '9787561841976', detailContent: '李允鉌的《华夏意匠》分析了中国古典建筑的设计原理与传统建筑美学。作者通过多年研究总结中国传统木构架体系的特色，与西方建筑对比论述，论证中国传统建筑体系的独创性和优越性。书中强调传统建筑设计的“意匠”精神，对传统建筑理论研究具有开创意义。' },
      { title: '建筑设计基础教程', author: '洛兰·法雷利', publisher: '大连理工大学出版社（中文版）', description: '以场地与人的体验为起点，以范例阐释设计方法与空间表达的入门佳作。', tags: ['建筑教育', '建筑设计'], journalLevel: null, identifier: '9787561179901', detailContent: '洛兰·法雷利（Lorraine Farrelly）的《建筑设计基础教程》是一部面向本科教学与初学者的入门读本，旨在把建筑设计的思维过程、表现方法与实践技法串联起来。 \n书中从“构想与概念”出发，强调场地与环境分析、功能与使用者研究、以及如何通过图示（示意图、剖面、轴测、透视、拼贴与影像蒙太奇等）把想法迅速且有效地表达出来；同时讨论形式生成、材料与构造的基本原则，并配以案例、练习与学生作品作为教学示例，帮助读者把抽象概念落到方案实践中。新版在保留基础框架的同时增加了若干当代案例与练习题，强化“以图为思”的训练与设计表达能力的培养。 \n与建筑学常用的入门教材相较而言，本书更加重视把示意图与快速视觉化作为思考的工具，训练学生用图像进行概念生成。并引入拼贴、蒙太奇与多种表现媒介来扩展设计语言，鼓励跨学科实验。强烈建议大一到大二，甚至大三的同学补充阅读，一定能够从本书中学到一些课堂上学不到的设计思考方法。' },
      { title: '剖面手册', author: '[美]保罗·刘易斯等', publisher: '江苏科学技术出版社', description: '通过建筑案例展示剖面分析方法。', tags: ['专业工具', '建筑设计'], journalLevel: null, identifier: '9787553785479', detailContent: '《剖面手册》(Manual of Section)由美国建筑师Paul Lewis等人编著，是探索剖面图在建筑设计中作用的专著。书中收录了63个详细剖面透视图，强调通过剖面思考建筑可以揭示场地与结构的关系。该书创新地将剖面图引入建筑表达，展示了剖面作为设计和研究工具的重要价值。' },
      { title: '建筑构造图解', author: '胡向磊', publisher: '中国建筑工业出版社', description: '针对初学者,图文结合地系统介绍建筑构造基础知识。', tags: ['高校教材', '专业工具'], journalLevel: null, identifier: '9787112230440', detailContent: '本书是建筑学专业的入门教材，以清晰插图结合简练文字介绍建筑构造基础。全书共11章，内容包括构造要素、设计影响因素、构造节点、实例分析等。' },
      { title: '外国近现代建筑史', author: '罗小未', publisher: '中国建筑工业出版社', description: '系统介绍工业革命后到现代的外国建筑文化与思潮。', tags: ['高校教材', '建筑史'], journalLevel: null, identifier: '9787112223640', detailContent: '《外国近现代建筑史》是高等教育教材，全面论述了自18世纪中叶工业革命以来两百多年的西方建筑发展。书中按历史阶段介绍古典复兴、浪漫主义、现代建筑运动、二战后建筑活动及后现代思潮等。通过丰富的知识体系和史料，帮助读者了解近现代国外建筑文化的演变过程。' },
      { title: '建筑物理', author: '刘加平', publisher: '中国建筑工业出版社', description: '涵盖建筑热工、光学、声学等基础原理与应用实例的综合教材。', tags: ['高校教材', '专业工具'], journalLevel: null, identifier: '9787112108510', detailContent: '刘加平主编的《建筑物理》是建筑学的专业课程教材，内容涵盖建筑热工学、声学、光学、气候物理等基础理论。书中重点讨论建筑围护结构的热湿性能、室内环境舒适度、建筑节能设计原理等。' },
      { title: '场地设计精编学习手册', author: '魏子东', publisher: '阳光出版社', description: '系统介绍场地设计方法,包括道路、绿化、竖向设计等。', tags: ['高校教材', '建筑设计'], journalLevel: null, identifier: '9787552575965', detailContent: '本书全面介绍场地设计的方法。书中内容包括地形与场地分析、总平面布置、场地道路与广场设计、竖向规划、绿化设计、管线综合布置等。通过图示和案例，该书指导读者掌握如何从整体到细节进行场地设计，是景观与建筑专业的实用参考。' },
      { title: '建筑力学', author: '周国瑾', publisher: '同济大学出版社', description: '综合传统理论力学、材料力学与结构力学内容的力学教材。', tags: ['高校教材', '专业工具'], journalLevel: null, identifier: '9787560846651', detailContent: '本书是建筑类专业基础课程教材，内容涵盖结构力学基本理论。全书16章，介绍平面力系与平衡、轴向受拉压、扭转、静定结构内力分析、梁的应力与变形、构件强度计算以及压杆稳定等。' },
      { title: '西洋建筑发展史话', author: '傅朝卿', publisher: '中国建筑工业出版社', description: '全面介绍现代化前西方建筑发展史,涵盖古典至近代各时期建筑。', tags: ['建筑史', '建筑教育', '建筑理论'], journalLevel: null, identifier: '9787112071067', detailContent: '傅朝卿的《西洋建筑发展史话》梳理了现代化前的西方建筑发展。书中自古代埃及、西亚、希腊罗马建筑，讲到中世纪拜占庭、哥特，再到文艺复兴、巴洛克、以及新古典主义和工业革命时期。作者采用平易语言概括建筑风格演变脉络，是中国读者了解西方建筑史的通俗读物。' },
      { title: '室内设计原理', author: '陈易', publisher: '中国建筑工业出版社', description: '系统介绍室内设计的概念、流程与原则,内容全面系统。', tags: ['高校教材', '建筑设计'], journalLevel: null, identifier: '9787112085705', detailContent: '本书是建筑类专业基础课程教材，阐述了室内设计的基本概念、设计过程与评价原则。书中介绍室内设计的发展演变、基本原则和空间造型要素；并进一步讨论界面装饰、部件设计、家具布局、特殊人群需求等内容。' },
      { title: '中国古代建筑史', author: '刘敦桢', publisher: '中国建筑工业出版社', description: '系统简述中国古代建筑发展成就,并辅以丰富资料与图像。', tags: ['高校教材', '建筑史'], journalLevel: null, identifier: '9787112019298', detailContent: '刘敦桢主编的《中国古代建筑史》是简要系统论述中国古代建筑发展的专著。书中按时代顺序介绍了原始社会、夏商周、秦汉到唐宋明清各阶段的建筑成就，并引用大量文献与实物记录。文字简练且配图丰富，许多资料首次公开，对学术研究和教学具有重要参考价值。' },
      { title: '易学易用建筑模型制作手册', author: '[日]建筑知识', publisher: '上海科学技术出版社', description: '漫画式讲解建筑模型制作的工具与材料。', tags: ['模型制作', '专业工具'], journalLevel: null, identifier: '9787547824931', detailContent: '本书由日本专业建筑期刊《建筑知识》“模型特辑”增编而成，采用漫画式手把手讲解建筑模型制作。书中详细介绍模型制作所用工具、材料，构件设计与制作技巧，整组模型的拼装方法以及模型的拍摄和照明展示技巧。许多知名日本建筑师工作室（如安藤忠雄、隈研吾等）的模型制作秘技也在书中公开。内容生动实用，非常适合建筑学生和初学者学习模型制作。' },
      { title: '国际环境设计精品教程: 建筑模型制作', author: '[日]远藤义则', publisher: '中国青年出版社', description: '全面介绍建筑模型制作技巧,强调模型作为设计工具的作用。', tags: ['模型制作', '专业工具'], journalLevel: null, identifier: '9787515318653', detailContent: '远藤义则的《建筑模型制作》是“中国青年”系列丛书之一，图文并茂地介绍建筑模型制作方法。书中通过丰富的照片和插图，展示模型制作的基本技巧、工具和材料使用，以及通过制作模型验证与深化设计构思的过程。' },
      { title: '小菜场上的家', author: '王方戟等', publisher: '同济大学出版社', description: '记录同济大学建筑设计课程的教学过程,融合实践与创新。', tags: ['建筑教育', '建筑设计'], journalLevel: null, identifier: '9787560853802', detailContent: '该书记录了同济大学建筑学实验班的教学实践。以“城市微更新”为课题，书中图文并茂地呈现了学生的设计作业、教师点评和课堂讨论等教学实况。全书生动展示了教学现场和师生互动，反映了当代中国建筑教育的创新模式和实践过程，是建筑教育研究的有益案例。' },
      { title: '营造天书', author: '王南', publisher: '新星出版社', description: '解读《营造法式》与梁思成研究中国古建筑的著作。', tags: ['建筑史', '建筑理论'], journalLevel: null, identifier: '9787513323901', detailContent: '清华大学王南教授依据梁思成等前辈建筑师的实地考察经历，撰写了《营造天书》。书中以日本风之丘礼堂（斋场）的建筑为引子，介绍宋、辽、金时期的木结构建筑，揭秘《营造法式》中的建筑构造奥秘。通过展示梁思成绘制的测绘图和实景照片，书中展现了中国古建筑的精妙设计与营造技艺，传承了营造学社的学术精神。' },
      { title: '11堂现代建筑课: 课堂上学不到的当代建筑巴黎散步故事', author: '[韩]权善英', publisher: '麦浩斯', description: '跟随作者开启11场巴黎建筑漫步，用插画与故事带你读懂大师设计，发现空间美学的无限魅力。', tags: ['建筑教育', '建筑文化'], journalLevel: null, identifier: '9789865680145', detailContent: '这不仅是一本关于巴黎建筑的旅行随笔，更是一份专门为建筑初学者准备的入门指南。韩国建筑师权善英通过主人公Sun的视角，在巴黎街头展开了11场跨越时空的建筑漫步，将那些原本锁在厚重教科书里的硬核理论，转化为呼吸感十足的城市故事。从萨伏伊别墅的纯净几何到阿拉伯世界博物馆的光影变幻，书中巧妙地捕捉了勒·柯布西耶、让·努维尔等大师的灵感瞬间，引导读者透过空间、光线与材料的交织，看清建筑是如何塑造并影响人类生活的。 \n作者深知初学者在面对建筑学时的彷徨与迷茫，因此特意采用了温馨的手绘插画与对话式的轻松语调，让复杂的空间概念在谈笑间变得通俗易懂。她并没有急于灌输专业术语，而是诚恳地邀请每一位读者抛开刻板的“课本印象”，转而用一种全新的、充满好奇心的视野去重新观察身边的世界。在这种细腻的引导下，建筑不再是冰冷的钢筋混凝土堆砌，而成了可以被阅读、被感知、甚至被热爱的生活艺术，让那些曾经熟视无睹的构造散发出全新的趣味。 \n无论你是对现代设计充满好奇的旅行者，还是渴望提升空间审美、却苦于无处下手的初学者，这本书都能为你推开那扇看似沉重大门。在阅读本书的时候，你一定会被巴黎现代建筑的浪漫气质所吸引，它带给读者的不仅是关于巴黎地标的知识，更是一份开启个人审美觉醒的礼物。正如作者在前言中所寄予的厚望，读完此书，你将获得一种全新的视野，在未来的日常生活中也能随时随地展开一场属于自己的、愉快的建筑探索之旅。' },
      { title: '最后的人间场·建筑的转渡', author: '徐纯一', publisher: '麦浩斯', description: '全球生死主题建筑集,探讨建筑如何抚慰生离死别。', tags: ['建筑文化', '建筑理论'], journalLevel: null, identifier: '9789865802400', detailContent: '徐纯一建筑师的《最后的人间场·建筑的转渡》是一部跨越了生死边界的深刻作品，是世界首部从建筑角度论述生命终结空间的专著。他以日本风之丘斋场为起点，历经十多年考察欧洲各地，共收录28个典型建筑和300余张照片，将原本被大众视为禁忌的火葬场、墓园和纪念碑，重新定义为承载记忆、连接生者与逝者的“转渡”空间。在徐纯一的笔下，这些建筑不再是冰冷的钢筋混凝土，而是能够与灵魂对话的生命容器。 \n书中从现象学和建筑学的双重维度出发，深入探讨了设计师如何利用光影的明暗交织、材料的粗犷质感以及空间的流线组织，来消解死亡带来的恐惧感与压抑感。作者认为，一个卓越的祭祀或安葬空间应当具备安抚心灵的力量，让生者在肃穆的氛围中获得慰藉，在沉默的建筑结构中找到情感的出口。 \n通过对这些大师级作品的细腻解读，徐纯一不仅展现了现代建筑在处理极端情感命题时的精湛技巧，更引导读者重新审视生命的尊严与终极归宿的价值。这不仅是一本专业的建筑学专著，更是一场关于生命、时间和永恒的哲学沉思，带领我们理解建筑如何在那“最后的人间场”中，温柔地完成生命最后的谢幕。' },
      { title: '赤脚建筑师: 绿色建筑手册', author: '[荷]约翰·范伦根', publisher: '华中科技大学出版社', description: '介绍绿色建筑设计、材料与实施方法。', tags: ['绿色建筑', '建筑实践'], journalLevel: null, identifier: '9787568077675', detailContent: '约翰·范伦根（Johan van Lengen）撰写的《赤脚建筑师：绿色建筑手册》是一部享誉全球的可持续建筑经典，自1982年在墨西哥首次出版以来，已在拉美及欧美地区产生深远影响。书名“赤脚”一词向古代工匠致敬，寓意回归亲手劳作的建筑本源，旨在为资源有限、渴望环保居所的人们提供一套摆脱资本叙事、实现诗意栖居的行动纲领。作为联合国前工作人员，范伦根结合多年实地考察经验，摒弃了高深的建筑理论，转而以大量浅显易懂、手绘风格的图像为核心，全面覆盖了从选址、气候应对到天然材料（如土、竹、木、剑麻等）应用的各类实操技术。 \n书中强调低成本与可持续性，详细解析了基础、墙体、屋顶等施工环节，并涉及采暖、供水及小型能源制造等现代生活必备系统。作者倡导一种“两全其美”的平衡理念：既尊重乡土技术的传统智慧，又不排斥现代科技的便利。通过这种去门槛化的表达，本书鼓励人们重拾祖辈遗忘的手艺，在动手实践中反抗异化的生活方式，构建人与自然和谐共生的生活环境。' },
      { title: '梁思成的作业', author: '梁思成', publisher: '中国青年出版社', description: '收录梁思成学习时的作业笔记与手绘。', tags: ['建筑史', '建筑教育'], journalLevel: null, identifier: '9787515353845', detailContent: '该书汇集了梁思成1925－1926年在美国宾夕法尼亚大学建筑史课的课堂笔记和作业。全书分为上课笔记、建筑手绘图和课后摘录三部分，详实记录他学习西方建筑史时所听讲授内容和自读笔记。其中引用了大量当年参考书的文字和图示，并附建筑实例的中英文对照表。此书真实展现了中国建筑学先驱的学术成长之路，为研究梁思成和建筑教育史提供了珍贵资料。' },
      { title: '赋形未来: 建筑未来史', author: '[丹麦]BIG建筑事务所', publisher: '广西师范大学出版社', description: 'BIG近年项目与未来愿景合集,兼具项目集与理论思考。', tags: ['作品集', '建筑理论'], journalLevel: null, identifier: '9787559853431', detailContent: '《赋形未来》原名《FORMGIVING》是丹麦BIG建筑事务所的代表作之一，以时间轴形式探讨建筑与未来。书中通过分析BIG十年精选项目和未来构想，用六条“演化轨迹”（制造、感知、持续、思考、修复、移动）探讨建筑如何塑造未来。结合摄影图和插图，它展示了未来气候、技术与城市发展趋势，鼓励建筑师运用设计力量主动赋形未来世界。' },
      { title: '是即是多：漫画建筑进化论', author: '[丹麦]BIG建筑事务所', publisher: '辽宁科学技术出版社', description: 'BIG的漫画式宣言体专辑,阐述事务所设计理念。', tags: ['作品集', '建筑文化'], journalLevel: null, identifier: '9787538163964', detailContent: '《是即是多》原名《Yes Is More》是BIG事务所的代表作品，以漫画形式呈现建筑设计理念。全书以幽默轻松的图文方式记录BIG的创新实践，是对“自由建筑”概念的宣言。它将建筑理论与图像结合，将复杂的建筑思想用流行文化手段表达，让读者在娱乐中理解建筑进化的思路。' },
      { title: '建筑实践', author: '', publisher: '中国建筑学会', description: '中国建筑学会会刊,聚焦建筑实践。', tags: ['期刊'], journalLevel: null, identifier: '10-1584/TU', detailContent: '《建筑实践》是中国建筑学会主办的专业期刊，刊载建筑设计案例分析、技术研究和行业动态等文章，旨在推动建筑专业学术交流与实践应用.' },
      { title: '世界建筑', author: '', publisher: '清华大学', description: '清华主办,中英双语建筑月刊。', tags: ['期刊'], journalLevel: 'T2', identifier: '11-1847/TU', detailContent: '《世界建筑》杂志聚焦国际建筑设计与理论，展示全球范围内优秀建筑项目和前沿学术，旨在介绍最新建筑思潮与实践.' },
      { title: '时代建筑', author: '', publisher: '同济大学', description: '同济主办的建筑类双月刊。', tags: ['期刊'], journalLevel: 'T3', identifier: '31-1359/TU', detailContent: '《时代建筑》由同济大学建筑与城市规划学院主办，自1984年创刊以来以“时代性、前瞻性、批判性”为特色，以“中国命题、世界眼光”为定位，持续推动当代中国建筑的学术交流与批判性讨论。' },
      { title: '建筑师', author: '', publisher: '中国建筑工业出版社', description: '理论与设计并重的建筑双月刊。', tags: ['期刊'], journalLevel: 'T2', identifier: '11-5142/TU', detailContent: '《建筑师》杂志创办于1979年，长期关注建筑理论与学术研究，记录并推动了中国当代建筑思想的发展，是国内具有重要影响力的专业刊物。' },
      { title: '城市规划', author: '', publisher: '中国城市规划学会', description: '中国城市规划学会会刊,权威期刊。', tags: ['期刊'], journalLevel: 'T1', identifier: '11-2378/TU', detailContent: '《城市规划》是城市规划学会主办的学术期刊，发表城市规划理论研究、规划案例分析和政策解读等，服务城市规划专业人士。' },
      { title: '城市规划学刊', author: '', publisher: '同济大学', description: '同济主办的学术性城市规划双月刊。', tags: ['期刊'], journalLevel: 'T1', identifier: '31-1938/TU', detailContent: '《城市规划学刊》由中国城市规划学会主办，刊登城规领域的研究论文与规划实践案例，促进城市规划理论与实践交流。' },
      { title: '建筑材料学报', author: '', publisher: '同济大学', description: '同济主办的建筑材料学术月刊。', tags: ['期刊'], journalLevel: 'T1', identifier: '31-1764/TU', detailContent: '《建筑材料学报》由教育部主管、同济大学主办，报道建筑材料领域最新科研成果和工程应用。该刊反映国内外建筑材料新理论、新产品、新工艺，面向材料科学和建筑工程技术工作者。' },
      { title: '建筑结构学报', author: '', publisher: '中国建筑学会', description: '报道建筑结构研究与工程实践。', tags: ['期刊'], journalLevel: 'T1', identifier: '11-1931/TU', detailContent: '《建筑结构学报》是建筑结构领域的权威期刊，刊登结构力学、结构设计和应用研究成果，介绍新型结构体系和耐久性研究等内容，服务结构工程师和研究者。' },
      { title: '建筑学报', author: '', publisher: '中国建筑学会', description: '中国建筑学会主办的权威学术月刊。', tags: ['期刊'], journalLevel: 'T1', identifier: '11-1930/TU', detailContent: '《建筑学报》创办于1954年，由中国建筑学会主办，是国家一级学术期刊，长期刊载高水平理论研究与重要建筑实践，全面记录新中国建筑发展的历程，在国内建筑领域具有公认的权威性与影响力。' },
      { title: '土木工程学报', author: '', publisher: '中国土木工程学会', description: '土木工程领域的综合性学术期刊。', tags: ['期刊'], journalLevel: 'T1', identifier: '11-2120/TU', detailContent: '《土木工程学报》是土木领域综合性学术刊物，内容涵盖结构工程、岩土工程、工程管理等，报道最新科研进展和工程技术应用，对土木工程人员具有指导意义。' },
      { title: '岩土工程学报', author: '', publisher: '多学会联合', description: '岩土工程学科的全国性综合期刊。', tags: ['期刊'], journalLevel: 'T1', identifier: '32-1124/TU', detailContent: '《岩土工程学报》专注地基基础与岩土工程研究，刊登勘察、设计、施工等方面成果，促进国内外学术交流和工程技术创新。' },
      { title: '中国园林', author: '', publisher: '中国风景园林学会', description: '风景园林学术研究与实践月刊。', tags: ['期刊'], journalLevel: 'T1', identifier: '11-2165/TU', detailContent: '《中国园林》杂志由林业部门主办，介绍园林设计与规划、园艺植物及园林生态技术成果，对园林景观专业人士具有参考价值。' },
      { title: '当代建筑', author: '', publisher: '哈尔滨工业大学', description: '哈工大主办的当代建筑月刊。', tags: ['期刊'], journalLevel: 'T3', identifier: '23-1610/TU', detailContent: '《当代建筑》由哈尔滨工业大学及其建筑设计研究院主办，是集出版、论坛、评奖与展览于一体的学术平台，强调理论性、科学性与实践性，多维呈现建筑创作与理论前沿成果，推动中国当代建筑的理性进步。' },
      { title: '新建筑', author: '', publisher: '华中科技大学出版社', description: '华中主办的建筑学术期刊。', tags: ['期刊'], journalLevel: 'T3', identifier: '42-1155/TU', detailContent: '《新建筑》由华中科技大学主办，1983年创刊，为双月刊，是国内建筑界的重要核心科技期刊，刊载建筑、规划、景观等领域的新理论、新作品与新方法，多次获得国家级与省级优秀期刊奖。' },
      { title: 'a+u（建筑与都市）', author: '', publisher: '华中科技大学出版社', description: '日英双语的国际建筑月刊。', tags: ['期刊'], journalLevel: null, identifier: null, detailContent: '《A+U》（Architecture and Urbanism）创办于1971年，是日本唯一以全球建筑资讯为核心的月刊，以双语出版，依托遍布百余国家的研究网络，持续报道世界建筑的重要项目、人物与趋势。' },
      { title: 'Domus', author: '', publisher: 'DOMUS中文版杂志社', description: '意大利老牌建筑设计月刊。', tags: ['期刊'], journalLevel: null, identifier: '22-1086/Z', detailContent: '《Domus》杂志于1928年在意大利创办，以“记录并推动创意演进”为使命，长期关注建筑、设计与艺术的前沿实践，是国际设计界的重要思想平台。' },
      { title: 'EL Croquis（建筑素描）', author: '', publisher: '北京建院建筑文化传播有限公司(中文版)', description: '以单体作品专题著称的建筑期刊。', tags: ['期刊'], journalLevel: null, identifier: null, detailContent: '《EL Croquis》于1982年在西班牙创办，通过深度访谈、技术图与摄影呈现国际建筑师的重要作品，被视为当代建筑界最具权威性的出版物之一。' },
      { title: 'ArchiCreation（建筑创作）', author: '', publisher: '北京建筑大学(中文版)', description: '北京建筑大学主办的创作刊物。', tags: ['期刊'], journalLevel: null, identifier: '11-3161/TU', detailContent: '《建筑创作》于1989年创办，由北京建筑大学主办，聚焦建筑作品的深度报道与前沿学术研究，以国际视野呈现高质量建成项目与设计过程，是国内知名度极高的建筑专业期刊。  ' },
      { title: 'Architecture & Detail（建筑细部）', author: '', publisher: '大连理工大学(中文版)', description: '聚焦建筑细部与构造的专业刊物。', tags: ['期刊'], journalLevel: null, identifier: '21-1488/TU', detailContent: '《Architecture & Detail》由德国 DETAIL 杂志推出，以构造细节为核心，通过可比尺度的图纸与摄影呈现全球优秀建筑案例，是建筑师与工程师的重要参考刊物。' },
      { title: '建筑的故事', author: '[英]帕特里克·狄龙 著;[英]斯蒂芬·比斯蒂 绘', publisher: '北京联合出版公司', description: '纵向追溯人类建筑历史。', tags: ['建筑史', '建筑文化'], journalLevel: null, identifier: '9787559632777', detailContent: '英国作者狄龙和插画师比斯蒂合作的绘本，用漫画式插画讲述世界经典建筑背后的故事。图书以儿童读者为对象，但内容丰富，引人入胜地介绍多种建筑类型和历史背景。也非常适合建筑初学者' },
      { title: '安藤忠雄论建筑', author: '[日]安藤忠雄', publisher: '中国建筑工业出版社', description: '安藤忠雄自述建筑观与代表作解析。', tags: ['建筑理论', '作品集'], journalLevel: null, identifier: '9787112053704', detailContent: '日本建筑大师安藤忠雄以对话形式阐述个人设计思想与理念。书中收录他对建筑空间、光线、几何形体等主题的见解，以及对自己代表作创作过程的回顾，对理解安藤的建筑观念大有裨益。' },
      { title: '建筑师成长记录: 学习建筑的101点体会', author: '[美]马修·弗莱德里克', publisher: '机械工业出版社', description: '漫画式图解回答建筑设计的101个关键问题。', tags: ['建筑教育', '建筑实践'], journalLevel: null, identifier: '9787111281863', detailContent: '美国建筑师马修·弗莱德里克总结了学习建筑过程中的101个心得。书中用简短段落和插画分享经验，从学术训练到工作实习，为建筑学子提供实践建议和职业启示。' },
      { title: '哈佛大学建筑系的八堂课', author: '拉菲尔·莫内欧', publisher: '田园城市文化事业有限公司', description: '莫内欧阐述八位当代建筑师的理论与教学要点。', tags: ['建筑教育', '建筑理论'], journalLevel: null, identifier: '9867019349', detailContent: '西班牙建筑师拉菲尔·莫内奥作为讲师，为哈佛建筑系学生开设的系列讲座汇编。书中每章围绕一个建筑主题（如光线、材料、城市等）进行深入探讨，分享了这位普利兹克奖得主的教育经验和设计思考。' },
      { title: '穿墙透壁: 剖视中国经典古建筑', author: '李乾朗', publisher: '广西师范大学出版社', description: '图文解析中国古代经典建筑。', tags: ['建筑史', '专业工具'], journalLevel: null, identifier: '9787563390939', detailContent: '李乾朗以剖面图形式展示中国传统经典古建筑（如庙宇、殿堂等）的内部结构。通过直观的剖视图解和简要说明，揭示中国木构建筑的结构特征和施工细节，是了解传统建造技术的图解手册。' },
      { title: '建筑设计资料集', author: '', publisher: '中国建筑工业出版社', description: '一套系统汇集建筑设计规范、技术参数与典型案例的综合性专业工具书。', tags: ['建筑设计', '专业工具', '建筑教育'], journalLevel: null, identifier: '9787112209392', detailContent: '《建筑设计资料集（第三版）》由中国建筑工业出版社与中国建筑学会组织编写，汇集40余家专业机构历时七年的研究成果，是中国建筑设计领域规模最大、体系最完整的综合性工具书。全书共八册，覆盖建筑总论、居住、公共建筑、工业、市政等主要方向，以标准化图表、精炼文字和重新绘制的专业图版呈现建筑设计的关键技术参数、规范要点与典型案例。 \n新版在继承1960年初版与1987年第二版体系的基础上全面升级，内容跨越建筑技术、工程、经济、人体工学、美学与环境心理等多学科领域，被视为当代中国建筑设计的“百科全书”。其模块化结构与动态更新机制提升了检索效率与实用性，为建筑师、规划师及相关专业提供系统、权威且可直接应用的设计依据。' }
    ];
    this.readings.set(rawData.map((item, index) => ({ ...item, id: `r${index + 1}`, imageUrl: `/images/book/s${index + 1}.webp` })));
  }

  private seedCompetitionsData() {
    // Placeholder data - waiting for full user data
    // Format: Level, Type, Name, Organizer, Note, URL, Deadline
    const rawData = [
      { level: '国家级', type: 'S类', name: '中国国际大学生创新大赛', organizer: '教育部', note: '上榜赛事', url: 'https://cy.ncss.cn/', deadline: '5月' },
      { level: '国家级', type: 'S类', name: '“挑战杯”全国大学生课外学术科技作品竞赛', organizer: '共青团中央', note: '上榜赛事', url: 'http://www.tiaozhanbei.net/', deadline: '1月' },
      { level: '国家级', type: 'A类', name: '全国大学生电子商务“创新、创意及创业”挑战赛', organizer: '高校电子商务类专业教学指导委员会', note: '上榜赛事', url: 'http://www.3chuang.net/', deadline: '9月' },
      { level: '国家级', type: 'A类', name: '全国大学生创新创业训练计划年会展示', organizer: '教育部高等教育司', note: '上榜赛事', url: 'http://www.gjcxcy.cn/', deadline: '' },
      { level: '国家级', type: 'A类', name: '中美青年创客大赛', organizer: '教育部', note: '上榜赛事', url: 'https://chinaus-maker.cscse.edu.cn/', deadline: '6月' },
      { level: '国家级', type: 'A类', name: '“挑战杯”中国大学生创业计划大赛', organizer: '共青团中央', note: '上榜赛事', url: 'http://www.tiaozhanbei.net/', deadline: '1月' },
      { level: '国家级', type: 'A类', name: '全国大学生广告艺术大赛', organizer: '教育部高等学校新闻传播学类专业教学指导委员会、中国高等教育学会广告教育专业委员会', note: '上榜赛事', url: 'https://www.sun-ada.net/', deadline: '6月' },
      { level: '国家级', type: 'A类', name: '未来设计师·全国高校数字艺术设计大赛', organizer: '工业和信息化部人才交流中心', note: '上榜赛事', url: 'https://www.ncda.org.cn/', deadline: '6月' },
      { level: '国家级', type: 'A类', name: '中国好创意暨全国数字艺术设计大赛', organizer: '全国高等院校计算机基础教育研究会', note: '上榜赛事', url: 'https://www.cdec.org.cn/', deadline: '6月' },
      { level: '国家级', type: 'A类', name: '“学创杯”全国大学生创业综合模拟大赛', organizer: '高等学校国家级实验教学示范中心联席会经济与管理学科组', note: '上榜赛事', url: 'http://www.bster.cn/cyds/index', deadline: '3月' },
      { level: '国家级', type: 'A类', name: '全国大学生先进成图技术与产品信息建模创新大赛', organizer: '教育部高等学校工程图学教学指导委员会、中国图学学会制图技术专业委员会、中国图学学会产品信息建模专业委员会', note: '上榜赛事', url: 'http://www.chengtudasai.com/', deadline: '4月' },
      { level: '国家级', type: 'A类', name: '全国大学生结构设计竞赛', organizer: '住房和城乡建设部、中国土木工程学会', note: '上榜赛事', url: 'http://www.structurecontest.com/', deadline: '7月' },
      { level: '国家级', type: 'A类', name: '全国高校 BIM 毕业设计创新大赛', organizer: '中国软件行业协会培训中心', note: '上榜赛事', url: 'https://gxbsxs.glodonedu.com/', deadline: '11月' },
      { level: '国家级', type: 'A类', name: '两岸新锐设计竞赛·华灿奖', organizer: '中国高等教育学会、中华中山文化交流协会、北京歌华文化发展集团', note: '上榜赛事', url: 'http://www.huacanjiang.com/home', deadline: '9月' },
      { level: '国家级', type: 'A类', name: '米兰设计周--中国高校设计学科师生优秀作品展', organizer: '中国教育国际交流协会、中国高等教育学会', note: '上榜赛事', url: 'http://www.dandad.cn/', deadline: '1月' },
      { level: '国家级', type: 'A类', name: '全国三维数字化创新设计大赛', organizer: '国家制造业信息化培训中心、全国三维数字化技术推广服务与教育培训联盟（3D动力）、光华设计发展基金会', note: '上榜赛事', url: 'https://3dds.3ddl.net/', deadline: '6月' },
      { level: '国家级', type: 'B类', name: '全国大学生GIS应用技能大赛', organizer: '中国地理信息产业协会、教育部高等学校地理科学类教学指导委员会', note: '教指委赛事', url: 'http://contest.gisera.com/', deadline: '9月' },
      { level: '国家级', type: 'B类', name: '全国大学生农业水利工程及相关专业创新设计大赛', organizer: '教育部高等学校农业工程类专业教学指导委员会', note: '教指委赛事', url: 'http://csae.org.cn/scdsxkjs/slgcjxgzy/', deadline: '7月' },
      { level: '国家级', type: 'B类', name: '全国大学生农业建筑环境与能源工程相关专业创新创业竞赛', organizer: '教育部高等学校农业工程类专业教学指导委员会', note: '教指委赛事', url: 'http://csae.org.cn/scdsxkjs/jzhjynygc/', deadline: '7月' },
      { level: '国家级', type: 'B类', name: 'WUPENiCity城市可持续调研报告国际竞赛', organizer: '世界规划教育组织WUPEN', note: '', url: 'http://www.wupen.org/competitions/67', deadline: '3月' },
      { level: '国家级', type: 'B类', name: 'WUPENiCity城市设计学生作业国际竞赛', organizer: '世界规划教育组织WUPEN', note: '', url: 'http://wupen.net/competitions/128', deadline: '3月' },
      { level: '国家级', type: 'B类', name: '全国大学生环境设计大赛', organizer: '中国建筑装饰协会', note: '', url: 'https://www.shejijingsai.com/2025/02/1281185.html', deadline: '6月' },
      { level: '省部级', type: 'C类', name: '全国大学生乡村振兴创意大赛研学旅行赛', organizer: '中国城市科学研究会', note: '', url: 'https://www.cteweb.cn/index.php/work/317.html', deadline: '6月' },
      { level: '省部级', type: 'C类', name: '“园冶杯”风景园林（毕业设计、论文）国际竞赛', organizer: '国际绿色建筑与住宅景观协会、亚洲园林协会', note: '', url: 'http://www.yuanyebei.com/', deadline: '7月' },
      { level: '省部级', type: 'C类', name: '艾景奖•国际园林景观规划设计大赛', organizer: '国际园林景观规划设计行业协会（ILIA）', note: '', url: 'https://www.idea-king.org.cn/', deadline: '8月' },
      { level: '省部级', type: 'C类', name: '中国风景园林教育大会学生设计竞赛', organizer: '中国风景园林学会教育工作委员会', note: '', url: 'https://www.chsla.org.cn/', deadline: '8月' },
      { level: '省部级', type: 'C类', name: '全国大学生植物保护专业能力大赛', organizer: '教育部高等学校植物生产类专业教学指导委员会农艺（含农学、植物保护）类教学指导分委员会', note: '', url: '暂无', deadline: '6月' },
      { level: '省部级', type: 'C类', name: '全国数字建筑创新应用大赛', organizer: '中国建设教育协会', note: '', url: 'http://bisai.ccen.com.cn/', deadline: '8月' },
      { level: '省部级', type: 'C类', name: '台达杯国际太阳能建筑设计竞赛', organizer: '国际太阳能学会、中国建设科技集团中央研究院、中国建筑设计研究院有限公司', note: '', url: 'https://isbdc.cn/', deadline: '8月' },
      { level: '省部级', type: 'C类', name: '全国高等院校大学生乡村规划方案竞赛', organizer: '中国城市规划学会乡村规划与建设学术委员会', note: '', url: 'https://www.planning.org.cn/', deadline: '12月' },
      { level: '省部级', type: 'C类', name: '全国大学生乡村振兴创意大赛', organizer: '中国城市科学研究会、河南省文化和旅游厅、浙江省文旅厅', note: '', url: 'https://gsxczx.moocollege.com/home/homepage', deadline: '7月' },
      { level: '省部级', type: 'C类', name: 'CIID中国手绘艺术设计大赛', organizer: '中国建筑学会室内设计分会', note: '', url: 'https://www.ciid.com.cn/prize/prize_list?pt_id=9', deadline: '6月' },
      { level: '省部级', type: 'C类', name: '“新人杯”全国大学生室内设计竞赛', organizer: '中国建筑学会室内设计分会', note: '', url: 'https://www.ciid.com.cn/', deadline: '7月' },
      { level: '省部级', type: 'D类', name: '中国古村落活化利用建设规划设计大赛', organizer: '中景恒基投资集团、江西省抚州市金溪县人民政府', note: '省级学会', url: 'http://www.naioc.org.cn/', deadline: '3月' },
      { level: '校级', type: 'E级', name: '全国环境友好科技竞赛', organizer: '清华大学、同济大学及西安建筑科技大学', note: '', url: 'https://lab.env.tsinghua.edu.cn/info/1581/2963.htm', deadline: '6月' },
      { level: '国家级', type: 'A类', name: '全国大学生花园设计建造竞赛', organizer: '中国风景园林学会', note: '上榜赛事', url: 'http://www.lalavision.com/', deadline: '2月' },
      { level: '国家级', type: 'A类', name: '全国大学生数字媒体科技作品及创意竞赛', organizer: '中国人工智能学会等', note: '上榜赛事', url: 'http://cmit.cn/', deadline: '9月' },
      { level: '国家级', type: 'A类', name: '中国国际大学生创新大赛', organizer: '教育部等', note: '上榜赛事', url: 'https://cy.ncss.cn/', deadline: '5月' },
      { level: '国家级', type: 'A类', name: '“挑战杯” 全国大学生课外学术科技作品竞赛', organizer: '共青团中央等', note: '上榜赛事', url: 'http://www.tiaozhanbei.net/', deadline: '1月' },
      { level: '国家级', type: 'A类', name: '“挑战杯” 中国大学生创业计划竞赛', organizer: '共青团中央等', note: '上榜赛事', url: 'http://www.tiaozhanbei.net/', deadline: '1月' },
      { level: '国家级', type: 'A类', name: '全国大学生电子商务 “创新、创意及创业” 挑战赛', organizer: '教育部高等学校电子商务类专业教学指导委员会', note: '上榜赛事', url: 'http://www.3chuang.net/', deadline: '9月' },
      { level: '国家级', type: '无（忽略级别）', name: '东南·中国建筑新人赛', organizer: '东南大学', note: '大一至大三可参加', url: 'http://archirookies.com/', deadline: '7月' },
      { level: '国际级', type: '无（忽略级别）', name: '霍普杯2025国际大学生建筑设计竞赛', organizer: '国际建筑师协会（UIA）', note: '', url: 'https://hypcup.uedmagazine.net/', deadline: '9月' },
      { level: '国际级', type: '无（忽略级别）', name: '《建筑师》杂志 · 「天作奖」国际大学生建筑设计竞赛', organizer: '中国建筑出版传媒有限公司《建筑师》杂志社、广州市天作建筑规划设计有限公司、新加坡天作国际设计公司、天津大学建筑学院', note: '', url: 'https://mp.weixin.qq.com/s/y8H-ScAhv5coszV0OnanHg', deadline: '12月' },
      { level: '国际级', type: '无（忽略级别）', name: 'eVolo 摩天楼设计竞赛', organizer: 'eVolo Magazine', note: '', url: 'https://www.evolo.us/category/competition/', deadline: '11月' },
      { level: '国家级', type: '无（忽略级别）', name: '谷雨杯-全国大学生可持续建筑设计竞赛', organizer: '全国高等学校建筑学学科专业指导', note: '已停办', url: 'http://www.guyu.cnkibim.cn/col.jsp?id=117', deadline: '' },
      { level: '国际级', type: '无（忽略级别）', name: '国际威卢克斯（Velux）大奖赛', organizer: 'VELUX（威卢克斯）', note: '两年一次', url: 'https://www.daylightandarchitecture.com/award-brief/', deadline: '4月' },
      { level: '国际级', type: '无（忽略级别）', name: 'Houzee Awards', organizer: 'Architecture Collection', note: '', url: 'https://architecture-collection.com/', deadline: '6月' },
      { level: '国际级', type: '无（忽略级别）', name: '“生动废墟”（ LIVING RUINS II ）建筑设计竞赛', organizer: 'Terraviva', note: '', url: 'http://www.terravivacompetitions.com/', deadline: '1月' },
      { level: '国际级', type: '无（忽略级别）', name: '发展中国家建筑设计大展&2025国际学生设计竞赛', organizer: '国际建筑学会、亚洲太平洋地区人居环境学会', note: '', url: 'HTTP://WWW.ARCHIAWARD.NET', deadline: '2月' },
      { level: '国际级', type: '无（忽略级别）', name: '圣戈班（Saint Gobain）学生建筑竞赛 / 贝尔格莱德', organizer: 'Saint-Gobain', note: '', url: 'https://architecture-student-contest.saint-gobain.com/', deadline: '5月' },
      { level: '国际级', type: '无（忽略级别）', name: '情感博物馆设计竞赛', organizer: 'Buildner', note: '', url: 'https://architecturecompetitions.com/museumofemotions8/', deadline: '6月' },
      { level: '国际级', type: '无（忽略级别）', name: '西海市"极小住宅“设计竞赛', organizer: '西海市', note: '', url: 'https://yadokari.net/saikai/', deadline: '1月' },
      { level: '国际级', type: '无（忽略级别）', name: '《建筑金属》杂志设计挑战赛', organizer: '《建筑金属》杂志', note: '', url: 'https://metalsinconstruction.org/2026-design-brief/', deadline: '3月' },
      { level: '国际级', type: '无（忽略级别）', name: 'International Excellence Awards', organizer: 'Architecture & Design Community', note: '', url: 'https://designskill.org/iea-registration/', deadline: '5月' },
      { level: '国际级', type: '无（忽略级别）', name: 'KAIRA LOORO 建筑竞赛', organizer: 'Balouo Salo', note: '', url: 'https://www.kairalooro.com/', deadline: '5月' },
      { level: '国际级', type: '无（忽略级别）', name: '微型住宅（MICROHOME）设计竞赛', organizer: 'Buildner', note: '', url: 'https://architecturecompetitions.com/microhome2026/', deadline: '9月' },
      { level: '国际级', type: '无（忽略级别）', name: 'International Architecture & Design Awards', organizer: 'Architecture & Design Community', note: '', url: 'https://ad-c.org', deadline: '4月' },
      { level: '国际级', type: '无（忽略级别）', name: 'IDEASxWOOD 设计竞赛', organizer: 'TABU Spa', note: '', url: 'https://i4w.it/en/', deadline: '6月' },
      { level: '国际级', type: '无（忽略级别）', name: 'ADF 设计大奖赛', organizer: 'Aoyama Design Forum (ADF)', note: '', url: 'https://www.adfwebmagazine.jp/en/design/', deadline: '12月' },
      { level: '国际级', type: '无（忽略级别）', name: 'DiscoverArch Student Project Awards', organizer: 'DiscoverArch', note: '', url: 'https://www.discoverarch.org/competitions/', deadline: '1月' },
      { level: '国际级', type: '无（忽略级别）', name: '“阴影之家”设计竞赛', organizer: 'Buildner', note: '', url: 'https://architecturecompetitions.com/homeofshadows4/', deadline: '3月' },
      { level: '国际级', type: '无（忽略级别）', name: 'NOT A HOTEL 设计竞赛', organizer: 'NOT A HOTEL', note: '', url: 'https://notahotel.com/design-competition/2026', deadline: '1月' },
      { level: '国际级', type: '无（忽略级别）', name: '街头小贩创新家具设计国际公开竞赛', organizer: 'Ketham\'s Atelier', note: '', url: 'https://kethamsatelier.com/2025/08/28/open-international-competition-to-design-innovative-furniture-for-street-vendors-2025-26/', deadline: '2月' },
      { level: '国际级', type: '无（忽略级别）', name: 'WAF 建筑制图大奖赛', organizer: 'Make Architects, Sir John Soane\'s Museum, World Architecture Festival', note: '', url: 'https://worldarchitecturefestival.com/WorldArchitectureFestival2025/en/page/the-architecture-drawing-prize', deadline: '5月' },
      { level: '国际级', type: '无（忽略级别）', name: '可持续发展目标国际设计奖', organizer: '东西大学亚洲未来设计中心（韩国）、九州大学可持续发展目标设计部（日本）、同济大学（中国）', note: '', url: 'https://uni.dongseo.ac.kr/adcf/index.php?pCode=MN8000043&mode=view&idx=983', deadline: '10月' },
      { level: '国际级', type: '无（忽略级别）', name: 'UIA 国际学生竞赛', organizer: 'UIA - International Union of Architects', note: '', url: 'https://uia2026bcn.org/international-student-competition/', deadline: '11月' },
      { level: '国际级', type: '无（忽略级别）', name: 'Kinderspace — 儿童发展建筑竞赛', organizer: 'Buildner', note: '', url: 'https://architecturecompetitions.com/kinderspace3/', deadline: '11月' },
      { level: '国际级', type: '无（忽略级别）', name: '临终关怀——临终者之家设计竞赛', organizer: 'Buildner', note: '', url: 'https://architecturecompetitions.com/hospice5/', deadline: '11月' },
      { level: '国际级', type: '无（忽略级别）', name: '疗愈空间——国际设计大赛', organizer: 'Claymire', note: '', url: 'https://www.claymire.site/a-healing-space', deadline: '8月' },
      { level: '国际级', type: '无（忽略级别）', name: 'YADOKARI 微型住宅设计竞赛', organizer: 'YADOKARI 株式会社', note: '', url: 'https://yadokari.net/tinyhousecontest/', deadline: '7月' },
      { level: '国际级', type: '无（忽略级别）', name: '微型住宅（MICROHOME）设计竞赛', organizer: 'Buildner', note: '', url: 'https://architecturecompetitions.com/microhome10/', deadline: '9月' },
      { level: '国际级', type: '无（忽略级别）', name: '微建筑节木制装置作品征集竞赛', organizer: 'Associazione Culturale Fe.M', note: '团队成员可以包括学生，但前提是至少有一名成员是已毕业的建筑师或工程师。', url: 'https://www.festivalmicroarchitettura.com/call-2025', deadline: '5月' },
      { level: '国际级', type: '无（忽略级别）', name: 'ARCASIA 学生建筑设计竞赛', organizer: '亚洲建筑师协会（ARCASIA）', note: '', url: 'https://arcasia.org/awards/arcasia-students-design-competition-2025/', deadline: '7月' },
      { level: '国际级', type: '无（忽略级别）', name: '“微型图书馆”建筑竞赛', organizer: 'Volume Zero', note: '', url: 'https://volumezerocompetitions.com/tinylibrary-2025', deadline: '6月' },
      { level: '国际级', type: '无（忽略级别）', name: '垂直农场设计竞赛', organizer: 'YAC-Young Architects Competitions, Manni Group', note: '', url: 'https://www.youngarchitectscompetitions.com/open-competitions/vertical-farms', deadline: '5月' },
      { level: '国际级', type: '无（忽略级别）', name: 'Shift 地标建筑设计大赛', organizer: 'Shift', note: '', url: 'https://competition.shift.world/', deadline: '3月' },
    ];

    const competitions: Competition[] = rawData.map(d => {
      let month: number | undefined;
      // Try to extract month from deadline (e.g. "2024年2月..." or "...May...")
      // Simple regex for Chinese format "X月"
      const mMatch = d.deadline.match(/(\d{1,2})月/);
      if (mMatch) {
        month = parseInt(mMatch[1], 10);
      }
      return {
        ...d,
        month
      };
    });
    
    this.competitions.set(competitions);
  }

  private seedArchipediaData() {
    // [Category, Subcategory, Term, English, Definition, Details]
    const rawData: string[][] = [
      // 1. 中国古代建筑 (Preserving 177 terms from previous turn)
      ['中国古代建筑', '著名实例', '安济桥', 'Anji Bridge', '位于河北省赵县城南，跨于洨河之上，俗称赵州桥。', '这座桥是隋匠李春主持建造的，建于隋大业年间，距今已近 1400 年。安济桥是世界上最早出现的敞肩拱桥。'],
      ['中国古代建筑', '大木作·构件', '昂', 'Ang', '斗拱中的构件，结构上为斜向悬臂梁，斜向下垂的构架。', '起杠杆作用。'],
      ['中国古代建筑', '大木作·构件', '抱头梁', 'Baotou Beam', '抱头梁长一步架，承担一个檩子的力。也称劄牵', '在檐口处的梁，有斗栱时叫挑尖梁，无斗栱时叫抱头梁。'],
      ['中国古代建筑', '大木作·铺作', '补间铺作', 'Intercolumnar Bracket Set', '位于两柱间额枋上的斗拱，称“补间铺作”。', '宋式外檐斗拱根据位置的不同，分为 3 种。柱头上的称“柱头铺作”，角柱上的称“转角铺作”。起到支撑屋檐重量和加大出檐深度的作用。通常当心间用 2 朵，其他次、梢间各用一朵，尽量分布大体匀称。清式建筑中称补间铺作为平身科。由于清式建筑的斗拱的结构的蜕化，比例缩小，装饰性加强，补间铺作由宋式的一到两朵增加到了四到六朵。'],
      ['中国古代建筑', '彩画', '包袱', 'Baofu (Bundle)', '清代苏式彩画中的一种枋心形式。', '其特点是把檐檩、檐地板、檐枋联成一体。包袱边缘用折叠的退晕曲线，称为烟云，可加强图案的立体感与透视感，模糊了界限的边缘。包袱心内可画山水、人物、翎毛、花卉、楼台、殿阁等画题。包袱的运用，使得苏式彩画不同于殿式彩画的程式化，画题都是写实的非程式化的，有意模糊界限，呈现出欢乐活泼快乐的性格，赋予了苏式彩画变通，风趣丰美的格调，著名实例如北京颐和园的长廊等。'],
      ['中国古代建筑', '石作', '抱鼓石', 'Drum Stone', '一般位于宅门入口、形似圆鼓的两块人工雕琢的石制构件，是“门枕石”的一种。', '清代勾阑中与石栏杆配套的构件，采用“抱鼓”的形象可灵活适应不同的地栿坡度，是很有创意的设计。用于栏杆结束处，阻住栏杆不使他掉下来。另为优美形象，作为栏杆的尽端处理，抱鼓石分件少，体现了清式勾阑相比宋式勾阑更加庄重、稳定、强劲的风格。'],
      ['中国古代建筑', '现代理论', '北京宪章', 'Beijing Charter', '1999年国际建筑师协会第20届大会通过的纲领性文献。', '《北京宪章》这一宪章被公认为是指导二十一世纪建筑发展的重要纲领性文献，标志着吴良镛的广义建筑学与人居环境学说，已被全球建筑师普遍接受和推崇，从而扭转了长期以来西方建筑理论占主导地位的局面。宪章总结了百年来建筑发展的历程，并在剖析和整合 20 世纪的历史与现实、理论与实践、成就与问题以及各种新思路和新观点的基础上，展望了 21 世纪建筑学的前进方向。面临新的时代，宪章提出了新的行动纲领：变化的时代，纷繁的世界，共同的议题，协调的行动。'],
      ['中国古代建筑', '陵墓', '宝城宝顶', 'Baocheng Baoding', '用砖石砌筑成圆形或者长圆形的城墙，里面垒土封顶，使之明显突出。', '常见于明十三陵、清东西陵。'],
      ['中国古代建筑', '大木作·度量', '步架', 'Bu (Step)', '木构建筑屋架上相邻槫（清称檩）之间中心线的距离。', '各步距离总和或侧面各开间宽度的总和称为“通进深”，简称为“进深”。2.清代各步距离相等，宋代有相等的，递增或递减以及不规律排列的。 \n例如唐代规定官员与庶人的屋舍：“三品，堂五间九架，门三间五架六品、七品，堂三间五架，庶人四架，门皆一间两下。” (《册府元龟》)。这里的“架”数指的是檩(又称桁)数。宋《营造法式》则以椽数计进深，如“四架椽屋”即五檩之屋。这种用“几间几架”来表述建筑规模的方式一直沿用到明清。'],
      ['中国古代建筑', '结构体系', '穿斗式', 'Chuandou Construction', '用穿枋把柱子串联起来，形成一榀榀的房架，檩条直接搁置在柱头上。', '我国木构架建筑结构体系之一，在沿檩条方向，再用斗枋把柱子串联起来，由此形成一个整体的框架。有疏檩和密檩两种做法，疏檩的柱子直接落在地上，密檩是不完全的梁柱支撑。尽量用竖向的木柱来取代横向的木梁，尽量用小材取代大材，简化屋面构造，简化屋檐的悬挑构造。用于用材小，整体性强的建筑。穿斗式木构架主要用于南方，因其不能适应较大空间，所以不用于官式建筑中。它具有灵活性，与抬梁式木构架形成了良好的互补机制。'],
      ['中国古代建筑', '大木作·构造', '侧脚', 'Cejiao (Batter)', '宋式建筑大木作构造手法，把建筑物的一圈檐柱柱脚向外抛出，柱头向内收进', '《营造法式》规定：外檐柱在前后檐方向上向内倾斜柱高的千分之十，在两山方向上向内倾斜柱高的千分之八，而角柱则同时在两个方向向建筑内部倾斜，从而把建筑物的一圈檐柱柱脚向外抛出，柱头向内收进，能够借助屋顶重量产生水平推力，增加木构架的内聚力，以防散架或倾侧。此法施工较为麻烦，所以明代以后逐渐减弱，最后废弃不用，代之以增加穿枋和改进榫卯等办法来保持木构架的稳定性。'],
      ['中国古代建筑', '大木作·构造', '叉柱造', 'Chazhu Construction', '上层檐柱柱脚十字或一字开口，叉落在下层平坐铺作中心。', '宋式大木作构造术语。汉族楼阁式建筑中，上层檐柱柱脚十字或一字开口，叉落在下层平坐铺作中心，柱底置于铺作栌斗斗面之上。这种结构方法称叉柱造或插柱造。叉柱造可以增强上下层之间的联系，加强整个构架的稳定性。天津蓟县独乐寺内的观音阁，其上、下柱的交接就采用叉柱造的构造方式。'],
      ['中国古代建筑', '大木作·构造', '缠柱造', 'Chanzhu Construction', '平座檐柱与下屋檐柱交接时，上柱向内收进约半个柱距，其下端不开口，直接置于梁上。', '宋式大木作构造术语。汉族楼阁式建筑中，平座檐柱与下屋檐柱交接时，上柱向内收进约半个柱距，其下端不开口，直接置于梁上。这种结构方法称缠柱造。缠柱造可以增强上下层之间的联系，加强整个构架的稳定性。山西应县佛宫寺释迦塔上层暗层檐柱移下层檐柱收半柱径，其交接方式为缠柱造。在外观上形成逐层向内递收的轮廓。'],
      ['中国古代建筑', '大木作·构件', '草栿', 'Rough Beam', '在天花板上面的梁，做法较自由，加工较粗糙，故称草袱，是和天花下的明状相对而言的', '中国古代建筑梁的形制之一，与明栿相对而言，指在平闇上看不见的栿，由于看不见，所以制造粗略，未经任何艺术加工，制作潦草，故称之为草栿．为宋式梁栿名称，草栿负荷屋盖重量。草栿的粗糙做法与明栿的精致做法形成了良好的互补机制。'],
      ['中国古代建筑', '模数制', '材分制', 'Cai-Fen System', '宋代李诫的著作《营造法式》所提出建立的模数制。', '“材”是模数的基本单位，“分”则是由材进一步细分。《法式》规定，“材有八等，度屋之大小因而用之”。这样，设计房屋只要选定建筑的等级及其开间数，就选定了用哪等材，从而确定大木构件的具体尺寸，对建立规范、把握比例尺度、简化设计工作、方便工料预算、便于构件预制和加快施工速度都有重要作用。材分制度在唐时已有应用，是我国古代匠人智慧的结晶。'],
      ['中国古代建筑', '屋顶与瓦石', '鸱尾', 'Chiwei', '汉至宋宫殿屋脊两端之装饰。', '汉时方士称，天上有鱼尾星，以其形置于屋上可防火灾。遂有鱼尾脊饰。唐代时鸱尾无首，宋代有首，有吻。明清时鱼尾仅在南方建筑中存在，官式建筑则用吻兽。'],
      ['中国古代建筑', '装修与空间', '彻上明造', 'Cheshangmingzao', '建筑物室内的顶部天花不做装饰，让屋顶梁架结构完全暴露。', '如天花不做装饰，更不用藻井，而让屋顶梁架结构完全暴露，使人在室内抬头即能清楚地看见屋顶的梁架结构，称为“彻上明造”，也称“彻上露明造”。在中国古代建筑中多用于厅堂式建筑，如山西太原晋祠圣母殿就采用此法，使得殿内空间非常完整、高敞。'],
      ['中国古代建筑', '城市与规划', '曹魏邺城', 'Ye City of Cao Wei', '中国已知最早的轮廓方正的都城。', '三国时期的曹魏邺城采用了棋盘式的布局，是中国已知最早的轮廓方正的都城。'],
      ['中国古代建筑', '大木作·构件', '叉手', 'Chashou', '脊桁两侧的斜杆，用以固持脊博，其形状犹如侍者叉手而立，故名。', '在抬梁式构架中，从最上一层短梁到脊“槫”（即脊檩）之间斜置的木件，称为“叉手”。叉手的主要作用就是扶持脊“槫”。在唐代及唐代之前，抬梁式木构架中只有叉手而不用蜀柱，宋代时则将叉手与蜀柱并用，而明清时则不用。'],
      ['中国古代建筑', '装修与空间', '抄手游廊', 'Chaoshou Corridor', '中国传统建筑中走廊的一种常用形式，多见于四合院中。', '与垂花门相衔接。一般抄手游廊是进门后先向两侧，再向前延伸，到下一个门之前又从两侧回到中间。在院落中，抄手游廊沿着院落的外缘布置，是开敞式附属建筑，既可供人行走，又可供人休憩小坐，观赏院内景致。'],
      ['中国古代建筑', '装修与空间', '垂花门', 'Chuihua Gate', '位于宅院内部，通常处在二门的位置，是内外院的界限。', '北京四合院的重要组成部份，是内宅与外宅（前院）的分界线和唯一通道。因其檐柱不落地，垂吊在屋檐下，称为垂柱，其下有一垂珠，通常彩绘为花瓣的形式，故被称为垂花门。'],
      ['中国古代建筑', '大木作·构件', '重檐金柱', 'Double-eave Gold Column', '用于重檐建筑的金柱，采用一木做成。', '其下半段为金柱，上半段支承上层檐，故称重檐金柱。'],
      ['中国古代建筑', '结构体系', '殿堂型构架', 'Diantang Structure', '宋《营造法式》中显示出的一种构架形式，与厅堂型相对而言。', '全部构架按水平方向分为柱网层、铺作层、屋架层，自下而上，逐层叠垒而成。柱网层由外檐柱和屋内柱组成，铺作层由搁置在外檐柱和屋内柱柱网之上的铺作组成，屋架层由层层草栿、矮柱、蜀柱架立，殿堂型构架的平面均为整齐的长方形，定型为 4 种分槽形式。佛光寺大殿采用此法。显示了我国古代匠人的智慧。'],
      ['中国古代建筑', '模数制', '斗口', 'Doukou', '清代《工程做法》所提出确定的模数单位。', '斗口是斗上用以插放栱、翘、昂、枋的开口。作为标准单位的斗口，指平身科斗拱中，大斗或十八斗迎面方向安装翘昂的斗口宽度。清代斗口即宋代的材宽，以斗口制取代材分制是对模数制的重要改进。一是以单一的斗口取代材、栔、分的三级划分，减少换算程序。二是以斗口的 11 等取代材分的 8 等，划分更为细密。三是斗口以半斗口为级差，便于估算和施工。其标准化，定型化达到了十分缜密的程度，是我国古代匠人智慧的结晶。'],
      ['中国古代建筑', '彩画', '殿式彩画', 'Palace Style Painting', '梁思成先生把和玺彩画和旋子彩画合称为殿式彩画。', '主要用于宫殿、坛庙、陵寝、寺庙的主建筑。分为藻头、箍头和枋心三个部分。和玺彩画以龙为母题，以蓝绿为主色调，旋子彩画以旋子为母题，用色为蓝绿点金。殿试彩画图案布局严格，整个画面强调出规整，端庄，凝重的格调。'],
      ['中国古代建筑', '民居', '碉楼', 'Diaolou', '主要分布地带是：西康、青藏高原、内蒙古。', '碉楼住宅与山地特殊的地理环境有关，这些地区多山，且石为板岩或片麻岩构造，易剥落加工，取石方便。碉楼外墙为厚实高大的收分石墙楼层，内为密梁木楼层的楼房，楼面用土面层，即在木梁上密铺楞木，再铺一层细树枝，其下再铺20cm的拍石土层。'],
      ['中国古代建筑', '平面布局', '分心槽', 'Fenxin Cao', '以一列中柱及柱上斗栱将殿身划分为前后相同的两个空间。', '分心斗底槽的简称，宋代殿阁内部四种空间划分方式之一，一般用作殿门。'],
      ['中国古代建筑', '平面布局', '副阶周匝', 'Funjiezhouza', '塔身、殿身周围包绕一圈外廊，称为副阶周匝', '宋代殿阁内部四中空间（单槽、双槽、分心槽、金厢斗底槽）划分方式之一。其特点是殿身内有一圈柱列与斗拱，将殿身空间划分为内外两层空间组成，外层环包内层。实例：山西五台山佛光寺大殿。'],
      ['中国古代建筑', '大木作·构件', '飞橼', 'Flying Rafter', '为了增加屋檐挑出的深度，在原有圆形断面的檐椽外端，还要加钉一截方形断面的椽子。', '在大式建筑中，这段方形断面的椽子就叫做“飞椽”，也叫“飞檐椽”，宋代时称“飞椽”为“飞子”。飞椽的长短自然是随着出檐深度的需要而定。'],
      ['中国古代建筑', '大木作·构件', '扶脊木', 'Fuji Wood', '其位置在脊檩之上，与其长度相当，断面一般为六角形，用以承托脑椽的上端。', '清代建筑结构构件，在其前后朝下的斜面上做出一排小洞，用以承托脑椽的上端。这段横木即称为扶脊木。扶脊木对稳定木构架体系起到了很大作用，也是区分官式建筑中大式建筑与小式建筑的标志。'],
      ['中国古代建筑', '彩画', '枋心', 'Fangxin', '清式彩画梁枋中段，长度约占梁枋的三分之一。', '清式彩画的布局是将梁枋均分为 3 段：中断即为枋心，长度约占梁枋的三分之一，左右两端的端头作箍头，枋心与箍头之间为藻头，在和玺彩画中，枋心与藻头用“圭线”“岔口线”相隔，枋内彩画以龙为母题，以蓝绿为主色调。在旋子彩画中，分为空枋心，一字枋心，锦枋心等，在苏式彩画中，枋心有用于檐梁架的狭长枋心，还有把檐檩、檐垫板联成一体的“包袱”枋心，内可画各种画题。'],
      ['中国古代建筑', '陵墓', '方上', 'Fangshang', '在地宫之上用土层层夯筑，使之成为一个上小下大的尖锥体。', '锥体的上部好像截去尖顶成一房顶，故名之为方上。（秦始皇陵）。'],
      ['中国古代建筑', '彩画', '勾丝咬', 'Gousiyao', '是清式旋子彩画的一种处理方式，是最短的藻头画法。', '也称“狗撕咬”。是将标准的一整二破旋子图案咬紧并连成一片，即在藻头里画三个半旋子。藻头部分短而高时可单独使用。若构件过长，安排一整二破图案后仍有余地，也可插入“勾丝咬”即一整二破加勾丝咬，它是旋子彩画的重要构成元素。反映出清式旋子彩画规整，端庄，凝重的格调。'],
      ['中国古代建筑', '彩画', '箍头', 'Gutou', '清式彩画中，将梁枋均分成 3 段，左右两端的端头作箍头。', '箍头中“合子”和两侧的箍头线组成，用圭线、圭线光与藻头相隔。其主题各不相同：和玺彩画箍头合子里画坐龙；旋子彩画箍头可以作坐龙、西番莲、旋子；苏式彩画箍头将檩、垫、枋连成一体，多用连续回纹或万字纹，旁带连珠纹贯通上下。'],
      ['中国古代建筑', '营造技艺', '过白', 'Guobai', '后栋建筑与前栋建筑的距离要足够大，使坐于后进建筑中的人通过门樘可以看到前一进的屋脊。', '即在阴影中的屋脊与门樘之间要看得见一条发白的天光，此做法称之为“过白”。'],
      ['中国古代建筑', '建筑师', '关颂声', 'Guan Songsheng', '基泰工作室创始人，它是我国创办较早、影响最大的建筑设计事务所。', '后杨廷宝加入其中，其代表作品有：沈阳的京奉铁路总站（今沈阳火车站）和东北大学校舍、南京的中央运动场（今南京体育学院）、中山陵音乐台等。'],
      ['中国古代建筑', '石作', '勾阑', 'Goulan', '即木制、石制的栏杆，宋称勾阑', '由望柱，寻杖，阑板组成，结束处常设有抱鼓石。'],
      ['中国古代建筑', '彩画', '和玺彩画', 'Hexi Painting', '清式殿式彩画中的一种形式，级别最高。', '主要用于宫殿、坛庙、陵寝的主体建筑。其布局是将梁枋均分为 3 段，中段为枋心，左右两端作箍头，箍头与枋心之间的部分称为藻头。其特点是以龙为母题，定型为行龙，坐龙，升龙和降龙四种图案。以蓝绿色为基调，用色原则是左右蓝绿相间，上下蓝绿对调。其图案都是程式化的，图案化的，变形的画题。严格运用平面图案，排除立体感和透视感，保持构件载体的二维平面视感。图案的分布严格遵循界限，绝不超越、交混。从而强调出规整，端庄，凝重的格调。体现了封建社会森严的等级制度。'],
      ['中国古代建筑', '陵墓', '黄肠题凑', 'Huangchang Ticou', '汉代帝王墓用短方木叠成椁墙，墙内置棺椁，短方木端部均指向棺椁。', '“黄肠题凑”一名最初见于《汉书·霍光传》。根据汉代礼制，黄肠题凑与梓宫、便房、外藏椁、金缕玉衣等同属帝王陵墓中的重要组成部分，经朝廷特赐，个别勋臣贵戚才可以使用。黄肠是指黄心的柏木，即堆垒椁室所用的柏木、枋木心色黄。题凑是指枋木的端头皆指向内，即四壁所垒筑的枋木与同侧椁室壁板面呈垂直方向。该类型墓穴的代表有秦公一号大墓、天山汉墓、广阳王刘建与王后合葬墓。'],
      ['中国古代建筑', '建筑师', '黄作燊', 'Huang Zuoshen', '国内第二代建筑师，圣约翰建筑系系主任，和贝聿铭同为建筑大师格罗皮乌斯学生。', '国内第二代建筑师，圣约翰建筑系系主任，和贝聿铭同为建筑大师格罗皮乌斯学生。'],
      ['中国古代建筑', '建筑师', '华盖事务所', 'Allied Architects', '由赵深，陈植，童寯三人于1933年在上海组合成立，三人均从美国宾夕法尼亚大学毕业。', '由赵深，陈植，童寯三人于1933年在上海组合成立，三人均从美国宾夕法尼亚大学毕业。'],
      ['中国古代建筑', '园林', '花街铺地', 'Huajie Paving', '明清时期江南一带的室外铺地手法，利用各种建筑废料组成多种构图，及经济又实用。', '明清时期江南一带的室外铺地手法，利用各种建筑废料组成多种构图，及经济又实用。'],
      ['中国古代建筑', '平面布局', '金厢斗底槽', 'Jinxiang Doudi Cao', '殿身内有一圈柱列与斗拱，将殿身空间划分为内外两层空间组成。', '宋代殿阁内部四中空间（单槽、双槽、分心槽、金厢斗底槽）划分方式之一。其特点是殿身内有一圈柱列与斗拱，将殿身空间划分为内外两层空间组成，外层环包内层。实例：山西五台山佛光寺大殿。'],
      ['中国古代建筑', '大木作·构件', '金柱', 'Jin Column (Gold Column)', '位于檐柱内侧的柱子，多用于带外廊的建筑。', '金柱又是除檐柱中柱和山柱以外的柱子的通称，依位置不同可分为外金柱和内金柱。'],
      ['中国古代建筑', '大木作·构件', '角柱', 'Corner Column', '位于建筑四角的柱子。', '位于建筑四角的柱子。'],
      ['中国古代建筑', '度量', '间', 'Bay', '中国古代木构架建筑把相邻两榀屋架之间的空间称为间。', '房屋的进深则以“架”数或椽数来表述。例如唐代规定官员与庶人的屋舍：“三品，堂五间九架，门三间五架六品、七品，堂三间五架，庶人四架，门皆一间两下。” (《册府元龟》)。这里的“架”数指的是檩(又称桁)数。宋《营造法式》则以椽数计进深，如“四架椽屋”即五檩之屋。这种用“几间几架”来表述建筑规模的方式一直沿用到明清。梁思成《清式营造则例》称：“凡在四柱之中的面积  都称为间”,则是对“间”的概念作了另一种诠释。'],
      ['中国古代建筑', '营造技艺', '卷杀', 'Entasis', '宋代栱、梁、柱等构件端部作弧形（其轮廓由折线组成），形成柔美而有弹性的外观。', '“卷”有圆弧之意，“杀”有砍削之意'],
      ['中国古代建筑', '大木作·构件', '角背', 'Jiaobei', '明清大式建筑中保持瓜柱稳定的辅助构件。', '一般在大式房屋上用的较多。木构架中，凡是瓜柱都有角背支撑以免倾斜。大式建筑可有角背，小式建筑没有角背。它是明清建筑形制体系高度成熟化的反映，也体现了古代匠人的智慧和精湛的技艺。'],
      ['中国古代建筑', '屋顶与瓦石', '九脊顶', 'Nine-ridge Roof', '宋代歇山建筑的一种称谓，用于亭榭、厅堂。', '歇山顶是两边带半截“撒头”的不完全四坡顶，由正脊、四条垂脊、四条戗脊组成，故称九脊殿，加上山面上的两条博脊共 11 条。有单檐、重檐的形式，呈现出丰美、华丽、丰富的性格。它体现了宋代建筑体系的制度化、精致化，以及古代匠人精湛的技艺。'],
      ['中国古代建筑', '石作', '减地平钑', 'Jiandipingsa', '宋代《营造法式》中定出的四种雕镌形式之一。', '它是一种平板式的浮雕，地下凹在一平面上，母题凸起的表面也是一个平面。'],
      ['中国古代建筑', '屋顶与瓦石', '剪边', 'Jianbian', '指屋顶的脊和边用琉璃，其余用瓦的做法。', '实例见于河北正定隆兴寺摩尼殿。'],
      ['中国古代建筑', '建筑类型', '经幢', 'Sutra Pillar', '柱身上镌刻经文，宣扬佛法的纪念性石柱建筑物。', '经幢一般有基座，幢身，幢顶三部分。'],
      ['中国古代建筑', '陵墓', '集中陵制', 'Centralized Mausoleum System', '陵墓集中布置，共用一条神道。', '典型实例，北京昌平明十三陵。'],
      ['中国古代建筑', '大木作·构造', '举架', 'Jujia', '清代大屋顶的构造做法，其举高通过歩架求得。', '清代大屋顶的构造做法，其举高通过歩架求得。'],
      ['中国古代建筑', '园林', '计成', 'Ji Cheng', '明末造园家和造园理论家，著有在中国园林史上机具影响力的《园冶》。', '明末造园家和造园理论家，著有在中国园林史上机具影响力的《园冶》。'],
      ['中国古代建筑', '大木作·构造', '举折', 'Juzhe', '举指屋架的高度，常按建筑的进深与屋面材料而定。宋称--举折。', '所谓举架是指，木构架相邻两檩中的垂直距离除以对应步架长度所得的系数。作用，使屋面呈一条凹形优美的曲线。越往上越陡，利于排水和采光。'],
      ['中国古代建筑', '工官', '蒯祥', 'Kuai Xiang', '明代工官，主持修建北京皇宫及明长陵。', '明代工官，主持修建北京皇宫及明长陵。'],
      ['中国古代建筑', '文献', '园冶', 'Yuanye (The Craft of Gardens)', '为明代计成所著，是中国第一本园林艺术理论专著。', '共三卷，卷一的“兴造论”和“园说”是全书立论所在。该书精华可归纳为“虽由人作，宛若天开”“巧于因借，精在体宜”。'],
      ['中国古代建筑', '工官', '将作', 'Jiangzuo', '汉代以后对中国最高工官的称呼，又被称为“将作少府”“将作大匠”“将作监”等等。', '汉代以后对中国最高工官的称呼，又被称为“将作少府”“将作大匠”“将作监”等等。'],
      ['中国古代建筑', '度量', '开间', 'Kaijian (Bay)', '木构建筑正面相邻两檐柱之间的水平距离称为“开间”（又叫“面阔”）。', '开间宽度的总和称为通面阔。开间在汉代以前有奇数也有偶数，汉以后多用十一以下的奇数。民间建筑常用三，五开间；宫殿庙宇官署多用五，七开间，十分重要的用九开间。至于十一开间。正中一间称为明间（宋称当心间），之后分别为次间，梢间，尽间；九开间以上的增加次间数。在宋代建筑遗物和营造法式中，各间面阔有相等的；有当心间稍宽，次间稍窄的；也有各不均匀的。'],
      ['中国古代建筑', '彩画', '卡子', 'Kazi', '清式苏式彩画中的一种画法。位于藻头部位的檩、垫、枋上。', '做法有三种：全部贴金，金琢墨沥粉退晕和烟琢墨染香紫缘三色。若垫板固定为红地仗，画软卡子，檩枋则在蓝地仗上画硬卡子。绿地仗画软卡子。卡子与包袱之间随宜画花卉和枋心集锦。苏式彩画主要用于园林建筑中，具有变通、风趣、丰富的格调。反映出轻松，活泼，欢快的性格。'],
      ['中国古代建筑', '文献', '考工记', 'Kaogongji', '出自《周礼》，是中国第一部工科巨著，也是我国古代城市规划理论最早最权威的一部著作。', '是春秋战国时期记述官营手工业各工种规范和制造工艺的文献，提出了我国城市，特别是都城的基本规划思想和城市格局。'],
      ['中国古代建筑', '大木作·构件', '阑额', 'Lan\'e (Architrave)', '联络檐柱(或副阶柱);上承补间铺作之枋料。清代称为额枋。', '如 位于室内柱头上，则称内额，若于阑额下，再加一层枋料，则称由额。如不穿入柱头而在柱顶上放一根通长达整个建筑物立面的硕大枋料，则称为檐额，檐额下用绰幕枋承托(参见“绰幕枋”条)'],
      ['中国古代建筑', '文献', '木经', 'Mu Jing (Timberwork Manual)', '为宋代喻皓所著，是我国第一部木结构建筑手册，对营造法式有很强的参考价值，现已失传。', '为宋代喻皓所著，是我国第一部木结构建筑手册，对营造法式有很强的参考价值，现已失传。'],
      ['中国古代建筑', '石作', '慢道', 'Mandao', '以砖石露棱侧砌筑的斜坡道，又称礓石察。', '高长比一般为1：4，可做成几个斜面组合的形式，称三瓣蝉翼或五瓣蝉翼。'],
      ['中国古代建筑', '机构', '内工部', 'Neigongbu', '清康熙以后在内务府设立的机构，又称营造司。', '承担清代特有的大规模行宫和苑囿建造。'],
      ['中国古代建筑', '石作', '辇道', 'Niandao', '倾度平缓，用以行车的坡道，又称御路。', '常置于两踏跺之间，其上多雕刻云龙水浪，功能逐渐为装饰化所取代。'],
      ['中国古代建筑', '大木作·铺作', '平身科', 'Pingshenke', '清代斗拱名称。是指在两柱之间的阑额上的斗拱。', '宋时称斗拱为铺作，因斗拱所在位置的不同而有不同的名称。平身科的数量，通常当心间为两朵，其他次、梢间各一朵。各平身科之间的间隔大致相等。'],
      ['中国古代建筑', '结构体系', '平坐', 'Pingzuo (Terrace)', '高台或楼层用斗栱、枋子、铺板等挑出，以利登临眺望，此结构层称为平坐。', '在阁层在其下层梁上先立较短的柱和梁、额、斗拱，作为各层的基座，以承托各层的屋身，平坐斗拱上铺设楼板，并置勾阑，做成环绕一周的跳台、高台或楼层用斗拱、枋子、铺板等挑出，以利登临眺望，此结构层称为平坐，如观音阁，体现匠人智慧和精湛的技艺。'],
      ['中国古代建筑', '大木作·构件', '平梁', 'Ping Beam', '宋式建筑位于脊博下的梁，长二椽', '又称三架梁，宋式建筑位于脊槫下的梁，长二椽，上承托三檩。'],
      ['中国古代建筑', '大木作·铺作', '铺作', 'Puzuo (Bracket Set)', '宋代称为铺作，清代称斗拱。', '狭义上讲，铺作是中国古代汉族木构架建筑特有的结构构件，主要由斗、拱、昂、枋四类构件组成。在结构上承重，承托伸出的屋檐，将屋檐的重量直接或间接地转移到木柱上。同时还有一定的装饰作用。广义上讲，是指斗拱所在的铺作层，是建筑屋顶和屋身立面上的过渡。此外，他还作为封建社会中森严等级制度的象征，作为中国古代木构架的标志性构件具有重要的历史价值。'],
      ['中国古代建筑', '建筑类型', '牌坊', 'Paifang', '一种纪念性的建筑，主要由柱、依柱石、梁、枋、楼等几部分组成。', '它的形式有一间两柱、三间四柱等，也有大者能达到五间、七间的牌坊。柱于之间架有横梁相连。粱的上面承接着镌刻有建坊目的之类文字的枋，枋上建楼，粱与柱相连的拐角处多有雀替，每根石柱前后都有依柱石夹抱。牌坊建在陵墓，祠堂、衙署、园林等处，甚至是街旁、里坊、路口，既可作为种标志，也可用于褒扬功德、辟表节烈等。因此，牌坊分为：标志坊、功德坊和节烈坊。'],
      ['中国古代建筑', '大木作·构件', '普拍枋', 'Pupai Fang', '宋代建筑阑额与柱顶上四周交圈的一种木构件，清代称平板枋。', '犹如一道腰箍梁介于柱子与斗栱之间，既起拉结木构架作用，又可与阑额共同承载补间铺作。明、清称为平板枋。'],
      ['中国古代建筑', '大木作·构件', '雀替', 'Que Ti (Sparrow Brace)', '清式木装修构件名称。宋代称“角替”，又称“插角”或“托木”。', '通常被置于建筑的横材（梁枋）与竖材（柱）相交处，作用是缩短梁枋的净跨度，从而增强梁枋的荷载力；减少梁与柱相接处的向下剪力；防止横竖材间的角度倾斜。其制作材料由该建筑所用的主要建材决定，如木建筑上用木雀替，石建筑上用石雀替。'],
      ['中国古代建筑', '屋顶与瓦石', '戗脊', 'Qiangji', '又名岔脊，是重檐歇山顶自垂脊下端至屋檐部分的屋脊。', '在有不同方向的承梁板的屋顶中，起两个斜屋面交接处所形成的外角。是中国古代歇山顶屋面四条垂脊下，延角梁方向斜出的四条脊，和垂脊称 45°，对垂脊起支撑作用，戗脊上可安放戗兽，以戗兽为界分为兽前和兽后，又根据戗兽的等级象征建筑的等级。重檐屋顶的下层檐的檐角屋脊也是戗脊。'],
      ['中国古代建筑', '石作', '如意踏步', 'Ruyi Steps', '阶梯形踏步中不使用垂带石只用踏跺的做法。', '阶梯形踏步中不使用垂带石只用踏跺的做法。'],
      ['中国古代建筑', '大木作·构件', '乳栿', 'Ru Beam', '两步架的梁，宋称乳袱，清称双步梁。', '连接金柱和檐柱，一般不起承重作用。当廊子过宽时，其上可以加一瓜柱，架梁或桁，这时具有承载功能。'],
      ['中国古代建筑', '大木作·铺作', '双抄双下昂', 'Shuangchao Shuangxia\'ang', '双抄即出两个华棋，双下昂即设两个下昂。', '元代以后注头铺作不用昂，至清代，带下昂的平身科又转化为溜金斗棋的做法,原来斜昂的结构作思丧失殆尽。'],
      ['中国古代建筑', '大木作·构造', '生起', 'Shengqi (Rise)', '屋宇檐柱的角柱比当心间的两柱高2~12寸，其余檐柱也依势逐柱升高。', '因而宋代建筑的屋檐仅当心间为直线段，其余全由曲线组成。屋脊也因此而用生头木将脊博的两端垫高，形成曲线，使之与檐口相呼应。其他各博的生头木则使屋面形成双曲面。清代建筑无角柱升起。'],
      ['中国古代建筑', '大木作·构件', '随梁枋', 'Suiliang Fang', '明清大式建筑中起稳固梁作用的联系构件。', '在内柱之间用枋料加以联结，是最长的梁下的枋，称之为随梁枋。它提高了木构架的稳定性。他是明清建筑形制体系高度成熟化的反映，也体现了古代匠人的智慧和精湛的技艺。'],
      ['中国古代建筑', '屋顶与瓦石', '收山', 'Shoushan', '歇山顶的一种处理手法。', '是歇山屋顶两侧山花自山面檐柱中线方向向内收进的做法，其目的是为了是屋顶不至于庞大，但引起了结构上的某些变化，增加了顺梁，踩步金梁架等。例如南禅寺大殿山面。'],
      ['中国古代建筑', '彩画', '苏式彩画', 'Suzhou Style Painting', '起源于苏州，传入北京后，演变为官式彩画的一种。', '主要用于园林、住房的堂屋、亭榭、门廊、它的枋心有两种形式，一种是用于内檐梁架的狭长枋心，另一种是把檐檩、檐垫板、檐枋联成一体的包袱枋心。包袱心内可随宜画山水、人物、花卉楼台殿阁等画题，都是写实的非程式化的画题。它呈现出的轻松活泼欢乐的性格具有变通丰富丰美的格调。'],
      ['中国古代建筑', '历史', '舍宅为寺', 'Donating Residence as Temple', '佛教建筑发展的重要动因之一。', '即士族，富商将自己的家宅捐为佛寺，是当时市井寺庙的重要源头。这一时期最具有代表性的佛教建筑是北魏洛阳的永宁寺；以及河南登封嵩岳寺塔，这是我国现存最早的佛塔。'],
      ['中国古代建筑', '著名实例', '神通寺四门塔', 'Four Gates Pagoda', '山东历城神通寺四门塔建于隋大业年间，是我国现存最早的亭阁式塔。', '塔身单层，平面方形，四面各辟一半圆拱门。'],
      ['中国古代建筑', '近代建筑', '上海沙逊大厦', 'Sassoon House', '20世纪20年代英国新沙逊洋行投资兴建的一座“装饰艺术”风格的建筑。', '1872年，英籍犹太人伊利亚斯·沙逊在孟买成立新沙逊洋行，后来上海开设分行。1929年9月落成新楼。大楼19米高的墨绿色金字塔形铜顶是外滩的一个显著标志。其设计者是著名的公和洋行。底层西大厅和4～9层开设当时上海的顶级豪华饭店华懋饭店，有9个国家风格的客房，底层东大厅租给荷兰银行和华比银行，顶楼是沙逊自己的豪华住宅。1952年，上海市政府接管该楼。1956年作为和平饭店开放。1965年，外滩19号原汇中饭店并入，分别称为和平饭店北楼和南楼。1992年世界饭店组织将和平饭店列为世界著名饭店。'],
      ['中国古代建筑', '民居', '三间四耳倒八尺', 'Three Bays Four Ears', '云南“一颗印”民居的最典型格局。', '“三间四耳”指其正房、耳放毗连，正房为三开间，而左右各有两间耳放；倒八尺指居中的大门内所设的倒座深八尺。'],
      ['中国古代建筑', '理念', '尚祖制', 'Respect for Ancestral Systems', '对祖制的尊奉。', '这种对祖制的尊奉，使得营造过程长期处于沿袭前代技巧而少有突破的状态。'],
      ['中国古代建筑', '屋顶与瓦石', '水戗发戗', 'Shuiqiang Faqiang', '清代南方苏州一代房屋翼角的处理方法，此类方法还有嫩戗发戗。', '水戗发戗檐口比较平直，仔角梁基本不起翘。起翘的是戗脊，戗脊在屋角处脱离屋面，像象鼻一样伸出去。这样的构造相比嫩戗发戗来说简单得多。'],
      ['中国古代建筑', '制度', '三朝五门', 'Three Courts Five Gates', '古代帝王宫殿布局制度。', '东汉郑玄注《礼记 ·玉藻》曰“天子诸侯皆三朝”。又注《礼记·明堂位》曰“天子五门，皋、库、雉、应、路”、“诸侯三门”。这就是“三朝五门”的由来。三朝的称谓随时代而变，古称“外朝、治朝、燕朝”,唐称“大朝、常参、人阁”,宋称“大朝、常参、六参及朔望参(每五日及朔、望一参)”。即：大规模礼仪性朝会；日常议政朝会；定期朝会三种。但是一些疏于朝政的皇帝，往往不定期举行朝会，也就无所谓“三朝”之制了。', '三朝五门是中国古代天子宫殿的礼制布局，源于《礼记》记载，指三种朝会形式与五道宫门体系，象征皇权与行政分级。北京故宫的午门等体现了该制度，唐宋时期演变为大朝、常参等具体实践，反映了封建王朝的治理模式。'],
      ['中国古代建筑', '建筑类型', '窣堵波', 'Stupa', '古代佛教特有的建筑类型之一，佛塔的前身。', '主要用于供奉和安置佛祖及圣僧的遗骨（舍利)、经文和法物，外形是一座圆冢的样子，也可以称作佛塔。'],
      ['中国古代建筑', '大木作·构件', '山柱', 'Gable Column', '位于建筑山墙面的柱子。', '位于建筑山墙面的柱子。'],
      ['中国古代建筑', '工官', '司空', 'Sikong', '自周至汉，对中国最高工官的称呼。', '据司马迁解释司空“主司空土以居民”，因而可认为是由于主管人居空间而得名。'],
      ['中国古代建筑', '大木作·构件', '斗子蜀柱', 'Dou Zi Shu Column', '即在短柱上加一斗。', '又称侏儒柱，瓜柱，立于梁上。唐宋时常作为一种简洁的支撑体用于木、石栏板上或木构架的补间铺作位置上，见潘谷西《中国建筑史》图8-6斗栱右图及图8-7栏杆。唐时还常用人字形撑木，上加一斗作补间，今人称之为人字栱，见图8-6斗栱右图。', '斗子蜀柱是中国古代建筑中的简易支撑构件，由短柱上置一斗组成，多用于唐宋栏杆或补间铺作，兼具结构与装饰功能。山西五台山佛光寺东大殿中可见其应用，人字栱变体进一步简化了构造，体现了早期木作的实用性。'],
      ['中国古代建筑', '结构体系', '厅堂型构架', 'Tingtang Structure', '宋《营造法式》中显示出的一种构架形式，与殿堂型相对而言。', '厅堂型属于梁架分缝做法，内柱高于外柱，没有定型的平面，厅堂型构架的做法大为简化，显示出勃勃的生命力，斗拱分散于柱梁与外檐的节点，结构功能衰退，明清的抬梁式构架就是在厅堂型构架的基础上进一步发展的。南禅寺大殿、善化寺三圣殿均采用此法。显示了我国古代匠人的智慧。'],
      ['中国古代建筑', '结构体系', '抬梁式', 'Tailiang Construction', '柱头上搁置梁头，梁头上搁置檩条，梁上再用短柱支起较短的梁，如此层叠而上。', '我国木构架建筑结构体系之一，梁的总是可达 3~5 根。当柱上采用斗拱时，则梁头搁置在斗拱上。这种木构架多用于北方地区及宫殿、庙宇等规模较大的建筑物。'],
      ['中国古代建筑', '屋顶与瓦石', '推山', 'Tuishan', '是庑殿建筑处理屋顶的一种特殊手法，用于屋檐进深较大，正脊较短的建筑。', '由于立面上的需要，将正脊向两端推出，从而四条垂脊由 45°斜直线变为柔和曲线，并使屋顶正面和山面的坡度与步架距离都不一致，推山的运用，使庑殿顶呈现出宏大、伟壮的性格，是正式屋顶中等级最高的。此法在《营造法式》中已有规定，但至宋、辽迄明，建筑中有用有不用的，到清代才成为定形。'],
      ['中国古代建筑', '石作', '剃地起凸', 'Tidiqitu', '剔地凸起是宋代《营造法式》定出的四种雕镌形式之一。', '其他三种为压地隐起，减地平钑和素平。所谓剔地起突，就是高浮雕、半圆雕、母体凸出，石面较高，起伏大，层次多。如北京故宫太和殿御路石刻中的龙纹即为剔地起突。它的出现，体现了宋代建筑精致化的特点。'],
      ['中国古代建筑', '陵墓', '唐乾陵', 'Qianling Mausoleum', '唐高宗李治与武则天的合葬墓。', '建筑群处理日益成熟，宫殿、陵墓建筑加强了突出主体建筑的空间组合，强调了纵轴方向的陪衬手法，最典型的例子是唐乾陵。唐乾陵因山为陵，以墓前双峰为阕，再以二者之间依势上升的的地段为神道，神道两侧排列门阙、石柱、石兽、石人等，用以衬托主体建筑，花费少而收效大。'],
      ['中国古代建筑', '大木作·构件', '童柱', 'Tong Column', '放在横梁上，下端不着地，将上一层梁垫起，使之达到需要的高度的木块。', '放在横梁上，下端不着地，将上一层梁垫起，使之达到需要的高度的木块。'],
      ['中国古代建筑', '建筑类型', '坛庙', 'Altar and Temple', '坛庙出现起源于祭祀，祭祀是对人们向自然、神灵、鬼魂、祖先、繁殖等表示一种意向的活动仪式的通称。', '第一类祭祀自然神，其建筑包括天地日月风雨雷电社稷先农之坛，五岳五镇四海四渎之妙等。第二类是祭祀祖先。帝王祖庙称太庙，臣下称家庙或祠堂第三类是先贤祠庙，如孔子庙、诸葛武侯祠、关帝庙。'],
      ['中国古代建筑', '建筑师', '童寯', 'Tong Jun', '建筑五宗师之一，致力于中国式建筑设计理论探索和中国古典园林研究。', '曾加入华盖建筑事务所，并任教于南京大学，南京工学院多年，与刘敦桢杨廷宝共同塑造了建筑教育的“中大体系”和“南工风格”，代表作品有《江南园林志》。'],
      ['中国古代建筑', '机构', '基泰工程司', 'Kwan, Chu and Yang', '由关颂声于1920年在天津成立，朱彬和杨廷宝先后加入。', '由关颂声于1920年在天津成立，朱彬和杨廷宝先后加入。'],
      ['中国古代建筑', '民居', '坞壁', 'Wubi (Fortress)', '坞壁即平地建坞，围墙环绕，前后开门，坞内建望楼，四隅建角楼，略如城制。', '坞壁即平地建坞，围墙环绕，前后开门，坞内建望楼，四隅建角楼，略如城制。'],
      ['中国古代建筑', '屋顶与瓦石', '庑殿顶', 'Hip Roof', '庑殿顶是“四出水”的五脊四坡式，由一条正脊和四条垂脊（一说戗脊）共五脊组成，因此又称五脊殿。', '由于屋顶有四面斜坡，故又称四阿顶。古代建筑的一种屋顶样式。在中国是各屋顶样式中等级最高的，一般用于宫殿、庙宇。'],
      ['中国古代建筑', '建筑等级', '小式建筑', 'Minor Building', '清代官式建筑的构筑形式之一，属于低等次建筑。', '对比大式建筑，主要用于大式建筑中的辅助用房和宅舍、店肆等一般建筑。为了体现建筑的等级区分，小式建筑不得超过 5 间 7 架，不许用廊，不得带斗拱以及飞椽、扶脊木、角背、随梁枋等构件，其屋顶只能用硬山、悬山以及卷棚做法而不得作重檐。例如北京四合院的厢房属于小式建筑。大式建筑与小式建筑的出现，体现了封建礼制森严的等级制度。'],
      ['中国古代建筑', '屋顶与瓦石', '厦两头', 'Sha Liangtou', '宋代歇山建筑有两种称谓：在殿阁称“九脊殿”,非殿阁称厦两头造', '宋代时，歇山顶用于殿阁称为九脊顶，用于亭榭则称为厦两头造。两边带半截“撒头”的不完全四阿顶。它由一条正脊，四条垂脊和四条戗脊组成，分为带正脊的尖山与不带正脊的卷棚做法。凡卷棚就比尖山等级上下降半等，还可以做成重檐，显现出华丽的效果。'],
      ['中国古代建筑', '彩画', '旋子彩画', 'Xuanzi Painting', '清式彩画中殿式彩画的一种形式，等级次于和玺彩画。', '多用于宫殿、坛庙、陵寝的次要建筑和寺庙等组群中的主次建筑。其主要特点是在藻头里画旋子图案，最标准的是画一个整旋子和两个半旋子，称为一整二破。根据藻头长宽比的不同，有 8 种藻头定型格式。旋子彩画的枋心可画成空枋心、一字枋心、锦枋心等。其用色主要为蓝绿点金，与和玺彩画一样，表现出规整、端庄、凝重的格调。'],
      ['中国古代建筑', '园林', '小中见大', 'Seeing Big in Small', '以借景和障景的园林手法，主要是以延长视距/景深和景物间相互屏障或遮障的手法取得的,取得园林边界模糊的效果。', '以借景和障景的园林手法，主要是以延长视距/景深和景物间相互屏障或遮障的手法取得的,取得园林边界模糊的效果。'],
      ['中国古代建筑', '工官', '徐杲', 'Xu Gao', '明代工官，主持重建北京前三殿和西苑永寿宫。', '明代工官，主持重建北京前三殿和西苑永寿宫。'],
      ['中国古代建筑', '石作', '象眼', 'Xiangyan', '台阶侧面的三角形部分，宋代时作层层收叠状。', '台阶侧面的三角形部分，宋代时作层层收叠状。'],
      ['中国古代建筑', '民居', '一明二暗', 'One Bright Two Dark', '一堂二间：又称为“一明两暗”，是木构架建筑开间的布局形式。', '由于受到封建等级限制，低品官和庶人的宅第，正房不得超过三间，所以大多数都采用一堂二内的形式。如北京四合院住宅的正房、厅房、厢房大多数都是“一堂二间”的三开间基本型。这种布局形式反应了封建礼制下的等级观念。'],
      ['中国古代建筑', '彩画', '一整二破', 'Yizheng Erpo', '清式旋子彩画中藻头的 8 中图案之一。', '是在藻头内画一个整旋子和两个半旋子，是标准的旋子图案。分为旋眼，一路瓣，二路瓣。旋子的用色原则与和玺彩画一样，主要为蓝绿色点金，多用于宫殿，坛庙陵寝的次要建筑和寺庙的主要建筑等组群的主次要建筑。一整二破的标准构图反映出殿式彩画二维平面视感与规整端庄凝重的格调。'],
      ['中国古代建筑', '民居', '一颗印', 'Seal-like Compound', '云南“一颗印”是云南中部地区普遍采用的一种住宅形式。', '它由正房、耳房（厢房）和入口门墙围合成正方如印的外观，故得名一颗印。'],
      ['中国古代建筑', '机构', '营缮司', 'Yingshan Si', '明清时期在工部设立的机构，负责朝廷各项工程的营建。', '明清时期在工部设立的机构，负责朝廷各项工程的营建。'],
      ['中国古代建筑', '大木作·构件', '月梁', 'Crescent Beam', '天花下面的明栿', '唐宋建筑平棊之下的明栿均做成月梁，其做法是将梁的两端加工成下弯的曲线，梁面弧起，形如月牙，梁首、梁尾、梁底有卷杀，梁侧面往往制成琴面并装饰以雕刻，从而取得柔美清秀的效果，丰富了木构架的艺术效果。月梁在汉代称为虹梁，宋称为月梁。明代以后南方地区建筑中尚保留此法，而北方已不用。月梁的使用，体现了宋朝建筑秀美，精致的特点。见潘谷西《中国建筑史》图8-3、图8-6梁架下'],
      ['中国古代建筑', '石作', '压地隐起', 'Yadiyinqi', '宋代《营造法式》中定出的四种雕镌形式之一。', '其他三种为剔地起突，减地平钑和素平。其特征是浅浮雕、地下凹、在一平面，母体凸起，高出石面不多，其最高凸点均在一平面上。雕刻部位有起伏，有深度感。如北京天安门前的汉白玉华表即应用了压地隐起的手法。它的出现，体现了宋朝建筑精致、秀美的特点。'],
      ['中国古代建筑', '彩画', '烟云', 'Yanyun', '清代苏式彩画中的一种彩画形式。', '当彩画中的枋心为包袱枋心时，则可在包袱边缘用折叠的退晕曲线，由此曲线构成的图案即为烟云。包袱心内科随宜画山水、人物、花卉、楼台、殿阁等画题，烟云包袱可做五色粉退晕，每种色彩退晕五道，七道或九道，因烟云采用了退晕的手法，故而强调了彩画的立体感和透视感，使得苏式彩画呈现出轻松、活泼、换了的性格，具有变通、风趣和丰美的格调。'],
      ['中国古代建筑', '工官', '宇文恺', 'Yuwen Kai', '隋代工官，曾主持规划隋大兴城修建。', '隋代工官，曾主持规划隋大兴城修建。'],
      ['中国古代建筑', '工官', '喻皓', 'Yu Hao', '宋代木匠，著有《木经》，为《营造法式》的前身。', '宋代木匠，著有《木经》，为《营造法式》的前身。'],
      ['中国古代建筑', '工官', '样式雷', 'Yangshi Lei', '清代宫廷建筑设计由“样式房“承担，在样式房服设时间最长的当推雷氏家族，人称“样式雷”。', '至今仍留有大量笛氏所做圆明园和清代帝后陵墓的工程图纸、模型和工程说明书。(图纸称“画样”，模型称“烫样”。工程说明书称“工程做法”这是一份非常珍贵的研究清代建筑的档案资料。）'],
      ['中国古代建筑', '大木作·构件', '檐柱', 'Eave Column', '位于建筑物外围的柱子。', '位于建筑物外围的柱子。'],
      ['中国古代建筑', '园林', '苑囿', 'Imperial Garden', '供历代帝王进行起居，骑射，观奇，宴游，祭祀以及召见大臣，举行朝会等各种活动的场地。', '一般在京城周围设置若干个。先秦时多称"囿"，汉多称为"苑"。"苑囿"合称也较为常见。3-苑囿是以园林为主的皇帝离宫，除了布置园景游憩之外，还包括有举行朝贺和处理政务的宫殿以及皇帝、后妃和服务人员的居住建筑、生活供应建筑及庙宇等。汉以前是帝王贵族畋（tián）猎的苑囿为主的时期。'],
      ['中国古代建筑', '陵墓', '因山为陵', 'Mountain as Mausoleum', '利用山丘作为陵墓，把地宫掘进山里去。', '代表实例：唐太宗昭陵、乾陵。'],
      ['中国古代建筑', '建筑师', '杨廷宝', 'Yang Tingbao', '中国建筑史事务所中首屈一指的基泰工程司的建筑设计主要负责人。', '杨延宝的设计灌注了新建筑民族特色，尝试运用大屋顶和点缀传统装饰灯不同的处理手法，设计中善于掌握整体环境，作品表现出洗练凝重的风格。在中国近代建筑界有很高的声誉。其作品有南京中央医院，中山陵音乐台等。'],
      ['中国古代建筑', '机构', '营造学社', 'Society for Research in Chinese Architecture', '中国近代重要的建筑研究团体。由中国私人兴办，朱启钤创立并任社长。', '社员有梁思成、林徽因、刘敦桢等。学社从事古代建筑实例的调查，研究与测绘，以及文献资料耳朵搜集，整理与研究。它对中国传统建筑的研究与保护作用是空前的，发现了许多重要建筑，还培养了一大批优秀人才，出版过大量专著，为中国古代建筑史研究做出重大贡献，奠定了中国建筑学的基石。'],
      ['中国古代建筑', '文献', '营造法式', 'Yingzao Fashi', '为宋代李诫所主持编撰，是我国最完整的古代建筑技术书记。', '收录大量各工种造作规程，技术要求和构建加工方法。'],
      ['中国古代建筑', '度量', '足材', 'Zucai', '宋代《营造法式》中由单向值的斗口派生出的双向值断面尺寸。', '“一材一栔” 为足材，高 21 分。其中材为斗拱或素方用断面尺寸，高宽比为 3:2,（高 15 分宽 10 分），栔为两层斗拱之间填充的木件断面尺寸，高 6 分宽 4 分，故一足材为 21 分宽 10 分。足材的出现，对于统一建筑标准，建立设计规范，简化设计工作，方便工料预算，便于构件预制，加快施工进度，都起到了重要的作用。'],
      ['中国古代建筑', '装修与空间', '藻井', 'Caisson Ceiling', '常见于汉族宫殿，坛庙建筑中的室内顶棚的独特装饰部分。', '是天花板两种形式之一的平棊的向上凹入的部分，通常位于天花板的核心位置，呈伞盖形，象征天室的崇高。一般用在殿堂明间的正中，如帝王御座、神佛像座上。常见的是八角形的斗八藻井，也有圆藻井。藻井是木构建筑一项繁琐的装饰技术，其设置起到了烘托室内空间的作用。北京故宫太和殿中心的蟠龙藻井是现存藻井中最华贵的。'],
      ['中国古代建筑', '彩画', '藻头', 'Zaotou', '又称为“找头”，清式彩画的布局中，箍头与枋心之间的部位即称为藻头。', '清式彩画的布局是将梁枋均分为 3 段：中段为枋心，左右两端的端头作箍头，箍头由“合子”和两侧的箍头线组成，箍头与枋心之间的部位即称为藻头。在和玺彩画中，藻头与枋心间用“圭线”“岔口线”相隔，用“圭线”“圭光线”与箍头相隔，以龙为画作母题，蓝绿为主色调。在旋子彩画中，以旋子为母题。在苏式彩画中，藻头部分将檩、垫、枋分画，各在端头画卡子。卡子与包袱之间随宜画花卉与枋子集锦。藻头是彩画的重要表现部位，因其上彩画不同，可表现出或庄严或轻松的格调。'],
      ['中国古代建筑', '陵墓', '兆域图', 'Zhaoyu Tu', '是1983年10月在河北省平山县中山国古墓发现的一块铜板地图。', '铜版上记述了中山王颁布修建陵园的诏令，图文用金银镶嵌。'],
      ['中国古代建筑', '大木作·构件', '中柱', 'Central Column', '在建筑物纵中线上，除山面二端外，顶端支承脊槫(桁、檩) 的通柱称为中柱。', '中柱柱径较其他各柱为大。宋式建筑又称分心柱。'],
      ['中国古代建筑', '陵墓', '中山陵', 'Dr. Sun Yat-sen\'s Mausoleum', '孙中山先生的陵墓，建于1926～1929年，位于今南京市东郊紫金山南麓。', '东毗灵谷寺，西邻明孝陵，整个建筑群依山势而建，由南往北沿中轴线逐渐升高，主要建筑物排列在一条中轴线上。中山陵各个建筑在型体组合、色彩运用、材料表现和细部处理上均取得极好的效果，色调和谐统一，增强着庄严的气氛，含意深刻，气势宏伟，被誉为“中国近代建筑史上第一陵”。'],
      ['中国古代建筑', '大木作·构件', '仔角梁', 'Zijiao Beam', '平行放置在老角梁上的构件，称之为仔角梁（也有写作“梓梁”的）。', '仔角梁的后尾置于搭角下金檫（桁）上，仔角梁头又长出一段。其出挑长度按正身飞椽水平投影长又加出三个椽径。'],
      ['中国古代建筑', '人名', '朱启钤', 'Zhu Qiqian', '近代政治家，中国营造学社创办人。', '近代政治家，中国营造学社创办人。'],
      ['中国古代建筑', '近代建筑', '中山纪念堂', 'Sun Yat-sen Memorial Hall', '广州中山纪念堂是广州人民和海外华侨为纪念伟大的革命先行者孙中山先生而筹资兴建的会堂式建筑。', '由我国著名建筑师吕彦直先生设计,于1931年建成,是广州近代城市中轴线上的重要节点。'],
      ['中国古代建筑', '大木作·铺作', '斗拱', 'Dougong', '又称枓栱、斗科、欂栌、铺作等，是中国建筑特有的一种结构。', '在立柱顶、额枋和檐檩间或构架间，从枋上加的一层层探出成弓形的承重结构叫拱，拱与拱之间垫的方形木块叫斗，合称斗拱。'],
      ['中国古代建筑', '大木作·度量', '材', 'Cai', '基本意思是木料，泛指一切原料或资料。在建筑中指标准材。', '基本意思是木料，泛指一切原料或资料。在建筑中指标准材。'],
      ['中国古代建筑', '大木作·铺作', '转角铺作', 'Corner Bracket Set', '转角铺作又称为角科斗拱，是檐下斗拱的三种类型之一。', '按照斗拱的出现位置，其余两种分别为：平身科（又称补间铺作）与柱头科（又称柱头铺作）。'],
      ['中国古代建筑', '大木作·铺作', '柱头铺作', 'Column-top Bracket Set', '柱头铺作又称为柱头科斗拱，是斗拱的三种类型之一。', '其余两种分别为：平身科（又称补间铺作）与角科（转角铺作）。'],
      ['中国古代建筑', '大木作·铺作', '栌斗', 'Lu Dou (Cap Block)', '一组斗栱最下面的构件，是重量集中处最大的斗。', '宋朝时称为“栌枓”。又称坐斗 ，大斗。'],
      ['中国古代建筑', '大木作·铺作', '交互斗', 'Jiaohu Dou', '十八斗，又称交互斗，是指在翘昂两端，承托上层栱昂交叉点、栱翘交叉点，十字卯口。', '十八斗，又称交互斗，是指在翘昂两端，承托上层栱昂交叉点、栱翘交叉点，十字卯口。'],
      ['中国古代建筑', '大木作·铺作', '散斗', 'San Dou', '散斗是比座斗小的斗。', '因旧时量米容器中较大的称斗，小的叫升，且按十升为一斗进制，故此而得名。'],
      ['中国古代建筑', '大木作·铺作', '华栱', 'Hua Gong', '宋式斗拱上外跳之栱', '华栱，垂直出跳构件，分足材和单材，足材加栔。'],
      ['中国古代建筑', '大木作·铺作', '瓜栱', 'Gua Gong', '瓜栱是位置於於斗栱中间位置而得名的中国古代建筑的名词。', '瓜栱是位置於於斗栱中间位置而得名的中国古代建筑的名词。'],
      ['中国古代建筑', '大木作·铺作', '泥道栱', 'Nidao Gong', '宋代斗拱构件名称,相当于清代的正心瓜拱。', '位于斗拱左右中线上的瓜拱,也在檐柱中心线上,这样的瓜拱叫做“正心瓜拱”。因为宋代时两朵斗拱之间的空档,也就是拱眼壁,当时是用泥坯填塞,所以有“泥道拱”之名。'],
      ['中国古代建筑', '大木作·铺作', '令栱', 'Ling Gong', '宋代斗拱构件名称,相当于清代的厢拱。', '斗拱中最外一踩承托挑檐枋,或是最里一踩承托天花枋的拱,叫做“厢拱”。厢拱置于最上层的昂或翘上面。'],
      ['中国古代建筑', '大木作·铺作', '耍头', 'Shuatou', '斗栱衬方头下所用出跳木料，称为耍头木。清式称蚂蚱头。', '最上一层栱或昂之上，与令栱相交而向外伸出如蚂蚱头状的部分叫做耍头。也叫做“爵头”、“胡孙头”。'],
      ['中国古代建筑', '大木作·铺作', '蚂蚱头', 'Grasshopper Head', '蚂蚱头,也叫猢狲头。顶层华栱(明、清称“翘”)或昂上与令栱(明、清称“厢拱”)垂直相交的构件。', '蚂蚱头,也叫猢狲头。顶层华栱(明、清称“翘”)或昂上与令栱(明、清称“厢拱”)垂直相交的构件。'],
      ['中国古代建筑', '大木作·铺作', '七铺作', 'Seven-puzuo', '宋代斗拱规格之一。', '宋朝的昂一直延伸到后方，支撑着内罗汉枋。至于耍头则也做成昂的形状。不需要延伸到最后。慢拱上方支撑着枋，这样一个简易的宋代七铺作双抄双下昂计心柱头斗拱就做完了。'],
      ['中国古代建筑', '大木作·铺作', '人字栱', 'Inverted V-shaped Brace', '人字栱,人字拱是古代建筑斗栱组合形式的一种,亦称人字形栱。', '人字栱,人字拱是古代建筑斗栱组合形式的一种,亦称人字形栱。'],
      ['中国古代建筑', '大木作·构件', '槫', 'Tuan (Purlin)', '即"桁"或叫"檩"，宋代称"槫"。', '架在梁头位置的沿建筑面阔方向的水平构件。其作用是直接固定椽子，并将屋顶荷载通过梁而向下传递。'],
      ['中国古代建筑', '大木作·构件', '脊槫', 'Ridge Purlin', '又称脊檩。中国古建筑中的构件之一。明清之前用叉手支撑，后用侏儒柱支撑。', '又称脊檩。中国古建筑中的构件之一。明清之前用叉手支撑，后用侏儒柱支撑。'],
      ['中国古代建筑', '大木作·构件', '平槫', 'Ping Purlin', '宋式大木作构件名称。脊槫和檐槫(包括牛脊槫)之间各槫的通称。', '主要用于承托花架槫及屋顶中部荷重。为圆木,长随间广。'],
      ['中国古代建筑', '大木作·构件', '撩风槫', 'Liaofeng Purlin', '宋斗栱外端令栱之上用以承托屋檐之枋料。', '此枋荷载大,故断面高度为其他枋之1倍,如用圆料,则称撩风槫。'],
      ['中国古代建筑', '大木作·构件', '椽', 'Rafter', '椽子，承托屋面用的木构件。圆的叫椽，方的也叫桷。', '椽子，承托屋面用的木构件。圆的叫椽，方的也叫桷。'],
      ['中国古代建筑', '大木作·构件', '飞子', 'Flying Rafter', '因戗角部位的飞椽随着摔网椽,亦作摔网状而逐根立起,成曲线与嫩戗相齐,故将该部位的飞椽,称为立脚飞椽。', '因戗角部位的飞椽随着摔网椽,亦作摔网状而逐根立起,成曲线与嫩戗相齐,故将该部位的飞椽,称为立脚飞椽。'],
      ['中国古代建筑', '大木作·构件', '花架椽', 'Huajia Rafter', '花架椽又叫平椽，也是清式建筑中椽子的名称之一。', '花架椽就是处在各个金桁上的椽子，也可以说只要是在脑椽和檐椽之间的椽子部分，都叫花架椽。花架椽就像金枋、金桁等构件一样，依据建筑物的进深大小、步架多少，在名称上区分出"上花架椽"、"下花架椽"等。'],
      ['中国古代建筑', '大木作·构件', '檐椽', 'Eave Rafter', '架在下金桁与檐桁(正心桁)间的这段椽子,是木构架中最外侧一步架上的椽子。', '架在下金桁与檐桁(正心桁)间的这段椽子,是木构架中最外侧一步架上的椽子。'],
      ['中国古代建筑', '大木作·构件', '驼峰', 'Camel Hump', '梁上垫木，用之承托上面的梁头，其状如驼峰', '为宋式大木作构件名称。即上明造梁架中配合斗栱使用的支承梁结点的构件。同时有美化梁栿构架的作用。造型状似驼峰。'],
      ['中国古代建筑', '装修与空间', '平闇', 'Ping\'an', '唐宋间使用的一种小方格天花，规格较大方格平栱稍低，一般不作 华丽的彩画', '见潘谷西《中国建筑史》图5-4及图8- 7天花、藻井左图。现存实例是辽代独乐寺的观音阁以及山西五台山佛光寺大殿。'],
      ['中国古代建筑', '装修与空间', '平棋', 'Pingqi', '棋即室内吊顶,古代也叫做"承尘"。', '在木框间放较大的木板,板下施彩绘或贴以有彩色图案的纸这种形式在宋代成为平棋。'],
      ['中国古代建筑', '彩画', '五彩遍装', 'Wucai Bianzhuang', '在梁、拱的面上，用青绿色或朱色的迭晕为外缘作轮廓，里面画彩色花饰，以朱色或青绿色衬底，色彩效果十分华丽。', '在梁、拱的面上，用青绿色或朱色的迭晕为外缘作轮廓，里面画彩色花饰，以朱色或青绿色衬底，色彩效果十分华丽。'],
      ['中国古代建筑', '彩画', '七朱八白', 'Seven Red Eight White', '七朱八白是宋代《营造法式》彩画作制度中丹粉刷饰屋舍的方法之一。', '七朱八白是宋代《营造法式》彩画作制度中丹粉刷饰屋舍的方法之一。'],
      ['中国古代建筑', '装修与空间', '直棂窗', 'Vertical Mullioned Window', '窗框内用直棂条（方形断面的木条）竖向排列有如栅栏的窗。', '若用三角形断面的破子棂条，又称破子棂窗。'],
      ['中国古代建筑', '装修与空间', '乌头门', 'Wutou Gate', '宋《营造法式》中记载的门的一种类型，是坊门和高等级住宅的一种特殊造型，也称乌头大门、棂星门。', '两门柱上架一横木，设双开门，门扇上部安直棂，可透视门内外。柱顶套瓦筒，墨染，故称乌头门。横木上常安日月板。此门用于官邸及祠庙、陵墓之前。'],
      ['中国古代建筑', '装修与空间', '王府大门', 'Wangfu Gate', '中国古代建筑的一种屋宇式宅门，等级高于广亮大门、金柱大门等。', '用于王府，通常有三间一启门和五间三启门两个等级，门上有门钉。'],
      ['中国古代建筑', '大木作·铺作', '偷心', 'Touxin', '偷心造是木结构建筑跳头上不置横栱的斗拱构造形式之一。', '横拱的设置少于斗拱出踩，如斗拱各向内外两侧挑出三拽架称为七踩 ，应列有七列横拱，但在制作时却省去一列或数列横拱，这种做法称为偷心造。'],
      ['中国古代建筑', '大木作·构件', '丁头栱', 'Dingtou Gong', '位于梁下的半截栱。原由串枋出头部分作成，后成为梁头下的装饰。', '丁头栱是中国古代建筑中位于梁头下方的半截栱构件，兼具结构承重与装饰美化的双重功能。其最初由串枋出头部分演化而来，唐代佛光寺大殿的斗栱结构中已出现丁头栱承托平棊枋的实例。至明清时期，丁头栱发展为柱头科斗拱的特殊做法，常以梁头替代传统栱木。在闽南地区建筑中，泉州开元寺大雄宝殿后檐采用两跳丁头栱出挑屋檐，形成独特的地域性构造手法。'],
      ['中国古代建筑', '大木作·构件', '上昂', 'Shang\'ang', '昂有两种：上昂和下昂。上昂用于室内支承天花或用于平坐下，因昂首向上而得名。下昂用于外檐承挑檐，因昂尖向下而得名。', '上昂是宋《营造法式》记载的斗拱构件，属于昂类两大类型之一，其构造特征为向外上方斜出。该构件通过斜向支撑体系，在殿身槽内里跳及平座外檐外跳处，实现较短出跳距离内提升铺作总高度，以满足特定空间营造需求。与向下倾斜以降低抬升高度的下昂不同，上昂在宋代官式建筑中承担着调整建筑空间比例的特殊结构性功能。现存江苏吴县甪直保圣寺大殿等宋代建筑遗存中仍可见其应用实例。至明清时期，上昂作为结构性构件逐渐消失，仅保留装饰性形态。'],
      ['中国古代建筑', '度量', '八架椽', 'Ba Jia Chuan', '宋代房屋进深以椽数呼之，如“四架椽”即四椽之深，“八架椽”即八椽之深。清代则以檩数称呼，如“五檩”即宋之四架椽，“九檩”即宋之八架椽。', '八架椽是宋代建筑进深计量单位，指房屋深度为八根椽子长度，相当于清代的九檩房屋，用于描述建筑规模，反映了宋清时期建筑计量体系的演变和标准化。'],
      ['中国古代建筑', '屋顶与瓦石', '九脊屋顶', 'Jiu Ji Wu Ding', '即歇山顶。用于殿阁则称九脊殿，用于亭榭、厅堂则称厦两头造。', '九脊屋顶即歇山顶，由四坡和五脊扩展而成，共九条脊，适用于殿阁、亭榭等建筑，体现了中国古建筑屋顶形式的多样性和等级区分，如用于殿阁称九脊殿。'],
      ['中国古代建筑', '大木作·铺作', '九踩斗栱', 'Jiu Cai Dou Gong', '清式斗栱按出跳数称呼。里外出一跳称为三踩斗栱，出二跳称为五踩斗栱，出三跳称为七踩斗栱，出四跳称为九踩斗栱。牌坊斗栱可多至十一踩。', '九踩斗栱是清代斗拱分类，按出跳数命名，出四跳即九踩，用于大型建筑或牌坊，体现了清式斗拱的复杂性和装饰功能，最多可达十一踩，反映了建筑等级。'],
      ['中国古代建筑', '建筑类型', '门屋', 'Men Wu', '指宫殿、庙宇、邸宅中单独成栋的屋宇，有一间、三间、五间……明清北京故宫太和门为九间，等级最高。', '门屋是宫殿、庙宇或宅邸中的独立门楼建筑，按间数分等级，如故宫太和门为九间最高级，体现了封建礼制中的建筑等级和入口威严。'],
      ['中国古代建筑', '装修与空间', '山花蕉叶', 'Shan Hua Jiao Ye', '用于佛塔、佛龛、经柜等顶部的叶栿或如意头栿装饰纹样。', '山花蕉叶是中国古建筑中的装饰纹样，多用于佛塔、佛龛顶部，形如蕉叶或如意头，常见于宋明佛教建筑，象征吉祥和华美。'],
      ['中国古代建筑', '大木作·构件', '斗子蜀柱', 'Dou Zi Shu Zhu', '即在短柱上加一斗。唐宋时常作为一种简洁的支撑体用于木、石栏板上或木构架的补间铺作位置上，见图8-6斗栱右图及图8-7栏杆。', '斗子蜀柱是唐宋建筑中的支撑构件，在短柱上置一斗，用于栏板或补间铺作，简洁实用，也见于人字拱形式，体现了古建筑的支撑创新。'],
      ['中国古代建筑', '风水', '五土五谷', 'Wu Tu Wu Gu', '五土指东、西、南、北、中五方之土；五谷指稻、黍、稷、麦、菽五种谷物。', '五土五谷源于中国古代风水和农业文化，五土代表五方土壤，五谷为五种主要作物，用于祭祀和风水规划，体现了古人天人合一的理念。'],
      ['中国古代建筑', '陵墓', '月牙城', 'Yue Ya Cheng', '明清帝陵宝城和方城之间有一小院称月牙城，俗称“哑巴院”。', '正前方城所筑之墙称为月牙墙(据《刘敦桢文集》二“易县清西陵”)。或称小院为“哑吧院”,而正前方城之墙为“月牙城”(据王其亨《明代陵墓建筑》)。月牙城是明清帝陵中的小院，位于宝城与方城间，俗称哑巴院，墙体弧形如月牙，用于陵区划分，体现了陵墓建筑的礼仪性和防御设计。'],
      ['中国古代建筑', '风水', '五音姓利', 'Wu Yin Xing Li', '唐宋间流行的一种风水术。', '将天下所有姓氏归属宫、商、角、徵、羽五音，行事凶吉，都依其所定之法为据。如宫、角二姓的墓葬宜用艮家丙穴之类五音姓利是唐宋风水术，将姓氏归五音，用于墓葬选址等，明清渐废，反映了古代风水与音乐、五行结合的迷信实践。'],
      ['中国古代建筑', '陵墓', '方城明楼', 'Fang Cheng Ming Lou', '明清帝陵坟丘前的城楼式建筑，下为方形城台，上为明楼，楼中立庙谥碑。', '此式始于安徽凤阳明皇陵。皇陵有内外三重陵墙，中间一道陵墙四门如城楼，分别称南、北、东、西明楼，及至南京明孝陵，仅有一座明楼。以后明清各帝陵均大致沿袭孝陵方城明楼形制，象征皇权永恒，用于安放谥号碑。'],
      ['中国古代建筑', '装修与空间', '天宫楼阁', 'Tian Gong Lou Ge', '用小比例尺制作宫殿楼阁木模型，置于藻井、经柜(转轮藏、壁藏)及佛龛(佛道帐)之上，以象征神佛之居，多见于宋、辽、金、明的佛殿中。', '天宫楼阁是佛教建筑中的微型模型，置于藻井或经柜顶，象征神佛居所，常见于宋明佛殿，体现了宗教建筑的象征性和工艺精湛。'],
      ['中国古代建筑', '陵墓', '石几筵', 'Shi Ji Yan', '明清帝王陵墓内明楼前所列石刻香炉一、花瓶二、烛台二共五件，立于石台之上，称为石五供，象征对死者祭奠崇敬之情。', '石几筵即石五供，明清帝陵明楼前的石雕祭器，包括炉、瓶、台，象征祭奠，体现了陵墓礼仪的庄严和对逝者的尊崇。'],
      ['中国古代建筑', '大木作·构件', '冬瓜梁', 'Dong Gua Liang', '断面为圆形的梁和额枋两端圆混，立面如冬瓜栿者，多见于赣皖一带。', '冬瓜梁是赣皖地区建筑中的圆形梁，两端圆润如冬瓜，用于额枋等，体现了地方建筑的独特造型和实用美学。'],
      ['中国古代建筑', '屋顶与瓦石', '四阿屋顶', 'Si A Wu Ding', '即四面坡的庑殿顶，宋代称四阿顶，或称五脊殿。', '四阿屋顶即庑殿顶，四面坡五脊，宋称四阿顶，用于高级建筑，体现了屋顶形式的尊贵和稳定性。'],
      ['中国古代建筑', '大木作·构件', '正贴', 'Zheng Tie', '“贴”是指一榀木架，含柱、枋、梁等构件，正贴为明间木架。', '正贴是江南建筑术语，指明间的主木架，包括柱枋梁，相对于边贴，用于建筑核心部分，体现了构架的层级划分。'],
      ['中国古代建筑', '大木作·构件', '边贴', 'Bian Tie', '“贴”是指一榀木架，含柱、枋、梁等构件，边贴为山面木架。', '边贴是江南建筑术语，指山面侧木架，与正贴相对，用于建筑侧部，体现了地方建筑的构架分类和稳定性设计。'],
      ['中国古代建筑', '装修与空间', '平棋', 'Ping Qi', '唐宋时使用的大方格天花，格内贴络木雕花饰，并绘彩画。', '平棋即平栱，唐宋大方格天花，内饰雕花彩画，用于室内装饰，与平闇相对，体现了古建筑天花的华丽和功能性。'],
      ['中国古代建筑', '大木作·铺作', '四铺作', 'Si Pu Zuo', '宋代斗栱出一跳称为四铺作。从下而上，依次有栌斗、华栱(插昂)、耍头、衬方头，共四层，故称四铺作。', '四铺作是宋代斗拱出跳分类，一跳四层，包括栌斗华栱等，用于支撑出檐。五铺作则多一层下昂或华栱，共五层，出二跳。六铺作、七铺作、八铺作依此类推(参见“铺作”条)。'],
      ['中国古代建筑', '大木作·构件', '瓜楞柱', 'Gua Leng Zhu', '采用拼邦法加粗柱子，柱身成瓜楞栿，近人呼之为瓜楞柱，宋《营造法式》称“蒜瓣柱”。', '瓜楞柱是宋代柱子加粗法，一般用八根小圆木拼于中间圆木上，成八楞形。石柱也有枋木柱作瓜楞形者，如江苏苏州罗汉院大殿石柱。拼成多棱形，如蒜瓣，用于木石柱，增强强度，常见于苏州等地。'],
      ['中国古代建筑', '度量', '当心间', 'Dang Xin Jian', '“心”即中心。“当心间”、“心间”即建筑物的中间一间。', '当心间是中国古建筑的中心间，用于主殿或核心空间，体现了建筑对称性和等级中心的设计理念。'],
      ['中国古代建筑', '城池', '羊马城', 'Yang Ma Cheng', '城墙与城濠之间所筑的小墙(又称羊马垣)。', '高5尺，厚6尺，上立雉堞，去城墙约6丈，是城墙的外围防卫设施(《通典 ·兵典》)。五代后唐时成都罗城外曾筑羊马城。'],
      ['中国古代建筑', '大木作·构件', '讹角斗', 'E Jiao Dou', '即方斗，四角内凹成海棠纹栿。', '讹角斗是方斗变体，四角凹成海棠纹，用于斗拱，增强装饰性，常见于宋代建筑。'],
      ['中国古代建筑', '大木作·构件', '托脚', 'Tuo Jiao', '宋代建筑上各樽均用斜杆支撑固持。其中支撑脊博的斜杆称为叉手，其余称为托脚。', '托脚是宋代斜杆支撑，除叉手外用于其他檩条，增强稳定性，体现了古建筑的支撑系统。'],
      ['中国古代建筑', '大木作·铺作', '抄', 'Chao', '宋代斗拱出一跳华栱称为“一抄”,或“出一卷头”。', '出二跳华栱称为两抄，或出两卷头。“抄”或写作“杪”(音秒),是因《营造法式》传抄版本不同所致。“抄”的含义与华栱形象较接近，似较可信。'],
      ['中国古代建筑', '屋顶与瓦石', '两厦', 'Liang Sha', '即两坡的悬山顶，宋时称两厦或“两下”、“不厦两头造”。', '两厦即悬山顶，两坡形式，宋代称呼，用于非殿阁建筑，体现了屋顶的简易和地域适应。'],
      ['中国古代建筑', '陵墓', '灵寝门', 'Ling Qin Men', '明代帝陵的寝宫门，或内红门，用于划分陵区', '明代帝陵明楼之下有灵寝门(《明会典》二○三),是陵区寝宫之门；或谓区划陵殿(嘉靖时改称凌恩殿)与方城明楼间的内红门，即灵寝门。似以前说为是。'],
      ['中国古代建筑', '制度', '卤簿', 'Lu Bu', '以大盾为前导之兵器旗杖队伍，始于秦汉。', '历代天子、后妃、王公大臣均有不同规格的卤簿。按规格分级，用于出行，体现了封建礼制的威仪和等级。'],
      ['中国古代建筑', '塔刹', '刹', 'Cha', '佛塔顶上所立之柱及相轮、宝盖等附属物，统称为刹。', '原为佛祖墓顶之伞盖，示尊崇之意，至中国则安于塔顶。佛寺、佛塔也可别称为刹。'],
      ['中国古代建筑', '大木作·构件', '衬方头', 'Chen Fang Tou', '宋式斗栱最上一层出跳之木，在耍头之上，用以拉固燎檐枋及平栱枋。', '衬方头是宋式斗拱顶层木，用于固定檐枋，清式称为撑头木，上承桁椀(图8-12、图9-7)。'],
      ['中国古代建筑', '大木作·构件', '明栿', 'Ming Fu', '与草栿相对而言，指天花以下的梁。', '明栿是天花下的可见梁，宋代明栿常作月梁式，以增加美感。'],
      ['中国古代建筑', '建筑类型', '明堂', 'Ming Tang', '古代帝王所建最隆重的建筑物。', '用作朝会诸侯、发布政令、秋季大享祭天，并配祀祖宗。如汉唐明堂。'],
      ['中国古代建筑', '平面布局', '抱厦', 'Bao Sha', '即在主建筑之一侧突出1间(或3间)。', '抱厦是建筑侧部突出间，用于扩展空间，常见于殿堂。'],
      ['中国古代建筑', '陵墓', '庙谥石碑', 'Miao Shi Shi Bei', '今通称明楼碑或圣号碑，即明代帝陵中方城上的明楼中置一石碑、仅刻所葬皇帝死后谥号，并无其他碑文。', '庙谥石碑是明代帝陵明楼内的碑，仅刻谥号，用于纪念。'],
      ['中国古代建筑', '陵墓', '驻跸处', 'Zhu Bi Chu', '古制天子出入警跸清道，禁人通行，故其留止之地称为驻跸处。', '驻跸处是帝王驻留地，源于警跸制度，用于陵墓或行宫。'],
      ['中国古代建筑', '建筑类型', '转轮藏', 'Zhuan Lun Cang', '皮藏佛教经书于八角形经柜中，柜中心有轴，上支于梁架，下承于地面，推之可转动。', '佛教徒认为转动此柜可获得和念经同样的功德。经柜装修华美，顶上常饰以天宫楼阁，并专建一殿，以容此经柜，称为转轮藏殿。常见于宋明。'],
      ['中国古代建筑', '陵墓', '神主', 'Shen Zhu', '木制牌位，上书死者或神祗名号，供于庙堂内。', '神主是木牌位，用于供奉逝者或神，置于庙堂。'],
      ['中国古代建筑', '大木作·构件', '柱头枋', 'Zhu Tou Fang', '檐柱或内柱中心线上，用于连接各朵斗栱的枋料，称为柱头枋。', '柱头枋是连接斗拱的枋料，清称正心枋，用于柱线上，增强构架连结。在里跳或外跳栱上的联系枋料则称罗汉枋。'],
      ['中国古代建筑', '大木作·构件', '顺栿串', 'Shun Fu Chuan', '宋代建筑中沿横断面方向之串枋，与梁栿方向上下相合，故称。', '顺栿串是宋代串枋，沿横向与梁合，增强稳定性。'],
      ['中国古代建筑', '大木作·构件', '穿插枋', 'Chuan Cha Fang', '明清建筑在檐柱与老檐柱之间，用枋料加以串联，提高了木构架的稳定性。', '穿插枋是明清串联柱子的枋，用于檐柱间，增强稳定性，也称随梁枋。'],
      ['中国古代建筑', '陵墓', '神厨神庖', 'Shen Chu Shen Pao', '即坛庙陵墓等祭祀时用作宰牲及准备祭品的场所。', '神厨神庖是祭祀场所，用于准备祭品，常见于坛庙陵墓。'],
      ['中国古代建筑', '平面布局', '廊院', 'Lang Yuan', '用廊子连成的院落。', '六朝至唐，宫殿、庙宗、邸宅常在主屋与门屋间的两侧用廊子连成廊院。园林中则常见不规则的廊院。'],
      ['中国古代建筑', '建筑类型', '廊屋', 'Lang Wu', '主屋前两侧通长的东西两庑带有前廊，宋代称为廊屋。', '宋、明常用廊屋围成封闭院落，而唐则多用走廊形成廊院。'],
      ['中国古代建筑', '大木作·构件', '梭柱', 'Suo Zhu', '柱子上下两端(或仅上端)收小，如梭形，六朝至宋官式建筑上见之，明代仍见于江南民间建筑。', '梭柱是柱子收小如梭，六朝宋官式常见，明江南民间延续。'],
      ['中国古代建筑', '大木作·构件', '绰幕枋', 'Chuo Mu Fang', '位于大檐额下串联角柱与檐柱的枋料。', '因大檐额仅阁置于柱头 上，故需用绰幕枋把檐柱连接起来，以增加其稳定性。绰幕枋向内止于心间的补间铺作下，出头作成蝉肚形或楷头形，以后演变为明、清的雀替形式。'],
      ['中国古代建筑', '城池', '堞', 'Die', '城墙上向外一侧所设墙垛。', '堞战时可抵挡敌人矢石攻击，从孔隙中则可向敌人射箭发炮。城墙向内一侧则设矮墙，防止人马下坠。'],
      ['中国古代建筑', '大木作·构件', '插栱', 'Cha Gong', '插入柱中之半栱，一般位于檐柱上，用以承托出檐。', '插栱是插入柱的半拱，用于檐柱支撑出檐，常见于宋建筑，增强了出檐稳定性。'],
      ['中国古代建筑', '建筑类型', '戟门', 'Ji Men', '置戟的门，用于宫殿庙署，戟数示等级', '天子宫殿、太庙、诸州府官署、文庙、武庙大门内均可列檠戟，以示威仪，但戟数多寡有差，如宋代宫门、太庙门为24,开封府，大都督府为14。凡列戟之门均可称为戟门。'],
      ['中国古代建筑', '大木作·构件', '𬃊', 'Mu Zhi', '木柱之下用扁圆形横纹木料作垫块，以阻隔地面水份上升，称之为“𬃊”。', '最早之𬃊见于五代华林寺大殿，宋、明普遍用之。依𬃊之形式而用石料雕成者，称之为石质（石字旁+质）。'],
      ['中国古代建筑', '大木作·构造', '缝', 'Feng', '凡中心线均称缝。', '如柱列的中心线称为柱缝，博(檩条)断面的垂直方向中心线称为博缝，转角铺作上的斜栱斜昂称之为“斜出跳一缝”等。'],
      ['中国古代建筑', '建筑类型', '阙', 'Que', '宫殿、陵墓、官衙大门前两侧各立一座建筑，形如门楼而中缺门扇，故称阙(缺)。', '天子用三出阙(即每侧由三层阙体组成),诸侯大臣用二出阙'],
      ['中国古代建筑', '屋顶与瓦石', '叠瓦脊', 'Die Wa Ji', '宋代屋脊用瓦层层压叠而成，顶部覆一筒瓦，与元代以后用分段烧制的空心通脊不同。', '建筑物高大，脊也相应提高，用的脊瓦层数也多。此法不仅重量大，且不稳定，故明、清官式建筑中已废止不用。'],
      ['中国古代建筑', '平面布局', '殿身', 'Dian Shen', '宋代建筑中重檐建筑的概念是由殿身外面包一圈外廊(称为“副阶周匝”)。', '殿身是相对于副阶而言，指上檐所盖的那一部分空间。假如殿身7间，加副阶周匝，古代文献记录有时称此殿为9间，有时称7间，应注意鉴别。'],
      ['中国古代建筑', '大木作·铺作', '溜金斗栱', 'Liu Jin Dou Gong', '由外檐有昂而室内无天花的斗栱发展而来，有很强的装饰效果。', '盛行于明、清两代不用天花的殿宇内，见潘谷西《中国建筑史》图9-7。'],
      ['中国古代建筑', '陵墓', '错银兆域图', 'Cuo Yin Zhao Yu Tu', '在铜版上用镀银法画的陵区平面图。', '错银兆域图是铜版镀银陵区图，用于规划，体现了明清陵墓的精细工艺。'],
      ['中国古代建筑', '石作', '叠涩', 'Die Se', '以砖石层层向外出跳之法。', '用于砖石建筑的出檐，或须弥座束腰上下枋的出跳。是无斗拱的支撑方式。'],
      ['中国古代建筑', '塔刹', '腰檐', 'Yao Yan', '塔与楼阁平坐下之屋檐，称为腰檐。', '腰檐是塔阁平坐下的檐，用于多层建筑。'],
      ['中国古代建筑', '小木作·构件', '槏柱', 'Duo Zhu', '窗旁的柱，或用于分隔板壁、墙面的柱，属小木作，不承重。', '槏柱是宋式非承重柱，用于窗旁或墙分。'],
      ['中国古代建筑', '平面布局', '槽', 'Cao', '宋代殿阁类建筑的术语，指殿身内由一系列柱子与斗栱划分空间的方式，也指该柱列与斗拱所在的轴线。', '《营造法式》载有殿阁分槽平面图4种：金厢斗底槽、分心斗底槽、单槽、双槽(参见金箱斗底槽，分心槽条)。'],
      ['中国古代建筑', '大木作·构件', '燎檐枋', 'Liao Yan Fang', '宋代斗栱外端用以承托屋檐之枋料。', '此枋荷载大，故断面高度为其他枋之1倍。如用圆料，则称撩风博，其下以小枋料或替木托之，此法多见于北方之唐、辽建筑。'],

      // ================= 2. 西方古代建筑 (Western Ancient/Historical) =================
      ['西方古代建筑', '古罗马', '巴西利卡', 'Basilica', '古罗马法庭、商业贸易场所会议厅大厅，后成为基督教教堂的原型。', '平面长方形，一端或两端有半圆形龛。主体大厅被两排柱子分成三个空间。或被四排柱子分成五个空间。中央较宽的中厅侧廊窄，中厅高出其他部分，入口通常在长边，容量大，结构简单。'],
      ['西方古代建筑', '拜占庭', '拜占庭建筑', 'Byzantine Architecture', '东罗马帝国的建筑风格，特点是帆拱、鼓座、穹顶相结合的做法。', '教堂平面格局大致有三:集中式(君士坦丁堡圣索菲亚大教堂)、巴西利卡式(叙利亚托曼宁教堂)、十字式（威尼斯圣马可教堂)。装饰:马赛克、粉画、石雕。建筑特点:平面中央是穹窿顶为主要构造，外观厚墙与不大的窗子，无柱无廊，内部装饰华丽，外表装饰朴实。'],
      ['西方古代建筑', '巴洛克', '巴洛克建筑', 'Baroque Architecture', '17-18世纪流行于欧洲的一种建筑风格，追求动感、华丽和戏剧性。', '结构特点:1、节奏不规则地跳跃 2、突出垂直分划 3、追求强烈的体积和光影变化 4、有意制造反常出奇的新形式。建筑特点:1、炫耀财富 2、追求新奇 3、趋向自然。代表建筑: 耶稣会教堂、圣卡罗教堂。'],
      ['西方古代建筑', '古典主义', '法国古典主义建筑', 'French Classicism', '17-18世纪法王路易十三、十四专制王权时期的复古建筑。', '采用古典柱式、恢复古典建筑式样、比例的建筑风格。狭义的古典建筑主要是指法国古典主义及其他地区受其影响的建筑。 \n建筑风格：强调秩序、总体布局、造型庄重。'],
      ['西方古代建筑', '结构构件', '帆拱', 'Pendentive', '水平切口和4个发券之间余下的4个角上的球面三角形部分，成为帆拱。', '拜占庭时期为解决在平面上盖穹顶的几何形状承接过渡问题的做法。成就:1.把顶的重量传递给四角，摆脱承重墙，空间不封闭，平面灵活多变。2.方形平面做圆形穹顶 3.在穹顶的统帅下完成了集中式构图。'],
      ['西方古代建筑', '结构构件', '飞扶壁', 'Flying Buttress', '哥特建筑所特有的一种飞券。', '利用从墙体上部向外挑出一个或多个券形构件，在中厅两侧,凌空越过侧廊上空，在中厅每间十字拱四角的起脚抵住侧推力，将墙体所承受的压力传到一定距离外的柱墩上，实际上起支撑作用，解决了水平推力的问题。'],
      ['西方古代建筑', '中世纪', '哥特式建筑', 'Gothic Architecture', '兴盛于中世纪高峰与末期的建筑风格，发源于十二世纪的法国。', '由罗曼式建筑发展而来，为文艺复兴建筑所继承。特征是尖券、骨架券、飞扶壁和彩色玻璃窗。 \n结构特点： \n1.使用骨架券作为拱顶的承重构件。 \n2.使用飞券以抵抗中舱拱顶的侧推力。 \n3.全部使用两圆心的尖券和尖拱。尖券和尖拱的侧推力较小，有利于减轻结构。'],
      ['西方古代建筑', '复古思潮', '古典复兴建筑', 'Classical Revival', '18世纪60年代到19世纪末在欧美流行的复古思潮。', '分为罗马复兴和希腊复兴两种倾向。建筑体形单纯、独立、完整，细部处理朴实，形式合乎逻辑，纯装饰构件较少。代表: 国会、法院、银行等公共建筑。'],
      ['西方古代建筑', '理论', '建筑十书', 'The Ten Books on Architecture', '欧洲古代建筑学专著，古罗马建筑师维特鲁威著。', '书分十卷，内容十分完备，包括建筑师的修养、柱式、城市规划、施工机械等。'],
      ['西方古代建筑', '古埃及', '吉萨金字塔群', 'Giza Pyramid Complex', '古埃及法老陵墓群，包括库富（Khufu）金字塔、哈夫拉金字塔（Khafra）、门卡乌拉金字塔（Menkaura）', '方锥形金字塔的代表，哈夫拉金字塔前有著名的狮身人面像大斯芬克斯。'],
      ['西方古代建筑', '装饰风格', '洛可可', 'Rococo', '18世纪20年代产生于法国的装饰风格，纤弱娇媚、华丽精巧。', '主要表现在室内装饰上。洛可可风格的基本特点是纤弱娇媚、华丽精巧、甜腻温柔、纷繁琐细。它以欧洲封建贵族文化的衰败为背景。'],
      ['西方古代建筑', '柱式', '罗马五柱式', 'Roman Orders', '塔司干、罗马多立克、罗马爱奥尼、科林斯、混合柱式。', '柱式通常由柱子和檐部组成:柱子由柱头、柱身、柱础组成。罗马塔司干柱式的柱径与柱高的比例是1:7。'],
      ['西方古代建筑', '中世纪', '罗马风建筑', 'Romanesque Architecture', '10—12世纪在欧洲基督教地区流行的一种建筑风格。也称罗曼式建筑', '其结构基础来源于古罗马的建筑构造方式，经常采用古罗马建筑的一些传统做法，如半圆拱，十字拱等。采用扶壁以对抗沉重拱顶的侧推力。实例:比萨大教堂建筑群。 \n在意大利，这一风格被称为Romanica，与罗马风格Romana相区别。为区别两者，现代西方人称古希腊罗马建筑为古典建筑，近现代模仿者为新古典建筑。'],
      ['西方古代建筑', '平面形式', '拉丁十字平面', 'Latin Cross', '纵臂显著长于横臂的十字形教堂平面。', '原句：“从上面俯视，像一个平放的十字架，竖道比横道长的多，信徒们所在的大厅比圣坛，祭坛又长的多。” \n在原有巴西利卡基础上横向穿插一相对小得多的巴西利卡形式，长轴东西向有较高中厅和两边侧廊组成，西端为主入口，东端为圣坛。'],
      ['西方古代建筑', '古希腊', '帕提农神庙', 'Parthenon', '雅典卫城的主要建筑物，古希腊多立克柱式的最高成就。', '帕提农原意处女宫，是守护神雅典娜的庙。形制是卫城中最典型，即长方形平面，列柱围廊式。全方面采用了最庄严的庙宇型制多立克，内部综合运用了多立克、爱奥尼。'],
      ['西方古代建筑', '古波斯', '帕赛玻里斯', 'Persepolis', '波斯帝国时期古城。', '两个仪典大厅、后宫、财库以"三门厅"为联系。'],
      ['西方古代建筑', '古西亚', '山岳台', 'Ziggurat', '古代西亚建筑，用于崇拜天体、崇拜山岳、观测星相。', '古代西亚建筑，用于崇拜天体、崇拜山岳、观测星相。'],
      ['西方古代建筑', '古希腊', '狮子门', 'Lion Gate', '迈锡尼卫城的主要入口。', '由两块垂直的石块和一巨大的过梁组成。门道上起缓冲作用的三角石灰石上刻有两头狮子。门两侧城墙突出，形成一狭长的过道，加强防御性。'],
      ['西方古代建筑', '文艺复兴', '坦比哀多', 'Tempietto', '盛期文艺复兴建筑的纪念性风格典型代表，设计人伯拉孟特。', '这是一座集中式圆形建筑，周围16根多立克柱子，有地下墓室。它是第一个成熟的集中式建筑。'],
      ['西方古代建筑', '文艺复兴', '文艺复兴建筑', 'Renaissance Architecture', '15世纪初在意大利兴起的建筑风格，重新使用古典建筑元素。', '建筑平面形式多采用基本几何形状(方形与圆形);注重强调空间的集中性。盛期的代表建筑:罗马的坦比哀多。理论:1、实用、经济、美观 2、美是客观的 3、美就是和谐与完整。'],
      ['西方古代建筑', '柱式', '希腊三柱式', 'Greek Orders', '古希腊三种基本柱式：多立克、爱奥尼、科林斯。', '1、多立克柱式-比例粗壮、刚劲雄健；2、爱奥尼柱式–比例修长、精巧清秀；3、科林斯柱式–比例细长、纤巧精致、高贵华丽。'],
      ['西方古代建筑', '古希腊', '雅典卫城', 'Acropolis of Athens', '古希腊最代表性的建筑群，位于雅典城西南。', '主要建筑是帕提农神庙、伊瑞克提翁神庙、胜利神庙和卫城山门等。建筑群布局自由，高低错落，主次分明，无论是身处其间或从城下仰望，都能看到较为完整与丰富的建筑艺术形象。'],
      ['西方古代建筑', '古罗马', '大角斗场', 'Colosseum', '古罗马圆形竞技场，开创了体育建筑的先河。', '容纳5－8万人，椭圆形。四层建筑、券柱式立面。下部三层采用了不同的柱式构图，由下向上依次为塔司干、爱奥尼、科林斯、混合柱式。'],
      ['西方古代建筑', '古希腊', '古典柱式', 'Classical Orders', '古希腊和古罗马建筑中柱子、额枋和檐部的形式、比例和相互组合的规范。', '古希腊和古罗马建筑中柱子、额枋和檐部的形式、比例和相互组合的规范。'],
      ['西方古代建筑', '结构构件', '骨架券', 'Ribbed Vault', '哥特时期作为拱顶的承重构件。', '在一个正方形或矩形平面四角的四个柱子上做双圆心尖券，四条边和两条对角线上各做一道尖拱。屋顶的石板架在这六道券上。'],
      ['西方古代建筑', '柱式', '巨柱式', 'Giant Order', '产生于古罗马时期，一个柱式贯穿二层或三层。', '优点是能够突破水平分划的限制，可使得建筑显得高大雄伟，缺点是尺度失真。'],
      ['西方古代建筑', '结构构件', '肋架栱', 'Ribbed Vault', '产生于公元四世纪的古罗马的一种拱券结构，后被欧洲中世纪建筑大大发扬。', '其基本原理是把拱顶区分为承重部分和围护部分，从而大大减轻拱顶，并把荷载集中到券上以摆脱承重墙。'],
      ['西方古代建筑', '理论', '《论建筑》', 'De re aedificatoria', '1485年出版，作者阿尔伯蒂。是意大利最重要的理论著作。', '以人文主义思想为基础，着重基本理论及造型美的客观规律。建筑创作的基本任务是实用、经济、美观。建筑的美是客观的，存在于建筑本身。'],
      ['西方古代建筑', '文艺复兴', '帕拉第奥母题', 'Palladian Motif', '帕拉第奥改建维琴察巴西利卡时创造的一种券柱式构图。', '在两柱子中间按适当比例发一个券，券脚落在两个独立的小柱子上，上面架着额枋，小额枋之上开一个圆洞。它的适应性强。'],
      ['西方古代建筑', '立面构图', '劵柱式', 'Arch Order', '古罗马建筑技术上以及艺术上一大成就，由券同柱式组成。', '支撑拱券的墙和柱子又大又重，必须装饰，用柱式去装饰券，后来产生了券柱式的组合，解决了柱式与拱券的矛盾。'],
      ['西方古代建筑', '日本古建', '寝殿造', 'Shinden-zukuri', '日本府邸和住宅的形制之一，受中国建筑影响。', '正屋（寝殿）居中，前有池沼，两侧有配屋（东对 西对），其间连以开场的游廊。'],
      ['西方古代建筑', '日本古建', '书院造', 'Shoin-zukuri', '日本府邸住宅形式的一种。', '特点：有一间主要的房间（上段，一之间），这间房间的正面墙壁划分为两个龛，左侧叫床（押板），右面是一个博古架，叫棚（违棚）。'],
      ['西方古代建筑', '结构构件', '十字拱', 'Groin Vault', '公元1世纪中叶古罗马开始使用，覆盖在方形的间上，仅需四角有支柱。', '不必要连续的承重墙，建筑内部空间得到解放，它促进了建筑平面的模数化。十字拱又便于开侧窗，大有利用大型建筑物内部的采光。'],
      ['西方古代建筑', '印度古建', '窣堵波', 'Stupa', '古代佛教特有的建筑类型之一，佛塔的前身。', '半球型的建筑物，是一种埋葬佛祖火化后留下的舍利的一种坟墓建筑。基本形制是用砖石垒筑圆形或方形的台基，之上建有一半球形覆钵。'],
      ['西方古代建筑', '平面形式', '希腊十字平面', 'Greek Cross', '中央穹顶和它四面的筒形拱成等臂的十字。', '中世纪罗马风时期较为流行的一种平面形制。威尼斯圣马可教堂的平面即为希腊十字型。'],
      ['西方古代建筑', '文艺复兴', '圆厅别墅', 'Villa Rotonda', '帕拉迪奥设计。平面完全对称，四面各有六柱的柱廓，中央圆厅有穹窿顶。', '帕拉迪奥设计。平面完全对称，四面各有六柱的柱廓，中央圆厅有穹窿顶。'],
      ['西方古代建筑', '古罗马', '图拉真广场', 'Trajan\'s Forum', '古罗马最大的帝国议事广场。', '参照了东方君主国建筑的特点，不仅轴线对称，而且做多层纵深布局。包含图拉真纪功柱、乌尔比亚巴西利卡等。'],
      ['西方古代建筑', '古埃及', '方尖碑', 'Obelisk', '古埃及崇拜太阳的纪念碑。', '常成对地竖立在神庙的入口处。其断面呈正方形，上小下大，顶部为金字塔形，常镀合金。最高50余米，碑身刻有象形文字的阴刻图案。'],
      ['西方古代建筑', '古希腊', '爱琴文明建筑', 'Aegean Architecture', '希腊上古时代，处于克里特岛和迈西尼城周围的爱琴海一带的建筑文化。', '最早创造了“正室”的布局形式。代表实例：克诺索斯 米诺斯王宫，迈西尼城狮子门，阿托雷斯宝库。'],
      ['西方古代建筑', '风格', '帝国式风格', 'Empire Style', '拿破仑帝国时代的法国，以古罗马式样为主的古典复兴。', '建筑追求外观上的雄伟、壮丽、内部则常常吸取东方的各种装饰or洛可可手法。代表：星形广场凯旋门。'],
      ['西方古代建筑', '复古思潮', '新古典主义', 'Neoclassicism', '18世纪中叶兴起的古典复兴思潮。', '恢复了古希腊、古罗马的式样，讲究理性简洁与和谐之美。代表：巴黎万神庙，德国柏林勃兰登堡门。'],
      ['西方古代建筑', '中世纪', '玫瑰花窗', 'Rose Window', '哥特式建筑中装饰富丽的圆窗，内呈放射状。', '主要用在中堂的西端和耳堂的两端，世界上最漂亮的玫瑰窗就是这个时期巴黎圣母院的玫瑰窗。'],
      ['西方古代建筑', '古希腊', '列雪柱拉德音乐纪念亭', 'Choragic Monument', '公元前3世纪希腊本土后期的作品，早期科林斯柱式的代表。', '圆亭立于一2.9米见方的基座上，顶上为得奖奖杯。造型秀丽，装饰自下而上渐丰富。'],
      ['西方古代建筑', '古罗马', '万神庙', 'Pantheon', '古罗马时期单一空间、集中式构图的建筑物代表。', '也是罗马穹顶技术的最高代表，平面圆形的，穹顶直径达43.3米，中央开一个直径8.9米的圆洞。'],
      ['西方古代建筑', '拜占庭', '圣索菲亚大教堂', 'Hagia Sophia', '拜占庭时期建筑的典型代表，位于君士坦丁堡，采用集中式形制。', '其成就主要有3个方面，一、它的结构关系明确，层次井然。二，既集中统一又曲折多变的内部空间。三，内部灿烂夺目的色彩效果。'],
      ['西方古代建筑', '古西亚', '空中花园', 'Hanging Gardens', '新巴比伦城门西侧，建在梯形平台上的花园。', '为四层平台，25 米高。建筑群有空心柱子，每层设有喷水装置。被誉为古代七大奇迹之一。'],
      ['西方古代建筑', '日本古建', '枯山水', 'Karesansui', '源于日本本土的缩微式园林景观，多见于禅宗寺院。', '在特有的环境气氛中，细细耙制的白砂石铺地、叠放有致的几尊石组，就能对人的心境产生神奇的力量。'],
      ['西方古代建筑', '装饰风格', '穆达伽风格', 'Mudejar Style', '西班牙在八世纪被阿拉伯占领后，伊斯兰建筑手法掺入到哥特建筑中形成的风格。', '用马蹄形券，镂空的石窗棂，大面积的几何图或其它花纹。'],
      ['西方古代建筑', '屋顶形式', '孟莎式屋顶', 'Mansard Roof', '方底两折式屋顶，下部很徒，而上部徒度突然转折变的很平缓。', '使内部空间好用，它是法国17世纪的独特屋顶形式。'],
      ['西方古代建筑', '日本古建', '鸟居', 'Torii', '一种类似于中国牌坊的日式建筑，常设于通向神社的大道上。', '做法是一对柱子上架一根横木，也有的在横木下再加一根枋子，这种牌坊叫做鸟居。'],
      ['西方古代建筑', '巴洛克', '超级巴洛克', 'Ultra-Baroque', '巴洛克在西班牙的传播的一个流变，兴起于17世纪中叶。', '造型自由奔放，装饰繁复，富于变化，但往往有的建筑过分装饰堆砌。代表建筑：圣地亚哥·德·贡波斯代拉教堂。'],
      ['西方古代建筑', '古罗马', '浴场建筑', 'Thermae', '古罗马的公共浴场是多功能、综合性的大型公共建筑群。', '功能齐全、设备完善、结构出色、空间丰富，代表了古罗马建筑的最高成就。对18世纪以后，欧洲大型公共建筑的空间设计产生了极大的影响。'],
      ['西方古代建筑', '结构构件', '透视门', 'Perspective Portal', '哥特式建筑中，为了减轻厚墙的沉重感，将门旁的墙壁做成一排一排锯齿形装饰。', '如巴黎圣母院就是这种做法。'],
      ['西方古代建筑', '结构构件', '抹角拱', 'Squinch', '拜占庭建筑中，用以从方形平面向圆顶过渡的结构构件。', '使得穹顶的支撑和平衡体系下产生丰富多变的空间。抹角拱的作用与帆拱相同。'],
      ['西方古代建筑', '伊斯兰', '钟乳拱', 'Muqarnas', '又称蜂窝拱，伊斯兰建筑中由一个个层叠的小型半穹窿组成。', '在结构上起出挑作用，在造型上起装饰作用。'],
      ['西方古代建筑', '广场', '西班牙大阶梯', 'Spanish Steps', '巴洛克手法在城市设计中的代表实例。', '阶梯平面呈花瓶形，布局时分时合，巧妙地把两个不同标高、轴线不一的广场统一起来，表现出巴洛克灵活自由的设计手法。'],
      ['西方古代建筑', '古埃及', '斯芬克斯', 'Sphinx', '古埃及神话中长有翅膀的怪，通常为雄性，是“仁慈"和“高贵"的象征。', '狮身人面像位于埃及的开罗市西侧吉萨区的哈夫拉金字塔南面。'],
      ['西方古代建筑', '古西亚', '人首翼牛像', 'Lamassu', '萨艮二世王宫中央拱门门洞口两侧及碉楼转角处的石板上雕的像。', '正面为圆雕，侧面为浮雕。正面2条腿，侧面4条腿，转角1条在两面共用，共5条腿。'],
      ['西方古代建筑', '古西亚', '巴别塔', 'Tower of Babel', '圣庙北侧高耸入云的大庙塔，据说是《圣经》里的通天塔。', '在汉穆拉比最早建造巴比伦城时就己建造起来,并在尼布拉尼撒时得已完善。'],
      ['西方古代建筑', '结构构件', '交叉拱', 'Cross Vault', '用两个等跨筒拱在平面上成直角相贯，以覆盖方形平面的空间。', '这样可取消承重墙，仅四角共四个支点即可支承十字拱顶，使空间开放,结构重量减轻。'],
      ['西方古代建筑', '装饰技艺', '湿壁画', 'Fresco', '在璧面基底半干时，用清石灰水调和颜料进行绘制。', '颜色与未干燥的墙面经过渗透面牢固结合，干燥之后产生一种特殊的效果。由于必须一次完成，不容打草图与修改，技巧上难度较大。'],
      ['西方古代建筑', '中世纪', '比萨斜塔', 'Leaning Tower of Pisa', '比萨大教堂的钟塔，因地基不均匀沉降而倾斜。', '圆形，直径大约16，高55m，分为8层。中间六层用的围着罗曼式的空券廊。'],
      ['西方古代建筑', '广场', '圣马可广场', 'Piazza San Marco', '意大利威尼斯的中心广场。', '由总督宫、圣马可教堂、圣马可钟楼等建筑和威尼斯大运河所围成的长方形广场。'],
      ['西方古代建筑', '古波斯', '百柱厅', 'Hall of 100 Columns', '位于西亚帕赛玻里斯方宫里的一个典仪性的大厅，因其中有石柱100根而得名。', '位于西亚帕赛玻里斯方宫里的一个典仪性的大厅，因其中有石柱100根而得名。'],
      ['西方古代建筑', '古罗马', '泰达斯凯旋门', 'Arch of Titus', '古罗马凯旋门的典型代表，是现存最早的凯旋门。', '位于建于公元1世纪。外形近方形，深度比较大，组人以稳定、庄严之感。凯旋门为混凝土浇筑，外部用白色大理石贴面，使用组合柱式。'],
      ['西方古代建筑', '古罗马', '纪功柱', 'Memorial Column', '起源于古罗马的一种纪念性建筑物。', '特点是柱身中空，可延台阶盘旋而上，柱身常有雕刻，记载某人的功绩，柱头多立所表扬人的立像。代表为图拉真广场上的图拉真纪功柱。'],
      ['西方古代建筑', '中世纪', '威尼斯总督府', 'Doge\'s Palace', '欧洲中世纪最美的建筑物之一。', '现状主要是14世纪时的重建的，建筑师齐阿尼，主要特色在南立面和西立面的构图。第一层是券廊，圆柱粗壮有力。最上层的高度占整个高度的大约1/2，全是实墙。'],
      ['西方古代建筑', '伊斯兰', '狮子院', 'Court of Lions', '西班牙阿尔罕布拉宫中的庭院。', '中央有一座有12头己拙的石狮组成的喷泉，水从狮口喷出，流向周围的浅沟。四周有124根纤细的白色大理石柱。'],
      ['西方古代建筑', '文艺复兴', '手法主义', 'Mannerism', '意大利文艺复兴后期出现的一种建筑设计倾向。', '特点是追对新颖尖巧，堆砌壁龛、雕塑、涡卷等，玩弄诡谲的光影、不安定的体形和不合结构逻辑的起付断裂或错位。'],
      ['西方古代建筑', '建筑师', '钱伯斯', 'William Chambers', '18世纪英国著名建筑师，为帕拉蒂奥主义、先浪漫主义代表者。', '曾两次到中国，为欧洲较早的对中国园林进行研究的建筑师之一。代表建筑骚莫赛特大厦、王家园林丘园(中国式)，代表著作《中国式建筑设计》、《泛论》。'],
      ['西方古代建筑', '理论', '拉斯金', 'John Ruskin', '19世纪英国的散文家、美术理论家，推崇富有宗教感的中世纪建筑。', '万为推崇哥特式建筑，但提倡建筑应该注重形式与功能结合，拉斯金极大地推动了英国浪漫主义建筑风格。代表著作《建筑七灯》。'],
      ['西方古代建筑', '结构构件', '锤式屋架', 'Hammerbeam Roof', '16世纪上半叶，英国室内大厅用的一种装饰性木屋架形式。', '特点是用于重要大厅，富有装饰性。由两侧向中央逐级升高，每级下有一个弧形的撑托和一个雕镂精致的下垂的装饰物。代表建筑罕普敦府邸大厅。'],
      ['西方古代建筑', '结构构件', '束柱', 'Clustered Column', '起源于10-12世纪西欧罗马风建筑，细柱与券肋气势相连。', '教堂中柱柱头逐渐退化，中厅和侧窗的拱顶的骨架券一直延伸下来，贴在柱墩的四面，形成了集束柱，增强向上的动势。'],
      ['西方古代建筑', '结构构件', '鼓座', 'Tholobate', '拜占庭建筑中的一种结构名称。', '位于穹顶与帆拱之间的竖筒形结构,把穹顶的荷载传到帆拱上，代表为基辅圣索菲亚教堂。'],
      ['西方古代建筑', '理论', '维特鲁威', 'Vitruvius', '古罗马时期，奥古斯都的军事工程师与建筑师。', '他写作了《建筑十书》这本奠定了欧洲建筑科学的基本体系的著作。'],
      ['西方古代建筑', '古埃及', '马斯塔巴', 'Mastaba', '古埃及墓葬的矩形上层建筑，用泥砖或石头建造，斜墙平顶。', '马斯塔巴是古埃及墓葬的矩形上层建筑，最初用泥砖建造，后来用石头，具有斜墙和平顶。作为最早王朝的标准墓葬类型，它标志着古埃及建筑从简单结构向更复杂形式的演变，常用于非王室贵族的陵墓。'],
      ['西方古代建筑', '古埃及', '昭塞尔金字塔', 'Step Pyramid of Djoser', '第一座石头金字塔，建于公元前2780~前2180年。', '昭塞尔金字塔，也称乔塞尔阶梯金字塔，是埃及最古老的重要石头建筑，是萨卡拉墓地的大型葬礼建筑群的中心。由建筑师伊姆霍特普设计，为第三王朝法老乔塞尔建造，高约62米，是从马斯塔巴演变为平滑金字塔的过渡形式，标志着古埃及建筑技术的重大进步。'],
      ['西方古代建筑', '古埃及', '哈塔什帕苏墓', 'Mortuary Temple of Hatshepsut', '新王国时期哈特谢普苏特的葬礼神庙。', '哈塔什帕苏墓是第十八王朝法老哈特谢普苏特的葬礼神庙，位于底比斯西岸的代尔巴赫里，于公元前1479~1458年建造。由建筑师塞内穆特设计，采用阶梯式结构，融入悬崖，装饰有浮雕描绘女王的生平和探险，是新王国时期建筑的杰出代表，强调与自然景观的和谐。'],
      ['西方古代建筑', '古埃及', '太阳神庙', 'Sun Temples', '新王国时期崇拜太阳神的庙宇，两个艺术重点（外部——大门；内部——大殿）。', '太阳神庙是新王国时期独特的庙宇类型，崇拜中心是一个置于阳光下的矮方尖碑（benben）。这些庙宇不同于其他神庙，强调开放空间和太阳崇拜，如阿布西姆贝尔太阳神庙，外部以宏伟大门为重点，内部以大殿为中心，体现了埃及人对太阳神拉的崇拜和建筑创新。'],
      ['西方古代建筑', '古埃及', '卡纳克和鲁克索神庙', 'Karnak and Luxor Temples', '新王国时期的主要神庙群。', '卡纳克神庙群是底比斯北部庙宇的集合，古称Ipet-Isut，包括多个塔门和神殿，由多位法老扩建，献给阿蒙神。鲁克索神庙由阿蒙霍特普三世开始建造，与卡纳克通过狮身人面像大道连接，是新王国时期宗教建筑的巅峰，体现了埃及帝国的财富和权力。'],
      ['西方古代建筑', '古西亚', '月神台', 'Ziggurat of Ur', '乌尔的月神台，生土夯筑，外面贴一层砖，砌着薄薄的突出体。', '乌尔月神台是古代美索不达米亚的阶梯式神庙塔，献给月神南纳，最早砖块可追溯到公元前2100年左右。由苏美尔国王乌尔纳姆建造，高约21米，三层平台，生土夯筑，外贴砖块，带有突出体，用于宗教仪式和观测星象，是西亚建筑崇拜天体和山岳的典型。'],
      ['西方古代建筑', '古希腊', '克里特', 'Crete', '有最早的大门和庙宇，以及最早的露天剧场和柱式。', '克里特岛是米诺斯文明的发源地，是欧洲土壤上第一个高等文明，约公元前3000~前1100年，以宏伟宫殿、精湛工艺和文字为特征。最早的大门、庙宇、露天剧场和柱式出现在这里，影响了后来的希腊建筑，体现了早期地中海文明的创新和奢侈。'],
      ['西方古代建筑', '古希腊', '克洛索斯宫殿', 'Palace of Knossos', '没有轴线，墙的下部用乱石砌，以上用土坯，土坯墙里加木骨架，墙面抹泥或石灰，露出木骨架，涂成深红色。屋顶是平的，铺木板，盖粘土。宫殿内部空间既不大也不高，尺度亲切，风格平易，形式玲珑轻巧，变化突兀，内部富有装饰。柱子上粗下细。', '克洛索斯宫殿是米诺斯文明的主要建筑，建于中米诺斯时期（公元前2000~前1580年），由独立结构组成，缺乏轴线，墙下部乱石，上部土坯加木骨架，墙面抹灰，木架深红。平顶铺木板盖粘土，内部空间亲切，装饰丰富，柱子上粗下细，兼具宗教和行政功能，是米诺斯建筑的典范。'],
      ['西方古代建筑', '古希腊', '迈锡尼卫城', 'Citadel of Mycenae', '卫城坐落在四周40~50m的高地上，卫城里有宫殿，贵族住宅，仓库，陵墓等等。外面防卫森严，有一道大约1km长的石墙。宫殿的中心是正厅，形制同克里特的一样。', '迈锡尼卫城是青铜时代晚期希腊城市，位于伯罗奔尼撒的阿尔戈利斯平原，由岩石筑成，约公元前1400~前1200年鼎盛。包括宫殿、住宅、仓库和陵墓，外围1km长巨石墙（Cyclopean墙），宫殿中心正厅类似于克里特风格，是迈锡尼文明的中心，据说是阿伽门农的首都。'],
      ['西方古代建筑', '古希腊', '泰仑卫城', 'Citadel of Tiryns', '泰仑卫城设防森严，非常险固，用巨石垒墙。它的内外两进大门也是横向的工字形平面，前后都有一对柱子。', '泰仑卫城是青铜时代希腊的山丘堡垒，位于阿尔戈利斯，约公元前1600年开始建造，三阶段扩展，高28m，长280m，用巨石垒墙（Cyclopean建筑）。包括宫殿和防御结构，内外大门为工字形平面，前后柱子，体现了迈锡尼时期防御建筑的严密和宏伟。'],
      ['西方古代建筑', '结构构件', '十字拱', 'Groin Vault', '十字拱，也称交叉拱，是由两座相交的圆筒形拱（即桶形拱）在直角处交汇而成的拱顶结构。其交汇处形成的四个对角线将拱顶的重力引导到四个角落，从而使得整个结构更加稳固。与单一的桶形拱相比，十字拱不仅能够覆盖更大的空间，还能够减少中间支撑柱的需求，因此常用于需要大跨度空间的建筑中。', '十字拱是由两个桶形拱垂直相交形成的拱顶，投影为十字形，常用于罗马式和哥特式建筑中，能覆盖更大空间，减少支撑需求，提高结构稳定性，在中世纪建筑中广泛应用，如教堂大厅。'],
      ['西方古代建筑', '结构构件', '骨架券', 'Rib Vault', '骨架券又称肋架拱、肋骨拱，是通过一系列交叉的拱形肋骨支撑上方的石材，形成一个较轻的拱顶结构。这种设计使得拱顶表面更加轻盈，减少了对厚重承重墙的依赖，能够提供更大窗户和更通透的空间。', '骨架券是哥特建筑的关键特征，由交叉拱肋支撑屋顶石材，减轻重量，允许更大窗户和更高空间，如巴黎圣母院，是从中世纪晚期发展而来，推动了哥特式教堂的垂直性和光线效果。'],
      ['西方古代建筑', '古罗马', '卡拉卡拉浴场', 'Baths of Caracalla', '罗马公共浴场，建于211~217年。', '卡拉卡拉浴场是古罗马第二大公共浴场，由塞普蒂米乌斯·塞维鲁开始，卡拉卡拉完成，能容纳1600人，包括浴室、健身房和图书馆，体现了罗马帝国的奢华和工程技术，使用拱顶和混凝土结构。'],
      ['西方古代建筑', '古罗马', '戴克利提乌姆浴场', 'Baths of Diocletian', '罗马公共浴场，建于305~306年。', '戴克利提乌姆浴场是罗马最大的帝国浴场，由戴克里先建造，占地13万平方米，能容纳3000人，包括浴室、花园和图书馆，后来部分改建为教堂，展示了罗马晚期建筑的规模和功能多样性。'],
      ['西方古代建筑', '结构构件', '穹顶', 'Dome', '集中式教堂的决定性结构因素。', '穹顶是建筑中从拱演变而来的半球形结构，通常形成天花板或屋顶，最早出现在古罗马建筑如万神庙中，在拜占庭和文艺复兴时期发展，用于集中式教堂，提供宏伟空间和象征天堂的意义。'],
      ['西方古代建筑', '建筑师', '伯鲁乃列斯基', 'Filippo Brunelleschi', '意大利文艺复兴早期颇负盛名的建筑师与工程师，线性透视法的发明者。他的主要建筑作品都位于意大利佛罗伦萨。', '伯鲁乃列斯基（1377~1446年）是意大利文艺复兴的先驱，以佛罗伦萨大教堂穹顶闻名，该穹顶采用双层壳和骨架券结构，标志着建筑技术的进步。他还发明线性透视法，推动了艺术和科学的融合。'],
      ['西方古代建筑', '建筑师', '伯拉孟特', 'Donato Bramante', '意大利文艺复兴时期著名的建筑师。', '他将古罗马建筑转化为文艺复兴时期的建筑语言，在当时就被视为极富影响力的大师。在建筑方面，与同时代的列奥纳多·达·芬奇各领风骚。他的著名作品有罗马的“坦比哀多”（Tempietto）小堂，还曾参与设计圣伯多禄大殿。伯拉孟特（约1444~1514年）引入盛期文艺复兴风格，设计坦比哀多小堂和圣彼得大殿的最初方案，将古典元素融入现代设计，影响了米开朗基罗等后辈，是文艺复兴建筑向巴洛克过渡的关键人物。'],
      ['西方古代建筑', '文艺复兴', '佛罗伦萨主教堂的穹顶', 'Dome of Florence Cathedral', '意大利文艺复兴建筑史开始的标志。结构：第一，穹顶轮廓采用矢形的，大致是双圆心的；第二。用骨架券结构，穹顶分内外两层，中间是空的。意义：第一，突破教会的精神专制。第二，是文艺复兴时期独创精神的标志。第三，标志文艺复兴时期科学技术的普遍进步。', '佛罗伦萨大教堂穹顶由布鲁内莱斯基设计，建于1420~1436年，直径约42米，双圆心矢形轮廓，双层空心结构，使用骨架券，标志着文艺复兴建筑的开端，体现了人文主义和科技进步。'],
      ['西方古代建筑', '文艺复兴', '佛罗伦萨主教堂', 'Florence Cathedral', '又称圣母百花大教堂，是位于意大利佛罗伦斯的一座天主教教堂，是天主教佛罗伦斯总教区的主教座堂，属哥特式风格。始建于1296年，由建筑师阿诺尔·迪·坎比奥设计，并采用了精通罗马古建筑的工匠菲利波·布鲁内莱斯基的圆顶（穹顶）建造，1436年最终完工。', '佛罗伦萨主教堂（圣母百花大教堂）是哥特式建筑，1296年开始，由阿诺尔·迪·坎比奥设计，1436年完工，能容纳3万人，穹顶由布鲁内莱斯基建造，是文艺复兴建筑的标志性作品。'],
      ['西方古代建筑', '文艺复兴', '美狄奇府邸', 'Palazzo Medici Riccardi', '美第奇府邸始建于1444年，由科西莫·美第奇委托建筑师米开罗佐设计建造。', '原方案因布鲁内莱斯基的设计过于宏大而被否决。建筑外立面采用三层不同工艺的石工技术，底层粗面石工砌缝宽达20厘米，二层砌缝保留8厘米，三层则采用磨石对缝工艺，形成视觉稳定感。平面布局近似方形，中央设柱廊环绕的庭院，二、三层采用拱券双联窗体现文艺复兴初期秩序美学。墙面装饰包含美第奇家族族徽，17世纪扩建后形成现存规模。'],
      ['西方古代建筑', '文艺复兴', '维晋寨的巴西利卡', 'Basilica Palladiana', '帕拉迪奥的重要作品。', '维琴察的巴西利卡帕拉迪亚纳是文艺复兴建筑，由安德烈亚·帕拉迪奥设计，1546年开始，改造中世纪市政厅，采用拱廊和柱式，体现了古典复兴和对称美学，是帕拉迪奥主义的核心代表。'],
      ['西方古代建筑', '柱式', '帕拉迪奥母题', 'Palladian Motif', '帕拉迪奥母题，常指三部分窗户，由拱形中央部分和两侧方形部分组成。', '帕拉迪奥母题源于安德烈亚·帕拉迪奥的设计，常用于窗户或入口，三部分结构：拱形中央 flanked by narrower sections，影响了新古典主义建筑，如英国庄园和美国公共建筑。'],
      ['西方古代建筑', '理论', '建筑四书', 'The Four Books of Architecture', '帕拉迪奥的著作，文艺复兴时期的重要著作。', '《建筑四书》由安德烈亚·帕拉迪奥于1570年出版，总结古典建筑原则，使用自身设计示例，影响了欧洲和美国的帕拉迪奥主义，成为古典主义建筑的教科书。'],
      ['西方古代建筑', '理论', '五种柱式规范', 'The Five Orders of Architecture', '维尼奥拉的著作，文艺复兴时期的重要著作。代表欧洲古典主义学院派。', '《五种柱式规范》由贾科莫·巴罗齐·达·维尼奥拉于1562年出版，专注于托斯卡纳、多立克、爱奥尼、科林斯和复合柱式，标准化比例和细节，成为古典主义学院派的代表作。'],
      ['西方古代建筑', '文艺复兴', '圣彼得大教堂', 'St. Peter\'s Basilica', '意大利文艺复兴最伟大的纪念碑。17世纪初年，圣彼得大教堂遭到损害，标志着意大利文艺复兴建筑的结束。', '圣彼得大教堂是梵蒂冈的现存大殿，由尤利乌斯二世于1506年开始，保罗五世于1615年完成，由伯拉孟特、米开朗基罗和伯尼尼等设计，是文艺复兴和巴洛克建筑的巅峰，体现了天主教会的宏伟。'],
      ['西方古代建筑', '建筑师', '伯尼尼', 'Gian Lorenzo Bernini', '圣彼得大教堂前的广场（巴洛克风格）。', '詹·洛伦佐·伯尼尼（1598~1680年）是巴洛克风格的创始人，主要雕塑家和建筑师，设计圣彼得广场的椭圆形柱廊，融合动态和戏剧性，影响了17世纪欧洲艺术。'],
      ['西方古代建筑', '古典主义', '恩瓦立德新教堂', 'Dôme des Invalides', '1680~1706年，是第一个完全的古典主义教堂建筑，也是17世纪最完整的古典主义纪念物之一。', '恩瓦立德圆顶教堂由朱尔·阿尔杜安-曼萨尔设计，作为路易十四的伤兵院的一部分，是法国古典主义建筑的典范，圆顶高107米，融合巴洛克元素，是拿破仑墓所在地。'],


      // ================= 建筑风格与设计思潮 (Refined and Expanded from PDF) =================
      ['建筑风格与设计思潮', '古典与历史风格', '古典主义', 'Classicism', '建于公元前7世纪到4世纪的古希腊，以柱式、对称、几何和透视原则为特征。', '最著名的是大型石造宗教神殿。表达古典主义风格最显著的特征是古希腊的三种“建筑柱式”：多立克（Doric）、爱奥尼（Ionic）和科斯林（Corinthian）。代表作帕特农神庙（公元前5世纪）展示了建筑体积在基座上的支撑关系。'],
      ['建筑风格与设计思潮', '古典与历史风格', '罗马式建筑', 'Romanesque Architecture', '6世纪到9世纪欧洲发展起来的风格，以厚重坚固的墙壁和半圆形拱门的最小开窗方式为特色。', '受古罗马启发，背景是欧洲各国处于战争状态、防御需求增加。代表作：西班牙圣地亚哥-德孔波斯特拉主教座堂（Santiago de Compostela Cathedral）。'],
      ['建筑风格与设计思潮', '古典与历史风格', '哥特式建筑', 'Gothic Architecture', '起源于法国中世纪晚期（900-1300年），特征是垂直高耸、尖形拱门和肋状拱顶。', '最初被命名为Opus Francigenum（法国式作品）。“哥特式”一词出现于启蒙运动时期。代表作：巴黎圣母院大教堂、兰斯大教堂。'],
      ['建筑风格与设计思潮', '古典与历史风格', '巴洛克风格', 'Baroque Style', '16世纪开始，利用装饰和建筑元素建立戏剧性感觉，通过明暗对比将结构视为装饰。', '早期典型作品是罗马的耶稣堂（Church of Gesù），拥有第一个真正意义上的巴洛克式外观。'],
      ['建筑风格与设计思潮', '古典与历史风格', '新古典主义', 'Neoclassicism', '18世纪开始，试图复兴希腊和罗马的古典建筑，带来理性对称的建筑。', '受社会经济背景、工业革命及重新接触古代作品影响，是对巴洛克的回应。'],
      ['建筑风格与设计思潮', '古典与历史风格', '学院派建筑', 'Beaux-Arts Architecture', '起源于19世纪30年代巴黎美术学校，参考新古典、哥特及文艺复兴，并使用玻璃和铁等现代材料。', '影响了美国建筑（如路易斯·沙利文）。呈现与现代线条融合的雕塑装饰。代表：巴黎大皇宫、纽约中央车站。'],
      ['建筑风格与设计思潮', '近现代风格', '新艺术风格', 'Art Nouveau', '对折衷主义的回应，体现为充满弯曲和蜿蜒线条的装饰元素，受有机形状启发。', '最早由比利时建筑师维克多·霍塔（Victor Horta）设计，最具代表性的是法国赫克托·吉马德（Hector Guimard）的作品。'],
      ['建筑风格与设计思潮', '近现代风格', '艺术装饰风格', 'Art Deco', '融合现代设计、手工元素和奢华材料，代表对科技进步的信念。', '奥古斯特·贝瑞（Auguste Perret）是早期运用钢筋混凝土的大师。代表作：香榭丽舍剧院（1913）。'],
      ['建筑风格与设计思潮', '近现代风格', '包豪斯风格', 'Bauhaus Style', '20世纪初，注重满足实用要求，发挥新材料结构性能，造型整齐简洁，构图灵活。', '创始人瓦尔特·格罗皮乌斯。主张艺术与技术结合，走建筑工业化道路。'],
      ['建筑风格与设计思潮', '近现代风格', '现代主义', 'Modernism', '20世纪上半叶诞生，主张功能主义，机器美学。', '代表人物：格罗皮乌斯、柯布西耶、密斯、赖特。柯布西耶提出“新建筑五点”。'],
      ['建筑风格与设计思潮', '近现代风格', '后现代主义', 'Postmodernism', '20世纪70年代末兴起，从新历史和构图角度审视现代主义，常用讽刺和流行文化元素。', '代表作：《向拉斯维加斯学习》是后现代主义思想的开创性著作之一。'],
      ['建筑风格与设计思潮', '近现代风格', '解构主义', 'Deconstructivism', '20世纪80年代，对设计规则提出质疑，融入非线性动力学，拆除传统思维模式。', '受结构主义和俄国构成主义影响。1988年MoMA展览汇集了艾森曼、盖里、哈迪德、库哈斯、里伯斯金、屈米、普利克斯的作品。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '瓦尔特·格罗皮乌斯', 'Walter Gropius', '现代主义建筑学派的倡导人和奠基人之一，包豪斯学校创办人。', '主张走建筑工业化道路。代表作：法古斯鞋楦厂（1911）、包豪斯校舍（1925，玻璃幕墙先声）、西门子城住宅区。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '勒·柯布西耶', 'Le Corbusier', '现代主义建筑旗手，功能主义之父，机器美学奠基人。', '提出“新建筑五点”：底层架空、屋顶花园、自由平面、自由立面、横向长窗。代表作：萨伏伊别墅（1929）、马赛公寓（1947）、朗香教堂（1950）。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '弗兰克·劳埃德·赖特', 'Frank Lloyd Wright', '美国有机建筑大师，工艺美术运动美国派代表。', '崇尚自然，提出“有机建筑”理念。代表作：流水别墅（1936，悬挑楼板与自然结合）、古根海姆博物馆。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '密斯·凡·德·罗', 'Mies van der Rohe', '现代主义大师，提出“少就是多”（Less is more）。', '主张“流通空间”和“全面空间”。代表作：巴塞罗那德国馆（1929）、西格拉姆大厦（1954）、范斯沃斯住宅。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '阿尔瓦·阿尔托', 'Alvar Aalto', '芬兰建筑师，倡导民族化与人情化的现代建筑理念。', '设计涵盖建筑、家具（弯曲木材）及规划。代表作：帕伊米奥结核病疗养院（1929）、玛利亚别墅（1938）、维普里图书馆。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '法古斯鞋楦厂', 'Fagus Factory', '格罗皮乌斯早期代表作（1911），现代建筑里程碑。', '首次大规模使用玻璃幕墙，转角处取消柱子，体现了工业美学。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '包豪斯校舍', 'Bauhaus School Building', '格罗皮乌斯设计的包豪斯德绍校舍（1925）。', '功能分区明确，通过天桥和连廊组合，大面积玻璃幕墙。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '新建筑五点', 'Five Points of Architecture', '柯布西耶1926年提出的现代建筑设计原则。', '底层架空柱、屋顶花园、自由平面、自由立面、横向长窗。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '萨伏伊别墅', 'Villa Savoye', '柯布西耶的代表作（1929），完美体现了新建筑五点。', '被誉为“居住的机器”，是现代主义建筑的图标。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '马赛公寓', 'Unité d\'Habitation', '柯布西耶战后代表作（1947-1952），粗野主义的先驱。', '巨型钢筋混凝土结构，不仅是住宅，还包含商店、幼儿园等社区设施，像一座垂直城市。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '朗香教堂', 'Ronchamp Chapel', '柯布西耶晚期作品（1950-1955），转向表现主义。', '具有雕塑感的厚重屋顶和不规则窗洞，创造了神秘的光影效果，被誉为20世纪最震撼的建筑之一。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '草原式住宅', 'Prairie Style', '赖特早期住宅风格，灵感来自美国中西部草原。', '强调水平线条，低坡屋顶，深远的挑檐，与大地紧密结合。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '流水别墅', 'Fallingwater', '赖特为卡夫曼家族设计的别墅（1936-1939）。', '建筑横跨瀑布之上，巨大的悬挑楼板锚固在自然山石中，是人与自然融合的杰作。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '有机建筑', 'Organic Architecture', '赖特的核心设计哲学。', '主张建筑应像植物一样从大地中生长出来，形式与功能统一，内部空间向外延伸。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '少就是多', 'Less is more', '密斯·凡·德·罗的设计名言。', '反对装饰，追求结构和形式的极致精简与纯净。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '流通空间', 'Flowing Space', '密斯提出的空间概念。', '打破房间的封闭感，使内部空间相互贯通并延伸至室外。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '全面空间', 'Universal Space', '密斯提出的通用空间概念。', '一个巨大的、无柱的、可灵活划分的大空间。代表作：克朗楼（Crown Hall）。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '巴塞罗那德国馆', 'Barcelona Pavilion', '密斯设计的1929年世博会德国馆。', '以大理石、玻璃和钢材构成，体现了“流通空间”和极简主义美学。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '西格拉姆大厦', 'Seagram Building', '密斯设计的纽约摩天大楼（1954-1958）。', '玻璃与青铜的完美结合，精致的细部（工字钢装饰），是国际式风格的巅峰。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '帕伊米奥结核病疗养院', 'Paimio Sanatorium', '阿尔托的早期功能主义代表作（1929）。', '设计充分考虑病人心理和生理需求（如采光、色彩、无眩光照明），体现了“建筑人情化”。'],
      ['建筑风格与设计思潮', '著名建筑师与理论', '玛利亚别墅', 'Villa Mairea', '阿尔托设计的住宅（1938）。', '融合了现代主义形式与芬兰传统材料（木材、砖、石），强调自然感和触感。'],
      ['建筑风格与设计思潮', '流派', '高技派', 'High-tech', '20世纪60年代出现以新技术手段创造性的解决建筑问题的倾向。', '强调新时代的审美观.力求使高度工业技术接近人们的生活方式和传统的美学观。代表作:蓬皮杜艺术中心。'],
      ['建筑风格与设计思潮', '工艺美术', '工艺美术运动', 'Arts and Crafts Movement', '19世纪后期英国出现的设计改革运动。', '提倡用手工艺生产表现自然材料.以改革传统形式，反对粗制滥造的机器产品。在建筑上主张建造"田园式"住宅来摆脱古典建筑的束缚。代表人物是拉斯金和莫里斯。'],
      ['建筑风格与设计思潮', '现代主义', '功能主义', 'Functionalism', '将实用作为美学主要内容、将功能作为建筑追求目标的一种创作思潮。', '芝加哥建筑师沙里文是功能主义的奠基者。提出"形式服从功能"的口号。'],
      ['建筑风格与设计思潮', '现代主义', '构成主义', 'Constructivism', '一战前后俄国青年艺术家把抽象几何形体组成的空间当绘画和雕刻的内容。', '其思想是用构成来表现，用造型自身的规律，将建筑分割成一些要素，来进行构成。代表作:塔特林第三国际纪念碑。'],
      ['建筑风格与设计思潮', '现代主义', '表现主义', 'Expressionism', '20世纪初德国和奥地利的一种艺术流派。', '认为艺术的任务首先在于表现个人的主观感受和体验。表现主义建筑师常采用奇特、夸张的建筑形体来表现或象征某些思想感情或某种时代精神。代表作:门德尔松德国波茨坦市爱因斯坦天文台。'],
      ['建筑风格与设计思潮', '现代主义', 'CIAM', 'CIAM', '国际现代建筑协会，1928年在瑞士成立。', '发起人包括勒.柯布西耶、格罗皮乌斯等。1933年发表了著名的城市规划理论和方法的纲领性文件《雅典宪章》。'],
      ['建筑风格与设计思潮', '现代主义', '粗野主义', 'Brutalism', '20世纪50-60年代兴起，强调材料真实性和结构表现力的风格。', '建筑材料保持自然特色,混凝土梁柱墙面完工时不加粉刷，留下模板表面毛糙的痕迹.具有质朴和清新的形象，构件沉重肥大超常规．交接比较粗鲁生硬。实例:马赛公寓。'],
      ['建筑风格与设计思潮', '结构主义', '结构主义', 'Structuralism', '强调整体性和共时性的建筑思潮。', '认为建筑师的任务并不是提供任何现成理论，而应该提供空间框架，最终由使用者自己选择占有并呈现特征。实例:赫茨贝格荷兰中央贝赫保险公司大楼。'],
      ['建筑风格与设计思潮', '理论', '少就是乏味', 'Less is bore', '罗伯特·文丘里针对现代主义提出的反驳。', '他鼓吹一种杂乱的、复杂的、含混的、折衷的、象征主义的和历史主义的建筑．这和波普运动一脉相承。'],
      ['建筑风格与设计思潮', '现代主义', '理性主义', 'Rationalism', '20世纪初期探索现代建筑发展方向的创作思潮。', '原则是:①注重建筑目的的逻辑性;②注重建造过程的逻辑性;③注重建筑使用的逻辑性。提倡简介、清晰、明朗的建筑风格。'],
      ['建筑风格与设计思潮', '复古思潮', '浪漫主义', 'Romanticism', '18世纪下半叶到19世纪上半叶活跃于欧洲的思潮。', '要求发扬个性自由、提倡自然天性，用中世纪手工业艺术的自然形式来反对资本主义制度下用机器制造出来的工艺品。'],
      ['建筑风格与设计思潮', '流派', '纽约五人组', 'New York Five', '1969年纽约现代艺术博物馆举办展览的5位美国建筑师。', 'R.迈耶，P.埃森曼，M.格雷夫斯，C.格瓦斯梅, J.海杜克。被认为是新现代思潮的代表。'],
      ['建筑风格与设计思潮', '19世纪', '水晶宫', 'Crystal Palace', '1851年帕克斯顿设计的伦敦世博会展览馆。', '采用了装配建房的方法。整个建筑材料只采用了铁木玻璃三种材料，没有任何多余的装饰．完全表现了工业生产的机械本能。'],
      ['建筑风格与设计思潮', '现代主义', '未来主义', 'Futurism', '一战前出现在意大利的艺术流派，歌颂速度与机器。', '认为建筑风格不应仅仅追求形式的改变.未来的城市应具有全新的功能。'],
      ['建筑风格与设计思潮', '19世纪', '折衷主义建筑', 'Eclecticism', '任意模仿历史上的各种风格或自由组合各种式样。', '为了弥补古典主义与浪漫主义在建筑创作中的局限性。不讲固定的法式，只讲求比例均衡.注重纯形式美。'],
      ['建筑风格与设计思潮', '后现代', '典雅主义', 'Formalism', '二次世界大战后美国官方建筑的主要思潮，又称形式美主义。', '吸取古典建筑传统构图，比较工整严谨，造型简练轻快，以传神代替神似。代表人物有：约翰逊、斯通和雅马萨奇。'],
      ['建筑风格与设计思潮', '现代主义', '德意志制造联盟', 'Deutscher Werkbund', '1907年在德国成立，目的在于提高工业制品质量。', '由企业家、艺术家、技术员组成。'],
      ['建筑风格与设计思潮', '现代主义', '风格派', 'De Stijl', '1917年荷兰青年艺术家组成的造型艺术团体。', '主张把艺术从个人情感中解放出来，寻求一种客观的结构。代表作是由里特弗尔德设计的荷兰乌德勒支住宅。'],
      ['建筑风格与设计思潮', '现代主义', '密斯风格', 'Miesian Style', '40年代末到60年代盛行于美国的建筑设计倾向。', '以“少就是多”为理论来源，以“全面空间”、“纯净空间”、“模数构图”为特征。提倡忠实于结构和材料，特别强调简洁严整的细部处理方法。'],
      ['建筑风格与设计思潮', '理论', '模度', 'Modulor', '柯布西耶从人体尺度出发提出的模数系统。', '选定下垂手臂、脐、头顶、上身手臂四个部位为控制点。形成红尺和蓝尺两套级数。'],
      ['建筑风格与设计思潮', '流派', 'Team X', 'Team X', '以英国史密森夫妇为首的一个青年建筑师组织。', '对CIAM过去的方向提出创造性的批评。提倡以人为核心的城市设计思想。'],
      ['建筑风格与设计思潮', '现代主义', '新陈代谢派', 'Metabolism', '20世纪60年代日本形成的建筑创作组织。', '强调事物的生长、变化、衰亡。认为城市和建筑不是静止的，它像生物新陈代谢那样是一种动态过程。代表作：山梨县文化会馆。'],
      ['建筑风格与设计思潮', '理论', '形式追随功能', 'Form Follows Function', '芝加哥学派沙利文提出。', '认为要每一个建筑物一个适合的和不错误的形式，这才是建筑创作的目的。建筑的设计应该从内而外，形式应与功能一致。'],
      ['建筑风格与设计思潮', '行为', '行为建筑学', 'Behavioral Architecture', '研究人的需要、欲望、情绪等与环境及建筑的关系。', '研究如何可通过城市规划与建筑设计来满足人的行为心理要求。'],
      ['建筑风格与设计思潮', '建筑师', '雅马萨奇', 'Minoru Yamasaki', '美籍日裔建筑师，典雅主义代表人物。', '致力运用传统美学法则来使现代的材料与结构产生规整、端庄与典雅的庄严感。代表：纽约世界贸易中心。'],
      ['建筑风格与设计思潮', '文献', '《走向新建筑》', 'Vers une architecture', '柯布西耶的宣言式小册子。', '激烈否定因循守旧的复古主义、折衷主义，主张创造表现新时代的新建筑。提出了“住宅是居住的机器”。'],
      ['建筑风格与设计思潮', '19世纪', '芝加哥学派', 'Chicago School', '美国最早的建筑流派，现代建筑在美国的奠基者。', '突出功能在建筑设计中的主要地位，明确提出形式随从功能的观点。重要贡献是创造了“芝加哥之窗”和高层金属框架结构。'],
      ['建筑风格与设计思潮', '当代', '新地域主义', 'New Regionalism', '关注建筑所处的文脉和都市现状。', '试图从场所、气候、自然条件以及传统习俗和都市文脉中去思考当代建筑的生成条件与设计原则。代表作：西班牙莫奈奥的作品。'],
      ['建筑风格与设计思潮', '当代', '新乡土派', 'New Vernacular', '注重建筑自由构思结合地方特色与适应各地区人民生活习惯。', '继承了芬兰建筑师阿尔托的主张并加以发展。'],
      ['建筑风格与设计思潮', '前卫', 'Archigram', '建筑电讯派，英国60年代最先锋的创作倾向。', '夸张突出建筑技术符号，畅想“行走城市”，“插入式城市”等。'],
      ['建筑风格与设计思潮', '理论', '符号学', 'Semiology', '把建筑的形看成是一个符号，研究其与意义的关系。', '研究符号本身的逻辑关系及建筑符号系统与使用者之间的关系。'],
      ['建筑风格与设计思潮', '规划', '光明城市', 'Radiant City', '柯布西耶提出的城市集中主义规划思想。', '设想在城市里建高层建筑，现代交通网和城市绿地。即：高层居住建筑+立体快速交通干道+城市功能分区。'],
      ['建筑风格与设计思潮', '理论', '建筑图式思维理论', 'Diagrammatic Thinking', '1980年拉修著《图式思维论》。', '强调建筑师如何用草图和分析图的方法迅速捕捉灵感，找出解决办法。'],
      ['建筑风格与设计思潮', '理论', '可发展图型', 'Growth-ready patterns', '路易斯·康的设计理念。', '代表作为理查德医学院研究楼，塔楼的布局采用了可发展图型，为日后的扩展做下准备条件。'],
      ['建筑风格与设计思潮', '可持续', '绿色建筑', 'Green Building', '指对环境无害，能充分利用环境自然资源的一种建筑。', '又可称为可持续发展建筑、生态建筑。以人、建筑和自然环境的协调发展为目标。'],
      ['建筑风格与设计思潮', '流派', 'MIAR', 'MIAR', '意大利理性主义运动，由特拉尼发起。', '主张运用材料时应该忠实简洁，认为新的建筑应是逻辑和理性结合的产物。'],
      ['建筑风格与设计思潮', '可持续', '生态建筑', 'Ecological Architecture', '根据当地自然生态环境，运用生态学原理设计的建筑。', '使建筑和环境之间成为一个有机的结合体，形成良性循环系统。'],
      ['建筑风格与设计思潮', '流派', '提契诺学派', 'Ticino School', '瑞士南部提契诺地区的建筑学派。', '尝试将历史传统与现代建筑结合。代表人物：博塔。'],
      ['建筑风格与设计思潮', '当代', '新现代主义建筑', 'Neo-Modernism', '继承和发展现代派设计语言的倾向，又称白色派。', '强调多样化表达、纯粹化、净化和表现意味。代表人物：R.迈耶。'],
      ['建筑风格与设计思潮', '后现代', '隐喻主义', 'Metaphoric Architecture', '注重建筑语义的象征作用，运用暗示、联想手法。', '强调建筑是历史文化的组成部分，应该表现人文、地理和历史的延续性。'],
      ['建筑风格与设计思潮', '理论', '装饰就是罪恶', 'Ornament is Crime', '维也纳分离派建筑师洛斯提出的观点。', '主张与传统分离，反对装饰，认为建筑应以形体自身之美为美。'],
      ['建筑风格与设计思潮', '展览', '维森霍夫曼试验住宅展', 'Weissenhof Estate', '由德意志制造联盟策划的国际现代建筑展。', '是现代建筑发展的重要里程碑，奠定了战后控制世界建筑的基本方向的“国际式风格”。'],
      ['建筑风格与设计思潮', '建筑师', '卒姆托', 'Peter Zumthor', '极少主义建筑师，2009年普利兹克奖得主。', '探索建筑本质和纯净形式，代表作有瓦尔斯温泉浴场。'],

      // ================= 8. 城市规划与公共空间 (Expanded from PDF) =================
      ['城市规划与公共空间', '基本概念', '聚落', 'Settlement', '集中修建房屋住所的人类日常聚居的地方的统称。', '包括城市和乡村两大类。'],
      ['城市规划与公共空间', '基本概念', '居民点', 'Settlement', '按照生产和生活需要形成的人类集聚定居地点。', '按性质和人口规模，分为城市和乡村两大类。在规划中也特指规划指定的乡村型集中居住社区。'],
      ['城市规划与公共空间', '基本概念', '城市', 'City/Urban', '以非农产业和一定规模的非农人口集聚为主要特征的聚落。', '在中国通常也指按国家行政建制设立的市，或其所辖的市区。'],
      ['城市规划与公共空间', '基本概念', '城市化', 'Urbanization', '又称“城镇化”。人类生产和生活方式由乡村型向城市型转化的过程。', '表现为乡村人口向城市人口转化以及城市不断发展和完善的过程。'],
      ['城市规划与公共空间', '基本概念', '城市群', 'Urban Cluster', '一定地域范围内空间接近、社会经济联系紧密的多个城市组成的区域形态。', '又称城市聚集区（Urban Agglomeration）。'],
      ['城市规划与公共空间', '基本概念', '都市圈', 'Metropolitan Circle', '具有圈层形态的都市区。', '通常以一个特大城市为核心，与周围地区保持强烈的社会经济联系。'],
      ['城市规划与公共空间', '基本概念', '中心城市', 'Central City', '一定区域范围内处于重要地位，具有综合功能或多种主导功能的城市。', '对其他城市具有强大吸引力和辐射力的城市。'],
      ['城市规划与公共空间', '基本概念', '行政区划', 'Administrative Regionalization', '国家为了进行分级管理而将国家的主权空间地域划分为大小不同、层次不同的部分。', '并设置相应行政管理机构的区域划分。'],
      ['城市规划与公共空间', '基本概念', '城市化地区', 'Urbanized Area', '依据城市地域景观所划定的一种地理统计单元。', '主要用于反映城市人口集中的城市连片地区。'],
      ['城市规划与公共空间', '规划体系', '城乡规划', 'Urban and Rural Planning', '对学科和实践领域的统称。', '指对一定时期内城乡经济和社会发展、土地使用、空间布局以及各项建设的综合部署、具体安排和实施管理。'],
      ['城市规划与公共空间', '规划体系', '城市规划', 'Urban Planning', '对一定时期内城市的经济和社会发展、土地使用、空间布局以及各项建设的综合部署。', '具体安排和实施管理。近代曾称“都市计划”、“市镇计划”。'],
      ['城市规划与公共空间', '规划体系', '城市总体规划纲要', 'City Comprehensive Planning Outline', '确定城市总体规划的重大原则性问题的纲领性文件。', '是编制城市总体规划的依据。'],
      ['城市规划与公共空间', '规划体系', '城市总体规划', 'City Comprehensive Planning', '对一定时期内城市性质、发展目标、发展规模、土地使用、空间布局以及各项建设的综合部署和实施措施。', '是指导城市建设和发展的基本依据。'],
      ['城市规划与公共空间', '规划体系', '分区规划', 'District Planning', '根据城市总体规划，对划定的分区在土地使用、人口分布、公共设施、城市基础设施配置等方面进行进一步安排的规划。', '介于总体规划和详细规划之间。'],
      ['城市规划与公共空间', '规划体系', '详细规划', 'Detailed Planning', '以总体规划为依据，对局部地区的土地使用、空间环境和各项建设用地所做的具体安排。', '包括控制性详细规划和修建性详细规划。'],
      ['城市规划与公共空间', '规划体系', '控制性详细规划', 'Regulatory Detailed Planning', '以总体规划为依据，对特定地区内的用地进行地块划分，并提出具体土地使用性质、使用强度、公共服务设施配套、道路交通和工程管线以及空间环境控制的规划控制要求。', '是规划管理的主要依据。'],
      ['城市规划与公共空间', '规划体系', '修建性详细规划', 'Constructive Detailed Planning', '以控制性详细规划为依据，对建设地段制定的用以指导各项建筑和工程设施的设计及施工的规划设计。', '内容更具体，包括建筑布局、环境设计等。'],
      ['城市规划与公共空间', '规划体系', '城市设计导则', 'Urban Design Guideline', '城市设计中制定的专门用于引导城市开发建设的各项设计准则的统称。', '包括图纸与文字条款。'],
      ['城市规划与公共空间', '规划体系', '土地使用规划', 'Land Use Planning', '又称“土地利用规划”。城市规划的核心内容。', '以特定区域内全部土地为对象，明确未来土地使用方式，统筹各类用地之间关系，并实施开发控制的规划。'],
      ['城市规划与公共空间', '理论与方法', '理性规划', 'Rational Planning', '以理性思考为基础进行的规划，其核心是基于现有的科学理论。', '通过合理的逻辑推导而不是通过个人的好恶偏好来指导未来的行动。'],
      ['城市规划与公共空间', '理论与方法', '区位理论', 'Location Theory', '又称“区位经济论”。关于经济活动空间位置选择规律的理论。', '探讨区位因素对经济活动布局的影响过程和经济活动最优区位选择的理论。'],
      ['城市规划与公共空间', '理论与方法', '核心-边缘理论', 'Core-Periphery Theory', '在区域非均衡发展的格局中，揭示了核心区对边缘区产生支配作用的一种理论。', '解释了区域发展不平衡的动态过程。'],
      ['城市规划与公共空间', '理论与方法', '集聚效应', 'Concentration Effect', '人口或经济活动向特定地区集中并产生经济优势的现象。', '是城市形成和发展的重要动力。'],
      ['城市规划与公共空间', '理论与方法', '中心地理论', 'Central Place Theory', '由德国地理学家克里斯泰勒提出的一种关于大区域范围内城市布局的理论。', '揭示了城市体系以中心城市为核心呈等级化、秩序化分布的规律特点。'],
      ['城市规划与公共空间', '理论与方法', '希波丹姆规划模式', 'Hippodamian Plan', '古希腊学者希波丹姆提出的以格网道路布局为骨架的规划形式。', '城市形成秩序化布局的形式，最早在理论上阐述并在城市重建中运用，被誉为“城市规划之父”。'],
      ['城市规划与公共空间', '理论与方法', '理想城市', 'Ideal City', '基于特定哲学思想、社会理想或科学技术而建构或想象的完美城市的统称。', '如文艺复兴时期许多学者提出的一种城市模式，城市呈规则的几何化平面布局。'],
      ['城市规划与公共空间', '理论与方法', '空想社会主义城市规划', 'Utopian Urban Planning', '又称“乌托邦城市规划”。', '19世纪初以空想社会主义为内涵的一种城市规划思潮。'],
      ['城市规划与公共空间', '理论与方法', '城市美化运动', 'City Beautiful Movement', '19世纪末至20世纪初，美国以改善城市景观环境来解决城市快速发展中物质空间和社会空间问题的运动。', '强调宏大的视觉效果和纪念性。'],
      ['城市规划与公共空间', '理论与方法', '带形城市理论', 'Linear City Theory', '由西班牙索里亚·伊·马塔提出的一种城市空间组织理论。', '城市建成区沿着主要交通轴线呈条带状连续延展。'],
      ['城市规划与公共空间', '理论与方法', '田园城市理论', 'Garden City Theory', '19世纪末由英国霍华德提出的城市规划布局模式。', '城市由一系列的同心圆组成，可分为市中心区、居住区、工业仓库等地带，被永久性绿地包围。'],
      ['城市规划与公共空间', '理论与方法', '有机疏散理论', 'Organic Decentralization Theory', '沙里宁提出的一种关于城市发展及其布局调整的理论。', '主张通过合理有序的要素集聚或疏散来解决大城市发展中的问题。'],
      ['城市规划与公共空间', '理论与方法', '芝加哥学派', 'Chicago School', '美国城市社会学的一个流派，以人文生态学的思想来研究城市的社会问题及其空间机制过程。', '代表人物包括帕克、伯吉斯等。'],
      ['城市规划与公共空间', '理论与方法', '同心圆理论', 'Concentric Zone Model', '美国学者伯吉斯提出的关于城市内部结构的一种理论。', '揭示城市地域以市中心为圆心呈圈层地带状分布的空间格局。'],
      ['城市规划与公共空间', '理论与方法', '扇形理论', 'Sector Model', '美国学者霍伊特提出的关于城市内部结构的一种理论。', '揭示从城市中心出发沿主要交通干线或障碍最小的方向呈扇面状向外延伸分布的空间格局。'],
      ['城市规划与公共空间', '理论与方法', '多核心理论', 'Multiple Nuclei Model', '美国学者哈里斯和乌尔曼提出的关于城市内部结构的一种理论。', '揭示城市中存在若干个中心并围绕这些中心发展所组成的空间格局。'],
      ['城市规划与公共空间', '理论与方法', '邻里单位', 'Neighborhood Unit', '美国学者佩里提出的一种居住区规划模式。', '以小学的服务范围来组织居住区的基本单元。'],
      ['城市规划与公共空间', '理论与方法', '卫星城', 'Satellite Town', '为分散中心城市过于集聚的人口和产业，在大城市周围地区新建或扩建的独立城镇。', '承担中心城市某些职能或为中心城市服务。'],
      ['城市规划与公共空间', '理论与方法', '雷德朋原则', 'Radburn Principle', '美国规划师克拉伦斯·斯坦提出的一种居住区布局模式。', '将居住区道路按功能划分为不同类型和若干等级，通过建立人车完全分离的体系来解决居住区内的活动干扰问题。'],
      ['城市规划与公共空间', '理论与方法', '光辉城市', 'Radiant City', '法国勒·柯布西耶提出的关于现代城市集聚发展的模式。', '主张通过立体式交通和提高城市密度来解决城市问题，以获得更高效、更舒适的生活。'],
      ['城市规划与公共空间', '理论与方法', '广亩城市', 'Broadacre City', '英国建筑师赖特提出的一种城市功能布局思想。', '解体传统集聚发展的城市形态，倡导高度分散的布局模式。'],
      ['城市规划与公共空间', '理论与方法', '功能分区', 'Functional Zoning', '现代城市规划布局的主要方式之一。', '根据城市中的各种活动类型的特点与需求，将城市用地按主要功能在空间上进行划分。'],
      ['城市规划与公共空间', '理论与方法', '绿带', 'Green Belt', '城市中带状连续分布的绿色空间。', '为阻止城市蔓延而在城市建成区外围划定的非城市建设地带。'],
      ['城市规划与公共空间', '理论与方法', '城市意象', 'City Image', '凯文·林奇提出的概念。', '通过对道路、节点、边界、地标和区域等要素，人群建立起的对城市的综合感知和印象。'],
      ['城市规划与公共空间', '理论与方法', '雅典宪章', 'Charter of Athens', '1933年国际建筑协会通过的关于城市规划理论和方法的纲领性文件。', '全面确立了现代主义城市规划的认识论和方法论。'],
      ['城市规划与公共空间', '理论与方法', '马丘比丘宪章', 'Charter of Machu Picchu', '1977年国际建筑协会通过的城市规划纲领性文件。', '对《雅典宪章》所提出的现代功能主义理性思想进行的全面修正与发展。'],
      ['城市规划与公共空间', '理论与方法', '城市蔓延', 'Urban Sprawl', '城市空间增长的一种形式，特指一种低密度、分散化的城市扩张方式。', '常导致土地浪费和交通拥堵。'],
      ['城市规划与公共空间', '理论与方法', '新城市主义', 'New Urbanism', '美国学者针对现代主义城市功能规划问题，提出的关于城市内部和郊区紧凑发展以恢复城市社区活力的一系列设计理念。', '强调步行、混合功能和社区归属感。'],
      ['城市规划与公共空间', '理论与方法', 'TOD', 'Transit Oriented Development', '公交导向型发展。以公共交通为引导的城市发展模式。', '通常以公交站点为中心，适宜的步行距离为半径，强调多种功能的混合开发。'],
      ['城市规划与公共空间', '理论与方法', '精明增长', 'Smart Growth', '针对城市蔓延危机，通过改变传统空间增长方式，促进特定地域内的紧凑发展。', '以实现城市与郊区协同、增强地方归属感、保护自然文化资源、提高开发利益等综合目标的一种空间发展模式。'],
      ['城市规划与公共空间', '理论与方法', '生态城市', 'Eco-city', '社会、经济、自然协调发展，物质、能量、信息高效利用，技术、文化与景观充分融合的人类聚居地。', '生态良性循环的集约型人类聚居地。'],
      ['城市规划与公共空间', '理论与方法', '紧凑城市', 'Compact City', '针对城市无序蔓延提出来的城市可持续发展理念模式。', '强调通过土地资源的混合使用、密集开发等策略，提高城市土地的利用效率和城市发展的品质。'],
      ['城市规划与公共空间', '理论与方法', '海绵城市', 'Sponge City', '利用城市的自然条件与工程措施调剂雨水的蓄存与释放。', '来应对雨水自然灾害的城市建设理念。'],
      ['城市规划与公共空间', '理论与方法', '韧性城市', 'Resilient City', '城市应对自然灾害的恢复能力。', '城市应对自然和人为灾害具有可承受、适应性和可恢复性的能力。'],
      ['城市规划与公共空间', '理论与方法', '智慧城市', 'Smart City', '以数字化、网络化和智能化的信息通信技术设施为基础。', '以社会、环境、管理为核心要素的当代城市发展理念与实践。'],
      ['城市规划与公共空间', '城市设计', '城市景观', 'Cityscape', '人类在城市聚居环境中所创造和维护的人工与自然景观。', '由城市建筑和建筑群、街道、广场、园林绿化等形成的外观整体及氛围。'],
      ['城市规划与公共空间', '城市设计', '建成环境', 'Built Environment', '人类生产、生活活动而形成的人居环境状态。', '范围上从聚落整体到具体建筑物，同时也包括各种支持性基础设施。'],
      ['城市规划与公共空间', '城市设计', '中央商务区', 'CBD', '大城市中商务、金融、贸易、信息功能高度集中布局的地区。', '具有综合经济特征的核心地区。'],
      ['城市规划与公共空间', '城市设计', '中央活动区', 'CAZ', '中央商务区（CBD）概念的扩展。', '强调融合商务行政、休闲娱乐文化、高品质居住、旅游观光等多种功能和活动集中，注重多样性、充满活力和空间人性化的规划分区。'],
      ['城市规划与公共空间', '城市设计', '城市原型', 'Urban Archetype', '由于宗教、政治、自然、文化、军事等原因或某种城市设计理论而形成的明确的城市形制。', '城市设计的基础模型。'],
      ['城市规划与公共空间', '城市设计', '城市天际线', 'City Skyline', '以天空为背景，由城市建筑物及其他物质环境要素形成的城市立面轮廓线。', '通常由城市的地形环境、自然植被、建筑物及高耸构筑物等的最高边界线组成。'],
      ['城市规划与公共空间', '城市设计', '城市肌理', 'Urban Fabric', '由路网、院落、建筑群、环境等不同密度、形式、材质的城市物质要素组合形成的城市空间组织关系。', '反映城市的组织结构和纹理。'],
      ['城市规划与公共空间', '城市设计', '城市文脉', 'Urban Context', '建筑与周围环境的关系。其形成在历史、社会、文化、时间等维度上存在着发展的连续性。', '体现城市历史文化的延续。'],
      ['城市规划与公共空间', '城市设计', '图底关系', 'Figure-Ground', '城市实体要素与开敞空间之间所形成的“图形与背景”的相互映衬关系。', '用于分析城市空间结构。'],
      ['城市规划与公共空间', '城市设计', '空间句法', 'Space Syntax', '以空间认知抽象和空间组构分析为基础，通过量化研究空间网络局部与整体的内在关系。', '揭示空间自律性以及空间与社会之间关联性的理论和方法。'],
      ['城市规划与公共空间', '城市设计', '城市触媒', 'Urban Catalyst', '能够引起和激发多项后续项目开发连锁反应的重大城市设施或活动。', '如大型博物馆、体育场馆等对周边区域的带动作用。'],
      ['城市规划与公共空间', '城市设计', '开放空间', 'Open Space', '又称“开敞空间”。城市中非建筑实体占用或建筑实体较少，向公众开放的空间。', '包括公园、广场、街道等。'],
      ['城市规划与公共空间', '城市设计', '公共空间', 'Public Space', '向所有城市居民开放，为公众共同使用的城市空间。', '如街道、广场、公园等。'],
      ['城市规划与公共空间', '城市设计', '场所精神', 'Genius Loci', '场所中，能让使用者产生认同感与归属感的内在品质。', '不仅是物理空间，更是具有独特氛围和特征的存在。'],
      ['城市规划与公共空间', '城市设计', '广场', 'Square', '为满足社会需要建设的具有一定功能和规模的开放型城市户外活动空间。', '主要由硬质铺装构成。'],
      ['城市规划与公共空间', '城市设计', '地标', 'Landmark', '具有鲜明特色且易被人识别的建（构）筑物或自然物。', '在城市空间中起到导向和定位作用。'],
      ['城市规划与公共空间', '城市设计', '街区', 'Block', '又称“街廓”。城镇中通过街道或自然地物边界（如河流）等所界定的基本单元地段。', '城市形态的基本组成部分。'],
      ['城市规划与公共空间', '城市设计', '街道设施', 'Street Furniture', '又称“街道家具”。沿道路布置的各类服务性设施。', '包括各类休憩设施、康体设施、城市雕塑、公用电话、公交站点、照明设施、应急设施等。'],
      ['城市规划与公共空间', '城市设计', '城市第五立面', 'The Fifth Facade', '从空中俯瞰到的城市建（构）筑物、自然环境、树木植被等构成的整体景象。', '即城市的屋顶和鸟瞰景观。'],
      ['城市规划与公共空间', '城市设计', '林荫道', 'Boulevard', '两旁植有成排乔木，树荫遮蔽的城市景观道路。', '提供舒适的步行和休憩环境。'],
      ['城市规划与公共空间', '规划指标', '容积率', 'Plot Ratio / FAR', '地块内建筑总面积与用地面积的比值。', '是衡量土地开发强度的重要指标。'],
      ['城市规划与公共空间', '规划指标', '建筑密度', 'Building Density', '一定地块内所有建筑物的基底总面积占总用地面积的比值。', '反映建筑用地的密集程度。'],
      ['城市规划与公共空间', '规划指标', '红线', 'Boundary Line', '各类建设工程项目用地使用权属范围的边界线。', '包含用地红线和道路红线。'],
      ['城市规划与公共空间', '规划指标', '道路红线', 'Road Boundary Line', '由规划确定的城市道路用地的边界线。', '城市道路用地内包括车行道、人行道、道路绿化等。'],
      ['城市规划与公共空间', '规划指标', '建筑控制线', 'Building Control Line', '又称“建筑红线”。地块内建筑物、构筑物布置不得超出的界线。', '通常从道路红线后退一定距离。'],
      ['城市规划与公共空间', '规划指标', '日照间距', 'Insolation Standard', '为保证建筑室内环境的卫生条件而确定的有效日照时间的最低限度。', '即根据建筑物所处的气候区、城市规模和建筑物的使用性质确定的，在日照标准日的有效日照时段内阳光应直接照射到建筑物室内的最低日照时数。'],
      ['城市规划与公共空间', '规划指标', '城市紫线', 'Urban Purple Line', '历史文化街区以及历史文化街区外历史建筑的保护范围界线。', '用于保护城市历史文化遗产。'],
      ['城市规划与公共空间', '规划指标', '城市绿线', 'Urban Green Line', '城市规划确定的各类城市绿地边界控制线。', '用于保障城市绿地系统的建设和保护。'],
      ['城市规划与公共空间', '规划指标', '城市蓝线', 'Urban Blue Line', '城市规划确定的江、河、湖、库、渠和湿地等城市地表水体保护和控制的地域界线。', '用于保护城市水系。'],
      ['城市规划与公共空间', '规划指标', '城市黄线', 'Urban Yellow Line', '城市规划确定的对城市发展全局有影响的城市基础设施用地的控制界线。', '用于保障城市基础设施的建设。'],
      ['城市规划与公共空间', '规划指标', '开发强度', 'Development Density', '（1）在地块开发控制中，将容积率和建筑密度统称为开发强度。（2）一定区域内建筑物和构筑物的总面积占该区域总面积的比例。', '（3）在主体功能区规划、国土空间规划中，指建设用地面积与区域总面积的比例。'],
      ['城市规划与公共空间', '交通与工程', '交通稳静化', 'Traffic Calming', '为减少机动车使用产生的负面影响、改善步行与非机动车使用环境而采取的一系列物理措施的组合。', '常用的交通稳静化措施主要包括凸起型交叉口、交叉口瓶颈化、行车道窄化、织纹路面、减速台等。'],
      ['城市规划与公共空间', '交通与工程', '停车视距', 'Stopping Sight Distance', '汽车行驶时，驾驶人员自看到前方障碍物时起，至达到障碍物前安全停止，所需的最短行车距离。', '保障行车安全的重要指标。'],
      ['城市规划与公共空间', '交通与工程', '视距三角形', 'Sight Triangle', '为保证交叉口处的行车安全，由两条相交道路上直行车辆的停车视距和视线所构成的三角形空间和限界。', '在此范围内不得有阻挡视线的障碍物。'],
      ['城市规划与公共空间', '交通与工程', '综合管廊', 'Utility Tunnel', '建于城市地下用于容纳两种及以上城市工程管线的构筑物及附属设施。', '便于管线的铺设、维修和管理，减少道路挖掘。'],
      ['城市规划与公共空间', '技术科学', '地理信息系统', 'GIS', '在计算机软、硬件支持下，对空间数据进行采集、编码、处理、存贮、分析、输出的人机交互信息系统。', '广泛应用于城市规划、土地管理等领域。'],
      ['城市规划与公共空间', '技术科学', '城市风廊', 'Urban Wind Corridor', '以提升城市的空气流动，缓解热岛效应和改善人体舒适度为目的，为城区引入新鲜空气而构建的通道。', '利用自然风改善城市微气候。'],
      ['城市规划与公共空间', '技术科学', '街道峡谷', 'Street Canyon', '城市中由街道及两侧一系列相对连续的建筑界面形成的、类似于峡谷的街道空间形态。', '影响街道的通风和日照环境。'],
      ['城市规划与公共空间', '社会与实施', '绅士化', 'Gentrification', '又称“中产阶级化”。（1）城市中相对贫困或衰败的地区，因中产阶级家庭的不断迁入而导致房地产价值提升。', '迫使原居民或企业、机构不断搬出和被置换的过程。（2）城市改造中，拆除或改造相对衰败的住房与设施，形成满足中产阶级生活需要的社区的过程。'],
      ['城市规划与公共空间', '社会与实施', '城中村', 'Urban Village', '在城市扩展过程中，村庄的耕地被征用为国有土地进行城市开发。', '原村庄聚落仍保持集体土地性质，并被城市建设用地包围，成为都市里的村庄。'],
      ['城市规划与公共空间', '社会与实施', '防卫空间', 'Defensible Space', '有助于降低犯罪发生率，增加使用者安全感的公共空间或半公共空间。', '通过空间设计提高环境的可监视性和领域感。'],
      ['城市规划与公共空间', '社会与实施', '邻避设施', 'NIMBY Facility', '一些对于社会运行必不可少，但又容易引发当地居民、组织或机构担心对身体健康、环境质量和资产价值等带来负面影响并进而引发社会矛盾的公共设施。', '如垃圾回收站、垃圾填埋场、核电厂、殡仪馆等。'],
      ['城市规划与公共空间', '社会与实施', '城市更新', 'Urban Regeneration', '（1）基于城市产业转型、功能提升、设施优化等原因，对城市建成区进行整治、改造与再开发的规划建设活动和制度。', '（2）特指美国在 1950 年代指 1970 年代由联邦政府资助城市政府以清除贫民窟为主要目标的大规模城市改造。'],
      ['城市规划与公共空间', '社会与实施', '棕地更新', 'Brownfield Regeneration', '对受污染的工业用地或废弃地进行污染治理、开发、改造和再次利用的城市更新活动。', '旨在恢复土地价值和改善环境。'],

      // 7. 可持续与绿色建筑 (Expanded with detailed terms from PDF)
      ['可持续与绿色建筑', '节能技术', '建筑围护结构节能优化', 'Envelope Energy Optimization', '通过优化建筑朝向、体形、窗墙比及材料构造来降低建筑能耗的技术。', '影响因素包括体形系数、传热系数、遮阳度等。墙体节能分为外保温、内保温、自保温和夹芯保温四种。屋面节能包括绿化屋面、蓄水屋面、通风屋面和冷屋面（反射涂料）。门窗节能约占围护结构能耗的70%，关键措施包括控制窗墙比、采用Low-E中空玻璃及断热窗框、设置遮阳等。'],
      ['可持续与绿色建筑', '节能技术', '墙体节能', 'Wall Energy Efficiency', '主要技术是保温隔热，根据构造形式分为外墙外保温、外墙自保温、外墙内保温和夹芯保温。', '外墙外保温（如EPS/XPS板）存在剥离隐患但热桥少；内保温热桥多；自保温（如加气混凝土砌块）常用材料是轻质混凝土，施工简便；夹芯保温在墙体中间填充材料，冷热桥现象严重。'],
      ['可持续与绿色建筑', '节能技术', '外墙外保温', 'External Insulation', '将保温材料置于墙体的外侧，主要材料是膨胀聚苯乙烯（EPS）板、挤塑聚苯乙烯（XPS）板。', '优点是保护主体结构，减少热桥；缺点是存在保温层剥离的安全隐患。'],
      ['可持续与绿色建筑', '节能技术', '外墙内保温', 'Internal Insulation', '将保温材料置于墙体的内侧，常用贴挂聚苯板或内刷保温砂浆。', '优点是施工方便，造价低；缺点是热桥现象严重，容易结露，且占用室内面积。'],
      ['可持续与绿色建筑', '节能技术', '外墙自保温', 'Self-insulation', '以具有保温效果的材料（如加气混凝土、空心砌块）作为墙体材料。', '常用材料包括轻集料混凝土、陶粒混凝土空心砌块等。在夏热冬暖地区（如岭南）应用广泛，施工容易，造价较低。'],
      ['可持续与绿色建筑', '节能技术', '夹芯保温', 'Sandwich Insulation', '在墙体中间填充保温材料构成复合墙体。', '虽然起到保温作用，但冷热桥现象严重，抗震性能较差，施工相对复杂。'],
      ['可持续与绿色建筑', '节能技术', '屋面节能', 'Roof Energy Efficiency', '通过构造与材料选择减少屋面传热，能耗占围护结构的5%～10%。', '除了常规保温（聚苯板、珍珠岩），还有绿化屋面（利用植物蒸腾）、蓄水屋面（水蒸发散热）、通风屋面（空气层隔热）和冷屋面（反射涂料）等形式。需特别注意温度骤变引起的防水问题。'],
      ['可持续与绿色建筑', '节能技术', '绿化屋面', 'Green Roof', '在屋面种植植物，利用植物的蒸腾作用和遮挡太阳辐射来降低屋面温度。', '能有效避免房间过热，改善城市微气候，缓解热岛效应。'],
      ['可持续与绿色建筑', '节能技术', '蓄水屋面', 'Water Storage Roof', '在屋面蓄积一定深度的水，利用水的蒸发带走热量，减少太阳辐射得热。', '适用于夏季隔热，但需注意防漏和防蚊虫滋生。'],
      ['可持续与绿色建筑', '节能技术', '通风屋面', 'Ventilated Roof', '在屋面设置架空通风层，利用空气对流带走热量进行保温隔热。', '适用于夏热冬暖地区，结构简单，隔热效果好。'],
      ['可持续与绿色建筑', '节能技术', '冷屋面', 'Cool Roof', '在屋面涂刷热反射涂料，提高屋面对太阳光的反射率，减少热量吸收。', '能显著降低屋面表面温度，减少空调能耗。'],
      ['可持续与绿色建筑', '节能技术', '门窗节能', 'Window Energy Efficiency', '针对能耗薄弱环节（占70%能耗）采取的加强措施。', '措施包括：控制窗墙面积比；采用断热铝合金/PVC/玻璃钢窗框；使用Low-E中空玻璃或镀膜玻璃；设置遮阳设施（特别是东、西向）。'],
      ['可持续与绿色建筑', '分析技术', '建筑物理环境模拟优化', 'Physical Simulation', '利用仿真软件对建筑的热、光、声、风环境进行模拟分析。', '内容包括：场地风环境（风速/风压云图）、室内自然通风（空气龄/换气次数）、室内自然采光（采光系数）、场地日照（日照时数/辐射量）及全年能耗模拟。常用软件：PKPM、PBECA。'],
      ['可持续与绿色建筑', '分析技术', '场地风环境模拟', 'Wind Environment Simulation', '模拟冬季、夏季及过渡季下的场地风速和风压分布。', '输出结果包括风速矢量图、风速放大系数云图等，用于评估行人舒适度和建筑防风性能。'],
      ['可持续与绿色建筑', '分析技术', '室内自然通风模拟', 'Natural Ventilation Simulation', '输出各户型的自然通风报告，包括风速云图、空气龄云图及换气次数。', '评估室内空气流通情况，优化门窗开启位置和大小。'],
      ['可持续与绿色建筑', '分析技术', '室内自然采光模拟', 'Daylighting Simulation', '分析建筑各平面的采光系数、采光品质判定及达标率。', '通过模拟优化窗户设计，减少人工照明能耗，提高视觉舒适度。'],
      ['可持续与绿色建筑', '分析技术', '场地日照模拟', 'Sunlight Simulation', '分析日照时长、阴影遮挡及辐射量，通常由方案设计团队完成。', '确保建筑满足国家日照标准，并优化太阳能利用潜力。'],
      ['可持续与绿色建筑', '分析技术', '全年能耗模拟', 'Energy Simulation', '模拟建筑全年的分项能耗值及整体能耗值。', '计算围护结构节能率、空调系统节能率，是绿色建筑评价的重要依据。'],
      ['可持续与绿色建筑', '设备系统', '高效空调机组', 'Efficient HVAC Unit', '由压缩机、热回收换热器、四通阀等组成的高效系统。', '功能包括：夏天风冷制冷，全热回收制取卫生热水；冬季利用空气源热泵原理采暖。显著降低空调能耗。'],
      ['可持续与绿色建筑', '设备系统', '高效光源', 'Efficient Light Source', '指效率高、寿命长、性能稳定的照明产品，如紧凑型荧光灯(T5/T8)、金卤灯等。', '配合高效电子镇流器、反射器及智能控制系统（声控/红外/时间控制），实现照明节能。'],
      ['可持续与绿色建筑', '水资源利用', '雨水收集系统', 'Rainwater Harvesting', '集中收集屋面和道路雨水，经过滤消毒后回用的系统。', '用途：绿化灌溉、冲洗道路、生活杂用、循环冷却。利用方式分为直接利用（收集储存）和间接利用（入渗回补地下水）。雨水水质优于污水且免费，具有生态和经济双重效益。'],
      ['可持续与绿色建筑', '水资源利用', '中水回用', 'Greywater Recycling', '将生活杂排水（沐浴、洗衣、空调冷凝水）经处理达标后重复利用。', '主要用于冲厕、绿化、洗车等非饮用用途。回收方式有小区统一回收和住户分户回收。中水水质介于上水与下水之间，是解决城市缺水的有效途径。'],
      ['可持续与绿色建筑', '水资源利用', '节水器具', 'Water-saving Appliances', '在满足使用功能前提下显著减少用水量的器具。', '例如：一次冲洗水量≤6L的节水便器（两档冲水）、陶瓷阀芯节水水嘴、红外感应洁具。同时需配合给水系统的减压限流措施，避免超压出流。'],
      ['可持续与绿色建筑', '可再生能源', '地源热泵系统', 'Ground Source Heat Pump', '利用地下岩土体、地下水或地表水作为低温热源/热汇的高效供热空调系统。', '形式：地埋管（土壤源）、地下水地源、地表水地源。它不排放废气废水，被称为“绿色空调”，适用于多种气候区。'],
      ['可持续与绿色建筑', '结构优化', '结构优化设计技术', 'Structural Optimization', '通过对地基、体系和构件的优化，在保证安全的前提下降低造价和材耗。', '钢筋混凝土工程造价每平米可节省60-170元。是绿色建筑节材的重要内容。'],
      ['可持续与绿色建筑', '结构优化', '地基基础优化', 'Foundation Optimization', '在基础设计的安全性和经济性之间寻求合理平衡点。', '通过结构计算验证基础方案，合理选用材料，避免过度设计导致的基础厚重和浪费。'],
      ['可持续与绿色建筑', '结构优化', '结构体系优化', 'Structural System Optimization', '优先采用传力明确、受力简单的结构形式。', '原则：横墙承重或纵横共同承重；剪力墙布置均匀对称、竖向连续；避免上刚下柔；优先采用钢结构等绿色建材体系。'],
      ['可持续与绿色建筑', '结构优化', '结构构件优化', 'Component Optimization', '对单体构件（梁、板、柱）进行定量分析和精细化设计。', '控制钢筋强度、混凝土性能、构件截面尺寸；减少不具备实用功能的装饰性构件；关注轴压比、层间位移角等指标的合理性。'],

      // ================= 5. 结构与构造理论 (Expanded from PDF) =================
      ['结构与构造理论', '结构基础', '建筑结构', 'Building Structure', '保持建筑物的外部形态并行成内部空间的骨架。', '建筑物中起支撑和传递荷载作用的体系。'],
      ['结构与构造理论', '结构基础', '设计基准期', 'Design Reference Period', '建筑结构设计所采用的荷载统计参数、和时间有关的材料性能取值都需要一个时间参数。', '通常为50年。'],
      ['结构与构造理论', '结构基础', '设计使用年限', 'Design Working Life', '结构在规定条件下不需要大修即可按预定目的使用的时期。', '分为临时结构(5年)、易替换结构(25年)、普通房屋(50年)、纪念性建筑(100年)。'],
      ['结构与构造理论', '结构基础', '作用', 'Action on Structure', '指结构产生作用效应的总和。', '作用效应包括内力（N、M、Q、T）和变形（挠度、转角和裂缝等）。'],
      ['结构与构造理论', '结构基础', '荷载', 'Load', '凡施加在结构上的集中力或分布力，属于直接作用。', '如恒载、活载。'],
      ['结构与构造理论', '结构基础', '间接作用', 'Indirect Action', '凡引起结构外加变形或约束变形的原因。', '如基础沉降、地震作用、温度变化、材料收缩、焊接等。'],
      ['结构与构造理论', '结构基础', '结构抗力', 'Structural Resistance', '结构或结构构件承受作用效应的能力。', '主要由材料强度和截面几何特性决定。'],
      ['结构与构造理论', '结构基础', '结构可靠性', 'Structural Reliability', '指结构在规定的时间内，规定的条件下完成预定功能的能力。', '包括安全性、适用性和耐久性。'],
      ['结构与构造理论', '结构基础', '结构可靠度', 'Structural Reliability Degree', '指结构在规定的时间内，规定的条件下完成预定功能的概率。', '是结构可靠性的概率度量。'],
      ['结构与构造理论', '结构基础', '荷载标准值', 'Characteristic Load Value', '在结构使用期间正常情况下可能出现的最大荷载值。', '包括永久荷载标准值和可变荷载标准值。'],
      ['结构与构造理论', '结构基础', '荷载代表值', 'Representative Load Value', '荷载在设计基准期内量值的代表，包括标准值、组合值、频遇值和准永久值。', '可变荷载的组合值用于承载力极限状态；频遇值和准永久值用于正常使用极限状态。'],
      ['结构与构造理论', '结构基础', '内力重分布', 'Force Redistribution', '超静定结构中，由于材料非线性或塑性铰的出现，改变了结构的刚度分布，导致内力重新分配的现象。', '允许结构充分利用材料潜力。'],
      ['结构与构造理论', '结构基础', '塑性铰', 'Plastic Hinge', '适筋截面在钢筋屈服到混凝土压碎过程中出现的具有一定转动能力的区域。', '能传递一定弯矩但刚度极小，是内力重分布的关键。'],
      ['结构与构造理论', '结构基础', '承重结构', 'Load-bearing Structure', '由各种块材和砂浆砌筑而成的结构（特指砌体结构语境）。', '直接承受荷载的结构体系。'],
      ['结构与构造理论', '混凝土与砌体', '立方体抗压强度', 'Cubic Compressive Strength', '规定以边长为150mm的立方体在标准条件下养护28d测得的具有95%保证率的抗压强度。', '用fcu表示，是混凝土强度等级划分的依据。'],
      ['结构与构造理论', '混凝土与砌体', '混凝土变形', 'Concrete Deformation', '混凝土在荷载或环境作用下产生的形状或体积变化。', '包括受力变形（短期/长期/重复荷载下）和体积变形（收缩/温度湿度变化）。'],
      ['结构与构造理论', '混凝土与砌体', '徐变', 'Creep', '结构承受的荷载或应力不变，而变形或应变随时间增长的现象。', '会导致预应力损失和变形增加。'],
      ['结构与构造理论', '混凝土与砌体', '收缩与膨胀', 'Shrinkage and Expansion', '混凝土在空气中硬化时体积变小的现象称为收缩。', '受温度和湿度影响产生的体积变化。'],
      ['结构与构造理论', '混凝土与砌体', '受弯构件', 'Flexural Member', '截面上通常有弯矩和剪力共同作用而轴力可以忽略不计的构件。', '如梁和板。'],
      ['结构与构造理论', '混凝土与砌体', '受弯破坏形式', 'Flexural Failure Modes', '荷载作用下受弯构件的破坏形态。', '正截面破坏：沿弯矩最大的截面破坏，与轴线垂直。斜截面破坏：沿剪力最大的截面破坏，与轴线斜交。'],
      ['结构与构造理论', '混凝土与砌体', '分布钢筋', 'Distribution Reinforcement', '垂直于受力钢筋方向上布置的构造钢筋。', '截面面积不应小于单位长度上受力钢筋截面面积的15%；且每米长度内不宜少于4根。'],
      ['结构与构造理论', '混凝土与砌体', '适筋破坏', 'Ductile Failure', '纵向受拉钢筋先屈服，受拉区的砼随后被压碎。', '破坏前有明显预兆，属于延性破坏，是设计期望的破坏形式。'],
      ['结构与构造理论', '混凝土与砌体', '少筋破坏', 'Brittle Failure (Min)', '受拉区砼一旦开裂，钢筋拉力迅速达到屈服强度并进入强化阶段。', '破坏突然，属于脆性破坏，设计中应避免。'],
      ['结构与构造理论', '混凝土与砌体', '超筋破坏', 'Brittle Failure (Max)', '受压区砼先压碎，纵向受拉钢筋不屈服，梁已告破坏。', '没有明显预兆，属于脆性破坏，设计中应避免。'],
      ['结构与构造理论', '混凝土与砌体', '矩形截面配筋', 'Rectangular Section Reinforcement', '单筋矩形截面：只在受拉区配有纵向受力钢筋。双筋矩形截面：在受拉区和受压区同时配有纵向受力钢筋。', '根据内力大小和截面限制选择。'],
      ['结构与构造理论', '混凝土与砌体', '轴心受拉构件', 'Axially Tensioned Member', '纵向拉力作用线与构件截面形心重合的构件。', '全截面受拉，裂缝贯通。'],
      ['结构与构造理论', '混凝土与砌体', '扭转', 'Torsion', '结构承受的四种基本受力状态之一（拉、压、弯、扭）。', '构件截面绕轴线旋转。'],
      ['结构与构造理论', '混凝土与砌体', '协调扭转', 'Compatibility Torsion', '超静定结构中由于变形的协调使截面产生的扭转。', '扭矩大小与构件刚度有关。'],
      ['结构与构造理论', '混凝土与砌体', '平衡扭转', 'Equilibrium Torsion', '结构的扭矩由荷载产生，可根据平衡条件求得。', '扭矩大小与构件的抗扭刚度无关。'],
      ['结构与构造理论', '混凝土与砌体', '受扭破坏形式', 'Torsional Failure Modes', '少筋受扭：脆性破坏，似少筋梁。适筋受扭：延性破坏，构件变形大。超筋受扭：脆性破坏，砼先压碎。', '设计应控制在适筋范围。'],
      ['结构与构造理论', '混凝土与砌体', '预应力混凝土', 'Prestressed Concrete', '根据需要人为地引入某一数值与分布的内应力，用以全部或部分抵消外荷载应力的一种加筋混凝土。', '利用高强材料，提高抗裂度和刚度。'],
      ['结构与构造理论', '混凝土与砌体', '预应力构件', 'Prestressed Member', '在混凝土构件承受外荷载之前，对其受拉区预先施加压应力的构件。', '通常使用高强钢筋和高强混凝土。'],
      ['结构与构造理论', '混凝土与砌体', '张拉方法', 'Tensioning Methods', '先张法：通过粘结力传递预应力；后张法：依靠锚具传递预应力。', '先张法适用于工厂预制，后张法适用于现场施工。'],
      ['结构与构造理论', '混凝土与砌体', '张拉控制应力', 'Control Stress', '张拉预应力钢筋时，张拉设备的测力仪表所指示的总张拉力除以预应力钢筋截面面积。', '是预应力设计的主要参数。'],
      ['结构与构造理论', '混凝土与砌体', '预应力损失', 'Prestress Loss', '张拉后拉应力逐渐下降到一定程度的现象。', '包括锚具变形、摩擦、温差、松弛、收缩徐变等损失。'],
      ['结构与构造理论', '混凝土与砌体', '砂浆', 'Mortar', '由胶凝材料和细骨料加水搅拌而成的混合材料。', '用于砌筑和抹灰。'],
      ['结构与构造理论', '混凝土与砌体', '配筋砌块砌体', 'Reinforced Block Masonry', '在砌块孔洞内设置纵向钢筋，水平缝处用箍筋连接，并在孔洞内浇注混凝土而形成的组合构件。', '可形成配筋砌块砌体剪力墙结构。'],
      ['结构与构造理论', '混凝土与砌体', '单向板', 'One-way Slab', '主要在一个方向弯曲的板。', '长宽比大于2或3时按单向板计算。'],
      ['结构与构造理论', '混凝土与砌体', '双向板', 'Two-way Slab', '在两个方向弯曲，且不能忽略任何一方向弯曲的板。', '长宽比接近1时按双向板计算。'],
      ['结构与构造理论', '混凝土与砌体', '混合结构', 'Mixed Structure', '指墙、柱、基础等竖向构件采用砌体材料，楼盖屋盖等水平构件采用钢筋混凝土材料或其他材料建造的房屋。', '多用于低层和多层民用建筑。'],
      ['结构与构造理论', '混凝土与砌体', '构造柱', 'Constructional Column', '在房屋外墙或纵横墙交接处先砌墙后浇筑混凝土、并与墙连成整体的钢筋混凝土柱。', '用于增强砌体结构的抗震性能。'],
      ['结构与构造理论', '混凝土与砌体', '圈梁', 'Ring Beam', '在墙体内沿水平方向同一标高设置的封闭的钢筋混凝土梁或钢筋砖带。', '增强房屋整体性，防止地基不均匀沉降破坏。'],
      ['结构与构造理论', '混凝土与砌体', '过梁', 'Lintel', '设置于门窗洞口或其他洞口的顶部，以承受洞口顶面以上的砌体自重及一定范围内的上层梁、板荷载。', '常见形式有砖拱过梁、钢筋砖过梁、钢筋混凝土过梁。'],
      ['结构与构造理论', '混凝土与砌体', '挑梁', 'Cantilever Beam', '一端出挑另一端嵌固于墙体内的钢筋混凝土梁。', '用于支撑阳台、雨篷等悬挑构件。'],
      ['结构与构造理论', '混凝土与砌体', '雨篷', 'Canopy', '由雨篷板和雨篷梁组成。', '设置在建筑物出入口上部的遮雨设施。'],
      ['结构与构造理论', '混凝土与砌体', '框架结构', 'Frame Structure', '由梁和柱刚性连接的骨架结构。', '优点是强度高，自重轻，整体性和抗震性好，建筑平面布置灵活，可以获得较大的使用空间。'],
      ['结构与构造理论', '钢结构', '钢结构', 'Steel Structure', '用热轧钢筋、钢板、钢管或冷加工的薄壁型钢等钢材通过焊接、螺栓连接或铆钉连接等方式建造的结构。', '具有强度高、自重轻、塑性韧性好等特点。'],
      ['结构与构造理论', '钢结构', '钢材性能指标', 'Steel Properties', '抗拉强度：衡量钢材抵抗拉断的性能指标；伸长率：衡量钢材塑性性能的指标；屈服强度：衡量结构承载能力和确定强度设计值的重要指标。', '是钢结构设计选材的依据。'],
      ['结构与构造理论', '钢结构', '整体失稳', 'Overall Instability', '指荷载尚未达到按强度计算的破坏荷载时，结构已不能继续承载并产生较大的变形，致使整体结构偏离原有位置而破坏。', '受压构件常见的破坏形式。'],
      ['结构与构造理论', '钢结构', '局部失稳', 'Local Instability', '指在保持整体稳定的条件下，结构中的局部构件或构件中的板件在尚未达到其强度时已不能继续承载而失去稳定。', '例如工字钢翼缘的波浪形屈曲。'],
      ['结构与构造理论', '钢结构', '焊接连接', 'Welded Connection', '采用电弧焊，通过电弧产生的热量使焊条和局部焊体熔化、经冷却后形成焊缝，使焊件连成一体。', '钢结构最常用的连接方式之一。'],
      ['结构与构造理论', '抗震与防灾设计', '强柱弱梁', 'Strong Column Weak Beam', '抗震设计的核心概念，指柱的抗弯能力应大于梁。', '目的是确保在强烈地震中，塑性铰首先出现在梁端而非柱端，防止建筑瞬间崩溃。'],
      ['结构与构造理论', '抗震与防灾设计', '伸缩缝', 'Expansion Joint', '为避免温度应力和砼收缩应力使房屋产生裂缝而设置的。', '在伸缩缝处，基础顶面以上的结构和建筑全部分开。'],
      ['结构与构造理论', '抗震与防灾设计', '沉降缝', 'Settlement Joint', '为避免地基不均匀沉降在房屋构件中产生裂缝而设置的。', '必要时须设置沉降缝将建筑物从屋顶到基础完全分开。'],
      ['结构与构造理论', '抗震与防灾设计', '恒载', 'Dead Load', '包括结构自重、结构表面的粉灰重、土压力等。', '荷载的标准值可按设计尺寸与材料自重标准值计算。'],
      ['结构与构造理论', '抗震与防灾设计', '地震基本概念', 'Basic Seismic Concepts', '震源：地下发生地震的部位；震中：震源在地面上的投影点；地震波：地震时震源发出的振动以弹性波的形式向各个方向传播；震级：衡量一次地震释放能量大小的尺度。', '震级每提高一级，释放能量增大32倍。'],
      ['结构与构造理论', '抗震与防灾设计', '地震烈度', 'Seismic Intensity', '地震发生时在某一地点地面及建筑物遭受地震影响的强烈程度。', '震中区的地震烈度最高，称为震中烈度。'],
      ['结构与构造理论', '抗震与防灾设计', '抗震设防', 'Seismic Fortification', '是指为达到抗震效果对建筑物进行抗震设计和所采取的抗震措施。', '包括地震作用计算和抗震构造措施。'],
      ['结构与构造理论', '抗震与防灾设计', '设防标准', 'Fortification Standard', '甲类建筑：应高于本地区抗震设防烈度；乙类建筑：地震作用符合本地区，措施提高一度；丙类建筑：均符合本地区要求；丁类建筑：措施可适当降低。', '根据建筑重要性分类。'],
      ['结构与构造理论', '抗震与防灾设计', '抗震设防目标', 'Seismic Fortification Objectives', '指对建筑结构所具有的抗震安全性的要求。', '通常概括为“三水准”设防目标。'],
      ['结构与构造理论', '抗震与防灾设计', '三水准设防', 'Three-level Fortification', '小震不坏：遭遇低于本地区设防烈度的多遇地震，一般不受损坏；中震可修：遭遇本地区设防烈度地震，可能损坏但经修理可继续使用；大震不倒：遭遇罕遇地震，不致倒塌或发生危及生命的严重破坏。', '抗震设计的核心指导思想。'],
      ['结构与构造理论', '抗震与防灾设计', '基础埋置深度', 'Foundation Embedment Depth', '基础底面至自然地面的距离。', '影响基础的稳定性和承载力。'],
      ['结构与构造理论', '抗震与防灾设计', '箱形基础', 'Box Foundation', '箱形基础由顶板、底板、外墙和内隔墙组成，是具有一定高度的整体结构。', '刚度大，整体性好，适用于高层建筑。']
 
      // Data added in previous turn. Keep this to avoid data loss.
    ];
    
    // De-duplicate and transform data
    const currentEntries = this.entries();
    const currentMap = new Map(currentEntries.map(e => [e.id, e]));
    const uniqueEntries = new Map<string, Entry>();

    // Image mapping configuration by category
    const categoryImageConfig: Record<string, { basePath: string; prefix?: string }> = {
      '中国古代建筑': { basePath: '/images/zggdjz', prefix: 'arch_' },
      '西方古代建筑': { basePath: '/images/xfgdjz', prefix: 'xf' },
      '建筑风格与设计思潮': { basePath: '/images/jzfgysjsc', prefix: 'fg' },
      '城市规划与公共空间': { basePath: '/images/csghyggkj', prefix: 'gh' },
      '可持续与绿色建筑': { basePath: '/images/kcxylsjz', prefix: 'lj' },
      '结构与构造理论': { basePath: '/images/jgygzll', prefix: 'gz' }
    };

    // Per-category counters so filenames可以按顺序依次编号
    const categoryImageCounters = new Map<string, number>();

    // 1. Process seed data (merge with existing to preserve images)
    rawData.forEach((row, index) => {
      const id = row[2] + '_' + row[0];
      const existing = currentMap.get(id);
      const category = row[0];

      let imageUrl = existing?.imageUrl;

      const cfg = categoryImageConfig[category];
      if (cfg) {
        const current = categoryImageCounters.get(category) ?? 0;
        const nextIndex = current + 1;
        categoryImageCounters.set(category, nextIndex);

        const prefix = cfg.prefix ?? '';
        const filename = prefix ? `${prefix}${nextIndex}.webp` : `${nextIndex}.webp`;

        // 中国古代建筑已整体迁移图片位置，必须强制使用新的路径；
        // 其他分类仅在原先没有自定义图片时才按规则生成路径
        if (category === '中国古代建筑' || !imageUrl) {
          imageUrl = `${cfg.basePath}/${filename}`;
        }
      }

      const entry: Entry = {
        id: id,
        category: category,
        subcategory: row[1],
        term: row[2],
        termEn: row[3],
        definition: row[4],
        details: row[5],
        imageUrl: imageUrl,
        imagePosition: row[2] === '北京宪章' ? 'top' : (existing?.imagePosition ?? 'center'),
        isCustom: existing?.isCustom ?? false
      };

      if (!uniqueEntries.has(entry.id)) {
        uniqueEntries.set(entry.id, entry);
      }
      
      // Remove processed ID from currentMap
      currentMap.delete(id);
    });

    // 2. Preserve custom entries created by user
    currentMap.forEach(entry => {
      if (entry.isCustom) {
        uniqueEntries.set(entry.id, entry);
      }
    });

    this.entries.set(Array.from(uniqueEntries.values()));
  }

}
