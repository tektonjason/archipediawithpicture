import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const files = {
  archipedia: path.join(root, 'src', 'data', 'archipedia-seed.ts'),
  resources: path.join(root, 'src', 'data', 'resources-seed.ts'),
  readings: path.join(root, 'src', 'data', 'readings-seed.ts'),
  competitions: path.join(root, 'src', 'data', 'competitions-seed.ts'),
  standards: path.join(root, 'src', 'data', 'standards-seed.ts')
};

const report = {
  errors: [],
  warnings: [],
  notes: []
};

function readSource(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function parseFile(filePath) {
  return ts.createSourceFile(filePath, readSource(filePath), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function keyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function literalValue(node, constants = new Map()) {
  if (!node) return undefined;

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(element => literalValue(element, constants));
  }

  if (ts.isObjectLiteralExpression(node)) {
    const value = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const name = keyName(prop.name);
      if (!name) continue;
      value[name] = literalValue(prop.initializer, constants);
    }
    return value;
  }

  if (ts.isIdentifier(node)) {
    return constants.get(node.text);
  }

  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const fn = node.expression.text;
    const args = node.arguments.map(argument => literalValue(argument, constants));

    if (fn === 'jianbiaoku' && typeof args[0] === 'string') {
      return `http://s.jianbiaoku.com/sou/?module=criterion&keyword=${encodeURIComponent(args[0])}`;
    }

    if (fn === 'soujianzhu' && typeof args[0] === 'string') {
      return `https://www.soujianzhu.cn/NormAndRules/Default.aspx?key=${encodeURIComponent(args[0])}`;
    }

    if (fn === 'officialUrls' && typeof args[0] === 'string') {
      const extra = Array.isArray(args[1]) ? args[1] : [];
      return [
        constants.get('OPEN_STD'),
        constants.get('STD_PLATFORM'),
        constants.get('MOHURD_DOCS'),
        ...extra,
        `http://s.jianbiaoku.com/sou/?module=criterion&keyword=${encodeURIComponent(args[0])}`,
        `https://www.soujianzhu.cn/NormAndRules/Default.aspx?key=${encodeURIComponent(args[0])}`
      ].filter(Boolean);
    }

    if (fn === 'clause') {
      const [id, category, title, summary, keywords, sourceUrl, clauseNo] = args;
      return { id, category, title, summary, keywords, sourceUrl, clauseNo };
    }

    if (fn === 'standard' && args[0] && typeof args[0] === 'object') {
      const item = args[0];
      return {
        id: item.id,
        title: item.title,
        code: item.code,
        status: item.status,
        effectiveDate: item.effectiveDate,
        category: item.category,
        useCases: item.useCases,
        keywords: item.keywords,
        officialUrls: item.officialUrls,
        verifiedAt: item.verifiedAt,
        note: item.note,
        clauses: (item.clauses ?? []).map(clause => ({
          ...clause,
          id: `${item.id}-${clause.id}`,
          standardCode: item.code,
          standardTitle: item.title,
          sourceName: clause.sourceName ?? item.sourceName,
          sourceUrl: clause.sourceUrl ?? item.sourceUrl,
          verifiedAt: clause.verifiedAt ?? item.verifiedAt
        }))
      };
    }
  }

  return undefined;
}

function exportedConst(filePath, exportName) {
  const source = parseFile(filePath);
  const constants = new Map();
  let result;

  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text === exportName) continue;
      const value = literalValue(declaration.initializer, constants);
      if (value !== undefined) constants.set(declaration.name.text, value);
    }
  });

  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text !== exportName) continue;
      result = literalValue(declaration.initializer, constants);
    }
  });

  if (!Array.isArray(result)) {
    report.errors.push(`${exportName}: export not found or not parseable`);
    return [];
  }

  return result;
}

function countBy(items, picker) {
  const counts = new Map();
  for (const item of items) {
    const key = picker(item) || '(empty)';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function duplicateKeys(items, picker) {
  const seen = new Map();
  const duplicates = [];
  items.forEach((item, index) => {
    const key = picker(item);
    if (!key) return;
    if (seen.has(key)) {
      duplicates.push({ key, first: seen.get(key), next: index });
    } else {
      seen.set(key, index);
    }
  });
  return duplicates;
}

function isValidHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function summarizeCounts(label, counts, limit = 10) {
  const summary = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => `${key}:${count}`)
    .join(', ');
  report.notes.push(`${label}: ${summary}`);
}

function checkArchipedia() {
  const rows = exportedConst(files.archipedia, 'ARCHIPEDIA_ROWS');
  const malformed = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !Array.isArray(row) || row.length !== 6);

  for (const item of malformed) {
    report.errors.push(`ARCHIPEDIA_ROWS[${item.index}] has ${item.row?.length ?? 'unknown'} columns; expected 6`);
  }

  const duplicates = duplicateKeys(rows, row => Array.isArray(row) ? `${row[2]}_${row[0]}` : undefined);
  if (duplicates.length) {
    report.warnings.push(`ARCHIPEDIA_ROWS has ${duplicates.length} duplicate term/category keys`);
  }

  report.notes.push(`ARCHIPEDIA_ROWS: ${rows.length} rows`);
  summarizeCounts('Archipedia categories', countBy(rows, row => Array.isArray(row) ? row[0] : undefined));
}

function checkResources() {
  const resources = exportedConst(files.resources, 'SEED_RESOURCES');
  const duplicateIds = duplicateKeys(resources, item => item?.id);
  const invalidUrls = resources.filter(item => !isValidHttpUrl(item?.url));
  const imageDir = path.join(root, 'public', 'images', 'resources');
  const missingImages = [];
  const oversizedImages = [];
  const imageHashes = new Map();
  const duplicateImages = [];

  if (duplicateIds.length) {
    report.errors.push(`SEED_RESOURCES has ${duplicateIds.length} duplicate ids`);
  }

  for (const item of invalidUrls) {
    report.errors.push(`SEED_RESOURCES invalid url: ${item?.title ?? '(untitled)'} -> ${item?.url ?? '(empty)'}`);
  }

  for (const item of resources) {
    const imageUrl = item?.imageUrl || (item?.id ? `/images/resources/${item.id}.webp` : '');
    const filePath = imageUrl ? path.join(root, 'public', imageUrl.replace(/^\//, '')) : '';
    if (!item?.id || !filePath || path.extname(filePath).toLowerCase() !== '.webp' || !fs.existsSync(filePath)) {
      missingImages.push(item);
      continue;
    }

    const stat = fs.statSync(filePath);
    if (stat.size > 50 * 1024) {
      oversizedImages.push({ item, size: stat.size });
    }

    const hash = crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');
    if (imageHashes.has(hash)) {
      duplicateImages.push(`${imageHashes.get(hash)} / ${item.id}`);
    } else {
      imageHashes.set(hash, item.id);
    }
  }

  if (!fs.existsSync(path.join(imageDir, 'default.webp'))) {
    report.errors.push('Resource preview fallback is missing: public/images/resources/default.webp');
  }

  if (missingImages.length) {
    report.errors.push(`SEED_RESOURCES has ${missingImages.length} missing WebP preview images`);
  }

  if (oversizedImages.length) {
    for (const { item, size } of oversizedImages.slice(0, 10)) {
      report.errors.push(`Resource preview exceeds 50KB: ${item.id} ${item.title} (${Math.ceil(size / 1024)}KB)`);
    }
    if (oversizedImages.length > 10) {
      report.errors.push(`Resource preview exceeds 50KB: ${oversizedImages.length - 10} more files`);
    }
  }

  if (duplicateImages.length) {
    report.warnings.push(`Resource previews have ${duplicateImages.length} duplicate image hashes`);
  }

  report.notes.push(`SEED_RESOURCES: ${resources.length} links`);
  report.notes.push(`Resource previews: ${resources.length - missingImages.length}/${resources.length} WebP files`);
  summarizeCounts('Resource categories', countBy(resources, item => item?.category));
}

function checkStandards() {
  if (!fs.existsSync(files.standards)) {
    report.errors.push('SEED_STANDARDS file is missing');
    return;
  }

  const standards = exportedConst(files.standards, 'SEED_STANDARDS');
  const duplicateIds = duplicateKeys(standards, item => item?.id);
  const missingOfficialUrls = standards.filter(item => !Array.isArray(item?.officialUrls) || item.officialUrls.length === 0);
  const invalidOfficialUrls = standards.flatMap(item => (item?.officialUrls ?? [])
    .filter(url => !isValidHttpUrl(url))
    .map(url => `${item?.id ?? '(unknown)'} -> ${url}`));
  const missingVerification = standards.filter(item => !/^\d{4}-\d{2}-\d{2}$/.test(item?.verifiedAt ?? ''));
  const missingFields = standards.filter(item => !item?.title || !item?.code || !item?.status || !item?.effectiveDate || !item?.category || !item?.note);
  const missingSearchFields = standards.filter(item => !Array.isArray(item?.useCases) || item.useCases.length === 0 || !Array.isArray(item?.keywords) || item.keywords.length === 0);
  const missingClauses = standards.filter(item => !Array.isArray(item?.clauses) || item.clauses.length === 0);
  const allClauses = standards.flatMap(item => item?.clauses ?? []);
  const invalidClauses = standards.flatMap(item => (item?.clauses ?? [])
    .filter(clause => !clause?.id
      || !clause?.standardCode
      || !clause?.standardTitle
      || !clause?.clauseNo
      || !clause?.category
      || !clause?.title
      || !clause?.appliesTo
      || !clause?.requirement
      || !Array.isArray(clause?.numericValues)
      || clause.numericValues.length === 0
      || !Array.isArray(clause?.keywords)
      || clause.keywords.length === 0
      || !clause?.sourceName
      || !isValidHttpUrl(clause?.sourceUrl ?? '')
      || !/^\d{4}-\d{2}-\d{2}$/.test(clause?.verifiedAt ?? ''))
    .map(clause => `${item?.id ?? '(unknown)'} -> ${clause?.id ?? '(missing clause id)'}`));
  const duplicateClauseIds = duplicateKeys(allClauses, clause => clause?.id);
  const vagueClauseText = allClauses.filter(clause => /需复核|应核查|回到正式条文|关键尺寸需/.test(clause?.requirement ?? ''));

  if (duplicateIds.length) {
    report.errors.push(`SEED_STANDARDS has ${duplicateIds.length} duplicate ids`);
  }

  if (missingFields.length) {
    report.errors.push(`SEED_STANDARDS has ${missingFields.length} entries with missing required fields`);
  }

  if (missingSearchFields.length) {
    report.errors.push(`SEED_STANDARDS has ${missingSearchFields.length} entries without use cases or keywords`);
  }

  if (missingClauses.length) {
    report.errors.push(`SEED_STANDARDS has ${missingClauses.length} entries without clause quick references`);
  }

  if (duplicateClauseIds.length) {
    report.errors.push(`SEED_STANDARDS has ${duplicateClauseIds.length} duplicate clause ids`);
  }

  if (allClauses.length < 150) {
    report.warnings.push(`SEED_STANDARDS has ${allClauses.length} clause quick references; target is about 150 after more verifiable source text is provided`);
  }

  if (allClauses.length < 60) {
    report.errors.push(`SEED_STANDARDS has only ${allClauses.length} clause quick references; expected at least 60 usable clauses`);
  }

  for (const clause of vagueClauseText) {
    report.errors.push(`SEED_STANDARDS vague clause requirement: ${clause?.id ?? '(unknown)'}`);
  }

  for (const invalid of invalidClauses) {
    report.errors.push(`SEED_STANDARDS invalid clause quick reference: ${invalid}`);
  }

  if (missingOfficialUrls.length) {
    report.errors.push(`SEED_STANDARDS has ${missingOfficialUrls.length} entries without official source URLs`);
  }

  for (const invalid of invalidOfficialUrls) {
    report.errors.push(`SEED_STANDARDS invalid official URL: ${invalid}`);
  }

  if (missingVerification.length) {
    report.errors.push(`SEED_STANDARDS has ${missingVerification.length} entries without YYYY-MM-DD verification dates`);
  }

  report.notes.push(`SEED_STANDARDS: ${standards.length} quick references, ${allClauses.length} clauses`);
  summarizeCounts('Standard categories', countBy(standards, item => item?.category));
  summarizeCounts('Standard clause categories', countBy(allClauses, item => item?.category));
}

function checkReadings() {
  const readings = exportedConst(files.readings, 'RAW_READINGS');
  const missingAuthor = readings.filter(item => !item?.author?.trim());
  const journals = readings.filter(item => Boolean(item?.journalLevel) || item?.tags?.includes('期刊'));
  const missingCitationSource = readings.filter(item => !item?.publisher?.trim());
  const source = readSource(files.readings);
  const expectedImages = readings.map((item, index) => item?.imageUrl ?? `/images/book/s${index + 1}.webp`);
  const missingImages = expectedImages.filter(imageUrl => {
    const filePath = path.join(root, 'public', imageUrl.replace(/^\//, ''));
    return !fs.existsSync(filePath);
  });

  if (missingAuthor.length) {
    report.warnings.push(`SEED_READINGS has ${missingAuthor.length} entries without author`);
  }

  if (missingImages.length) {
    report.warnings.push(`SEED_READINGS has ${missingImages.length} missing cover images`);
  }

  if (readings.length !== 79) {
    report.errors.push(`RAW_READINGS has ${readings.length} entries; expected 79`);
  }

  if (missingCitationSource.length) {
    report.errors.push(`RAW_READINGS has ${missingCitationSource.length} entries without a publisher for citation export`);
  }

  if (!source.includes('citation: {') || !source.includes('verifiedBy:')) {
    report.errors.push('SEED_READINGS citation metadata generator is missing');
  }

  report.notes.push(`SEED_READINGS: ${readings.length} readings (${journals.length} journals, ${readings.length - journals.length} books)`);
  report.notes.push(`Reading citations: ${readings.length} entries can generate GB/T 7714 metadata`);
  summarizeCounts('Reading tags', countBy(readings.flatMap(item => item?.tags ?? []), tag => tag));
}

function checkCompetitions() {
  const competitions = exportedConst(files.competitions, 'SEED_COMPETITIONS');
  const duplicateNames = duplicateKeys(competitions, item => `${item?.name ?? ''}_${item?.organizer ?? ''}`);
  const invalidUrls = competitions.filter(item => item?.url && !isValidHttpUrl(item.url));
  const missingMonth = competitions.filter(item => !/(\d{1,2})月/.test(item?.deadline ?? ''));

  if (duplicateNames.length) {
    report.warnings.push(`SEED_COMPETITIONS has ${duplicateNames.length} duplicate name/organizer keys`);
  }

  if (invalidUrls.length) {
    report.warnings.push(`SEED_COMPETITIONS has ${invalidUrls.length} non-http urls`);
  }

  if (missingMonth.length) {
    report.warnings.push(`SEED_COMPETITIONS has ${missingMonth.length} entries without a parseable month`);
  }

  report.notes.push(`SEED_COMPETITIONS: ${competitions.length} competitions`);
  summarizeCounts('Competition levels', countBy(competitions, item => item?.level));
}

checkArchipedia();
checkResources();
checkReadings();
checkCompetitions();
checkStandards();

console.log('Content health report');
console.log('=====================');
for (const note of report.notes) {
  console.log(`OK  ${note}`);
}
for (const warning of report.warnings) {
  console.warn(`WARN ${warning}`);
}
for (const error of report.errors) {
  console.error(`ERR ${error}`);
}

if (report.errors.length) {
  process.exitCode = 1;
}
