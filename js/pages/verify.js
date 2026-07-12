/* ==========================================================================
   VERIFY.JS
   The seller's confirmation screen. This is NOT the buyer's payment page —
   it's for the seller (the one receiving payment and releasing crypto) to:
   1. Double-check the receiving account/address details are correct
   2. Confirm they're ready to proceed by verifying their wallet passphrase

   Every detail shown comes straight from the URL's query params
   (?id=...&seller=...&amount=...) — there is no database lookup, no
   backend call. Whoever opens the link sees exactly what was encoded
   into it when it was shared.

   PASSPHRASE STEP:
   This reuses the exact same mock passphrase system from core/state.js
   that the Marketplace sell flow uses — same device, same stored
   passphrase. It's framed here as proof the seller holds the funds
   they're claiming to sell, NOT as a payment action. Nothing about the
   wallet or balances is touched by verifying here; it's a confirmation
   gesture only, and the page says so plainly so the seller isn't left
   wondering if something moved behind the scenes.

   WHY NO APP NAVBAR:
   The regular navbar shows the CURRENT device's guest identity, which
   could be confused with the seller/buyer named in the link if opened
   on a different device. This page gets its own minimal header instead.
   ========================================================================== */

import { hasPassphraseSet, setPassphrase, verifyPassphrase } from '../core/state.js';
import { showModal, closeModal } from '../components/modal.js';
import { renderTrustBadge } from '../components/trustBadge.js';

// How long the "please wait" processing state shows before resolving.
// Set to a full minute per request — worth knowing this makes manual
// testing slower; drop this back down (e.g. to 1500) if you want faster
// iteration while developing, then raise it again for the real feel.
const VERIFICATION_DELAY_MS = 60000;

function renderRow(label, value) {
  return `
    <div class="verify-row">
      <span class="verify-label">${label}</span>
      <span class="verify-value mono">${value}</span>
    </div>
  `;
}

/** The passphrase entry form shown inside the popup. */
function buildPassphraseFormBody(errorMessage) {
  return `
    <p>Enter your demo passphrase to confirm you hold the funds and are ready to proceed.</p>
    <div class="modal-input-group">
      <textarea id="modal-passphrase" rows="3" placeholder="Enter your demo passphrase"></textarea>
    </div>
    <p class="modal-error ${errorMessage ? 'visible' : ''}" id="modal-passphrase-error">${errorMessage || ''}</p>
    <div class="modal-actions">
      <button class="btn btn-primary" id="modal-passphrase-submit">Verify & confirm trade</button>
      <button class="btn btn-secondary" id="modal-passphrase-cancel">Cancel</button>
    </div>
    <p class="modal-disclaimer">
      ⚠️ Demo only — this is not a real wallet. Never enter a real wallet seed phrase or private key here or anywhere outside your actual wallet app. This only confirms identity locally; it does not access, move, or transmit any funds.
    </p>
  `;
}

/** The "please wait" state shown mid-verification, before success/failure. */
function buildLoadingBody() {
  return `
    <div class="verify-loading">
      <div class="verify-spinner"></div>
      <p>Please wait, while we verify your account…</p>
    </div>
  `;
}

/** Wires up the popup's Cancel/Verify buttons. Called both on first open
 *  and again any time the form is redrawn after a validation error. */
function bindPassphraseFormEvents(root, onVerified) {
  const cancelBtn = root.querySelector('#modal-passphrase-cancel');
  const submitBtn = root.querySelector('#modal-passphrase-submit');
  const textarea = root.querySelector('#modal-passphrase');

  cancelBtn.addEventListener('click', closeModal);

  submitBtn.addEventListener('click', () => {
    const value = textarea.value.trim();

    if (value.length < 4) {
      const body = root.querySelector('.modal-body');
      body.innerHTML = buildPassphraseFormBody('Please enter your passphrase.');
      bindPassphraseFormEvents(root, onVerified);
      return;
    }

    // Show the processing state before revealing success or failure, so
    // the check feels like it's actually doing something rather than
    // resolving instantly.
    const body = root.querySelector('.modal-body');
    body.innerHTML = buildLoadingBody();

    setTimeout(() => {
      if (hasPassphraseSet()) {
        if (verifyPassphrase(value)) {
          closeModal();
          onVerified();
        } else {
          body.innerHTML = buildPassphraseFormBody('Incorrect passphrase — try again.');
          bindPassphraseFormEvents(root, onVerified);
        }
      } else {
        // Nothing stored yet on this device — first verification becomes
        // the reference passphrase, same behavior as the Marketplace flow.
        setPassphrase(value);
        closeModal();
        onVerified();
      }
    }, VERIFICATION_DELAY_MS);
  });
}

/** Opens the passphrase popup. `onVerified` runs once verification succeeds. */
function openPassphraseModal(onVerified) {
  showModal({
    title: 'Verify your passphrase',
    bodyHtml: buildPassphraseFormBody(),
    onMount: (root) => bindPassphraseFormEvents(root, onVerified),
    theme: 'light',
  });
}

export function render(params) {
  const q = params.query || {};
  const hasRequiredFields = q.id && q.amount;

  if (!hasRequiredFields) {
    return `
      <div class="verify-page-bg">
        <div class="container verify-page">
          <div class="verify-header">
            <span class="landing-logo">Trade<span>Vault</span></span>
          </div>
          <div class="verify-card">
            <h2>Link incomplete</h2>
            <p class="text-muted">This trade link is missing required details. Generate it again.</p>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="verify-page-bg">
      <div class="container verify-page">
        <div class="verify-header">
          <span class="landing-logo">Trade<span>Vault</span></span>
        </div>

        <div class="verify-card">
          <span class="badge badge-warning">Seller Verification</span>
          <h1>Confirm you're ready to proceed</h1>
          <p class="text-muted">Review the trade details below, then verify your passphrase to confirm you hold the funds and are ready to release them once payment is received.</p>
          ${renderTrustBadge()}

          <div class="verify-details">
            ${renderRow('Transaction ID', q.id)}
            ${q.seller ? renderRow('Seller', q.seller) : ''}
            ${q.buyer ? renderRow('Buyer', q.buyer) : ''}
            ${renderRow('Amount expected', `$${q.amount} ${q.currency || 'USD'}`)}
            ${q.method ? renderRow('Payment method', q.method) : ''}
            ${q.asset ? renderRow('Crypto to release', `${q.qty || ''} ${q.asset}`) : ''}
          </div>

          ${(q.bankName || q.accountNumber || q.receiver) ? `
            <div class="verify-receiver">
              <span class="verify-label">Your receiving details</span>
              ${q.bankName ? `
                <div class="verify-receiver-line">
                  <span class="verify-receiver-line-label">Bank Name</span>
                  <span class="verify-receiver-value mono">${q.bankName}</span>
                </div>
              ` : ''}
              ${q.accountNumber ? `
                <div class="verify-receiver-line">
                  <span class="verify-receiver-line-label">Account Number</span>
                  <span class="verify-receiver-value mono">${q.accountNumber}</span>
                </div>
              ` : ''}
              ${q.receiver ? `
                <div class="verify-receiver-line">
                  <span class="verify-receiver-line-label">${(q.bankName || q.accountNumber) ? 'Additional Details' : 'Account / Address'}</span>
                  <span class="verify-receiver-value mono">${q.receiver}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="verify-warning">
            Make sure these are really your receiving details. If anything above doesn't match what you set up, do not proceed.
          </div>

          <div class="verify-confirm-section" id="verify-confirm-section">
            <h2>Ready to proceed?</h2>
            <p class="text-muted">You'll verify your passphrase to confirm you hold the funds.</p>
            <button class="btn btn-primary btn-block" id="verify-proceed-btn">Proceed to verify</button>
            <p class="verify-safe-note">
              ⚠️ Demo only — never enter a real wallet seed phrase here. This only confirms identity locally; it does not access, move, or transmit any funds.
            </p>
          </div>

          <div class="verify-success" id="verify-success" style="display: none;">
            <span class="badge badge-success">Verified</span>
            <p>You've confirmed you're ready. Let the buyer know to send payment through the method above.</p>
          </div>
        </div>

        <p class="verify-footnote">
          This page displays details directly from the link — nothing here is verified by a server.
          Treat it the same as any trade instructions sent by a counterparty.
        </p>
      </div>
    </div>
  `;
}

export function init() {
  const proceedBtn = document.getElementById('verify-proceed-btn');
  if (!proceedBtn) return; // "link incomplete" state has nothing to wire up

  const confirmSection = document.getElementById('verify-confirm-section');
  const successSection = document.getElementById('verify-success');

  proceedBtn.addEventListener('click', () => {
    openPassphraseModal(() => {
      confirmSection.style.display = 'none';
      successSection.style.display = 'flex';
    });
  });
}
