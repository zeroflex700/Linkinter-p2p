/* ==========================================================================
   APP.JS
   Entry point. Loaded as a <script type="module"> from index.html.
   Its only job: import every page module we have so far, register each
   one against a route, then start the router.

   As new phases add pages (dashboard, wallet, marketplace...), you'll
   import them here and add one line to registerRoute — nothing else
   in this file changes.
   ========================================================================== */

import { registerRoute, startRouter } from './core/router.js';
import { initGuestSession } from './core/state.js';
import { startSocialProofTicker } from './components/socialProof.js';
import * as landingPage from './pages/landing.js';
import * as dashboardPage from './pages/dashboard.js';
import * as tradeHistoryPage from './pages/tradeHistory.js';
import * as tradeDetailPage from './pages/tradeDetail.js';
import * as marketPage from './pages/market.js';
import * as verifyPage from './pages/verify.js';
import * as createLinkPage from './pages/createLink.js';

// Every visitor gets an invisible local identity + starter wallet the
// instant the app loads — this is what makes "no login required" work.
// Must run BEFORE the router, since pages like Dashboard read guest/wallet
// state as soon as they render.
initGuestSession();

// Ambient "recent activity" cards — purely cosmetic social proof, runs
// for the whole session regardless of which page is showing.
startSocialProofTicker();

// Register every known route.
// "/" is the default route shown when there's no hash in the URL yet.
registerRoute('/', landingPage);
registerRoute('/dashboard', dashboardPage);
registerRoute('/trades', tradeHistoryPage);
registerRoute('/trade/:id', tradeDetailPage);
registerRoute('/market', marketPage);
registerRoute('/verify', verifyPage);
registerRoute('/create-link', createLinkPage);

// Boot the app once this script runs.
startRouter();