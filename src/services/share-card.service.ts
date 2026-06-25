import { Injectable } from '@angular/core';
import type { Entry, Reading } from './data.service';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 1600;
const SITE_URL = 'www.archipedia.top';

@Injectable({ providedIn: 'root' })
export class ShareCardService {
  async generateEntryCard(entry: Entry, url: string): Promise<Blob> {
    const canvas = this.createCanvas();
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');

    this.drawBackground(context);
    await this.drawHeroImage(context, entry.imageUrl, 80, 80, 1040, 650);
    this.drawBrand(context);

    context.fillStyle = '#f8fafc';
    context.font = '700 74px "Microsoft YaHei", sans-serif';
    this.drawWrappedText(context, entry.term, 80, 850, 760, 92, 2);

    context.fillStyle = '#94a3b8';
    context.font = 'italic 34px Georgia, serif';
    this.drawWrappedText(context, entry.termEn || entry.category, 80, 1040, 760, 46, 2);

    this.drawPill(context, entry.category, 80, 1165);
    context.fillStyle = '#cbd5e1';
    context.font = '32px "Microsoft YaHei", sans-serif';
    this.drawWrappedText(context, entry.definition, 80, 1260, 760, 52, 4);

    await this.drawQr(context, url, 870, 1120, 250);
    context.fillStyle = '#64748b';
    context.font = '24px "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    context.fillText('扫码阅读完整词条', 995, 1436);

    return this.toBlob(canvas);
  }

  async generateReadingCard(reading: Reading, url: string): Promise<Blob> {
    const canvas = this.createCanvas();
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');

    this.drawBackground(context);
    await this.drawBookCover(context, reading.imageUrl, 80, 120, 480, 720);
    this.drawBrand(context);

    context.fillStyle = '#f8fafc';
    context.font = '700 66px "Microsoft YaHei", sans-serif';
    this.drawWrappedText(context, reading.title, 630, 220, 490, 82, 4);

    context.fillStyle = '#94a3b8';
    context.font = '34px "Microsoft YaHei", sans-serif';
    this.drawWrappedText(context, reading.author || reading.publisher, 630, 600, 490, 48, 3);

    context.fillStyle = '#cbd5e1';
    context.font = '28px "Microsoft YaHei", sans-serif';
    this.drawWrappedText(context, reading.publisher, 630, 780, 490, 42, 2);

    let tagX = 80;
    for (const tag of reading.tags.slice(0, 4)) {
      tagX += this.drawPill(context, tag, tagX, 950) + 18;
    }

    context.fillStyle = '#cbd5e1';
    context.font = '31px "Microsoft YaHei", sans-serif';
    this.drawWrappedText(context, reading.description, 80, 1080, 720, 50, 5);

    await this.drawQr(context, url, 870, 1110, 250);
    context.fillStyle = '#64748b';
    context.font = '24px "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    context.fillText('扫码打开读物详情', 995, 1426);

    return this.toBlob(canvas);
  }

  async shareOrDownload(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title, files: [file] });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    return 'downloaded';
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    return canvas;
  }

  private drawBackground(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#0f1013';
    context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    context.strokeStyle = '#272a31';
    context.lineWidth = 2;
    context.strokeRect(40, 40, CARD_WIDTH - 80, CARD_HEIGHT - 80);
  }

  private drawBrand(context: CanvasRenderingContext2D): void {
    context.textAlign = 'left';
    context.fillStyle = '#ffffff';
    context.font = '700 30px Arial, sans-serif';
    context.fillText('ARCHIPEDIA', 80, 1490);
    context.fillStyle = '#64748b';
    context.font = '24px Arial, sans-serif';
    context.fillText('Architecture Knowledge Base', 300, 1490);
    context.fillStyle = '#94a3b8';
    context.font = '24px Arial, sans-serif';
    context.fillText(SITE_URL, 80, 1534);
  }

  private async drawHeroImage(
    context: CanvasRenderingContext2D,
    source: string | undefined,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    context.fillStyle = '#191b20';
    context.fillRect(x, y, width, height);
    const image = await this.loadImage(source);
    if (!image) return;
    this.drawCover(context, image, x, y, width, height);
  }

  private async drawBookCover(
    context: CanvasRenderingContext2D,
    source: string | undefined,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    context.fillStyle = '#191b20';
    context.fillRect(x, y, width, height);
    const image = await this.loadImage(source);
    if (!image) return;
    this.drawContain(context, image, x, y, width, height);
  }

  private async drawQr(
    context: CanvasRenderingContext2D,
    url: string,
    x: number,
    y: number,
    size: number
  ): Promise<void> {
    const { default: QRCode } = await import('qrcode');
    const dataUrl = await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' }
    });
    const image = await this.loadImage(dataUrl);
    if (!image) return;
    context.fillStyle = '#ffffff';
    context.fillRect(x - 12, y - 12, size + 24, size + 24);
    context.drawImage(image, x, y, size, size);
  }

  private loadImage(source: string | undefined): Promise<HTMLImageElement | null> {
    if (!source) return Promise.resolve(null);
    return new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = source;
    });
  }

  private drawCover(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  private drawContain(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const targetWidth = image.naturalWidth * scale;
    const targetHeight = image.naturalHeight * scale;
    context.drawImage(
      image,
      x + (width - targetWidth) / 2,
      y + (height - targetHeight) / 2,
      targetWidth,
      targetHeight
    );
  }

  private drawWrappedText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ): number {
    const characters = Array.from(text || '');
    const lines: string[] = [];
    let line = '';

    for (const character of characters) {
      const test = line + character;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = character;
        if (lines.length === maxLines) break;
      } else {
        line = test;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);

    if (lines.length === maxLines && characters.join('').length > lines.join('').length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`;
    }

    lines.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
    return lines.length * lineHeight;
  }

  private drawPill(context: CanvasRenderingContext2D, text: string, x: number, y: number): number {
    context.font = '26px "Microsoft YaHei", sans-serif';
    const width = Math.ceil(context.measureText(text).width) + 40;
    context.fillStyle = '#202a3c';
    context.fillRect(x, y - 34, width, 52);
    context.fillStyle = '#bfdbfe';
    context.fillText(text, x + 20, y);
    return width;
  }

  private toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to create PNG')), 'image/png', 0.94);
    });
  }
}
