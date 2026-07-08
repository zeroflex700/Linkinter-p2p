/* ==========================================================================
   MODAL.JS
   A generic modal dialog. Any page/component can call showModal() to pop
   one open — it doesn't know or care what's inside; the caller supplies
   the HTML and wires up its own listeners via onMount.

   WHY GENERIC LIKE THIS?
   Passphrase verification is the first thing that needs a modal, but
   payment proof upload, cancel confirmations, and dispute forms will all
   need one too later. Building one reusable modal now means those don't
   need their own bespoke overlay/close logic.
   ========================================================================== */

let activeModalRoot = null;

/**
 * Opens a modal.
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.bodyHtml - inner HTML for the modal body
 * @param {(root: HTMLElement) => void} [options.onMount] - runs after the
 *   modal is in the DOM; use this to attach form/button listeners and to
 *   call closeModal() when the caller's own flow finishes.
 * @param {string} [options.theme] - optional theme name (e.g. 'light').
 *   Adds a `modal-theme-{name}` class to the overlay so modal.css can
 *   override the usual dark-theme variables for that popup only. The
 *   modal is appended to <body>, not nested inside the calling page, so
 *   this is the only way a page can theme its own popup without
 *   affecting every other modal in the app.
 */
export function showModal({ title, bodyHtml, onMount, theme }) {
  closeModal(); // only one modal at a time

  const overlay = document.createElement('div');
  overlay.className = theme ? `modal-overlay modal-theme-${theme}` : 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
    </div>
  `;

  document.body.appendChild(overlay);
  activeModalRoot = overlay;

  // Closing via the × button or by tapping the dimmed backdrop.
  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  requestAnimationFrame(() => overlay.classList.add('modal-visible'));

  if (typeof onMount === 'function') {
    onMount(overlay);
  }
}

/** Closes and removes the currently open modal, if any. */
export function closeModal() {
  if (!activeModalRoot) return;
  activeModalRoot.remove();
  activeModalRoot = null;
}