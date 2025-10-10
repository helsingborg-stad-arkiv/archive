# 🏛️ Website Archiver for GitHub Pages

This repository is used to **archive websites before shutdown** and publish them as **static snapshots on GitHub Pages**.  
It captures all pages listed in the site’s sitemap, downloads all media assets (even from CDNs), rewrites URLs to relative paths, and publishes the result to a public, self-contained GitHub Pages site.

---

## ⚙️ How It Works

1. You provide the website’s domain manually.
2. The GitHub Action fetches the sitemap (`/sitemap.xml`).
3. Every page listed is downloaded using `wget`:
   - All HTML, images, CSS, JS, and assets are saved.
   - Links are converted to **relative URLs**.
   - External media (e.g. CDN images) are included.
4. The result is published to the `gh-pages` branch.
5. GitHub Pages serves the archived site at  
   **`https://<username>.github.io/<repository>/`**

---

## 🧰 Requirements

- GitHub repository created for the site archive.
- GitHub Pages **enabled** for the repository.  
  *(Settings → Pages → Source: GitHub Actions)*
- The website must have a valid `sitemap.xml`.

---

## 🚀 Usage Instructions

1. **Create the repository**  
   Example: `my-old-site-archive`

2. **Enable GitHub Pages**  
   Go to **Settings → Pages → Source → GitHub Actions**.

3. **Add the workflow**  
   Save the provided file as  
   `.github/workflows/archive-site.yml`

4. **Run the archiver manually**  
   - Go to the **Actions** tab in the repository.  
   - Select **“Archive Website”** → **“Run workflow”**.  
   - Enter the full site URL, for example:  
     ```
     https://example.com
     ```
   - Click **Run workflow**.

5. Wait for the workflow to finish (a few minutes depending on site size).

6. The site will be published automatically at:  https://github.io


---

## 🧩 Technical Details

- Uses [`wget`](https://www.gnu.org/software/wget/manual/wget.html) to mirror the website.
- URLs are rewritten to be relative (`--convert-links`).
- Media and assets from external domains are downloaded and stored locally (`--span-hosts`).
- Pages outside the original domain are **not crawled**.
- Uses [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages) to publish to GitHub Pages.

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

After archiving `https://example.com`, the repository structure will look like:

archive/
└── example.com/
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