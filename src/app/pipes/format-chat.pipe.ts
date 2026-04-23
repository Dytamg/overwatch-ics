import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'formatChat', standalone: true, pure: true })
export class FormatChatPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    let html = value
      // Escape HTML entities first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // **bold**
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--foreground);font-weight:700">$1</strong>')
      // `inline code`
      .replace(/`([^`]+)`/g, '<code style="background:oklch(0.2 0.01 260);color:var(--neon-cyan);padding:0.1em 0.3em;border-radius:3px;font-size:0.7rem">$1</code>')
      // Bullet lines starting with - or •
      .replace(/^[-•]\s+(.+)$/gm, '<div style="display:flex;gap:0.4rem;margin:0.1rem 0"><span style="color:var(--primary);flex-shrink:0">▸</span><span>$1</span></div>')
      // Newlines to <br>
      .replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
