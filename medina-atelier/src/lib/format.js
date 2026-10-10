// Formatting helpers. Prices are whole Algerian dinars (DA).

const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatDA(amount) {
  // fr-FR groups thousands with a narrow no-break space: 12 500 DA
  return `${number.format(Math.round(amount))} DA`;
}

const dateTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const dateOnly = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDateTime(iso) {
  return dateTime.format(new Date(iso));
}

export function formatDate(iso) {
  return dateOnly.format(new Date(iso));
}

/** "0661234567" -> "0661 23 45 67" */
export function formatPhone(phone) {
  const d = String(phone);
  return /^0\d{9}$/.test(d) ? `${d.slice(0, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)} ${d.slice(8)}` : d;
}

export function pluralize(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
