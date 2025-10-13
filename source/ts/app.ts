async function loadManifest() {
      const res = await fetch('./index.json');
      if (!res.ok) throw new Error('Manifest not found');
      return await res.json();
    }

    async function init() {
      const manifest = await loadManifest();
      const domainSelect = document.getElementById('domain');
      const dateSelect = document.getElementById('date');
      const preview = document.getElementById('preview');
      const urlDiv = document.getElementById('url');

      const domains = Object.keys(manifest).sort();
      domainSelect.innerHTML = '<option value="">-- Select site --</option>' + 
        domains.map(d => `<option value="${d}">${d}</option>`).join('');

      function updateUrlDisplay(src, domain, date) {
        let prefix = `/${domain}/${date}/${domain}/`;
        console.log(src.indexOf(prefix));

        if (src.indexOf(prefix) !== -1) {
          src = src.slice(src.indexOf(prefix) + prefix.length - 1);
        }
        if (!src.startsWith('/')) src = '/' + src;

        //Remove index.html from the end
        if (src.endsWith('/index.html')) {
          src = src.slice(0, -10);
        }
        //Remove trailing slash if not root
        if (src.endsWith('/') && src.length > 1) {
          src = src.slice(0, -1);
        }

        urlDiv.textContent = src;
      }

      domainSelect.addEventListener('change', () => {
        const domain = domainSelect.value;
        const dates = manifest[domain] || [];
        dateSelect.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
        if (dates.length) dateSelect.value = dates[dates.length - 1];
        loadArchive();
      });

      dateSelect.addEventListener('change', loadArchive);

      function loadArchive() {
        const domain = domainSelect.value;
        const date = dateSelect.value;
        if (!domain || !date) {
          preview.src = '';
          urlDiv.textContent = '';
          return;
        }
        const baseSrc = `./${domain}/${date}/${domain}/index.html`;
        preview.src = baseSrc;
        localStorage.setItem('lastDomain', domain);
        localStorage.setItem('lastDate', date);
        updateUrlDisplay(baseSrc, domain, date);
      }

      // Restore previous selection
      const lastDomain = localStorage.getItem('lastDomain');
      const lastDate = localStorage.getItem('lastDate');
      if (lastDomain && manifest[lastDomain]) {
        domainSelect.value = lastDomain;
        const dates = manifest[lastDomain];
        dateSelect.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
        if (lastDate && dates.includes(lastDate)) dateSelect.value = lastDate;
        loadArchive();
      }

      function preventExternalTargets(iframe) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          if (!doc) return;
          const links = doc.querySelectorAll('a[target="_blank"], a[target="_top"], a[target="_parent"]');
          links.forEach(link => {
            link.removeAttribute('target');
          });
        } catch(e) {
          // Cross-origin, ignore
        }
      }

      preview.addEventListener('load', () => {
        preventExternalTargets(preview);

        try {
          const iframeWindow = preview.contentWindow;
          const iframeLocation = iframeWindow.location;
          const domain = domainSelect.value;
          const date = dateSelect.value;

          updateUrlDisplay(baseSrc, domain, date);

          // Attach click listener to links to update url display on navigation inside iframe
          const doc = iframeWindow.document;
          if (doc) {
            doc.body.addEventListener('click', function(event) {
              const target = event.target.closest('a');
              if (!target) return;
              const href = target.getAttribute('href');
              if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
              event.preventDefault();
              let newUrl;
              if (href.startsWith('/')) {
                // Absolute path inside iframe origin
                newUrl = new URL(href, iframeLocation.origin).href;
              } else {
                // Relative path
                newUrl = new URL(href, iframeLocation.href).href;
              }
              iframeWindow.location.href = newUrl;
            }, true);
          }
        } catch(e) {
          // Cross-origin, ignore
        }
      });

      // Periodically update url display in case navigation happens programmatically
      setInterval(() => {
        try {
          const iframeWindow = preview.contentWindow;
          const iframeLocation = iframeWindow.location;
          const domain = domainSelect.value;
          const date = dateSelect.value;
          if (!domain || !date) return;
          updateUrlDisplay(iframeLocation.pathname, domain, date);

        } catch(e) {
          // Cross-origin, ignore
        }
      }, 500);
    }

    init().catch(err => {
      document.body.innerHTML = '<div id="manifest-error">Could not load site index. Reason: ' + err.message + '</div>';
    });