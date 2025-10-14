# 🏛️ Website Archiver

_Archive entire websites as static snapshots before shutdown._

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Status: Stable](https://img.shields.io/badge/status-stable-brightgreen)
![Archive Tool](https://img.shields.io/badge/tool-wget-orange)

> 🗂️ **Browse archived sites:**  
> [https://archive.helsingborg.io/archive/](https://archive.helsingborg.io/archive/)
>
> 🌐 **Live archive site:**  
> [https://archive.helsingborg.io/](https://archive.helsingborg.io/)

---

## ⚙️ How It Works

1. Provide the website’s domain manually.
2. The GitHub Action fetches the sitemap (`/sitemap.xml`).
3. Every page listed is downloaded using `wget`:
   - All HTML, images, CSS, JS, and assets are saved.
   - Links are converted to **relative URLs**.
   - External media (e.g. CDN images) are included if listed in `EXTRA_DOMAINS`.
4. The archive is stored as:  
   **`/domain/YYYY-MM-DD/`**
5. The workflow commits the archived files to the repository.

---

## 🧰 Requirements

- GitHub repository for the site archive.
- The site must have a valid `sitemap.xml`.
- (Optional) Enable **GitHub Pages** to serve the archive.

---

## 🚀 Usage

1. Go to **Actions → Archive Website**.
2. Enter the URL to archive.
3. Wait for the workflow to finish.
4. Find the snapshot under `/domain/YYYY-MM-DD/`.
5. View the result in the [`archive browser`](./archive/).

---

## 🧩 Technical Details

- Uses [`wget`](https://www.gnu.org/software/wget/manual/wget.html) to mirror sites.  
- URLs are rewritten as relative (`--convert-links`).  
- External assets defined in `EXTRA_DOMAINS` are included.  
- Only URLs listed in `sitemap.xml` are processed.  
- Commits results to `/domain/YYYY-MM-DD/`.

---

## 🕰️ Typical Use Case

Ideal for **municipal or organizational website decommissioning**.  
Run once to permanently preserve a static version for archival or legal purposes.

---

## ⚠️ Limitations

- Only pages in the sitemap are archived.  
- Dynamic content (forms, search, JS-rendered pages) is not captured.  
- Sites requiring authentication are not supported.

---

## 🧑‍💻 Run Locally

```bash
SITE_URL="https://example.com" \
EXTRA_DOMAINS=("media.example.com" "cdn.example.com") \
MAX_DEPTH=1 \
bash download.sh
```

## 📜 License

MIT © Helsingborg Stad