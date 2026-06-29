import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = 'C:/Users/Lenovo/Desktop/服务 图片';
const outputDir = 'public/images/services';

const imageMap = [
  ['site-model.webp', '模型下载.png'],
  ['site-plan.webp', '平面图下载.png'],
  ['satellite-current.webp', '最新卫星图 示例.png'],
  ['satellite-history.webp', '历史卫星图 2000年至今示例1.png'],
  ['road-network.webp', '矢量路网 示例.png'],
  ['wind-rose.webp', '风玫瑰.png'],
  ['radiation.webp', '全年热辐射.jpg'],
  ['psychrometric.webp', '全年焓湿图.jpg'],
  ['temperature.webp', '干球温度.png'],
  ['humidity.webp', '相对湿度 - 副本.jpg'],
];

fs.mkdirSync(outputDir, { recursive: true });

async function convertImage(outputName, inputName, options = {}) {
  const inputPath = path.join(sourceDir, inputName);
  const outputPath = path.join(outputDir, outputName);
  let width = options.width ?? 720;
  let quality = options.quality ?? 72;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await sharp(inputPath)
      .rotate()
      .resize({
        width,
        height: 420,
        fit: 'cover',
        position: options.position ?? 'centre',
      })
      .webp({ quality })
      .toFile(outputPath);

    const size = fs.statSync(outputPath).size;
    if (size <= 100 * 1024) return size;
    width -= 60;
    quality -= 8;
  }

  return fs.statSync(outputPath).size;
}

async function composeMapDataImage(outputName, label, title, color) {
  const inputPath = path.join(sourceDir, '矢量路网 示例.png');
  const outputPath = path.join(outputDir, outputName);
  const overlay = Buffer.from(`
    <svg width="720" height="420" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" x2="1">
          <stop stop-color="#05070b" stop-opacity=".14"/>
          <stop offset="1" stop-color="#05070b" stop-opacity=".82"/>
        </linearGradient>
      </defs>
      <rect width="720" height="420" fill="url(#shade)"/>
      <g transform="translate(42 46)">
        <rect width="86" height="34" rx="17" fill="${color}" fill-opacity=".92"/>
        <text x="43" y="23" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="white">${label}</text>
        <text x="0" y="104" font-family="Arial, sans-serif" font-size="38" font-weight="800" fill="white">${title}</text>
        <text x="0" y="142" font-family="Arial, sans-serif" font-size="18" fill="#cbd5e1">建筑场地数据辅助服务</text>
      </g>
    </svg>
  `);

  let quality = 76;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await sharp(inputPath)
      .rotate()
      .resize({ width: 720, height: 420, fit: 'cover' })
      .composite([{ input: overlay }])
      .webp({ quality })
      .toFile(outputPath);

    const size = fs.statSync(outputPath).size;
    if (size <= 100 * 1024) return size;
    quality -= 8;
  }

  return fs.statSync(outputPath).size;
}

const results = [];
for (const [outputName, inputName] of imageMap) {
  results.push([outputName, await convertImage(outputName, inputName)]);
}

results.push(['shp-data.webp', await composeMapDataImage('shp-data.webp', 'SHP', '边界与地理数据', '#2563eb')]);
results.push(['poi-data.webp', await composeMapDataImage('poi-data.webp', 'POI', '兴趣点数据检索', '#16a34a')]);

fs.copyFileSync(path.join(sourceDir, '微信二维码.png'), path.join(outputDir, 'wechat-qr.png'));
results.push(['wechat-qr.png', fs.statSync(path.join(outputDir, 'wechat-qr.png')).size]);

console.table(results.map(([name, size]) => ({
  name,
  kb: (size / 1024).toFixed(1),
  ok: size <= 100 * 1024,
})));
