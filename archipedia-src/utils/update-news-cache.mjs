import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const defaultOutputFile = path.join(rootDir, 'public', 'news-cache.json');

const args = process.argv.slice(2);
const cliOutput = readArg('--out') || readArg('-o');
const outputFile = path.resolve(cliOutput || process.env.ARCHIPEDIA_NEWS_OUTPUT || defaultOutputFile);
const edgeTranslateUrl = 'https://edge.microsoft.com/translate/translatetext?from=en&to=zh-CHS&isEnterpriseClient=false';

const SOURCES = [
  {
    name: 'ArchDaily',
    homeUrl: 'https://www.archdaily.com',
    adapter: 'feed',
    feeds: [
      'https://www.archdaily.com/feed',
      'https://www.archdaily.com/rss',
      'https://feeds.feedburner.com/Archdaily'
    ],
    timeoutMs: 6000,
    maxItems: 4,
    fallback: {
      title: 'Architecture Projects',
      url: 'https://www.archdaily.com/search/projects',
      summary: 'Selected architecture projects, interviews, competitions, and case studies from ArchDaily.'
    }
  },
  {
    name: 'Archeyes',
    homeUrl: 'https://archeyes.com',
    adapter: 'feed',
    feeds: ['https://archeyes.com/feed/'],
    timeoutMs: 12000,
    maxItems: 8,
    fallback: {
      title: 'Architecture, Design and Theory',
      url: 'https://archeyes.com/',
      summary: 'Architecture history, design cases, theory, and architect features from Archeyes.'
    }
  },
  {
    name: 'Dezeen',
    homeUrl: 'https://www.dezeen.com',
    adapter: 'feed',
    feeds: ['https://www.dezeen.com/architecture/feed/'],
    timeoutMs: 12000,
    maxItems: 5,
    fallback: {
      title: 'Architecture news and projects',
      url: 'https://www.dezeen.com/architecture/',
      summary: 'Architecture projects, buildings, interviews, and design culture news from Dezeen.'
    }
  },
  {
    name: 'designboom',
    homeUrl: 'https://www.designboom.com',
    adapter: 'feed',
    feeds: ['https://www.designboom.com/architecture/feed/'],
    timeoutMs: 12000,
    maxItems: 5,
    fallback: {
      title: 'Architecture archive',
      url: 'https://www.designboom.com/architecture/',
      summary: 'International architecture projects, installations, interviews, and design news from designboom.'
    }
  },
  {
    name: 'Architectuul',
    homeUrl: 'https://architectuul.com',
    adapter: 'jinaPageLinks',
    pages: ['https://architectuul.com/'],
    timeoutMs: 12000,
    maxItems: 3,
    allowTitle: /architect|architecture|building|house|museum|school|city|urban|design/i,
    rejectTitle: /^(home|login|search|about|contact|privacy|terms|facebook|instagram|youtube|x)$/i,
    fallback: {
      title: 'Architects, Architecture - Building Knowledge',
      url: 'https://architectuul.com/',
      summary: 'A knowledge network organized around architects, buildings, places, and architectural movements.'
    }
  },
  {
    name: '有方',
    homeUrl: 'https://www.archiposition.com',
    adapter: 'jinaPageLinks',
    pages: ['https://www.archiposition.com/'],
    timeoutMs: 12000,
    maxItems: 3,
    allowTitle: /建筑|设计|城市|空间|展览|访谈|项目|实践|更新|评论/,
    rejectTitle: /^(首页|登录|注册|搜索|关于|联系|广告|招聘|更多)$/i,
    fallback: {
      title: '高品质建筑资讯门户',
      url: 'https://www.archiposition.com/',
      summary: '关注中国建筑现场、建筑评论、项目实践与公共文化。'
    }
  }
];

function readArg(name) {
  const exact = args.find(arg => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

function stripCdata(value = '') {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function decodeEntities(value = '') {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(value = '') {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value = '', max = 140) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

function truncateAtBoundary(value = '', max = 260) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;

  const slice = normalized.slice(0, max);
  const boundary = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('。'),
    slice.lastIndexOf('？'),
    slice.lastIndexOf('！')
  );

  if (boundary > 80) return slice.slice(0, boundary + 1).trim();
  return `${slice.slice(0, max - 1).trim()}…`;
}

function hasCjk(value = '') {
  return /[\u3400-\u9fff]/.test(value);
}

const TITLE_PATTERNS = [
  {
    pattern: /^(.+?) to neighbor (.+)$/i,
    render: ([, subject, object]) => `${translatePhrase(subject)}将毗邻${translatePhrase(object)}`
  },
  {
    pattern: /^(.+?) threads (.+?) among (.+)$/i,
    render: ([, subject, object, place]) => `${subject}将${translatePhrase(object)}嵌入${translatePhrase(place)}`
  },
  {
    pattern: /^why (.+?) are (.+?) to (.+)$/i,
    render: ([, subject, action, purpose]) => `为什么${translatePhrase(subject)}正在${translatePhrase(action)}，以${translatePhrase(purpose)}`
  },
  {
    pattern: /^is (.+?) the greatest (.+?) ever\??$/i,
    render: ([, subject, object]) => `${translatePhrase(subject)}是史上最重要的${translatePhrase(object)}吗？`
  },
  {
    pattern: /^(.+?) designs? (.+?) in (.+?)(?: as ["“](.+?)["”])?$/i,
    render: ([, studio, object, place, concept]) => `${studio}在${translatePhrase(place)}设计${translatePhrase(object)}${concept ? `，呈现“${translatePhrase(concept)}”` : ''}`
  },
  {
    pattern: /^(.+?) reveals? plans for (.+)$/i,
    render: ([, subject, object]) => `${translatePhrase(subject)}公布${translatePhrase(object)}方案`
  },
  {
    pattern: /^(.+?) unveils? (.+)$/i,
    render: ([, subject, object]) => `${translatePhrase(subject)}发布${translatePhrase(object)}`
  },
  {
    pattern: /^(.+?) completes? (.+?) in (.+)$/i,
    render: ([, subject, object, place]) => `${subject}在${translatePhrase(place)}完成${translatePhrase(object)}`
  },
  {
    pattern: /^(.+?) transforms? (.+?) into (.+)$/i,
    render: ([, subject, from, to]) => `${subject}将${translatePhrase(from)}改造为${translatePhrase(to)}`
  },
  {
    pattern: /^(.+?) converts? (.+?) into (.+)$/i,
    render: ([, subject, from, to]) => `${subject}将${translatePhrase(from)}转化为${translatePhrase(to)}`
  },
  {
    pattern: /^inside (.+)$/i,
    render: ([, object]) => `走进${translatePhrase(object)}`
  },
  {
    pattern: /^(.+?) says commenter$/i,
    render: ([, quote]) => `读者评论：“${translatePhrase(quote.replace(/^["“]|["”]$/g, ''))}”`
  }
];

const PHRASE_TRANSLATIONS = [
  ['architecture firms', '建筑事务所'],
  ['architecture firm', '建筑事务所'],
  ['outsourcing cad drafting', '外包 CAD 制图'],
  ['cad drafting', 'CAD 制图'],
  ['stay competitive', '保持竞争力'],
  ['public square', '公共广场'],
  ['performing arts center', '表演艺术中心'],
  ['performing arts venue', '表演艺术场馆'],
  ['architecture news and projects', '建筑新闻与项目'],
  ['architecture projects', '建筑项目'],
  ['architecture archive', '建筑档案'],
  ['architecture and design magazine', '建筑与设计杂志'],
  ['architecture and design', '建筑与设计'],
  ['architecture, design and theory', '建筑、设计与理论'],
  ['building knowledge', '建筑知识'],
  ['knowledge network', '知识网络'],
  ['stepped school', '阶梯式学校'],
  ['vertical village', '垂直村落'],
  ['mesh-covered', '网格包覆的'],
  ['billowing', '起伏的'],
  ['venue', '场馆'],
  ['neighbor', '毗邻'],
  ['low-impact glamping', '低干预野奢营地'],
  ['the pines of southern spain', '西班牙南部松林'],
  ['among the pines of southern spain', '西班牙南部松林之间'],
  ['among the pines', '松林之间'],
  ['the pines', '松林'],
  ['southern spain', '西班牙南部'],
  ['village at the child\'s scale', '儿童尺度的村落'],
  ['village at the child 的 scale', '儿童尺度的村落'],
  ['this looks like art to me', '这在我看来像艺术'],
  ['underused house', '闲置住宅'],
  ['child-centered', '以儿童为中心的'],
  ['century-old hanok', '百年韩屋'],
  ['urban sophistication', '都市化精致更新'],
  ['sustainable design', '可持续设计'],
  ['adaptive reuse', '适应性再利用'],
  ['safe room design', '安全屋设计'],
  ['domestic violence prevention', '家庭暴力预防'],
  ['cultural center', '文化中心'],
  ['visitor center', '访客中心'],
  ['community center', '社区中心'],
  ['art museum', '艺术博物馆'],
  ['museum', '博物馆'],
  ['school', '学校'],
  ['campus', '校园'],
  ['library', '图书馆'],
  ['landscape', '景观'],
  ['housing', '住宅'],
  ['house', '住宅'],
  ['home', '住宅'],
  ['hotel', '酒店'],
  ['restaurant', '餐厅'],
  ['office', '办公空间'],
  ['gallery', '画廊'],
  ['pavilion', '展亭'],
  ['facade', '立面'],
  ['interior', '室内空间'],
  ['urban', '城市'],
  ['city', '城市'],
  ['timber', '木构'],
  ['concrete', '混凝土'],
  ['renovation', '更新改造'],
  ['extension', '扩建'],
  ['project', '项目'],
  ['projects', '项目'],
  ['buildings', '建筑'],
  ['building', '建筑'],
  ['architects', '建筑师'],
  ['architect', '建筑师'],
  ['designs', '设计'],
  ['design', '设计'],
  ['plans', '规划'],
  ['reveals', '公布'],
  ['creates', '创造'],
  ['threads', '嵌入'],
  ['reconfigures', '重新组织'],
  ['competitive', '竞争力'],
  ['documentation', '图纸与文件'],
  ['precise', '精确的'],
  ['interviews', '访谈'],
  ['competitions', '竞赛'],
  ['case studies', '案例研究'],
  ['installations', '装置'],
  ['design culture', '设计文化'],
  ['Frank Gehry-designed', '弗兰克·盖里设计的'],
  ['gehry partners\'', '盖里事务所的'],
  ['gehry partners', '盖里事务所'],
  ['guggenheim abu dhabi', '阿布扎比古根海姆'],
  ['Gaudí', '高迪'],
  ['Antoni Gaudí', '安东尼·高迪'],
  ['Seoul', '首尔'],
  ['Miami', '迈阿密'],
  ['Nanterre', '楠泰尔'],
  ['Abu Dhabi', '阿布扎比'],
  ['Venice', '威尼斯']
];

const TOPIC_LABELS = [
  [/cad drafting|documentation|drawing/i, '制图与技术文件'],
  [/school|campus|student|education/i, '教育建筑'],
  [/museum|gallery|exhibition|arts center|performing arts/i, '文化建筑'],
  [/house|home|housing|residential|apartment/i, '居住空间'],
  [/urban|city|public square|community/i, '城市与公共空间'],
  [/sustainable|low-impact|reuse|renovation|adaptive/i, '可持续与更新'],
  [/timber|concrete|facade|structure|material/i, '材料与构造'],
  [/landscape|garden|park|glamping/i, '景观与场地'],
  [/architect|studio|firm|practice/i, '建筑师与事务所'],
  [/design culture|commenter|interview|opinion/i, '建筑观点']
];

function translatePhrase(value = '') {
  if (!value) return '';
  if (hasCjk(value)) return value.trim();

  let result = value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/gaud[ií]/gi, '高迪')
    .replace(/([A-Za-z])'s\b/g, '$1 的')
    .replace(/([A-Za-z])'(?=\s|$)/g, '$1 的')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [english, chinese] of [...PHRASE_TRANSLATIONS].sort((a, b) => b[0].length - a[0].length)) {
    result = result.replace(new RegExp(`\\b${escapeRegExp(english)}\\b`, 'gi'), chinese);
  }

  result = result
    .replace(/\bby\b/gi, '由')
    .replace(/\bin\b/gi, '位于')
    .replace(/\bfor\b/gi, '面向')
    .replace(/\bwith\b/gi, '结合')
    .replace(/\bto\b/gi, '以')
    .replace(/\bof\b/gi, '的')
    .replace(/\band\b/gi, '与')
    .replace(/\s+/g, ' ')
    .replace(/\s*([，。；：])\s*/g, '$1')
    .trim();

  return result;
}

function translateNewsTitle(value = '') {
  const title = stripHtml(value);
  if (!title || hasCjk(title)) return truncate(title, 96);

  const normalized = title.replace(/\s+/g, ' ').trim();
  for (const rule of TITLE_PATTERNS) {
    const match = normalized.match(rule.pattern);
    if (match) return truncate(cleanChineseText(rule.render(match)), 96);
  }

  return truncate(cleanChineseText(translatePhrase(normalized)), 96);
}

function translateNewsSummary(summary = '', title = '', sourceName = '') {
  const text = stripHtml(summary);
  if (text && hasCjk(text)) return truncate(text, 150);

  const titleZh = translateNewsTitle(title);
  const topics = TOPIC_LABELS
    .filter(([pattern]) => pattern.test(`${title} ${summary}`))
    .map(([, label]) => label);
  const topicText = Array.from(new Set(topics)).slice(0, 3).join('、') || '建筑项目与设计动态';

  const firstSentence = text.split(/(?<=[.!?])\s+/)[0] || '';
  const translatedSentence = firstSentence ? cleanChineseText(translatePhrase(firstSentence)) : '';
  if (translatedSentence && /[\u3400-\u9fff]/.test(translatedSentence) && countLatinWords(translatedSentence) <= 2 && translatedSentence.length <= 110) {
    return truncate(translatedSentence.endsWith('。') ? translatedSentence : `${translatedSentence}。`, 150);
  }

  return truncate(`来自 ${sourceName} 的建筑资讯，关注${topicText}：${titleZh.replace(/[。！？?]+$/g, '')}。`, 150);
}

function cleanChineseText(value = '') {
  return value
    .replace(/\s+([，。；：、“”])/g, '$1')
    .replace(/([，。；：、“”])\s+/g, '$1')
    .replace(/\s*的\s*/g, '的')
    .replace(/的起伏的/g, '设计的起伏')
    .replace(/: A 公共/g, '：公共')
    .replace(/\s{2,}/g, ' ')
    .replace(/，。/g, '。')
    .trim();
}

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countLatinWords(value = '') {
  return (value.match(/[A-Za-z]{3,}/g) ?? []).length;
}

function summarizeFeedContent(value = '', sourceName = 'professional media') {
  const cleaned = value
    .replace(/<figure\b[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<img\b[\s\S]*?\/?>/gi, ' ')
    .replace(/<p>\s*The post[\s\S]*?<\/p>/gi, ' ')
    .replace(/\bThe post\b[\s\S]*$/i, ' ');

  return truncateAtBoundary(stripHtml(cleaned) || `Latest architecture news from ${sourceName}.`, 260);
}

function extractTag(block, tagName) {
  const raw = extractTagRaw(block, tagName);
  return raw ? decodeEntities(raw) : '';
}

function extractTagRaw(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? stripCdata(match[1]) : '';
}

function extractAtomLink(block) {
  const alternate = block.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  if (alternate?.[1]) return decodeEntities(alternate[1]);

  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return href?.[1] ? decodeEntities(href[1]) : '';
}

function extractImage(block) {
  const media = block.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
  if (media?.[1]) return decodeEntities(media[1]);

  const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\//i);
  if (enclosure?.[1]) return decodeEntities(enclosure[1]);

  const img = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  return img?.[1] ? decodeEntities(img[1]) : '';
}

function slugToTitle(url) {
  try {
    const slug = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
    return slug
      .replace(/^\d+-?/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  } catch {
    return '';
  }
}

function createId(source, url) {
  return `${source.toLowerCase().replace(/\W+/g, '-')}-${Buffer.from(url).toString('base64url').slice(0, 18)}`;
}

function parseDate(value) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'accept': 'application/rss+xml, application/atom+xml, text/xml, text/html, text/plain;q=0.9, */*;q=0.8',
        'user-agent': 'ARCHIPEDIA content indexer; https://www.archipedia.top'
      }
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFirstAvailable(urls, timeoutMs = 15000) {
  let lastError;
  for (const url of urls) {
    try {
      return { url, text: await fetchText(url, timeoutMs) };
    } catch (error) {
      lastError = error;
      console.log(`[news:update] ${url} failed: ${error.message}`);
    }
  }
  throw lastError ?? new Error('No source URLs configured');
}

function normalizeItem(item, source) {
  if (!item?.url || !/^https?:\/\//i.test(item.url)) return null;
  const title = truncate(stripHtml(item.title) || slugToTitle(item.url), 96);
  if (!title) return null;
  const summary = truncateAtBoundary(item.summary || source.fallback.summary, 260);

  return {
    id: createId(source.name, item.url),
    title,
    titleZh: translateNewsTitle(title),
    source: source.name,
    url: item.url,
    sourceHomeUrl: source.homeUrl,
    summary,
    summaryZh: translateNewsSummary(summary, title, source.name),
    imageUrl: item.imageUrl || '',
    publishedAt: parseDate(item.publishedAt)
  };
}

function parseRss(xml, source) {
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return itemBlocks
    .map(block => normalizeItem({
      url: extractTag(block, 'link') || extractTag(block, 'guid'),
      title: extractTag(block, 'title'),
      summary: summarizeFeedContent(extractTagRaw(block, 'description') || extractTagRaw(block, 'content:encoded'), source.name),
      imageUrl: extractImage(block),
      publishedAt: extractTag(block, 'pubDate') || extractTag(block, 'dc:date')
    }, source))
    .filter(Boolean);
}

function parseAtom(xml, source) {
  const entryBlocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return entryBlocks
    .map(block => normalizeItem({
      url: extractAtomLink(block) || extractTag(block, 'id'),
      title: extractTag(block, 'title'),
      summary: summarizeFeedContent(extractTagRaw(block, 'summary') || extractTagRaw(block, 'content'), source.name),
      imageUrl: extractImage(block),
      publishedAt: extractTag(block, 'published') || extractTag(block, 'updated')
    }, source))
    .filter(Boolean);
}

async function collectFeedSource(source) {
  const { text } = await fetchFirstAvailable(source.feeds, source.timeoutMs);
  const items = [...parseRss(text, source), ...parseAtom(text, source)];
  return uniqueByUrl(items).slice(0, source.maxItems);
}

function jinaUrl(url) {
  return `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
}

async function collectJinaPageLinks(source) {
  const batches = await Promise.allSettled(source.pages.map(async page => {
    const markdown = await fetchText(jinaUrl(page), source.timeoutMs ?? 12000);
    return parseMarkdownLinks(markdown, source);
  }));

  return uniqueByUrl(batches.flatMap(result => result.status === 'fulfilled' ? result.value : []))
    .slice(0, source.maxItems);
}

function parseMarkdownLinks(markdown, source) {
  const links = [];
  const linkPattern = /\[([^\]]{3,140})\]\((https?:\/\/[^)\s]+)\)/g;
  const blockedUrl = /\.(svg|png|jpg|jpeg|gif|webp|pdf|zip)(\?|$)/i;

  let match;
  while ((match = linkPattern.exec(markdown))) {
    const title = stripHtml(match[1]);
    const url = match[2];
    if (!title || blockedUrl.test(url)) continue;
    if (source.rejectTitle?.test(title)) continue;
    if (source.allowTitle && !source.allowTitle.test(title)) continue;

    try {
      const parsed = new URL(url);
      const home = new URL(source.homeUrl);
      if (!parsed.hostname.endsWith(home.hostname.replace(/^www\./, ''))) continue;
    } catch {
      continue;
    }

    links.push(normalizeItem({
      title,
      url,
      summary: `来自 ${source.name} 的建筑资讯与知识条目。`,
      publishedAt: new Date().toISOString()
    }, source));
  }

  return links.filter(Boolean);
}

function fallbackItem(source) {
  return normalizeItem({
    title: source.fallback.title,
    url: source.fallback.url,
    summary: source.fallback.summary,
    publishedAt: '2000-01-01T00:00:00.000Z'
  }, source);
}

async function collectSource(source) {
  try {
    const items = source.adapter === 'feed'
      ? await collectFeedSource(source)
      : await collectJinaPageLinks(source);

    if (items.length) return items;
  } catch (error) {
    console.log(`[news:update] ${source.name} failed: ${error.message}`);
  }

  const fallback = fallbackItem(source);
  return fallback ? [fallback] : [];
}

function uniqueByUrl(items) {
  return Array.from(new Map(items.filter(Boolean).map(item => [item.url, item])).values());
}

async function readExistingCache() {
  try {
    const raw = await readFile(outputFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

async function collectNews() {
  const batches = await Promise.allSettled(SOURCES.map(collectSource));
  const items = batches.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const unique = uniqueByUrl(items);
  unique.sort((a, b) => Date.parse(b.publishedAt || '') - Date.parse(a.publishedAt || ''));
  return translateNewsItems(unique.slice(0, 16));
}

async function translateNewsItems(items) {
  const output = items.map(item => ({ ...item }));
  const requests = [];

  for (let index = 0; index < output.length; index++) {
    const item = output[index];
    if (item.title && !hasCjk(item.title)) {
      requests.push({ index, field: 'titleZh', text: item.title });
    }
    if (item.summary && !hasCjk(item.summary)) {
      requests.push({ index, field: 'summaryZh', text: item.summary });
    }
  }

  if (!requests.length) {
    return output;
  }

  try {
    const translatedTexts = await translateWithEdge(requests.map(request => request.text));
    requests.forEach((request, requestIndex) => {
      const translated = cleanMachineTranslation(translatedTexts[requestIndex], request.text);
      if (translated) {
        output[request.index][request.field] = request.field === 'titleZh'
          ? truncate(translated, 96)
          : truncate(translated, 150);
      }
    });
  } catch (error) {
    console.log(`[news:update] Edge translate failed, using local fallback: ${error.message}`);
  }

  return output.map(item => ({
    ...item,
    titleZh: item.titleZh || translateNewsTitle(item.title),
    summaryZh: item.summaryZh || translateNewsSummary(item.summary, item.title, item.source)
  }));
}

async function translateWithEdge(texts) {
  const payload = texts.map(text => text.replace(/\s+/g, ' ').trim());
  const data = await fetchJson(edgeTranslateUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 (compatible; ARCHIPEDIA content indexer; https://www.archipedia.top)'
    },
    body: JSON.stringify(payload)
  }, 12000);

  if (!Array.isArray(data) || data.length !== texts.length) {
    throw new Error('Unexpected Edge translate response');
  }

  return data.map(item => item?.translations?.[0]?.text || '');
}

function cleanMachineTranslation(value = '', original = '') {
  const cleaned = stripHtml(value)
    .replace(/\s+/g, ' ')
    .replace(/\.{3,}/g, '…')
    .replace(/\s*([，。；：、！？])\s*/g, '$1')
    .trim();

  if (!cleaned || cleaned === original || !hasCjk(cleaned)) return '';
  return cleaned;
}

const existing = await readExistingCache();
let items = await collectNews();

if (!items.length && existing.length) {
  items = existing;
}

const payload = {
  updatedAt: new Date().toISOString(),
  sources: SOURCES.map(({ name, homeUrl, adapter }) => ({ name, homeUrl, adapter })),
  items
};

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`[news:update] Wrote ${items.length} items to ${path.relative(rootDir, outputFile)}`);
