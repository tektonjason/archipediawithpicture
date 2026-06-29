import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const resourcesFile = path.join(root, 'src', 'data', 'resources-seed.ts');
const outputDir = path.join(root, 'public', 'images', 'resources');
const WIDTH = 640;
const HEIGHT = 360;
const MAX_BYTES = 50 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const CONCURRENCY = 5;

function keyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

function literalValue(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalValue);
  if (ts.isObjectLiteralExpression(node)) {
    const value = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const name = keyName(prop.name);
      if (!name) continue;
      value[name] = literalValue(prop.initializer);
    }
    return value;
  }
  return undefined;
}

async function readResources() {
  const sourceText = await fs.readFile(resourcesFile, 'utf8');
  const source = ts.createSourceFile(resourcesFile, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let result = [];

  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text === 'SEED_RESOURCES') {
        result = literalValue(declaration.initializer) ?? [];
      }
    }
  });

  return result;
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'archipedia.top';
  }
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function paletteFor(item) {
  const palettes = [
    ['#172034', '#314a7a', '#8fb7ff'],
    ['#1b2420', '#2f6653', '#9be7c5'],
    ['#251d2d', '#5a3b82', '#d2b2ff'],
    ['#291e1d', '#7a4535', '#ffc0a6'],
    ['#1d2530', '#4f6076', '#d8e5f6'],
    ['#202416', '#617536', '#d8ef8b'],
    ['#211d28', '#593a62', '#ffc2f0'],
    ['#1a2528', '#30656f', '#9be9f4']
  ];
  return palettes[hashString(`${item.id}:${item.category}:${item.title}`) % palettes.length];
}

function wrapText(text, maxChars, maxLines = 2) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const lines = [];
  let current = '';
  for (const token of normalized.split(' ')) {
    const next = current ? `${current} ${token}` : token;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = token;
    } else {
      current = next;
    }
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length && normalized.length > lines.join(' ').length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, Math.max(0, maxChars - 1))}...`;
  }
  return lines;
}

function fallbackSvg(item) {
  const [bg, mid, accent] = paletteFor(item);
  const titleLines = wrapText(item.title, 24, 2);
  const descLines = wrapText(item.description || domainFromUrl(item.url), 36, 2);
  const domain = domainFromUrl(item.url);
  const initial = escapeXml((item.title || domain).trim().slice(0, 1).toUpperCase());
  const titleText = titleLines.map((line, index) =>
    `<text x="42" y="${160 + index * 42}" font-family="Arial, Microsoft YaHei, sans-serif" font-size="34" font-weight="800" fill="#f8fafc">${escapeXml(line)}</text>`
  ).join('');
  const descText = descLines.map((line, index) =>
    `<text x="42" y="${260 + index * 25}" font-family="Arial, Microsoft YaHei, sans-serif" font-size="19" font-weight="600" fill="#b8c2d8">${escapeXml(line)}</text>`
  ).join('');

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg}"/>
        <stop offset="0.58" stop-color="#101319"/>
        <stop offset="1" stop-color="${mid}"/>
      </linearGradient>
      <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
        <path d="M 34 0 L 0 0 0 34" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      </pattern>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>
    <rect width="640" height="360" rx="30" fill="url(#bg)"/>
    <rect width="640" height="360" fill="url(#grid)" opacity="0.42"/>
    <circle cx="544" cy="64" r="106" fill="${accent}" opacity="0.18" filter="url(#soft)"/>
    <path d="M428 276 L586 118 L586 284 Z" fill="${accent}" opacity="0.18"/>
    <path d="M456 256 L586 126 L586 278 Z" fill="${accent}" opacity="0.28"/>
    <rect x="42" y="38" width="84" height="84" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
    <text x="84" y="94" text-anchor="middle" font-family="Arial, Microsoft YaHei, sans-serif" font-size="42" font-weight="800" fill="${accent}">${initial}</text>
    <text x="144" y="70" font-family="Arial, Microsoft YaHei, sans-serif" font-size="18" font-weight="800" letter-spacing="2" fill="${accent}">ARCHIPEDIA RESOURCE</text>
    <text x="144" y="102" font-family="Arial, Microsoft YaHei, sans-serif" font-size="20" font-weight="700" fill="#d9e2f2">${escapeXml(item.category)}</text>
    ${titleText}
    ${descText}
    <text x="42" y="326" font-family="Arial, Microsoft YaHei, sans-serif" font-size="18" font-weight="700" fill="#78869f">${escapeXml(domain)}</text>
  </svg>`;
}

function fetchedOverlaySvg(item) {
  const domain = domainFromUrl(item.url);
  const title = wrapText(item.title, 31, 1)[0] || domain;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(9,11,16,0)"/>
        <stop offset="1" stop-color="rgba(9,11,16,0.82)"/>
      </linearGradient>
    </defs>
    <rect y="226" width="640" height="134" fill="url(#shade)"/>
    <rect x="28" y="270" width="8" height="52" rx="4" fill="rgba(143,183,255,0.92)"/>
    <text x="52" y="292" font-family="Arial, Microsoft YaHei, sans-serif" font-size="24" font-weight="800" fill="#f8fafc">${escapeXml(title)}</text>
    <text x="52" y="322" font-family="Arial, Microsoft YaHei, sans-serif" font-size="16" font-weight="700" fill="#b8c2d8">${escapeXml(domain)}</text>
  </svg>`;
}

async function webpUnderLimit(input, overlaySvg = '') {
  let quality = 70;

  const render = qualityValue => {
    let pipeline = sharp(input)
      .rotate()
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' });

    if (overlaySvg) {
      pipeline = pipeline.composite([{ input: Buffer.from(overlaySvg), blend: 'over' }]);
    }

    return pipeline.webp({ quality: qualityValue, effort: 5 }).toBuffer();
  };

  let output = await render(quality);

  while (output.length > MAX_BYTES && quality > 34) {
    quality -= 8;
    output = await render(quality);
  }

  return output;
}

async function generateFallback(item) {
  return webpUnderLimit(Buffer.from(fallbackSvg(item)));
}

async function fetchText(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'user-agent': 'Mozilla/5.0 ArchipediaPreviewBot/1.0',
      accept: 'text/html,application/xhtml+xml'
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function extractOgImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    try {
      return new URL(match[1], baseUrl).toString();
    } catch {
      continue;
    }
  }

  return '';
}

async function fetchImage(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'user-agent': 'Mozilla/5.0 ArchipediaPreviewBot/1.0',
      accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('image') && !url.match(/\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i)) {
    throw new Error(`Not an image: ${type}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function createPreview(item) {
  try {
    const html = await fetchText(item.url);
    const imageUrl = extractOgImage(html, item.url);
    if (imageUrl) {
      const image = await fetchImage(imageUrl);
      const output = await webpUnderLimit(image, fetchedOverlaySvg(item));
      return { output, source: imageUrl, fallback: false };
    }
  } catch {
    // External sites are inconsistent. A generated resource preview keeps builds deterministic.
  }

  return { output: await generateFallback(item), source: '', fallback: true };
}

async function runPool(items, worker) {
  let index = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const resources = await readResources();
  await fs.mkdir(outputDir, { recursive: true });

  const fallback = await generateFallback({
    id: 'default',
    category: 'ARCHIPEDIA',
    title: 'Architecture Resource',
    description: 'Curated design references and tools.',
    url: 'https://www.archipedia.top'
  });
  await fs.writeFile(path.join(outputDir, 'default.webp'), fallback);

  let fetched = 0;
  let generated = 0;

  await runPool(resources, async item => {
    if (!item?.id) return;
    const { output, fallback: usedFallback } = await createPreview(item);
    const filePath = path.join(outputDir, `${item.id}.webp`);
    await fs.writeFile(filePath, output);
    if (usedFallback) generated += 1;
    else fetched += 1;
    console.log(`${usedFallback ? 'generated' : 'fetched'} ${item.id} ${Math.ceil(output.length / 1024)}KB`);
  });

  console.log(`Resource previews ready: ${resources.length} files (${fetched} fetched, ${generated} generated).`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
