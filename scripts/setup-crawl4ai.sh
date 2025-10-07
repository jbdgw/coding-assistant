#!/bin/bash

# Crawl4AI Setup Script
# Installs Crawl4AI and its dependencies for documentation scraping

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Crawl4AI Setup for Documentation Scraping${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check Python
echo -e "${BLUE}1. Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found${NC}"
    echo "Install Python 3: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo -e "${GREEN}✓ Python ${PYTHON_VERSION} found${NC}\n"

# Check pip
echo -e "${BLUE}2. Checking pip installation...${NC}"
if ! python3 -m pip --version &> /dev/null; then
    echo -e "${RED}✗ pip not found${NC}"
    echo "Install pip: python3 -m ensurepip"
    exit 1
fi

echo -e "${GREEN}✓ pip found${NC}\n"

# Install Crawl4AI
echo -e "${BLUE}3. Installing Crawl4AI...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}\n"

if python3 -m pip install --user --break-system-packages crawl4ai; then
    echo -e "${GREEN}✓ Crawl4AI installed successfully${NC}\n"
else
    echo -e "${RED}✗ Failed to install Crawl4AI${NC}"
    echo "Try manually: pip3 install --user --break-system-packages crawl4ai"
    exit 1
fi

# Download browser (Chromium)
echo -e "${BLUE}4. Setting up browser...${NC}"
echo -e "${YELLOW}Downloading Chromium (required for crawling)...${NC}\n"

if python3 -c "from crawl4ai import AsyncWebCrawler; import asyncio; asyncio.run(AsyncWebCrawler().warmup())" 2>/dev/null; then
    echo -e "${GREEN}✓ Browser setup complete${NC}\n"
else
    echo -e "${YELLOW}⚠ Browser setup encountered issues (may still work)${NC}\n"
fi

# Verify installation
echo -e "${BLUE}5. Verifying installation...${NC}"
if python3 -c "import crawl4ai; print('OK')" 2>/dev/null | grep -q OK; then
    echo -e "${GREEN}✓ Crawl4AI is ready to use${NC}\n"
else
    echo -e "${RED}✗ Installation verification failed${NC}"
    exit 1
fi

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "You can now scrape documentation sites:"
echo -e "  ${BLUE}npm run dev -- scrape https://docs.astro.build${NC}\n"

echo "For more examples, see:"
echo -e "  ${BLUE}cat CRAWL4AI-GUIDE.md${NC}\n"
