/* ==========================================================================
   STATUSBADGE.JS
   Turns a trade status string into a small colored pill. Centralized here
   so History and Detail pages always agree on labels/colors — if you want
   to rename a status or change its color, this is the only file to touch.
   ========================================================================== */

// Maps each possible trade status to a display label and a badge color
// variant (matched to CSS classes in trade.css: badge-warning, badge-primary, etc).
const STATUS_MAP = {
  requested: { label: 'Requested', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'primary' },
  rejected: { label: 'Rejected', variant: 'danger' },
  awaiting_payment: { label: 'Awaiting Payment', variant: 'warning' },
  payment_submitted: { label: 'Payment Submitted', variant: 'primary' },
  released: { label: 'Escrow Released', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  disputed: { label: 'Disputed', variant: 'danger' },
};

export function renderStatusBadge(status) {
  const info = STATUS_MAP[status] || { label: status, variant: 'warning' };
  return `<span class="badge badge-${info.variant}">${info.label}</span>`;
}
