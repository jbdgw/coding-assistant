#!/bin/bash

# PDF to Text Converter
# Converts PDFs to text files for indexing without expensive API

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_help() {
    echo "PDF to Text Converter"
    echo ""
    echo "Usage: ./pdf2txt.sh [options] <input>"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -o, --output DIR    Output directory (default: same as input)"
    echo "  -f, --format FMT    Output format: txt or md (default: txt)"
    echo "  -r, --recursive     Process subdirectories"
    echo ""
    echo "Examples:"
    echo "  ./pdf2txt.sh document.pdf              # Convert single PDF"
    echo "  ./pdf2txt.sh docs/                     # Convert all PDFs in directory"
    echo "  ./pdf2txt.sh -r -o converted docs/     # Recursive with custom output"
    echo "  ./pdf2txt.sh -f md document.pdf        # Convert to markdown"
}

# Check if pdftotext is installed
if ! command -v pdftotext &> /dev/null; then
    echo -e "${RED}Error: pdftotext not found${NC}"
    echo "Install with: brew install poppler"
    exit 1
fi

# Default options
OUTPUT_DIR=""
FORMAT="txt"
RECURSIVE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_help
            exit 0
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -r|--recursive)
            RECURSIVE=true
            shift
            ;;
        *)
            INPUT="$1"
            shift
            ;;
    esac
done

# Validate input
if [ -z "$INPUT" ]; then
    echo -e "${RED}Error: No input specified${NC}"
    print_help
    exit 1
fi

if [ ! -e "$INPUT" ]; then
    echo -e "${RED}Error: '$INPUT' not found${NC}"
    exit 1
fi

# Convert a single PDF
convert_pdf() {
    local pdf="$1"
    local output_file

    if [ -n "$OUTPUT_DIR" ]; then
        mkdir -p "$OUTPUT_DIR"
        local basename=$(basename "$pdf" .pdf)
        output_file="$OUTPUT_DIR/$basename.$FORMAT"
    else
        output_file="${pdf%.pdf}.$FORMAT"
    fi

    echo -e "${BLUE}Converting:${NC} $pdf"

    if pdftotext "$pdf" "$output_file" 2>/dev/null; then
        # Check if file has content
        if [ -s "$output_file" ]; then
            local lines=$(wc -l < "$output_file")
            echo -e "${GREEN}✓${NC} Created: $output_file ($lines lines)"
        else
            echo -e "${RED}✗${NC} Empty file: $output_file"
            rm "$output_file"
        fi
    else
        echo -e "${RED}✗${NC} Failed: $pdf"
    fi
}

# Process input
if [ -f "$INPUT" ]; then
    # Single file
    if [[ "$INPUT" == *.pdf ]]; then
        convert_pdf "$INPUT"
    else
        echo -e "${RED}Error: '$INPUT' is not a PDF file${NC}"
        exit 1
    fi
elif [ -d "$INPUT" ]; then
    # Directory
    echo -e "${BLUE}Scanning for PDFs in:${NC} $INPUT"

    FIND_CMD="find \"$INPUT\" -name '*.pdf'"
    if [ "$RECURSIVE" = false ]; then
        FIND_CMD="$FIND_CMD -maxdepth 1"
    fi

    PDF_COUNT=0
    while IFS= read -r pdf; do
        convert_pdf "$pdf"
        ((PDF_COUNT++))
    done < <(eval $FIND_CMD)

    if [ $PDF_COUNT -eq 0 ]; then
        echo -e "${RED}No PDF files found${NC}"
        exit 1
    fi

    echo ""
    echo -e "${GREEN}Done!${NC} Converted $PDF_COUNT PDF(s)"
else
    echo -e "${RED}Error: '$INPUT' is neither a file nor directory${NC}"
    exit 1
fi
