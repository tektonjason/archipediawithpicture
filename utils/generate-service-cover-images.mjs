import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const assetDir = path.join(root, '服务 图片 用完可删');
const outputDir = path.join(root, 'public', 'images', 'services', 'covers');
const width = 1200;
const height = 750;
const maxBytes = 100 * 1024;

const services = [
  {
    id: 'site-model',
    title: '场地模型下载',
    code: 'SITE MODEL',
    source: '模型下载 主图.png',
    accent: '#8b9cff',
    position: 'centre',
  },
  {
    id: 'site-plan',
    title: '场地平面图下载',
    code: 'SITE PLAN',
    source: '平面图下载 主图.png',
    accent: '#a78bfa',
    position: 'centre',
  },
  {
    id: 'satellite-current',
    title: '最新卫星图下载',
    code: 'SATELLITE',
    source: '最新卫星图 示例.png',
    accent: '#60a5fa',
    position: 'centre',
  },
  {
    id: 'satellite-history',
    title: '历史卫星图下载',
    code: 'HISTORICAL',
    source: '历史卫星图 2000年至今示例1.png',
    accent: '#94a3b8',
    position: 'centre',
  },
  {
    id: 'road-network',
    title: '矢量路网下载',
    code: 'ROAD DATA',
    source: '矢量路网 示例.png',
    accent: '#67e8f9',
    position: 'centre',
  },
  {
    id: 'shp-data',
    title: 'SHP 文件下载',
    code: 'GIS SHP',
    source: 'SHP数据 主图.png',
    accent: '#818cf8',
    position: 'centre',
  },
  {
    id: 'poi-data',
    title: 'POI 数据下载',
    code: 'POI DATA',
    source: 'POI 1.jpg',
    accent: '#2dd4bf',
    position: 'centre',
  },
  {
    id: 'wind-rose',
    title: '风玫瑰图',
    code: 'WIND ROSE',
    source: '风玫瑰.png',
    accent: '#38bdf8',
    position: 'centre',
  },
  {
    id: 'radiation',
    title: '热辐射图',
    code: 'RADIATION',
    source: '全年热辐射.jpg',
    accent: '#fbbf24',
    position: 'centre',
  },
  {
    id: 'psychrometric',
    title: '焓湿图',
    code: 'PSYCHROMETRIC',
    source: '全年焓湿图.jpg',
    accent: '#4ade80',
    position: 'centre',
  },
  {
    id: 'temperature',
    title: '气温图',
    code: 'TEMPERATURE',
    source: '干球温度.png',
    accent: '#fb7185',
    position: 'centre',
  },
  {
    id: 'humidity',
    title: '相对湿度图',
    code: 'HUMIDITY',
    source: '相对湿度 - 副本.jpg',
    accent: '#22d3ee',
    position: 'centre',
  },
];

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const wrapText = (text, limit = 10) => {
  const chars = [...text];
  const lines = [];
  for (let index = 0; index < chars.length; index += limit) {
    lines.push(chars.slice(index, index + limit).join(''));
  }
  return lines.slice(0, 2);
};

const tspans = (lines, x, y, size, leading = 1.14) => lines
  .map((line, index) => `<tspan x="${x}" y="${y + index * size * leading}">${escapeXml(line)}</tspan>`)
  .join('');

const assertFile = async (file) => {
  try {
    await fs.access(file);
  } catch {
    throw new Error(`Missing source image: ${file}`);
  }
};

const imageToDataUri = async (file, position) => {
  const buffer = await sharp(file)
    .rotate()
    .resize(980, 376, {
      fit: 'inside',
      withoutEnlargement: true,
      position,
    })
    .png()
    .toBuffer();

  return `data:image/png;base64,${buffer.toString('base64')}`;
};

const makeCoverSvg = async (service) => {
  const sourceFile = path.join(assetDir, service.source);
  const imageUri = await imageToDataUri(sourceFile, service.position);
  const titleLines = wrapText(service.title);
  const accent = service.accent;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#080d15"/>
      <stop offset="0.48" stop-color="#111827"/>
      <stop offset="1" stop-color="#05070d"/>
    </linearGradient>
    <radialGradient id="accentGlow" cx="0.77" cy="0.16" r="0.72">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.32"/>
      <stop offset="0.44" stop-color="${accent}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="imageShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#020617" stop-opacity="0.08"/>
      <stop offset="0.66" stop-color="#020617" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#020617" stop-opacity="0.46"/>
    </linearGradient>
    <linearGradient id="accentBand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}" stop-opacity="0"/>
      <stop offset="0.14" stop-color="${accent}" stop-opacity="0.94"/>
      <stop offset="0.84" stop-color="#93c5fd" stop-opacity="0.72"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M36 0H0V36" fill="none" stroke="#cbd5e1" stroke-opacity="0.052" stroke-width="1"/>
    </pattern>
    <filter id="panelShadow" x="-16%" y="-18%" width="132%" height="136%">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000814" flood-opacity="0.56"/>
    </filter>
    <clipPath id="imageClip">
      <rect x="72" y="232" width="1056" height="360" rx="28"/>
    </clipPath>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect width="${width}" height="${height}" fill="url(#accentGlow)"/>
  <path d="M1008 86 L1128 208 L1128 594 L974 708" fill="none" stroke="${accent}" stroke-opacity="0.16" stroke-width="2"/>
  <path d="M86 665 C250 616 313 713 476 668 C630 626 724 638 882 692" fill="none" stroke="${accent}" stroke-opacity="0.14" stroke-width="3"/>

  <text x="72" y="86" fill="#dbeafe" fill-opacity="0.92"
        font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900" letter-spacing="7">ARCHIPEDIA SERVICE</text>
  <text x="72" y="158" fill="#f8fafc"
        font-family="Microsoft YaHei, Noto Sans CJK SC, PingFang SC, Arial, sans-serif" font-size="50" font-weight="900">${tspans(titleLines, 72, 158, 50)}</text>
  <text x="1128" y="136" text-anchor="end" fill="${accent}" fill-opacity="0.80"
        font-family="Inter, Arial, sans-serif" font-size="30" font-weight="900" letter-spacing="2">${escapeXml(service.code)}</text>

  <g filter="url(#panelShadow)">
    <rect x="72" y="232" width="1056" height="360" rx="28" fill="#08101c" stroke="#dbeafe" stroke-opacity="0.14"/>
    <g clip-path="url(#imageClip)">
      <rect x="72" y="232" width="1056" height="360" fill="#050914"/>
      <image href="${imageUri}" x="112" y="252" width="976" height="306" preserveAspectRatio="xMidYMid meet"/>
      <rect x="72" y="232" width="1056" height="360" fill="url(#imageShade)"/>
      <rect x="72" y="232" width="1056" height="360" fill="${accent}" fill-opacity="0.035"/>
    </g>
    <rect x="72" y="584" width="1056" height="8" fill="url(#accentBand)"/>
  </g>

  <text x="72" y="674" fill="#e5e7eb" fill-opacity="0.90"
        font-family="Microsoft YaHei, Noto Sans CJK SC, PingFang SC, Arial, sans-serif" font-size="24" font-weight="800">第三方资源咨询入口</text>
  <text x="72" y="710" fill="#94a3b8" fill-opacity="0.78"
        font-family="Microsoft YaHei, Noto Sans CJK SC, PingFang SC, Arial, sans-serif" font-size="16" font-weight="600">场地资料、地图数据与气象分析图制作</text>
  <text x="1128" y="710" text-anchor="end" fill="#64748b" fill-opacity="0.45"
        font-family="Inter, Arial, sans-serif" font-size="72" font-weight="900">A</text>
</svg>`;
};

const renderWebp = async (svg) => {
  let lastBuffer = null;

  for (const quality of [84, 78, 72, 66, 60, 54, 48, 42, 36]) {
    const buffer = await sharp(Buffer.from(svg, 'utf8'))
      .resize(width, height)
      .webp({ quality, effort: 6 })
      .toBuffer();

    lastBuffer = buffer;
    if (buffer.length <= maxBytes) return buffer;
  }

  return lastBuffer;
};

const writeCover = async (service) => {
  const sourceFile = path.join(assetDir, service.source);
  await assertFile(sourceFile);

  const svg = await makeCoverSvg(service);
  const buffer = await renderWebp(svg);
  const outputFile = path.join(outputDir, `${service.id}.webp`);
  await fs.writeFile(outputFile, buffer);

  const metadata = await sharp(outputFile).metadata();
  const stat = await fs.stat(outputFile);
  const size = stat.size;

  if (metadata.width !== width || metadata.height !== height) {
    throw new Error(`${service.id}.webp has invalid dimensions: ${metadata.width}x${metadata.height}`);
  }

  if (size > maxBytes) {
    throw new Error(`${service.id}.webp is ${Math.round(size / 1024)}KB, expected <= 100KB`);
  }

  return {
    name: `${service.id}.webp`,
    source: service.source,
    kb: Number((size / 1024).toFixed(1)),
    width: metadata.width,
    height: metadata.height,
  };
};

await fs.mkdir(outputDir, { recursive: true });

const results = [];
for (const service of services) {
  results.push(await writeCover(service));
}

console.table(results);
