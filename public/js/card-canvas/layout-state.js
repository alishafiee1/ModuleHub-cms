/**
 * وضعیت تعامل کاربر با گرید
 * Guards layout refresh while pointer drag/resize is active.
 */
let interacting = false;

/** @param {boolean} value */
export function setInteracting(value) {
  interacting = value;
}

export function isInteracting() {
  return interacting;
}
