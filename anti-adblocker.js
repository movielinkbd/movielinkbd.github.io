(function() {
  const allowedDomains = ['profitableratecpm.com', 'suspectplainrevulsion.com', 't.me','highperformanceformat.com'];
  const defaultRedirectUrl = 'https://www.profitableratecpm.com/bufni4tbdg?key=2ac9d88809c21bea8979249458091eb0';
  let lastLocation = location.href;

  function extractHostname(url) {
    try {
      return new URL(url, location.href).hostname;
    } catch {
      return '';
    }
  }

  function isMatchedDomain(url) {
    const hostname = extractHostname(url);
    return allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );
  }

  function forceRedirectIfMatched(url) {
    if (isMatchedDomain(url)) {
      if (location.href !== defaultRedirectUrl) {
        console.warn('[Block] Matched dangerous URL, redirecting to safe:', url);
        location.href = defaultRedirectUrl;
      }
      return true;
    }
    return false;
  }

  // Intercept all click events globally
  document.addEventListener('click', function(e) {
    let target = e.target;
    
    // Traverse up the DOM to find clickable elements
    while (target && target !== document) {
      // Detect <a> tag
      if (target.tagName === 'A' && target.href) {
        if (isMatchedDomain(target.href)) {
          e.preventDefault();
          forceRedirectIfMatched(target.href);
          return;
        }
      }

      // Detect inline onclick attribute with redirect
      if (target.hasAttribute('onclick')) {
        const code = target.getAttribute('onclick');
        if (code.includes('location') || code.includes('window.open')) {
          const tempFunc = new Function(code);
          try {
            tempFunc(); // simulate
            setTimeout(() => {
              if (location.href !== lastLocation) {
                forceRedirectIfMatched(location.href);
              }
            }, 10);
          } catch {}
        }
      }

      target = target.parentNode;
    }
  }, true); // Use capture phase to catch early

  // Override window.location methods
  ['assign', 'replace'].forEach(method => {
    const original = window.location[method];
    window.location[method] = function(url) {
      if (!forceRedirectIfMatched(url)) {
        return original.call(window.location, url);
      }
    };
  });

  // Override href setter
  const hrefSetter = Object.getOwnPropertyDescriptor(Location.prototype, 'href').set;
  Object.defineProperty(window.location, 'href', {
    set: function(url) {
      if (!forceRedirectIfMatched(url)) {
        hrefSetter.call(window.location, url);
      }
    }
  });

  // History API override
  ['pushState', 'replaceState'].forEach(method => {
    const original = history[method];
    history[method] = function(state, title, url) {
      if (!forceRedirectIfMatched(url)) {
        return original.call(history, state, title, url);
      }
    };
  });

  // Interval check for location change (backup)
  setInterval(() => {
    if (location.href !== lastLocation) {
      lastLocation = location.href;
      forceRedirectIfMatched(location.href);
    }
  }, 300);

  // MutationObserver to catch unexpected DOM/script changes
  const observer = new MutationObserver(() => {
    if (location.href !== lastLocation) {
      lastLocation = location.href;
      forceRedirectIfMatched(location.href);
    }
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });

  // Override window.open to catch JS popup redirects
  const originalWindowOpen = window.open;
  window.open = function(url, ...args) {
    if (isMatchedDomain(url)) {
      forceRedirectIfMatched(url);
      return null;
    }
    return originalWindowOpen.call(window, url, ...args);
  };

})();