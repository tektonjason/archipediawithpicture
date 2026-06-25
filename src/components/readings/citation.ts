import type { Reading } from '../../services/data.service';

function clean(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed || '';
}

function joinSentence(parts: string[]): string {
  return parts.filter(Boolean).join('. ');
}

function creatorPrefix(reading: Reading): string {
  return reading.citation.creators.map(clean).filter(Boolean).join(', ');
}

function formatBookPublication(reading: Reading): string {
  const citation = reading.citation;
  const place = clean(citation.publicationPlace);
  const publisher = clean(citation.publisher || reading.publisher);
  const year = clean(citation.publicationYear || reading.year);

  if (place && publisher && year) return `${place}: ${publisher}, ${year}`;
  if (place && publisher) return `${place}: ${publisher}`;
  if (publisher && year) return `${publisher}, ${year}`;
  if (place && year) return `${place}, ${year}`;
  return publisher || place || year;
}

function formatJournalLocator(reading: Reading): string {
  const citation = reading.citation;
  const container = clean(citation.containerTitle);
  const year = clean(citation.publicationYear || reading.year);
  const volumeIssue = clean(citation.volumeIssue);
  const pages = clean(citation.pages);
  const accessDate = clean(citation.accessDate);
  const locatorParts = [container, year, volumeIssue].filter(Boolean).join(', ');
  const pagesPart = pages ? `: ${pages}` : '';
  const accessPart = accessDate ? `[${accessDate}]` : '';

  return `${locatorParts}${pagesPart}${accessPart}`;
}

export function formatGbT7714(reading: Reading, index?: number): string {
  const citation = reading.citation;
  const prefix = index === undefined ? '' : `[${index}] `;
  const creators = creatorPrefix(reading);
  const title = clean(reading.title) || '未命名读物';
  const lead = creators ? `${creators}. ${title}` : title;

  if (citation.type === 'journal') {
    const locator = formatJournalLocator(reading);
    const url = clean(citation.url);
    return `${prefix}${joinSentence([
      `${lead}[J]`,
      locator,
      url
    ])}.`;
  }

  const edition = clean(citation.edition);
  const publication = formatBookPublication(reading);
  const url = clean(citation.url);
  return `${prefix}${joinSentence([
    `${lead}[M]`,
    edition,
    publication,
    url
  ])}.`;
}

export function formatCitationList(readings: Reading[]): string {
  return readings.map((reading, index) => formatGbT7714(reading, index + 1)).join('\n');
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
