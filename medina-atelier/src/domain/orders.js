// Order lifecycle as a small state machine.

export const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'];

export const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

/** Cancelling puts the items back in stock; nothing else touches stock. */
export function restocksOn(to) {
  return to === 'cancelled';
}
