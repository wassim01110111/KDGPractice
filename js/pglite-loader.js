// Loads PGlite from a CDN (pinned). To self-host, copy the package's dist/ folder into js/vendor/ and change this URL to './vendor/index.js'.
window.pgliteReady = import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.2.17/dist/index.js').then(m => (window.PGlite = m.PGlite));
window.pgliteReady.catch(e => console.error('PGlite failed to load', e));
