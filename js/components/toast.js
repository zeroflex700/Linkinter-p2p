/* ==========================================================================
   TOAST.JS
   Small floating notifications (e.g. "Buyer submitted payment proof").
   Call showToast() from anywhere — it handles creating, animating, and
   removing the element itself. Requires a <div id="toast-container">
   to exist in index.html; it renders into that.
   ========================================================================== */

/**
 * @param {string} message - text to display
 * @param {'info'|'success'|'danger'} type - controls the accent color
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return; // fail quietly rather than throwing in production

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger the enter animation on the next frame (can't animate from
  // display:none/opacity:0 to visible in the same paint tick).
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  // Auto-dismiss after a few seconds, with a fade-out before removal.
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}
