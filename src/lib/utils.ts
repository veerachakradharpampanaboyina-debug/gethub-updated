import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function markdownToHtml(markdown: string): string {
  // Basic markdown to HTML conversion
  let html = markdown
    // Headings (e.g., #, ##, ###, ####)
    .replace(/^#### (.*$)/gim, '<h4 style="margin-bottom: 1em;">$1</h4>')
    .replace(/^### (.*$)/gim, '<h3 style="margin-bottom: 1em;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="margin-bottom: 1em;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="margin-bottom: 1em;">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italics
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Horizontal Rule
    .replace(/^\s*(\*|-|_){3,}\s*$/gim, '<hr style="margin-top: 1em; margin-bottom: 1em;" />')
    // Unordered lists
    .replace(/^\s*[-*] (.*)/gim, '<li style="margin-bottom: 0.5em;">$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\. (.*)/gim, '<li style="margin-bottom: 0.5em;">$1</li>')
    // Combine list items into lists
    .replace(/<\/li>\s*<li/g, '</li><li') // remove newlines between list items
    .replace(/(<li.*?>.*?<\/li>)+/gs, (match) => {
        if (match.includes('<ol>')) return match; // Already wrapped
        return `<ul>${match}</ul>`;
    })
    .replace(/<ul>\s*<li/g, '<ul><li')
    // Newlines to <br> with paragraph-like spacing for consecutive newlines
    .replace(/\n\s*\n/g, '<br /><br />') // Paragraph breaks
    .replace(/\n/g, '<br />'); // Single line breaks

  return html;
}
