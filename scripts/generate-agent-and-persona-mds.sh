#!/bin/bash
set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Project root is one level up from scripts/
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source files
ROOT_AGENTS="${PROJECT_ROOT}/docs/agents/root_agents.md"
ROOT_PERSONAS="${PROJECT_ROOT}/docs/agents/root_personas.md"
CONTRIBUTORS="${PROJECT_ROOT}/docs/contributors/contributors.md"

# Destination files
DEST_AGENTS="${PROJECT_ROOT}/agents.md"
DEST_PERSONAS="${PROJECT_ROOT}/personas.md"

insert_content() {
    local file="$1"
    while IFS= read -r content_line || [ -n "$content_line" ]; do
        if [[ "$content_line" == \#* ]]; then
            echo "#${content_line}"
        else
            echo "$content_line"
        fi
    done < "$file"
}

generate_agents() {
    echo "Generating ${DEST_AGENTS}..."
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ "$line" == *"<personas>"* ]]; then
            insert_content "${ROOT_PERSONAS}"
        elif [[ "$line" == *"<contributors>"* ]]; then
            insert_content "${CONTRIBUTORS}"
        else
            echo "$line"
        fi
    done < "${ROOT_AGENTS}" > "${DEST_AGENTS}"
}

generate_personas() {
    echo "Generating ${DEST_PERSONAS}..."
    cp "${ROOT_PERSONAS}" "${DEST_PERSONAS}"
}

generate_agents
generate_personas

echo "Done."
