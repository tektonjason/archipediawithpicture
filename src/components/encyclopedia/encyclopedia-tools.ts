import type { Entry } from '../../services/data.service';

export interface HighlightSegment {
  text: string;
  matched: boolean;
}

export interface SearchDocument {
  entry: Entry;
  searchable: string;
}

export interface EntryRelations {
  architects: string[];
  periods: string[];
  regions: string[];
  styles: string[];
  buildingTypes: string[];
  materials: string[];
  systems: string[];
  concepts: string[];
}

const DYNASTIES = [
  '先秦', '秦代', '汉代', '魏晋', '南北朝', '隋代', '唐代', '五代',
  '宋代', '辽代', '金代', '元代', '明代', '清代', '民国', '近代', '现代', '当代'
];

const REGIONS = [
  '中国', '北京', '上海', '天津', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东',
  '广西', '海南', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏',
  '新疆', '内蒙古', '香港', '澳门', '台湾', '南京', '苏州', '杭州', '西安', '广州',
  '深圳', '成都', '武汉', '长沙', '英国', '法国', '德国', '意大利', '西班牙',
  '葡萄牙', '荷兰', '比利时', '奥地利', '瑞士', '芬兰', '丹麦', '瑞典', '挪威',
  '俄罗斯', '美国', '加拿大', '日本', '印度', '希腊', '埃及', '土耳其', '伊朗',
  '伊拉克', '墨西哥', '巴西', '巴黎', '伦敦', '罗马', '雅典', '纽约', '芝加哥',
  '洛杉矶', '东京', '京都', '大阪', '柏林', '维也纳', '巴塞罗那'
];

type ProfessionalRelationBucket = 'styles' | 'buildingTypes' | 'materials' | 'systems' | 'concepts';

interface ProfessionalRelationRule {
  bucket: ProfessionalRelationBucket;
  tag: string;
  terms?: string[];
  categoryIncludes?: string[];
  subcategoryIncludes?: string[];
}

interface PeriodRule {
  tag: string;
  terms: string[];
}

const PERIOD_RULES: PeriodRule[] = [
  { tag: '先秦', terms: ['先秦', '周礼', '考工记', '春秋', '战国'] },
  { tag: '汉代', terms: ['汉代', '东汉', '西汉', '汉至宋'] },
  { tag: '魏晋南北朝', terms: ['魏晋', '南北朝', '北魏', '曹魏'] },
  { tag: '隋代', terms: ['隋代', '隋匠', '隋大业'] },
  { tag: '唐代', terms: ['唐代', '唐宋', '唐时'] },
  { tag: '宋代', terms: ['宋代', '宋式', '营造法式', '李诫'] },
  { tag: '元代', terms: ['元代', '元以后'] },
  { tag: '明代', terms: ['明代', '明末', '明清'] },
  { tag: '清代', terms: ['清代', '清式', '工程做法'] },
  { tag: '近代', terms: ['近代', '民国', '20世纪20年代', '20世纪30年代'] },
  { tag: '现代', terms: ['现代主义', '20世纪', '国际建筑协会'] },
  { tag: '当代', terms: ['当代', '21世纪', '数字化', '参数化'] }
];

const PROFESSIONAL_RULES: ProfessionalRelationRule[] = [
  { bucket: 'styles', tag: '现代主义', terms: ['现代主义', '功能主义', '国际式', '现代功能主义'] },
  { bucket: 'styles', tag: '后现代主义', terms: ['后现代主义', '后现代'] },
  { bucket: 'styles', tag: '新古典主义', terms: ['新古典主义', '古典复兴'] },
  { bucket: 'styles', tag: '哥特式', terms: ['哥特式', '尖拱', '飞扶壁'] },
  { bucket: 'styles', tag: '巴洛克', terms: ['巴洛克', '动态构图'] },
  { bucket: 'styles', tag: '包豪斯', terms: ['包豪斯', 'Bauhaus'] },
  { bucket: 'styles', tag: '粗野主义', terms: ['粗野主义', '清水混凝土'] },
  { bucket: 'styles', tag: '高技派', terms: ['高技派', '高技术', '结构外露'] },
  { bucket: 'styles', tag: '解构主义', terms: ['解构主义', '解构'] },
  { bucket: 'styles', tag: '参数化', terms: ['参数化', '算法', '生成式'] },
  { bucket: 'styles', tag: '绿色建筑', categoryIncludes: ['可持续与绿色建筑'], terms: ['绿色建筑', '可持续'] },
  { bucket: 'styles', tag: '批判地域主义', terms: ['批判地域主义', '地域主义'] },

  { bucket: 'buildingTypes', tag: '桥梁', terms: ['桥梁', '拱桥', '敞肩拱', '赵州桥', '安济桥'] },
  { bucket: 'buildingTypes', tag: '宫殿', terms: ['宫殿', '殿阁', '殿堂', '宫'] },
  { bucket: 'buildingTypes', tag: '坛庙', terms: ['坛庙', '祭祀', '太庙', '孔庙'] },
  { bucket: 'buildingTypes', tag: '寺庙', terms: ['寺庙', '佛寺', '佛宫寺', '寺'] },
  { bucket: 'buildingTypes', tag: '塔', terms: ['佛塔', '塔身', '楼阁式', '窣堵波'] },
  { bucket: 'buildingTypes', tag: '陵墓', subcategoryIncludes: ['陵墓'], terms: ['陵墓', '陵寝', '墓前', '神道'] },
  { bucket: 'buildingTypes', tag: '园林', subcategoryIncludes: ['园林'], terms: ['园林', '造园', '借景', '园冶'] },
  { bucket: 'buildingTypes', tag: '民居', subcategoryIncludes: ['民居'], terms: ['民居', '四合院', '住宅', '宅门'] },
  { bucket: 'buildingTypes', tag: '公共建筑', terms: ['公共建筑', '博物馆', '体育场馆', '学校', '图书馆'] },
  { bucket: 'buildingTypes', tag: '高层建筑', terms: ['高层建筑', '超高层', '塔楼'] },
  { bucket: 'buildingTypes', tag: '城市公共空间', categoryIncludes: ['城市规划与公共空间'], terms: ['公共空间', '广场', '开放空间', '街道'] },
  { bucket: 'buildingTypes', tag: '交通建筑', terms: ['车站', '机场', 'TOD', '交通'] },

  { bucket: 'materials', tag: '木构', subcategoryIncludes: ['大木作', '结构体系'], terms: ['木构', '木结构', '木构架', '木柱', '木梁'] },
  { bucket: 'materials', tag: '砖石', terms: ['砖石', '砖砌', '石砌', '砖带'] },
  { bucket: 'materials', tag: '石材', subcategoryIncludes: ['石作'], terms: ['石作', '石制', '石材', '栏杆', '石刻'] },
  { bucket: 'materials', tag: '砌体', terms: ['砌体', '砖墙', '墙体'] },
  { bucket: 'materials', tag: '混凝土', subcategoryIncludes: ['混凝土'], terms: ['混凝土', '砼', '钢筋混凝土'] },
  { bucket: 'materials', tag: '钢结构', terms: ['钢结构', '钢筋', '钢材'] },
  { bucket: 'materials', tag: '玻璃', terms: ['玻璃', '幕墙'] },
  { bucket: 'materials', tag: '瓦作', subcategoryIncludes: ['屋顶与瓦石'], terms: ['瓦', '屋脊', '屋顶'] },
  { bucket: 'materials', tag: '彩画', subcategoryIncludes: ['彩画'], terms: ['彩画', '枋心', '藻头'] },
  { bucket: 'materials', tag: '保温材料', categoryIncludes: ['可持续与绿色建筑'], terms: ['EPS', 'XPS', '保温', '隔热'] },

  { bucket: 'systems', tag: '大木作', subcategoryIncludes: ['大木作'], terms: ['大木作', '木构件'] },
  { bucket: 'systems', tag: '斗拱', subcategoryIncludes: ['铺作'], terms: ['斗拱', '斗栱', '铺作', '平身科', '柱头铺作'] },
  { bucket: 'systems', tag: '梁架体系', terms: ['梁架', '屋架', '檩', '椽', '栿', '步架'] },
  { bucket: 'systems', tag: '抬梁式', terms: ['抬梁式', '梁上', '短梁'] },
  { bucket: 'systems', tag: '穿斗式', terms: ['穿斗式', '穿枋'] },
  { bucket: 'systems', tag: '屋顶构造', subcategoryIncludes: ['屋顶与瓦石'], terms: ['屋顶', '歇山', '庑殿', '悬山', '硬山'] },
  { bucket: 'systems', tag: '平面分槽', subcategoryIncludes: ['平面布局'], terms: ['分心槽', '金厢斗底槽', '副阶周匝', '单槽', '双槽'] },
  { bucket: 'systems', tag: '模数制', subcategoryIncludes: ['模数制', '度量'], terms: ['模数', '材分', '斗口', '开间', '进深', '标准单位'] },
  { bucket: 'systems', tag: '尺度控制', terms: ['尺度', '尺寸', '比例', '等级', '定型化'] },
  { bucket: 'systems', tag: '构件分等', terms: ['材有八等', '八等', '等级', '级差'] },
  { bucket: 'systems', tag: '悬挑结构', terms: ['悬挑', '出檐', '挑出', '挑梁'] },
  { bucket: 'systems', tag: '拱券结构', terms: ['拱桥', '拱券', '券', '穹顶'] },
  { bucket: 'systems', tag: '框架结构', terms: ['框架结构', '梁柱', '刚性连接'] },
  { bucket: 'systems', tag: '剪力墙', terms: ['剪力墙', '抗侧力'] },
  { bucket: 'systems', tag: '抗震构造', subcategoryIncludes: ['抗震'], terms: ['抗震', '强柱弱梁', '延性', '层间位移'] },
  { bucket: 'systems', tag: '节能围护', categoryIncludes: ['可持续与绿色建筑'], terms: ['围护', '外墙外保温', '内保温', '热桥'] },
  { bucket: 'systems', tag: '雨洪管理', terms: ['海绵城市', '雨水', '中水', '蓄存', '渗透'] },

  { bucket: 'concepts', tag: '传统营造', categoryIncludes: ['中国古代建筑'], terms: ['营造', '匠人', '工料', '做法'] },
  { bucket: 'concepts', tag: '营造法式', terms: ['营造法式', '法式', '李诫'] },
  { bucket: 'concepts', tag: '礼制秩序', terms: ['礼制', '等级制度', '皇权', '三朝五门', '坛庙'] },
  { bucket: 'concepts', tag: '轴线秩序', terms: ['轴线', '纵轴', '对称', '陪衬'] },
  { bucket: 'concepts', tag: '院落组织', terms: ['院落', '四合院', '内外院', '抄手游廊'] },
  { bucket: 'concepts', tag: '空间层次', terms: ['空间划分', '空间层次', '内外', '边界'] },
  { bucket: 'concepts', tag: '城市肌理', categoryIncludes: ['城市规划与公共空间'], terms: ['城市肌理', '街区', '路网', '图底关系'] },
  { bucket: 'concepts', tag: '公共性', terms: ['公共性', '公共空间', '开放空间'] },
  { bucket: 'concepts', tag: '场所精神', terms: ['场所精神', '归属感', '地方'] },
  { bucket: 'concepts', tag: '人居环境', terms: ['人居环境', '广义建筑学', '生态城市'] },
  { bucket: 'concepts', tag: '类型学', terms: ['类型学', '原型', '城市原型'] },
  { bucket: 'concepts', tag: '文脉延续', terms: ['文脉', '历史文化', '连续性', '保护'] },
  { bucket: 'concepts', tag: '可持续设计', categoryIncludes: ['可持续与绿色建筑'], terms: ['可持续', '节能', '绿色', '低碳'] },
  { bucket: 'concepts', tag: '气候适应', terms: ['气候', '通风', '日照', '热岛', '风廊'] },
  { bucket: 'concepts', tag: '光影体验', terms: ['光影', '采光', '阴影'] },
  { bucket: 'concepts', tag: '交通导向', terms: ['TOD', '公共交通', '步行距离'] },
  { bucket: 'concepts', tag: '混合功能', terms: ['混合功能', '多种功能', '复合'] },
  { bucket: 'concepts', tag: '安全韧性', terms: ['韧性', '防灾', '安全', '可恢复'] }
];

function includesAny(source: string, needles: string[] | undefined): boolean {
  return !!needles?.some(needle => source.includes(needle));
}

function uniqueLimited(values: string[], limit: number): string[] {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
}

function collectPeriodTags(text: string): string[] {
  return PERIOD_RULES
    .filter(rule => includesAny(text, rule.terms))
    .map(rule => rule.tag);
}

function collectProfessionalTags(entry: Entry, text: string, bucket: ProfessionalRelationBucket): string[] {
  return PROFESSIONAL_RULES
    .filter(rule =>
      rule.bucket === bucket &&
      (
        includesAny(text, rule.terms) ||
        includesAny(entry.category, rule.categoryIncludes) ||
        includesAny(entry.subcategory, rule.subcategoryIncludes)
      )
    )
    .map(rule => rule.tag);
}

export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

export function buildSearchIndex(entries: Entry[]): SearchDocument[] {
  return entries.map(entry => {
    const relations = inferEntryRelations(entry, entries);
    return {
      entry,
      searchable: normalizeSearchText([
      entry.term,
      entry.termEn,
      entry.category,
      entry.subcategory,
      entry.definition,
        entry.details,
        ...relations.architects,
        ...relations.periods,
        ...relations.regions,
        ...relations.styles,
        ...relations.buildingTypes,
        ...relations.materials,
        ...relations.systems,
        ...relations.concepts
      ].join(' '))
    };
  });
}

export function matchesSearch(document: SearchDocument, query: string): boolean {
  const normalized = normalizeSearchText(query);
  return !normalized || document.searchable.includes(normalized);
}

export function splitHighlight(text: string | undefined, query: string): HighlightSegment[] {
  if (!text) return [];
  const terms = query
    .trim()
    .split(/[\s,，。；;、]+/)
    .map(term => term.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (!terms.length) return [{ text, matched: false }];

  const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'giu');
  return text
    .split(pattern)
    .filter(Boolean)
    .map(part => ({
      text: part,
      matched: terms.some(term => part.localeCompare(term, undefined, { sensitivity: 'accent' }) === 0)
    }));
}

export function createSearchSnippet(entry: Entry, query: string, radius = 72): string {
  const source = entry.details || entry.definition || '';
  if (!query.trim() || !source) return entry.definition;

  const normalizedQuery = normalizeSearchText(query);
  const candidates = query
    .trim()
    .split(/[\s,，。；;、]+/)
    .filter(Boolean);

  let index = candidates
    .map(candidate => source.toLocaleLowerCase().indexOf(candidate.toLocaleLowerCase()))
    .filter(value => value >= 0)
    .sort((a, b) => a - b)[0];

  if (index === undefined && normalizeSearchText(source).includes(normalizedQuery)) {
    index = 0;
  }
  if (index === undefined) return entry.definition;

  const start = Math.max(0, index - radius);
  const end = Math.min(source.length, index + Math.max(query.length, 8) + radius);
  return `${start > 0 ? '…' : ''}${source.slice(start, end).trim()}${end < source.length ? '…' : ''}`;
}

export function inferEntryRelations(entry: Entry, entries: Entry[]): EntryRelations {
  const text = [entry.term, entry.termEn, entry.category, entry.subcategory, entry.definition, entry.details].join(' ');
  const architectCandidates = entries.filter(candidate => {
    if (candidate.id === entry.id || candidate.term.length < 2 || candidate.term.length > 18) return false;
    const marker = `${candidate.category} ${candidate.subcategory} ${candidate.definition}`;
    return /建筑师|人物|设计师/.test(marker);
  });
  const styleCandidates = entries.filter(candidate => {
    if (candidate.id === entry.id || candidate.term.length < 2 || candidate.term.length > 24) return false;
    return candidate.category.includes('建筑风格与设计思潮') ||
      candidate.subcategory.includes('风格') ||
      candidate.subcategory.includes('思潮');
  });

  const architects = architectCandidates
    .filter(candidate => text.includes(candidate.term))
    .map(candidate => candidate.term);
  const styles = styleCandidates
    .filter(candidate => text.includes(candidate.term))
    .map(candidate => candidate.term);

  const yearMatches = text.match(/(?:公元前)?(?:1[0-9]{3}|20[0-9]{2})年?|[1-9][0-9]?世纪/g) ?? [];
  const dynastyMatches = DYNASTIES.filter(period => text.includes(period));
  const periods = [...new Set([...yearMatches, ...dynastyMatches, ...collectPeriodTags(text)])];
  const regions = REGIONS.filter(region => text.includes(region));

  return {
    architects: uniqueLimited(architects, 6),
    periods: uniqueLimited(periods, 8),
    regions: uniqueLimited(regions, 8),
    styles: uniqueLimited([...styles, ...collectProfessionalTags(entry, text, 'styles')], 8),
    buildingTypes: uniqueLimited(collectProfessionalTags(entry, text, 'buildingTypes'), 8),
    materials: uniqueLimited(collectProfessionalTags(entry, text, 'materials'), 8),
    systems: uniqueLimited(collectProfessionalTags(entry, text, 'systems'), 10),
    concepts: uniqueLimited(collectProfessionalTags(entry, text, 'concepts'), 10)
  };
}

export function getRelatedEntries(current: Entry, entries: Entry[], limit = 6): Entry[] {
  const currentRelations = inferEntryRelations(current, entries);
  const currentEntitySet = new Set([
    ...currentRelations.architects,
    ...currentRelations.periods,
    ...currentRelations.regions,
    ...currentRelations.styles,
    ...currentRelations.buildingTypes,
    ...currentRelations.materials,
    ...currentRelations.systems,
    ...currentRelations.concepts
  ]);

  return entries
    .filter(entry => entry.id !== current.id)
    .map(entry => {
      const relations = inferEntryRelations(entry, entries);
      const sharedEntities = [
        ...relations.architects,
        ...relations.periods,
        ...relations.regions,
        ...relations.styles,
        ...relations.buildingTypes,
        ...relations.materials,
        ...relations.systems,
        ...relations.concepts
      ].filter(value => currentEntitySet.has(value)).length;
      const score =
        sharedEntities * 4 +
        (entry.subcategory === current.subcategory ? 3 : 0) +
        (entry.category === current.category ? 2 : 0);
      return { entry, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.term.localeCompare(b.entry.term, 'zh-CN'))
    .slice(0, limit)
    .map(item => item.entry);
}
