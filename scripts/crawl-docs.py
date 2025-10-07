#!/usr/bin/env python3
"""
Documentation Website Scraper using Crawl4AI
Crawls documentation sites and converts to markdown for indexing
"""

import asyncio
import sys
import json
import os
from pathlib import Path
from urllib.parse import urlparse
from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import LLMExtractionStrategy


async def scrape_single_page(url, output_dir, filename_prefix=""):
    """Scrape a single page and save to markdown"""
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url)

        if not result.success:
            print(f"Error: Failed to crawl {url}", file=sys.stderr)
            return False

        # Extract title from metadata or HTML
        title = "Documentation"
        if result.metadata and isinstance(result.metadata, dict):
            title = result.metadata.get('title', 'Documentation')

        # Generate filename from URL
        parsed = urlparse(url)
        if filename_prefix:
            filename = f"{filename_prefix}.md"
        else:
            path_parts = parsed.path.strip('/').replace('/', '_')
            filename = f"{path_parts or 'index'}.md"

        filepath = Path(output_dir) / filename

        # Create output directory
        filepath.parent.mkdir(parents=True, exist_ok=True)

        # Write markdown
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"# {title}\n\n")
            f.write(f"Source: {url}\n\n")
            f.write("---\n\n")
            f.write(result.markdown)

        print(f"✓ Saved: {filepath}")
        return True


async def scrape_site(start_url, output_dir, max_pages=50, depth=2):
    """Crawl entire documentation site"""
    visited = set()
    to_visit = [(start_url, 0)]  # (url, depth)
    parsed_base = urlparse(start_url)
    pages_scraped = 0

    print(f"🚀 Starting documentation crawl")
    print(f"   Base URL: {parsed_base.scheme}://{parsed_base.netloc}")
    print(f"   Max pages: {max_pages}")
    print(f"   Max depth: {depth}\n")

    async with AsyncWebCrawler() as crawler:
        while to_visit and pages_scraped < max_pages:
            url, current_depth = to_visit.pop(0)

            if url in visited or current_depth > depth:
                continue

            visited.add(url)

            # Scrape page
            result = await crawler.arun(url)

            if not result.success:
                print(f"✗ Failed: {url}")
                continue

            # Extract title from metadata
            title = "Documentation"
            if result.metadata and isinstance(result.metadata, dict):
                title = result.metadata.get('title', 'Documentation')

            # Save page
            parsed = urlparse(url)
            path_parts = parsed.path.strip('/').replace('/', '_')
            filename = f"{path_parts or 'index'}.md"
            filepath = Path(output_dir) / filename
            filepath.parent.mkdir(parents=True, exist_ok=True)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"# {title}\n\n")
                f.write(f"Source: {url}\n\n")
                f.write("---\n\n")
                f.write(result.markdown)

            print(f"✓ [{pages_scraped + 1}/{max_pages}] {filepath}")
            pages_scraped += 1

            # Extract links for further crawling (only from same domain)
            if current_depth < depth and result.links:
                # Get internal links from the crawl result
                internal_links = result.links.get('internal', [])
                for link_obj in internal_links:
                    link_url = link_obj.get('href', '')
                    if link_url and link_url not in visited:
                        to_visit.append((link_url, current_depth + 1))

            # Be nice to servers
            await asyncio.sleep(0.5)

    print(f"\n✅ Done! Scraped {pages_scraped} pages to {output_dir}")
    return pages_scraped


async def main():
    if len(sys.argv) < 3:
        print("""Documentation Website Scraper using Crawl4AI

Usage: python3 crawl-docs.py <url> <output-dir> [options]

Arguments:
  url           URL to scrape
  output-dir    Directory to save markdown files

Options:
  --max-pages N     Maximum pages to scrape (default: 50)
  --depth N         Maximum crawl depth (default: 2)
  --single          Scrape only the single page (no crawling)

Examples:
  # Scrape single page
  python3 crawl-docs.py https://docs.astro.build ./astro-docs --single

  # Crawl entire site
  python3 crawl-docs.py https://docs.astro.build ./astro-docs

  # Custom limits
  python3 crawl-docs.py https://docs.astro.build ./astro-docs --max-pages 100 --depth 3
""")
        sys.exit(1)

    url = sys.argv[1]
    output_dir = sys.argv[2]

    # Parse options
    max_pages = 50
    depth = 2
    single_page = False

    i = 3
    while i < len(sys.argv):
        if sys.argv[i] == '--max-pages' and i + 1 < len(sys.argv):
            max_pages = int(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == '--depth' and i + 1 < len(sys.argv):
            depth = int(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == '--single':
            single_page = True
            i += 1
        else:
            i += 1

    try:
        if single_page:
            success = await scrape_single_page(url, output_dir)
            if success:
                print(f"\nNext steps:")
                print(f"  1. Review the scraped content in {output_dir}")
                print(f"  2. Index it: npm run dev -- index create {output_dir} --collection docs")
                print(f"  3. Search it: npm run dev -- search \"your query\" --collection docs")
            sys.exit(0 if success else 1)
        else:
            pages = await scrape_site(url, output_dir, max_pages, depth)
            print(f"\nNext steps:")
            print(f"  1. Review the scraped content in {output_dir}")
            print(f"  2. Index it: npm run dev -- index create {output_dir} --collection docs")
            print(f"  3. Search it: npm run dev -- search \"your query\" --collection docs")
            sys.exit(0 if pages > 0 else 1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
