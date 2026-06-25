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

export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

export function buildSearchIndex(entries: Entry[]): SearchDocument[] {
  return entries.map(entry => ({
    entry,
    searchable: normalizeSearchText([
      entry.term,
      entry.termEn,
      entry.category,
      entry.subcategory,
      entry.definition,
      entry.details
    ].join(' '))
  }));
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
  const periods = [...new Set([...yearMatches, ...dynastyMatches])];
  const regions = REGIONS.filter(region => text.includes(region));

  return {
    architects: [...new Set(architects)].slice(0, 6),
    periods: periods.slice(0, 8),
    regions: [...new Set(regions)].slice(0, 8),
    styles: [...new Set(styles)].slice(0, 6)
  };
}

export function getRelatedEntries(current: Entry, entries: Entry[], limit = 6): Entry[] {
  const currentRelations = inferEntryRelations(current, entries);
  const currentEntitySet = new Set([
    ...currentRelations.architects,
    ...currentRelations.periods,
    ...currentRelations.regions,
    ...currentRelations.styles
  ]);

  return entries
    .filter(entry => entry.id !== current.id)
    .map(entry => {
      const relations = inferEntryRelations(entry, entries);
      const sharedEntities = [
        ...relations.architects,
        ...relations.periods,
        ...relations.regions,
        ...relations.styles
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
