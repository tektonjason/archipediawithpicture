import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const files = {
  archipedia: path.join(root, 'src', 'data', 'archipedia-seed.ts'),
  resources: path.join(root, 'src', 'data', 'resources-seed.ts'),
  readings: path.join(root, 'src', 'data', 'readings-seed.ts'),
  competitions: path.join(root, 'src', 'data', 'competitions-seed.ts')
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

function literalValue(node) {
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
    return node.elements.map(literalValue);
  }

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

function exportedConst(filePath, exportName) {
  const source = parseFile(filePath);
  let result;

  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text !== exportName) continue;
      result = literalValue(declaration.initializer);
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

  if (duplicateIds.length) {
    report.errors.push(`SEED_RESOURCES has ${duplicateIds.length} duplicate ids`);
  }

  for (const item of invalidUrls) {
    report.errors.push(`SEED_RESOURCES invalid url: ${item?.title ?? '(untitled)'} -> ${item?.url ?? '(empty)'}`);
  }

  report.notes.push(`SEED_RESOURCES: ${resources.length} links`);
  summarizeCounts('Resource categories', countBy(resources, item => item?.category));
}

function checkReadings() {
  const readings = exportedConst(files.readings, 'SEED_READINGS');
  const missingAuthor = readings.filter(item => !item?.author?.trim());
  const journals = readings.filter(item => Boolean(item?.journalLevel));
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

  report.notes.push(`SEED_READINGS: ${readings.length} readings (${journals.length} journals, ${readings.length - journals.length} books)`);
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
