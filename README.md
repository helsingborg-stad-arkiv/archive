# 🏛️ Website Archiver for GitHub Pages

This repository is used to **archive websites before shutdown** and store them as **static snapshots in a structured folder layout within the repository**.  
It captures all pages listed in the site’s sitemap, downloads all media assets (even from CDNs), rewrites URLs to relative paths, and commits the result to the repository under a folder structure organized by domain and date.

View the website @ [https://archive.helsingborg.io/](https://archive.helsingborg.io/archive/). And the archive browser @ [https://archive.helsingborg.io/](https://archive.helsingborg.io/archive/)

---

## Run script locally
SITE_URL="https://example.cpm" \
EXTRA_DOMAINS=("media.example.com" "cdn.example.com") \
bash download.sh

The `EXTRA_DOMAINS` array allows you to specify additional domains from which to download assets (e.g., media.example.com). This ensures media hosted on external domains are included in the archive.

## ⚙️ How It Works

1. You provide the website’s domain manually.
2. The GitHub Action fetches the sitemap (`/sitemap.xml`).
3. Every page listed is downloaded using `wget`:
   - All HTML, images, CSS, JS, and assets are saved.
   - Links are converted to **relative URLs**.
   - External media (e.g. CDN images) from specified domains are included if domain is included in EXTRA_DOMAIN setting.
4. The archive is stored in the repository under the folder structure:  
   **`/domain/YYYY-MM-DD/`**
5. The workflow commits the archived files to the repository.

GitHub Pages can be configured to serve the archived content if desired.

---

## 🧰 Requirements

- GitHub repository created for the site archive.
- The website must have a valid `sitemap.xml`.
- (Optional) Configure GitHub Pages manually if you want to serve the archive as a website.

---

## 🚀 Usage Instructions

1. **Go to GithubActions on this repository**  
2. Click on Archive Website"
3. Enter the url to archive
4. Wait for the workflow to finish. The archived site snapshot will be committed to the repository under the `/domain/YYYY-MM-DD/` folder structure.
5. Visit the [`archive browser`](./archive/) to view the archived page.

---

## 🧩 Technical Details

- Uses [`wget`](https://www.gnu.org/software/wget/manual/wget.html) to mirror the website.
- URLs are rewritten to be relative (`--convert-links`).
- Media and assets from external domains specified in `EXTRA_DOMAINS` are downloaded and stored locally (`--span-hosts`).
- Only pages in the sitemap.xml is archived. 
- The workflow commits the archived snapshot to the repository under `/domain/YYYY-MM-DD/`.

---

## 🕰️ Typical Use Case

This is designed for **municipal or organizational website decommissioning**.  
When a site is being taken offline, run this once to permanently preserve its static version for archival or legal purposes.

---

## ⚠️ Limitations

- Only pages in the sitemap are archived.
- Dynamic content (search results, forms, etc.) is not captured.
- Sites requiring authentication or JavaScript rendering are not supported.

---

### License

MIT © Helsingborg Stad