#!/bin/bash
set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Project root is one level up from scripts/
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source files
TEMPLATE_FILE="${PROJECT_ROOT}/docs/agents.md/template_agents.md"
AGENTS_DIR="${PROJECT_ROOT}/docs/agents.md/agents"
CONTRIBUTORS_DIR="${PROJECT_ROOT}/docs/agents.md/contributors"
PERSONAS_DIR="${PROJECT_ROOT}/docs/agents.md/personas"

# Destination file
OUTPUT_FILE="${PROJECT_ROOT}/AGENTS.md"

insert_directory_contents() {
    local dir="$1"
    if [ -d "$dir" ]; then
        for file in "$dir"/*; do
            if [ -f "$file" ]; then
                cat "$file"
                echo ""
            fi
        done
    fi
}

echo "Generating ${OUTPUT_FILE}..."

while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" == *"<agents>"* ]]; then
        insert_directory_contents "${AGENTS_DIR}"
    elif [[ "$line" == *"<contributors>"* ]]; then
        insert_directory_contents "${CONTRIBUTORS_DIR}"
    elif [[ "$line" == *"<personas>"* ]]; then
        insert_directory_contents "${PERSONAS_DIR}"
    else
        echo "$line"
    fi
done < "${TEMPLATE_FILE}" > "${OUTPUT_FILE}"

echo "Done."
