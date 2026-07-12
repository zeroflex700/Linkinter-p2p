/* ==========================================================================
   SOCIALPROOF.JS
   Every so often, shows a small card in the corner like "Buyer-3F1A just
   completed a $520 trade" — the kind of ambient social proof e-commerce
   sites use. These are generated locally, not real activity (there's no
   backend to source real activity from). Renders into #social-proof-container
   in index.html, kept separate from the toast system since toasts report
   real state changes for the CURRENT user's own trades — mixing the two
   would make real notifications harder to trust.
   ========================================================================== */

const ACTION_TEMPLATES = [
  (name, amount) => `${name} just completed a $${amount} trade`,
  (name, amount) => `${name} just sold BTC for $${amount}`,
  (name, amount) => `${name} just bought USDT worth $${amount}`,
  (name, amount) => `${name} just released escrow on a $${amount} trade`,
];

function generateName() {
  const roles = ['Buyer', 'Seller', 'Trader'];
  const chars = '0123456789ABCDEF';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  return `${role}-${suffix}`;
}

function generateMessage() {
  const name = generateName();
  const amount = Math.floor(50 + Math.random() * 950);
  const template = ACTION_TEMPLATES[Math.floor(Math.random() * ACTION_TEMPLATES.length)];
  return template(name, amount);
}

function showOne() {
  const container = document.getElementById('social-proof-container');
  if (!container) return;

  const card = document.createElement('div');
  card.className = 'social-proof-card';
  card.innerHTML = `<span class="social-proof-dot"></span> ${generateMessage()}`;
  container.appendChild(card);

  requestAnimationFrame(() => card.classList.add('social-proof-visible'));

  setTimeout(() => {
    card.classList.remove('social-proof-visible');
    setTimeout(() => card.remove(), 400);
  }, 4500);
}

/** Random delay so appearances feel occasional rather than metronomic. */
function randomDelay() {
  return 20000 + Math.random() * 20000; // 10–15 seconds
}

function scheduleNext() {
  setTimeout(() => {
    showOne();
    scheduleNext();
  }, randomDelay());
}

/**
 * Starts the ticker. Call once when the app boots (see app.js) — it
 * schedules itself indefinitely, there's no need to call it again.
 */
export function startSocialProofTicker() {
  scheduleNext();
}