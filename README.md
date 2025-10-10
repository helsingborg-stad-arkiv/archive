# 🏛️ Website Archiver for GitHub Pages

This repository is used to **archive websites before shutdown** and store them as **static snapshots in a structured folder layout within the repository**.  
It captures all pages listed in the site’s sitemap, downloads all media assets (even from CDNs), rewrites URLs to relative paths, and commits the result to the repository under a folder structure organized by domain and date.

---

## Local
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
   - External media (e.g. CDN images) from specified domains are included.
4. The archive is stored in the repository under the folder structure:  
   **`/domain/YYYY-MM-DD/`**
5. The workflow commits the archived files to the repository.

GitHub Pages is **not published automatically**, but you can manually configure GitHub Pages to serve the archived content if desired.

---

## 🧰 Requirements

- GitHub repository created for the site archive.
- The website must have a valid `sitemap.xml`.
- (Optional) Configure GitHub Pages manually if you want to serve the archive as a website.

---

## 🚀 Usage Instructions

1. **Create the repository**  
   Example: `my-old-site-archive`

2. **Add the workflow**  
   Save the provided file as  
   `.github/workflows/archive-site.yml`

3. **Run the archiver manually**  
   - Go to the **Actions** tab in the repository.  
   - Select **“Archive Website”** → **“Run workflow”**.  
   - Enter the full site URL, for example:  
     ```
     https://example.com
     ```
   - Click **Run workflow**.

4. Wait for the workflow to finish. The archived site snapshot will be committed to the repository under the `/domain/YYYY-MM-DD/` folder structure.

5. (Optional) Configure GitHub Pages manually in repository settings if you want to serve the archived files as a website.

---

## 🧩 Technical Details

- Uses [`wget`](https://www.gnu.org/software/wget/manual/wget.html) to mirror the website.
- URLs are rewritten to be relative (`--convert-links`).
- Media and assets from external domains specified in `EXTRA_DOMAINS` are downloaded and stored locally (`--span-hosts`).
- Pages outside the original domain are **not crawled**.
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

## 📄 Example Output

After archiving `https://example.com` on 2023-08-15, the repository structure will look like:

archive/
└── example.com/
    └── 2023-08-15/
        ├── index.html
        ├── about/
        │   └── index.html
        ├── images/
        ├── css/
        └── js/

---

## 🧹 Cleanup

Once verified, you can remove the workflow file if you want to lock the repository as a permanent static archive.

---

### License

MIT © Helsingborg Stad