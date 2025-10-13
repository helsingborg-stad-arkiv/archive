var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const _ManifestLoader = class _ManifestLoader {
  async load() {
    const res = await fetch("./index.json");
    if (!res.ok) {
      throw new Error("Manifest not found");
    }
    return await res.json();
  }
};
__name(_ManifestLoader, "ManifestLoader");
let ManifestLoader = _ManifestLoader;
const _UrlUpdater = class _UrlUpdater {
  /**
   * Formats the query string with URL encoding.
   * Example: ?domain={encodedDomain}&url={encodedUrl}&date={encodedDate}
   */
  formatHash(domain, url, date) {
    const enc = encodeURIComponent;
    return `?domain=${enc(domain)}&url=${enc(url)}&date=${enc(date)}`;
  }
  /**
   * Parses the query string format and returns the decoded values.
   * Returns null if parsing fails or required fields are missing.
   */
  static parseHash(hash) {
    if (!hash.startsWith("?")) return null;
    const query = hash.slice(1);
    const params = new URLSearchParams(query);
    const domain = params.get("domain");
    const url = params.get("url");
    const date = params.get("date");
    if (domain && url && date) {
      return {
        domain: decodeURIComponent(domain),
        url: decodeURIComponent(url),
        date: decodeURIComponent(date)
      };
    }
    return null;
  }
  normalizeUrl(src, domain, date) {
    if (!domain || !date) return "";
    const prefix = `/${domain}/${date}/${domain}/`;
    if (src.includes(prefix)) {
      src = src.slice(src.indexOf(prefix) + prefix.length - 1);
    }
    if (!src.startsWith("/")) src = "/" + src;
    if (src.endsWith("/index.html")) src = src.slice(0, -10);
    if (src.endsWith("/") && src.length > 1) src = src.slice(0, -1);
    return src;
  }
  update(src, domain, date) {
    const normalizedSrc = this.normalizeUrl(src, domain, date);
    this.apply(domain, normalizedSrc, date);
    return normalizedSrc;
  }
  apply(domain, src, date) {
    const newQuery = this.formatHash(domain, src, date);
    const newUrl = `${window.location.pathname}${newQuery}`;
    window.history.replaceState(null, "", newUrl);
  }
};
__name(_UrlUpdater, "UrlUpdater");
let UrlUpdater = _UrlUpdater;
const _ArchiveController = class _ArchiveController {
  constructor() {
    this.manifest = {};
    this.urlUpdater = new UrlUpdater();
    this.loader = new ManifestLoader();
    this.domainSelect = document.getElementById("domain");
    this.dateSelect = document.getElementById("date");
    this.preview = document.getElementById("preview");
    this.urlDiv = document.getElementById("url");
  }
  async init() {
    try {
      this.manifest = await this.loader.load();
      this.populateDomains();
      this.restoreSelection();
      this.addListeners();
    } catch (err) {
      document.body.innerHTML = `<div id="manifest-error">Could not load site index. Reason: ${err.message}</div>`;
    }
  }
  populateDomains() {
    const domains = Object.keys(this.manifest).sort();
    this.domainSelect.innerHTML = '<option value="">-- Select site --</option>' + domains.map((d) => `<option value="${d}">${d}</option>`).join("");
  }
  addListeners() {
    this.domainSelect.addEventListener("change", () => this.onDomainChange());
    this.dateSelect.addEventListener("change", () => this.loadArchive());
    this.preview.addEventListener("load", () => this.onIframeLoad());
    setInterval(() => this.syncUrl(), 500);
  }
  onDomainChange() {
    const domain = this.domainSelect.value;
    const dates = this.manifest[domain] || [];
    this.dateSelect.innerHTML = dates.map((d) => `<option value="${d}">${d}</option>`).join("");
    if (dates.length) this.dateSelect.value = dates[dates.length - 1];
    this.loadArchive();
  }
  loadArchive() {
    const domain = this.domainSelect.value;
    const date = this.dateSelect.value;
    if (!domain || !date) {
      this.preview.src = "";
      this.urlDiv.textContent = "";
      return;
    }
    const src = `./${domain}/${date}/${domain}/index.html`;
    this.preview.src = src;
    localStorage.setItem("lastDomain", domain);
    localStorage.setItem("lastDate", date);
    this.urlDiv.textContent = this.urlUpdater.update(src, domain, date);
  }
  onIframeLoad() {
    this.preventExternalTargets();
    try {
      const iframeWindow = this.preview.contentWindow;
      const path = iframeWindow.location.pathname;
      this.urlDiv.textContent = this.urlUpdater.update(path, this.domainSelect.value, this.dateSelect.value);
    } catch {
      throw new Error("Could not access iframe content");
    }
  }
  preventExternalTargets() {
    try {
      const doc = this.preview.contentDocument || this.preview.contentWindow?.document;
      if (!doc) return;
      const links = doc.querySelectorAll('a[target="_blank"], a[target="_top"], a[target="_parent"]');
      links.forEach((link) => link.removeAttribute("target"));
    } catch {
    }
  }
  restoreSelection() {
    const lastDomain = localStorage.getItem("lastDomain");
    const lastDate = localStorage.getItem("lastDate");
    if (lastDomain && this.manifest[lastDomain]) {
      this.domainSelect.value = lastDomain;
      const dates = this.manifest[lastDomain];
      this.dateSelect.innerHTML = dates.map((d) => `<option value="${d}">${d}</option>`).join("");
      if (lastDate && dates.includes(lastDate)) this.dateSelect.value = lastDate;
      this.loadArchive();
    }
  }
  syncUrl() {
    try {
      const iframeWindow = this.preview.contentWindow;
      const path = iframeWindow.location.pathname;
      const domain = this.domainSelect.value;
      const date = this.dateSelect.value;
      if (!domain || !date) return;
      this.urlDiv.textContent = this.urlUpdater.update(path, domain, date);
    } catch {
    }
  }
};
__name(_ArchiveController, "ArchiveController");
let ArchiveController = _ArchiveController;
const controller = new ArchiveController();
controller.init();
//# sourceMappingURL=app.js.map
