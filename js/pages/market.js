/* ==========================================================================
   MARKET.JS
   Marketplace: a list of buy offers from other traders (bot-played
   buyers). You pick one and choose a payment method, which opens a real
   trade using the same engine built in the Trade Flow phase.

   FILTERING:
   The payment-method filter re-renders just the offer list, not the
   whole page, so the filter controls themselves don't flicker/reset.
   ========================================================================== */

import { renderNavbar } from '../components/navbar.js';
import { offers } from '../data/mockOffers.js';
import { createTradeFromOffer } from '../data/mockTrades.js';
import { addTrade, hasPassphraseSet, setPassphrase, verifyPassphrase } from '../core/state.js';
import { showToast } from '../components/toast.js';
import { showModal, closeModal } from '../components/modal.js';
import { navigateTo } from '../core/router.js';

// Keeps track of the currently selected filter across re-renders of the
// list (not the whole page), so re-filtering doesn't clobber itself.
let activeFilter = 'all';

function renderOfferCard(offer) {
  const methodsHtml = offer.paymentMethods
    .map((m) => `<span class="offer-method-tag">${m}</span>`)
    .join('');

  return `
    <div class="offer-card">
      <div class="offer-card-top">
        <div class="offer-trader">
          <span class="offer-status-dot ${offer.online ? 'online' : ''}"></span>
          <span>${offer.trader}</span>
        </div>
        <span class="offer-rate mono">$${offer.rate.toLocaleString()} <span class="text-muted">/ BTC</span></span>
      </div>

      <div class="offer-limits mono">
        Limit: ${offer.minAmount} – ${offer.maxAmount} BTC
      </div>

      <div class="offer-methods">${methodsHtml}</div>

      <div class="offer-actions">
        <select class="offer-payment-select" data-offer-id="${offer.id}">
          ${offer.paymentMethods.map((m) => `<option value="${m}">${m}</option>`).join('')}
        </select>
        <button class="btn btn-primary" data-action="sell" data-offer-id="${offer.id}">
          Sell BTC
        </button>
      </div>
    </div>
  `;
}

function renderOfferList() {
  const filtered =
    activeFilter === 'all'
      ? offers
      : offers.filter((o) => o.paymentMethods.includes(activeFilter));

  if (!filtered.length) {
    return `<div class="empty-state"><p>No offers match that payment method right now.</p></div>`;
  }

  return filtered.map(renderOfferCard).join('');
}

/**
 * Actually creates the trade once ownership is verified (or a passphrase
 * has just been set for the first time).
 */
function completeSale(offer, paymentMethod) {
  const trade = createTradeFromOffer(offer, paymentMethod);
  addTrade(trade);
  showToast(`Trade opened with ${offer.trader}`, 'success');
  navigateTo(`/trade/${trade.id}`);
}

/**
 * The single passphrase popup used every time someone sells — framed as
 * unlocking an existing wallet, never as "creating" anything. Under the
 * hood, the very first time this runs there's nothing stored yet, so
 * whatever is entered quietly becomes the reference passphrase; every
 * time after that, it's checked against what was entered before.
 */
function openPassphraseModal(offer, paymentMethod) {
  showModal({
    title: 'Verify Wallet Ownership',
    bodyHtml: `
      <div class="modal-input-group">
        <textarea id="wallet-passphrase" rows="3" placeholder="Enter your 12 words passphrase here"></textarea>
      </div>
      <p class="modal-error" id="passphrase-error">Incorrect passphrase — try again.</p>
      <div class="modal-actions">
        <button class="btn btn-primary" id="passphrase-submit">Unlock & Sell</button>
        <button class="btn btn-secondary" id="passphrase-cancel">Cancel</button>
      </div>
      <p class="modal-disclaimer">
        Your passphrase never leaves this device. This is a demo feature — no real funds are secured by it.
      </p>
    `,
    onMount: (root) => {
      const input = root.querySelector('#wallet-passphrase');
      const errorEl = root.querySelector('#passphrase-error');

      root.querySelector('#passphrase-cancel').addEventListener('click', closeModal);

      root.querySelector('#passphrase-submit').addEventListener('click', () => {
        const value = input.value.trim();

        if (!value) {
          errorEl.textContent = 'Please enter your passphrase.';
          errorEl.classList.add('visible');
          return;
        }

        if (hasPassphraseSet()) {
          if (!verifyPassphrase(value)) {
            errorEl.textContent = 'Incorrect passphrase — try again.';
            errorEl.classList.add('visible');
            input.value = '';
            input.focus();
            return;
          }
        } else {
          // Nothing stored yet — this is effectively "first unlock",
          // so what's entered now becomes the reference passphrase.
          setPassphrase(value);
        }

        closeModal();
        completeSale(offer, paymentMethod);
      });
    },
  });
}

export function render() {
  return `
    ${renderNavbar('/market')}
    <div class="container market-page">
      <h1>Marketplace</h1>
      <p class="text-muted">Buy offers from other traders. Choose one to sell your BTC into.</p>

      <div class="market-filter-bar">
        <label for="payment-filter">Payment method</label>
        <select id="payment-filter">
          <option value="all">All methods</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Mobile Money">Mobile Money</option>
          <option value="PayPal">PayPal</option>
        </select>
      </div>

      <div class="offer-list" id="offer-list">
        ${renderOfferList()}
      </div>
    </div>
  `;
}

export function init() {
  const filterSelect = document.getElementById('payment-filter');
  const offerList = document.getElementById('offer-list');

  if (filterSelect) {
    filterSelect.value = activeFilter;
    filterSelect.addEventListener('change', () => {
      activeFilter = filterSelect.value;
      offerList.innerHTML = renderOfferList();
    });
  }

  // Event delegation: one listener on the container handles clicks on
  // every "Sell BTC" button, including ones added after re-filtering.
  offerList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="sell"]');
    if (!button) return;

    const offerId = button.dataset.offerId;
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;

    const select = offerList.querySelector(`.offer-payment-select[data-offer-id="${offerId}"]`);
    const paymentMethod = select ? select.value : offer.paymentMethods[0];

    // Ownership check before any trade opens.
    openPassphraseModal(offer, paymentMethod);
  });
}
