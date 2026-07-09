/* ==========================================================================
   NAVBAR.JS
   The nav bar shown across every interior page (Dashboard, Wallet, Market,
   etc). NOT used on the landing page, which has its own simpler nav since
   it's a marketing page, not part of the logged-in-feeling app shell.

   This is a plain function, not a page module — it returns an HTML string
   that page modules embed at the top of their own render() output, and
   pass in which link should show as "active".
   ========================================================================== */

import { getState } from '../core/state.js';

/**
 * @param {string} activePath - current route, e.g. '/dashboard', used to
 *   highlight the matching nav link.
 */
export function renderNavbar(activePath = '') {
  const { guest } = getState();
  const guestName = guest ? guest.name : 'Guest';

  const links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/trades', label: 'Trades' },
    { path: '/market', label: 'Market' },
  ];

  const linksHtml = links
    .map(
      (link) => `
        <a href="#${link.path}" class="navbar-link ${activePath === link.path ? 'active' : ''}">
          ${link.label}
        </a>
      `
    )
    .join('');

  return `
    <nav class="app-navbar">
      <div class="container app-navbar-inner">
        <a href="#/dashboard" class="landing-logo">Interlink<span>Network</span></a>
        <div class="app-navbar-links">${linksHtml}</div>

        <!-- Guest identity badge. This is the only visible sign that a
             "session" exists at all — no login screen, no username field. -->
        <div class="guest-badge mono" title="Stored on this device only">
          Trading as ${guestName}
        </div>
      </div>
    </nav>
  `;
}
