/* ==========================================================================
   TRADEDETAIL.JS
   The "Trade Window" — the single most important screen in the app.
   Shows one trade's full status, the escrow lock state, a countdown timer
   while payment is pending, the buyer's payment proof once submitted, and
   whichever action buttons make sense for the current status (accept/
   reject, cancel, release, dispute).

   RE-RENDERING PATTERN:
   Button clicks change trade state, then call rerender() to redraw this
   same page with fresh data — rather than navigating away and back.
   This keeps the URL (and browser back button) stable while still
   reflecting live state changes.
   ========================================================================== */

import { renderNavbar } from '../components/navbar.js';
import { renderStatusBadge } from '../components/statusBadge.js';
import { getState, getTradeById, updateTrade, updateWallet } from '../core/state.js';
import { notifyBotOfStatusChange } from '../core/tradeBot.js';
import { showToast } from '../components/toast.js';
import { buildPaymentLink } from '../core/paymentLink.js';

// The linear "happy path" a trade moves through. Used to fill the ledger
// timeline ticks. Terminal off-path statuses (rejected/cancelled/disputed)
// are handled separately since they don't fit a forward progression.
const STAGES = ['requested', 'accepted', 'awaiting_payment', 'payment_submitted', 'released', 'completed'];
const OFF_PATH_STATUSES = ['rejected', 'cancelled', 'disputed'];

// Countdown timer needs to survive across the render/init cycle so we can
// clear it before starting a new one — otherwise every re-render would
// leak another running interval.
let countdownInterval = null;

function formatCountdown(msRemaining) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function renderLedger(status) {
  if (OFF_PATH_STATUSES.includes(status)) {
    return `
      <div class="ledger-strip">
        <div class="ledger-strip-header">
          <span>TRADE PROGRESS</span>
        </div>
        <p class="off-path-message">This trade did not complete — see status above.</p>
      </div>
    `;
  }

  const currentIndex = STAGES.indexOf(status);
  const ticksHtml = STAGES.map((stage, i) => {
    const filled = i <= currentIndex ? 'filled' : '';
    return `<div class="ledger-tick ${filled}"></div>`;
  }).join('');

  return `
    <div class="ledger-strip">
      <div class="ledger-strip-header">
        <span>TRADE PROGRESS</span>
      </div>
      <div class="ledger-track">${ticksHtml}</div>
    </div>
  `;
}

function renderEscrowIndicator(status) {
  let label = 'ESCROW: NOT LOCKED';
  let cssClass = '';

  if (['awaiting_payment', 'payment_submitted'].includes(status)) {
    label = 'ESCROW: LOCKED';
    cssClass = 'escrow-locked';
  } else if (['released', 'completed'].includes(status)) {
    label = 'ESCROW: RELEASED';
    cssClass = 'escrow-released';
  } else if (OFF_PATH_STATUSES.includes(status)) {
    label = 'ESCROW: N/A';
  }

  return `<span class="escrow-indicator ${cssClass} mono">${label}</span>`;
}

function renderActions(trade) {
  const copyLinkButton = ['awaiting_payment', 'payment_submitted'].includes(trade.status)
    ? `<button class="btn btn-secondary" data-action="copy-link">Copy payment link</button>`
    : '';

  switch (trade.status) {
    case 'requested':
      return `
        <button class="btn btn-primary" data-action="accept">Accept trade</button>
        <button class="btn btn-secondary" data-action="reject">Reject</button>
      `;
    case 'awaiting_payment':
      return `
        <button class="btn btn-secondary" data-action="cancel">Cancel trade</button>
        ${copyLinkButton}
      `;
    case 'payment_submitted':
      return `
        <button class="btn btn-primary" data-action="release">Release escrow</button>
        <button class="btn btn-secondary" data-action="dispute">Open dispute</button>
        ${copyLinkButton}
      `;
    default:
      return `<a href="#/trades" class="btn btn-secondary">Back to trade history</a>`;
  }
}

function renderPaymentProof(trade) {
  if (!trade.paymentProof) return '';

  return `
    <div class="payment-proof-card">
      <h3>Payment proof</h3>
      <p>${trade.paymentProof.note}</p>
      <span class="mono text-muted">Submitted ${new Date(trade.paymentProof.submittedAt).toLocaleString()}</span>
    </div>
  `;
}

/**
 * Builds this trade's shareable payment link using its real data, via
 * the shared builder in core/paymentLink.js.
 */
function buildTradePaymentLink(trade, sellerName) {
  return buildPaymentLink({
    id: trade.id,
    seller: sellerName,
    buyer: trade.counterparty,
    amount: trade.fiatAmount,
    currency: trade.fiatCurrency,
    method: trade.paymentMethod,
    asset: trade.asset,
    qty: trade.amount,
  });
}

export function render(params) {
  const trade = getTradeById(params.id);

  if (!trade) {
    return `
      ${renderNavbar('/trades')}
      <div class="container" style="padding-top: 40px; text-align: center;">
        <h2>Trade not found</h2>
        <a href="#/trades" class="btn btn-secondary" style="margin-top: 16px;">Back to trade history</a>
      </div>
    `;
  }

  return `
    ${renderNavbar('/trades')}
    <div class="container trade-detail-page">
      <div class="trade-detail-header">
        <div>
          <span class="mono trade-detail-id">${trade.id}</span>
          ${renderStatusBadge(trade.status)}
        </div>
        ${renderEscrowIndicator(trade.status)}
      </div>

      <div class="trade-detail-amount">
        <span class="trade-amount-crypto mono">${trade.amount} ${trade.asset}</span>
        <span class="trade-amount-fiat">≈ $${trade.fiatAmount} ${trade.fiatCurrency}</span>
      </div>

      <div class="trade-detail-meta">
        <span>Counterparty: <strong>${trade.counterparty}</strong></span>
        <span>Payment method: <strong>${trade.paymentMethod}</strong></span>
      </div>

      ${trade.status === 'awaiting_payment' ? `
        <div class="trade-timer">
          <span>Time left to pay</span>
          <span class="mono trade-timer-value" id="trade-countdown">--:--</span>
        </div>
      ` : ''}

      ${renderLedger(trade.status)}

      ${renderPaymentProof(trade)}

      <div class="trade-detail-actions">
        ${renderActions(trade)}
      </div>
    </div>
  `;
}

/**
 * Redraws this page in place with fresh trade data, without changing
 * the URL — used after every action so the guest sees the update
 * immediately.
 */
function rerender(params) {
  const appView = document.getElementById('app-view');
  appView.innerHTML = render(params);
  init(params);
}

function startCountdownIfNeeded(trade, params) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  if (trade.status !== 'awaiting_payment' || !trade.deadline) return;

  const el = document.getElementById('trade-countdown');
  if (!el) return;

  const deadline = new Date(trade.deadline).getTime();

  countdownInterval = setInterval(() => {
    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;

      // Payment window expired without the buyer paying — auto-cancel.
      // In practice the bot always pays within seconds, so this mostly
      // guards against edge cases rather than firing in normal use.
      const updated = updateTrade(trade.id, { status: 'cancelled' }, 'Payment window expired — trade cancelled');
      showToast(`${updated.id} cancelled — payment window expired`, 'danger');
      rerender(params);
      return;
    }

    el.textContent = formatCountdown(remaining);
  }, 1000);

  el.textContent = formatCountdown(deadline - Date.now());
}

export function init(params) {
  const trade = getTradeById(params.id);
  if (!trade) return;

  startCountdownIfNeeded(trade, params);

  const actionsContainer = document.querySelector('.trade-detail-actions');
  if (!actionsContainer) return;

  actionsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;

    if (action === 'accept') {
      // Locks escrow and starts the payment window. 5 minutes gives a
      // realistic window while still resolving in one sitting — the bot
      // will almost always pay within seconds of this.
      const deadline = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const updated = updateTrade(
        trade.id,
        { status: 'awaiting_payment', deadline },
        'Seller accepted trade — escrow locked'
      );
      notifyBotOfStatusChange(updated.id, updated.status);
      showToast(`Trade ${updated.id} accepted — escrow locked`, 'success');
    }

    if (action === 'reject') {
      updateTrade(trade.id, { status: 'rejected' }, 'Seller rejected trade');
      showToast(`Trade ${trade.id} rejected`, 'info');
    }

    if (action === 'cancel') {
      updateTrade(trade.id, { status: 'cancelled' }, 'Seller cancelled trade');
      showToast(`Trade ${trade.id} cancelled`, 'info');
    }

    if (action === 'release') {
      // Releasing escrow completes the trade and deducts the crypto from
      // the guest's (seller's) wallet, since it has now gone to the buyer.
      updateWallet({ btc: Number((getState().wallet.btc - trade.amount).toFixed(8)) });
      updateTrade(
        trade.id,
        { status: 'completed' },
        'Seller released escrow — trade completed'
      );
      showToast(`Trade ${trade.id} completed`, 'success');
    }

    if (action === 'dispute') {
      updateTrade(trade.id, { status: 'disputed' }, 'Seller opened a dispute');
      showToast(`Trade ${trade.id} marked as disputed`, 'danger');
    }

    if (action === 'copy-link') {
      const sellerName = getState().guest ? getState().guest.name : 'Seller';
      const link = buildTradePaymentLink(trade, sellerName);

      navigator.clipboard
        .writeText(link)
        .then(() => showToast('Payment link copied to clipboard', 'success'))
        .catch(() => showToast('Could not copy link — copy it manually from the address bar', 'danger'));

      // No trade state changed, no need to rerender.
      return;
    }

    rerender(params);
  });
}
