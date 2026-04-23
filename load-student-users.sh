#!/bin/bash

# =============================================================================
# MongoDB User Loader
# =============================================================================
# Loads users from CSV files into MongoDB for the Mascota Virtual project.
# Uses mongosh (MongoDB Shell) directly - no Node.js dependencies required.
#
# CSV Format (comma-separated, from UNLaM export):
#   Column 1: Usuario (ID)
#   Column 2: Nombre (Full name)
#   Column 3: DNI (Used as default password)
#   Column 4: Email (Personal email)
#   Column 5: Email UNLaM (Used as login email)
#   Column 6: Carrera (Career/Program)
#   Column 7: Ultima conexion (Last login timestamp)
#   Column 8: Estado (Status)
#   Column 9: Observaciones (Notes)
#
# The script hashes DNI as password using bcrypt (cost factor 12) before inserting
# users into the 'users' collection.
#
# Usage:
#   ./load-users.sh --uri <mongodb_uri> --files <csv1> [csv2] ...
#   ./load-users.sh --env <path_to_env> --files <csv1> [csv2] ...
#   ./load-users.sh --profesor --manana --files <csv1> [csv2] ...
#   ./load-users.sh --help
#
# Options:
#   --uri <mongodb_uri>     MongoDB connection URI (e.g., mongodb://localhost:27017/dbname)
#   --env <path>            Path to .env file containing MONGODB_URI (default: ./backend/.env)
#   --files <csv1> [csv2]   One or more CSV files to process
#   --profesor              Set role to PROFESSOR (default: STUDENT)
#   --manana                Set commission to MANANA (default: NOCHE)
#   --help                  Show this help message
#
# Examples:
#   # Load as STUDENT + NOCHE (default)
#   ./load-users.sh --files students.csv
#
#   # Load as PROFESSOR + MANANA
#   ./load-users.sh --profesor --manana --files teachers.csv
#
#   # Custom .env path
#   ./load-users.sh --env /path/to/.env --files users.csv
#
# Requirements:
#   - mongosh (MongoDB Shell) installed and in PATH
#   - MongoDB server running
#
# Install mongosh:
#   - Debian/Ubuntu: sudo apt-get install -y mongosh
#   - See: https://www.mongodb.com/docs/mongodb-shell/install/
#
# Notes:
#   - Users are upserted (inserted or updated based on email match)
#   - Password (DNI) is hashed using bcrypt with cost factor 12
#   - Default role: STUDENT, default commission: NOCHE
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE=""
MONGODB_URI=""
CSV_FILES=()
ROLE="STUDENT"
COMMISSION="NOCHE"
DRY_RUN=false

# =============================================================================
# Helper functions
# =============================================================================

show_help() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}MongoDB User Loader - Help${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}DESCRIPTION${NC}"
    echo "  Loads users from CSV files into MongoDB for the Mascota Virtual project."
    echo "  Uses mongosh directly - no Node.js/mongoose required."
    echo "  Passwords (DNI) are automatically hashed using bcrypt."
    echo ""
    echo -e "${BLUE}CSV FORMAT${NC}"
    echo "  Comma-separated (UNLaM export format):"
    echo "    Column 1: Usuario (ID)"
    echo "    Column 2: Nombre (Full name) -> saved as 'name' field"
    echo "    Column 3: DNI (Used as default password) -> hashed and saved"
    echo "    Column 4: Email (Personal email)"
    echo "    Column 5: Email UNLaM (Used as login email)"
    echo "    Column 6: Carrera (Career/Program)"
    echo "    Column 7: Ultima conexion (Last login timestamp)"
    echo "    Column 8: Estado (Status)"
    echo "    Column 9: Observaciones (Notes)"
    echo ""
    echo -e "${BLUE}USAGE${NC}"
    echo "  ./load-users.sh --uri <mongodb_uri> --files <csv1> [csv2] ..."
    echo "  ./load-users.sh --env <path_to_env> --files <csv1> [csv2] ..."
    echo "  ./load-users.sh --profesor --manana --files <csv1> [csv2] ..."
    echo "  ./load-users.sh --dry-run --files <csv1> [csv2] ..."
    echo ""
    echo -e "${BLUE}OPTIONS${NC}"
    echo "  --uri <mongodb_uri>     MongoDB connection URI"
    echo "  --env <path>            Path to .env file (default: ./backend/.env)"
    echo "  --files <csv1> [csv2]   CSV files to process"
    echo "  --profesor              Set role to PROFESSOR (default: STUDENT)"
    echo "  --manana                Set commission to MANANA (default: NOCHE)"
    echo "  --dry-run               Preview users without importing (shows parsed data)"
    echo "  --help                  Show this help message"
    echo ""
    echo -e "${BLUE}EXAMPLES${NC}"
    echo "  # Load as STUDENT + NOCHE (default)"
    echo "  ./load-users.sh --files students.csv"
    echo ""
    echo "  # Load as PROFESSOR + MANANA"
    echo "  ./load-users.sh --profesor --manana --files teachers.csv"
    echo ""
    echo "  # Preview users without importing"
    echo "  ./load-users.sh --dry-run --files students.csv"
    echo ""
    echo "  # Custom .env path"
    echo "  ./load-users.sh --env /path/to/.env --files users.csv"
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
        --profesor)
            ROLE="PROFESSOR"
            shift
            ;;
        --manana)
            COMMISSION="MANANA"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
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

# If no --env or --uri specified, use default .env location
if [ -z "$ENV_FILE" ] && [ -z "$MONGODB_URI" ]; then
    ENV_FILE="${SCRIPT_DIR}/backend/.env"
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
echo -e "${GREEN}MongoDB User Loader${NC}"
echo -e "${GREEN}========================================${NC}"

if [ "$DRY_RUN" = true ]; then
    log_warn "DRY RUN MODE - No changes will be made"
fi

log_info "MongoDB URI: ${YELLOW}${MONGODB_URI}${NC}"
log_info "Files to process: ${#CSV_FILES[@]}"
echo ""

# Extract database name from URI
DB_NAME=$(echo "$MONGODB_URI" | sed -n 's|.*://[^/]*/\([^?]*\).*|\1|p')
if [ -z "$DB_NAME" ]; then
    DB_NAME="tamagotchi"
    log_warn "Could not extract database name from URI, using default: ${DB_NAME}"
fi
echo "Using DB_NAME: ${DB_NAME}"

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

    # Count data lines (skip header)
    TOTAL_LINES=$(tail -n +2 "$csv_file" | grep -c '[^[:space:]]' || true)
    log_info "Found ${TOTAL_LINES} rows in CSV"
    log_info "Role: ${ROLE}, Commission: ${COMMISSION}"

    FILE_INSERTED=0
    FILE_UPDATED=0
    FILE_ERRORS=0

    # Create temporary mongosh script
    TEMP_JS=$(mktemp /tmp/mongo_load_XXXXXX.js)

    # Check if node is available
    if ! command -v node &> /dev/null; then
        log_error "node.js is required for parsing CSV and hashing passwords"
        rm -f "$TEMP_JS"
        exit 1
    fi

    # Find the backend directory to use its node_modules for bcrypt
    BACKEND_DIR="${SCRIPT_DIR}/backend"
    
    # Check if bcrypt is available in backend
    if ! (cd "$BACKEND_DIR" && node -e "require('bcrypt')" 2>/dev/null); then
        log_error "bcrypt not found in backend/node_modules"
        log_info "Install it by running: cd backend && npm install"
        rm -f "$TEMP_JS"
        exit 1
    fi

    CSV_FILE_ABS=$(realpath "$csv_file")

    if ! (cd "$BACKEND_DIR" && node "${SCRIPT_DIR}/generate-users.js" "$CSV_FILE_ABS" "$ROLE" "$COMMISSION") > "$TEMP_JS" 2>&1; then
        log_error "Failed to generate import script for $csv_file"
        cat "$TEMP_JS"
        rm -f "$TEMP_JS"
        exit 1
    fi

    # Execute with mongosh or show preview in dry-run mode
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}   [DRY RUN] Would import ${TOTAL_LINES} users...${NC}"
        
        # Count parsed users from the generated script
        PARSED_COUNT=$(grep -c "db.users.updateOne" "$TEMP_JS" || true)
        log_info "Parsed ${PARSED_COUNT} users from CSV"
        
        # Show first 3 users as preview
        echo -e "${BLUE}   Preview (first 3 users):${NC}"
        grep -E "email:|name:|role:|commission:" "$TEMP_JS" | head -12 | while IFS= read -r line; do
            echo -e "     ${YELLOW}${line}${NC}"
        done
        
        FILE_INSERTED=0
        FILE_UPDATED=0
        FILE_ERRORS=0
    else
        echo -e "${YELLOW}   Importing...${NC}"

        OUTPUT=$(mongosh "$MONGODB_URI" --quiet "$TEMP_JS" 2>&1) || true

        # Count results (grep for exact lines, mongosh adds prompts so we use word boundaries)
        FILE_INSERTED=$(echo "$OUTPUT" | grep -c 'INSERTED' || true)
        FILE_UPDATED=$(echo "$OUTPUT" | grep -c 'UPDATED' || true)
        FILE_ERRORS=$(echo "$OUTPUT" | grep -c 'ERROR:' || true)

        # Show errors if any
        if [ "$FILE_ERRORS" -gt 0 ]; then
            echo -e "${RED}   Errors details:${NC}"
            echo "$OUTPUT" | grep 'ERROR:' | head -5 | while IFS= read -r err; do
                echo -e "${RED}     ${err}${NC}"
            done
        fi

        # Show raw output if there were errors (for debugging)
        if [ "$FILE_ERRORS" -gt 0 ] && [ -n "$OUTPUT" ]; then
            echo -e "${RED}   Raw output:${NC}"
            echo "$OUTPUT" | head -10 | while IFS= read -r line; do
                echo -e "${RED}     ${line}${NC}"
            done
        fi
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
