/* ==========================================================================
   STATE.JS
   Single source of truth for data that multiple pages need (guest
   identity, wallet balance, later: active trades, notifications...).

   WHY A PUB/SUB PATTERN?
   Plain objects don't tell anyone when they change. The subscribe/notify
   pair here lets a page module say "re-render me whenever state changes"
   without the state module needing to know which pages exist. This is a
   tiny hand-rolled version of what Redux/Zustand do — kept dependency-free
   on purpose since this project has no build step.

   GUEST IDENTITY:
   Since there is no login system, every visitor gets a random local
   identity the first time they open the app (e.g. "Guest-7F3A") and it's
   saved to localStorage so it survives page reloads. This id is what
   trade history, chat messages, and wallet balance attach to later.
   It is NOT a real account — clearing browser data resets it. If a real
   login system is added later, this is the seam where it plugs in.
   ========================================================================== */

import { getItem, setItem } from './storage.js';
import { createSeedTrades } from '../data/mockTrades.js';

// The in-memory copy of state. Never mutate this object directly from
// outside this file — always go through setState().
let state = {
  guest: null,   // { id, name, createdAt }
  wallet: null,  // { btc, usdt }
  trades: [],    // array of trade objects, newest first
};

const listeners = new Set();

function notify() {
  listeners.forEach((callback) => callback(state));
}

/**
 * Lets a page/component react whenever state changes.
 * Returns an "unsubscribe" function — call it when the page unmounts
 * to avoid memory leaks from stale listeners.
 */
export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Read-only snapshot of the current state. */
export function getState() {
  return state;
}

/** Merges a partial update into state and notifies subscribers. */
export function setState(patch) {
  state = { ...state, ...patch };
  notify();
}

/** Generates a short readable suffix like "7F3A" for the guest name. */
function generateGuestSuffix() {
  const chars = '0123456789ABCDEF';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return suffix;
}

/** Generates a unique-enough id for a guest session. */
function generateGuestId() {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Runs once on app boot. Loads the existing guest session + wallet from
 * localStorage, or creates fresh ones on a visitor's very first visit.
 * This is what makes "no login required" actually work — identity exists
 * the instant the app loads, with zero user action.
 */
export function initGuestSession() {
  let guest = getItem('guest');
  if (!guest) {
    guest = {
      id: generateGuestId(),
      name: `Guest-${generateGuestSuffix()}`,
      createdAt: new Date().toISOString(),
    };
    setItem('guest', guest);
  }

  // Starter demo balance — purely illustrative, no real funds involved.
  let wallet = getItem('wallet');
  if (!wallet) {
    wallet = { btc: 0.05, usdt: 250 };
    setItem('wallet', wallet);
  }

  // Seed a couple of example trades on first visit so History/Detail
  // pages have something to show before the guest creates their own.
  let trades = getItem('trades');
  if (!trades) {
    trades = createSeedTrades();
    setItem('trades', trades);
  }

  setState({ guest, wallet, trades });
}

/**
 * Adds a brand new trade to the front of the list and persists it.
 */
export function addTrade(trade) {
  const trades = [trade, ...state.trades];
  setItem('trades', trades);
  setState({ trades });
}

/**
 * Finds a single trade by id. Returns undefined if it doesn't exist.
 */
export function getTradeById(id) {
  return state.trades.find((t) => t.id === id);
}

/**
 * Merges a partial update into one trade (by id), appends a timeline
 * entry if `timelineLabel` is given, and persists the change.
 * This is the single place trade status transitions happen, so every
 * page and the bot both go through the same function.
 */
export function updateTrade(id, patch, timelineLabel) {
  const trades = state.trades.map((trade) => {
    if (trade.id !== id) return trade;

    const updated = { ...trade, ...patch, updatedAt: new Date().toISOString() };

    if (timelineLabel) {
      updated.timeline = [
        ...trade.timeline,
        { status: patch.status || trade.status, label: timelineLabel, at: updated.updatedAt },
      ];
    }

    return updated;
  });

  setItem('trades', trades);
  setState({ trades });

  return trades.find((t) => t.id === id);
}

/** Updates wallet balances and persists the change. Used by later trade phases. */
export function updateWallet(patch) {
  const wallet = { ...state.wallet, ...patch };
  setItem('wallet', wallet);
  setState({ wallet });
}

/* ----------------------------------------------------------------------
   MOCK PASSPHRASE
   A stand-in for real wallet security (e.g. signing a transaction).
   Stored in plain text in localStorage — this is explicitly a UX mockup,
   NOT real cryptography, and should never be treated as securing real
   funds. It exists so the sell flow demonstrates an ownership-verification
   step, matching how a real exchange would confirm a withdrawal.
   ---------------------------------------------------------------------- */

/** Whether the guest has created a passphrase yet. */
export function hasPassphraseSet() {
  return !!getItem('passphrase');
}

/** Saves a new passphrase (used the first time a guest tries to sell). */
export function setPassphrase(value) {
  setItem('passphrase', value);
}

/** Checks an entered passphrase against the stored one. */
export function verifyPassphrase(value) {
  return getItem('passphrase') === value;
}
