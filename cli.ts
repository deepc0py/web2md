#!/usr/bin/env node

import { WebToMarkdownConverter } from './WebToMarkdownConverter';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

async function main() {
    const args = process.argv.slice(2);
    let input: string | undefined;
    let type = 'url';
    let outputFile: string | undefined;

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-toFile') {
            outputFile = args[++i];
        } else if (args[i] === '-type') {
            type = args[++i];
        } else if (!input) {
            input = args[i];
        }
    }

    if (!input) {
        console.error('Usage: web-to-markdown <input> [-type url|html] [-toFile output.md]');
        console.error('Examples:');
        console.error('  web-to-markdown https://example.com');
        console.error('  web-to-markdown "<h1>Hello</h1>" -type html');
        console.error('  web-to-markdown https://example.com -toFile output.md');
        process.exit(1);
    }

    const converter = new WebToMarkdownConverter();

    try {
        const markdown = type === 'url'
            ? await converter.urlToMarkdown(input)
            : converter.htmlToMarkdown(input);

        if (outputFile) {
            const fullPath = resolve(process.cwd(), outputFile);
            await writeFile(fullPath, markdown, 'utf-8');
            console.log(`Output saved to: ${fullPath}`);
        } else {
            console.log(markdown);
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Error:', String(error));
        }
        process.exit(1);
    }
}

main();