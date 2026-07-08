/* ==========================================================================
   TRADEHISTORY.JS
   Lists every trade the guest has been part of, newest first. Tapping a
   row navigates to that trade's detail page (js/pages/tradeDetail.js).
   ========================================================================== */

import { renderNavbar } from '../components/navbar.js';
import { renderStatusBadge } from '../components/statusBadge.js';
import { getState } from '../core/state.js';

function renderTradeRow(trade) {
  return `
    <a href="#/trade/${trade.id}" class="trade-row">
      <div class="trade-row-main">
        <span class="mono trade-row-id">${trade.id}</span>
        <span class="trade-row-counterparty">${trade.counterparty}</span>
      </div>
      <div class="trade-row-amount">
        <span class="mono">${trade.amount} ${trade.asset}</span>
        <span class="trade-row-fiat">≈ $${trade.fiatAmount}</span>
      </div>
      ${renderStatusBadge(trade.status)}
    </a>
  `;
}

export function render() {
  const { trades } = getState();

  const rowsHtml = trades.length
    ? trades.map(renderTradeRow).join('')
    : `<div class="empty-state">
         <p>No trades yet.</p>
         <a href="#/dashboard" class="btn btn-secondary">Back to dashboard</a>
       </div>`;

  return `
    ${renderNavbar('/trades')}
    <div class="container trade-history-page">
      <h1>Trade History</h1>
      <p class="text-muted">Every trade you've been part of, newest first.</p>
      <div class="trade-list">
        ${rowsHtml}
      </div>
    </div>
  `;
}

export function init() {
  // Static list for now — nothing to wire up beyond the links themselves.
}
