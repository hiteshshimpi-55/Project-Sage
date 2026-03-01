#!/bin/bash

# 16KB Page Size Alignment Verification Script
# This script analyzes an Android App Bundle (AAB) to verify that all native libraries
# are aligned to 16KB page size boundaries

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if AAB file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No AAB file specified${NC}"
    echo "Usage: $0 <path-to-aab-file>"
    echo "Example: $0 app/build/outputs/bundle/release/app-release.aab"
    exit 1
fi

AAB_FILE="$1"

# Check if file exists
if [ ! -f "$AAB_FILE" ]; then
    echo -e "${RED}Error: File not found: $AAB_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}16KB Page Size Alignment Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Analyzing: ${YELLOW}$AAB_FILE${NC}"
echo ""

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Extract AAB
echo -e "${BLUE}Extracting AAB...${NC}"
unzip -q "$AAB_FILE" -d "$TEMP_DIR"

# Find all .so files
echo -e "${BLUE}Searching for native libraries (.so files)...${NC}"
echo ""

SO_FILES=$(find "$TEMP_DIR" -name "*.so" 2>/dev/null || true)

if [ -z "$SO_FILES" ]; then
    echo -e "${YELLOW}No native libraries found in AAB${NC}"
    exit 0
fi

# Count total files
TOTAL_COUNT=$(echo "$SO_FILES" | wc -l | tr -d ' ')
ALIGNED_COUNT=0
NON_ALIGNED_COUNT=0

echo -e "${BLUE}Found $TOTAL_COUNT native libraries${NC}"
echo ""
echo -e "${BLUE}Checking alignment...${NC}"
echo ""

# Array to store non-aligned files
declare -a NON_ALIGNED_FILES=()

# Check each .so file
while IFS= read -r so_file; do
    # Get relative path for cleaner output
    REL_PATH="${so_file#$TEMP_DIR/}"
    
    # Use readelf to check alignment
    if command -v readelf &> /dev/null; then
        # Get alignment from ELF header
        ALIGNMENT=$(readelf -l "$so_file" 2>/dev/null | grep -i "align" | head -n 1 | awk '{print $NF}')
        
        if [ -z "$ALIGNMENT" ]; then
            echo -e "${YELLOW}⚠ Could not determine alignment: $REL_PATH${NC}"
            continue
        fi
        
        # Convert hex to decimal
        ALIGNMENT_DEC=$((ALIGNMENT))
        
        # Check if aligned to 16KB (16384 bytes = 0x4000)
        if [ "$ALIGNMENT_DEC" -ge 16384 ]; then
            echo -e "${GREEN}✓ 16KB aligned ($ALIGNMENT): $REL_PATH${NC}"
            ALIGNED_COUNT=$((ALIGNED_COUNT + 1))
        else
            echo -e "${RED}✗ NOT 16KB aligned ($ALIGNMENT): $REL_PATH${NC}"
            NON_ALIGNED_FILES+=("$REL_PATH ($ALIGNMENT)")
            NON_ALIGNED_COUNT=$((NON_ALIGNED_COUNT + 1))
        fi
    else
        echo -e "${YELLOW}⚠ readelf not found - cannot verify alignment${NC}"
        echo -e "${YELLOW}  Install binutils: brew install binutils (macOS) or apt-get install binutils (Linux)${NC}"
        exit 1
    fi
done <<< "$SO_FILES"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total libraries found: ${BLUE}$TOTAL_COUNT${NC}"
echo -e "16KB aligned: ${GREEN}$ALIGNED_COUNT${NC}"
echo -e "Not aligned: ${RED}$NON_ALIGNED_COUNT${NC}"
echo ""

if [ "$NON_ALIGNED_COUNT" -gt 0 ]; then
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}NON-COMPLIANT LIBRARIES${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    for file in "${NON_ALIGNED_FILES[@]}"; do
        echo -e "${RED}✗ $file${NC}"
    done
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo -e "The following libraries are NOT aligned to 16KB page size."
    echo -e "This will cause your app to be rejected by Google Play."
    echo ""
    echo -e "${YELLOW}Recommended fixes:${NC}"
    echo -e "1. Update the dependencies that include these libraries"
    echo -e "2. Check package.json for outdated packages: ${BLUE}npm outdated${NC}"
    echo -e "3. Update specific packages: ${BLUE}npm update <package-name>${NC}"
    echo -e "4. If no update available, consider replacing with alternative libraries"
    echo ""
    exit 1
else
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ ALL LIBRARIES ARE 16KB ALIGNED${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}Your app is ready for Google Play!${NC}"
    echo ""
    exit 0
fi
