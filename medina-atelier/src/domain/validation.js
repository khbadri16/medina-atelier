// Checkout form validation, shared by the form (instant feedback) and the
// "server" (which re-validates everything before creating an order).

import { findWilaya } from '../data/wilayas.js';

/** Normalise Algerian mobile numbers: "+213 5 55 12 34 56" -> "0555123456". */
export function normalizePhone(raw) {
  let digits = String(raw || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+213')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('00213')) digits = `0${digits.slice(5)}`;
  else if (digits.startsWith('213') && digits.length === 12) digits = `0${digits.slice(3)}`;
  return digits.replace(/\+/g, '');
}

const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]{1,58}[\p{L}.]$/u;
const MOBILE_RE = /^0[567]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * @returns {{ ok: boolean, errors: Record<string,string>, value: object }}
 */
export function validateCheckout(form) {
  const errors = {};
  const value = {
    fullName: String(form.fullName || '').trim().replace(/\s+/g, ' '),
    phone: normalizePhone(form.phone),
    email: String(form.email || '').trim().toLowerCase(),
    wilaya: Number(form.wilaya) || 0,
    commune: String(form.commune || '').trim(),
    address: String(form.address || '').trim(),
    method: form.method,
    notes: String(form.notes || '').trim().slice(0, 300),
  };

  if (!value.fullName) errors.fullName = 'Please enter your full name.';
  else if (!NAME_RE.test(value.fullName)) errors.fullName = 'Use 3–60 letters (spaces, hyphens and apostrophes are fine).';

  if (!value.phone) errors.phone = 'A phone number is needed so the courier can reach you.';
  else if (!MOBILE_RE.test(value.phone)) errors.phone = 'Enter an Algerian mobile number, e.g. 0555 12 34 56.';

  if (value.email && !EMAIL_RE.test(value.email)) errors.email = 'This email address does not look right.';

  if (!findWilaya(value.wilaya)) errors.wilaya = 'Choose your wilaya.';

  if (value.commune.length < 2) errors.commune = 'Enter your commune.';

  if (value.method !== 'home' && value.method !== 'desk') errors.method = 'Choose a delivery method.';
  else if (value.method === 'home' && value.address.length < 6) errors.address = 'Enter a street address for home delivery.';

  return { ok: Object.keys(errors).length === 0, errors, value };
}
