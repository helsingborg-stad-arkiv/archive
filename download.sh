#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------
# Configuration and setup
# -----------------------------------------
SITE_URL="${SITE_URL:-}"
EXTRA_DOMAINS_ENV="${EXTRA_DOMAINS:-}"
MAX_DEPTH="${MAX_DEPTH:-}"

if [ -z "$SITE_URL" ]; then
  echo "❌ SITE_URL not provided."
  exit 1
fi

DOMAIN=$(echo "$SITE_URL" | awk -F/ '{print $3}')
TODAY=$(date +%Y-%m-%d)
ARCHIVE_DIR="./archive/${DOMAIN}/${TODAY}"

# Convert comma-separated EXTRA_DOMAINS to an array
IFS=',' read -ra EXTRA_DOMAINS_ARRAY <<< "$EXTRA_DOMAINS_ENV"
EXTRA_DOMAINS_JOINED=$(IFS=,; echo "${EXTRA_DOMAINS_ARRAY[*]}")
DOMAINS_OPTION="$DOMAIN"
if [ -n "$EXTRA_DOMAINS_JOINED" ]; then
  DOMAINS_OPTION="$DOMAINS_OPTION,$EXTRA_DOMAINS_JOINED"
fi

mkdir -p "$ARCHIVE_DIR"

SITEMAP_URL="${SITE_URL%/}/sitemap.xml"
TEMP_URLS_FILE=$(mktemp)

echo "📥 Fetching sitemap (supports sitemap indexes): $SITEMAP_URL"
echo "🔍 Fetching sitemap from: $SITEMAP_URL"
SITEMAP_CONTENT=$(wget -S -O- --max-redirect=10 --trust-server-names --content-on-error --no-check-certificate \
  --user-agent="Mozilla/5.0 (compatible; SiteArchiver/1.0; +https://github.com/helsingborg-stad-arkiv)" \
  "$SITEMAP_URL" 2>&1)

# Extract all <loc> entries (namespace-safe)
SITEMAP_LOCS=$(echo "$SITEMAP_CONTENT" | perl -nle 'print $1 while /<loc>([^<]+)<\/loc>/g')

> "$TEMP_URLS_FILE"

# Check if this is a sitemap index (namespace-safe, case-insensitive)
if echo "$SITEMAP_CONTENT" | grep -Eiq "<sitemapindex([[:space:]>])"; then
  echo "📚 Sitemap index detected — fetching subsitemaps..."
  IFS=$'\n'
  for sm in $SITEMAP_LOCS; do
    echo "🔗 Fetching subsitemap: $sm"
    # Handle .gz subsitemaps too
    if [[ "$sm" =~ \.gz$ ]]; then
      wget -qO- --max-redirect=10 --no-check-certificate "$sm" | perl -nle 'print $1 while /<loc>([^<]+)<\/loc>/g' >> "$TEMP_URLS_FILE" || true
    else
      wget -qO- --max-redirect=10 --no-check-certificate "$sm" | perl -nle 'print $1 while /<loc>([^<]+)<\/loc>/g' >> "$TEMP_URLS_FILE" || true
    fi
  done
  unset IFS
else
  # If no <sitemapindex> tag but file name looks like wp-sitemap.xml, treat as index
  if [[ "$SITEMAP_URL" =~ wp-sitemap\.xml$ ]]; then
    echo "📚 WordPress sitemap index detected — fetching subsitemaps..."
    IFS=$'\n'
    for sm in $SITEMAP_LOCS; do
      echo "🔗 Fetching subsitemap: $sm"
      wget -qO- --max-redirect=10 --no-check-certificate "$sm" | perl -nle 'print $1 while /<loc>([^<]+)<\/loc>/g' >> "$TEMP_URLS_FILE" || true
    done
    unset IFS
  else
    echo "🗺️ Regular sitemap detected."
    echo "$SITEMAP_LOCS" >> "$TEMP_URLS_FILE"
  fi
fi

# -----------------------------------------
# Max depth [n] filtering (trailing slash safe)
# -----------------------------------------
if [ -n "${MAX_DEPTH:-}" ] && [[ "$MAX_DEPTH" =~ ^[0-9]+$ ]]; then
  echo "📏 Applying max depth filter: $MAX_DEPTH"
  FILTERED_URLS_FILE=$(mktemp)

  awk -v max_depth="$MAX_DEPTH" '
    {
      url = $0
      sub(/\?.*$/, "", url)    # Remove query string
      sub(/#.*/, "", url)      # Remove fragment
      sub(/\/$/, "", url)      # Remove trailing slash
      depth = gsub(/[^\/]/, "", url) - 2  # Subtract 2 for protocol and domain
      if (depth <= max_depth) print $0
    }
  ' "$TEMP_URLS_FILE" | sort -u > "$FILTERED_URLS_FILE"

  mv "$FILTERED_URLS_FILE" "$TEMP_URLS_FILE"
fi

# -----------------------------------------
# Validate that we have URLs to process
# -----------------------------------------
URL_COUNT=$(wc -l < "$TEMP_URLS_FILE" | tr -d ' ')
if [ "$URL_COUNT" -eq 0 ]; then
  echo "⚠️  No URLs found in sitemap. Aborting."
  rm "$TEMP_URLS_FILE"
  exit 1
fi
echo "🌐 Found $URL_COUNT URLs to download..."

# -----------------------------------------
# Download website and assets
# -----------------------------------------
wget \
  --recursive \
  --level=1 \
  --no-clobber \
  --page-requisites \
  --adjust-extension \
  --convert-links \
  --no-span-hosts \
  --domains "$DOMAINS_OPTION" \
  --input-file "$TEMP_URLS_FILE" \
  --directory-prefix="$ARCHIVE_DIR" \
  --execute robots=off \
  --reject "*.mp4,*.mov,*.avi,*.mkv,*.webm,*.zip,*.tar.gz" \
  --no-parent \
  --wait=0.2 \
  --random-wait \
  --user-agent="Mozilla/5.0 (compatible; SiteArchiver/1.0)" \
  --no-check-certificate \
  || true

rm "$TEMP_URLS_FILE"
echo "✅ Main archive complete. Starting rewrite pass..."

# -----------------------------------------
# Rewrite URLs based on downloaded files
# -----------------------------------------
REWRITE_MAP=$(mktemp)

find "$ARCHIVE_DIR" -type f ! \( -name "*.html" -o -name "*.css" -o -name "*.js" \) | while read -r asset; do
  rel="${asset#$ARCHIVE_DIR/}"
  if [[ "$rel" =~ ^([A-Za-z0-9._-]+)/(.+)$ ]]; then
    domain="${BASH_REMATCH[1]}"
    rest="${BASH_REMATCH[2]}"
    echo "https://$domain/$rest|./$rel" >> "$REWRITE_MAP"
    echo "http://$domain/$rest|./$rel" >> "$REWRITE_MAP"
  fi
done

echo "🧩 Rewriting asset URLs..."
find "$ARCHIVE_DIR" -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \) | while read -r file; do
  while IFS="|" read -r url path; do
    perl -pi -e "s|(['\"(])\Q$url\E|\1$path|g" "$file"
  done < "$REWRITE_MAP"
done
rm "$REWRITE_MAP"
echo "✅ URL rewriting complete."

# -----------------------------------------
# Cleanup: remove integrity/crossorigin
# -----------------------------------------
set +e
echo "🧹 Removing integrity and crossorigin attributes..."
find "$ARCHIVE_DIR" -type f \( -iname "*.html" -o -iname "*.htm" -o -iname "*.js" \) | while read -r file; do
  perl -0777 -pi -e '
    s/\s+(integrity|crossorigin)\s*=\s*(?:"[^"]*"|'\''[^'\'']*'\'')//gsi;
  ' "$file" || true
done
set -e

echo "✅ Cleanup complete."

# -----------------------------------------
# Final summary
# -----------------------------------------
echo "🎉 Archive ready at: $ARCHIVE_DIR"