import fs from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'src/services/data.service.ts');
const REPORT_DIR = path.join(ROOT, 'image-audit');
const GENERATED_PLATES_REPORT = path.join(REPORT_DIR, 'encyclopedia-image-generated-plates.json');
const SOURCE_SUMMARY_REPORT = path.join(REPORT_DIR, 'encyclopedia-image-source-summary.json');
const MAX_BYTES = 100_000;
const execFileAsync = promisify(execFile);

const CATEGORY_IMAGE_CONFIG = {
  '\u4e2d\u56fd\u53e4\u4ee3\u5efa\u7b51': { basePath: '/images/zggdjz', dir: 'public/images/zggdjz', prefix: 'arch_' },
  '\u897f\u65b9\u53e4\u4ee3\u5efa\u7b51': { basePath: '/images/xfgdjz', dir: 'public/images/xfgdjz', prefix: 'xf' },
  '\u5efa\u7b51\u98ce\u683c\u4e0e\u8bbe\u8ba1\u601d\u6f6e': { basePath: '/images/jzfgysjsc', dir: 'public/images/jzfgysjsc', prefix: 'fg' },
  '\u57ce\u5e02\u89c4\u5212\u4e0e\u516c\u5171\u7a7a\u95f4': { basePath: '/images/csghyggkj', dir: 'public/images/csghyggkj', prefix: 'gh' },
  '\u53ef\u6301\u7eed\u4e0e\u7eff\u8272\u5efa\u7b51': { basePath: '/images/kcxylsjz', dir: 'public/images/kcxylsjz', prefix: 'lj' },
  '\u7ed3\u6784\u4e0e\u6784\u9020\u7406\u8bba': { basePath: '/images/jgygzll', dir: 'public/images/jgygzll', prefix: 'gz' },
};

const CATEGORY_SEARCH_TERMS = {
  '\u4e2d\u56fd\u53e4\u4ee3\u5efa\u7b51': ['Chinese architecture', 'Chinese ancient architecture'],
  '\u897f\u65b9\u53e4\u4ee3\u5efa\u7b51': ['architecture'],
  '\u5efa\u7b51\u98ce\u683c\u4e0e\u8bbe\u8ba1\u601d\u6f6e': ['architecture'],
  '\u57ce\u5e02\u89c4\u5212\u4e0e\u516c\u5171\u7a7a\u95f4': ['urban planning', 'public space'],
  '\u53ef\u6301\u7eed\u4e0e\u7eff\u8272\u5efa\u7b51': ['sustainable architecture', 'green building'],
  '\u7ed3\u6784\u4e0e\u6784\u9020\u7406\u8bba': ['building structure', 'construction detail'],
};

const CATEGORY_CONTEXT_TERMS = {
  '\u4e2d\u56fd\u53e4\u4ee3\u5efa\u7b51': [
    'architecture', 'architect', 'building', 'temple', 'pagoda', 'stupa', 'mausoleum',
    'tomb', 'roof', 'column', 'bracket', 'garden', 'palace', 'timber', 'construction',
    '\u5efa\u7b51', '\u5efa\u7b51\u5e08', '\u53e4\u5efa\u7b51', '\u5bfa', '\u5854',
    '\u9675', '\u5893', '\u56ed', '\u56ed\u6797', '\u6728\u6784', '\u5c4b\u9876',
    '\u6784\u67b6', '\u5f69\u753b',
  ],
  '\u897f\u65b9\u53e4\u4ee3\u5efa\u7b51': ['architecture', 'building', 'temple', 'basilica', 'church', 'order', 'column', 'dome', 'vault', 'arch'],
  '\u5efa\u7b51\u98ce\u683c\u4e0e\u8bbe\u8ba1\u601d\u6f6e': [
    'architecture', 'architectural', 'architect', 'building', 'design', 'style',
    'movement', 'school', 'factory', 'villa', 'house', 'museum', 'chapel',
    'urban', 'city', '\u5efa\u7b51', '\u5efa\u7b51\u5e08', '\u8bbe\u8ba1',
    '\u98ce\u683c', '\u5b66\u6d3e', '\u522b\u5885', '\u6821\u820d', '\u5de5\u5382',
  ],
  '\u57ce\u5e02\u89c4\u5212\u4e0e\u516c\u5171\u7a7a\u95f4': ['urban', 'planning', 'city', 'public space', 'landscape'],
  '\u53ef\u6301\u7eed\u4e0e\u7eff\u8272\u5efa\u7b51': [
    'sustainable', 'green building', 'energy', 'environmental', 'architecture',
    'roof', 'insulation', 'ventilation', 'daylighting', 'hvac', 'rainwater',
    'greywater', 'solar', '\u8282\u80fd', '\u4fdd\u6e29', '\u5c4b\u9762', '\u901a\u98ce',
    '\u91c7\u5149', '\u96e8\u6c34', '\u4e2d\u6c34',
  ],
  '\u7ed3\u6784\u4e0e\u6784\u9020\u7406\u8bba': [
    'structure', 'structural', 'construction', 'building', 'engineering',
    'architecture', 'concrete', 'steel', 'beam', 'column', 'frame', 'joint',
    'load', 'stress', 'slab', 'wall', 'seismic', 'reinforcement', '\u7ed3\u6784',
    '\u6784\u9020', '\u6df7\u51dd\u571f', '\u94a2', '\u6881', '\u67f1', '\u6846\u67b6',
    '\u8377\u8f7d', '\u6297\u9707', '\u94a2\u7b4b',
  ],
};

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKI_APIS = [
  'https://zh.wikipedia.org/w/api.php',
  'https://en.wikipedia.org/w/api.php',
];

const TRUSTED_SOURCE_HINTS = [
  '.edu', '.gov', '.org', 'museum', 'archive', 'archives', 'library',
  'foundation', 'institute', 'university', 'school', 'gallery',
  'unesco', 'getty', 'moma', 'metmuseum', 'britishmuseum', 'tate',
  'guggenheim', 'harvard', 'mit', 'cambridge', 'oxford',
];

const GENERAL_SOURCE_HINTS = [
  'article', 'blog', 'news', 'travel', 'tour', 'magazine', 'media',
  'book', 'books', 'excerpt', 'journal', 'photo', 'photography',
  'instagram', 'facebook', 'x.com', 'twitter', 'flickr', 'pinterest',
  'tripadvisor', 'lonelyplanet', 'archdaily', 'dezeen',
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/file:|category:/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function compactText(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function relativeFile(file) {
  return path.relative(ROOT, path.resolve(ROOT, file));
}

function fileKey(file) {
  return relativeFile(file).replaceAll('\\', '/').toLowerCase();
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function fetchJson(url, params) {
  const query = new URLSearchParams({ format: 'json', origin: '*', ...params });
  let lastError = null;

  for (let attempt = 1; attempt <= 1; attempt += 1) {
    try {
      const buffer = await powershellWebBuffer(`${url}?${query.toString()}`, 12_000);
      return JSON.parse(buffer.toString('utf8'));
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 700 * attempt));
    }
  }

  throw lastError;
}

async function powershellWebBuffer(url, timeoutMs = 30_000) {
  const timeoutSec = Math.max(5, Math.ceil(timeoutMs / 1000));
  const script = `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$headers = @{ 'User-Agent' = 'ArchipediaImageAuditor/1.0 local educational asset pipeline' }
$response = Invoke-WebRequest -UseBasicParsing -Headers $headers -TimeoutSec ${timeoutSec} -Uri $env:ARCHIPEDIA_FETCH_URL
$bytes = [System.Text.Encoding]::UTF8.GetBytes($response.Content)
[Console]::OpenStandardOutput().Write($bytes, 0, $bytes.Length)
`;
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    script,
  ], {
    encoding: 'buffer',
    env: { ...process.env, ARCHIPEDIA_FETCH_URL: url },
    maxBuffer: 24 * 1024 * 1024,
    timeout: timeoutMs + 5000,
  });
  return stdout;
}

async function curlBuffer(url, timeoutMs = 60_000) {
  const { stdout } = await execFileAsync('curl.exe', [
    '--silent',
    '--show-error',
    '--location',
    '--ssl-no-revoke',
    '--fail',
    '--connect-timeout',
    '10',
    '--max-time',
    String(Math.ceil(timeoutMs / 1000)),
    '--user-agent',
    'ArchipediaImageAuditor/1.0 (local educational asset pipeline)',
    url,
  ], {
    encoding: 'buffer',
    maxBuffer: 24 * 1024 * 1024,
    timeout: timeoutMs + 5000,
  });
  return stdout;
}

function extractRawDataBlock(source) {
  const start = source.indexOf('const rawData: string[][] = [');
  const end = source.indexOf('    // De-duplicate and transform data', start);
  if (start === -1 || end === -1) {
    throw new Error('Cannot locate encyclopedia rawData block.');
  }
  return source.slice(start, end);
}

async function readEntries() {
  const source = await fs.readFile(DATA_FILE, 'utf8');
  const block = extractRawDataBlock(source);
  const rowRegex = /^\s*\[(.*)\],\s*$/gm;
  const rows = [];
  let match;

  while ((match = rowRegex.exec(block))) {
    const row = Function(`return [${match[1]}]`)();
    if (Array.isArray(row) && row.length >= 6) {
      rows.push(row);
    }
  }

  const counters = new Map();
  return rows.map((row, index) => {
    const [category, subcategory, term, termEn, definition, details] = row;
    const config = CATEGORY_IMAGE_CONFIG[category];
    let imageUrl = '';
    let file = '';

    if (config) {
      const nextIndex = (counters.get(category) ?? 0) + 1;
      counters.set(category, nextIndex);
      const filename = `${config.prefix}${nextIndex}.webp`;
      imageUrl = `${config.basePath}/${filename}`;
      file = path.join(ROOT, config.dir, filename);
    }

    return {
      index: index + 1,
      category,
      subcategory,
      term,
      termEn,
      definition,
      details,
      imageUrl,
      file,
      exists: file ? existsSync(file) : false,
      size: file && existsSync(file) ? statSync(file).size : 0,
    };
  });
}

function getQueries(entry) {
  const categoryTerms = CATEGORY_SEARCH_TERMS[entry.category] ?? [];
  const termEn = entry.termEn && !['undefined', 'new entry'].includes(String(entry.termEn).toLowerCase()) ? entry.termEn : '';
  return unique([
    `"${entry.term}"`,
    termEn && `"${termEn}" architecture`,
    termEn && `"${termEn}"`,
    termEn && `${termEn} ${entry.subcategory}`,
    `${entry.term} ${entry.subcategory}`,
    ...categoryTerms.map(term => `${entry.term} ${term}`),
  ]);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hasStrongTermMatch(entry, candidate) {
  const title = compactText(candidate.title);
  const description = compactText(`${candidate.description || ''} ${candidate.categories || ''}`);
  const term = compactText(entry.term);
  const termEn = compactText(entry.termEn);

  if (term && (title.includes(term) || description.includes(term))) {
    return true;
  }

  return Boolean(termEn && termEn.length >= 5 && (title.includes(termEn) || description.includes(termEn)));
}

function hasChineseTermMatch(entry, candidate) {
  const title = compactText(candidate.title);
  const description = compactText(`${candidate.description || ''} ${candidate.categories || ''}`);
  const term = compactText(entry.term);
  return Boolean(term && (title.includes(term) || description.includes(term)));
}

function hasCategoryContext(entry, candidate) {
  const haystack = normalizeText(`${candidate.title || ''} ${candidate.description || ''} ${candidate.categories || ''}`);
  return (CATEGORY_CONTEXT_TERMS[entry.category] ?? []).some(term => haystack.includes(normalizeText(term)));
}

function passesContextGuard(entry, candidate) {
  if (hasChineseTermMatch(entry, candidate)) {
    return true;
  }
  return hasCategoryContext(entry, candidate);
}

function getHostname(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function classifyWebSource(candidate) {
  const host = getHostname(candidate.sourcePageUrl || candidate.url);
  const haystack = normalizeText(`${host} ${candidate.title || ''} ${candidate.description || ''}`);
  if (TRUSTED_SOURCE_HINTS.some(hint => haystack.includes(normalizeText(hint)))) {
    return 'trusted-web';
  }
  if (GENERAL_SOURCE_HINTS.some(hint => haystack.includes(normalizeText(hint)))) {
    return 'general-web';
  }
  return 'general-web';
}

async function fetchTextPage(url) {
  try {
    const buffer = await curlBuffer(url, 18_000);
    return stripHtml(buffer.toString('utf8')).slice(0, 20_000);
  } catch {
    return '';
  }
}

async function searchBingImages(entry, options = {}) {
  const results = [];
  const queries = unique([
    `${entry.term} ${entry.subcategory} 图片`,
    entry.termEn && `${entry.termEn} ${entry.subcategory} image`,
    entry.termEn && `${entry.termEn} architecture image`,
  ]).slice(0, 3);

  for (const query of queries) {
    try {
      const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&adlt=off&ensearch=1`;
      const html = decodeHtmlEntities((await curlBuffer(url, 20_000)).toString('utf8'));
      const seen = new Set();

      for (const match of html.matchAll(/m=\"(\{.*?\})\"/g)) {
        let meta;
        try {
          meta = JSON.parse(match[1].replace(/\\"/g, '"'));
        } catch {
          continue;
        }
        if (!meta?.murl || seen.has(meta.murl)) continue;
        seen.add(meta.murl);

        const candidate = {
          source: 'web-image-search',
          query,
          title: stripHtml(meta.t || meta.desc || ''),
          url: meta.murl,
          originalUrl: meta.murl,
          sourcePageUrl: meta.purl || '',
          description: stripHtml(meta.desc || ''),
          license: 'See source page',
          licenseUrl: '',
          categories: `${getHostname(meta.purl || '')} ${getHostname(meta.murl || '')}`,
        };

        const sourceClass = classifyWebSource(candidate);
        if (options.tier === 'trusted' && sourceClass !== 'trusted-web') continue;
        if (options.tier === 'general' && sourceClass !== 'general-web') continue;

        const pageText = candidate.sourcePageUrl ? await fetchTextPage(candidate.sourcePageUrl) : '';
        candidate.description = `${candidate.description} ${pageText}`.slice(0, 24_000);

        const scored = scoreCandidate(entry, candidate);
        const threshold = sourceClass === 'trusted-web' ? 110 : 130;
        if (scored.score >= threshold && hasStrongTermMatch(entry, candidate) && passesContextGuard(entry, candidate)) {
          results.push({ ...candidate, ...scored, sourceClass });
        }
      }
    } catch {
      // Search endpoint instability is expected. Keep the batch moving.
    }
  }

  return results.sort((a, b) => {
    if (a.sourceClass !== b.sourceClass) return a.sourceClass === 'trusted-web' ? -1 : 1;
    return b.score - a.score;
  });
}

function scoreCandidate(entry, candidate) {
  const title = compactText(candidate.title);
  const description = compactText(`${candidate.description || ''} ${candidate.artist || ''} ${candidate.categories || ''}`);
  const term = compactText(entry.term);
  const termEn = compactText(entry.termEn);
  const subcategory = compactText(entry.subcategory);
  const category = compactText(entry.category);

  let score = 0;
  const reasons = [];

  if (term && title.includes(term)) {
    score += 80;
    reasons.push('title contains Chinese term');
  }
  if (termEn && title.includes(termEn)) {
    score += 80;
    reasons.push('title contains English term');
  }
  if (term && description.includes(term)) {
    score += 30;
    reasons.push('metadata contains Chinese term');
  }
  if (termEn && description.includes(termEn)) {
    score += 30;
    reasons.push('metadata contains English term');
  }
  if (subcategory && (title.includes(subcategory) || description.includes(subcategory))) {
    score += 12;
    reasons.push('subcategory match');
  }
  if (category && description.includes(category)) {
    score += 8;
    reasons.push('category match');
  }

  return { score, reasons };
}

async function searchCommons(entry) {
  const results = [];
  for (const query of getQueries(entry).slice(0, 5)) {
    try {
      const data = await fetchJson(COMMONS_API, {
        action: 'query',
        generator: 'search',
        gsrnamespace: '6',
        gsrlimit: '8',
        gsrsearch: query,
        prop: 'imageinfo|categories',
        iiprop: 'url|mime|size|extmetadata',
        iiurlwidth: '1200',
        cllimit: '20',
      });

      for (const page of Object.values(data.query?.pages ?? {})) {
        const image = page.imageinfo?.[0];
        if (!image?.url || !String(image.mime || '').startsWith('image/')) continue;
        const meta = image.extmetadata ?? {};
        const candidate = {
          source: 'commons-search',
          query,
          title: page.title,
          url: image.thumburl ?? image.url,
          originalUrl: image.url,
          sourcePageUrl: image.descriptionurl ?? image.descriptionshorturl ?? '',
          mime: image.mime,
          size: image.size,
          description: stripHtml(meta.ImageDescription?.value ?? ''),
          artist: stripHtml(meta.Artist?.value ?? ''),
          license: meta.LicenseShortName?.value ?? '',
          licenseUrl: meta.LicenseUrl?.value ?? '',
          categories: (page.categories ?? []).map(c => c.title).join(' '),
        };
        const scored = scoreCandidate(entry, candidate);
        if (scored.score >= 95 && hasStrongTermMatch(entry, candidate) && passesContextGuard(entry, candidate)) {
          results.push({ ...candidate, ...scored });
        }
      }
    } catch (error) {
      results.push({
        source: 'commons-search-error',
        query,
        title: '',
        url: '',
        score: -1,
        reasons: [error.message],
        isError: true,
      });
    }
  }
  return results.filter(result => !result.isError).sort((a, b) => b.score - a.score);
}

async function searchWikipediaPageImage(entry) {
  const results = [];
  const titles = unique([entry.term, entry.termEn]);

  for (const api of WIKI_APIS) {
    for (const title of titles) {
      try {
        const data = await fetchJson(api, {
          action: 'query',
          redirects: '1',
          titles: title,
          prop: 'pageimages|description|categories',
          piprop: 'original|thumbnail|name',
          pithumbsize: '1200',
          cllimit: '20',
        });

        for (const page of Object.values(data.query?.pages ?? {})) {
          if (!page?.original?.source && !page?.thumbnail?.source) continue;
          if (page.missing !== undefined) continue;

          const candidate = {
            source: api.includes('zh.wikipedia') ? 'zh-wikipedia-pageimage' : 'en-wikipedia-pageimage',
            query: title,
            title: page.title,
            url: page.thumbnail?.source ?? page.original?.source,
            originalUrl: page.original?.source ?? '',
            sourcePageUrl: `https://${api.includes('zh.wikipedia') ? 'zh' : 'en'}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/\s+/g, '_'))}`,
            mime: '',
            size: 0,
            description: page.description ?? '',
            artist: '',
            license: 'See Wikimedia page image source',
            licenseUrl: '',
            categories: (page.categories ?? []).map(c => c.title).join(' '),
          };
          const scored = scoreCandidate(entry, candidate);
          if (compactText(page.title) === compactText(title)) {
            scored.score += 35;
            scored.reasons.push('exact Wikipedia title');
          }
          if (scored.score >= 115 && hasStrongTermMatch(entry, candidate) && passesContextGuard(entry, candidate)) {
            results.push({ ...candidate, ...scored });
          }
        }
      } catch {
        // Keep searching through the remaining APIs/titles. A transient endpoint
        // failure should not prevent a Commons or alternate-language match.
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

async function searchWikipediaPageImagesBatch(entries, options = {}) {
  const chunkSize = options.chunkSize ?? 12;
  const activeApis = options.api
    ? WIKI_APIS.filter(api => api.includes(`${options.api}.wikipedia`))
    : WIKI_APIS;
  const titleToEntries = new Map();

  for (const entry of entries) {
    for (const title of unique([entry.term, entry.termEn])) {
      const normalized = compactText(title);
      if (!normalized) continue;
      if (!titleToEntries.has(normalized)) {
        titleToEntries.set(normalized, []);
      }
      titleToEntries.get(normalized).push({ entry, requestedTitle: title });
    }
  }

  const allTitles = unique(
    Array.from(titleToEntries.values())
      .flat()
      .map(item => item.requestedTitle)
  );
  const bestByFile = new Map();

  for (const api of activeApis) {
    const batches = chunk(allTitles, chunkSize);
    for (const [batchIndex, titleBatch] of batches.entries()) {
      let data;
      try {
        data = await fetchJson(api, {
          action: 'query',
          redirects: '1',
          titles: titleBatch.join('|'),
          prop: 'pageimages|description|categories',
          piprop: 'original|thumbnail|name',
          pithumbsize: '1200',
          cllimit: '20',
        });
      } catch {
        console.error(`[fetch-pages] skipped ${api.includes('zh.wikipedia') ? 'zh' : 'en'} batch ${batchIndex + 1}/${batches.length}`);
        continue;
      }
      if ((batchIndex + 1) % 10 === 0 || batchIndex === batches.length - 1) {
        console.error(`[fetch-pages] scanned ${api.includes('zh.wikipedia') ? 'zh' : 'en'} batch ${batchIndex + 1}/${batches.length}`);
      }

      const redirectTargets = new Map();
      for (const redirect of data.query?.redirects ?? []) {
        const to = compactText(redirect.to);
        const from = compactText(redirect.from);
        if (!to || !from) continue;
        redirectTargets.set(to, [...(redirectTargets.get(to) ?? []), from]);
      }

      for (const page of Object.values(data.query?.pages ?? {})) {
        if (!page?.original?.source && !page?.thumbnail?.source) continue;
        if (page.missing !== undefined) continue;

        const pageKey = compactText(page.title);
        const associated = [
          ...(titleToEntries.get(pageKey) ?? []),
          ...((redirectTargets.get(pageKey) ?? []).flatMap(key => titleToEntries.get(key) ?? [])),
        ];

        for (const { entry, requestedTitle } of associated) {
          const candidate = {
            source: api.includes('zh.wikipedia') ? 'zh-wikipedia-batch-pageimage' : 'en-wikipedia-batch-pageimage',
            query: requestedTitle,
            title: page.title,
            url: page.thumbnail?.source ?? page.original?.source,
            originalUrl: page.original?.source ?? '',
            sourcePageUrl: `https://${api.includes('zh.wikipedia') ? 'zh' : 'en'}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/\s+/g, '_'))}`,
            mime: '',
            size: 0,
            description: page.description ?? '',
            artist: '',
            license: 'See Wikimedia page image source',
            licenseUrl: '',
            categories: (page.categories ?? []).map(c => c.title).join(' '),
          };
          const scored = scoreCandidate(entry, candidate);
          if (compactText(page.title) === compactText(requestedTitle)) {
            scored.score += 35;
            scored.reasons.push('exact Wikipedia title');
          } else {
            scored.score += 20;
            scored.reasons.push('Wikipedia redirect title');
          }
          if (scored.score < 115 || !hasStrongTermMatch(entry, candidate) || !passesContextGuard(entry, candidate)) {
            continue;
          }

          const current = bestByFile.get(entry.file);
          const next = { ...candidate, ...scored, entry };
          if (!current || next.score > current.score) {
            bestByFile.set(entry.file, next);
          }
        }
      }
    }
  }

  return bestByFile;
}

function stripHtml(value) {
  return String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function downloadBuffer(url) {
  return curlBuffer(url, 35_000);
}

async function encodeWebpUnderLimit(inputBuffer, outputFile) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });

  const base = sharp(inputBuffer, { animated: false, limitInputPixels: 48_000_000 })
    .rotate()
    .resize({
      width: 960,
      height: 640,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    });

  const attempts = [
    { width: 960, quality: 72 },
    { width: 840, quality: 68 },
    { width: 720, quality: 64 },
    { width: 640, quality: 60 },
    { width: 560, quality: 56 },
    { width: 480, quality: 52 },
    { width: 420, quality: 48 },
  ];

  let best = null;
  for (const attempt of attempts) {
    const buffer = await base
      .clone()
      .resize({ width: attempt.width, height: Math.round(attempt.width * 2 / 3), fit: 'cover', position: 'centre' })
      .webp({ quality: attempt.quality, effort: 6 })
      .toBuffer();

    best = buffer;
    if (buffer.length <= MAX_BYTES) {
      await fs.writeFile(outputFile, buffer);
      return buffer.length;
    }
  }

  await fs.writeFile(outputFile, best);
  return best.length;
}

async function compressExisting(entries) {
  const oversized = entries.filter(entry => entry.file && existsSync(entry.file) && statSync(entry.file).size > MAX_BYTES);
  const results = [];

  for (const entry of oversized) {
    const original = await fs.readFile(entry.file);
    const size = await encodeWebpUnderLimit(original, entry.file);
    results.push({
      term: entry.term,
      file: path.relative(ROOT, entry.file),
      oldSize: entry.size,
      newSize: size,
      ok: size <= MAX_BYTES,
    });
  }

  return results;
}

async function fetchMissing(entries, limit = Infinity) {
  const missing = entries.filter(entry => entry.file && !existsSync(entry.file));
  const filled = [];
  const rejected = [];

  for (const entry of missing.slice(0, limit)) {
    try {
      const candidates = [
        ...(await searchWikipediaPageImage(entry)),
        ...(await searchCommons(entry)),
      ].sort((a, b) => b.score - a.score);

      const best = candidates[0];
      if (!best) {
        rejected.push({ term: entry.term, file: path.relative(ROOT, entry.file), reason: 'no high-confidence Wikimedia/Wikipedia candidate' });
        continue;
      }

      const input = await downloadBuffer(best.url);
      const size = await encodeWebpUnderLimit(input, entry.file);
      await wait(450);
      const ok = size <= MAX_BYTES;

      filled.push({
        term: entry.term,
        termEn: entry.termEn,
        category: entry.category,
        file: path.relative(ROOT, entry.file),
        imageUrl: entry.imageUrl,
        size,
        ok,
        source: best.source,
        sourceTitle: best.title,
        sourceUrl: best.url,
        originalUrl: best.originalUrl,
        sourcePageUrl: best.sourcePageUrl,
        license: best.license,
        licenseUrl: best.licenseUrl,
        score: best.score,
        reasons: best.reasons,
      });
    } catch (error) {
      rejected.push({ term: entry.term, file: path.relative(ROOT, entry.file), reason: error.message });
    }
  }

  return { filled, rejected };
}

async function readGeneratedPlateFiles() {
  try {
    const summary = JSON.parse(await fs.readFile(SOURCE_SUMMARY_REPORT, 'utf8'));
    const currentGenerated = (summary.items ?? [])
      .filter(record => record.sourceClass === 'generated-educational-plate')
      .map(record => path.resolve(ROOT, record.file));
    if (currentGenerated.length) {
      return new Set(currentGenerated);
    }
  } catch {
    // Fall back to the original generated-plate report when the current source
    // summary has not been built yet.
  }

  try {
    const records = JSON.parse(await fs.readFile(GENERATED_PLATES_REPORT, 'utf8'));
    return new Set(records.map(record => path.resolve(ROOT, record.file)));
  } catch {
    return new Set();
  }
}

async function fetchCommonsReplacements(entries, limit = Infinity, options = {}) {
  const generatedFiles = await readGeneratedPlateFiles();
  const candidatesForReplacement = entries
    .filter(entry => entry.file && existsSync(entry.file))
    .filter(entry => !options.replaceGenerated || generatedFiles.has(path.resolve(entry.file)))
    .filter(entry => !options.category || entry.category === options.category)
    .slice(options.offset ?? 0, (options.offset ?? 0) + limit);

  const replaced = [];
  const rejected = [];

  for (const entry of candidatesForReplacement) {
    try {
      const candidates = await searchCommons(entry);
      const best = candidates[0];
      if (!best) {
        rejected.push({ term: entry.term, file: path.relative(ROOT, entry.file), reason: 'no high-confidence Commons candidate' });
        continue;
      }

      const input = await downloadBuffer(best.url);
      const size = await encodeWebpUnderLimit(input, entry.file);
      await wait(600);

      replaced.push({
        term: entry.term,
        termEn: entry.termEn,
        category: entry.category,
        file: path.relative(ROOT, entry.file),
        imageUrl: entry.imageUrl,
        size,
        ok: size <= MAX_BYTES,
        source: best.source,
        sourceTitle: best.title,
        sourceUrl: best.url,
        sourcePageUrl: best.sourcePageUrl,
        license: best.license,
        licenseUrl: best.licenseUrl,
        score: best.score,
        reasons: best.reasons,
      });
      console.error(`[fetch-commons] replaced ${path.relative(ROOT, entry.file)} ${entry.term} ${size}`);
    } catch (error) {
      rejected.push({ term: entry.term, file: path.relative(ROOT, entry.file), reason: error.message });
    }
  }

  return { replaced, rejected };
}

async function fetchWebReplacements(entries, limit = Infinity, options = {}) {
  const generatedFiles = await readGeneratedPlateFiles();
  const targets = entries
    .filter(entry => entry.file && existsSync(entry.file))
    .filter(entry => !options.replaceGenerated || generatedFiles.has(path.resolve(entry.file)))
    .filter(entry => !options.category || entry.category === options.category)
    .slice(options.offset ?? 0, (options.offset ?? 0) + limit);

  const replaced = [];
  const rejected = [];

  for (const entry of targets) {
    try {
      const candidates = await searchBingImages(entry, { tier: options.tier });
      const best = candidates[0];
      if (!best) {
        rejected.push({
          term: entry.term,
          file: path.relative(ROOT, entry.file),
          reason: options.tier === 'trusted'
            ? 'kept-generated-no-reliable-trusted-web-source'
            : 'kept-generated-no-reliable-general-web-source',
        });
        continue;
      }

      const input = await downloadBuffer(best.url);
      const size = await encodeWebpUnderLimit(input, entry.file);
      await wait(900);

      replaced.push({
        term: entry.term,
        termEn: entry.termEn,
        category: entry.category,
        file: path.relative(ROOT, entry.file),
        imageUrl: entry.imageUrl,
        size,
        ok: size <= MAX_BYTES,
        source: best.source,
        sourceClass: best.sourceClass,
        sourceTitle: best.title,
        sourceUrl: best.url,
        originalUrl: best.originalUrl,
        sourcePageUrl: best.sourcePageUrl,
        license: best.license,
        licenseUrl: best.licenseUrl,
        score: best.score,
        reasons: best.reasons,
      });
      console.error(`[fetch-web] replaced ${path.relative(ROOT, entry.file)} ${entry.term} ${size} ${best.sourceClass}`);
    } catch (error) {
      rejected.push({ term: entry.term, file: path.relative(ROOT, entry.file), reason: error.message });
    }
  }

  return { replaced, rejected };
}

async function fetchMissingPageImages(entries, limit = Infinity, options = {}) {
  const filtered = options.category
    ? entries.filter(entry => entry.category === options.category)
    : entries;
  const generatedFiles = options.replaceGenerated ? await readGeneratedPlateFiles() : new Set();
  const targets = filtered
    .filter(entry => entry.file)
    .filter(entry => options.replaceGenerated ? generatedFiles.has(path.resolve(entry.file)) : !existsSync(entry.file))
    .slice(options.offset ?? 0, (options.offset ?? 0) + limit);
  const candidates = await searchWikipediaPageImagesBatch(targets, options);
  console.error(`[fetch-pages] candidates ${candidates.size}, targets ${targets.length}`);
  const filled = [];
  const rejected = [];

  for (const entry of targets) {
    const best = candidates.get(entry.file);
    if (!best) {
      rejected.push({ term: entry.term, file: path.relative(ROOT, entry.file), reason: 'no exact high-confidence Wikipedia page image' });
      continue;
    }

    try {
      const input = await downloadBuffer(best.url);
      const size = await encodeWebpUnderLimit(input, entry.file);
      await wait(450);
      const ok = size <= MAX_BYTES;

      filled.push({
        term: entry.term,
        termEn: entry.termEn,
        category: entry.category,
        file: path.relative(ROOT, entry.file),
        imageUrl: entry.imageUrl,
        size,
        ok,
        source: best.source,
        sourceTitle: best.title,
        sourceUrl: best.url,
        originalUrl: best.originalUrl,
        sourcePageUrl: best.sourcePageUrl,
        license: best.license,
        licenseUrl: best.licenseUrl,
        score: best.score,
        reasons: best.reasons,
      });
      console.error(`[fetch-pages] wrote ${path.relative(ROOT, entry.file)} ${entry.term} ${size}`);
    } catch (error) {
      rejected.push({ term: entry.term, file: path.relative(ROOT, entry.file), reason: error.message });
    }
  }

  return { filled, rejected };
}

async function audit(entries) {
  const mapped = entries.filter(entry => entry.file);
  const missing = mapped.filter(entry => !existsSync(entry.file));
  const oversized = mapped.filter(entry => existsSync(entry.file) && statSync(entry.file).size > MAX_BYTES);
  const nonWebp = mapped.filter(entry => entry.file && !entry.file.endsWith('.webp'));
  const byCategory = {};

  for (const entry of mapped) {
    byCategory[entry.category] ??= { total: 0, missing: 0, oversized: 0 };
    byCategory[entry.category].total += 1;
    if (!existsSync(entry.file)) byCategory[entry.category].missing += 1;
    if (existsSync(entry.file) && statSync(entry.file).size > MAX_BYTES) byCategory[entry.category].oversized += 1;
  }

  return {
    totalEntries: entries.length,
    mappedEntries: mapped.length,
    existing: mapped.length - missing.length,
    missing: missing.length,
    oversized: oversized.length,
    nonWebp: nonWebp.length,
    byCategory,
    missingItems: missing.map(entry => ({
      term: entry.term,
      termEn: entry.termEn,
      category: entry.category,
      subcategory: entry.subcategory,
      file: path.relative(ROOT, entry.file),
    })),
    oversizedItems: oversized.map(entry => ({
      term: entry.term,
      category: entry.category,
      file: path.relative(ROOT, entry.file),
      size: statSync(entry.file).size,
    })),
  };
}

async function readJsonReport(filename, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(REPORT_DIR, filename), 'utf8'));
  } catch {
    return fallback;
  }
}

function classifySourceRecord(record) {
  if (record.sourceClass) return record.sourceClass;
  const source = normalizeText(record.source);
  if (source.includes('generated educational plate')) return 'generated-educational-plate';
  if (source.includes('commons')) return 'commons-search-image';
  if (source.includes('wikipedia') || source.includes('wikimedia')) return 'web-page-image';
  if (source.includes('web image search')) return record.sourceClass ?? 'web-page-image';
  return 'web-page-image';
}

function mergeSourceRecord(sourceMap, record) {
  if (!record?.file) return;
  const key = fileKey(record.file);
  sourceMap.set(key, {
    ...record,
    file: relativeFile(record.file),
    sourceClass: classifySourceRecord(record),
  });
}

async function buildSourceSummary(entries) {
  const sourceMap = new Map();
  const generatedRecords = await readJsonReport('encyclopedia-image-generated-plates.json', []);

  for (const record of generatedRecords) {
    mergeSourceRecord(sourceMap, {
      ...record,
      sourceClass: 'generated-educational-plate',
    });
  }

  const previousSummary = await readJsonReport('encyclopedia-image-source-summary.json', { items: [] });
  for (const record of previousSummary.items ?? []) {
    if (record.sourceClass !== 'generated-educational-plate') {
      mergeSourceRecord(sourceMap, record);
    }
  }

  const replacementLog = await readJsonReport('encyclopedia-image-replacement-log.json', []);
  for (const record of replacementLog) mergeSourceRecord(sourceMap, record);

  const pageReport = await readJsonReport('encyclopedia-image-fetch-pages.json', { filled: [] });
  for (const record of pageReport.filled ?? []) mergeSourceRecord(sourceMap, {
    ...record,
    sourceClass: 'web-page-image',
  });

  const commonsReport = await readJsonReport('encyclopedia-image-fetch-commons.json', { replaced: [] });
  for (const record of commonsReport.replaced ?? []) mergeSourceRecord(sourceMap, {
    ...record,
    sourceClass: 'commons-search-image',
  });

  const webReport = await readJsonReport('encyclopedia-image-fetch-web.json', { replaced: [] });
  for (const record of webReport.replaced ?? []) mergeSourceRecord(sourceMap, record);

  const manualReport = await readJsonReport('encyclopedia-image-manual-replacements.json', []);
  for (const record of manualReport) mergeSourceRecord(sourceMap, record);

  const items = entries
    .filter(entry => entry.file)
    .map(entry => {
      const key = fileKey(entry.file);
      const sourceRecord = sourceMap.get(key);
      const size = existsSync(entry.file) ? statSync(entry.file).size : 0;
      if (sourceRecord) {
        return {
          ...sourceRecord,
          term: entry.term,
          termEn: entry.termEn,
          category: entry.category,
          file: relativeFile(entry.file),
          imageUrl: entry.imageUrl,
          size,
          ok: existsSync(entry.file) && size <= MAX_BYTES,
        };
      }

      return {
        term: entry.term,
        termEn: entry.termEn,
        category: entry.category,
        file: relativeFile(entry.file),
        imageUrl: entry.imageUrl,
        sourceClass: 'pre-existing-local',
        source: 'pre-existing-local',
        sourceTitle: '',
        sourceUrl: '',
        license: 'Existing local asset',
        size,
        ok: existsSync(entry.file) && size <= MAX_BYTES,
      };
    })
    .sort((a, b) => a.file.localeCompare(b.file));

  const counts = {};
  for (const item of items) {
    counts[item.sourceClass] = (counts[item.sourceClass] ?? 0) + 1;
  }

  return {
    totalCurrentImages: items.length,
    counts,
    audit: await audit(entries),
    items,
  };
}

async function main() {
  const command = process.argv[2] ?? 'audit';
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
  const offsetArg = process.argv.find(arg => arg.startsWith('--offset='));
  const offset = offsetArg ? Number(offsetArg.split('=')[1]) : 0;
  const chunkArg = process.argv.find(arg => arg.startsWith('--chunk='));
  const chunkSize = chunkArg ? Number(chunkArg.split('=')[1]) : 12;
  const categoryArg = process.argv.find(arg => arg.startsWith('--category='));
  const category = categoryArg ? categoryArg.slice('--category='.length) : '';
  const apiArg = process.argv.find(arg => arg.startsWith('--api='));
  const api = apiArg ? apiArg.slice('--api='.length) : '';
  const replaceGenerated = process.argv.includes('--replace-generated');
  const tierArg = process.argv.find(arg => arg.startsWith('--tier='));
  const tier = tierArg ? tierArg.slice('--tier='.length) : '';

  await fs.mkdir(REPORT_DIR, { recursive: true });
  const entries = await readEntries();

  if (command === 'audit') {
    const result = await audit(entries);
    await fs.writeFile(path.join(REPORT_DIR, 'encyclopedia-image-audit.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'compress') {
    const result = await compressExisting(entries);
    await fs.writeFile(path.join(REPORT_DIR, 'encyclopedia-image-compress.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'summary') {
    const result = await buildSourceSummary(entries);
    await fs.writeFile(SOURCE_SUMMARY_REPORT, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({
      totalCurrentImages: result.totalCurrentImages,
      counts: result.counts,
      audit: {
        existing: result.audit.existing,
        missing: result.audit.missing,
        oversized: result.audit.oversized,
        nonWebp: result.audit.nonWebp,
      },
    }, null, 2));
    return;
  }

  if (command === 'fetch') {
    const result = await fetchMissing(entries, limit);
    await fs.writeFile(path.join(REPORT_DIR, 'encyclopedia-image-fetch.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({
      filled: result.filled.length,
      rejected: result.rejected.length,
      filledItems: result.filled,
      rejectedItems: result.rejected.slice(0, 50),
    }, null, 2));
    return;
  }

  if (command === 'fetch-pages') {
    const result = await fetchMissingPageImages(entries, limit, { offset, chunkSize, category, api, replaceGenerated });
    await fs.writeFile(path.join(REPORT_DIR, 'encyclopedia-image-fetch-pages.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({
      filled: result.filled.length,
      rejected: result.rejected.length,
      filledItems: result.filled,
      rejectedItems: result.rejected.slice(0, 50),
    }, null, 2));
    return;
  }

  if (command === 'fetch-commons') {
    const result = await fetchCommonsReplacements(entries, limit, { offset, category, replaceGenerated });
    await fs.writeFile(path.join(REPORT_DIR, 'encyclopedia-image-fetch-commons.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({
      replaced: result.replaced.length,
      rejected: result.rejected.length,
      replacedItems: result.replaced,
      rejectedItems: result.rejected.slice(0, 50),
    }, null, 2));
    return;
  }

  if (command === 'fetch-web') {
    const result = await fetchWebReplacements(entries, limit, { offset, category, replaceGenerated, tier });
    await fs.writeFile(path.join(REPORT_DIR, 'encyclopedia-image-fetch-web.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({
      replaced: result.replaced.length,
      rejected: result.rejected.length,
      replacedItems: result.replaced,
      rejectedItems: result.rejected.slice(0, 50),
    }, null, 2));
    return;
  }

  if (command === 'verify') {
    const result = await audit(entries);
    const failed = result.missing || result.oversized || result.nonWebp;
    console.log(JSON.stringify(result, null, 2));
    process.exit(failed ? 1 : 0);
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
