/* ==========================================================================
   CREATELINK.JS
   A form for manually building a payment destination link — for one-off
   trades, custom payment methods, or amounts that don't come from an
   existing trade in this app. Uses the exact same link format as the
   "Copy payment link" button on the Trade Window (see core/paymentLink.js),
   so links from either place open the same verify.js page correctly.
   ========================================================================== */

import { renderNavbar } from '../components/navbar.js';
import { buildPaymentLink } from '../core/paymentLink.js';
import { showToast } from '../components/toast.js';

function generateTradeId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TRD-${num}`;
}

export function render() {
  return `
    ${renderNavbar('/create-link')}
    <div class="container create-link-page">
      <h1>Create a payment link</h1>
      <p class="text-muted">
        Build a shareable payment destination link by hand — useful for custom
        trades, one-off amounts, or payment methods outside the usual list.
      </p>

      <form id="create-link-form" class="create-link-form">
        <div class="form-group">
          <label for="field-id">Transaction ID</label>
          <input type="text" id="field-id" placeholder="Leave blank to auto-generate">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="field-seller">Seller name</label>
            <input type="text" id="field-seller" placeholder="e.g. Guest-6EBB">
          </div>
          <div class="form-group">
            <label for="field-buyer">Buyer name</label>
            <input type="text" id="field-buyer" placeholder="e.g. Buyer-3F1A">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="field-amount">Amount *</label>
            <input type="number" id="field-amount" placeholder="e.g. 500" min="0" step="0.01" required>
          </div>
          <div class="form-group">
            <label for="field-currency">Currency</label>
            <select id="field-currency">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="field-method">Payment method</label>
          <input type="text" id="field-method" placeholder="e.g. Bank Transfer, Cash App, Zelle...">
        </div>

        <div class="form-group">
          <label for="field-receiver">Receiver account / address *</label>
          <textarea id="field-receiver" rows="2" placeholder="e.g. Bank: GTBank, Acct: 0123456789, Name: John Doe — or a crypto wallet address" required></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="field-asset">Crypto asset (optional)</label>
            <input type="text" id="field-asset" placeholder="e.g. BTC">
          </div>
          <div class="form-group">
            <label for="field-qty">Quantity (optional)</label>
            <input type="text" id="field-qty" placeholder="e.g. 0.01">
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block">Generate link</button>
      </form>

      <div class="generated-link-box" id="generated-link-box" style="display: none;">
        <label>Your payment link</label>
        <div class="generated-link-row">
          <input type="text" id="generated-link-input" readonly>
          <button class="btn btn-secondary" id="copy-generated-link" type="button">Copy</button>
        </div>
        <a href="#" id="preview-generated-link" class="generated-link-preview">Preview this link →</a>
      </div>
    </div>
  `;
}

export function init() {
  const form = document.getElementById('create-link-form');
  const box = document.getElementById('generated-link-box');
  const linkInput = document.getElementById('generated-link-input');
  const copyBtn = document.getElementById('copy-generated-link');
  const previewLink = document.getElementById('preview-generated-link');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const id = document.getElementById('field-id').value.trim() || generateTradeId();
    const seller = document.getElementById('field-seller').value.trim();
    const buyer = document.getElementById('field-buyer').value.trim();
    const amount = document.getElementById('field-amount').value.trim();
    const currency = document.getElementById('field-currency').value;
    const method = document.getElementById('field-method').value.trim();
    const receiver = document.getElementById('field-receiver').value.trim();
    const asset = document.getElementById('field-asset').value.trim();
    const qty = document.getElementById('field-qty').value.trim();

    if (!amount) {
      showToast('Enter an amount before generating a link', 'danger');
      return;
    }

    if (!receiver) {
      showToast('Enter the receiver account or address before generating a link', 'danger');
      return;
    }

    const link = buildPaymentLink({ id, seller, buyer, amount, currency, method, receiver, asset, qty });

    linkInput.value = link;
    previewLink.href = link.replace(window.location.href.split('#')[0], ''); // relative hash for in-app preview
    box.style.display = 'flex';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard
      .writeText(linkInput.value)
      .then(() => showToast('Link copied to clipboard', 'success'))
      .catch(() => showToast('Could not copy — select and copy the link manually', 'danger'));
  });
}
