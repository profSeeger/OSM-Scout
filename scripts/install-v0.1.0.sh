#!/bin/bash
# OSM Scout v0.1.0
# Responsibility: install/update only the files belonging to this release.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR"

echo "OSM Scout v0.1.0"
echo "================"
echo
read -r -p "Enter the path to your OSM Scout repository (or press Return for current directory): " TARGET
TARGET="${TARGET:-$(pwd)}"

if [ ! -d "$TARGET" ]; then
  echo "Error: target directory does not exist: $TARGET"
  exit 1
fi

FILES=(
  "index.html"
  "css/style.css"
  "js/app.js"
  "README.md"
  "CHANGELOG.md"
  "PROJECT_NOTES.md"
)

echo
echo "Updating only the v0.1.0 project files:"
for file in "${FILES[@]}"; do
  mkdir -p "$TARGET/$(dirname "$file")"
  cp "$SOURCE_DIR/$file" "$TARGET/$file"
  echo "  ✓ $file"
done

echo
echo "OSM Scout update complete."
echo "Version: 0.1.0"
echo
echo "Note: this version uses live OpenStreetMap services."
