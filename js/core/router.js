/* ==========================================================================
   ROUTER.JS
   A tiny hash-based router. Why hash-based (#/dashboard) instead of real
   URL paths? Because this project has no backend server — it's just static
   files opened in a browser. Hash routes work with zero server config,
   which matters since you're developing straight from Acode/Chrome on
   a phone with no local server setup.

   DYNAMIC SEGMENTS:
   Routes can include a ":param" segment, e.g. registerRoute('/trade/:id', ...).
   When the hash is "#/trade/TRD-001", the router matches it against the
   pattern and extracts { id: 'TRD-001' }, then passes that object into
   both render(params) and init(params) for the matched page module.

   HOW TO ADD A NEW PAGE:
   1. Create js/pages/yourPage.js exporting { render, init }
   2. Import it in app.js and add one line to registerRoute()
   That's it — no other file needs to change.
   ========================================================================== */

// Each entry: { pattern, paramNames, regex, page }
const routes = [];

/**
 * Turns a pattern like "/trade/:id" into a regex that matches real paths
 * and records which segments are params, so we can pull their values back
 * out later.
 */
function compilePattern(pattern) {
  const paramNames = [];

  const regexBody = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        paramNames.push(segment.slice(1));
        return '([^/]+)'; // matches any single path segment
      }
      // Escape regex-special characters in static segments (defensive,
      // none of our current routes need it, but keeps this safe to extend)
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return {
    regex: new RegExp(`^${regexBody}$`),
    paramNames,
  };
}

/**
 * Registers a page module against a route path. Supports static paths
 * ("/dashboard") and dynamic ones ("/trade/:id").
 */
export function registerRoute(pattern, pageModule) {
  const { regex, paramNames } = compilePattern(pattern);
  routes.push({ pattern, regex, paramNames, page: pageModule });
}

/**
 * Finds the first registered route whose pattern matches the given path.
 * Returns { page, params } or null if nothing matches.
 */
function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { page: route.page, params };
    }
  }
  return null;
}

/**
 * Reads the current hash, finds the matching page module, renders it
 * into #app-view, then runs its init() for event listeners.
 */
function handleRouteChange() {
  // e.g. "#/verify?id=TRD-001&amount=500" -> path "/verify", search "id=TRD-001&amount=500"
  const rawHash = window.location.hash.replace('#', '') || '/';
  const [pathOnly, searchString] = rawHash.split('?');
  const path = pathOnly || '/';

  const appView = document.getElementById('app-view');
  const matched = matchRoute(path);

  if (!matched) {
    // Unknown route — show a simple inline error rather than a blank screen.
    appView.innerHTML = `
      <div class="container" style="padding-top: 80px; text-align: center;">
        <h2>Page not found</h2>
        <p class="mono" style="color: var(--text-muted); margin-top: 8px;">${path}</p>
      </div>
    `;
    return;
  }

  const { page, params } = matched;

  // Query string params (e.g. ?id=...&amount=...) are parsed separately from
  // dynamic path params (e.g. :id) and passed in under `query`, so a page
  // can use both a path param and query params at the same time if needed.
  const query = searchString ? Object.fromEntries(new URLSearchParams(searchString).entries()) : {};
  const fullParams = { ...params, query };

  appView.innerHTML = page.render(fullParams);

  // init() is optional — some pages are static and don't need listeners
  if (typeof page.init === 'function') {
    page.init(fullParams);
  }

  // Every route change should land the user at the top of the new page,
  // not wherever they'd scrolled to on the previous one.
  window.scrollTo(0, 0);
}

/**
 * Starts the router: renders the current route immediately, and
 * re-renders whenever the hash changes (back/forward buttons, link clicks).
 */
export function startRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange(); // render whatever the initial URL points to
}

/**
 * Helper for navigating programmatically from inside page modules,
 * e.g. navigateTo('/trade/TRD-001') after creating a new trade.
 */
export function navigateTo(path) {
  window.location.hash = path;
}
