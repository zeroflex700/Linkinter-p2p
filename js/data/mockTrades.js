/* ==========================================================================
   MOCKTRADES.JS
   Everything related to what a "trade" object looks like, plus functions
   that manufacture them. There is no backend, so this file stands in for
   what would normally be an API response.

   TRADE SHAPE:
   {
     id            - e.g. "TRD-4821"
     asset         - "BTC" (only BTC supported for now, easy to extend)
     amount        - crypto amount, e.g. 0.01
     fiatAmount    - equivalent fiat value shown to the user
     fiatCurrency  - "USD"
     counterparty  - display name of the bot-played buyer, e.g. "Buyer-92C1"
     role          - always "seller" for the guest right now (see tradeBot.js)
     status        - one of: requested, accepted, rejected, awaiting_payment,
                     payment_submitted, released, completed, cancelled, disputed
     paymentMethod - e.g. "Bank Transfer"
     paymentProof  - null, or { note, submittedAt } once the buyer "pays"
     deadline      - ISO timestamp; awaiting_payment auto-cancels past this
     timeline      - array of { status, label, at } — powers the trade history log
     createdAt / updatedAt
   }
   ========================================================================== */

const PAYMENT_METHODS = ['Bank Transfer', 'Mobile Money', 'PayPal'];

function generateTradeId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TRD-${num}`;
}

function generateBuyerName() {
  const chars = '0123456789ABCDEF';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `Buyer-${suffix}`;
}

function pickPaymentMethod() {
  return PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
}

/**
 * Creates a trade from a marketplace offer the guest chose to fulfill.
 * Uses the offer's minAmount as the trade size for now — a future
 * iteration could let the guest type in a custom amount within the
 * offer's min/max range.
 */
export function createTradeFromOffer(offer, paymentMethod) {
  const amount = offer.minAmount;
  const fiatAmount = Math.round(amount * offer.rate);
  const now = new Date().toISOString();

  return {
    id: generateTradeId(),
    asset: offer.asset,
    amount,
    fiatAmount,
    fiatCurrency: 'USD',
    counterparty: offer.trader,
    role: 'seller',
    status: 'requested',
    paymentMethod,
    paymentProof: null,
    deadline: null,
    timeline: [{ status: 'requested', label: `Trade opened from ${offer.trader}'s offer`, at: now }],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a brand new incoming trade request — this is the bot, playing
 * the buyer, asking the guest (seller) to sell them some crypto. In a
 * later Marketplace phase, this same shape would come from a real buyer
 * clicking "Buy" on a listing instead of being manufactured here.
 */
export function createIncomingTradeRequest() {
  const amount = Number((Math.random() * 0.02 + 0.005).toFixed(4)); // 0.005–0.025 BTC
  const rate = 65000; // mock BTC/USD rate, purely illustrative
  const fiatAmount = Math.round(amount * rate);
  const now = new Date().toISOString();

  return {
    id: generateTradeId(),
    asset: 'BTC',
    amount,
    fiatAmount,
    fiatCurrency: 'USD',
    counterparty: generateBuyerName(),
    role: 'seller',
    status: 'requested',
    paymentMethod: pickPaymentMethod(),
    paymentProof: null,
    deadline: null, // set once accepted, see tradeDetail.js
    timeline: [{ status: 'requested', label: 'Trade requested by buyer', at: now }],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * A couple of pre-filled trades so History/Detail pages have real content
 * to show the very first time someone opens the app, before they've
 * created any trades themselves.
 */
export function createSeedTrades() {
  const completedAt = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
  const cancelledAt = new Date(Date.now() - 3 * 86400000).toISOString(); // 3 days ago

  return [
    {
      id: 'TRD-1042',
      asset: 'BTC',
      amount: 0.012,
      fiatAmount: 780,
      fiatCurrency: 'USD',
      counterparty: 'Buyer-3F1A',
      role: 'seller',
      status: 'completed',
      paymentMethod: 'Bank Transfer',
      paymentProof: { note: 'Bank transfer receipt uploaded', submittedAt: completedAt },
      deadline: null,
      timeline: [
        { status: 'requested', label: 'Trade requested by buyer', at: completedAt },
        { status: 'accepted', label: 'Seller accepted trade', at: completedAt },
        { status: 'payment_submitted', label: 'Buyer submitted payment proof', at: completedAt },
        { status: 'released', label: 'Seller released escrow', at: completedAt },
        { status: 'completed', label: 'Trade completed', at: completedAt },
      ],
      createdAt: completedAt,
      updatedAt: completedAt,
    },
    {
      id: 'TRD-0917',
      asset: 'BTC',
      amount: 0.008,
      fiatAmount: 520,
      fiatCurrency: 'USD',
      counterparty: 'Buyer-88D2',
      role: 'seller',
      status: 'cancelled',
      paymentMethod: 'PayPal',
      paymentProof: null,
      deadline: null,
      timeline: [
        { status: 'requested', label: 'Trade requested by buyer', at: cancelledAt },
        { status: 'accepted', label: 'Seller accepted trade', at: cancelledAt },
        { status: 'cancelled', label: 'Seller cancelled — payment window expired', at: cancelledAt },
      ],
      createdAt: cancelledAt,
      updatedAt: cancelledAt,
    },
  ];
}
