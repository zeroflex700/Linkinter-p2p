/* ==========================================================================
   TRUSTBADGE.JS
   Two small trust-building UI pieces:

   1. renderTrustBadge() — a star rating + user count. This is illustrative
      marketing copy for a demo, not a real aggregated rating (there's no
      backend to aggregate anything from). Treat the numbers as easy to
      find-and-replace once real data exists.

   2. renderTrustStrip() — security badges. Deliberately generic and
      honest about what the app actually does (escrow, local passphrase
      check, etc.) rather than claiming a third-party audit that never
      happened. Do not swap this for a real audit firm's logo unless
      this app has actually been audited by them.
   ========================================================================== */

export function renderTrustBadge() {
  return `
    <div class="trust-badge">
      <span class="trust-stars">★★★★★</span>
      <span class="trust-badge-text">5/5 rated by 1,200+ traders</span>
    </div>
  `;
}

export function renderTrustStrip() {
  return `
    <div class="trust-strip">
      <div class="trust-item">
        <span class="trust-item-icon">🛡️</span>
        <span>Escrow Protected</span>
      </div>
      <div class="trust-item">
        <span class="trust-item-icon">🔒</span>
        <span>Local Passphrase Security</span>
      </div>
      <div class="trust-item">
        <span class="trust-item-icon">⚡</span>
        <span>Instant Settlement</span>
      </div>
    </div>
  `;
}