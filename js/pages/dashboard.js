/* ==========================================================================
   DASHBOARD.JS
   First interior page a guest sees after entering the app. Minimal for
   now — just proves the guest session + wallet state are wired up.
   Later phases will add real trade activity, charts, etc. here.
   ========================================================================== */

import { renderNavbar } from '../components/navbar.js';
import { getState, addTrade } from '../core/state.js';
import { createIncomingTradeRequest } from '../data/mockTrades.js';
import { showToast } from '../components/toast.js';
import { navigateTo } from '../core/router.js';

export function render() {
  const { guest, wallet, trades } = getState();
  const activeTrades = trades.filter((t) =>
    ['requested', 'accepted', 'awaiting_payment', 'payment_submitted'].includes(t.status)
  ).length;

  return `
    ${renderNavbar('/dashboard')}
    <div class="container dashboard-page">
      <h1>Welcome, ${guest ? guest.name : 'Guest'}</h1>
      <p class="text-muted">
        Your session is stored on this device only — no account, no password.
      </p>

      <div class="dashboard-grid">
        <div class="stat-card">
          <span class="stat-label">BTC Balance</span>
          <span class="stat-value mono">${wallet ? wallet.btc : 0} BTC</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">USDT Balance</span>
          <span class="stat-value mono">${wallet ? wallet.usdt : 0} USDT</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Active Trades</span>
          <span class="stat-value mono">${activeTrades}</span>
        </div>
      </div>

      <div class="dashboard-actions">
        <a href="#/market" class="btn btn-primary">Browse marketplace</a>
        <a href="#/trades" class="btn btn-secondary">Trade history</a>
      </div>

      <!-- Stand-in for the Marketplace phase: manufactures a new incoming
           trade request from the bot-played buyer, so the trade flow can
           be tested end-to-end before real listings exist. -->
      <div class="dashboard-demo-panel">
        <h3>Demo tools</h3>
        <p class="text-muted">Marketplace isn't built yet — use this to simulate a buyer requesting a trade with you.</p>
        <div class="dashboard-demo-actions">
          <button class="btn btn-secondary" id="simulate-trade-btn">Simulate incoming trade request</button>
          <a href="#/create-link" class="btn btn-secondary">Create custom payment link</a>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const button = document.getElementById('simulate-trade-btn');
  if (!button) return;

  button.addEventListener('click', () => {
    const trade = createIncomingTradeRequest();
    addTrade(trade);
    showToast(`${trade.counterparty} wants to buy ${trade.amount} BTC`, 'info');
    navigateTo(`/trade/${trade.id}`);
  });
}
