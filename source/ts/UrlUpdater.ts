export class UrlUpdater {
  /**
   * Formats the query string with URL encoding.
   * Example: ?domain={encodedDomain}&url={encodedUrl}&date={encodedDate}
   */
  private formatHash(domain: string, url: string, date: string): string {
    const enc = encodeURIComponent;
    return `?domain=${enc(domain)}&url=${enc(url)}&date=${enc(date)}`;
  }

  /**
   * Parses the query string format and returns the decoded values.
   * Returns null if parsing fails or required fields are missing.
   */
  static parseHash(hash: string): { domain: string; url: string; date: string } | null {
    if (!hash.startsWith('?')) return null;
    // Remove "?"
    const query = hash.slice(1);
    const params = new URLSearchParams(query);
    const domain = params.get('domain');
    const url = params.get('url');
    const date = params.get('date');
    if (domain && url && date) {
      return {
        domain: decodeURIComponent(domain),
        url: decodeURIComponent(url),
        date: decodeURIComponent(date),
      };
    }
    return null;
  }

  private normalizeUrl(src: string, domain: string, date: string): string {
    if (!domain || !date) return '';
    const prefix = `/${domain}/${date}/${domain}/`;

    if (src.includes(prefix)) {
      src = src.slice(src.indexOf(prefix) + prefix.length - 1);
    }

    if (!src.startsWith('/')) src = '/' + src;
    if (src.endsWith('/index.html')) src = src.slice(0, -10);
    if (src.endsWith('/') && src.length > 1) src = src.slice(0, -1);

    return src;
  }

  update(src: string, domain: string, date: string): string {
    const normalizedSrc = this.normalizeUrl(src, domain, date);
    this.apply(domain, normalizedSrc, date);
    return normalizedSrc;
  }

  apply(domain: string, src: string, date: string): void {
    const newQuery = this.formatHash(domain, src, date);
    const newUrl = `${window.location.pathname}${newQuery}`;
    window.history.replaceState(null, '', newUrl);
  }
}