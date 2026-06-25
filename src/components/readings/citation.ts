import type { Reading } from '../../services/data.service';

function clean(value: string | undefined | null, fallback = '不详'): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export function formatGbT7714(reading: Reading, index?: number): string {
  const citation = reading.citation;
  const prefix = index === undefined ? '' : `[${index}] `;
  const creators = citation.creators.length ? citation.creators.join(', ') : '不详';
  const title = clean(reading.title);
  const place = clean(citation.publicationPlace);
  const publisher = clean(citation.publisher || reading.publisher);
  const year = clean(citation.publicationYear);

  if (citation.type === 'journal') {
    const volumeIssue = citation.volumeIssue ? `, ${citation.volumeIssue}` : '';
    const url = citation.url ? `. ${citation.url}` : '';
    return `${prefix}${creators}. ${title}[J]. ${place}: ${publisher}, ${year}${volumeIssue}${url}.`;
  }

  const edition = citation.edition ? `. ${citation.edition}` : '';
  const url = citation.url ? `. ${citation.url}` : '';
  return `${prefix}${creators}. ${title}[M]${edition}. ${place}: ${publisher}, ${year}${url}.`;
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
