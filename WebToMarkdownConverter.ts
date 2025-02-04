import TurndownService, { Filter, Rule } from 'turndown';
import { JSDOM } from 'jsdom';
import * as turndownPluginGfm from 'turndown-plugin-gfm';
import axios from 'axios';
import { createHash } from 'crypto';

export interface WebToMarkdownOptions {
    retainImages?: 'none' | 'alt' | 'alt_p' | 'all';
    noGfm?: boolean | 'table';
    imgDataUrlToObjectUrl?: boolean;
    customRules?: { [k: string]: Rule };
    customKeep?: Filter;
}

export class WebToMarkdownConverter {
    private turndownService: TurndownService;

    constructor(options?: WebToMarkdownOptions) {
        this.turndownService = new TurndownService({
            codeBlockStyle: 'fenced',
            preformattedCode: true,
        });

        this.configureTurndownService(options);
    }

    private configureTurndownService(options?: WebToMarkdownOptions) {
        if (options?.customKeep) {
            this.turndownService.keep(options.customKeep);
        }

        // Add base rules
        this.turndownService.addRule('remove-irrelevant', {
            filter: ['meta', 'style', 'script', 'noscript', 'link', 'textarea', 'select'],
            replacement: () => ''
        });

        this.turndownService.addRule('truncate-svg', {
            filter: 'svg' as any,
            replacement: () => ''
        });

        this.turndownService.addRule('title-as-h1', {
            filter: ['title'],
            replacement: (innerText) => `${innerText}\n===============\n`
        });

        // Handle data URLs for images if needed
        if (options?.imgDataUrlToObjectUrl) {
            this.turndownService.addRule('data-url-to-pseudo-object-url', {
                filter: (node): node is HTMLImageElement => {
                    if (!(node instanceof HTMLElement)) return false;
                    return node.tagName === 'IMG' && node.getAttribute('src')?.startsWith('data:') || false;
                },
                replacement: (content, node) => {
                    // We can safely assert type here because our filter guarantees it's an HTMLImageElement
                    const imgNode = node as HTMLImageElement;
                    const src = imgNode.src || '';
                    const alt = this.cleanAttribute(imgNode.alt) || '';
                    const hash = createHash('md5').update(src).digest('hex');
                    return `![${alt}](blob:${hash})`;
                }
            });
        }

        // Add custom rules if provided
        if (options?.customRules) {
            for (const [k, v] of Object.entries(options.customRules)) {
                this.turndownService.addRule(k, v);
            }
        }

        // Improved paragraph handling
        this.turndownService.addRule('improved-paragraph', {
            filter: 'p',
            replacement: (innerText) => {
                const trimmed = innerText.trim();
                if (!trimmed) {
                    return '';
                }
                return `${trimmed.replace(/\n{3,}/g, '\n\n')}\n\n`;
            }
        });

        // Add GFM support unless disabled
        if (!options?.noGfm) {
            if (options?.noGfm === 'table') {
                this.turndownService.use(turndownPluginGfm.strikethrough);
                this.turndownService.use(turndownPluginGfm.taskListItems);
            } else {
                this.turndownService.use(turndownPluginGfm.gfm);
            }
        }
    }

    private cleanAttribute(attr?: string | null): string {
        return attr ? attr.trim().replace(/\s+/g, ' ') : '';
    }

    private cleanHTML(html: string): string {
        // Remove script tags and their contents
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove style tags and their contents
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        // Remove comments
        html = html.replace(/<!--[\s\S]*?-->/g, '');

        return html.trim();
    }

    private extractMainContent(document: Document): Element {
        // Try to find the main content using common selectors
        const selectors = [
            'article',
            '[role="main"]',
            'main',
            '#main-content',
            '.main-content',
            '#content',
            '.content',
            '#main',
            '.main',
            '.post-content',
            '.article-content'
        ];

        // For Wikipedia specifically
        if (document.location?.hostname?.includes('wikipedia.org')) {
            const content = document.querySelector('#mw-content-text');
            if (content) {
                // Remove navigation, edit links, and other non-content elements
                content.querySelectorAll('.navbox, .vertical-navbox, .sidebar, .mw-editsection, .mw-empty-elt').forEach(el => el.remove());
                return content;
            }
        }

        // Try each selector
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        // Fallback to body if no main content container found
        return document.body;
    }

    private cleanupDocument(document: Document): void {
        // First identify potential main content containers to preserve
        const contentSelectors = [
            'article',
            '[role="main"]',
            'main',
            '#main-content',
            '.main-content',
            '#content',
            '.content',
            '#main',
            '.main',
            '.post-content',
            '.article-content'
        ];

        // Find and mark content elements to preserve
        const contentElements = new Set<Element>();
        contentSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                contentElements.add(el);
                // Also preserve all parent elements
                let parent = el.parentElement;
                while (parent) {
                    contentElements.add(parent);
                    parent = parent.parentElement;
                }
            });
        });

        // Common navigation and irrelevant elements to remove
        const selectorsToRemove = [
            'nav',
            'header',
            'footer',
            '#header',
            '#footer',
            '.header',
            '.footer',
            '.navigation',
            '.nav',
            '.sidebar',
            '.menu',
            '.comments',
            '.advertisement',
            '.ads',
            '.social-share',
            '.related-posts',
            '[role="navigation"]',
            '[role="complementary"]',
            '[role="banner"]',
            '[role="contentinfo"]'
        ];

        // Remove elements that match removal selectors but aren't in the content set
        selectorsToRemove.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!contentElements.has(el) && !Array.from(contentElements).some(content => content.contains(el))) {
                    el.remove();
                }
            });
        });
    }

    private extractPublishedTime(document: Document): string | undefined {
        // Special handling for Wikipedia
        if (document.location?.hostname?.includes('wikipedia.org')) {
            // Look for revision timestamp in the footer
            const revisionTimestamp = document.querySelector('#footer-info-lastmod')?.textContent?.match(/\d{1,2}\s+\w+\s+\d{4}/)?.[0];
            if (revisionTimestamp) {
                try {
                    const date = new Date(revisionTimestamp);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString();
                    }
                } catch (e) {
                    // If parsing fails, continue to other methods
                }
            }
        }

        // Common meta tag patterns for published time
        const timeSelectors = [
            'meta[property="article:published_time"]',
            'meta[property="og:published_time"]',
            'meta[name="published_time"]',
            'meta[name="date"]',
            'meta[name="article:published_time"]',
            'meta[itemprop="datePublished"]',
            'time[datetime]',
            'time[pubdate]',
            '[itemprop="datePublished"]',
            '.published-date',
            '.post-date',
            '.article-date'
        ];

        for (const selector of timeSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                // Check for content attribute (meta tags)
                const time = element.getAttribute('content') ||
                            element.getAttribute('datetime') ||
                            element.getAttribute('pubdate') ||
                            element.textContent;
                if (time) {
                    try {
                        // Try to parse and format the date
                        const date = new Date(time);
                        if (!isNaN(date.getTime())) {
                            return date.toISOString();
                        }
                    } catch (e) {
                        // If parsing fails, continue to next selector
                        continue;
                    }
                }
            }
        }
        return undefined;
    }

    /**
     * Convert HTML string to markdown
     * @param html HTML content to convert
     * @param url Optional source URL
     * @returns Markdown string
     */
    public htmlToMarkdown(html: string, url?: string): string {
        const cleanedHtml = this.cleanHTML(html);
        const dom = new JSDOM(cleanedHtml, { url });
        const document = dom.window.document;
        const title = document.querySelector('title')?.textContent || 'Untitled';
        const publishedTime = this.extractPublishedTime(document);

        // Clean up the document
        this.cleanupDocument(document);

        // Extract main content
        const mainContent = this.extractMainContent(document);

        // Handle tables for turndown-gfm plugin
        mainContent.querySelectorAll('table').forEach((table) => {
            Object.defineProperty(table, 'rows', {
                value: Array.from(table.querySelectorAll('tr')),
                enumerable: true
            });
        });

        const markdown = this.turndownService.turndown(mainContent.innerHTML);

        // Format with metadata header
        const header = [
            `Title: ${title}`,
            url ? `\nURL Source: ${url}` : '',
            publishedTime ? `\nPublished Time: ${publishedTime}` : '',
            '\nMarkdown Content:'
        ].filter(Boolean).join('\n');

        return `${header}\n${markdown}`;
    }

    /**
     * Fetch URL content and convert to markdown
     * @param url URL to fetch and convert
     * @returns Markdown string
     */
    public async urlToMarkdown(url: string): Promise<string> {
        try {
            const response = await axios.get(url);
            return this.htmlToMarkdown(response.data, url);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch URL: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Tidy up markdown content by fixing common issues
     * @param markdown Markdown content to clean
     * @returns Cleaned markdown string
     */
    public tidyMarkdown(markdown: string): string {
        // Handle complex broken links with text and optional images
        let normalizedMarkdown = markdown.replace(
            /\[\s*([^\]\n]+?)\s*\]\s*\(\s*([^)]+)\s*\)/g,
            (match, text, url) => {
                text = text.replace(/\s+/g, ' ').trim();
                url = url.replace(/\s+/g, '').trim();
                return `[${text}](${url})`;
            }
        );

        // Replace multiple empty lines with double line breaks
        normalizedMarkdown = normalizedMarkdown.replace(/\n{3,}/g, '\n\n');

        // Remove leading spaces from each line
        normalizedMarkdown = normalizedMarkdown.replace(/^[ \t]+/gm, '');

        return normalizedMarkdown.trim();
    }
}