# Web to Markdown Converter

Web to markdown conversion utility adapted from the [Jina AI Reader API](https://r.jina.ai). Convert web pages and HTML content into clean, well-formatted markdown.

## Overview

The converter handles various aspects of web content conversion:
- Extracts and preserves main content while removing navigation, ads, and other irrelevant elements
- Maintains document structure and formatting
- Supports GitHub Flavored Markdown features
- Handles Wikipedia pages 
- Preserves metadata like titles and publication dates
- Manages images and tables appropriately

## Installation

```bash
npm install web-to-markdown
# or
yarn add web-to-markdown
# or
pnpm add web-to-markdown
```

## Basic Usage

```typescript
import { WebToMarkdownConverter } from 'web-to-markdown';

// Create a converter instance
const converter = new WebToMarkdownConverter();

// Convert a URL to markdown
const url = 'https://en.wikipedia.org/wiki/Dark0de';
const markdown = await converter.urlToMarkdown(url);

// Or convert HTML directly
const html = '<article><h1>Hello World</h1><p>Content here</p></article>';
const markdown = converter.htmlToMarkdown(html);
```

## Configuration Options

The converter can be customized with various options:

```typescript
const converter = new WebToMarkdownConverter({
    // Control image handling
    retainImages: 'all',    // 'none' | 'alt' | 'alt_p' | 'all'
    
    // GitHub Flavored Markdown support
    noGfm: false,           // true | false | 'table'
    
    // Image data URL handling
    imgDataUrlToObjectUrl: true,
    
    // Custom rules and filters
    customRules: {},
    customKeep: null
});
```

## Features

### Content Extraction
- Intelligent main content detection
- Removal of navigation, ads, and irrelevant elements
- Special handling for Wikipedia pages
- Preservation of document structure

### Metadata Handling
- Extracts and includes page titles
- Preserves publication dates
- Maintains source URL information
- Supports custom metadata fields

### Markdown Formatting
- GitHub Flavored Markdown support
- Table formatting
- Image handling with multiple options
- Clean and consistent output

### Cleanup and Normalization
- Removes redundant whitespace
- Normalizes line endings
- Fixes common markdown formatting issues
- Handles special characters appropriately

## API Reference

### WebToMarkdownConverter Class

#### Methods

`htmlToMarkdown(html: string, url?: string): string`
- Converts HTML content to markdown
- Optionally accepts a source URL for reference

`urlToMarkdown(url: string): Promise<string>`
- Fetches and converts web page content to markdown
- Returns a promise resolving to the markdown string

`tidyMarkdown(markdown: string): string`
- Cleans and normalizes markdown content
- Fixes common formatting issues

#### Configuration Options

`WebToMarkdownOptions`:
- `retainImages`: Controls image handling
- `noGfm`: Toggles GitHub Flavored Markdown features
- `imgDataUrlToObjectUrl`: Handles image data URLs
- `customRules`: Adds custom conversion rules
- `customKeep`: Specifies elements to preserve

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

This project is based on the [Jina AI Reader API](https://r.jina.ai), adapted and modified for standalone use.
