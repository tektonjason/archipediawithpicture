import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'image-audit');
const SUMMARY_FILE = path.join(REPORT_DIR, 'encyclopedia-image-source-summary.json');
const MANUAL_FILE = path.join(REPORT_DIR, 'encyclopedia-image-manual-replacements.json');
const BATCH_FILE = path.join(REPORT_DIR, `encyclopedia-image-bing-generated-replacements-${Date.now()}.json`);
const MAX_BYTES = 100_000;

const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 50;
const offsetArg = process.argv.find(arg => arg.startsWith('--offset='));
const offset = offsetArg ? Number(offsetArg.split('=')[1]) : 0;
const categoryArg = process.argv.find(arg => arg.startsWith('--category='));
const categoryFilter = categoryArg ? categoryArg.slice('--category='.length) : '';

function normalizeText(value) {
  let text = String(value || '');
  try {
    text = decodeURIComponent(text);
  } catch {
    // Keep the original text when a URL component is not valid percent-encoding.
  }
  return text
    .toLowerCase()
    .replace(/&[^;\s]+;/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function buildQueries(entry) {
  const term = entry.term;
  const termEn = entry.termEn;
  const category = entry.category;
  const isChineseAncient = entry.file.includes('zggdjz');
  const isStructure = entry.file.includes('jgygzll');
  const isUrban = entry.file.includes('csghyggkj');
  const isGreen = entry.file.includes('kcxylsjz');
  const isStyle = entry.file.includes('jzfgysjsc');

  return unique([
    `${term} 图片`,
    `${term} 示意图`,
    isChineseAncient && `${term} 中国古建筑 图片`,
    isChineseAncient && `${term} 古建筑 构件`,
    isStructure && `${term} 结构 示意图`,
    isStructure && termEn && `${termEn} structural diagram`,
    isUrban && `${term} 城市规划 图示`,
    isUrban && termEn && `${termEn} urban planning diagram`,
    isGreen && `${term} 绿色建筑 示意图`,
    isGreen && termEn && `${termEn} green building diagram`,
    isStyle && termEn && `${termEn} architecture example`,
    termEn && `${termEn} architecture image`,
    termEn && `${termEn} diagram`,
    `${term} ${category}`,
  ]).slice(0, 5);
}

async function curlBuffer(url, timeoutMs = 35_000) {
  const { stdout } = await execFileAsync('curl.exe', [
    '--silent',
    '--show-error',
    '--location',
    '--ssl-no-revoke',
    '--fail',
    '--retry',
    '1',
    '--connect-timeout',
    '10',
    '--max-time',
    String(Math.ceil(timeoutMs / 1000)),
    '--user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36',
    url,
  ], {
    encoding: 'buffer',
    maxBuffer: 36 * 1024 * 1024,
    timeout: timeoutMs + 5000,
  });
  return stdout;
}

async function searchBingImages(entry) {
  const candidates = [];
  const seen = new Set();

  for (const query of buildQueries(entry)) {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&adlt=off&ensearch=1`;
    try {
      const html = decodeHtmlEntities((await curlBuffer(url, 25_000)).toString('utf8'));
      for (const match of html.matchAll(/m="(\{.*?\})"/g)) {
        let meta;
        try {
          meta = JSON.parse(match[1]);
        } catch {
          continue;
        }

        const imageUrl = meta.murl || '';
        if (!imageUrl || seen.has(imageUrl)) continue;
        seen.add(imageUrl);

        const title = String(meta.t || meta.pt || '');
        const desc = String(meta.desc || '');
        const sourcePageUrl = meta.purl || '';
        const host = getHost(sourcePageUrl || imageUrl);
        const sourceUrlText = imageUrl;
        const strongMatch = hasStrongMatch(entry, {
          title,
          description: desc,
          sourcePageUrl,
          sourceUrl: sourceUrlText,
        });
        if (!strongMatch) continue;

        candidates.push({
          query,
          title,
          description: desc,
          sourcePageUrl,
          sourceUrl: imageUrl,
          originalUrl: imageUrl,
          host,
          score: scoreCandidate(entry, { title, description: desc, sourcePageUrl, host, query }),
        });
      }
    } catch {
      // Keep moving. Some result pages and domains are unstable.
    }
  }

  return candidates
    .filter(candidate => candidate.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 16);
}

function hasStrongMatch(entry, candidate) {
  const haystack = normalizeText(`${candidate.title} ${candidate.description} ${candidate.sourcePageUrl} ${candidate.sourceUrl}`);
  const term = normalizeText(entry.term);
  const termEn = normalizeText(entry.termEn);
  return Boolean((term && haystack.includes(term)) || (termEn && haystack.includes(termEn)));
}

function isBlockedHost(host) {
  return /pinterest|alamy|shutterstock|dreamstime|stockphoto|123rf|depositphotos|reddit|poki|kamen-rider|9game|missav|misav|duitang|huaban|699pic|pngsucai|vectorified|templates-navi|weibomingzi|zol\.com|you\.ctrip|xhsd|sohu|sina|baidu|aiqicha|officeplus|iyingdi|toy|game|anime|manga|comic|hentai|porn|xxx|adult/.test(normalizeText(host));
}

function scoreCandidate(entry, candidate) {
  const title = normalizeText(candidate.title);
  const description = normalizeText(candidate.description);
  const query = normalizeText(candidate.query);
  const host = normalizeText(candidate.host);
  const term = normalizeText(entry.term);
  const termEn = normalizeText(entry.termEn);
  const category = normalizeText(entry.category);
  const haystack = `${title} ${description} ${host}`;
  let score = 0;

  if (term && haystack.includes(term)) score += 80;
  if (termEn && haystack.includes(termEn)) score += 70;
  if (term && query.includes(term)) score += 20;
  if (termEn && query.includes(termEn)) score += 15;
  if (category && haystack.includes(category)) score += 8;
  if (/wikipedia|wikimedia|commons|gov|edu|museum|archive|library|official|org/.test(host)) score += 22;
  if (/diagram|示意|图解|构造|结构|规划|architecture|architectural|building|urban|construction/.test(haystack)) score += 10;
  if (isBlockedHost(host)) score -= 120;
  return score;
}

function shouldContain(file) {
  return file.includes('jgygzll')
    || file.includes('kcxylsjz')
    || file.includes('csghyggkj')
    || file.includes('zggdjz');
}

async function encodeWebpUnderLimit(inputBuffer, outputFile, contain) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  let best = null;
  const attempts = [
    { width: 960, quality: 74 },
    { width: 840, quality: 70 },
    { width: 720, quality: 66 },
    { width: 640, quality: 62 },
    { width: 560, quality: 58 },
    { width: 480, quality: 54 },
    { width: 420, quality: 50 },
    { width: 360, quality: 46 },
  ];

  for (const attempt of attempts) {
    const image = sharp(inputBuffer, { animated: false, limitInputPixels: 64_000_000, density: 180 })
      .rotate();
    const resized = contain
      ? image
        .resize({
          width: attempt.width,
          height: Math.round(attempt.width * 2 / 3),
          fit: 'contain',
          position: 'centre',
          background: '#f8fafc',
          withoutEnlargement: false,
        })
        .flatten({ background: '#f8fafc' })
      : image.resize({
        width: attempt.width,
        height: Math.round(attempt.width * 2 / 3),
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: false,
      });

    const buffer = await resized.webp({ quality: attempt.quality, effort: 6 }).toBuffer();
    best = buffer;
    if (buffer.length <= MAX_BYTES) {
      await fs.writeFile(outputFile, buffer);
      return buffer.length;
    }
  }

  await fs.writeFile(outputFile, best);
  return best.length;
}

async function readManualRecords() {
  try {
    return JSON.parse(await fs.readFile(MANUAL_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function keyFor(file) {
  return path.normalize(file).replaceAll('\\', '/').toLowerCase();
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const summary = JSON.parse(await fs.readFile(SUMMARY_FILE, 'utf8'));
  const targets = summary.items
    .filter(item => item.sourceClass === 'generated-educational-plate')
    .filter(item => !categoryFilter || item.category === categoryFilter)
    .slice(offset, offset + limit);

  const manual = await readManualRecords();
  const byFile = new Map(manual.map(record => [keyFor(record.file), record]));
  const results = [];

  for (const [index, entry] of targets.entries()) {
    const label = `${index + 1}/${targets.length} ${entry.term} ${entry.termEn}`;
    try {
      const candidates = await searchBingImages(entry);
      if (!candidates.length) {
        results.push({ file: entry.file, term: entry.term, termEn: entry.termEn, ok: false, reason: 'no bing candidates passed score threshold' });
        console.log(`[skip] ${label} no candidates`);
        continue;
      }

      let written = null;
      for (const candidate of candidates) {
        try {
          const input = await curlBuffer(candidate.sourceUrl, 45_000);
          const size = await encodeWebpUnderLimit(input, path.join(ROOT, entry.file), shouldContain(entry.file));
          const meta = await sharp(path.join(ROOT, entry.file)).metadata();
          if (size <= MAX_BYTES && meta.width && meta.height) {
            written = { candidate, size };
            break;
          }
        } catch {
          // Try the next result.
        }
      }

      if (!written) {
        results.push({ file: entry.file, term: entry.term, termEn: entry.termEn, ok: false, reason: 'all candidates failed download or encoding' });
        console.log(`[fail] ${label} all candidates failed`);
        continue;
      }

      const record = {
        term: entry.term,
        termEn: entry.termEn,
        category: entry.category,
        file: entry.file,
        imageUrl: entry.imageUrl,
        size: written.size,
        ok: true,
        source: 'bing-image-search',
        sourceClass: 'general-web',
        sourceTitle: written.candidate.title,
        sourceUrl: written.candidate.sourceUrl,
        originalUrl: written.candidate.originalUrl,
        sourcePageUrl: written.candidate.sourcePageUrl,
        license: 'See source page',
        licenseUrl: '',
        score: written.candidate.score,
        query: written.candidate.query,
        matchBasis: `Bing Images result selected for exact query "${written.candidate.query}"; title/source context: ${written.candidate.title || written.candidate.host}.`,
        replacedAt: new Date().toISOString(),
      };
      byFile.set(keyFor(entry.file), record);
      results.push(record);
      console.log(`[ok] ${label} ${written.size} ${written.candidate.host}`);
      await new Promise(resolve => setTimeout(resolve, 450));
    } catch (error) {
      results.push({ file: entry.file, term: entry.term, termEn: entry.termEn, ok: false, reason: error.message });
      console.log(`[error] ${label} ${error.message}`);
    }
  }

  await fs.writeFile(MANUAL_FILE, JSON.stringify(Array.from(byFile.values()), null, 2));
  await fs.writeFile(BATCH_FILE, JSON.stringify({
    createdAt: new Date().toISOString(),
    limit,
    offset,
    categoryFilter,
    attempted: targets.length,
    replaced: results.filter(result => result.ok).length,
    failed: results.filter(result => !result.ok).length,
    results,
  }, null, 2));

  console.log(JSON.stringify({
    attempted: targets.length,
    replaced: results.filter(result => result.ok).length,
    failed: results.filter(result => !result.ok).length,
    report: path.relative(ROOT, BATCH_FILE),
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
