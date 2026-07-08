/* ==========================================================================
   STORAGE.JS
   Thin wrapper around localStorage. Why not just call localStorage
   directly everywhere? Two reasons:
   1. Every value gets JSON-parsed/stringified automatically here, so the
      rest of the app just works with plain objects.
   2. If this project ever grows a real backend, only THIS file needs to
      change to call an API instead — no other file touches localStorage
      directly, so the swap is contained to one place.
   ========================================================================== */

// Prefix every key so we never collide with anything else stored in the
// browser, and so it's obvious in devtools which keys belong to this app.
const PREFIX = 'tradevault:';

/**
 * Reads a value by key. Returns `fallback` if the key doesn't exist yet
 * or if the stored value is corrupted somehow.
 */
export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Storage read failed for "${key}":`, err);
    return fallback;
  }
}

/**
 * Writes a value by key. Returns true/false so calling code can react
 * if storage is full or unavailable (e.g. private browsing mode).
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Storage write failed for "${key}":`, err);
    return false;
  }
}

/** Removes a single key. Used later for things like "sign out" or "reset demo data". */
export function removeItem(key) {
  localStorage.removeItem(PREFIX + key);
}
