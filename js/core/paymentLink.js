/* ==========================================================================
   PAYMENTLINK.JS
   Builds the shareable "payment destination" link used by js/pages/verify.js.
   Pulled into its own file because two different places need to build the
   exact same kind of link: the Trade Window's "Copy payment link" button
   (built from real trade data) and the manual Create Payment Link form
   (built from whatever the guest types in). Both should stay in sync if
   the link format ever changes, so there's only one function for it.
   ========================================================================== */

/**
 * @param {Object} fields - any of: id, seller, buyer, amount, currency,
 *   method, asset, qty. Empty/undefined fields are simply left out of the
 *   link rather than appearing as "undefined" in the URL.
 */
export function buildPaymentLink(fields) {
  const cleaned = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

  const params = new URLSearchParams(cleaned);
  const base = window.location.href.split('#')[0];
  return `${base}#/verify?${params.toString()}`;
}
