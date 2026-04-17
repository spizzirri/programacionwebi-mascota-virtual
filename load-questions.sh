#!/bin/bash

# =============================================================================
# MongoDB Question Loader
# =============================================================================
# Loads questions from CSV files into MongoDB for the Mascota Virtual project.
# Uses mongosh (MongoDB Shell) directly - no Node.js dependencies required.
#
# CSV Format (semicolon-separated):
#   pregunta;respuesta;'tema'
#
# The script extracts the topic from the CSV filename and inserts/updates
# questions in the 'questions' collection with fields: text, topic
#
# Usage:
#   ./load-questions.sh --uri <mongodb_uri> --files <csv1> [csv2] ...
#   ./load-questions.sh --env <path_to_env> --files <csv1> [csv2] ...
#   ./load-questions.sh --help
#
# Options:
#   --uri <mongodb_uri>     MongoDB connection URI (e.g., mongodb://localhost:27017/dbname)
#   --env <path>            Path to .env file containing MONGODB_URI (default: ./backend/.env)
#   --files <csv1> [csv2]   One or more CSV files to process
#   --help                  Show this help message
#
# Examples:
#   # Using MongoDB URI directly
#   ./load-questions.sh --uri mongodb://localhost:27017/tamagotchi --files HTML.csv introduccion.csv
#
#   # Using .env file (default)
#   ./load-questions.sh --files /home/user/HTML.csv /home/user/introduccion.csv
#
#   # Custom .env path
#   ./load-questions.sh --env /path/to/.env --files questions.csv
#
# Requirements:
#   - mongosh (MongoDB Shell) installed and in PATH
#   - MongoDB server running
#   - CSV files with semicolon delimiter: pregunta;respuesta;'tema'
#
# Install mongosh:
#   - Debian/Ubuntu: sudo apt-get install -y mongosh
#   - See: https://www.mongodb.com/docs/mongodb-shell/install/
#
# Notes:
#   - Questions are upserted (inserted or updated based on text+topic match)
#   - Topic is extracted from the CSV filename (e.g., HTML.csv -> "HTML")
#   - The answer column is read but not stored (only text and topic are saved)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/backend" && pwd)"
ENV_FILE="${BACKEND_DIR}/.env"
MONGODB_URI=""
CSV_FILES=()

# =============================================================================
# Helper functions
# =============================================================================

show_help() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}MongoDB Question Loader - Help${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}DESCRIPTION${NC}"
    echo "  Loads questions from CSV files into MongoDB for the Mascota Virtual project."
    echo "  Uses mongosh directly - no Node.js/mongoose required."
    echo ""
    echo -e "${BLUE}CSV FORMAT${NC}"
    echo "  Semicolon-separated: pregunta;respuesta;'tema'"
    echo ""
    echo -e "${BLUE}USAGE${NC}"
    echo "  ./load-questions.sh --uri <mongodb_uri> --files <csv1> [csv2] ..."
    echo "  ./load-questions.sh --env <path_to_env> --files <csv1> [csv2] ..."
    echo ""
    echo -e "${BLUE}OPTIONS${NC}"
    echo "  --uri <mongodb_uri>     MongoDB connection URI (overrides .env)"
    echo "  --env <path>            Path to .env file (default: backend/.env)"
    echo "  --files <csv1> [csv2]   CSV files to process"
    echo "  --help                  Show this help message"
    echo ""
    echo -e "${BLUE}EXAMPLES${NC}"
    echo "  # Using MongoDB URI directly"
    echo "  ./load-questions.sh --uri mongodb://localhost:27017/tamagotchi --files HTML.csv"
    echo ""
    echo "  # Using .env file (default)"
    echo "  ./load-questions.sh --files /path/to/HTML.csv /path/to/introduccion.csv"
    echo ""
    echo "  # Custom .env path"
    echo "  ./load-questions.sh --env /path/to/.env --files questions.csv"
    echo ""
    echo -e "${BLUE}REQUIREMENTS${NC}"
    echo "  - mongosh installed (MongoDB Shell)"
    echo "  - MongoDB server running"
    echo ""
    echo -e "${BLUE}INSTALL MONGOSH${NC}"
    echo "  See: https://www.mongodb.com/docs/mongodb-shell/install/"
    echo ""
    echo "  Debian/Ubuntu (via MongoDB repo):"
    echo "    sudo apt-get install -y mongosh"
    echo ""
    echo "  macOS (via Homebrew):"
    echo "    brew install mongosh"
    echo ""
    exit 0
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =============================================================================
# Parse arguments
# =============================================================================

if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No arguments provided${NC}"
    echo ""
    echo "Run with --help for usage information"
    exit 1
fi

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h)
            show_help
            ;;
        --uri)
            if [ -z "$2" ]; then
                log_error "--uri requires a value"
                exit 1
            fi
            MONGODB_URI="$2"
            shift 2
            ;;
        --env)
            if [ -z "$2" ]; then
                log_error "--env requires a value"
                exit 1
            fi
            ENV_FILE="$2"
            shift 2
            ;;
        --files)
            shift
            while [[ $# -gt 0 && ! "$1" =~ ^-- ]]; do
                CSV_FILES+=("$1")
                shift
            done
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Run with --help for usage information"
            exit 1
            ;;
    esac
done

# Validate arguments
if [ ${#CSV_FILES[@]} -eq 0 ]; then
    log_error "No CSV files provided. Use --files to specify CSV files"
    exit 1
fi

# If --env specified, extract MONGODB_URI from it
if [ -n "$ENV_FILE" ] && [ -z "$MONGODB_URI" ]; then
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found: ${ENV_FILE}"
        exit 1
    fi

    MONGODB_URI=$(grep '^MONGODB_URI=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '[:space:]')

    if [ -z "$MONGODB_URI" ]; then
        log_error "MONGODB_URI not found in .env file: ${ENV_FILE}"
        exit 1
    fi
fi

if [ -z "$MONGODB_URI" ]; then
    log_error "MongoDB URI not provided. Use --uri or --env"
    exit 1
fi

# =============================================================================
# Check for mongosh
# =============================================================================

if ! command -v mongosh &> /dev/null; then
    log_error "mongosh is not installed or not in PATH"
    echo ""
    echo -e "${YELLOW}Install mongosh:${NC}"
    echo "  Debian/Ubuntu: sudo apt-get install -y mongosh"
    echo "  macOS:         brew install mongosh"
    echo "  Docs:          https://www.mongodb.com/docs/mongodb-shell/install/"
    exit 1
fi

log_info "mongosh found: $(which mongosh)"
log_info "mongosh version: $(mongosh --version 2>/dev/null || echo 'unknown')"

# =============================================================================
# Main execution
# =============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MongoDB Question Loader${NC}"
echo -e "${GREEN}========================================${NC}"

log_info "MongoDB URI: ${YELLOW}${MONGODB_URI}${NC}"
log_info "Files to process: ${#CSV_FILES[@]}"
echo ""

# Extract database name from URI
DB_NAME=$(echo "$MONGODB_URI" | sed -n 's|.*://[^/]*/\([^?]*\).*|\1|p')
if [ -z "$DB_NAME" ]; then
    DB_NAME="tamagotchi"
    log_warn "Could not extract database name from URI, using default: ${DB_NAME}"
fi

log_info "Database: ${DB_NAME}"
echo ""

# Global counters
TOTAL_INSERTED=0
TOTAL_UPDATED=0
TOTAL_ERRORS=0

# =============================================================================
# Process each CSV file
# =============================================================================

for csv_file in "${CSV_FILES[@]}"; do
    if [ ! -f "$csv_file" ]; then
        log_error "File not found: ${csv_file}"
        echo ""
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
        continue
    fi

    echo -e "${BLUE}📄 Processing: $(basename "$csv_file")${NC}"

    # Extract topic from filename
    TOPIC=$(basename "$csv_file" .csv)

    # Count data lines (skip header)
    TOTAL_LINES=$(tail -n +2 "$csv_file" | grep -c '[^[:space:]]' || true)
    log_info "Found ${TOTAL_LINES} questions for topic: \"${TOPIC}\""

    FILE_INSERTED=0
    FILE_UPDATED=0
    FILE_ERRORS=0

    # Create temporary mongosh script
    TEMP_JS=$(mktemp /tmp/mongo_load_XXXXXX.js)

    # Add database selection to JS
    echo "db = db.getSiblingDB('${DB_NAME}');" > "$TEMP_JS"

    # Read CSV and generate mongosh commands
    {
        # Skip header line
        read -r HEADER || true

        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines or lines that are just whitespace
            [[ -z "${line// }" ]] && continue

            # Split by semicolon more robustly
            # Using parameter expansion to avoid subshells and issues with echo/sed
            QUESTION=$(echo "$line" | cut -d';' -f1 | xargs)
            ANSWER=$(echo "$line" | cut -d';' -f2 | xargs)

            if [ -z "$QUESTION" ]; then
                continue
            fi

            # Escape single quotes for JavaScript by replacing ' with \'
            QUESTION_JS="${QUESTION//\'/\\\'}"
            ANSWER_JS="${ANSWER//\'/\\\'}"
            TOPIC_JS="${TOPIC//\'/\\\'}"

            # Append upsert command
            cat << EOF
try {
    const result = db.questions.updateOne(
        { text: '${QUESTION_JS}', topic: '${TOPIC_JS}' },
        {
            \$set: {
                text: '${QUESTION_JS}',
                topic: '${TOPIC_JS}',
                answer: '${ANSWER_JS}'
            },
            \$setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
    );

    if (result.upsertedId) {
        print('RES_INSERTED');
    } else if (result.matchedCount > 0) {
        print('RES_UPDATED');
    }
} catch (e) {
    print('RES_ERROR: ' + e.message);
}
EOF
        done
    } < "$csv_file" >> "$TEMP_JS"

    # Execute with mongosh
    echo -e "${YELLOW}   Importing...${NC}"

    OUTPUT=$(mongosh "$MONGODB_URI" --quiet "$TEMP_JS" 2>&1) || true

    # Count results
    FILE_INSERTED=$(echo "$OUTPUT" | grep -c 'RES_INSERTED' || true)
    FILE_UPDATED=$(echo "$OUTPUT" | grep -c 'RES_UPDATED' || true)
    FILE_ERRORS=$(echo "$OUTPUT" | grep -c 'RES_ERROR:' || true)

    # Show errors if any
    if [ "$FILE_ERRORS" -gt 0 ]; then
        echo -e "${RED}   Errors found during import:${NC}"
        echo "$OUTPUT" | grep 'RES_ERROR:' | head -5 | while read -r err; do
            echo -e "${RED}   ${err#RES_}${NC}"
        done
    fi

    # Diagnostic: if total count is 0 but we expected more, show the output
    if [ $((FILE_INSERTED + FILE_UPDATED + FILE_ERRORS)) -eq 0 ] && [ "$TOTAL_LINES" -gt 0 ]; then
        log_warn "Import process produced no results. Raw output from mongosh:"
        echo -e "${YELLOW}${OUTPUT}${NC}"
    fi

    log_info "Inserted: ${FILE_INSERTED}, Updated: ${FILE_UPDATED}, Errors: ${FILE_ERRORS}"
    echo ""

    # Accumulate
    TOTAL_INSERTED=$((TOTAL_INSERTED + FILE_INSERTED))
    TOTAL_UPDATED=$((TOTAL_UPDATED + FILE_UPDATED))
    TOTAL_ERRORS=$((TOTAL_ERRORS + FILE_ERRORS))

    # Clean up
    rm -f "$TEMP_JS"
done

# =============================================================================
# Summary
# =============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}📊 Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "   ✅ Inserted: ${TOTAL_INSERTED}"
echo -e "   🔄 Updated:  ${TOTAL_UPDATED}"
echo -e "   ❌ Errors:   ${TOTAL_ERRORS}"
echo -e "${GREEN}========================================${NC}"

if [ "$TOTAL_ERRORS" -gt 0 ]; then
    exit 1
fi
