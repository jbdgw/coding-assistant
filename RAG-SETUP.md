# RAG (Retrieval-Augmented Generation) Setup Guide

This CLI includes RAG capabilities for semantic code search and retrieval. Here's how to get it set up.

## Prerequisites

### 1. Ollama (for embeddings)

**Install Ollama:**
```bash
brew install ollama
```

**Start Ollama:**
```bash
ollama serve
```

**Pull the embedding model:**
```bash
ollama pull dengcao/Qwen3-Embedding-0.6B:Q8_0
```

**Verify:**
```bash
ollama list
# Should show: dengcao/Qwen3-Embedding-0.6B:Q8_0
```

### 2. ChromaDB (vector database)

**Using Docker (recommended):**
```bash
# Start ChromaDB
./chromadb.sh start

# Check status
./chromadb.sh status

# View logs
./chromadb.sh logs

# Stop when done
./chromadb.sh stop
```

**Manual Docker command:**
```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
```

### 3. Crawl4AI (optional - for documentation scraping)

**For scraping documentation websites!** Converts any documentation site to markdown automatically.

✅ **100% Free** - open-source, runs locally
✅ **LLM-friendly** - designed for AI knowledge bases
✅ **Fast** - async crawling with JavaScript rendering

Install:
```bash
./scripts/setup-crawl4ai.sh
```

Or manually:
```bash
pip3 install --user --break-system-packages crawl4ai
```

## Configuration

Run the initialization command and answer the prompts:

```bash
npm run dev -- init
```

When prompted about RAG setup:
- Select "Yes" for RAG setup
- All dependencies are local and free!
  - No API keys required
  - Works 100% offline

Alternatively, set environment variables in `.env`:

```bash
# Ollama (for embeddings)
OLLAMA_BASE_URL=http://localhost:11434

# ChromaDB (vector database)
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

## Verify Setup

Run the test script:

```bash
node test-rag.mjs
```

You should see:
```
✅ Ollama is accessible
✅ ChromaDB is accessible
✅ Generated embedding with 1024 dimensions
```

## Usage

### 1. Index a Codebase

```bash
# Index current directory
npm run dev -- index create .

# Index specific directory
npm run dev -- index create /path/to/project --collection my-project

# With custom settings
npm run dev -- index create ./src --collection frontend --file-types .ts,.tsx,.js
```

### 2. Search Indexed Code

```bash
# Basic search
npm run dev -- search "authentication function"

# Search specific collection
npm run dev -- search "user login" --collection my-project

# More results
npm run dev -- search "database query" --top-k 10
```

### 3. Chat with RAG

Simply start a chat - RAG will automatically search indexed code when relevant:

```bash
npm run dev -- chat
```

The assistant will automatically:
- Search your indexed codebases for relevant code
- Show you which files were referenced
- Provide answers based on your actual code

### 4. Manage Collections

```bash
# List all collections
npm run dev -- index list

# View collection stats
npm run dev -- index stats my-project

# Delete a collection
npm run dev -- index delete my-project
```

## Architecture

- **Ollama**: Generates 1024-dimensional embeddings using Qwen3-Embedding model
- **ChromaDB**: Stores and queries vector embeddings
- **Unstructured.io**: Parses complex file formats (PDF, DOCX, etc.)
- **Mastra RAG**: Provides document chunking and retrieval tools

## Supported File Types

### Without Unstructured.io (works out of the box):
- **Programming Languages**: `.py`, `.js`, `.ts`, `.tsx`, `.jsx`, `.go`, `.rs`, `.java`, `.cpp`, `.c`, `.h`, `.hpp`, `.rb`, `.php`, `.swift`, `.kt`, `.scala`
- **Web**: `.html`, `.css`, `.scss`, `.sass`, `.less`, `.xml`
- **Config/Data**: `.json`, `.yml`, `.yaml`, `.toml`, `.ini`, `.env`
- **Scripts**: `.sh`, `.bash`, `.zsh`, `.fish`
- **Markup**: `.md`, `.txt`
- **Query Languages**: `.sql`, `.graphql`, `.proto`

### Documentation Websites (with Crawl4AI):
- Any documentation site (auto-converts to markdown)
- Examples: docs.astro.build, react.dev, vuejs.org, etc.

### PDFs (with local tools):
- Use `pdf2txt.sh` script for simple conversion
- See "Working with PDFs" section below

## Troubleshooting

### Ollama not accessible
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### ChromaDB not accessible
```bash
# Check status
./chromadb.sh status

# Restart
./chromadb.sh restart

# View logs
./chromadb.sh logs
```

### Embeddings failing
```bash
# Verify model is downloaded
ollama list

# Re-download if needed
ollama pull dengcao/Qwen3-Embedding-0.6B:Q8_0
```

### Index creation failing
- Check that both Ollama and ChromaDB are running
- Verify file permissions on the directory you're indexing
- Check logs for specific errors

## Performance Tips

1. **Chunk Size**: Default is 512 tokens with 50 token overlap
   - Larger chunks = more context, fewer chunks
   - Smaller chunks = more precise matches, more chunks

2. **Collection Management**: Create separate collections for different projects
   - Faster searches
   - Better isolation
   - Easier to manage

3. **File Exclusions**: The indexer automatically excludes:
   - `node_modules/`
   - `.git/`
   - `dist/`, `build/`, `.next/`
   - Add more via `--exclude` flag

4. **Batch Processing**: Large codebases are processed in batches of 50 files
   - Prevents memory issues
   - More stable indexing

## Advanced Configuration

Edit the indexer configuration in `src/lib/indexer.ts`:

```typescript
{
  collectionName: 'my-collection',
  fileTypes: ['.ts', '.js'],        // Limit file types
  exclude: ['node_modules', 'dist'], // Add exclusions
  chunkSize: 512,                    // Adjust chunk size
  chunkOverlap: 50,                  // Adjust overlap
  batchSize: 50                      // Batch size for processing
}
```

## Cost Considerations

**Everything is 100% Free!**

- **Ollama**: ✅ Free, runs locally
- **ChromaDB**: ✅ Free, runs locally
- **Crawl4AI**: ✅ Free, open-source
- **Code indexing**: ✅ Free, no API keys
- **Documentation scraping**: ✅ Free, no limits
- **PDF conversion**: ✅ Free local tools

**Total monthly cost: $0.00** 🎉

## Scraping Documentation Sites (100% Free)

Use Crawl4AI to scrape and index documentation:

```bash
# Setup (one-time)
./scripts/setup-crawl4ai.sh

# Scrape a docs site and auto-index
npm run dev -- scrape https://docs.astro.build --collection astro

# Scrape specific page only
npm run dev -- scrape https://docs.react.dev/learn --single-page --collection react

# Custom options
npm run dev -- scrape https://vuejs.org/guide/ --max-pages 100 --depth 3 --collection vue
```

**Benefits**:
- Automatic HTML → Markdown conversion
- JavaScript rendering support
- Respects site structure
- Perfect for building knowledge bases

See `CRAWL4AI-GUIDE.md` for more examples.

---

## Working with PDFs (100% Free)

For PDFs, use local conversion tools:

### Option 1: Use `pdftotext` (Simplest)

```bash
# Install
brew install poppler

# Convert PDF to text
pdftotext document.pdf document.txt

# Index the text file
npm run dev -- index create ./converted-docs --collection my-docs
```

### Option 2: Use Python `pypdf` (Better formatting)

```bash
# Create converter script
cat > pdf2txt.py << 'EOF'
#!/usr/bin/env python3
import sys
from pypdf import PdfReader

pdf = PdfReader(sys.argv[1])
text = "\n\n".join(page.extract_text() for page in pdf.pages)

output = sys.argv[1].replace('.pdf', '.txt')
with open(output, 'w') as f:
    f.write(text)
print(f"✓ Converted to {output}")
EOF

chmod +x pdf2txt.py

# Convert PDF
python3 pdf2txt.py document.pdf

# Index
npm run dev -- index create . --collection docs
```

### Option 3: Use `marker` (Best quality - AI-powered)

```bash
# Install marker (uses local ML models)
pip3 install --user --break-system-packages marker-pdf

# Convert PDF to Markdown
marker_single document.pdf --output_dir ./converted

# Index the markdown
npm run dev -- index create ./converted --collection docs
```

### Option 4: Batch convert all PDFs

```bash
# Convert all PDFs in a directory
for pdf in docs/*.pdf; do
    pdftotext "$pdf" "${pdf%.pdf}.txt"
done

# Index all converted files
npm run dev -- index create ./docs --collection my-docs
```

## Next Steps

1. **Index your codebase**:
   ```bash
   npm run dev -- index create ./src --collection my-project
   ```

2. **Scrape documentation** (if you installed Crawl4AI):
   ```bash
   npm run dev -- scrape https://docs.astro.build --collection astro
   ```

3. **Search your knowledge base**:
   ```bash
   npm run dev -- search "components" --collection astro
   ```

4. **Chat with your knowledge**:
   ```bash
   npm run dev -- chat
   # Ask: "How do I create a component in Astro?"
   ```

The assistant will automatically reference your indexed code and documentation!
