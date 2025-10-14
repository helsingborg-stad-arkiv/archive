import { ManifestLoader } from './ManifestLoader';
import { UrlUpdater } from './UrlUpdater';

export class ArchiveController {
  private manifest: Record<string, string[]> = {};
  private domainSelect: HTMLSelectElement;
  private dateSelect: HTMLSelectElement;
  private preview: HTMLIFrameElement;
  private urlDiv: HTMLElement;
  private urlUpdater = new UrlUpdater();
  private loader = new ManifestLoader();

  constructor() {
    this.domainSelect = document.getElementById('domain') as HTMLSelectElement;
    this.dateSelect = document.getElementById('date') as HTMLSelectElement;
    this.preview = document.getElementById('preview') as HTMLIFrameElement;
    this.urlDiv = document.getElementById('url') as HTMLElement;
  }

  async init() {
    try {
      this.manifest = await this.loader.load();
      this.populateDomains();
      this.restoreSelection();
      this.addListeners();
    } catch (err: any) {
      const errorDiv = document.getElementById('manifest-error')!;
      errorDiv.style.display = 'flex';
    }
  }

  private populateDomains() {
    const domains = Object.keys(this.manifest).sort();
    this.domainSelect.innerHTML =
      '<option value="">-- Select site --</option>' +
      domains.map(d => `<option value="${d}">${d}</option>`).join('');
  }

  private addListeners() {
    this.domainSelect.addEventListener('change', () => this.onDomainChange());
    this.dateSelect.addEventListener('change', () => this.loadArchive());
    this.preview.addEventListener('load', () => this.onIframeLoad());
    setInterval(() => this.syncUrl(), 500);
  }

  private onDomainChange() {
    const domain = this.domainSelect.value;
    const dates = this.manifest[domain] || [];
    this.dateSelect.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
    if (dates.length) this.dateSelect.value = dates[dates.length - 1];
    this.loadArchive();
  }

  private loadArchive() {
    const domain = this.domainSelect.value;
    const date = this.dateSelect.value;
    if (!domain || !date) {
      this.preview.src = '';
      this.urlDiv.textContent = '';
      return;
    }
    const src = `./${domain}/${date}/${domain}/index.html`;
    this.preview.src = src;
    localStorage.setItem('lastDomain', domain);
    localStorage.setItem('lastDate', date);
    this.urlDiv.textContent = this.urlUpdater.update(src, domain, date);
  }

  private onIframeLoad() {
    this.preventExternalTargets();
    try {
      const iframeWindow = this.preview.contentWindow!;
      const path = iframeWindow.location.pathname;
      this.urlDiv.textContent = this.urlUpdater.update(path, this.domainSelect.value, this.dateSelect.value);
    } catch {
      throw new Error('Could not access iframe content');
    }
  }

  private preventExternalTargets() {
    try {
      const doc = this.preview.contentDocument || this.preview.contentWindow?.document;
      if (!doc) return;

      // Inject CSS helper if not already present
      if (!doc.getElementById('unavailable-link-style')) {
        const style = doc.createElement('style');
        style.id = 'unavailable-link-style';
        style.textContent = `
          .unavailable-link {
            opacity: 0.5 !important;
            pointer-events: none !important;
            text-decoration: line-through !important;
          }
        `;
        doc.head.appendChild(style);
      }

      const links = doc.querySelectorAll('a[target="_blank"], a[target="_top"], a[target="_parent"], a');
      links.forEach(link => {
        link.removeAttribute('target');

        const href = link.getAttribute('href');
        if (!href) return;

        // Disable non-relative links
        if (/^https?:\/\//i.test(href)) {
          link.classList.add('unavailable-link');
          (link.style as any).pointerEvents = 'none';
        }
      });
    } catch {}
  }

  private restoreSelection() {
    const lastDomain = localStorage.getItem('lastDomain');
    const lastDate = localStorage.getItem('lastDate');
    if (lastDomain && this.manifest[lastDomain]) {
      this.domainSelect.value = lastDomain;
      const dates = this.manifest[lastDomain];
      this.dateSelect.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
      if (lastDate && dates.includes(lastDate)) this.dateSelect.value = lastDate;
      this.loadArchive();
    }
  }

  private syncUrl() {
    try {
      const iframeWindow = this.preview.contentWindow!;
      const path = iframeWindow.location.pathname;
      const domain = this.domainSelect.value;
      const date = this.dateSelect.value;
      if (!domain || !date) return;
      this.urlDiv.textContent = this.urlUpdater.update(path, domain, date);
    } catch {}
  }
}