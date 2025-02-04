# Web to Markdown Converter

A utility class that converts web content (URLs or HTML) to markdown format. This is extracted and adapted from the [Jina AI Reader project](https://r.jina.ai).

## Features

- Convert HTML content to markdown
- Convert URLs to markdown by fetching and converting their content
- Support for GitHub Flavored Markdown (GFM)
- Configurable image handling
- Clean and tidy markdown output
- TypeScript support

## Installation

```bash
npm install web-to-markdown
# or
yarn add web-to-markdown
# or
pnpm add web-to-markdown
```

## Usage

### Basic Usage

```typescript
import { WebToMarkdownConverter } from 'web-to-markdown';

// Create a converter instance
const converter = new WebToMarkdownConverter();

// Convert HTML to markdown
const html = '<h1>Hello World</h1><p>This is a test</p>';
const markdown = converter.htmlToMarkdown(html);
console.log(markdown);

// Convert URL to markdown
const url = 'https://example.com';
converter.urlToMarkdown(url)
  .then(markdown => console.log(markdown))
  .catch(error => console.error(error));
```

### Advanced Usage

```typescript
import { WebToMarkdownConverter, WebToMarkdownOptions } from 'web-to-markdown';

// Configure the converter with options
const options: WebToMarkdownOptions = {
  retainImages: 'all',  // Keep all images in the markdown output
  noGfm: false,         // Enable GitHub Flavored Markdown
  imgDataUrlToObjectUrl: true, // Convert data URLs to blob URLs for images
};

const converter = new WebToMarkdownConverter(options);

// Convert HTML with custom options
const html = '<h1>Hello World</h1><p>This is a test</p>';
let markdown = converter.htmlToMarkdown(html);

// Clean up the markdown if needed
markdown = converter.tidyMarkdown(markdown);
```

## API Reference

### WebToMarkdownConverter

#### Constructor Options

- `retainImages`: Control how images are handled
  - `'none'`: Remove all images
  - `'alt'`: Keep only alt text
  - `'alt_p'`: Keep alt text in parentheses
  - `'all'`: Keep all images (default)
- `noGfm`: Disable GitHub Flavored Markdown features
  - `false`: Enable all GFM features (default)
  - `true`: Disable all GFM features
  - `'table'`: Disable only GFM tables
- `imgDataUrlToObjectUrl`: Convert data URLs to blob URLs for images
- `customRules`: Add custom turndown rules
- `customKeep`: Specify elements to keep in the output

#### Methods

- `htmlToMarkdown(html: string): string`
  Convert HTML string to markdown

- `urlToMarkdown(url: string): Promise<string>`
  Fetch URL content and convert to markdown

- `tidyMarkdown(markdown: string): string`
  Clean up markdown content by fixing common issues

## License

MIT
# web2md
# web2md
# web2md
# web2md
