/* ==========================================================================
   MOCKOFFERS.JS
   Marketplace listings. Since the bot only ever plays the buyer side (see
   tradeBot.js), every offer here is a BUY offer — someone wanting to
   purchase BTC from you. You browse these and pick one to fulfill, which
   creates a real trade using the same engine as the "Simulate incoming
   trade" button on the dashboard.

   In a later phase with a real backend, this file's job would be
   replaced by an API call — nothing else in market.js would need to change.
   ========================================================================== */

const PAYMENT_METHODS = ['Bank Transfer', 'Mobile Money', 'PayPal'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSubset(arr) {
  // Every offer supports at least one payment method, sometimes two.
  const first = pick(arr);
  const rest = arr.filter((m) => m !== first);
  return Math.random() > 0.5 ? [first, pick(rest)] : [first];
}

function generateOfferId() {
  return `OFR-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateTraderName() {
  const chars = '0123456789ABCDEF';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `Buyer-${suffix}`;
}

/**
 * Builds a fresh set of marketplace offers. Called once when the module
 * loads (see the exported `offers` below) so the list stays stable while
 * you're browsing, rather than reshuffling on every re-render.
 */
function generateOffers() {
  const baseRate = 65000; // mock BTC/USD rate

  return Array.from({ length: 6 }).map(() => {
    // Rate varies slightly between traders, like a real order book would.
    const rate = Math.round(baseRate * (0.985 + Math.random() * 0.03));
    const minAmount = Number((0.003 + Math.random() * 0.005).toFixed(4));
    const maxAmount = Number((minAmount + Math.random() * 0.03).toFixed(4));

    return {
      id: generateOfferId(),
      trader: generateTraderName(),
      type: 'buy', // reserved for a future 'sell' offer type once buyers can list too
      asset: 'BTC',
      rate,
      minAmount,
      maxAmount,
      paymentMethods: pickSubset(PAYMENT_METHODS),
      online: Math.random() > 0.25,
    };
  });
}

// Generated once at import time — see comment above.
export const offers = generateOffers();
