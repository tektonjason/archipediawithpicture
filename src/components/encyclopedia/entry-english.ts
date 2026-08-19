import type { Entry } from '../../services/data.service';

const GENERIC_PLACEHOLDERS = new Set([
  'Architecture Entry',
  'Architecture Reference',
  'Reference item',
  'Reference image',
  'Resource item',
  'Standards reference'
]);

const RELATION_TRANSLATIONS: Record<string, string> = {
  '中国古代建筑': 'Ancient Chinese Architecture',
  '西方古代建筑': 'Ancient Western Architecture',
  '建筑风格与设计思潮': 'Architectural Styles & Design Movements',
  '城市规划与公共空间': 'Urban Planning & Public Space',
  '可持续与绿色建筑': 'Sustainable & Green Architecture',
  '结构与构造理论': 'Structure & Construction Theory',
  '中国当代建筑实践': 'Contemporary Chinese Practice',
  '建筑师': 'Architects',
  '年代': 'Periods',
  '地区': 'Regions',
  '风格': 'Styles',
  '类型': 'Types',
  '材料': 'Materials',
  '构造': 'Systems',
  '理论': 'Theory',
  '著名实例': 'Notable Examples',
  '大木作·构件': 'Major Timber Components',
  '大木作·铺作': 'Dougong & Bracket Sets',
  '石作': 'Stonework',
  '现代理论': 'Modern Theory',
  '大木作·度量': 'Timberwork Proportions',
  '结构体系': 'Structural Systems',
  '大木作·构造': 'Timber Construction',
  '屋顶与瓦石': 'Roofs, Tiles & Stonework',
  '装修与空间': 'Interior Fittings & Space',
  '城市与规划': 'Cities & Planning',
  '平面布局': 'Plan Organization',
  '营造技艺': 'Construction Craft',
  '工官': 'Building Officials',
  '文献': 'Texts & Treatises',
  '机构': 'Institutions',
  '历史': 'History',
  '近代建筑': 'Modern Architecture',
  '理念': 'Concepts',
  '制度': 'Institutional Systems',
  '建筑等级': 'Architectural Rank',
  '人名': 'People',
  '风水': 'Feng Shui',
  '城池': 'City Walls & Fortifications',
  '塔刹': 'Pagoda Finials',
  '小木作·构件': 'Minor Timber Components',
  '子分类': 'Subcategory',
  '古罗马': 'Ancient Rome',
  '拜占庭': 'Byzantine',
  '古典主义': 'Classicism',
  '结构构件': 'Structural Components',
  '中世纪': 'Medieval Architecture',
  '复古思潮': 'Revival Movements',
  '古埃及': 'Ancient Egypt',
  '装饰风格': 'Ornamental Styles',
  '柱式': 'Orders',
  '平面形式': 'Plan Types',
  '古希腊': 'Ancient Greece',
  '古波斯': 'Ancient Persia',
  '古西亚': 'Ancient Near East',
  '文艺复兴': 'Renaissance',
  '立面构图': 'Facade Composition',
  '日本古建': 'Historic Japanese Architecture',
  '印度古建': 'Historic Indian Architecture',
  '屋顶形式': 'Roof Forms',
  '伊斯兰': 'Islamic Architecture',
  '广场': 'Squares & Plazas',
  '装饰技艺': 'Ornamental Craft',
  '古典与历史风格': 'Classical & Historic Styles',
  '近现代风格': 'Modern & Contemporary Styles',
  '著名建筑师与理论': 'Architects & Theory',
  '流派': 'Schools & Movements',
  '工艺美术': 'Arts & Crafts',
  '结构主义': 'Structuralism',
  '19世纪': '19th Century',
  '后现代': 'Postmodernism',
  '行为': 'Behavioral Approaches',
  '前卫': 'Avant-garde',
  '规划': 'Planning',
  '可持续': 'Sustainability',
  '展览': 'Exhibitions',
  '基本概念': 'Core Concepts',
  '规划体系': 'Planning Systems',
  '理论与方法': 'Theory & Methods',
  '城市设计': 'Urban Design',
  '规划指标': 'Planning Metrics',
  '交通与工程': 'Transport & Engineering',
  '技术科学': 'Technical Science',
  '社会与实施': 'Society & Implementation',
  '节能技术': 'Energy-saving Technologies',
  '分析技术': 'Analysis Techniques',
  '设备系统': 'Building Systems',
  '水资源利用': 'Water Use',
  '可再生能源': 'Renewable Energy',
  '结构优化': 'Structural Optimization',
  '结构基础': 'Structural Fundamentals',
  '混凝土与砌体': 'Concrete & Masonry',
  '抗震与防灾设计': 'Seismic & Disaster-resilient Design',
  '现代建筑师/事务所': 'Modern Architects & Studios',
  '代表项目': 'Representative Projects',
  '方法论': 'Methodology',
  '先秦': 'Pre-Qin',
  '秦代': 'Qin Dynasty',
  '汉代': 'Han Dynasty',
  '魏晋南北朝': 'Wei-Jin and Northern-Southern Dynasties',
  '隋代': 'Sui Dynasty',
  '唐代': 'Tang Dynasty',
  '宋代': 'Song Dynasty',
  '元代': 'Yuan Dynasty',
  '明代': 'Ming Dynasty',
  '清代': 'Qing Dynasty',
  '民国': 'Republican China',
  '近代': 'Modern Period',
  '现代': 'Modern',
  '当代': 'Contemporary',
  '现代主义': 'Modernism',
  '后现代主义': 'Postmodernism',
  '新古典主义': 'Neoclassicism',
  '哥特式': 'Gothic',
  '巴洛克': 'Baroque',
  '包豪斯': 'Bauhaus',
  '粗野主义': 'Brutalism',
  '高技派': 'High-tech Architecture',
  '解构主义': 'Deconstructivism',
  '参数化': 'Parametric Design',
  '绿色建筑': 'Green Architecture',
  '批判地域主义': 'Critical Regionalism',
  '桥梁': 'Bridge',
  '宫殿': 'Palace',
  '坛庙': 'Ritual Architecture',
  '寺庙': 'Temple',
  '塔': 'Pagoda',
  '陵墓': 'Tomb Architecture',
  '园林': 'Garden',
  '民居': 'Vernacular Dwelling',
  '公共建筑': 'Public Building',
  '高层建筑': 'High-rise Building',
  '城市公共空间': 'Urban Public Space',
  '交通建筑': 'Transport Architecture',
  '木构': 'Timber Structure',
  '砖石': 'Brick and Stone',
  '石材': 'Stone',
  '砌体': 'Masonry',
  '混凝土': 'Concrete',
  '钢结构': 'Steel Structure',
  '玻璃': 'Glass',
  '瓦作': 'Tile Work',
  '彩画': 'Architectural Polychromy',
  '保温材料': 'Insulation Material',
  '大木作': 'Major Timber Carpentry',
  '斗拱': 'Dougong Bracket Set',
  '梁架体系': 'Beam-frame System',
  '抬梁式': 'Post-and-beam System',
  '穿斗式': 'Column-and-tie System',
  '屋顶构造': 'Roof Construction',
  '平面分槽': 'Bay and Plan Division',
  '模数制': 'Modular System',
  '尺度控制': 'Scale Control',
  '构件分等': 'Component Grading',
  '悬挑结构': 'Cantilever Structure',
  '拱券结构': 'Arch and Vault Structure',
  '框架结构': 'Frame Structure',
  '剪力墙': 'Shear Wall',
  '抗震构造': 'Seismic Detailing',
  '节能围护': 'Energy-efficient Envelope',
  '雨洪管理': 'Stormwater Management',
  '传统营造': 'Traditional Building Craft',
  '营造法式': 'Yingzao Fashi',
  '礼制秩序': 'Ritual Order',
  '轴线秩序': 'Axial Order',
  '院落组织': 'Courtyard Organization',
  '空间层次': 'Spatial Hierarchy',
  '城市肌理': 'Urban Fabric',
  '公共性': 'Publicness',
  '场所精神': 'Genius Loci',
  '人居环境': 'Human Settlements',
  '类型学': 'Typology',
  '文脉延续': 'Contextual Continuity',
  '可持续设计': 'Sustainable Design',
  '气候适应': 'Climate Adaptation',
  '光影体验': 'Light and Shadow Experience',
  '交通导向': 'Transit Orientation',
  '混合功能': 'Mixed Use',
  '安全韧性': 'Safety and Resilience'
};

export function isGenericEnglishPlaceholder(value: string | null | undefined): boolean {
  const text = (value ?? '').trim();
  return GENERIC_PLACEHOLDERS.has(text);
}

export function displayableEnglish(value: string | null | undefined): boolean {
  const text = (value ?? '').trim();
  return !!text && !/[\u3400-\u9fff]/u.test(text) && !isGenericEnglishPlaceholder(text);
}

export function tryTranslateRelationValue(
  value: string,
  translateText: (value: string) => string
): string | null {
  const exact = RELATION_TRANSLATIONS[value];
  if (exact) return exact;

  const translated = translateText(value);
  if (displayableEnglish(translated)) return translated;

  const normalized = value
    .normalize('NFKC')
    .replace(/[《》“”‘’]/g, '')
    .replace(/[，。；：、]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized || /[\u3400-\u9fff]/u.test(normalized)) {
    return null;
  }

  return normalized;
}

export function translateRelationValue(
  value: string,
  translateText: (value: string) => string,
  titleCaseFallback = true
): string {
  const translated = tryTranslateRelationValue(value, translateText);
  if (translated) return translated;

  return titleCaseFallback ? 'Architecture' : 'architecture';
}

export function entryBadgeFallback(entry: Entry, category: string, subcategory = ''): string {
  const field = `${category} ${subcategory}`.toLowerCase();
  const source = `${entry.category} ${entry.subcategory}`;

  if (field.includes('urban planning') || field.includes('urban design')) return 'Urban Design';
  if (field.includes('ancient chinese') || source.includes('中国古代建筑')) return 'Chinese Heritage';
  if (field.includes('ancient western') || source.includes('西方古代建筑')) return 'Western History';
  if (field.includes('structure') || field.includes('construction')) return 'Structure';
  if (field.includes('sustainable') || field.includes('green')) return 'Green Design';
  if (field.includes('style') || field.includes('movement')) return 'Design Movement';
  if (field.includes('contemporary chinese') || source.includes('中国当代建筑实践')) return 'Chinese Practice';

  return 'Architecture';
}

export function entryCategoryPhrase(category: string, subcategory: string): string {
  const cat = category.toLowerCase();
  const sub = subcategory.toLowerCase();
  const combined = `${cat} ${sub}`;

  if (combined.includes('urban planning') || combined.includes('public space')) {
    return 'urban planning and public-space studies';
  }
  if (combined.includes('ancient chinese')) return 'Chinese architectural history';
  if (combined.includes('ancient western')) return 'Western architectural history';
  if (combined.includes('structure') || combined.includes('construction')) return 'structural systems and construction theory';
  if (combined.includes('sustainable') || combined.includes('green')) return 'sustainable and green-building design';
  if (combined.includes('style') || combined.includes('movement')) return 'architectural styles and design movements';
  if (combined.includes('digital') || combined.includes('bim')) return 'digital design, BIM, and intelligent architecture';
  if (combined.includes('drawing') || combined.includes('representation')) return 'architectural drawing and representation';
  if (combined.includes('interior') || combined.includes('landscape')) return 'interior, landscape, and spatial design';
  if (combined.includes('regulation') || combined.includes('standard') || combined.includes('project management')) {
    return 'building regulations, standards, and project practice';
  }
  if (combined.includes('material') || combined.includes('construction craft')) {
    return 'architectural materials and construction craft';
  }
  if (combined.includes('history') || combined.includes('theory') || combined.includes('criticism')) {
    return 'architectural history, theory, and criticism';
  }

  return category || subcategory || 'architectural knowledge';
}

export function entryDefinitionFallback(entry: Entry, category: string, subcategory: string): string {
  const title = entry.termEn?.trim() || entry.term;
  const field = entryCategoryPhrase(category, subcategory);
  const sub = subcategory ? `, especially within ${subcategory.toLowerCase()}` : '';
  return `${title} is a key term in ${field}${sub}, used to describe architectural form, spatial organization, historical context, or design strategy.`;
}

export function entrySnippetFallback(entry: Entry, category: string, subcategory: string): string {
  const title = entry.termEn?.trim() || entry.term;
  const field = entryCategoryPhrase(category, subcategory);
  return `${title} belongs to ${field}; use it to connect concepts, precedents, spatial vocabulary, and design analysis.`;
}

export function entryDetailsFallback(entry: Entry, category: string, subcategory: string): string {
  const title = entry.termEn?.trim() || entry.term;
  const field = entryCategoryPhrase(category, subcategory);
  const sub = subcategory ? ` The entry sits under ${subcategory}, so it should be read through that more specific lens.` : '';

  return [
    `${title} is introduced as part of ${field}.${sub}`,
    `In design study, the term helps organize how a project is read: its formal logic, spatial role, historical background, construction idea, or urban relationship.`,
    'Use it as a concise reference when comparing cases, building a concept diagram, writing an analysis paragraph, or linking related architectural vocabulary.'
  ].join('\n\n');
}
