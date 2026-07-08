/* ==========================================================================
   TRADEBOT.JS
   Since this app has no backend and no second real user yet, the "buyer"
   side of every trade is played by this bot. It watches for trades
   entering a state that calls for a buyer response, waits a short
   realistic delay, then advances the trade — so the app feels alive
   without you needing two devices to test it.

   CURRENT BEHAVIOR:
   - When a trade becomes "awaiting_payment", the bot waits a few seconds
     and then "pays", submitting mock payment proof.
   That's the only bot behavior for now — accept/reject, release, and
   dispute are all deliberate actions YOU take as the seller.

   HOW TO EXTEND LATER:
   Add more `if (status === '...')` branches below for things like the
   bot occasionally raising a dispute, or cancelling before paying.
   ========================================================================== */

import { updateTrade } from './state.js';
import { showToast } from '../components/toast.js';

// Random delay so it doesn't feel too mechanical, but stays short since
// this is a demo, not a real 15-minute payment window.
function randomDelay(minMs, maxMs) {
  return minMs + Math.random() * (maxMs - minMs);
}

/**
 * Call this right after a trade's status changes. It decides whether the
 * bot needs to do anything, and if so, schedules that action.
 */
export function notifyBotOfStatusChange(tradeId, status) {
  if (status === 'awaiting_payment') {
    const delay = randomDelay(4000, 8000);

    setTimeout(() => {
      const updated = updateTrade(
        tradeId,
        {
          status: 'payment_submitted',
          paymentProof: {
            note: 'Payment proof uploaded by buyer',
            submittedAt: new Date().toISOString(),
          },
        },
        'Buyer submitted payment proof'
      );

      if (updated) {
        showToast(`${updated.counterparty} submitted payment proof for ${updated.id}`, 'info');
      }
    }, delay);
  }
}
