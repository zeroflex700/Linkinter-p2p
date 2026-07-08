/* ==========================================================================
   LANDING.JS
   The public landing page. This is a page module: it exports render()
   which returns HTML, and init() which runs after that HTML is on the
   page (used here to animate the ledger strip demo).

   WHY A SEPARATE render() AND init()?
   render() must stay a pure function — string in, string out — so it's
   easy to test and reason about. Anything that touches the live DOM
   (event listeners, animations, timers) belongs in init(), which only
   runs after render()'s HTML actually exists on the page.
   ========================================================================== */

import { renderTrustBadge, renderTrustStrip } from '../components/trustBadge.js';

export function render() {
  return `
    <div class="container">
      <nav class="landing-nav">
        <div class="landing-logo">Trade<span>Vault</span></div>
        <div class="landing-nav-actions">
          <a href="#/dashboard" class="btn btn-secondary">Launch app</a>
        </div>
      </nav>

      <section class="landing-hero">
        <div class="landing-hero-copy">
          <span class="landing-eyebrow">Escrow-protected · No signup required</span>
          <h1>Trade crypto peer to peer, <em>without the guesswork.</em></h1>
          <p>
            Every trade is held in escrow until both sides confirm.
            No account, no password — just open the app and start trading,
            with a clear status from the moment a trade opens to settlement.
          </p>

          <div class="landing-hero-actions">
            <a href="#/dashboard" class="btn btn-primary">Enter the app</a>
            <a href="#/faq" class="btn btn-ghost">How it works →</a>
          </div>
          <div class="landing-trust-badge-wrap">
            ${renderTrustBadge()}
          </div>
        </div>

        <!-- Signature element: a ledger strip showing a mock trade
             confirming in real time. init() below animates this. -->
        <div class="ledger-strip" id="ledger-demo">
          <div class="ledger-strip-header">
            <span>TRADE #A93F-201</span>
            <span>0.05 BTC</span>
          </div>
          <div class="ledger-track" id="ledger-track"></div>
          <div class="ledger-strip-footer">
            <span id="ledger-status">Awaiting confirmation…</span>
            <span class="mono">ESCROW: LOCKED</span>
          </div>
        </div>
      </section>

      <section class="landing-features">
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Fast settlement</h3>
          <p>Sellers release funds the moment payment is confirmed — no waiting on batch processing.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>Escrow on every trade</h3>
          <p>Crypto is locked before a trade opens, so neither side can walk away mid-transaction.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <h3>Built-in trade chat</h3>
          <p>Coordinate payment directly with your counterparty, with a dispute button if anything looks wrong.</p>
        </div>
      </section>

      <section class="landing-trust-strip-section">
        ${renderTrustStrip()}
      </section>

      <footer class="landing-footer">
        <span>© 2026 TradeVault</span>
        <div class="landing-footer-links">
          <a href="#/faq">FAQ</a>
          <a href="#/terms">Terms</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/about">About</a>
        </div>
      </footer>
    </div>
  `;
}

export function init() {
  const track = document.getElementById('ledger-track');
  const status = document.getElementById('ledger-status');
  if (!track) return;

  const TOTAL_TICKS = 12;

  // Build the empty tick strip
  for (let i = 0; i < TOTAL_TICKS; i++) {
    const tick = document.createElement('div');
    tick.className = 'ledger-tick';
    track.appendChild(tick);
  }

  // Animate ticks filling in one by one to suggest a trade confirming live.
  // This is purely decorative on the landing page — the real trade flow
  // (built in a later phase) drives this from actual trade state.
  let filled = 0;
  const ticks = track.querySelectorAll('.ledger-tick');

  const interval = setInterval(() => {
    if (filled >= TOTAL_TICKS) {
      clearInterval(interval);
      status.textContent = 'Trade confirmed';
      status.classList.add('status-success');
      return;
    }
    ticks[filled].classList.add('filled');
    filled++;
  }, 250);
}