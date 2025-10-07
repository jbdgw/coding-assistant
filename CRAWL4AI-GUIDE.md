# Crawl4AI Documentation Scraping Guide

Complete guide to scraping documentation websites with Crawl4AI for your knowledge base.

## What is Crawl4AI?

Crawl4AI is an open-source, LLM-friendly web crawler specifically designed for extracting documentation and converting it to markdown - perfect for RAG systems!

**Benefits:**
- ✅ **100% Free** - no API keys, no subscriptions
- ✅ **Fast** - async crawling with JavaScript rendering
- ✅ **Smart** - automatically extracts main content
- ✅ **Flexible** - configurable depth and page limits
- ✅ **Local** - runs entirely on your machine

## Setup

### One-time Installation

```bash
# Easy way - use our setup script
./scripts/setup-crawl4ai.sh

# Manual way
pip3 install --user --break-system-packages crawl4ai
```

### Verify Installation

```bash
python3 -c "import crawl4ai; print('✓ Crawl4AI installed')"
```

## Basic Usage

### Scrape Single Page

Perfect for scraping one specific documentation page:

```bash
npm run dev -- scrape https://docs.astro.build/en/tutorial/1-setup/ \
  --single-page \
  --collection astro \
  --output ./docs/astro
```

### Scrape Entire Site

Crawl multiple pages automatically:

```bash
npm run dev -- scrape https://docs.astro.build \
  --collection astro \
  --max-pages 100 \
  --depth 3
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--collection <name>` | Collection name for indexing | `docs` |
| `--output <dir>` | Output directory for markdown files | `./scraped-docs` |
| `--max-pages <N>` | Maximum pages to scrape | `50` |
| `--depth <N>` | Maximum crawl depth | `2` |
| `--single-page` | Scrape only one page (no crawling) | `false` |
| `--no-auto-index` | Skip automatic indexing | Auto-indexes by default |

## Real-World Examples

### Example 1: Astro Documentation

```bash
# Scrape Astro docs
npm run dev -- scrape https://docs.astro.build \
  --collection astro \
  --max-pages 200

# Search it
npm run dev -- search "components" --collection astro

# Chat with it
npm run dev -- chat
# Ask: "How do I create an Astro component?"
```

### Example 2: React Documentation

```bash
# Scrape React docs (specific section)
npm run dev -- scrape https://react.dev/learn \
  --collection react \
  --max-pages 100 \
  --depth 2

# Search
npm run dev -- search "hooks useState" --collection react
```

### Example 3: Vue.js Guide

```bash
# Scrape Vue guide
npm run dev -- scrape https://vuejs.org/guide/ \
  --collection vue \
  --max-pages 150

# Chat
npm run dev -- chat
# Ask: "What's the difference between ref and reactive in Vue?"
```

### Example 4: Python Library Docs

```bash
# Scrape FastAPI docs
npm run dev -- scrape https://fastapi.tiangolo.com \
  --collection fastapi \
  --max-pages 200

# Search
npm run dev -- search "dependency injection" --collection fastapi
```

### Example 5: Single Page Reference

```bash
# Just scrape the API reference page
npm run dev -- scrape https://docs.python.org/3/library/functions.html \
  --single-page \
  --collection python-ref
```

## Advanced Workflows

### Workflow 1: Build Library Knowledge Base

```bash
# 1. Scrape official docs
npm run dev -- scrape https://docs.library.com --collection mylib

# 2. Scrape tutorials
npm run dev -- scrape https://library-tutorials.com --collection mylib-tutorials

# 3. Index your project code
npm run dev -- index create ./src --collection my-project

# 4. Now chat with all three knowledge bases
npm run dev -- chat
# The assistant can reference docs, tutorials, AND your code!
```

### Workflow 2: Multiple Libraries

```bash
# Scrape multiple libraries into separate collections
npm run dev -- scrape https://docs.astro.build --collection astro
npm run dev -- scrape https://react.dev --collection react
npm run dev -- scrape https://tailwindcss.com/docs --collection tailwind

# Search across specific collection
npm run dev -- search "components" --collection react

# Or chat - the assistant searches all collections
npm run dev -- chat
```

### Workflow 3: Documentation Updates

```bash
# Re-scrape to update documentation
npm run dev -- index delete old-docs
npm run dev -- scrape https://docs.example.com --collection new-docs
```

## Tips & Best Practices

### 1. Start Small

```bash
# Start with single page to test
npm run dev -- scrape https://docs.example.com/intro --single-page

# Then expand if it works well
npm run dev -- scrape https://docs.example.com --max-pages 50
```

### 2. Use Descriptive Collection Names

```bash
# ✓ Good - clear what it contains
--collection astro-docs
--collection react-api-ref
--collection python-fastapi

# ✗ Bad - too generic
--collection docs
--collection stuff
```

### 3. Respect Rate Limits

The scraper includes a 0.5s delay between requests. For larger scrapes:

```bash
# Scrape in batches
npm run dev -- scrape https://docs.site.com/section1 --collection site --max-pages 50
npm run dev -- scrape https://docs.site.com/section2 --collection site --max-pages 50
```

### 4. Review Before Indexing

```bash
# Scrape without auto-indexing
npm run dev -- scrape https://docs.example.com --no-auto-index

# Review the markdown files
cat scraped-docs/*.md

# Index manually when satisfied
npm run dev -- index create ./scraped-docs --collection docs
```

### 5. Organize Output

```bash
# Use different output directories
npm run dev -- scrape https://react.dev --output ./docs/react
npm run dev -- scrape https://vuejs.org --output ./docs/vue
npm run dev -- scrape https://docs.astro.build --output ./docs/astro

# Then index all at once
npm run dev -- index create ./docs --collection frontend-frameworks
```

## Troubleshooting

### Issue: Crawl4AI not installed

**Error:**
```
Crawl4AI is not installed!
```

**Solution:**
```bash
./scripts/setup-crawl4ai.sh
```

### Issue: Slow scraping

**Cause:** Large sites with many pages

**Solutions:**
```bash
# 1. Reduce max pages
--max-pages 25

# 2. Reduce depth
--depth 1

# 3. Scrape specific sections only
npm run dev -- scrape https://docs.site.com/api-ref --max-pages 50
```

### Issue: Empty or bad markdown

**Cause:** Site structure not detected properly

**Solutions:**
```bash
# 1. Try single page first to verify
--single-page

# 2. If it's a SPA (Single Page App), wait for JavaScript
# (Crawl4AI handles this automatically)

# 3. Report issue - the site might need custom extraction
```

### Issue: Too many irrelevant pages

**Cause:** Crawler following all links

**Solutions:**
```bash
# 1. Use lower depth
--depth 1

# 2. Scrape specific subdirectory
npm run dev -- scrape https://docs.site.com/guides/ --max-pages 50

# 3. Use single-page for specific pages
--single-page
```

## Python Script Usage (Advanced)

You can also call the Python script directly:

```bash
# Single page
python3 scripts/crawl-docs.py https://docs.site.com ./output --single

# Full crawl
python3 scripts/crawl-docs.py https://docs.site.com ./output --max-pages 100 --depth 3
```

## Comparison with Alternatives

| Feature | Crawl4AI | Firecrawl | Unstructured.io |
|---------|----------|-----------|-----------------|
| **Cost** | Free | $20/month | $500/month |
| **Runs Locally** | ✅ Yes | ❌ No | ❌ No |
| **JavaScript Rendering** | ✅ Yes | ✅ Yes | ❌ No |
| **LLM-Friendly** | ✅ Yes | ✅ Yes | ⚠️ Partial |
| **Markdown Output** | ✅ Yes | ✅ Yes | ❌ No |
| **Setup Complexity** | Easy | Medium | Hard |
| **Rate Limits** | None | Yes | Yes |

## Next Steps

1. **Setup Crawl4AI**: `./scripts/setup-crawl4ai.sh`
2. **Try an example**: `npm run dev -- scrape https://docs.astro.build --collection astro`
3. **Search it**: `npm run dev -- search "components" --collection astro`
4. **Build your knowledge base!**

## Getting Help

- Check Crawl4AI docs: https://docs.crawl4ai.com/
- Report issues: https://github.com/unclecode/crawl4ai
- See main RAG guide: `RAG-SETUP.md`

---

**Happy Scraping! 🚀**
