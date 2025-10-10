#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_ROOT="./archive"
MANIFEST_FILE="$ARCHIVE_ROOT/index.json"
TMP_FILE="$(mktemp)"

echo "🧾 Building archive manifest..."

# Create JSON manifest
echo "{" > "$TMP_FILE"
first_domain=true

for domain_dir in "$ARCHIVE_ROOT"/*/; do
  [ -d "$domain_dir" ] || continue
  domain=$(basename "$domain_dir")

  # Skip the manifest itself
  [[ "$domain" == "index.json" ]] && continue

  # Gather dates for this domain
  dates=()
  for date_dir in "$domain_dir"*/; do
    [ -d "$date_dir" ] || continue
    date=$(basename "$date_dir")
    dates+=("\"$date\"")
  done

  # Skip if no valid dates
  [ ${#dates[@]} -eq 0 ] && continue

  # Comma between domain entries
  if [ "$first_domain" = true ]; then
    first_domain=false
  else
    echo "," >> "$TMP_FILE"
  fi

  # Write JSON entry for this domain
  echo "  \"$domain\": [$(IFS=,; echo "${dates[*]}")]" >> "$TMP_FILE"
done

echo "}" >> "$TMP_FILE"

mv "$TMP_FILE" "$MANIFEST_FILE"

echo "✅ Manifest updated: $MANIFEST_FILE"